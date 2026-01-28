#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Ralph Loop 實作 - 持續執行直到所有驗證通過
# TrvicERP UI 元件自動修正迴圈
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-20}
COMPONENT_DIR=${2:-"./src/components"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"
COMPLETION_MARKER="<promise>VALIDATION_COMPLETE</promise>"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TrvicERP UI 驗證 - Ralph Loop 執行器${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 檢查 Goose 是否安裝
if ! command -v /workspaces/TrvicERP/.venv/bin/goose &> /dev/null; then
    echo -e "${RED}錯誤: 找不到 Goose。請先安裝: pip install goose-ai${NC}"
    exit 1
fi

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始驗證迴圈" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 記憶體檢查函式
check_memory() {
    if command -v free &> /dev/null; then
        FREE_MEM=$(free -m | awk '/^Mem:/{print $7}')
        if [ "$FREE_MEM" -lt 500 ]; then
            echo -e "${YELLOW}⚠️ 可用記憶體低於 500MB ($FREE_MEM MB)，暫停 10 秒...${NC}"
            sleep 10
        fi
    fi
}

# 主迴圈
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}══════════════ 第 $i 次迭代（共 $MAX_ITERATIONS 次）══════════════${NC}"
    
    # 記憶體檢查
    check_memory
    
    # 執行 Goose 驗證
    echo -e "${YELLOW}正在執行驗證...${NC}"
    
    OUTPUT=$(timeout 300 /workspaces/TrvicERP/.venv/bin/goose run \
        --recipe "$SCRIPT_DIR/../recipes/validate-and-fix.yaml" \
        --params target="$COMPONENT_DIR" \
        --params iteration="$i" \
        --with-builtin developer \
        --quiet 2>&1 | tee /dev/stderr) || {
            echo -e "${YELLOW}Goose 執行超時或發生錯誤，繼續下一次迭代...${NC}"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 超時/錯誤" >> "$PROGRESS_FILE"
            sleep 5
            continue
        }
    
    # 記錄進度
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代完成" >> "$PROGRESS_FILE"
    
    # 檢查完成標記
    if echo "$OUTPUT" | grep -q "$COMPLETION_MARKER"; then
        echo ""
        echo -e "${GREEN}✅ 所有驗證通過！共執行 $i 次迭代。${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 完成 ✓" >> "$PROGRESS_FILE"
        
        # 顯示修改統計
        if command -v git &> /dev/null && git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            echo ""
            echo -e "${BLUE}修改統計:${NC}"
            git diff --stat HEAD~$i 2>/dev/null || echo "無 Git 變更記錄"
        fi
        
        exit 0
    fi
    
    # 檢查無進展斷路器
    if [ $i -gt 3 ]; then
        if command -v git &> /dev/null && git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            RECENT_CHANGES=$(git diff --name-only HEAD~1 2>/dev/null | wc -l || echo "0")
            if [ "$RECENT_CHANGES" = "0" ]; then
                NO_CHANGE_COUNT=$((NO_CHANGE_COUNT + 1))
                if [ $NO_CHANGE_COUNT -ge 3 ]; then
                    echo -e "${RED}⚠️ 斷路器觸發：連續 3 次迭代無變更${NC}"
                    echo "$(date '+%Y-%m-%d %H:%M:%S') - 斷路器觸發" >> "$PROGRESS_FILE"
                    echo ""
                    echo "可能的原因:"
                    echo "1. 存在無法自動修復的問題"
                    echo "2. 驗證規則過於嚴格"
                    echo "3. 需要人工介入"
                    exit 1
                fi
            else
                NO_CHANGE_COUNT=0
            fi
        fi
    fi
    
    # API 速率限制延遲
    echo -e "${YELLOW}等待 API 冷卻...${NC}"
    sleep 3
done

echo ""
echo -e "${YELLOW}⚠️ 達到最大迭代次數 ($MAX_ITERATIONS) 但未完全完成${NC}"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 達到最大迭代" >> "$PROGRESS_FILE"

echo ""
echo "建議操作:"
echo "1. 檢查 .validation-progress.log 瞭解詳情"
echo "2. 手動修復剩餘問題"
echo "3. 增加 MAX_ITERATIONS 後重新執行"
exit 1
