#!/usr/bin/env python3
"""
五專家專案審查系統 (Five-Expert Project Audit System)
使用 DeepSeek-V3.2 通過 SiliconFlow API 進行專案深度分析

功能：
1. 掃描專案結構與檔案內容
2. 5 位專家依序分析（軟體工程、AI 解決方案、BD、品牌策略、UI/UX）
3. 產出完整審查報告與實作建議
"""

import os
import json
import time
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime
import httpx

# ============================================================
# 配置區
# ============================================================

@dataclass
class Config:
    """系統配置"""
    api_base_url: str = "https://api.siliconflow.com/v1"
    api_key: str = ""  # 從環境變數讀取
    model: str = "deepseek-ai/DeepSeek-V3"
    max_tokens: int = 8192
    temperature: float = 0.7
    
    # 檔案掃描設定
    ignore_dirs: List[str] = field(default_factory=lambda: [
        '.git', 'node_modules', '__pycache__', '.next', 'dist', 
        'build', '.vercel', '.cache', 'coverage', '.turbo'
    ])
    ignore_files: List[str] = field(default_factory=lambda: [
        '.DS_Store', 'package-lock.json', 'yarn.lock', 'pnpm-lock.yaml',
        '*.pyc', '*.pyo', '*.log', '*.map'
    ])
    include_extensions: List[str] = field(default_factory=lambda: [
        '.py', '.js', '.ts', '.tsx', '.jsx', '.vue', '.svelte',
        '.json', '.yaml', '.yml', '.toml', '.md', '.mdx',
        '.css', '.scss', '.less', '.html', '.sql', '.env.example'
    ])
    max_file_size_kb: int = 100


# ============================================================
# 專案掃描器
# ============================================================

@dataclass
class FileInfo:
    """檔案資訊"""
    path: str
    relative_path: str
    extension: str
    size_kb: float
    content: Optional[str] = None
    truncated: bool = False


class ProjectScanner:
    """專案結構與內容掃描器"""
    
    def __init__(self, config: Config):
        self.config = config
        self.files: List[FileInfo] = []
        self.structure: Dict = {}
        self.stats: Dict = {
            'total_files': 0,
            'total_dirs': 0,
            'by_extension': {},
            'total_lines': 0
        }
    
    def scan(self, project_path: str) -> Dict:
        """掃描專案"""
        project_path = Path(project_path).resolve()
        
        if not project_path.exists():
            raise FileNotFoundError(f"專案路徑不存在: {project_path}")
        
        print(f"\n📂 掃描專案: {project_path}\n")
        
        self._scan_directory(project_path, project_path)
        self._read_file_contents()
        self._build_structure_tree(project_path)
        
        return self._generate_scan_report()
    
    def _should_ignore_dir(self, dir_name: str) -> bool:
        return dir_name in self.config.ignore_dirs or dir_name.startswith('.')
    
    def _should_ignore_file(self, file_name: str) -> bool:
        for pattern in self.config.ignore_files:
            if pattern.startswith('*'):
                if file_name.endswith(pattern[1:]):
                    return True
            elif file_name == pattern:
                return True
        return False
    
    def _should_include_file(self, file_name: str) -> bool:
        ext = Path(file_name).suffix.lower()
        return ext in self.config.include_extensions
    
    def _scan_directory(self, current_path: Path, root_path: Path):
        try:
            for item in current_path.iterdir():
                if item.is_dir():
                    if not self._should_ignore_dir(item.name):
                        self.stats['total_dirs'] += 1
                        self._scan_directory(item, root_path)
                elif item.is_file():
                    if not self._should_ignore_file(item.name) and self._should_include_file(item.name):
                        relative_path = str(item.relative_to(root_path))
                        size_kb = item.stat().st_size / 1024
                        
                        file_info = FileInfo(
                            path=str(item),
                            relative_path=relative_path,
                            extension=item.suffix.lower(),
                            size_kb=round(size_kb, 2)
                        )
                        self.files.append(file_info)
                        self.stats['total_files'] += 1
                        
                        ext = item.suffix.lower()
                        self.stats['by_extension'][ext] = self.stats['by_extension'].get(ext, 0) + 1
        except PermissionError:
            pass
    
    def _read_file_contents(self):
        for file_info in self.files:
            try:
                with open(file_info.path, 'r', encoding='utf-8', errors='ignore') as f:
                    if file_info.size_kb > self.config.max_file_size_kb:
                        content = f.read(self.config.max_file_size_kb * 512)
                        content += "\n\n... [檔案過大，已截斷] ...\n\n"
                        f.seek(-self.config.max_file_size_kb * 512, 2)
                        content += f.read()
                        file_info.content = content
                        file_info.truncated = True
                    else:
                        file_info.content = f.read()
                    
                    if file_info.content:
                        self.stats['total_lines'] += len(file_info.content.splitlines())
            except Exception as e:
                file_info.content = f"[無法讀取: {str(e)}]"
    
    def _build_structure_tree(self, root_path: Path) -> str:
        tree_lines = []
        
        def add_to_tree(path: Path, prefix: str = ""):
            try:
                items = sorted(path.iterdir(), key=lambda x: (x.is_file(), x.name.lower()))
            except PermissionError:
                return
            
            visible_items = []
            for item in items:
                if item.is_dir() and self._should_ignore_dir(item.name):
                    continue
                if item.is_file() and (self._should_ignore_file(item.name) or not self._should_include_file(item.name)):
                    continue
                visible_items.append(item)
            
            for i, item in enumerate(visible_items):
                is_last = i == len(visible_items) - 1
                current_prefix = "└── " if is_last else "├── "
                next_prefix = "    " if is_last else "│   "
                
                if item.is_dir():
                    tree_lines.append(f"{prefix}{current_prefix}📁 {item.name}/")
                    add_to_tree(item, prefix + next_prefix)
                else:
                    tree_lines.append(f"{prefix}{current_prefix}📄 {item.name}")
        
        tree_lines.append(f"📦 {root_path.name}/")
        add_to_tree(root_path)
        
        self.structure['tree'] = "\n".join(tree_lines)
        return self.structure['tree']
    
    def _generate_scan_report(self) -> Dict:
        return {
            'structure_tree': self.structure.get('tree', ''),
            'stats': self.stats,
            'files': [
                {
                    'path': f.relative_path,
                    'extension': f.extension,
                    'size_kb': f.size_kb,
                    'content': f.content,
                    'truncated': f.truncated
                }
                for f in self.files
            ]
        }



