#!/bin/bash
#
# TrvicERP 分析器快速啟動腳本
# 使用方式: ./run_analysis.sh [專案路徑]
#

set -e

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║     🔬 TrvicERP 多專家代碼分析器 v2.0                         ║"
echo "║     採用 Claude Code 風格 Agent 架構                          ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# 檢查 Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ 錯誤: 未安裝 Python3${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Python3: $(python3 --version)${NC}"

# 檢查 requests
if ! python3 -c "import requests" 2>/dev/null; then
    echo -e "${YELLOW}📦 安裝 requests...${NC}"
    pip3 install requests --quiet
fi
echo -e "${GREEN}✅ requests 已安裝${NC}"

# 檢查 API Key
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo ""
    echo -e "${YELLOW}⚠️ 未設定 SILICONFLOW_API_KEY${NC}"
    read -p "請輸入 API Key: " api_key
    export SILICONFLOW_API_KEY="$api_key"
    echo ""
    echo -e "${BLUE}💡 提示: 添加到 ~/.bashrc 或 ~/.zshrc 以永久保存:${NC}"
    echo "   export SILICONFLOW_API_KEY=\"$api_key\""
fi
echo -e "${GREEN}✅ API Key 已設定${NC}"

# 專案路徑
PROJECT_PATH="${1:-$HOME/Desktop/TrvicERP-main}"

if [ ! -d "$PROJECT_PATH" ]; then
    echo ""
    echo -e "${RED}❌ 路徑不存在: $PROJECT_PATH${NC}"
    read -p "請輸入專案路徑: " PROJECT_PATH
    
    if [ ! -d "$PROJECT_PATH" ]; then
        echo -e "${RED}❌ 路徑無效${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📁 專案路徑: $PROJECT_PATH${NC}"
echo ""

# Rate Limiting 配置
echo "Rate Limiting 配置:"
echo "  1) 標準 (10 RPM, 6s 延遲) - 預設"
echo "  2) 保守 (6 RPM, 10s 延遲) - 避免 API 限制"
echo "  3) 自訂"
echo ""
read -p "選擇 [1/2/3] (預設 1): " rate_choice

case $rate_choice in
    2)
        RPM=6
        DELAY=10
        ;;
    3)
        read -p "每分鐘請求數 (RPM): " RPM
        read -p "請求間延遲 (秒): " DELAY
        ;;
    *)
        RPM=10
        DELAY=6
        ;;
esac

echo ""
echo -e "${GREEN}⚙️ Rate Limiting: ${RPM} RPM, ${DELAY}s 延遲${NC}"
echo ""

# 確認執行
echo "準備執行分析，五位專家將依序進行："
echo "  1. 🔧 軟體工程師 (陳建宏)"
echo "  2. 🤖 AI 解決方案 (林雅芳)"
echo "  3. 💼 商業發展 (王志明)"
echo "  4. 🎨 品牌策略 (張曉琪)"
echo "  5. 🖥️ UI/UX (李佳穎)"
echo ""
read -p "開始分析？ (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 開始執行...${NC}"
echo ""

# 執行分析
python3 trvic_analyzer_v2.py "$PROJECT_PATH" --rpm "$RPM" --delay "$DELAY"

echo ""
echo -e "${GREEN}✅ 分析完成！${NC}"
echo "📄 報告位於: ./analysis_reports/"
