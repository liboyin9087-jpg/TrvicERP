#!/usr/bin/env python3
"""
TrvicERP 多專家代碼分析器 v2.0
=============================
採用 Claude Code 風格的 Agent 架構
- 子代理（Subagent）模式
- 智能 API 排程器（Rate Limiter）
- Session 持久化與恢復
- 五位專家自動依序執行

使用 SiliconFlow Qwen 2.5 72B

作者：綠
版本：2.0.0
"""

import os
import sys
import json
import time
import hashlib
import pickle
import logging
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Callable, Generator
from dataclasses import dataclass, field, asdict
from enum import Enum
from abc import ABC, abstractmethod
import requests
from threading import Lock
from collections import deque
import traceback

# ==================== 日誌配置 ====================

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)-7s | %(message)s',
    datefmt='%H:%M:%S'
)
logger = logging.getLogger(__name__)


# ==================== 配置系統 ====================

@dataclass
class APIConfig:
    """API 配置"""
    base_url: str = "https://api.siliconflow.com/v1/chat/completions"
    api_key: str = ""
    model: str = "Qwen/Qwen2.5-72B-Instruct"
    
    # Rate Limiting 配置
    requests_per_minute: int = 10  # 每分鐘最大請求數
    min_delay_between_requests: float = 6.0  # 請求間最小延遲（秒）
    max_retries: int = 5  # 最大重試次數
    retry_base_delay: float = 10.0  # 重試基礎延遲
    
    # Token 配置
    max_tokens_per_request: int = 4096
    max_context_tokens: int = 6000


@dataclass  
class ScanConfig:
    """掃描配置"""
    max_file_size_mb: int = 10
    supported_extensions: tuple = (
        '.py', '.js', '.ts', '.tsx', '.jsx', '.vue', '.html', '.css', '.scss',
        '.json', '.yaml', '.yml', '.md', '.txt', '.sql', '.sh', '.env.example',
        '.gitignore', '.dockerignore', 'Dockerfile', '.toml', '.ini', '.cfg'
    )
    excluded_dirs: tuple = (
        'node_modules', '__pycache__', '.git', '.venv', 'venv', 'env',
        'dist', 'build', '.next', '.nuxt', 'coverage', '.pytest_cache'
    )
    excluded_files: tuple = (
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml'
    )


@dataclass
class SessionConfig:
    """Session 配置"""
    session_dir: str = ".trvic_sessions"
    output_dir: str = "analysis_reports"
    auto_save_interval: int = 60  # 自動保存間隔（秒）


@dataclass
class Config:
    """主配置"""
    api: APIConfig = field(default_factory=APIConfig)
    scan: ScanConfig = field(default_factory=ScanConfig)
    session: SessionConfig = field(default_factory=SessionConfig)
    
    def __post_init__(self):
        # 從環境變數讀取 API Key
        if not self.api.api_key:
            self.api.api_key = os.environ.get("SILICONFLOW_API_KEY", "")


# ==================== Rate Limiter ====================

class RateLimiter:
    """
    智能 API 呼叫頻率控制器
    - Token Bucket 算法
    - 自動等待與重試
    - 請求歷史追蹤
    """
    
    def __init__(self, config: APIConfig):
        self.config = config
        self._lock = Lock()
        self._request_times: deque = deque(maxlen=100)
        self._last_request_time: float = 0
        self._consecutive_failures = 0
    
    def wait_if_needed(self):
        """在發送請求前等待（如果需要）"""
        with self._lock:
            now = time.time()
            
            # 計算自上次請求的時間
            time_since_last = now - self._last_request_time
            
            # 確保最小延遲
            min_delay = self.config.min_delay_between_requests
            
            # 如果有連續失敗，增加延遲
            if self._consecutive_failures > 0:
                min_delay *= (1.5 ** self._consecutive_failures)
                min_delay = min(min_delay, 120)  # 最大 2 分鐘
            
            if time_since_last < min_delay:
                wait_time = min_delay - time_since_last
                logger.info(f"⏳ Rate Limiter: 等待 {wait_time:.1f} 秒...")
                time.sleep(wait_time)
            
            # 檢查每分鐘請求數
            one_minute_ago = now - 60
            recent_requests = [t for t in self._request_times if t > one_minute_ago]
            
            if len(recent_requests) >= self.config.requests_per_minute:
                # 需要等待到最舊的請求過期
                oldest = min(recent_requests)
                wait_time = oldest + 60 - now + 1
                if wait_time > 0:
                    logger.info(f"⏳ Rate Limiter: 達到每分鐘上限，等待 {wait_time:.1f} 秒...")
                    time.sleep(wait_time)
            
            # 記錄這次請求
            self._request_times.append(time.time())
            self._last_request_time = time.time()
    
    def record_success(self):
        """記錄成功請求"""
        with self._lock:
            self._consecutive_failures = 0
    
    def record_failure(self):
        """記錄失敗請求"""
        with self._lock:
            self._consecutive_failures += 1
    
    def get_retry_delay(self, attempt: int) -> float:
        """計算重試延遲（指數退避）"""
        delay = self.config.retry_base_delay * (2 ** attempt)
        return min(delay, 300)  # 最大 5 分鐘
    
    def get_stats(self) -> Dict:
        """獲取統計資訊"""
        with self._lock:
            now = time.time()
            one_minute_ago = now - 60
            recent = [t for t in self._request_times if t > one_minute_ago]
            return {
                "requests_last_minute": len(recent),
                "consecutive_failures": self._consecutive_failures,
                "total_requests": len(self._request_times)
            }