# ============================================================
# 專家提示詞定義 （簡化版）
# ============================================================

EXPERT_PROMPTS = {
    "software_engineering": {
        "name": "軟體工程專家",
        "icon": "🔧",
        "system_prompt": "軟體工程系統提示（簡化）",
        "analysis_prompt": "請分析專案架構與程式碼品質：\n{structure_tree}\n{file_contents}"
    },
    "ai_solution": {
        "name": "AI 解決方案專家",
        "icon": "🤖",
        "system_prompt": "AI 系統提示（簡化）",
        "analysis_prompt": "請分析專案的 AI 整合：\n{structure_tree}\n{file_contents}"
    },
    "business_development": {
        "name": "B2B 商業開發專家",
        "icon": "💼",
        "system_prompt": "BD 系統提示（簡化）",
        "analysis_prompt": "請提供商業評估：\n{structure_tree}\n{file_contents}"
    },
    "brand_strategy": {
        "name": "品牌策略專家",
        "icon": "🎨",
        "system_prompt": "Brand 系統提示（簡化）",
        "analysis_prompt": "請評估品牌與視覺一致性：\n{structure_tree}\n{file_contents}"
    },
    "ui_ux_design": {
        "name": "UI/UX 設計專家",
        "icon": "✨",
        "system_prompt": "UI/UX 系統提示（簡化）",
        "analysis_prompt": "請進行 UI/UX 審查：\n{structure_tree}\n{file_contents}"
    }
}


# ============================================================
# LLM 客戶端
# ============================================================


