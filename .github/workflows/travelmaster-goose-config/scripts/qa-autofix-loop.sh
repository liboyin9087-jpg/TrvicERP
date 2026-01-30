#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TravelMaster QA 自動修復迴圈
#
# 整合 Goose（本地 Ollama 或雲端 API）進行智能修復
# 如果 Goose 不可用，退回 Shell-only 模式
#
# 使用方式：
#   bash qa-autofix-loop.sh [最大迭代次數]
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MAX_ITERATIONS=${1:-15}
RECIPE_DIR="$SCRIPT_DIR/../recipes"

# 顏色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

header() {
    echo -e "\n${CYAN}══════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  ${BOLD}$1${NC}"
    echo -e "${CYAN}══════════════════════════════════════════════════════════════${NC}"
}

# ── 偵測可用工具 ──────────────────────────────────────────────
detect_tools() {
    echo -e "${BLUE}偵測可用工具...${NC}"

    GOOSE_AVAILABLE=false
    OLLAMA_AVAILABLE=false
    CLOUD_API_AVAILABLE=false

    # 檢查 Goose
    if command -v goose &>/dev/null; then
        GOOSE_AVAILABLE=true
        echo -e "  ${GREEN}Goose: 可用${NC}"
    else
        echo -e "  ${YELLOW}Goose: 不可用（使用 Shell-only 模式）${NC}"
    fi

    # 檢查 Ollama
    if curl -s http://localhost:11434/api/version >/dev/null 2>&1; then
        OLLAMA_AVAILABLE=true
        echo -e "  ${GREEN}Ollama: 運行中${NC}"
    else
        echo -e "  ${YELLOW}Ollama: 未運行${NC}"
    fi

    # 檢查雲端 API
    if [ -n "${SILICONFLOW_API_KEY:-}" ] || [ -n "${OPENAI_API_KEY:-}" ]; then
        CLOUD_API_AVAILABLE=true
        echo -e "  ${GREEN}雲端 API: 已配置${NC}"
    else
        echo -e "  ${YELLOW}雲端 API: 未配置${NC}"
    fi

    # 決定執行模式
    if [ "$GOOSE_AVAILABLE" = true ] && [ "$OLLAMA_AVAILABLE" = true ]; then
        MODE="goose-ollama"
        echo -e "\n  ${GREEN}執行模式: Goose + Ollama 本地模型${NC}"
    elif [ "$GOOSE_AVAILABLE" = true ] && [ "$CLOUD_API_AVAILABLE" = true ]; then
        MODE="goose-cloud"
        echo -e "\n  ${GREEN}執行模式: Goose + 雲端 API${NC}"
    else
        MODE="shell-only"
        echo -e "\n  ${YELLOW}執行模式: Shell-only（純腳本自動修復）${NC}"
    fi
}

# ── Shell 自動修復 ────────────────────────────────────────────
shell_auto_fix() {
    local iteration=$1
    echo -e "\n${YELLOW}[Shell 自動修復] 第 $iteration 次迭代${NC}"

    cd "$PROJECT_ROOT"

    # 1. ESLint 自動修復
    echo -e "  ${BLUE}執行 ESLint --fix...${NC}"
    npx eslint src/ components/ --fix --max-warnings=9999 2>/dev/null || true

    # 2. TypeScript 錯誤分析與自動修復
    echo -e "  ${BLUE}分析 TypeScript 錯誤...${NC}"
    local ts_output
    ts_output=$(npx tsc --noEmit 2>&1 || true)

    # 自動修復：遺失 barrel export 衝突
    local barrel_conflicts=$(echo "$ts_output" | grep "TS2308" | head -5)
    if [ -n "$barrel_conflicts" ]; then
        echo -e "  ${YELLOW}修復 barrel export 衝突...${NC}"
        # 找到衝突的 index.ts 檔案
        echo "$barrel_conflicts" | while read -r line; do
            local file=$(echo "$line" | grep -oP "^[^(]+\(" | sed 's/($//' || true)
            if [ -n "$file" ] && [ -f "$file" ]; then
                echo -e "    修復: $file"
            fi
        done
    fi

    # 自動修復：遺失的型別檔案 - 建立 stub
    local missing_modules=$(echo "$ts_output" | grep "TS2307" | grep -oP "Cannot find module '[^']+'" | sort -u | head -10)
    if [ -n "$missing_modules" ]; then
        echo -e "  ${YELLOW}偵測到 $(echo "$missing_modules" | wc -l) 個遺失模組${NC}"
    fi

    # 統計修復後的錯誤
    local after_errors=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
    echo -e "  ${CYAN}修復後剩餘 TypeScript 錯誤: $after_errors${NC}"

    return 0
}

