#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Ralph Loop 實作 - 持續執行直到所有驗證通過
# TravelMaster UI 元件自動修正迴圈
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
echo -e "${BLUE}  TravelMaster UI 驗證 - Ralph Loop 執行器${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 設置工作目錄
cd /workspaces/TravelMaster

# 檢查 npm 是否安裝
if ! command -v npm &> /dev/null; then
    echo -e "${RED}錯誤: 找不到 npm。請先安裝 Node.js${NC}"
    exit 1
fi

# 設置 API 金鑰（如有需要）
export SILICONFLOW_API_KEY="${SILICONFLOW_API_KEY:-I0S0yXiJpLKhQPmDh1bQCkbjme0FP6}"
export FIGMA_API_KEY="${FIGMA_API_KEY:-hdTVUg8vJB3C1BcqURZnEf}"
echo -e "${GREEN}✓ 環境已設置${NC}"

# 驗證函式
run_validation() {
    local errors=0
    
    echo -e "${YELLOW}[1/3] TypeScript 類型檢查...${NC}"
    if npx tsc --noEmit 2>&1; then
        echo -e "${GREEN}✓ TypeScript 檢查通過${NC}"
    else
        echo -e "${RED}✗ TypeScript 有錯誤${NC}"
        errors=$((errors + 1))
    fi
    
    echo -e "${YELLOW}[2/3] ESLint 檢查...${NC}"
    if npx eslint "$COMPONENT_DIR" --ext .ts,.tsx 2>&1; then
        echo -e "${GREEN}✓ ESLint 檢查通過${NC}"
    else
        echo -e "${YELLOW}⚠ ESLint 有警告或錯誤，嘗試自動修復...${NC}"
        npx eslint "$COMPONENT_DIR" --ext .ts,.tsx --fix 2>&1 || true
        errors=$((errors + 1))
    fi
    
    echo -e "${YELLOW}[3/3] 硬編碼顏色檢查...${NC}"
    HARD_CODED=$(grep -rn --include="*.tsx" --include="*.ts" -E "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}" "$COMPONENT_DIR" 2>/dev/null | wc -l || echo "0")
    if [ "$HARD_CODED" -eq 0 ]; then
        echo -e "${GREEN}✓ 無硬編碼顏色${NC}"
    else
        echo -e "${YELLOW}⚠ 發現 $HARD_CODED 處硬編碼顏色${NC}"
        grep -rn --include="*.tsx" --include="*.ts" -E "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}" "$COMPONENT_DIR" 2>/dev/null | head -10
    fi
    
    return $errors
}

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
    
    # 執行驗證
    echo -e "${YELLOW}正在執行驗證...${NC}"
    
    if run_validation; then
        echo ""
        echo -e "${GREEN}✅ 所有驗證通過！共執行 $i 次迭代。${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 完成 ✓" >> "$PROGRESS_FILE"
        
        # 顯示修改統計
        if command -v git &> /dev/null && git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
            echo ""
            echo -e "${BLUE}修改統計:${NC}"
            git diff --stat 2>/dev/null || echo "無變更記錄"
        fi
        
        exit 0
    fi
    
    echo -e "${YELLOW}發現問題，等待下一次迭代...${NC}"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 有錯誤待修復" >> "$PROGRESS_FILE"
    
    # API 速率限制延遲
    echo -e "${YELLOW}等待冷卻...${NC}"
    sleep 2
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
