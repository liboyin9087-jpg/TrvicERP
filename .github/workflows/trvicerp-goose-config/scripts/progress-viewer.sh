#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TrvicERP 進度查看器
# ═══════════════════════════════════════════════════════════════

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROGRESS_DIR="$SCRIPT_DIR/../progress"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}             TrvicERP 檔案修正進度監控面板${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

if [[ ! -d "$PROGRESS_DIR" ]]; then
    echo -e "${RED}❌ 進度目錄不存在: $PROGRESS_DIR${NC}"
    exit 1
fi

# 檢查進度檔案
SUMMARY_FILE="$PROGRESS_DIR/summary.json"
CURRENT_FILE="$PROGRESS_DIR/current.txt"
COMPLETED_FILE="$PROGRESS_DIR/completed.txt"
FAILED_FILE="$PROGRESS_DIR/failed.txt"

if [[ ! -f "$SUMMARY_FILE" ]]; then
    echo -e "${YELLOW}⚠️  尚未開始修正或進度檔案不存在${NC}"
    exit 1
fi

# 讀取進度摘要
echo -e "${CYAN}📊 進度摘要:${NC}"
cat "$SUMMARY_FILE" | python3 -m json.tool

echo -e "\n${CYAN}🔄 目前狀態:${NC}"
if [[ -f "$CURRENT_FILE" ]]; then
    cat "$CURRENT_FILE"
else
    echo "無當前處理檔案"
fi

echo -e "\n${GREEN}✅ 已完成檔案數量:${NC}"
if [[ -f "$COMPLETED_FILE" ]]; then
    completed_count=$(wc -l < "$COMPLETED_FILE")
    echo "$completed_count 個檔案"
    
    if [[ "$1" == "--show-completed" ]]; then
        echo -e "\n${GREEN}完成清單 (最後10個):${NC}"
        tail -10 "$COMPLETED_FILE"
    fi
else
    echo "0 個檔案"
fi

echo -e "\n${RED}❌ 失敗檔案數量:${NC}"
if [[ -f "$FAILED_FILE" ]]; then
    failed_count=$(wc -l < "$FAILED_FILE")
    echo "$failed_count 個檔案"
    
    if [[ "$1" == "--show-failed" ]]; then
        echo -e "\n${RED}失敗清單:${NC}"
        cat "$FAILED_FILE"
    fi
else
    echo "0 個檔案"
fi

# 顯示剩餘檔案
echo -e "\n${YELLOW}📋 剩餘待處理檔案:${NC}"
remaining=$(python3 -c "
import json
try:
    with open('$SUMMARY_FILE', 'r') as f:
        data = json.load(f)
    remaining = len(data.get('remaining_files', []))
    print(f'{remaining} 個檔案')
    
    if '$1' == '--show-remaining':
        print('\\n📝 剩餘檔案清單 (前20個):')
        for i, file in enumerate(data.get('remaining_files', [])[:20]):
            print(f'   {i+1}. {file}')
        if remaining > 20:
            print(f'   ... 還有 {remaining-20} 個檔案')
except Exception as e:
    print(f'讀取錯誤: {e}')
")

echo "$remaining"

echo -e "\n${CYAN}💡 使用說明:${NC}"
echo "  --show-completed  : 顯示已完成檔案清單"
echo "  --show-failed     : 顯示失敗檔案清單"
echo "  --show-remaining  : 顯示剩餘檔案清單"
echo ""
echo -e "${CYAN}即時監控:${NC}"
echo "  tail -f /tmp/ralph_complete.log"
echo "  watch -n 5 $0"

echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"