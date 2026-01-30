#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TravelMaster Goose + Ollama 本地開源模型設定
#
# 用途：下載並配置 Ollama，使用本地開源模型執行 Goose QA
#       無需雲端 API，完全離線運行
#
# 使用方式：
#   bash setup-ollama.sh [模型名稱]
#
# 推薦模型（依記憶體需求排序）：
#   - qwen2.5-coder:14b  (8.7GB) - 推薦，程式碼任務表現優異
#   - qwen2.5-coder:7b   (4.7GB) - 輕量版，記憶體較少時使用
#   - codellama:13b       (7.4GB) - Meta 程式碼模型
#   - deepseek-coder-v2:16b (8.9GB) - DeepSeek 程式碼模型
#   - llama3.1:8b         (4.7GB) - 通用型
#   - mistral:7b          (4.1GB) - 輕量快速
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

# ── 配置 ──────────────────────────────────────────────────────
DEFAULT_MODEL="qwen2.5-coder:14b"
MODEL=${1:-$DEFAULT_MODEL}
OLLAMA_HOST="${OLLAMA_HOST:-http://localhost:11434}"
GOOSE_CONFIG_DIR="$HOME/.config/goose"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ── 顏色 ──────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${BOLD}  $1${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
}

step() {
    echo -e "\n${BLUE}[$1/6]${NC} ${BOLD}$2${NC}"
}

# ═══════════════════════════════════════════════════════════════
header "TravelMaster Goose + Ollama 本地模型設定"
echo -e "${BLUE}  選擇模型: ${YELLOW}$MODEL${NC}"
echo -e "${BLUE}  Ollama 主機: ${YELLOW}$OLLAMA_HOST${NC}"
# ═══════════════════════════════════════════════════════════════

# ── Step 1: 檢查系統需求 ─────────────────────────────────────
step 1 "檢查系統需求"

# 檢查記憶體
TOTAL_MEM=$(free -m 2>/dev/null | awk '/^Mem:/{print $2}' || echo "0")
echo -e "  記憶體: ${CYAN}${TOTAL_MEM}MB${NC}"

if [ "$TOTAL_MEM" -lt 4000 ]; then
    echo -e "  ${RED}警告: 記憶體不足 4GB，建議使用較小模型（如 mistral:7b）${NC}"
elif [ "$TOTAL_MEM" -lt 8000 ]; then
    echo -e "  ${YELLOW}建議: 使用 7B 參數以下的模型${NC}"
else
    echo -e "  ${GREEN}記憶體充足，可使用 13B+ 模型${NC}"
fi

# 檢查磁碟空間
DISK_FREE=$(df -BG /home 2>/dev/null | awk 'NR==2{print $4}' | tr -d 'G' || echo "0")
echo -e "  可用磁碟: ${CYAN}${DISK_FREE}GB${NC}"

if [ "$DISK_FREE" -lt 10 ]; then
    echo -e "  ${RED}警告: 磁碟空間不足 10GB，模型下載可能失敗${NC}"
fi

# 檢查 GPU
if command -v nvidia-smi &>/dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "")
    if [ -n "$GPU_INFO" ]; then
        echo -e "  GPU: ${GREEN}$GPU_INFO${NC}"
    fi
elif [ -d "/dev/dri" ]; then
    echo -e "  GPU: ${YELLOW}偵測到 GPU（非 NVIDIA）${NC}"
else
    echo -e "  GPU: ${YELLOW}CPU 模式（速度較慢但可運行）${NC}"
fi

# ── Step 2: 安裝 Ollama ──────────────────────────────────────
step 2 "安裝 Ollama"

if command -v ollama &>/dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>/dev/null || echo "unknown")
    echo -e "  ${GREEN}Ollama 已安裝: $OLLAMA_VERSION${NC}"
else
    echo -e "  ${YELLOW}正在安裝 Ollama...${NC}"
    curl -fsSL https://ollama.com/install.sh | sh

    if command -v ollama &>/dev/null; then
        echo -e "  ${GREEN}Ollama 安裝成功${NC}"
    else
        echo -e "  ${RED}Ollama 安裝失敗${NC}"
        echo -e "  ${YELLOW}請手動安裝: https://ollama.com/download${NC}"
        exit 1
    fi
fi

