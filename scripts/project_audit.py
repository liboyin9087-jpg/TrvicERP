#!/usr/bin/env python3
"""
Project audit runner - 5 expert review system

Usage:
  python scripts/project_audit.py <project_path> --api-key <key>
  python scripts/project_audit.py . --model deepseek-ai/DeepSeek-V3.2

Environment:
  SILICONFLOW_API_KEY
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from dataclasses import dataclass, field
from typing import Dict, List, Iterable, Tuple
from urllib import request as urllib_request
from urllib.error import HTTPError


EXPERT_PROMPTS: Dict[str, Dict[str, str]] = {
    "software_engineering": {
        "name": "軟體工程專家",
        "icon": "🔧",
        "system_prompt": (
            "你是資深軟體工程與架構審查專家。"
            "請針對專案架構、模組邏輯、資安、可維運性、效能風險做嚴謹審查。"
            "請列出缺口、影響與可實作建議。"
        ),
    },
    "ai_solution": {
        "name": "AI 解決方案專家",
        "icon": "🤖",
        "system_prompt": (
            "你是 AI 解決方案架構師。"
            "請聚焦 LLM/RAG/Function calling 的穩定性、可靠性與可觀測性。"
            "指出幻覺風險、評測缺口、記憶管理與安全治理缺失。"
        ),
    },
    "business_development": {
        "name": "B2B 商業開發專家",
        "icon": "💼",
        "system_prompt": (
            "你是 B2B 商業開發與產品策略顧問。"
            "請評估此專案對企業客戶的價值、銷售武器與客戶成功機制是否完整。"
            "提出可落地的商業成長建議。"
        ),
    },
    "brand_strategy": {
        "name": "品牌策略專家",
        "icon": "🎨",
        "system_prompt": (
            "你是品牌策略總監。"
            "請用 STP、Brand Architecture、StoryBrand、Brand Identity Prism 評估品牌缺口。"
            "提出差異化定位、品牌敘事與語調建議。"
        ),
    },
    "ui_ux_design": {
        "name": "UI/UX 設計專家",
        "icon": "✨",
        "system_prompt": (
            "你是資深 UI/UX 設計師。"
            "請評估設計系統一致性、資訊架構、互動流暢性與可用性。"
            "提出可執行的 UI/UX 改善建議。"
        ),
    },
}


DEFAULT_ALLOWED_EXTENSIONS = {
    ".py", ".js", ".ts", ".tsx", ".jsx", ".json", ".md", ".mdx", ".html",
    ".css", ".scss", ".less", ".yml", ".yaml", ".toml", ".sql", ".txt",
    ".mjs", ".cjs",
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "dist", "build", ".vercel", ".next", ".cache",
    "__pycache__", ".cursor", ".idea", ".vscode",
}

EXCLUDE_FILES_PREFIX = (
    ".env",
)

PRIORITY_FILES = {
    "package.json",
    "tsconfig.json",
    "vite.config.ts",
    "vercel.json",
    "App.tsx",
    "index.tsx",
    "index.css",
    "ai-server/main.py",
    "ai-server/prompt_templates.py",
    "ai-server/requirements.txt",
    "src/services/dataValidationService.ts",
    "src/services/dynamicCostEngine.ts",
    "src/services/permissionMatrixService.ts",
    "src/services/seatConflictDetectionService.ts",
    "src/services/transportTimeService.ts",
}


@dataclass
class ScanConfig:
    root: str
    max_file_size_kb: int = 150
    max_file_chars: int = 6000
    max_context_chars: int = 120000
    allowed_extensions: Iterable[str] = field(default_factory=lambda: set(DEFAULT_ALLOWED_EXTENSIONS))


def is_excluded(path: str) -> bool:
    name = os.path.basename(path)
    if name.startswith(EXCLUDE_FILES_PREFIX):
        return True
    return False


def collect_files(config: ScanConfig) -> List[Tuple[str, int]]:
    results: List[Tuple[str, int]] = []
    root = os.path.abspath(config.root)

    for current_root, dirs, files in os.walk(root):
        dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
        for file in files:
            if file.startswith(".") and file != ".env.example":
                continue
            full_path = os.path.join(current_root, file)
            rel_path = os.path.relpath(full_path, root)
            if is_excluded(rel_path):
                continue
            ext = os.path.splitext(file)[1].lower()
            if ext not in config.allowed_extensions:
                continue
            try:
                size = os.path.getsize(full_path)
            except OSError:
                continue
            if size > config.max_file_size_kb * 1024:
                continue
            results.append((rel_path, size))
    return sorted(results)


def read_file(root: str, rel_path: str, max_chars: int) -> str:
    full_path = os.path.join(root, rel_path)
    try:
        with open(full_path, "r", encoding="utf-8") as file:
            content = file.read()
    except (UnicodeDecodeError, OSError):
        return ""
    if len(content) <= max_chars:
        return content
    return content[:max_chars] + "\n... [truncated]"


def build_context(config: ScanConfig, files: List[Tuple[str, int]]) -> str:
    root = os.path.abspath(config.root)
    summary_lines = [
        f"Project root: {root}",
        f"Total files scanned: {len(files)}",
    ]
    top_dirs = sorted({path.split(os.sep)[0] for path, _ in files})
    summary_lines.append(f"Top directories: {', '.join(top_dirs[:12])}")

    priority = [path for path, _ in files if path in PRIORITY_FILES]
    priority_set = set(priority)
    extra = [path for path, _ in files if path not in priority_set]

    context_parts: List[str] = []
    context_parts.append("=== Project Summary ===\n" + "\n".join(summary_lines))
    context_parts.append("\n=== File List (truncated) ===\n" + "\n".join(path for path, _ in files[:200]))

    def append_file(rel_path: str) -> None:
        content = read_file(root, rel_path, config.max_file_chars)
        if not content:
            return
        context_parts.append(f"\n--- FILE: {rel_path} ---\n{content}\n")

    for rel_path in priority:
        append_file(rel_path)

    for rel_path in extra[:40]:
        if len("".join(context_parts)) > config.max_context_chars:
            break
        append_file(rel_path)

    return "\n".join(context_parts)[:config.max_context_chars]


def call_siliconflow(api_key: str, model: str, system_prompt: str, user_prompt: str, max_tokens: int) -> str:
    endpoint = os.getenv("SILICONFLOW_API_URL", "https://api.siliconflow.com/v1/chat/completions")
    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        "temperature": 0.2,
        "max_tokens": max_tokens,
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib_request.Request(
        endpoint,
        data=data,
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )
    try:
        with urllib_request.urlopen(req, timeout=120) as resp:
            raw = resp.read().decode("utf-8")
    except HTTPError as err:
        body = err.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"SiliconFlow API error {err.code}: {body}") from err
    result = json.loads(raw)
    return result.get("choices", [{}])[0].get("message", {}).get("content", "").strip()


def build_user_prompt(context: str, expert_id: str) -> str:
    return (
        f"專家角色: {expert_id}\n\n"
        "以下是專案內容摘要與部分檔案內容：\n"
        f"{context}\n\n"
        "請根據你的角色給出：\n"
        "1) 現有資產/優勢\n"
        "2) 主要缺口與風險\n"
        "3) 可落地的修補方案（含優先順序）\n"
        "4) 必要的驗證或衡量指標\n"
        "請用條列清楚輸出，並盡量具體。"
    )


def ensure_api_key(cli_key: str | None) -> str:
    api_key = cli_key or os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        raise SystemExit("Missing SILICONFLOW_API_KEY (set env or use --api-key)")
    return api_key


def run_audit(
    root: str,
    model: str,
    api_key: str,
    experts: List[str],
    max_tokens: int,
) -> Dict[str, str]:
    config = ScanConfig(root=root)
    files = collect_files(config)
    context = build_context(config, files)

    outputs: Dict[str, str] = {}
    for expert_id in experts:
        expert = EXPERT_PROMPTS[expert_id]
        system_prompt = expert["system_prompt"]
        user_prompt = build_user_prompt(context, expert_id)
        outputs[expert_id] = call_siliconflow(api_key, model, system_prompt, user_prompt, max_tokens)
        time.sleep(0.5)
    return outputs


def save_report(root: str, outputs: Dict[str, str], experts: List[str], output: str) -> None:
    json_path = os.path.join(root, f"{output}.json")
    md_path = os.path.join(root, f"{output}.md")

    data = {
        "experts": experts,
        "reports": outputs,
    }
    with open(json_path, "w", encoding="utf-8") as file:
        json.dump(data, file, ensure_ascii=False, indent=2)

    lines = ["# Project Audit Report\n"]
    for expert_id in experts:
        expert = EXPERT_PROMPTS[expert_id]
        lines.append(f"## {expert['icon']} {expert['name']}\n")
        lines.append(outputs.get(expert_id, ""))
        lines.append("\n---\n")

    with open(md_path, "w", encoding="utf-8") as file:
        file.write("\n".join(lines))


def main() -> None:
    parser = argparse.ArgumentParser(description="Five-expert project audit runner.")
    parser.add_argument("project_path", nargs="?", default=".")
    parser.add_argument("--api-key", dest="api_key")
    parser.add_argument("--model", default="deepseek-ai/DeepSeek-V3.2")
    parser.add_argument("--experts", nargs="+", default=list(EXPERT_PROMPTS.keys()))
    parser.add_argument("--output", default="audit_report")
    parser.add_argument("--max-tokens", type=int, default=2500)
    args = parser.parse_args()

    for expert_id in args.experts:
        if expert_id not in EXPERT_PROMPTS:
            raise SystemExit(f"Unknown expert: {expert_id}")

    api_key = ensure_api_key(args.api_key)
    outputs = run_audit(args.project_path, args.model, api_key, args.experts, args.max_tokens)
    save_report(args.project_path, outputs, args.experts, args.output)

    print("Audit completed.")
    print(f"JSON: {os.path.join(args.project_path, args.output)}.json")
    print(f"MD: {os.path.join(args.project_path, args.output)}.md")


if __name__ == "__main__":
    main()