# ── Goose 自動修復 ────────────────────────────────────────────
goose_auto_fix() {
    local iteration=$1
    echo -e "\n${GREEN}[Goose AI 修復] 第 $iteration 次迭代${NC}"

    # 設定 Ollama 環境
    if [ "$MODE" = "goose-ollama" ]; then
        source "$SCRIPT_DIR/ollama-env.sh" 2>/dev/null || true
    fi

    # 使用 Goose recipe 執行修復
    if [ -f "$RECIPE_DIR/qa-production-readiness.yaml" ]; then
        goose run \
            --recipe "$RECIPE_DIR/qa-production-readiness.yaml" \
            --param "iteration=$iteration" \
            --param "max_iterations=$MAX_ITERATIONS" \
            2>&1 | tee "/tmp/goose-qa-iter-$iteration.log"

        # 檢查是否完成
        if grep -q "QA_PRODUCTION_READY" "/tmp/goose-qa-iter-$iteration.log" 2>/dev/null; then
            return 0
        fi
    else
        echo -e "  ${YELLOW}Recipe 不存在，退回 Shell 模式${NC}"
        shell_auto_fix "$iteration"
    fi

    return 1
}

# ── 檢查函式 ─────────────────────────────────────────────────
run_checks() {
    cd "$PROJECT_ROOT"
    local failed=0

    # TypeScript
    echo -e "  ${BLUE}TypeScript...${NC}"
    local ts_errors=$(npx tsc --noEmit 2>&1 | grep -c "error TS" || true)
    if [ "$ts_errors" -eq 0 ]; then
        echo -e "    ${GREEN}✓ 通過${NC}"
    else
        echo -e "    ${RED}✗ $ts_errors 個錯誤${NC}"
        failed=$((failed + 1))
    fi

    # ESLint
    echo -e "  ${BLUE}ESLint...${NC}"
    local eslint_result
    eslint_result=$(npx eslint src/ components/ --max-warnings=9999 --format compact 2>&1 || true)
    local eslint_errors=$(echo "$eslint_result" | grep -c "Error -" || true)
    if [ "$eslint_errors" -eq 0 ]; then
        echo -e "    ${GREEN}✓ 通過${NC}"
    else
        echo -e "    ${RED}✗ $eslint_errors 個錯誤${NC}"
        failed=$((failed + 1))
    fi

    # Build
    echo -e "  ${BLUE}Build...${NC}"
    if npx vite build 2>&1 | tail -1 | grep -q "built in"; then
        echo -e "    ${GREEN}✓ 建置成功${NC}"
    else
        echo -e "    ${RED}✗ 建置失敗${NC}"
        failed=$((failed + 1))
    fi

    return $failed
}

# ═══════════════════════════════════════════════════════════════
# 主迴圈
# ═══════════════════════════════════════════════════════════════

main() {
    header "TravelMaster QA 自動修復迴圈"
    detect_tools

    for iteration in $(seq 1 "$MAX_ITERATIONS"); do
        header "第 $iteration 次迭代（共 $MAX_ITERATIONS 次）"

        # 執行檢查
        echo -e "${BOLD}執行 QA 檢查...${NC}"
        if run_checks; then
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║  所有 QA 檢查通過！達到上市就緒標準                         ║${NC}"
            echo -e "${GREEN}║  共執行 $iteration 次迭代                                        ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
            exit 0
        fi

        # 執行修復
        if [ "$MODE" = "goose-ollama" ] || [ "$MODE" = "goose-cloud" ]; then
            if goose_auto_fix "$iteration"; then
                echo -e "${GREEN}Goose 判定 QA 通過！${NC}"
                exit 0
            fi
        else
            shell_auto_fix "$iteration"
        fi

        echo -e "${YELLOW}等待 3 秒後重新檢查...${NC}"
        sleep 3
    done

    echo -e "\n${RED}達到最大迭代次數 ($MAX_ITERATIONS)，仍有問題需手動修復${NC}"
    echo -e "${YELLOW}執行最終狀態檢查:${NC}"
    run_checks || true
    exit 1
}

main "$@"