# ==================== API 客戶端 ====================

class SiliconFlowClient:
    """SiliconFlow API 客戶端（帶 Rate Limiting）"""
    
    def __init__(self, config: Config):
        self.config = config
        self.rate_limiter = RateLimiter(config.api)
        self.session = requests.Session()
        self._total_requests = 0
        self._total_tokens = 0
    
    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = None
    ) -> str:
        """發送聊天請求（帶自動重試）"""
        if max_tokens is None:
            max_tokens = self.config.api.max_tokens_per_request
        
        headers = {
            "Authorization": f"Bearer {self.config.api.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.config.api.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        last_error = None
        
        for attempt in range(self.config.api.max_retries):
            try:
                # 等待 Rate Limiter
                self.rate_limiter.wait_if_needed()
                
                self._total_requests += 1
                logger.info(f"📤 API 請求 #{self._total_requests} (嘗試 {attempt + 1}/{self.config.api.max_retries})")
                
                response = self.session.post(
                    self.config.api.base_url,
                    headers=headers,
                    json=payload,
                    timeout=180
                )
                
                # 檢查 Rate Limit 錯誤
                if response.status_code == 429:
                    self.rate_limiter.record_failure()
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"⚠️ API Rate Limit! 等待 {retry_after} 秒...")
                    time.sleep(retry_after)
                    continue
                
                response.raise_for_status()
                
                result = response.json()
                content = result['choices'][0]['message']['content']
                
                # 記錄成功
                self.rate_limiter.record_success()
                
                # 統計 tokens
                if 'usage' in result:
                    self._total_tokens += result['usage'].get('total_tokens', 0)
                
                logger.info(f"📥 回應收到 ({len(content)} 字元)")
                return content
                
            except requests.exceptions.RequestException as e:
                last_error = e
                self.rate_limiter.record_failure()
                
                if attempt < self.config.api.max_retries - 1:
                    delay = self.rate_limiter.get_retry_delay(attempt)
                    logger.warning(f"⚠️ 請求失敗: {e}")
                    logger.info(f"⏳ 將在 {delay:.1f} 秒後重試...")
                    time.sleep(delay)
        
        raise Exception(f"API 請求失敗（已重試 {self.config.api.max_retries} 次）: {last_error}")
    
    def get_stats(self) -> Dict:
        """獲取客戶端統計"""
        return {
            "total_requests": self._total_requests,
            "total_tokens": self._total_tokens,
            "rate_limiter": self.rate_limiter.get_stats()
        }


# ==================== 檔案系統 ====================

@dataclass
class FileInfo:
    """檔案資訊"""
    path: str
    relative_path: str
    extension: str
    size_bytes: int
    content: str = ""
    line_count: int = 0


@dataclass
class ProjectStructure:
    """專案結構"""
    root_path: str
    files: List[FileInfo] = field(default_factory=list)
    total_files: int = 0
    total_lines: int = 0
    total_size_bytes: int = 0
    file_type_stats: Dict[str, int] = field(default_factory=dict)
    directory_tree: str = ""
    
    def to_dict(self) -> Dict:
        return {
            "root_path": self.root_path,
            "total_files": self.total_files,
            "total_lines": self.total_lines,
            "total_size_bytes": self.total_size_bytes,
            "file_type_stats": self.file_type_stats,
            "directory_tree": self.directory_tree
        }


