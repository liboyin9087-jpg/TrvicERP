#!/usr/bin/env python3
"""
TrvicERP Claude Code 風格分析器 v3.0
=====================================
類似 Claude Code 的本地檔案分析工具
- 5 位專家依序分析（軟體工程、AI解決方案、BD、品牌策略、UI/UX）
- 分階段讀取與處理完整檔案內容
- 自動產出審查報告和實作建議
- 使用 SiliconFlow Qwen 2.5 72B

API: https://api.siliconflow.com
"""

import os
import sys
import json
import time
import hashlib
import logging
import re
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any, Optional, Generator, Tuple
from dataclasses import dataclass, field
from enum import Enum
from collections import deque
from threading import Lock
import requests

# ==================== 日誌配置 ====================

class ColoredFormatter(logging.Formatter):
    """彩色日誌格式"""
    COLORS = {
        'DEBUG': '\033[36m',    # Cyan
        'INFO': '\033[32m',     # Green
        'WARNING': '\033[33m',  # Yellow
        'ERROR': '\033[31m',    # Red
        'CRITICAL': '\033[35m', # Magenta
    }
    RESET = '\033[0m'

    def format(self, record):
        color = self.COLORS.get(record.levelname, self.RESET)
        record.levelname = f"{color}{record.levelname}{self.RESET}"
        return super().format(record)

handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter('%(asctime)s | %(levelname)-17s | %(message)s', datefmt='%H:%M:%S'))
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
logger.addHandler(handler)


# ==================== 配置 ====================

@dataclass
class Config:
    """配置類"""
    # API 配置
    api_base_url: str = "https://api.siliconflow.com/v1/chat/completions"
    api_key: str = ""
    model: str = "Qwen/Qwen2.5-72B-Instruct"

    # Rate Limiting
    requests_per_minute: int = 10
    min_delay_seconds: float = 6.0
    max_retries: int = 5
    retry_base_delay: float = 10.0

    # Token 配置
    max_tokens_per_request: int = 4096
    max_context_tokens: int = 8000  # 增加以讀取更多內容

    # 掃描配置
    max_file_size_mb: int = 10
    supported_extensions: tuple = (
        '.py', '.js', '.ts', '.tsx', '.jsx', '.vue', '.html', '.css', '.scss',
        '.json', '.yaml', '.yml', '.md', '.txt', '.sql', '.sh', '.env.example',
        '.gitignore', '.dockerignore', 'Dockerfile', '.toml', '.ini', '.cfg'
    )
    excluded_dirs: tuple = (
        'node_modules', '__pycache__', '.git', '.venv', 'venv', 'env',
        'dist', 'build', '.next', '.nuxt', 'coverage', '.pytest_cache',
        '.trvic_sessions', 'analysis_reports'
    )
    excluded_files: tuple = (
        'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml', 'bun.lockb'
    )

    # 輸出配置
    output_dir: str = "analysis_reports"

    def __post_init__(self):
        if not self.api_key:
            self.api_key = os.environ.get("SILICONFLOW_API_KEY", "")


# ==================== Rate Limiter ====================

