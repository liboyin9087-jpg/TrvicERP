#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TrvicERP Goose 自動化工具 - 快速設定腳本
# ═══════════════════════════════════════════════════════════════

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TrvicERP Goose 自動化工具 - 安裝程式${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# 步驟 1: 檢查 Python
echo -e "${CYAN}步驟 1/5: 檢查 Python...${NC}"
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1 | cut -d' ' -f2)
    echo -e "${GREEN}✓ Python $PYTHON_VERSION 已安裝${NC}"
else
    echo -e "${RED}✗ 未找到 Python 3。請先安裝 Python 3.8 或更新版本${NC}"
    exit 1
fi

# 步驟 2: 安裝 Goose
echo ""
echo -e "${CYAN}步驟 2/5: 安裝 Goose...${NC}"
if command -v goose &> /dev/null; then
    GOOSE_VERSION=$(goose --version 2>&1 || echo "unknown")
    echo -e "${GREEN}✓ Goose 已安裝: $GOOSE_VERSION${NC}"
else
    echo -e "${YELLOW}正在安裝 Goose...${NC}"
    pip3 install goose-ai --user
    
    if command -v goose &> /dev/null; then
        echo -e "${GREEN}✓ Goose 安裝成功${NC}"
    else
        echo -e "${RED}✗ Goose 安裝失敗。請手動執行: pip install goose-ai${NC}"
        exit 1
    fi
fi

# 步驟 3: 設定 Goose 配置
echo ""
echo -e "${CYAN}步驟 3/5: 設定 Goose 配置...${NC}"

GOOSE_CONFIG_DIR="$HOME/.config/goose"
mkdir -p "$GOOSE_CONFIG_DIR"

# 檢查 API Key
if [ -z "$SILICONFLOW_API_KEY" ] && [ -z "$OPENAI_API_KEY" ]; then
    echo -e "${YELLOW}請輸入你的 SiliconFlow API Key:${NC}"
    read -r API_KEY
    if [ -z "$API_KEY" ]; then
        echo -e "${RED}未提供 API Key，跳過配置${NC}"
    else
        echo "export SILICONFLOW_API_KEY=\"$API_KEY\"" >> "$HOME/.bashrc"
        echo "export OPENAI_API_KEY=\"$API_KEY\"" >> "$HOME/.bashrc"
        export SILICONFLOW_API_KEY="$API_KEY"
        export OPENAI_API_KEY="$API_KEY"
        echo -e "${GREEN}✓ API Key 已儲存至 ~/.bashrc${NC}"
    fi
else
    echo -e "${GREEN}✓ API Key 已設定${NC}"
fi

# 複製配置檔案
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
if [ -f "$SCRIPT_DIR/goose-config.yaml" ]; then
    cp "$SCRIPT_DIR/goose-config.yaml" "$GOOSE_CONFIG_DIR/config.yaml"
    
    # 替換 API Key 佔位符
    if [ -n "$SILICONFLOW_API_KEY" ]; then
        sed -i "s/\${SILICONFLOW_API_KEY}/$SILICONFLOW_API_KEY/g" "$GOOSE_CONFIG_DIR/config.yaml" 2>/dev/null || \
        sed -i '' "s/\${SILICONFLOW_API_KEY}/$SILICONFLOW_API_KEY/g" "$GOOSE_CONFIG_DIR/config.yaml" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ Goose 配置已複製至 $GOOSE_CONFIG_DIR/config.yaml${NC}"
else
    echo -e "${YELLOW}⚠️ 找不到 goose-config.yaml，請手動複製配置${NC}"
fi

# 步驟 4: 設定腳本權限
echo ""
echo -e "${CYAN}步驟 4/5: 設定腳本權限...${NC}"
if [ -d "$SCRIPT_DIR/scripts" ]; then
    chmod +x "$SCRIPT_DIR/scripts/"*.sh 2>/dev/null || true
    echo -e "${GREEN}✓ 腳本權限已設定${NC}"
fi

# 步驟 5: 驗證安裝
echo ""
echo -e "${CYAN}步驟 5/5: 驗證安裝...${NC}"

# 測試 Goose 連線
echo -e "${YELLOW}測試 Goose 與 SiliconFlow 連線...${NC}"
TEST_RESULT=$(timeout 30 goose run --no-session -t "回覆「OK」兩個字" --quiet 2>&1) || true

if echo "$TEST_RESULT" | grep -qi "OK"; then
    echo -e "${GREEN}✓ Goose 與 SiliconFlow 連線成功${NC}"
else
    echo -e "${YELLOW}⚠️ 連線測試未能確認成功，但配置已完成${NC}"
    echo -e "${YELLOW}   請確認 API Key 正確後手動測試${NC}"
fi

# 完成
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  安裝完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${CYAN}接下來你可以:${NC}"
echo ""
echo -e "  ${YELLOW}1. 執行完整驗證:${NC}"
echo -e "     ./scripts/batch-validate.sh ./src/components"
echo ""
echo -e "  ${YELLOW}2. 執行自動修正迴圈:${NC}"
echo -e "     ./scripts/ralph-loop.sh 20 ./src/components"
echo ""
echo -e "  ${YELLOW}3. 執行多角色審查:${NC}"
echo -e "     goose run --recipe recipes/multi-role-verify.yaml"
echo ""
echo -e "${CYAN}更多資訊請參閱 README.md${NC}"
