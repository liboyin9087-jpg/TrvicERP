#!/usr/bin/env python3
"""
TrvicERP Claude Code 風格分析器 - 跨平台啟動腳本
================================================

使用方式:
    python run_analyzer.py                      # 分析當前目錄
    python run_analyzer.py ~/Desktop/project    # 分析指定目錄
    python run_analyzer.py . --api-key YOUR_KEY # 指定 API Key

環境變數:
    SILICONFLOW_API_KEY - 你的 SiliconFlow API Key

API: https://api.siliconflow.com
Model: Qwen 2.5 72B
"""

import os
import sys
import subprocess
from pathlib import Path


def check_dependencies():
    """檢查依賴"""
    try:
        import requests
        return True
    except ImportError:
        print("⚠️ 安裝必要套件 requests...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "requests"])
        return True


def main():
    # 檢查依賴
    check_dependencies()

    # 取得腳本所在目錄
    script_dir = Path(__file__).parent.resolve()
    analyzer_path = script_dir / "claude_style_analyzer.py"

    if not analyzer_path.exists():
        print(f"❌ 找不到分析器: {analyzer_path}")
        sys.exit(1)

    # 檢查 API Key
    if not os.environ.get("SILICONFLOW_API_KEY"):
        # 嘗試從配置文件讀取
        config_path = script_dir / "claude_analyzer_config.json"
        if config_path.exists():
            import json
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                api_key = config.get("api", {}).get("api_key", "")
                if api_key:
                    os.environ["SILICONFLOW_API_KEY"] = api_key
                    print("✓ 從配置文件讀取 API Key")

    # 執行分析器
    args = [sys.executable, str(analyzer_path)] + sys.argv[1:]
    try:
        subprocess.run(args, check=True)
    except subprocess.CalledProcessError as e:
        sys.exit(e.returncode)
    except KeyboardInterrupt:
        print("\n⚠️ 使用者中斷")
        sys.exit(1)


if __name__ == "__main__":
    main()
