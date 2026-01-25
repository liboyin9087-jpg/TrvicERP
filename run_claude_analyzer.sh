#!/bin/bash
#
# TrvicERP Claude Code 風格分析器啟動腳本
# ==========================================
#
# 使用方式：
#   ./run_claude_analyzer.sh                    # 分析當前目錄
#   ./run_claude_analyzer.sh ~/Desktop/project  # 分析指定目錄
#   ./run_claude_analyzer.sh . --rpm 5          # 降低請求頻率
#
# 環境變數：
#   SILICONFLOW_API_KEY - 你的 SiliconFlow API Key
#

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║     🔬 TrvicERP Claude Code 風格分析器                            ║"
echo "║                                                                  ║"
echo "║     五位專家依序審查:                                             ║"
echo "║       1. 💻 軟體工程師 - 程式碼品質                               ║"
echo "║       2. 🤖 AI 架構師 - 智能化建議                                ║"
echo "║       3. 📈 BD 總監 - 商業發展                                    ║"
echo "║       4. 🎨 品牌顧問 - 品牌策略                                   ║"
echo "║       5. 🎯 UX 主管 - 用戶體驗                                    ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 取得腳本所在目錄
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 錯誤: 找不到 python3${NC}"
    echo "請安裝 Python 3.8+"
    exit 1
fi

# 檢查 requests 套件
if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${YELLOW}⚠️ 安裝必要套件...${NC}"
    pip3 install requests
fi

# 檢查 API Key
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo -e "${YELLOW}⚠️ 未設定 SILICONFLOW_API_KEY 環境變數${NC}"
    echo ""
    echo "請先設定 API Key:"
    echo "  export SILICONFLOW_API_KEY=your_api_key"
    echo ""
    echo "取得 API Key: https://siliconflow.cn/"
    echo ""

    # 嘗試從配置文件讀取
    CONFIG_FILE="$SCRIPT_DIR/claude_analyzer_config.json"
    if [ -f "$CONFIG_FILE" ]; then
        API_KEY=$(python3 -c "import json; print(json.load(open('$CONFIG_FILE'))['api'].get('api_key', ''))" 2>/dev/null)
        if [ -n "$API_KEY" ] && [ "$API_KEY" != "" ]; then
            echo -e "${GREEN}✓ 從配置文件讀取 API Key${NC}"
            export SILICONFLOW_API_KEY="$API_KEY"
        else
            echo -e "${RED}❌ 配置文件中也沒有設定 API Key${NC}"
            exit 1
        fi
    else
        exit 1
    fi
fi

echo -e "${GREEN}✓ API Key 已設定${NC}"
echo ""

# 確定要分析的路徑
PROJECT_PATH="${1:-.}"

# 如果是相對路徑，轉換為絕對路徑
if [[ ! "$PROJECT_PATH" = /* ]]; then
    PROJECT_PATH="$(cd "$PROJECT_PATH" 2>/dev/null && pwd)" || {
        echo -e "${RED}❌ 錯誤: 路徑不存在: $1${NC}"
        exit 1
    }
fi

echo -e "${BLUE}📁 分析目標: ${PROJECT_PATH}${NC}"
echo ""

# 執行分析器
echo -e "${GREEN}🚀 開始分析...${NC}"
echo ""

python3 "$SCRIPT_DIR/claude_style_analyzer.py" "$PROJECT_PATH" "${@:2}"

echo ""
echo -e "${GREEN}✅ 完成！請查看 analysis_reports 目錄中的報告${NC}"