class SmartRateLimiter:
    """智能 API 頻率控制器"""

    def __init__(self, config: Config):
        self.config = config
        self._lock = Lock()
        self._request_times: deque = deque(maxlen=100)
        self._last_request_time: float = 0
        self._consecutive_failures = 0

    def wait_if_needed(self):
        """等待直到可以發送請求"""
        with self._lock:
            now = time.time()
            time_since_last = now - self._last_request_time

            # 基礎延遲
            min_delay = self.config.min_delay_seconds

            # 失敗時增加延遲
            if self._consecutive_failures > 0:
                min_delay *= (1.5 ** self._consecutive_failures)
                min_delay = min(min_delay, 120)

            if time_since_last < min_delay:
                wait_time = min_delay - time_since_last
                logger.info(f"⏳ Rate Limiter: 等待 {wait_time:.1f} 秒...")
                time.sleep(wait_time)

            # 檢查每分鐘限制
            one_minute_ago = now - 60
            recent = [t for t in self._request_times if t > one_minute_ago]

            if len(recent) >= self.config.requests_per_minute:
                oldest = min(recent)
                wait_time = oldest + 60 - now + 1
                if wait_time > 0:
                    logger.info(f"⏳ 達到每分鐘上限，等待 {wait_time:.1f} 秒...")
                    time.sleep(wait_time)

            self._request_times.append(time.time())
            self._last_request_time = time.time()

    def record_success(self):
        with self._lock:
            self._consecutive_failures = 0

    def record_failure(self):
        with self._lock:
            self._consecutive_failures += 1

    def get_retry_delay(self, attempt: int) -> float:
        return min(self.config.retry_base_delay * (1.5 ** attempt), 60)


# ==================== API 客戶端 ====================

class SiliconFlowClient:
    """SiliconFlow API 客戶端"""

    def __init__(self, config: Config):
        self.config = config
        self.rate_limiter = SmartRateLimiter(config)
        self.session = requests.Session()
        self._total_requests = 0
        self._total_tokens = 0

    def chat(
        self,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = None
    ) -> str:
        """發送聊天請求"""
        if max_tokens is None:
            max_tokens = self.config.max_tokens_per_request

        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }

        payload = {
            "model": self.config.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }

        last_error = None

        for attempt in range(self.config.max_retries):
            try:
                self.rate_limiter.wait_if_needed()
                self._total_requests += 1

                logger.info(f"📤 API 請求 #{self._total_requests} (嘗試 {attempt + 1}/{self.config.max_retries})")

                response = self.session.post(
                    self.config.api_base_url,
                    headers=headers,
                    json=payload,
                    timeout=180
                )

                if response.status_code == 429:
                    self.rate_limiter.record_failure()
                    retry_after = int(response.headers.get('Retry-After', 60))
                    logger.warning(f"⚠️ Rate Limit! 等待 {retry_after} 秒...")
                    time.sleep(retry_after)
                    continue

                response.raise_for_status()
                result = response.json()
                content = result['choices'][0]['message']['content']

                self.rate_limiter.record_success()

                if 'usage' in result:
                    self._total_tokens += result['usage'].get('total_tokens', 0)

                logger.info(f"📥 回應收到 ({len(content)} 字元)")
                return content

            except requests.exceptions.RequestException as e:
                last_error = e
                self.rate_limiter.record_failure()

                if attempt < self.config.max_retries - 1:
                    delay = self.rate_limiter.get_retry_delay(attempt)
                    logger.warning(f"⚠️ 請求失敗: {e}")
                    logger.info(f"⏳ 將在 {delay:.1f} 秒後重試...")
                    time.sleep(delay)

        raise Exception(f"API 請求失敗（已重試 {self.config.max_retries} 次）: {last_error}")

    def get_stats(self) -> Dict:
        return {
            "total_requests": self._total_requests,
            "total_tokens": self._total_tokens
        }


# ==================== 檔案處理 ====================

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
class ProjectInfo:
    """專案資訊"""
    root_path: str
    files: List[FileInfo] = field(default_factory=list)
    total_files: int = 0
    total_lines: int = 0
    total_size_bytes: int = 0
    file_type_stats: Dict[str, int] = field(default_factory=dict)
    directory_tree: str = ""


