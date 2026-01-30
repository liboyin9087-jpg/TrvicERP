#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Ralph Loop 實作 - 持續執行直到所有驗證通過
# TravelMaster UI 元件自動修正迴圈 (修正版)
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-20}
COMPONENT_DIR=${2:-"/workspaces/TravelMaster/components/shared"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"
COMPLETION_MARKER="<promise>VALIDATION_COMPLETE</promise>"
TASK_FILE="$SCRIPT_DIR/../validation-task.md"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TravelMaster UI 驗證 - Ralph Loop 執行器 (修正版)${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 檢查 Goose 是否安裝
if ! command -v /workspaces/TravelMaster/.venv/bin/goose &> /dev/null; then
    echo -e "${RED}錯誤: 找不到 Goose。請先安裝: pip install goose-ai${NC}"
    exit 1
fi

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始驗證迴圈" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 記憶體檢查函數
check_memory() {
    FREE_MEM=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$FREE_MEM" -lt 1000 ]; then
        echo -e "${YELLOW}警告: 可用記憶體低於 1GB ($FREE_MEM MB)，稍等 10 秒...${NC}"
        sleep 10
    fi
}

# 創建任務文件副本並替換參數
create_task_file() {
    local iteration=$1
    local temp_task="/tmp/validation-task-$iteration.md"
    
    # 替換模板參數
    sed "s|{{TARGET_DIR}}|$COMPONENT_DIR|g; s|{{ITERATION}}|$iteration|g" "$TASK_FILE" > "$temp_task"
    echo "$temp_task"
}

# 主迴圈
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}══════════════ 第 $i 次迭代（共 $MAX_ITERATIONS 次）══════════════${NC}"
    
    # 記憶體檢查
    check_memory
    
    # 創建當前迭代的任務文件
    CURRENT_TASK=$(create_task_file $i)
    
    # 執行 Goose 驗證
    echo -e "${YELLOW}正在執行驗證...${NC}"
    
    cd /workspaces/TravelMaster
    OUTPUT=$(timeout 300 /workspaces/TravelMaster/.venv/bin/goose run \
        --profile default \
        "$CURRENT_TASK" 2>&1 | tee /dev/stderr) || {
            echo -e "${YELLOW}Goose 執行超時或發生錯誤，繼續下一次迭代...${NC}"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 超時/錯誤" >> "$PROGRESS_FILE"
            rm -f "$CURRENT_TASK"
            sleep 5
            continue
        }
    
    # 清理臨時文件
    rm -f "$CURRENT_TASK"
    
    # 記錄進度
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代完成" >> "$PROGRESS_FILE"
    
    # 檢查完成標記
    if echo "$OUTPUT" | grep -q "$COMPLETION_MARKER"; then
        echo ""
        echo -e "${GREEN}✅ 驗證完成！所有檢查都通過了。${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 驗證成功完成於第 $i 次迭代" >> "$PROGRESS_FILE"
        exit 0
    fi
    
    # 檢查是否有實質進展
    if [ "$i" -gt 3 ] && [ $((i % 3)) -eq 0 ]; then
        echo -e "${YELLOW}檢查進展中...${NC}"
        RECENT_ERRORS=$(tail -3 "$PROGRESS_FILE" | grep -c "錯誤\|失敗" || true)
        if [ "$RECENT_ERRORS" -eq 3 ]; then
            echo -e "${YELLOW}警告: 連續 3 次迭代無明顯進展，將繼續執行...${NC}"
        fi
    fi
    
    # 迭代間延遲，讓系統喘息
    echo -e "${BLUE}迭代 $i 完成，等待 3 秒後繼續...${NC}"
    sleep 3
done

# 達到最大迭代次數
echo ""
echo -e "${RED}❌ 達到最大迭代次數 ($MAX_ITERATIONS)，驗證未完成${NC}"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 達到最大迭代次數，驗證未完成" >> "$PROGRESS_FILE"

echo ""
echo -e "${YELLOW}請檢查進度日誌: $PROGRESS_FILE${NC}"
exit 1