class LLMClient:
    """SiliconFlow API 客戶端（簡化）"""
    
    def __init__(self, config: Config):
        self.config = config
        self.client = httpx.Client(timeout=180.0)
    
    def chat(self, system_prompt: str, user_prompt: str) -> str:
        headers = {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json"
        }
        payload = {
            "model": self.config.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": self.config.max_tokens,
            "temperature": self.config.temperature,
            "stream": False
        }
        try:
            response = self.client.post(f"{self.config.api_base_url}/chat/completions", headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            return result['choices'][0]['message']['content']
        except Exception as e:
            raise
    
    def close(self):
        try:
            self.client.close()
        except Exception:
            pass


# ============================================================
# 審查系統
# ============================================================


class ProjectAuditor:
    def __init__(self, config: Config):
        self.config = config
        self.scanner = ProjectScanner(config)
        self.llm = LLMClient(config)
        self.scan_result: Dict = {}
        self.audit_results: Dict[str, str] = {}

    def audit(self, project_path: str, experts: Optional[List[str]] = None) -> Dict:
        if experts is None:
            experts = list(EXPERT_PROMPTS.keys())

        print("=" * 60)
        print("🚀 五專家專案審查系統")
        print(f"   使用模型: {self.config.model}")
        print("=" * 60)

        self.scan_result = self.scanner.scan(project_path)
        self._print_scan_summary()

        file_contents = self._prepare_file_contents()

        print("\n🔍 開始專家分析...\n")
        for expert_key in experts:
            expert = EXPERT_PROMPTS.get(expert_key)
            if not expert:
                continue
            self._run_expert_analysis(expert_key, expert, file_contents)

        return self._generate_final_report()

    def _print_scan_summary(self):
        stats = self.scan_result['stats']
        print("\n📊 專案掃描摘要")
        print("-" * 40)
        print(f"總檔案數: {stats['total_files']}")
        print(f"總目錄數: {stats['total_dirs']}")
        print(f"總程式碼行數: {stats['total_lines']:,}")

    def _prepare_file_contents(self) -> str:
        contents = []
        for file in self.scan_result['files']:
            if file['content']:
                truncated_note = " [已截斷]" if file['truncated'] else ""
                content_preview = file['content'][:8000]
                contents.append(f"""
### 📄 {file['path']}{truncated_note}
```{file['extension'].lstrip('.')}
{content_preview}
```
""")
        full_content = "\n".join(contents)
        if len(full_content) > 50000:
            full_content = full_content[:50000] + "\n\n... [內容已截斷，僅顯示部分檔案] ..."
        return full_content

    def _run_expert_analysis(self, expert_key: str, expert: Dict, file_contents: str):
        print(f"\n{expert['icon']} {expert['name']} 分析中...")
        try:
            result = self.llm.chat(expert['system_prompt'], expert['analysis_prompt'].format(
                structure_tree=self.scan_result['structure_tree'],
                total_files=self.scan_result['stats']['total_files'],
                total_dirs=self.scan_result['stats']['total_dirs'],
                total_lines=self.scan_result['stats']['total_lines'],
                by_extension=json.dumps(self.scan_result['stats']['by_extension'], ensure_ascii=False),
                file_contents=file_contents
            ))
            self.audit_results[expert_key] = result
            print(f"✅ {expert['name']} 完成")
        except Exception as e:
            print(f"❌ {expert['name']} 分析失敗: {e}")
            self.audit_results[expert_key] = f"分析失敗: {e}"

    def _generate_final_report(self) -> Dict:
        report = {
            "generated_at": datetime.now().isoformat(),
            "project_stats": self.scan_result['stats'],
            "structure_tree": self.scan_result['structure_tree'],
            "expert_analyses": {}
        }
        for k, v in self.audit_results.items():
            report['expert_analyses'][k] = {
                'analysis': v
            }
        return report

    def save_report(self, report: Dict, output_path: str):
        json_path = Path(output_path).with_suffix('.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        md_path = Path(output_path).with_suffix('.md')
        md_content = "# Report\n\n" + json.dumps(report, ensure_ascii=False)
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)
        print(f"Saved: {json_path}, {md_path}")


def main():
    import argparse
    parser = argparse.ArgumentParser(description='五專家專案審查系統')
    parser.add_argument('project_path', help='專案路徑')
    parser.add_argument('--api-key', help='SiliconFlow API Key（或設定 SILICONFLOW_API_KEY 環境變數）')
    parser.add_argument('--model', default='deepseek-ai/DeepSeek-V3', help='模型名稱')
    parser.add_argument('--output', default='audit_report', help='輸出檔案名稱（不含副檔名）')
    parser.add_argument('--experts', nargs='+', choices=list(EXPERT_PROMPTS.keys()), help='指定要使用的專家（預設全部）')
    args = parser.parse_args()

    config = Config(api_key=args.api_key or os.environ.get('SILICONFLOW_API_KEY', ''), model=args.model)
    if not config.api_key:
        print("❌ 請提供 API Key（透過 --api-key 參數或 SILICONFLOW_API_KEY 環境變數）")
        return

    auditor = ProjectAuditor(config)
    try:
        report = auditor.audit(args.project_path, args.experts)
        auditor.save_report(report, args.output)
        print("Done")
    finally:
        auditor.llm.close()


if __name__ == '__main__':
    main()