# ── Step 3: 啟動 Ollama 服務 ─────────────────────────────────
step 3 "啟動 Ollama 服務"

# 檢查 Ollama 是否正在運行
if curl -s "$OLLAMA_HOST/api/version" >/dev/null 2>&1; then
    echo -e "  ${GREEN}Ollama 服務已在運行${NC}"
else
    echo -e "  ${YELLOW}啟動 Ollama 服務...${NC}"

    # 背景啟動
    nohup ollama serve > /tmp/ollama.log 2>&1 &
    OLLAMA_PID=$!

    # 等待服務就緒
    for i in $(seq 1 30); do
        if curl -s "$OLLAMA_HOST/api/version" >/dev/null 2>&1; then
            echo -e "  ${GREEN}Ollama 服務已啟動 (PID: $OLLAMA_PID)${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "  ${RED}Ollama 服務啟動超時${NC}"
            echo -e "  ${YELLOW}請手動執行: ollama serve${NC}"
            exit 1
        fi
    done
fi

# ── Step 4: 下載模型 ─────────────────────────────────────────
step 4 "下載模型: $MODEL"

# 檢查模型是否已存在
if ollama list 2>/dev/null | grep -q "$MODEL"; then
    echo -e "  ${GREEN}模型 $MODEL 已下載${NC}"
else
    echo -e "  ${YELLOW}正在下載 $MODEL（可能需要幾分鐘）...${NC}"
    ollama pull "$MODEL"

    if ollama list 2>/dev/null | grep -q "$MODEL"; then
        echo -e "  ${GREEN}模型下載完成${NC}"
    else
        echo -e "  ${RED}模型下載失敗${NC}"
        exit 1
    fi
fi

# 顯示已安裝的模型
echo -e "\n  ${CYAN}已安裝的模型:${NC}"
ollama list 2>/dev/null | while read -r line; do
    echo -e "    $line"
done

# ── Step 5: 配置 Goose 使用 Ollama ──────────────────────────
step 5 "配置 Goose 使用 Ollama"

mkdir -p "$GOOSE_CONFIG_DIR"

# 建立 Goose Ollama 配置
cat > "$GOOSE_CONFIG_DIR/ollama-config.yaml" << EOF
# ═══════════════════════════════════════════════════════════════
# TravelMaster Goose 配置 - Ollama 本地模型
# 由 setup-ollama.sh 自動產生: $(date '+%Y-%m-%d %H:%M:%S')
# ═══════════════════════════════════════════════════════════════

# Ollama 作為 OpenAI 相容 API
GOOSE_PROVIDER: "openai"
OPENAI_API_KEY: "ollama"               # Ollama 不需要真實 key
OPENAI_API_BASE: "${OLLAMA_HOST}/v1"   # Ollama OpenAI 相容端點
GOOSE_MODEL: "${MODEL}"

# 本地模型最佳參數
GOOSE_TEMPERATURE: 0.0           # 程式碼任務使用 0
GOOSE_MAX_TOKENS: 4096           # 元件修正足夠使用
GOOSE_TOP_P: 0.95

# 記憶體優化（本地運行更需要）
GOOSE_AUTO_COMPACT_THRESHOLD: 0.4  # 40% 時開始壓縮
GOOSE_CONTEXT_STRATEGY: "summarize"
GOOSE_CONTEXT_LIMIT: 16000         # 本地模型上下文較小
GOOSE_MAX_TURNS: 30

# 執行模式
GOOSE_MODE: "auto"
GOOSE_CLI_SHOW_COST: false         # 本地模型無成本

# 工具超時（本地可能較慢）
GOOSE_TOOL_TIMEOUT: 300            # 5 分鐘超時

# 擴充功能
extensions:
  developer:
    bundled: true
    enabled: true
    timeout: 600
EOF

echo -e "  ${GREEN}Goose Ollama 配置已寫入: $GOOSE_CONFIG_DIR/ollama-config.yaml${NC}"

# 同時產生專案內的配置
PROJ_CONFIG="$SCRIPT_DIR/../goose-ollama-config.yaml"
cp "$GOOSE_CONFIG_DIR/ollama-config.yaml" "$PROJ_CONFIG"
echo -e "  ${GREEN}專案配置同步: $PROJ_CONFIG${NC}"