class FileScanner:
    """檔案掃描器"""
    
    def __init__(self, config: Config):
        self.config = config
    
    def scan(self, root_path: Path) -> ProjectStructure:
        """掃描專案目錄"""
        project = ProjectStructure(root_path=str(root_path))
        
        logger.info(f"📁 掃描目錄: {root_path}")
        
        for file_path in self._walk(root_path):
            file_info = self._process_file(file_path, root_path)
            if file_info:
                project.files.append(file_info)
                project.total_files += 1
                project.total_lines += file_info.line_count
                project.total_size_bytes += file_info.size_bytes
                
                ext = file_info.extension or "no_ext"
                project.file_type_stats[ext] = project.file_type_stats.get(ext, 0) + 1
        
        project.directory_tree = self._generate_tree(root_path)
        
        logger.info(f"✅ 掃描完成: {project.total_files} 檔案, {project.total_lines:,} 行")
        
        return project
    
    def _walk(self, root: Path) -> Generator[Path, None, None]:
        """遍歷目錄"""
        for item in root.rglob('*'):
            skip = False
            for part in item.parts:
                if part in self.config.scan.excluded_dirs:
                    skip = True
                    break
            if not skip and item.is_file():
                yield item
    
    def _process_file(self, path: Path, root: Path) -> Optional[FileInfo]:
        """處理單個檔案"""
        suffix = path.suffix.lower()
        name = path.name
        
        # 檢查是否支援
        supported = (
            suffix in self.config.scan.supported_extensions or
            name in self.config.scan.supported_extensions
        )
        if not supported:
            return None
        
        # 檢查排除
        for pattern in self.config.scan.excluded_files:
            if name == pattern or (pattern.startswith('*') and name.endswith(pattern[1:])):
                return None
        
        # 檢查大小
        size = path.stat().st_size
        if size > self.config.scan.max_file_size_mb * 1024 * 1024:
            return None
        
        # 讀取內容
        try:
            content = path.read_text(encoding='utf-8', errors='ignore')
            return FileInfo(
                path=str(path),
                relative_path=str(path.relative_to(root)),
                extension=suffix,
                size_bytes=size,
                content=content,
                line_count=len(content.splitlines())
            )
        except Exception:
            return None
    
    def _generate_tree(self, root: Path, max_depth: int = 3) -> str:
        """生成目錄樹"""
        lines = [f"📂 {root.name}/"]
        
        def add_items(path: Path, prefix: str, depth: int):
            if depth > max_depth:
                return
            
            try:
                items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
                items = [i for i in items if i.name not in self.config.scan.excluded_dirs and not i.name.startswith('.')][:15]
                
                for i, item in enumerate(items):
                    is_last = i == len(items) - 1
                    connector = "└── " if is_last else "├── "
                    
                    if item.is_dir():
                        lines.append(f"{prefix}{connector}📁 {item.name}/")
                        add_items(item, prefix + ("    " if is_last else "│   "), depth + 1)
                    else:
                        lines.append(f"{prefix}{connector}📄 {item.name}")
            except PermissionError:
                pass
        
        add_items(root, "", 1)
        return "\n".join(lines)


# ==================== Agent 系統 ====================

class AgentStatus(Enum):
    """Agent 狀態"""
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


@dataclass
class AgentResult:
    """Agent 執行結果"""
    agent_id: str
    status: AgentStatus
    analysis: str = ""
    error: str = ""
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    chunks_processed: int = 0
    api_calls: int = 0
    
    @property
    def duration_seconds(self) -> float:
        if self.started_at and self.completed_at:
            return (self.completed_at - self.started_at).total_seconds()
        return 0
    
    def to_dict(self) -> Dict:
        return {
            "agent_id": self.agent_id,
            "status": self.status.value,
            "analysis": self.analysis,
            "error": self.error,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "chunks_processed": self.chunks_processed,
            "api_calls": self.api_calls,
            "duration_seconds": self.duration_seconds
        }


class BaseAgent(ABC):
    """
    基礎 Agent 類別
    所有專家 Agent 繼承此類
    """
    
    def __init__(
        self,
        agent_id: str,
        name: str,
        title: str,
        focus_areas: List[str],
        system_prompt: str,
        client: SiliconFlowClient,
        config: Config
    ):
        self.agent_id = agent_id
        self.name = name
        self.title = title
        self.focus_areas = focus_areas
        self.system_prompt = system_prompt
        self.client = client
        self.config = config
        self.result = AgentResult(agent_id=agent_id, status=AgentStatus.PENDING)
    
    def run(self, chunks: List[Dict]) -> AgentResult:
        """執行分析"""
        self.result.status = AgentStatus.RUNNING
        self.result.started_at = datetime.now()
        
        logger.info(f"\n{'='*60}")
        logger.info(f"🤖 Agent: {self.name} ({self.title})")
        logger.info(f"   專注領域: {', '.join(self.focus_areas)}")
        logger.info(f"{'='*60}")
        
        try:
            analyses = []
            
            for i, chunk in enumerate(chunks):
                logger.info(f"   📊 處理區塊 {i + 1}/{len(chunks)}")
                
                analysis = self._analyze_chunk(chunk, i, len(chunks))
                analyses.append(analysis)
                self.result.chunks_processed += 1
                self.result.api_calls += 1
            
            # 整合結果
            if len(analyses) > 1:
                logger.info(f"   🔗 整合分析結果...")
                self.result.analysis = self._combine_analyses(analyses)
                self.result.api_calls += 1
            else:
                self.result.analysis = analyses[0] if analyses else ""
            
            self.result.status = AgentStatus.COMPLETED
            
        except Exception as e:
            self.result.status = AgentStatus.FAILED
            self.result.error = str(e)
            logger.error(f"❌ Agent 執行失敗: {e}")
        
        self.result.completed_at = datetime.now()
        logger.info(f"✅ Agent 完成，耗時 {self.result.duration_seconds:.1f} 秒")
        
        return self.result
    
    def _analyze_chunk(self, chunk: Dict, index: int, total: int) -> str:
        """分析單個 chunk"""
        messages = [
            {"role": "system", "content": self.system_prompt},
            {"role": "user", "content": f"""
請分析以下程式碼專案內容（區塊 {index + 1}/{total}）：

{chunk['content']}

請提供你的專業分析，包含：
1. 關鍵發現
2. 問題識別  
3. 改進建議
4. 優先級評估

請使用繁體中文回覆。
"""}
        ]
        
        return self.client.chat(messages, temperature=0.5)
    
    def _combine_analyses(self, analyses: List[str]) -> str:
        """整合多個分析"""
        combined = "\n\n---\n\n".join([
            f"### 區塊 {i + 1}\n{a}" for i, a in enumerate(analyses)
        ])
        
        messages = [
            {"role": "system", "content": f"""你是 {self.name}（{self.title}）。
請整合以下分析結果，產出一份完整報告。避免重複，專注重要發現。"""},
            {"role": "user", "content": f"""
請整合以下分析：

{combined}

產出結構化報告：
1. 執行摘要（3-5 關鍵發現）
2. 詳細分析
3. 問題清單（按優先級）
4. 改進建議
5. 實作路線圖

使用繁體中文。
"""}
        ]
        
        return self.client.chat(messages, temperature=0.3)


