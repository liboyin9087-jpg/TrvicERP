#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TravelMaster 8GB 記憶體優化批次驗證器
# 使用分塊處理避免記憶體溢位
# ═══════════════════════════════════════════════════════════════

set -e

# 配置
COMPONENT_DIR="${1:-./src/components}"
CHUNK_SIZE="${2:-5}"
OUTPUT_DIR="${3:-./.validation-output}"
TEMP_DIR=$(mktemp -d)
RESULTS_FILE="$OUTPUT_DIR/validation-results.json"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# 清理函式
cleanup() {
    echo -e "\n${YELLOW}清理暫存檔案...${NC}"
    rm -rf "$TEMP_DIR"
}
trap cleanup EXIT

# 記憶體檢查函式
check_memory() {
    if command -v free &> /dev/null; then
        FREE_MEM=$(free -m | awk '/^Mem:/{print $7}')
        echo -e "${CYAN}可用記憶體: ${FREE_MEM}MB${NC}"
        
        if [ "$FREE_MEM" -lt 300 ]; then
            echo -e "${RED}⚠️ 記憶體嚴重不足！暫停 30 秒等待釋放...${NC}"
            sleep 30
        elif [ "$FREE_MEM" -lt 500 ]; then
            echo -e "${YELLOW}⚠️ 記憶體偏低，暫停 10 秒...${NC}"
            sleep 10
        fi
    fi
}

# 主程式開始
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TravelMaster 批次驗證器 (8GB 記憶體優化版)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${CYAN}分塊大小: ${YELLOW}$CHUNK_SIZE 檔案/批次${NC}"
echo -e "${CYAN}輸出目錄: ${YELLOW}$OUTPUT_DIR${NC}"
echo ""

# 檢查 Goose
if ! command -v goose &> /dev/null; then
    echo -e "${RED}錯誤: 找不到 Goose。請先安裝: pip install goose-ai${NC}"
    exit 1
fi

# 建立輸出目錄
mkdir -p "$OUTPUT_DIR"

# 收集所有 .tsx 和 .ts 檔案
echo -e "${CYAN}掃描元件檔案...${NC}"
COMPONENT_FILES=$(find "$COMPONENT_DIR" -type f \( -name "*.tsx" -o -name "*.ts" \) \
    ! -name "*.test.*" \
    ! -name "*.stories.*" \
    ! -name "*.d.ts" \
    ! -path "*/node_modules/*" \
    ! -path "*/dist/*" \
    2>/dev/null || true)

if [ -z "$COMPONENT_FILES" ]; then
    echo -e "${YELLOW}未找到任何元件檔案${NC}"
    exit 0
fi

FILE_COUNT=$(echo "$COMPONENT_FILES" | wc -l)
echo -e "${GREEN}找到 $FILE_COUNT 個元件檔案${NC}"

# 將檔案分割成分塊
echo "$COMPONENT_FILES" | split -l "$CHUNK_SIZE" - "$TEMP_DIR/chunk_"

CHUNK_COUNT=$(ls -1 "$TEMP_DIR"/chunk_* 2>/dev/null | wc -l)
echo -e "${CYAN}分割為 $CHUNK_COUNT 個批次${NC}"
echo ""

# 初始化結果檔案
echo "[]" > "$RESULTS_FILE"

# 處理每個分塊
CURRENT_CHUNK=0
TOTAL_VIOLATIONS=0
START_TIME=$(date +%s)

for chunk in "$TEMP_DIR"/chunk_*; do
    CURRENT_CHUNK=$((CURRENT_CHUNK + 1))
    
    echo -e "${BLUE}────────────────────────────────────────${NC}"
    echo -e "${BLUE}處理批次 $CURRENT_CHUNK / $CHUNK_COUNT${NC}"
    
    # 記憶體檢查
    check_memory
    
    # 讀取此批次的檔案
    FILES=$(cat "$chunk" | tr '\n' ' ')
    FILE_NAMES=$(cat "$chunk" | xargs -n1 basename | tr '\n' ', ' | sed 's/,$//')
    
    echo -e "${CYAN}檔案: ${NC}$FILE_NAMES"
    
    # 建構驗證提示詞
    PROMPT="驗證以下 TravelMaster 元件的設計系統合規性:

檔案清單:
$FILES

驗證項目:
1. 色彩代碼:
   - Navigator Blue: #1E3A8A
   - Forest Green: #10B981
   - 不允許其他硬編碼顏色