class FileScanner:
    """檔案掃描器 - 確保讀取完整內容"""

    def __init__(self, config: Config):
        self.config = config

    def scan(self, root_path: Path) -> ProjectInfo:
        """掃描專案目錄"""
        project = ProjectInfo(root_path=str(root_path))

        logger.info(f"📁 掃描目錄: {root_path}")

        for file_path in self._walk(root_path):
            file_info = self._read_file_completely(file_path, root_path)
            if file_info:
                project.files.append(file_info)
                project.total_files += 1
                project.total_lines += file_info.line_count
                project.total_size_bytes += file_info.size_bytes

                ext = file_info.extension or "no_ext"
                project.file_type_stats[ext] = project.file_type_stats.get(ext, 0) + 1

        project.directory_tree = self._generate_tree(root_path)

        logger.info(f"✅ 掃描完成: {project.total_files} 檔案, {project.total_lines:,} 行程式碼")

        return project

    def _walk(self, root: Path) -> Generator[Path, None, None]:
        """遍歷目錄"""
        for item in root.rglob('*'):
            skip = False
            for part in item.parts:
                if part in self.config.excluded_dirs:
                    skip = True
                    break
            if not skip and item.is_file():
                yield item

    def _read_file_completely(self, path: Path, root: Path) -> Optional[FileInfo]:
        """完整讀取單個檔案"""
        suffix = path.suffix.lower()
        name = path.name

        # 檢查是否支援
        supported = (
            suffix in self.config.supported_extensions or
            name in self.config.supported_extensions
        )
        if not supported:
            return None

        # 排除特定檔案
        for pattern in self.config.excluded_files:
            if name == pattern:
                return None

        # 檢查大小
        size = path.stat().st_size
        if size > self.config.max_file_size_mb * 1024 * 1024:
            logger.warning(f"⚠️ 檔案過大，跳過: {path.name}")
            return None

        # 讀取完整內容
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
        except Exception as e:
            logger.warning(f"⚠️ 無法讀取 {path.name}: {e}")
            return None

    def _generate_tree(self, root: Path, max_depth: int = 4) -> str:
        """生成目錄樹"""
        lines = [f"📂 {root.name}/"]

        def add_items(path: Path, prefix: str, depth: int):
            if depth > max_depth:
                return

            try:
                items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
                items = [i for i in items if i.name not in self.config.excluded_dirs and not i.name.startswith('.')][:20]

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


# ==================== 專家定義 ====================