# ==================== 專家 Agents ====================

class SoftwareEngineerAgent(BaseAgent):
    """軟體工程師 Agent"""
    
    def __init__(self, client: SiliconFlowClient, config: Config):
        super().__init__(
            agent_id="software_engineer",
            name="陳建宏",
            title="資深軟體工程師",
            focus_areas=["程式碼品質", "架構設計", "效能優化", "安全性", "可維護性"],
            system_prompt="""你是一位擁有15年經驗的資深軟體工程師，專精於：
- 程式碼品質審查與最佳實踐
- 系統架構設計與設計模式
- 效能優化與瓶頸分析
- 安全漏洞識別
- 可維護性與可擴展性評估
- 測試策略與覆蓋率

請以專業軟體工程師的角度分析程式碼，提供：
1. 程式碼品質評分（1-10）
2. 架構優缺點
3. 潛在 Bug 或安全問題
4. 效能優化建議
5. 重構建議與優先級
6. 具體改進程式碼範例""",
            client=client,
            config=config
        )


class AISolutionAgent(BaseAgent):
    """AI 解決方案架構師 Agent"""
    
    def __init__(self, client: SiliconFlowClient, config: Config):
        super().__init__(
            agent_id="ai_solution",
            name="林雅芳",
            title="AI 解決方案架構師",
            focus_areas=["AI整合", "智能自動化", "數據管道", "ML工作流", "API設計"],
            system_prompt="""你是一位 AI 解決方案架構師，專精於：
- AI/ML 系統整合
- 智能自動化流程設計
- 數據管道與 ETL 架構
- LLM 應用與 Prompt Engineering
- API 設計與微服務架構
- 成本效益分析

請從 AI 解決方案角度分析，提供：
1. AI 整合機會識別
2. 自動化流程優化建議
3. 數據流程改進方案
4. LLM/AI 功能擴展建議
5. 智能化升級路線圖
6. 預估 ROI 與實施優先級""",
            client=client,
            config=config
        )


class BDAgent(BaseAgent):
    """商業發展 Agent"""
    
    def __init__(self, client: SiliconFlowClient, config: Config):
        super().__init__(
            agent_id="business_development",
            name="王志明",
            title="商業發展總監",
            focus_areas=["商業模式", "市場定位", "合作夥伴", "營收策略", "競爭分析"],
            system_prompt="""你是一位商業發展總監，專精於：
- B2B/B2C 商業模式設計
- 市場定位與競爭策略
- 合作夥伴生態系統
- 營收模式與定價策略
- 客戶成功與留存
- Go-to-Market 策略

請從商業發展角度分析，提供：
1. 商業模式評估
2. 市場機會與威脅
3. 潛在合作夥伴建議
4. 營收模式優化
5. 客戶價值主張強化
6. 商業化路線圖""",
            client=client,
            config=config
        )


class BrandStrategyAgent(BaseAgent):
    """品牌策略 Agent"""
    
    def __init__(self, client: SiliconFlowClient, config: Config):
        super().__init__(
            agent_id="brand_strategy",
            name="張曉琪",
            title="品牌策略顧問",
            focus_areas=["品牌定位", "用戶洞察", "內容策略", "品牌體驗", "差異化"],
            system_prompt="""你是一位品牌策略顧問，專精於：
- 品牌定位與差異化
- 目標用戶洞察與 Persona
- 內容策略與故事敘述
- 品牌體驗設計
- 市場溝通與訊息架構
- 品牌資產管理

請從品牌策略角度分析，提供：
1. 品牌定位評估
2. 目標用戶畫像
3. 品牌差異化機會
4. 內容策略框架
5. 品牌體驗優化
6. 品牌發展路線圖""",
            client=client,
            config=config
        )


