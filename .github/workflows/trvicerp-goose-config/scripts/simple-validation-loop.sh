#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TrvicERP UI 元件驗證與修正腳本 - 不依賴 Goose
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-10}
COMPONENT_DIR=${2:-"../../../src/components"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TrvicERP UI 驗證 - 直接驗證迴圈${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始驗證迴圈" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 切換到專案根目錄
cd /workspaces/TrvicERP

# 驗證函式
run_validation() {
    local errors=0
    
    echo -e "${YELLOW}執行 TypeScript 類型檢查...${NC}"
    if npm run build:check 2>/dev/null; then
        echo -e "${GREEN}✓ TypeScript 檢查通過${NC}"
    else
        echo -e "${RED}✗ TypeScript 檢查失敗${NC}"
        errors=$((errors + 1))
    fi
    
    echo -e "${YELLOW}執行 ESLint 檢查...${NC}"
    if npm run lint 2>/dev/null; then
        echo -e "${GREEN}✓ ESLint 檢查通過${NC}"
    else
        echo -e "${RED}✗ ESLint 檢查失敗，嘗試自動修復...${NC}"
        npm run lint:fix 2>/dev/null || true
        errors=$((errors + 1))
    fi
    
    echo -e "${YELLOW}檢查硬編碼顏色...${NC}"
    if ! grep -rn --include="*.tsx" --include="*.ts" -E "#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}" src/components 2>/dev/null; then
        echo -e "${GREEN}✓ 無硬編碼顏色${NC}"
    else
        echo -e "${RED}✗ 發現硬編碼顏色，請使用設計代幣${NC}"
        errors=$((errors + 1))
    fi
    
    return $errors
}

# 自動修復函式
auto_fix() {
    echo -e "${YELLOW}執行自動修復...${NC}"
    
    # 自動修復 ESLint 問題
    npm run lint:fix 2>/dev/null || true
    
    # 自動整理 imports
    if command -v organize-imports-cli &> /dev/null; then
        organize-imports-cli src/components/**/*.{ts,tsx} 2>/dev/null || true
    fi
    
    # 自動格式化
    if command -v prettier &> /dev/null; then
        npx prettier --write "src/components/**/*.{ts,tsx}" 2>/dev/null || true
    fi
    
    echo -e "${GREEN}✓ 自動修復完成${NC}"
}

# 主迴圈
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}══════════════ 第 $i 次迭代（共 $MAX_ITERATIONS 次）══════════════${NC}"
    
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
    else
        echo -e "${YELLOW}發現問題，執行自動修復...${NC}"
        auto_fix
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 執行修復" >> "$PROGRESS_FILE"
        sleep 1
    fi
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