EXPERTS = [
    {
        "id": "software_engineer",
        "name": "陳建宏",
        "title": "資深軟體工程師",
        "emoji": "💻",
        "focus": ["程式碼品質", "架構設計", "效能優化", "安全性", "可維護性"],
        "system_prompt": """你是一位擁有15年經驗的資深軟體工程師，專精於：
- 程式碼品質審查與最佳實踐
- 系統架構設計與設計模式
- 效能優化與瓶頸分析
- 安全漏洞識別
- 可維護性與可擴展性評估
- 測試策略與覆蓋率

請以專業軟體工程師的角度分析程式碼，提供：
1. 程式碼品質評分（1-10）並說明理由
2. 架構優缺點分析
3. 潛在 Bug 或安全問題清單
4. 效能優化建議（具體可執行）
5. 重構建議與優先級
6. 提供具體改進程式碼範例（如果適用）

請使用繁體中文回覆，並確保建議是可立即實施的。"""
    },
    {
        "id": "ai_solution",
        "name": "林雅芳",
        "title": "AI 解決方案架構師",
        "emoji": "🤖",
        "focus": ["AI整合", "智能自動化", "數據管道", "ML工作流", "API設計"],
        "system_prompt": """你是一位 AI 解決方案架構師，專精於：
- AI/ML 系統整合
- 智能自動化流程設計
- 數據管道與 ETL 架構
- LLM 應用與 Prompt Engineering
- API 設計與微服務架構
- 成本效益分析

請從 AI 解決方案角度分析，提供：
1. AI 整合機會識別（哪些流程可以用 AI 優化）
2. 自動化流程優化建議
3. 數據流程改進方案
4. LLM/AI 功能擴展建議
5. 智能化升級路線圖
6. 預估 ROI 與實施優先級

請使用繁體中文回覆。"""
    },
    {
        "id": "business_development",
        "name": "王志明",
        "title": "商業發展總監",
        "emoji": "📈",
        "focus": ["商業模式", "市場定位", "合作夥伴", "營收策略", "競爭分析"],
        "system_prompt": """你是一位商業發展總監，專精於：
- B2B/B2C 商業模式設計
- 市場定位與競爭策略
- 合作夥伴生態系統
- 營收模式與定價策略
- 客戶成功與留存
- Go-to-Market 策略

請從商業發展角度分析，提供：
1. 商業模式評估（優勢與風險）
2. 市場機會與威脅分析
3. 潛在合作夥伴建議
4. 營收模式優化建議
5. 客戶價值主張強化
6. 商業化路線圖

請使用繁體中文回覆。"""
    },
    {
        "id": "brand_strategy",
        "name": "張曉琪",
        "title": "品牌策略顧問",
        "emoji": "🎨",
        "focus": ["品牌定位", "用戶洞察", "內容策略", "品牌體驗", "差異化"],
        "system_prompt": """你是一位品牌策略顧問，專精於：
- 品牌定位與差異化
- 目標用戶洞察與 Persona
- 內容策略與故事敘述
- 品牌體驗設計
- 市場溝通與訊息架構
- 品牌資產管理

請從品牌策略角度分析，提供：
1. 品牌定位評估
2. 目標用戶畫像建議
3. 品牌差異化機會
4. 內容策略框架
5. 品牌體驗優化建議
6. 品牌發展路線圖

請使用繁體中文回覆。"""
    },
    {
        "id": "ui_ux",
        "name": "李佳穎",
        "title": "UI/UX 設計主管",
        "emoji": "🎯",
        "focus": ["用戶體驗", "介面設計", "互動設計", "可用性", "設計系統"],
        "system_prompt": """你是一位 UI/UX 設計主管，專精於：
- 用戶體驗研究與設計
- 介面設計與視覺系統
- 互動設計與原型製作
- 可用性測試與優化
- 設計系統建構
- 無障礙設計（A11y）

請從 UI/UX 角度分析，提供：
1. 用戶體驗評估（評分 1-10）
2. 介面設計問題識別
3. 互動流程優化建議
4. 可用性改進建議
5. 設計系統建構建議
6. UX 優化優先級排序

請使用繁體中文回覆。"""
    }
]


# ==================== 分析引擎 ====================