# 建立環境變數腳本
cat > "$SCRIPT_DIR/ollama-env.sh" << 'ENVEOF'
#!/bin/bash
# Ollama 環境變數 - source 此檔案後執行 Goose
export GOOSE_PROVIDER="openai"
export OPENAI_API_KEY="ollama"
export OPENAI_API_BASE="http://localhost:11434/v1"
ENVEOF

# 動態寫入模型名稱
echo "export GOOSE_MODEL=\"${MODEL}\"" >> "$SCRIPT_DIR/ollama-env.sh"

cat >> "$SCRIPT_DIR/ollama-env.sh" << 'ENVEOF'
export GOOSE_TEMPERATURE="0.0"
export GOOSE_MAX_TOKENS="4096"
export GOOSE_MODE="auto"

echo "Ollama 環境變數已設定:"
echo "  GOOSE_PROVIDER=$GOOSE_PROVIDER"
echo "  OPENAI_API_BASE=$OPENAI_API_BASE"
echo "  GOOSE_MODEL=$GOOSE_MODEL"
ENVEOF

chmod +x "$SCRIPT_DIR/ollama-env.sh"
echo -e "  ${GREEN}環境變數腳本: $SCRIPT_DIR/ollama-env.sh${NC}"

# ── Step 6: 驗證連線 ─────────────────────────────────────────
step 6 "驗證 Ollama 連線"

# 測試 API
echo -e "  ${YELLOW}測試 Ollama API...${NC}"
TEST_RESPONSE=$(curl -s "$OLLAMA_HOST/api/generate" \
    -d "{\"model\": \"$MODEL\", \"prompt\": \"Say OK\", \"stream\": false}" 2>&1)

if echo "$TEST_RESPONSE" | grep -q "response"; then
    echo -e "  ${GREEN}Ollama API 回應正常${NC}"
else
    echo -e "  ${YELLOW}Ollama API 測試結果: $TEST_RESPONSE${NC}"
    echo -e "  ${YELLOW}模型可能仍在載入中，請稍候再試${NC}"
fi

# 測試 OpenAI 相容端點（Goose 使用）
echo -e "  ${YELLOW}測試 OpenAI 相容端點...${NC}"
OAI_RESPONSE=$(curl -s "$OLLAMA_HOST/v1/models" 2>&1)

if echo "$OAI_RESPONSE" | grep -q "data"; then
    echo -e "  ${GREEN}OpenAI 相容端點正常${NC}"
else
    echo -e "  ${YELLOW}OpenAI 相容端點測試: $OAI_RESPONSE${NC}"
fi

# ═══════════════════════════════════════════════════════════════
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Ollama + Goose 設定完成！                                  ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BOLD}快速使用指南:${NC}"
echo ""
echo -e "${CYAN}1. 啟用 Ollama 環境:${NC}"
echo -e "   source $SCRIPT_DIR/ollama-env.sh"
echo ""
echo -e "${CYAN}2. 執行 Goose QA 迴圈:${NC}"
echo -e "   source $SCRIPT_DIR/ollama-env.sh && goose run --recipe $SCRIPT_DIR/../recipes/qa-production-readiness.yaml"
echo ""
echo -e "${CYAN}3. 執行 Shell QA 迴圈（不需要 Goose）:${NC}"
echo -e "   bash $SCRIPT_DIR/goose-qa-loop.sh --auto-fix --report"
echo ""
echo -e "${CYAN}4. 使用 npm script:${NC}"
echo -e "   npm run qa              # 單次檢查"
echo -e "   npm run qa:fix          # 自動修復迴圈"
echo -e "   npm run qa:report       # 產生報告"
echo -e "   npm run qa:goose        # Goose + Ollama 迴圈"
echo ""
echo -e "${CYAN}5. 管理 Ollama:${NC}"
echo -e "   ollama list             # 查看已下載模型"
echo -e "   ollama pull <model>     # 下載新模型"
echo -e "   ollama rm <model>       # 刪除模型"
echo -e "   ollama serve            # 啟動服務"
echo ""
echo -e "${YELLOW}推薦的額外模型:${NC}"
echo -e "   ollama pull codellama:13b          # Meta 程式碼專用"
echo -e "   ollama pull deepseek-coder-v2:16b  # DeepSeek 程式碼模型"
echo -e "   ollama pull qwen2.5-coder:32b      # 更大更準確（需 16GB+ RAM）"
echo ""
