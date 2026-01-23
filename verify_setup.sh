#!/bin/bash
# 系統驗證腳本 - 檢查所有配置是否正確

set -e

echo "🔍 TrvicERP 自動化系統驗證"
echo "======================================"
echo ""

# 顏色
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 不存在${NC}"
        return 1
    fi
}

check_executable() {
    if [ -x "$1" ]; then
        echo -e "${GREEN}✅ $1 (可執行)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  $1 (不可執行)${NC}"
        return 1
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1/${NC}"
        return 0
    else
        echo -e "${RED}❌ $1/ 不存在${NC}"
        return 1
    fi
}

errors=0

echo "📦 檢查解壓縮的文件："
check_file "trvic_analyzer_v2.py" || ((errors++))
check_file "trvic_config.json" || ((errors++))
check_file "run_analysis.sh" || ((errors++))
check_file "README_v2.md" || ((errors++))
echo ""

echo "🔧 檢查腳本可執行權限："
check_executable "trvic_analyzer_v2.py" || ((errors++))
check_executable "run_analysis.sh" || ((errors++))
check_executable "demo_run_5_agents.sh" || ((errors++))
echo ""

echo "🤖 檢查 GitHub Actions："
check_file ".github/workflows/pr-analysis.yml" || ((errors++))
echo ""

echo "💻 檢查 Codespaces 配置："
check_file ".devcontainer/devcontainer.json" || ((errors++))
echo ""

echo "📋 檢查 Python 依賴："
check_file "requirements.txt" || ((errors++))
echo ""

echo "📖 檢查文檔："
check_file "AUTOMATION_SETUP.md" || ((errors++))
echo ""

echo "🐍 檢查 Python 環境："
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3: $(python3 --version)${NC}"
else
    echo -e "${RED}❌ Python3 未安裝${NC}"
    ((errors++))
fi

if python3 -c "import requests" 2>/dev/null; then
    echo -e "${GREEN}✅ requests 模組已安裝${NC}"
else
    echo -e "${YELLOW}⚠️  requests 模組未安裝（可執行: pip install requests）${NC}"
fi
echo ""

echo "🔬 檢查分析器："
if python3 trvic_analyzer_v2.py --help &> /dev/null; then
    echo -e "${GREEN}✅ 分析器可正常運行${NC}"
else
    echo -e "${RED}❌ 分析器無法運行${NC}"
    ((errors++))
fi
echo ""

echo "📊 檢查配置文件："
if python3 -c "import json; json.load(open('trvic_config.json'))" 2>/dev/null; then
    echo -e "${GREEN}✅ trvic_config.json 格式正確${NC}"
    
    # 顯示配置摘要
    python3 << 'EOF'
import json
with open('trvic_config.json') as f:
    config = json.load(f)
print(f"   - 模型: {config['api']['model']}")
print(f"   - RPM: {config['api']['requests_per_minute']}")
print(f"   - 延遲: {config['api']['min_delay_between_requests']}s")
print(f"   - Agents: {len(config['agents']['order'])} 位專家")
EOF
else
    echo -e "${RED}❌ trvic_config.json 格式錯誤${NC}"
    ((errors++))
fi
echo ""

echo "🎯 檢查 5 個 Agents："
python3 << 'EOF'
from trvic_analyzer_v2 import AgentFactory
agents = {
    "software_engineer": "🔧 陳建宏 - 軟體工程師",
    "ai_solution": "🤖 林雅芳 - AI 解決方案",
    "business_development": "💼 王志明 - 商業發展",
    "brand_strategy": "🎨 張曉琪 - 品牌策略",
    "ui_ux": "🖥️ 李佳穎 - UI/UX"
}
print("\033[0;32m✅ 5 個 Agents 已配置：\033[0m")
for agent_id, desc in agents.items():
    if agent_id in AgentFactory.AGENT_CLASSES:
        print(f"   ✓ {desc}")
EOF
echo ""

echo "======================================"
if [ $errors -eq 0 ]; then
    echo -e "${GREEN}🎉 所有檢查通過！系統已正確配置${NC}"
    echo ""
    echo "📚 使用說明："
    echo "   1. 設定 API Key: export SILICONFLOW_API_KEY=\"your_key\""
    echo "   2. 執行分析: ./run_analysis.sh"
    echo "   3. 查看文檔: cat AUTOMATION_SETUP.md"
    echo "   4. 創建 PR 自動觸發 GitHub Actions"
    echo ""
    exit 0
else
    echo -e "${RED}❌ 發現 $errors 個問題，請檢查上述錯誤${NC}"
    echo ""
    exit 1
fi