class UIUXAgent(BaseAgent):
    """UI/UX Agent"""
    
    def __init__(self, client: SiliconFlowClient, config: Config):
        super().__init__(
            agent_id="ui_ux",
            name="李佳穎",
            title="UI/UX 設計主管",
            focus_areas=["用戶體驗", "介面設計", "互動設計", "可用性", "設計系統"],
            system_prompt="""你是一位 UI/UX 設計主管，專精於：
- 用戶體驗研究與設計
- 介面設計與視覺系統
- 互動設計與原型製作
- 可用性測試與優化
- 設計系統建構
- 無障礙設計（A11y）

請從 UI/UX 角度分析，提供：
1. 用戶體驗評估
2. 介面設計問題
3. 互動流程優化
4. 可用性改進
5. 設計系統建議
6. UX 優化優先級""",
            client=client,
            config=config
        )


# ==================== Agent 工廠 ====================

class AgentFactory:
    """Agent 工廠"""
    
    AGENT_CLASSES = {
        "software_engineer": SoftwareEngineerAgent,
        "ai_solution": AISolutionAgent,
        "business_development": BDAgent,
        "brand_strategy": BrandStrategyAgent,
        "ui_ux": UIUXAgent
    }
    
    # 執行順序
    DEFAULT_ORDER = [
        "software_engineer",
        "ai_solution",
        "business_development",
        "brand_strategy",
        "ui_ux"
    ]
    
    @classmethod
    def create_all(cls, client: SiliconFlowClient, config: Config) -> List[BaseAgent]:
        """創建所有 Agents（按預設順序）"""
        agents = []
        for agent_id in cls.DEFAULT_ORDER:
            agent_class = cls.AGENT_CLASSES[agent_id]
            agents.append(agent_class(client, config))
        return agents
    
    @classmethod
    def create_by_ids(
        cls,
        agent_ids: List[str],
        client: SiliconFlowClient,
        config: Config
    ) -> List[BaseAgent]:
        """創建指定的 Agents"""
        agents = []
        for agent_id in agent_ids:
            if agent_id in cls.AGENT_CLASSES:
                agent_class = cls.AGENT_CLASSES[agent_id]
                agents.append(agent_class(client, config))
        return agents


# ==================== Session 管理 ====================

@dataclass
class Session:
    """分析 Session"""
    session_id: str
    project_path: str
    created_at: datetime
    updated_at: datetime
    status: str = "running"  # running, completed, failed
    
    # 資料
    project_structure: Optional[Dict] = None
    chunks: List[Dict] = field(default_factory=list)
    
    # Agent 結果
    agent_results: Dict[str, Dict] = field(default_factory=dict)
    current_agent_index: int = 0
    agent_order: List[str] = field(default_factory=list)
    
    # 最終報告
    summary: str = ""
    recommendations: List[str] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "project_path": self.project_path,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "status": self.status,
            "project_structure": self.project_structure,
            "chunks": self.chunks,
            "agent_results": self.agent_results,
            "current_agent_index": self.current_agent_index,
            "agent_order": self.agent_order,
            "summary": self.summary,
            "recommendations": self.recommendations
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Session':
        return cls(
            session_id=data["session_id"],
            project_path=data["project_path"],
            created_at=datetime.fromisoformat(data["created_at"]),
            updated_at=datetime.fromisoformat(data["updated_at"]),
            status=data.get("status", "running"),
            project_structure=data.get("project_structure"),
            chunks=data.get("chunks", []),
            agent_results=data.get("agent_results", {}),
            current_agent_index=data.get("current_agent_index", 0),
            agent_order=data.get("agent_order", []),
            summary=data.get("summary", ""),
            recommendations=data.get("recommendations", [])
        )


class SessionManager:
    """Session 管理器"""
    
    def __init__(self, config: Config):
        self.config = config
        self.session_dir = Path(config.session.session_dir)
        self.session_dir.mkdir(parents=True, exist_ok=True)
    
    def create_session(self, project_path: str) -> Session:
        """創建新 Session"""
        session_id = f"{datetime.now().strftime('%Y%m%d_%H%M%S')}_{hashlib.md5(project_path.encode()).hexdigest()[:8]}"
        
        session = Session(
            session_id=session_id,
            project_path=project_path,
            created_at=datetime.now(),
            updated_at=datetime.now(),
            agent_order=AgentFactory.DEFAULT_ORDER.copy()
        )
        
        self.save_session(session)
        logger.info(f"📝 創建 Session: {session_id}")
        
        return session
    
    def save_session(self, session: Session):
        """保存 Session"""
        session.updated_at = datetime.now()
        filepath = self.session_dir / f"{session.session_id}.json"
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(session.to_dict(), f, ensure_ascii=False, indent=2)
        
        logger.debug(f"💾 Session 已保存: {filepath}")
    
    def load_session(self, session_id: str) -> Optional[Session]:
        """載入 Session"""
        filepath = self.session_dir / f"{session_id}.json"
        
        if not filepath.exists():
            return None
        
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        return Session.from_dict(data)
    
    def list_sessions(self) -> List[Dict]:
        """列出所有 Sessions"""
        sessions = []
        
        for filepath in self.session_dir.glob("*.json"):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                sessions.append({
                    "session_id": data["session_id"],
                    "project_path": data["project_path"],
                    "status": data.get("status", "unknown"),
                    "created_at": data["created_at"],
                    "current_agent_index": data.get("current_agent_index", 0),
                    "total_agents": len(data.get("agent_order", []))
                })
            except:
                pass
        
        return sorted(sessions, key=lambda x: x["created_at"], reverse=True)
    
    def find_resumable_session(self, project_path: str) -> Optional[Session]:
        """尋找可恢復的 Session"""
        for filepath in self.session_dir.glob("*.json"):
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                if (data["project_path"] == project_path and 
                    data.get("status") == "running"):
                    return Session.from_dict(data)
            except:
                pass
        
        return None