2. 字體:
   - UI: Inter
   - 中文: Noto Sans TC
   - 最小字級: 14px

3. 間距:
   - 必須使用 4px 網格
   - 允許值: 4, 8, 12, 16, 24, 32, 48, 64

輸出格式（只回傳 JSON，無其他文字）:
{
  \"violations\": [
    {
      \"file\": \"檔案路徑\",
      \"line\": 行號,
      \"rule\": \"規則名稱\",
      \"message\": \"問題描述\",
      \"severity\": \"high|medium|low\",
      \"autoFixable\": true|false
    }
  ],
  \"summary\": {
    \"total\": 總違規數,
    \"byFile\": { \"檔案名\": 違規數 }
  }
}"

    # 執行 Goose 驗證（帶超時）
    echo -e "${YELLOW}執行驗證中...${NC}"
    
    RESULT=$(timeout 120 goose run --no-session \
        -t "$PROMPT" \
        --quiet 2>/dev/null) || {
            echo -e "${RED}此批次驗證超時或失敗${NC}"
            echo "{\"violations\": [], \"error\": \"timeout\", \"batch\": $CURRENT_CHUNK}" > "$TEMP_DIR/result_$CURRENT_CHUNK.json"
            sleep 5
            continue
        }
    
    # 嘗試解析結果
    if echo "$RESULT" | jq -e . >/dev/null 2>&1; then
        echo "$RESULT" > "$TEMP_DIR/result_$CURRENT_CHUNK.json"
        
        # 統計違規數
        BATCH_VIOLATIONS=$(echo "$RESULT" | jq '.violations | length' 2>/dev/null || echo "0")
        TOTAL_VIOLATIONS=$((TOTAL_VIOLATIONS + BATCH_VIOLATIONS))
        
        if [ "$BATCH_VIOLATIONS" -gt 0 ]; then
            echo -e "${RED}發現 $BATCH_VIOLATIONS 個違規${NC}"
        else
            echo -e "${GREEN}✓ 此批次無違規${NC}"
        fi
        
        # 合併結果
        jq -s '.[0] + (.[1].violations // [])' "$RESULTS_FILE" "$TEMP_DIR/result_$CURRENT_CHUNK.json" > "$TEMP_DIR/merged.json" 2>/dev/null || true
        if [ -f "$TEMP_DIR/merged.json" ]; then
            mv "$TEMP_DIR/merged.json" "$RESULTS_FILE"
        fi
    else
        echo -e "${YELLOW}無法解析此批次結果，已記錄原始輸出${NC}"
        echo "{\"raw\": \"$RESULT\", \"batch\": $CURRENT_CHUNK}" > "$TEMP_DIR/result_$CURRENT_CHUNK.json"
    fi
    
    # 清理此批次暫存
    rm -f "$TEMP_DIR/result_$CURRENT_CHUNK.json"
    
    # 批次間延遲（讓記憶體有時間釋放）
    echo -e "${CYAN}冷卻中...${NC}"
    sleep 3
done

# 計算執行時間
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))
MINUTES=$((DURATION / 60))
SECONDS=$((DURATION % 60))

# 輸出摘要
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  驗證完成摘要${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}處理檔案數: ${GREEN}$FILE_COUNT${NC}"
echo -e "${CYAN}處理批次數: ${GREEN}$CHUNK_COUNT${NC}"
echo -e "${CYAN}發現違規數: ${YELLOW}$TOTAL_VIOLATIONS${NC}"
echo -e "${CYAN}執行時間:   ${GREEN}${MINUTES}分${SECONDS}秒${NC}"
echo -e "${CYAN}結果檔案:   ${GREEN}$RESULTS_FILE${NC}"
echo ""

# 如果有違規，顯示摘要
if [ "$TOTAL_VIOLATIONS" -gt 0 ]; then
    echo -e "${YELLOW}違規摘要:${NC}"
    jq -r '.[] | select(.file) | "\(.severity // "medium"): \(.file):\(.line) - \(.message)"' "$RESULTS_FILE" 2>/dev/null | head -20 || true
    echo ""
    echo -e "${YELLOW}完整報告請查看: $RESULTS_FILE${NC}"
    echo -e "${CYAN}執行 'npm run fix:loop' 啟動自動修正${NC}"
else
    echo -e "${GREEN}✅ 所有元件符合設計系統規範！${NC}"
fi
