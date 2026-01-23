#!/bin/bash
# 演示腳本：執行 5 個 TrvicERP Agents
# 
# 使用方式：
#   export SILICONFLOW_API_KEY="your_api_key_here"
#   ./demo_run_5_agents.sh

set -e

echo "🔬 TrvicERP 多專家代碼分析器 - 演示執行"
echo "=============================================="
echo ""

# 檢查 API Key
if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo "❌ 錯誤: 未設定 SILICONFLOW_API_KEY"
    echo ""
    echo "請先設定 API Key："
    echo "  export SILICONFLOW_API_KEY=\"your_api_key_here\""
    echo ""
    exit 1
fi

# 專案路徑（當前目錄）
PROJECT_PATH="."

echo "📁 分析專案: $PROJECT_PATH"
echo "🤖 將執行以下 5 個 Agents："
echo "   1. 🔧 Software Engineer (陳建宏) - 程式碼品質分析"
echo "   2. 🤖 AI Solution (林雅芳) - AI 整合機會"
echo "   3. 💼 Business Development (王志明) - 商業模式"
echo "   4. 🎨 Brand Strategy (張曉琪) - 品牌策略"
echo "   5. 🖥️ UI/UX (李佳穎) - 用戶體驗"
echo ""

# 使用保守的 Rate Limiting 設定（避免 API 限制）
RPM=6
DELAY=10

echo "⚙️ Rate Limiting 設定："
echo "   - 每分鐘請求數: $RPM"
echo "   - 請求間延遲: ${DELAY}s"
echo ""

read -p "開始執行？ (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "已取消"
    exit 0
fi

echo ""
echo "🚀 開始執行分析..."
echo "=============================================="
echo ""

# 執行分析（所有 5 個 agents）
python3 trvic_analyzer_v2.py "$PROJECT_PATH" \
    --rpm "$RPM" \
    --delay "$DELAY" \
    --agents software_engineer ai_solution business_development brand_strategy ui_ux

echo ""
echo "=============================================="
echo "✅ 分析完成！"
echo ""
echo "📄 報告位於: ./analysis_reports/"
echo "💾 Session 資料: ./.trvic_sessions/"
echo ""