# ==================== Orchestrator ====================

class Orchestrator:
    """
    主協調器
    - 管理 Agent 執行順序
    - 處理 Session 持久化
    - 生成最終報告
    """
    
    def __init__(self, config: Config):
        self.config = config
        self.client = SiliconFlowClient(config)
        self.scanner = FileScanner(config)
        self.session_manager = SessionManager(config)
    
    def run(
        self,
        project_path: str,
        agent_ids: List[str] = None,
        resume: bool = True
    ) -> Session:
        """執行完整分析流程"""
        path = Path(project_path).expanduser().resolve()
        
        if not path.exists():
            raise FileNotFoundError(f"路徑不存在: {path}")
        
        self._print_banner()
        
        # 檢查是否有可恢復的 Session
        session = None
        if resume:
            session = self.session_manager.find_resumable_session(str(path))
            if session:
                logger.info(f"🔄 發現可恢復的 Session: {session.session_id}")
                logger.info(f"   進度: {session.current_agent_index}/{len(session.agent_order)} Agents")
                
                response = input("是否繼續上次的分析？ (y/n): ").strip().lower()
                if response != 'y':
                    session = None
        
        # 創建新 Session
        if session is None:
            session = self.session_manager.create_session(str(path))
            
            if agent_ids:
                session.agent_order = agent_ids
            
            # 掃描專案
            project = self.scanner.scan(path)
            session.project_structure = project.to_dict()
            
            # 創建 chunks
            session.chunks = self._create_chunks(project)
            logger.info(f"📦 已分割為 {len(session.chunks)} 個分析區塊")
            
            self.session_manager.save_session(session)
        
        # 執行 Agents
        try:
            self._run_agents(session)
            
            # 生成總結
            if session.status != "failed":
                self._generate_summary(session)
                session.status = "completed"
            
        except KeyboardInterrupt:
            logger.warning("\n⚠️ 使用者中斷，Session 已保存")
            session.status = "running"  # 保持可恢復狀態
        except Exception as e:
            logger.error(f"❌ 執行失敗: {e}")
            traceback.print_exc()
            session.status = "failed"
        
        self.session_manager.save_session(session)
        
        # 輸出報告
        if session.status == "completed":
            self._save_report(session)
        
        self._print_stats(session)
        
        return session
    
    def _print_banner(self):
        """印出 Banner"""
        print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     🔬 TrvicERP 多專家代碼分析器 v2.0                             ║
