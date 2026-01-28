#!/bin/bash
# TrvicERP 環境設定助手

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

echo "════════════════════════════════════════════"
echo "  TrvicERP 環境變數設定助手"
echo "════════════════════════════════════════════"
echo

# 檢查 .env 文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo "⚠️  找不到 .env 文件"
    if [ -f "$ENV_EXAMPLE" ]; then
        echo "📋 正在從 .env.example 創建 .env 文件..."
        cp "$ENV_EXAMPLE" "$ENV_FILE"
        echo "✅ 已創建 .env 文件"
    else
        echo "❌ 找不到 .env.example 文件"
        exit 1
    fi
fi

echo "📄 .env 文件位置: $ENV_FILE"
echo

# 檢查 API 密鑰是否已設置
check_env_var() {
    local var_name=$1
    local var_value=$(grep "^${var_name}=" "$ENV_FILE" | cut -d '=' -f2-)
    
    if [ -z "$var_value" ] || [[ "$var_value" == *"your_"* ]] || [[ "$var_value" == *"_here"* ]]; then
        echo "❌ $var_name 未設置或使用預設值"
        return 1
    else
        # 只顯示前8個字符
        local masked_value="${var_value:0:8}..."
        echo "✅ $var_name 已設置: $masked_value"
        return 0
    fi
}

echo "檢查必要的 API 密鑰:"
echo "────────────────────────────────────────────"

all_set=true

if ! check_env_var "SILICONFLOW_API_KEY"; then
    all_set=false
fi

if ! check_env_var "GROQ_API_KEY"; then
    all_set=false
fi

if ! check_env_var "GEMINI_API_KEY"; then
    all_set=false
fi

echo "────────────────────────────────────────────"
echo

if [ "$all_set" = true ]; then
    echo "🎉 所有必要的 API 密鑰都已設置！"
    echo
    echo "你現在可以執行以下命令來使用 AI 工具:"
    echo "  1. 多角色驗證: .github/workflows/trvicerp-goose-config/scripts/multi-role-ralph-loop.sh"
    echo "  2. 智能修復: .github/workflows/trvicerp-goose-config/scripts/smart-ralph-loop.sh"
else
    echo "⚠️  請在 .env 文件中設置缺少的 API 密鑰"
    echo
    echo "編輯 .env 文件:"
    echo "  nano $ENV_FILE"
    echo
    echo "或使用 VS Code:"
    echo "  code $ENV_FILE"
    echo
    echo "需要設置的變數:"
    echo "  - SILICONFLOW_API_KEY: SiliconFlow API 密鑰"
    echo "  - GROQ_API_KEY: Groq API 密鑰"
    echo "  - GEMINI_API_KEY: Google Gemini API 密鑰"
    echo
    echo "設置完成後，請重新運行此腳本進行驗證。"
fi

echo
echo "════════════════════════════════════════════"