class ClaudeStyleAnalyzer:
    """Claude Code 風格分析器"""

    def __init__(self, config: Config):
        self.config = config
        self.client = SiliconFlowClient(config)
        self.scanner = FileScanner(config)

    def analyze(self, project_path: str) -> Dict:
        """執行完整分析"""
        path = Path(project_path).expanduser().resolve()

        if not path.exists():
            raise FileNotFoundError(f"路徑不存在: {path}")

        self._print_banner()

        # 階段 1: 掃描專案
        logger.info("\n" + "="*60)
        logger.info("📂 階段 1/3: 掃描專案檔案")
        logger.info("="*60)

        project = self.scanner.scan(path)

        # 階段 2: 分階段處理檔案
        logger.info("\n" + "="*60)
        logger.info("📊 階段 2/3: 分析檔案內容")
        logger.info("="*60)

        chunks = self._create_smart_chunks(project)
        logger.info(f"📦 已分割為 {len(chunks)} 個分析區塊")

        # 階段 3: 專家分析
        logger.info("\n" + "="*60)
        logger.info("🤖 階段 3/3: 五位專家依序分析")
        logger.info("="*60)

        results = {
            "project_info": {
                "path": str(path),
                "total_files": project.total_files,
                "total_lines": project.total_lines,
                "total_size_kb": project.total_size_bytes / 1024,
                "file_types": project.file_type_stats,
                "directory_tree": project.directory_tree
            },
            "expert_analyses": {},
            "summary": "",
            "recommendations": [],
            "generated_at": datetime.now().isoformat()
        }

        # 依序執行每位專家
        for i, expert in enumerate(EXPERTS, 1):
            logger.info(f"\n{'─'*50}")
            logger.info(f"{expert['emoji']} 專家 {i}/5: {expert['name']} ({expert['title']})")
            logger.info(f"   專注領域: {', '.join(expert['focus'])}")
            logger.info(f"{'─'*50}")

            try:
                analysis = self._run_expert_analysis(expert, chunks, project)
                results["expert_analyses"][expert["id"]] = {
                    "name": expert["name"],
                    "title": expert["title"],
                    "analysis": analysis,
                    "status": "completed"
                }
                logger.info(f"✅ {expert['name']} 分析完成")
            except Exception as e:
                logger.error(f"❌ {expert['name']} 分析失敗: {e}")
                results["expert_analyses"][expert["id"]] = {
                    "name": expert["name"],
                    "title": expert["title"],
                    "analysis": f"分析失敗: {e}",
                    "status": "failed"
                }

            # 專家間休息
            if i < len(EXPERTS):
                logger.info("⏸️ 專家切換，休息 3 秒...")
                time.sleep(3)

        # 生成總結
        logger.info("\n" + "="*60)
        logger.info("📝 生成總結報告")
        logger.info("="*60)

        summary_data = self._generate_summary(results)
        results["summary"] = summary_data.get("summary", "")
        results["recommendations"] = summary_data.get("recommendations", [])

        # 保存報告
        report_path = self._save_report(results, path)

        # 顯示統計
        self._print_stats(results, report_path)

        return results

    def _print_banner(self):
        """印出 Banner"""
        print("""
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║     🔬 TrvicERP Claude Code 風格分析器 v3.0                       ║
║                                                                  ║
║     • 類似 Claude Code 的智能分析                                 ║
║     • 五位專家依序審查                                            ║
║     • 分階段讀取完整檔案內容                                       ║
║     • 自動產出審查報告和實作建議                                   ║
║                                                                  ║
║     API: https://api.siliconflow.com                             ║
║     Model: Qwen 2.5 72B                                          ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝
""")

    def _create_smart_chunks(self, project: ProjectInfo) -> List[Dict]:
        """智能分割檔案為分析區塊"""
        chunks = []
        current_chunk = {"index": 0, "files": [], "content": "", "tokens": 0}

        # 專案概述（第一個區塊總是包含）
        overview = self._format_project_overview(project)
        current_chunk["content"] = overview
        current_chunk["tokens"] = self._estimate_tokens(overview)

        # 按重要性排序檔案
        priority_order = ['.py', '.ts', '.tsx', '.js', '.jsx', '.vue', '.json', '.md', '.html', '.css']

        def get_priority(f: FileInfo) -> Tuple[int, int]:
            ext = f.extension.lower()
            try:
                return (priority_order.index(ext), f.size_bytes)
            except ValueError:
                return (100, f.size_bytes)

        sorted_files = sorted(project.files, key=get_priority)

        for file_info in sorted_files:
            file_content = self._format_file_content(file_info)
            file_tokens = self._estimate_tokens(file_content)

            # 處理大檔案
            if file_tokens > self.config.max_context_tokens:
                # 先保存當前區塊
                if current_chunk["files"]:
                    chunks.append(current_chunk)
                    current_chunk = {"index": len(chunks), "files": [], "content": "", "tokens": 0}

                # 分割大檔案
                for sub_chunk in self._split_large_file(file_info, len(chunks)):
                    chunks.append(sub_chunk)
                continue

            # 檢查是否需要新區塊
            if current_chunk["tokens"] + file_tokens > self.config.max_context_tokens:
                chunks.append(current_chunk)
                current_chunk = {"index": len(chunks), "files": [], "content": "", "tokens": 0}

            current_chunk["files"].append(file_info.relative_path)
            current_chunk["content"] += file_content
            current_chunk["tokens"] += file_tokens

        # 添加最後一個區塊
        if current_chunk["files"] or current_chunk["content"]:
            chunks.append(current_chunk)

        return chunks

    def _format_project_overview(self, project: ProjectInfo) -> str:
        """格式化專案概述"""
        stats = "\n".join([
            f"  • {ext}: {count} 個檔案"
            for ext, count in sorted(project.file_type_stats.items(), key=lambda x: x[1], reverse=True)[:10]
        ])

        return f"""# 專案概述

## 基本資訊
- **路徑**: {project.root_path}
- **總檔案數**: {project.total_files}
- **總程式碼行數**: {project.total_lines:,}
- **總大小**: {project.total_size_bytes / 1024:.1f} KB

## 檔案類型統計
{stats}

## 目錄結構
```
{project.directory_tree}
```

---

"""

    def _format_file_content(self, file_info: FileInfo) -> str:
        """格式化檔案內容"""
        ext = file_info.extension.lstrip('.') or 'text'
        return f"""
## 📄 {file_info.relative_path}
**大小**: {file_info.size_bytes} bytes | **行數**: {file_info.line_count}

```{ext}
{file_info.content}
```

---

"""

    def _split_large_file(self, file_info: FileInfo, start_index: int) -> List[Dict]:
        """分割大檔案"""
        chunks = []
        lines = file_info.content.splitlines()
        chunk_size = 200  # 每次處理 200 行

        for i in range(0, len(lines), chunk_size):
            chunk_lines = lines[i:i + chunk_size]
            part_num = i // chunk_size + 1
            total_parts = (len(lines) + chunk_size - 1) // chunk_size
            ext = file_info.extension.lstrip('.') or 'text'

            content = f"""
## 📄 {file_info.relative_path} (Part {part_num}/{total_parts})
**行數範圍**: {i + 1}-{min(i + chunk_size, len(lines))}/{len(lines)}

```{ext}
{chr(10).join(chunk_lines)}
```

---

"""
            chunks.append({
                "index": start_index + len(chunks),
                "files": [f"{file_info.relative_path} (Part {part_num}/{total_parts})"],
                "content": content,
                "tokens": self._estimate_tokens(content)
            })

        return chunks

    def _estimate_tokens(self, text: str) -> int:
        """估算 tokens"""
        chinese = sum(1 for c in text if '\u4e00' <= c <= '\u9fff')
        other = len(text) - chinese
        return int(chinese * 1.5 + other * 0.25)

    def _run_expert_analysis(
        self,
        expert: Dict,
        chunks: List[Dict],
        project: ProjectInfo
    ) -> str:
        """執行單個專家的分析"""
        analyses = []

        for i, chunk in enumerate(chunks):
            logger.info(f"   📊 處理區塊 {i + 1}/{len(chunks)}...")

            messages = [
                {"role": "system", "content": expert["system_prompt"]},
                {"role": "user", "content": f"""
請分析以下程式碼專案內容（區塊 {i + 1}/{len(chunks)}）：

{chunk['content']}

請提供你的專業分析，包含：
1. 關鍵發現
2. 問題識別
3. 改進建議
4. 優先級評估

請使用繁體中文回覆。
"""}
            ]

            analysis = self.client.chat(messages, temperature=0.5)
            analyses.append(analysis)

        # 整合多區塊結果
        if len(analyses) > 1:
            logger.info(f"   🔗 整合 {len(analyses)} 個區塊的分析結果...")
            return self._combine_analyses(expert, analyses)

        return analyses[0] if analyses else ""

    def _combine_analyses(self, expert: Dict, analyses: List[str]) -> str:
        """整合多個區塊的分析"""
        combined = "\n\n---\n\n".join([
            f"### 區塊 {i + 1} 分析\n{a}" for i, a in enumerate(analyses)
        ])

        messages = [
            {"role": "system", "content": f"""你是 {expert['name']}（{expert['title']}）。
請整合以下多個區塊的分析結果，產出一份完整、不重複的報告。"""},
            {"role": "user", "content": f"""
請整合以下分析：

{combined}

產出結構化報告：
1. **執行摘要**（3-5 個關鍵發現）
2. **詳細分析**
3. **問題清單**（按優先級排序）
4. **改進建議**（具體可執行）
5. **實作路線圖**

請使用繁體中文回覆。
"""}
        ]

        return self.client.chat(messages, temperature=0.3)

    def _generate_summary(self, results: Dict) -> Dict:
        """生成總結報告"""
        # 收集所有專家分析
        summaries = []
        for expert_id, data in results["expert_analyses"].items():
            if data.get("status") == "completed":
                analysis = data.get("analysis", "")[:3000]
                summaries.append(f"### {data['name']} ({data['title']})\n{analysis}")

        combined = "\n\n".join(summaries)

        messages = [
            {"role": "system", "content": """你是專案總監，負責整合多位專家的分析報告。
請產出高層次的總結，讓專案負責人能快速了解專案狀況並做出決策。"""},
            {"role": "user", "content": f"""
專案資訊：
- 總檔案數: {results['project_info']['total_files']}
- 總程式碼行數: {results['project_info']['total_lines']:,}

各專家分析摘要：
{combined}

請產出：
1. **整體評估**（200字內，包含專案健康度評分 1-10）
2. **TOP 10 優先改進事項**（按重要性排序，每項包含原因和預期效益）
3. **立即可執行的快速修復**（3-5 項）

請以 JSON 格式回覆：
{{"summary": "整體評估內容", "recommendations": ["建議1", "建議2", ...], "quick_fixes": ["快速修復1", ...]}}

使用繁體中文。
"""}
        ]

        try:
            response = self.client.chat(messages, temperature=0.3)

            # 提取 JSON
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group())

            return {"summary": response, "recommendations": [], "quick_fixes": []}
        except Exception as e:
            logger.error(f"生成總結失敗: {e}")
            return {"summary": f"總結生成失敗: {e}", "recommendations": [], "quick_fixes": []}

    def _save_report(self, results: Dict, project_path: Path) -> Path:
        """保存報告"""
        output_dir = Path(self.config.output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"analysis_report_{timestamp}.md"
        filepath = output_dir / filename

        report = self._generate_markdown_report(results)

        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(report)

        # 同時保存 JSON
        json_filepath = output_dir / f"analysis_data_{timestamp}.json"
        with open(json_filepath, 'w', encoding='utf-8') as f:
            json.dump(results, f, ensure_ascii=False, indent=2)

        logger.info(f"\n📄 Markdown 報告: {filepath}")
        logger.info(f"📊 JSON 數據: {json_filepath}")

        return filepath

    def _generate_markdown_report(self, results: Dict) -> str:
        """生成 Markdown 報告"""
        lines = [
            "# 🔬 TrvicERP 專案完整審查報告",
            "",
            f"**生成時間**: {results['generated_at']}",
            f"**專案路徑**: `{results['project_info']['path']}`",
            "",
            "---",
            "",
            "## 📊 專案概覽",
            "",
            "| 指標 | 數值 |",
            "|------|------|",
            f"| 總檔案數 | {results['project_info']['total_files']} |",
            f"| 總程式碼行數 | {results['project_info']['total_lines']:,} |",
            f"| 總大小 | {results['project_info']['total_size_kb']:.1f} KB |",
            "",
            "### 檔案類型分佈",
            ""
        ]

        for ext, count in sorted(results['project_info']['file_types'].items(), key=lambda x: x[1], reverse=True)[:10]:
            lines.append(f"- **{ext}**: {count} 個")

        lines.extend([
            "",
            "### 目錄結構",
            "```",
            results['project_info']['directory_tree'],
            "```",
            "",
            "---",
            "",
            "## 📝 執行總結",
            "",
            results.get("summary", ""),
            "",
            "---",
            "",
            "## 🎯 優先改進事項 (TOP 10)",
            ""
        ])

        for i, rec in enumerate(results.get("recommendations", [])[:10], 1):
            lines.append(f"{i}. {rec}")

        if results.get("quick_fixes"):
            lines.extend([
                "",
                "### ⚡ 立即可執行的快速修復",
                ""
            ])
            for fix in results.get("quick_fixes", []):
                lines.append(f"- {fix}")

        lines.extend([
            "",
            "---",
            "",
            "## 👥 專家詳細分析報告"
        ])

        for expert in EXPERTS:
            expert_id = expert["id"]
            if expert_id in results["expert_analyses"]:
                data = results["expert_analyses"][expert_id]
                status_icon = "✅" if data.get("status") == "completed" else "❌"

                lines.extend([
                    "",
                    f"### {expert['emoji']} {data['name']} ({data['title']}) {status_icon}",
                    "",
                    f"**專注領域**: {', '.join(expert['focus'])}",
                    "",
                    data.get("analysis", ""),
                    "",
                    "---"
                ])

        lines.extend([
            "",
            "---",
            "",
            "*報告由 TrvicERP Claude Code 風格分析器 v3.0 自動生成*",
            f"*使用 SiliconFlow Qwen 2.5 72B 模型*"
        ])

        return "\n".join(lines)

    def _print_stats(self, results: Dict, report_path: Path):
        """印出統計"""
        stats = self.client.get_stats()

        completed = sum(1 for d in results["expert_analyses"].values() if d.get("status") == "completed")

        print(f"""
╔══════════════════════════════════════════════════════════════════╗
║  📊 執行統計                                                      ║
╠══════════════════════════════════════════════════════════════════╣
║  專案檔案數: {results['project_info']['total_files']:<44} ║
║  程式碼行數: {results['project_info']['total_lines']:,}                                          ║
║  專家完成數: {completed}/5                                              ║
║  API 請求數: {stats['total_requests']:<44} ║
║  估算 Tokens: {stats['total_tokens']:,}                                         ║
║                                                                  ║
║  📄 報告位置: {str(report_path)[:40]:<40} ║
╚══════════════════════════════════════════════════════════════════╝
""")


# ==================== CLI ====================

def main():
    """主程式"""
    import argparse

    parser = argparse.ArgumentParser(
        description='TrvicERP Claude Code 風格分析器 v3.0',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  %(prog)s ~/Desktop/TrvicERP-main
  %(prog)s ~/Desktop/TrvicERP-main --api-key YOUR_KEY
  %(prog)s . --rpm 5 --delay 10
        """
    )

    parser.add_argument('project_path', nargs='?', default='.', help='專案路徑（預設為當前目錄）')
    parser.add_argument('--api-key', '-k', help='SiliconFlow API Key（或設定 SILICONFLOW_API_KEY 環境變數）')
    parser.add_argument('--rpm', type=int, default=10, help='每分鐘最大請求數（預設: 10）')
    parser.add_argument('--delay', type=float, default=6.0, help='請求間最小延遲秒數（預設: 6.0）')
    parser.add_argument('--output-dir', '-o', default='analysis_reports', help='輸出目錄（預設: analysis_reports）')

    args = parser.parse_args()

    # 創建配置
    config = Config()

    if args.api_key:
        config.api_key = args.api_key

    config.requests_per_minute = args.rpm
    config.min_delay_seconds = args.delay
    config.output_dir = args.output_dir

    # 檢查 API Key
    if not config.api_key:
        print("""
⚠️ 未設定 API Key

請使用以下方式之一：
  1. 環境變數: export SILICONFLOW_API_KEY=your_key
  2. 參數: --api-key your_key

取得 API Key: https://siliconflow.cn/
        """)
        sys.exit(1)

    # 執行分析
    analyzer = ClaudeStyleAnalyzer(config)

    try:
        results = analyzer.analyze(args.project_path)
        print("\n✅ 分析完成！請查看報告。")
    except KeyboardInterrupt:
        print("\n⚠️ 使用者中斷")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ 執行失敗: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