║                                                                  ║
║     • Agent 架構 (類似 Claude Code)                               ║
║     • 智能 API 排程 (Rate Limiting)                               ║
║     • Session 持久化 (可中斷恢復)                                  ║
║     • 使用 SiliconFlow Qwen 2.5 72B                               ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")
    
    def _create_chunks(self, project: ProjectStructure) -> List[Dict]:
        """創建分析區塊"""
        chunks = []
        current_chunk = {"index": 0, "files": [], "content": "", "tokens": 0}
        
        # 專案概述
        overview = self._format_overview(project)
        current_chunk["content"] = overview
        current_chunk["tokens"] = self._estimate_tokens(overview)
        
        # 添加檔案
        for file_info in sorted(project.files, key=lambda f: f.size_bytes):
            file_content = self._format_file(file_info)
            file_tokens = self._estimate_tokens(file_content)
            
            # 大檔案拆分
            if file_tokens > self.config.api.max_context_tokens:
                if current_chunk["files"]:
                    chunks.append(current_chunk)
                    current_chunk = {"index": len(chunks), "files": [], "content": "", "tokens": 0}
                
                # 拆分
                for sub_chunk in self._split_large_file(file_info):
                    chunks.append(sub_chunk)
                continue
            
            # 檢查是否需要新 chunk
            if current_chunk["tokens"] + file_tokens > self.config.api.max_context_tokens:
                chunks.append(current_chunk)
                current_chunk = {"index": len(chunks), "files": [], "content": "", "tokens": 0}
            
            current_chunk["files"].append(file_info.relative_path)
            current_chunk["content"] += file_content
            current_chunk["tokens"] += file_tokens
        
        if current_chunk["files"] or current_chunk["content"]:
            chunks.append(current_chunk)
        
        return chunks
    
    def _format_overview(self, project: ProjectStructure) -> str:
        """格式化專案概述"""
        stats = "\n".join([
            f"  - {ext}: {count} 個"
            for ext, count in sorted(project.file_type_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        ])
        
        return f"""# 專案概述

## 基本資訊
- 路徑: {project.root_path}
- 檔案數: {project.total_files}
- 程式碼行數: {project.total_lines:,}
- 大小: {project.total_size_bytes / 1024:.1f} KB

## 檔案統計
{stats}

## 目錄結構
```
{project.directory_tree}
```

---

"""
    
    def _format_file(self, file_info: FileInfo) -> str:
        """格式化單個檔案"""
        ext = file_info.extension.lstrip('.') or 'text'
        return f"""
## 📄 {file_info.relative_path}
- 大小: {file_info.size_bytes} bytes | 行數: {file_info.line_count}

```{ext}
{file_info.content}
```

---

"""
    
    def _split_large_file(self, file_info: FileInfo) -> List[Dict]:
        """拆分大檔案"""
        chunks = []
        lines = file_info.content.splitlines()
        chunk_size = 150
        
        for i in range(0, len(lines), chunk_size):
            chunk_lines = lines[i:i + chunk_size]
            ext = file_info.extension.lstrip('.') or 'text'
            
            content = f"""
## 📄 {file_info.relative_path} (Part {i // chunk_size + 1})
- 行數: {i + 1}-{min(i + chunk_size, len(lines))}/{len(lines)}

```{ext}
{chr(10).join(chunk_lines)}
```

---

"""
            chunks.append({
                "index": len(chunks),
                "files": [f"{file_info.relative_path} (Part {i // chunk_size + 1})"],
                "content": content,
                "tokens": self._estimate_tokens(content)
            })
        
        return chunks
    
    def _estimate_tokens(self, text: str) -> int:
        """估算 tokens"""
        chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other = len(text) - chinese
        return int(chinese * 1.5 + other * 0.25)
    
    def _run_agents(self, session: Session):
        """執行所有 Agents"""
        start_index = session.current_agent_index
        
        for i in range(start_index, len(session.agent_order)):
            agent_id = session.agent_order[i]
            session.current_agent_index = i
            
            # 檢查是否已完成
            if agent_id in session.agent_results:
                result = session.agent_results[agent_id]
                if result.get("status") == "completed":
                    logger.info(f"⏭️ 跳過已完成的 Agent: {agent_id}")
                    continue
            
            # 創建並執行 Agent
            agents = AgentFactory.create_by_ids([agent_id], self.client, self.config)
            if agents:
                agent = agents[0]
                result = agent.run(session.chunks)
                session.agent_results[agent_id] = result.to_dict()
                
                # 保存進度
                self.session_manager.save_session(session)
                
                # 顯示進度
                progress = (i + 1) / len(session.agent_order) * 100
                logger.info(f"📊 整體進度: {progress:.0f}% ({i + 1}/{len(session.agent_order)} Agents)")
        
        session.current_agent_index = len(session.agent_order)
    
    def _generate_summary(self, session: Session):
        """生成總結報告"""
        logger.info("\n📝 生成總結報告...")
        
        # 收集所有分析
        summaries = []
        for agent_id, result in session.agent_results.items():
            if result.get("status") == "completed":
                analysis = result.get("analysis", "")[:2000]
                summaries.append(f"### {agent_id}\n{analysis}")
        
        combined = "\n\n".join(summaries)
        
        messages = [
            {"role": "system", "content": """你是專案總監，負責整合多位專家的分析。
產出高層次總結，讓專案負責人快速了解狀況。"""},
            {"role": "user", "content": f"""
專案資訊：
- 檔案數: {session.project_structure.get('total_files', 0)}
- 程式碼行數: {session.project_structure.get('total_lines', 0):,}

各專家分析：
{combined}

請產出：
1. 整體評估（200字內）
2. TOP 10 優先改進事項

使用繁體中文，JSON 格式：
{{"summary": "...", "recommendations": ["...", ...]}}
"""}
        ]
        
        try:
            response = self.client.chat(messages, temperature=0.3)
            
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                data = json.loads(json_match.group())
                session.summary = data.get("summary", response)
                session.recommendations = data.get("recommendations", [])
            else:
                session.summary = response
        except Exception as e:
            session.summary = f"總結生成失敗: {e}"
    
    def _save_report(self, session: Session):
        """保存報告"""
        output_dir = Path(self.config.session.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = f"report_{session.session_id}.md"
        filepath = output_dir / filename
        
        report = self._generate_markdown_report(session)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report)
        
        logger.info(f"\n📄 報告已保存: {filepath}")
    
    def _generate_markdown_report(self, session: Session) -> str:
        """生成 Markdown 報告"""
        lines = [
            f"# 🔬 TrvicERP 專案分析報告",
            f"",
            f"**Session ID**: {session.session_id}",
            f"**生成時間**: {session.updated_at.strftime('%Y-%m-%d %H:%M:%S')}",
            f"**專案路徑**: `{session.project_path}`",
            f"",
            f"---",
            f"",
            f"## 📊 專案概覽",
            f"",
            f"| 指標 | 數值 |",
            f"|------|------|",
            f"| 總檔案數 | {session.project_structure.get('total_files', 0)} |",
            f"| 總程式碼行數 | {session.project_structure.get('total_lines', 0):,} |",
            f"| 總大小 | {session.project_structure.get('total_size_bytes', 0) / 1024:.1f} KB |",
            f"",
            f"---",
            f"",
            f"## 📝 執行總結",
            f"",
            session.summary,
            f"",
            f"---",
            f"",
            f"## 🎯 優先改進事項",
            f""
        ]
        
        for i, rec in enumerate(session.recommendations, 1):
            lines.append(f"{i}. {rec}")
        
        lines.extend([
            f"",
            f"---",
            f"",
            f"## 👥 專家分析報告"
        ])
        
        for agent_id, result in session.agent_results.items():
            if result.get("status") == "completed":
                lines.extend([
                    f"",
                    f"### 🤖 {agent_id}",
                    f"",
                    f"**耗時**: {result.get('duration_seconds', 0):.1f} 秒",
                    f"**API 呼叫**: {result.get('api_calls', 0)} 次",
                    f"",
                    result.get("analysis", ""),
                    f"",
                    f"---"
                ])
        
        return "\n".join(lines)
    
    def _print_stats(self, session: Session):
        """印出統計"""
        stats = self.client.get_stats()
        
        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║  📊 執行統計                                                      ║
╠══════════════════════════════════════════════════════════════════╣
║  Session ID: {session.session_id:<43} ║
║  狀態: {session.status:<49} ║
║  API 請求總數: {stats['total_requests']:<41} ║
║  估算 Tokens: {stats['total_tokens']:,}                                          ║
╚══════════════════════════════════════════════════════════════════╝
""")


# ==================== CLI ====================

def main():
    """主程式入口"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='TrvicERP 多專家代碼分析器 v2.0',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  %(prog)s ~/Desktop/TrvicERP-main
  %(prog)s ~/Desktop/TrvicERP-main --api-key YOUR_KEY
  %(prog)s --list-sessions
  %(prog)s --resume SESSION_ID
        """
    )
    
    parser.add_argument('project_path', nargs='?', help='專案路徑')
    parser.add_argument('--api-key', '-k', help='SiliconFlow API Key')
    parser.add_argument('--agents', '-a', nargs='+',
                       choices=['software_engineer', 'ai_solution', 'business_development', 'brand_strategy', 'ui_ux'],
                       help='指定 Agents')
    parser.add_argument('--no-resume', action='store_true', help='不恢復上次 Session')
    parser.add_argument('--list-sessions', '-l', action='store_true', help='列出所有 Sessions')
    parser.add_argument('--resume', '-r', metavar='SESSION_ID', help='恢復指定 Session')
    
    # Rate Limiting 配置
    parser.add_argument('--rpm', type=int, default=10, help='每分鐘最大請求數 (預設: 10)')
    parser.add_argument('--delay', type=float, default=6.0, help='請求間最小延遲秒數 (預設: 6.0)')
    
    args = parser.parse_args()
    
    # 創建配置
    config = Config()
    
    if args.api_key:
        config.api.api_key = args.api_key
    
    # 套用 Rate Limiting 配置
    config.api.requests_per_minute = args.rpm
    config.api.min_delay_between_requests = args.delay
    
    # 檢查 API Key
    if not config.api.api_key and not args.list_sessions:
        print("⚠️ 未設定 API Key")
        print("請使用以下方式之一：")
        print("  1. 環境變數: export SILICONFLOW_API_KEY=your_key")
        print("  2. 參數: --api-key your_key")
        return
    
    # 創建協調器
    orchestrator = Orchestrator(config)
    
    # 列出 Sessions
    if args.list_sessions:
        sessions = orchestrator.session_manager.list_sessions()
        if not sessions:
            print("沒有找到任何 Session")
            return
        
        print("\n📋 所有 Sessions:\n")
        for s in sessions:
            status_icon = "✅" if s["status"] == "completed" else "🔄" if s["status"] == "running" else "❌"
            print(f"  {status_icon} {s['session_id']}")
            print(f"     路徑: {s['project_path']}")
            print(f"     進度: {s['current_agent_index']}/{s['total_agents']} Agents")
            print(f"     建立: {s['created_at']}")
            print()
        return
    
    # 恢復指定 Session
    if args.resume:
        session = orchestrator.session_manager.load_session(args.resume)
        if not session:
            print(f"❌ 找不到 Session: {args.resume}")
            return
        
        # 繼續執行
        project_path = session.project_path
    else:
        project_path = args.project_path or os.path.expanduser('~/Desktop/TrvicERP-main')
    
    # 執行分析
    orchestrator.run(
        project_path=project_path,
        agent_ids=args.agents,
        resume=not args.no_resume
    )


if __name__ == '__main__':
    main()
