#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# TrvicERP Goose QA 檢查迴圈 - 上市就緒驗證
#
# 用途：完整的品質檢查迴圈，確保所有錯誤已修復，
#       程式碼品質達到上市標準
#
# 使用方式：
#   bash goose-qa-loop.sh [最大迭代次數] [--auto-fix] [--strict]
#
# 參數：
#   $1: 最大迭代次數（預設 15）
#   --auto-fix: 啟用自動修復模式
#   --strict:   嚴格模式（警告也算失敗）
#   --report:   產生詳細報告
# ═══════════════════════════════════════════════════════════════

set -uo pipefail

# ── 配置 ──────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
MAX_ITERATIONS=${1:-15}
AUTO_FIX=false
STRICT_MODE=false
GENERATE_REPORT=false
REPORT_DIR="$PROJECT_ROOT/.qa-reports"
REPORT_FILE="$REPORT_DIR/qa-report-$(date '+%Y%m%d-%H%M%S').md"
LOG_FILE="$REPORT_DIR/qa-loop.log"

# 解析參數
for arg in "$@"; do
    case $arg in
        --auto-fix)   AUTO_FIX=true ;;
        --strict)     STRICT_MODE=true ;;
        --report)     GENERATE_REPORT=true ;;
        [0-9]*)       MAX_ITERATIONS=$arg ;;
    esac
done

# ── 顏色定義 ──────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ── 計數器 ────────────────────────────────────────────────────
TOTAL_TS_ERRORS=0
TOTAL_ESLINT_ERRORS=0
TOTAL_ESLINT_WARNINGS=0
TOTAL_BUILD_ERRORS=0
TOTAL_MISSING_MODULES=0
TOTAL_SECURITY_ISSUES=0
TOTAL_CHECKS_PASSED=0
TOTAL_CHECKS_FAILED=0

# ── 初始化 ────────────────────────────────────────────────────
mkdir -p "$REPORT_DIR"

log() {
    local msg="$(date '+%Y-%m-%d %H:%M:%S') - $1"
    echo "$msg" >> "$LOG_FILE"
    echo -e "$2$1${NC}"
}

header() {
    echo ""
    echo -e "${CYAN}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║${BOLD}  $1${NC}"
    echo -e "${CYAN}╚══════════════════════════════════════════════════════════════╝${NC}"
}

section() {
    echo -e "\n${MAGENTA}── $1 ──────────────────────────────────${NC}"
}

pass() {
    echo -e "  ${GREEN}✓${NC} $1"
    TOTAL_CHECKS_PASSED=$((TOTAL_CHECKS_PASSED + 1))
}

fail() {
    echo -e "  ${RED}✗${NC} $1"
    TOTAL_CHECKS_FAILED=$((TOTAL_CHECKS_FAILED + 1))
}

warn() {
    echo -e "  ${YELLOW}⚠${NC} $1"
}

# ═══════════════════════════════════════════════════════════════
# 檢查函式
# ═══════════════════════════════════════════════════════════════

# 1. TypeScript 類型檢查
check_typescript() {
    section "TypeScript 類型檢查"
    local output
    local exit_code=0

    output=$(cd "$PROJECT_ROOT" && npx tsc --noEmit 2>&1) || exit_code=$?

    if [ $exit_code -eq 0 ]; then
        pass "TypeScript 編譯無錯誤"
        TOTAL_TS_ERRORS=0
        return 0
    else
        local error_count=$(echo "$output" | grep -c "error TS" || true)
        TOTAL_TS_ERRORS=$error_count
        fail "TypeScript 發現 $error_count 個錯誤"

        # 分類錯誤
        local missing_module=$(echo "$output" | grep -c "TS2307\|TS2305\|TS2688" || true)
        local type_mismatch=$(echo "$output" | grep -c "TS2322\|TS2345\|TS2339" || true)
        local other_errors=$((error_count - missing_module - type_mismatch))

        echo -e "    ${YELLOW}├─ 缺少模組/匯出: $missing_module${NC}"
        echo -e "    ${YELLOW}├─ 類型不匹配:     $type_mismatch${NC}"
        echo -e "    ${YELLOW}└─ 其他錯誤:       $other_errors${NC}"

        TOTAL_MISSING_MODULES=$missing_module

        if [ "$GENERATE_REPORT" = true ]; then
            echo "$output" > "$REPORT_DIR/ts-errors-latest.txt"
        fi

        return 1
    fi
}

# 2. ESLint 檢查
check_eslint() {
    section "ESLint 程式碼品質檢查"
    local output
    local exit_code=0

    output=$(cd "$PROJECT_ROOT" && npx eslint src/ components/ --max-warnings=9999 --format json 2>&1) || exit_code=$?

    # 檢查 ESLint 是否能正常執行
    if echo "$output" | grep -q "ERR_MODULE_NOT_FOUND\|Cannot find"; then
        fail "ESLint 配置錯誤或缺少依賴"
        echo -e "    ${YELLOW}└─ 請執行: npm install${NC}"
        return 1
    fi

    # 解析 JSON 輸出
    local error_count=$(echo "$output" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
        const errors = data.reduce((sum, f) => sum + f.errorCount, 0);
        console.log(errors);
    " 2>/dev/null || echo "?")

    local warning_count=$(echo "$output" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
        const warnings = data.reduce((sum, f) => sum + f.warningCount, 0);
        console.log(warnings);
    " 2>/dev/null || echo "?")

    TOTAL_ESLINT_ERRORS=${error_count:-0}
    TOTAL_ESLINT_WARNINGS=${warning_count:-0}

    if [ "$error_count" = "0" ] && [ "$warning_count" = "0" ]; then
        pass "ESLint 無錯誤、無警告"
        return 0
    elif [ "$error_count" = "0" ]; then
        if [ "$STRICT_MODE" = true ]; then
            fail "ESLint 有 $warning_count 個警告（嚴格模式）"
            return 1
        else
            pass "ESLint 無錯誤（$warning_count 個警告）"
            return 0
        fi
    else
        fail "ESLint 發現 $error_count 個錯誤, $warning_count 個警告"

        if [ "$GENERATE_REPORT" = true ]; then
            echo "$output" > "$REPORT_DIR/eslint-errors-latest.json"
        fi

        return 1
    fi
}

# 3. Vite Build 檢查
check_build() {
    section "Vite 生產建置檢查"
    local output
    local exit_code=0

    output=$(cd "$PROJECT_ROOT" && npx vite build 2>&1) || exit_code=$?

    if [ $exit_code -eq 0 ]; then
        pass "Vite 建置成功"

        # 顯示建置大小
        if [ -d "$PROJECT_ROOT/dist" ]; then
            local size=$(du -sh "$PROJECT_ROOT/dist" 2>/dev/null | cut -f1)
            echo -e "    ${CYAN}└─ 建置大小: $size${NC}"
        fi

        return 0
    else
        TOTAL_BUILD_ERRORS=$((TOTAL_BUILD_ERRORS + 1))
        fail "Vite 建置失敗"

        # 顯示關鍵錯誤
        echo "$output" | grep -i "error\|failed" | head -10 | while read -r line; do
            echo -e "    ${YELLOW}└─ $line${NC}"
        done

        if [ "$GENERATE_REPORT" = true ]; then
            echo "$output" > "$REPORT_DIR/build-errors-latest.txt"
        fi

        return 1
    fi
}

# 4. 模組匯入檢查
check_imports() {
    section "模組匯入完整性檢查"
    local issues=0

    # 檢查循環引用
    local circular=$(cd "$PROJECT_ROOT" && node -e "
        const fs = require('fs');
        const path = require('path');
        function findFiles(dir, ext) {
            const results = [];
            try {
                const items = fs.readdirSync(dir, { withFileTypes: true });
                for (const item of items) {
                    const full = path.join(dir, item.name);
                    if (item.isDirectory() && !item.name.includes('node_modules')) {
                        results.push(...findFiles(full, ext));
                    } else if (item.name.endsWith(ext)) {
                        results.push(full);
                    }
                }
            } catch(e) {}
            return results;
        }
        // 檢查 barrel export 衝突
        const indexFiles = findFiles('src', 'index.ts');
        let conflicts = 0;
        for (const f of indexFiles) {
            const content = fs.readFileSync(f, 'utf8');
            const exports = content.match(/export \* from/g);
            if (exports && exports.length > 3) {
                const names = {};
                const lines = content.split('\n');
                for (const line of lines) {
                    if (line.includes('export *')) {
                        conflicts++; // Potential re-export conflict
                    }
                }
            }
        }
        console.log(conflicts);
    " 2>/dev/null || echo "0")

    if [ "$circular" -gt 10 ]; then
        warn "發現 $circular 個 barrel export 重新匯出（可能有命名衝突）"
        issues=$((issues + 1))
    else
        pass "模組匯入結構良好"
    fi

    # 檢查遺失的模組檔案
    local missing_files=$(cd "$PROJECT_ROOT" && grep -rn "from '\.\./\|from '\./\|from '@/" src/ --include="*.ts" --include="*.tsx" 2>/dev/null | \
        grep -v node_modules | grep -v "\.d\.ts" | head -200 | \
        while read -r line; do
            file=$(echo "$line" | cut -d: -f1)
            dir=$(dirname "$file")
            import_path=$(echo "$line" | grep -oP "from ['\"]([^'\"]+)['\"]" | sed "s/from ['\"]//;s/['\"]//")
            if [ -n "$import_path" ] && [[ "$import_path" == .* ]]; then
                resolved="$dir/$import_path"
                for ext in "" ".ts" ".tsx" ".js" ".jsx" "/index.ts" "/index.tsx"; do
                    if [ -f "${resolved}${ext}" ]; then
                        continue 2
                    fi
                done
                echo "$file -> $import_path"
            fi
        done 2>/dev/null | wc -l | tr -d ' ')

    if [ "$missing_files" -gt 0 ]; then
        fail "發現 $missing_files 個可能遺失的模組引用"
        issues=$((issues + 1))
    else
        pass "所有相對路徑匯入均可解析"
    fi

    return $issues
}

# 5. 安全性基本檢查
check_security() {
    section "安全性基本檢查"
    local issues=0

    # 檢查硬編碼密鑰
    local secrets=$(cd "$PROJECT_ROOT" && grep -rn --include="*.ts" --include="*.tsx" --include="*.js" \
        -E "(api[_-]?key|secret|password|token)\s*[:=]\s*['\"][a-zA-Z0-9]{16,}" \
        src/ components/ 2>/dev/null | grep -v ".env" | grep -v "example" | grep -v "mock" | grep -v "test" | wc -l | tr -d ' ')

    if [ "$secrets" -gt 0 ]; then
        TOTAL_SECURITY_ISSUES=$((TOTAL_SECURITY_ISSUES + secrets))
        fail "發現 $secrets 個可能的硬編碼密鑰"
        issues=$((issues + 1))
    else
        pass "未發現硬編碼密鑰"
    fi

    # 檢查 dangerouslySetInnerHTML
    local xss=$(cd "$PROJECT_ROOT" && grep -rn "dangerouslySetInnerHTML" src/ components/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$xss" -gt 0 ]; then
        warn "發現 $xss 處 dangerouslySetInnerHTML 使用（請確認已消毒）"
    else
        pass "未發現 XSS 風險"
    fi

    # 檢查 console.log 殘留
    local console_logs=$(cd "$PROJECT_ROOT" && grep -rn "console\.log\|console\.debug" src/ components/ --include="*.ts" --include="*.tsx" 2>/dev/null | grep -v "// debug" | grep -v "eslint-disable" | wc -l | tr -d ' ')

    if [ "$console_logs" -gt 10 ]; then
        warn "發現 $console_logs 個 console.log（建議上線前清除）"
    else
        pass "console.log 數量合理 ($console_logs)"
    fi

    # 檢查 .env 檔案不在版控
    if [ -f "$PROJECT_ROOT/.gitignore" ]; then
        if grep -q "\.env" "$PROJECT_ROOT/.gitignore"; then
            pass ".env 已在 .gitignore 中"
        else
            fail ".env 未在 .gitignore 中"
            issues=$((issues + 1))
        fi
    fi

    return $issues
}

# 6. 設計系統合規檢查
check_design_system() {
    section "設計系統合規檢查"
    local issues=0

    # 檢查硬編碼顏色
    local hardcoded_colors=$(cd "$PROJECT_ROOT" && grep -rn --include="*.tsx" --include="*.ts" \
        -E "color:\s*['\"]#[0-9A-Fa-f]{3,8}|background:\s*['\"]#[0-9A-Fa-f]{3,8}|fill:\s*['\"]#" \
        src/components/ src/design-system/ 2>/dev/null | wc -l | tr -d ' ')

    if [ "$hardcoded_colors" -gt 0 ]; then
        warn "發現 $hardcoded_colors 處硬編碼顏色（建議使用設計代碼）"
    else
        pass "無 JS 內硬編碼顏色值"
    fi

    # 檢查 Tailwind 是否一致使用
    local inline_styles=$(cd "$PROJECT_ROOT" && grep -rn "style={{" src/components/ --include="*.tsx" 2>/dev/null | wc -l | tr -d ' ')

    if [ "$inline_styles" -gt 20 ]; then
        warn "發現 $inline_styles 處 inline style（建議使用 Tailwind 類別）"
    else
        pass "inline style 使用合理 ($inline_styles)"
    fi

    return $issues
}

# 7. 套件依賴檢查
check_dependencies() {
    section "套件依賴檢查"
    local issues=0

    # 檢查 npm audit
    local audit_output
    audit_output=$(cd "$PROJECT_ROOT" && npm audit --json 2>/dev/null || echo '{}')

    local vulnerabilities=$(echo "$audit_output" | node -e "
        const data = JSON.parse(require('fs').readFileSync('/dev/stdin','utf8'));
        const total = data.metadata?.vulnerabilities || {};
        const critical = total.critical || 0;
        const high = total.high || 0;
        console.log(critical + ',' + high);
    " 2>/dev/null || echo "0,0")

    local critical=$(echo "$vulnerabilities" | cut -d, -f1)
    local high=$(echo "$vulnerabilities" | cut -d, -f2)

    if [ "$critical" -gt 0 ]; then
        fail "發現 $critical 個嚴重安全漏洞"
        TOTAL_SECURITY_ISSUES=$((TOTAL_SECURITY_ISSUES + critical))
        issues=$((issues + 1))
    elif [ "$high" -gt 0 ]; then
        warn "發現 $high 個高風險安全漏洞"
    else
        pass "無嚴重安全漏洞"
    fi

    # 檢查是否有 peer dependency 問題
    local peer_issues=$(cd "$PROJECT_ROOT" && npm ls 2>&1 | grep "ERESOLVE\|peer dep\|missing" | wc -l | tr -d ' ')

    if [ "$peer_issues" -gt 0 ]; then
        warn "發現 $peer_issues 個 peer dependency 警告"
    else
        pass "依賴關係完整"
    fi

    return $issues
}

# 8. 環境變數檢查
check_env() {
    section "環境配置檢查"

    if [ -f "$PROJECT_ROOT/.env.example" ]; then
        pass ".env.example 範本存在"
    else
        warn "缺少 .env.example 範本"
    fi

    if [ -f "$PROJECT_ROOT/vercel.json" ]; then
        pass "Vercel 部署配置存在"
    else
        warn "缺少 Vercel 部署配置"
    fi

    return 0
}

# ═══════════════════════════════════════════════════════════════
# 自動修復函式
# ═══════════════════════════════════════════════════════════════

auto_fix_eslint() {
    log "嘗試 ESLint 自動修復..." "$YELLOW"
    cd "$PROJECT_ROOT" && npx eslint src/ components/ --fix --max-warnings=9999 2>/dev/null || true
}

auto_fix_imports() {
    log "嘗試整理匯入..." "$YELLOW"
    # 使用 ESLint 修復 import 順序
    cd "$PROJECT_ROOT" && npx eslint src/ --fix --rule '{"sort-imports": "off"}' 2>/dev/null || true
}

run_auto_fix() {
    header "自動修復中..."
    auto_fix_eslint
    auto_fix_imports
    log "自動修復完成" "$GREEN"
}

# ═══════════════════════════════════════════════════════════════
# 報告產生
# ═══════════════════════════════════════════════════════════════

generate_report() {
    cat > "$REPORT_FILE" << REPORT
# TrvicERP QA 品質報告

**產生時間:** $(date '+%Y-%m-%d %H:%M:%S')
**迭代次數:** $1
**模式:** $([ "$STRICT_MODE" = true ] && echo "嚴格" || echo "標準") | $([ "$AUTO_FIX" = true ] && echo "自動修復" || echo "僅檢查")

## 檢查結果摘要

| 檢查項目 | 狀態 | 數量 |
|---------|------|------|
| TypeScript 錯誤 | $([ "$TOTAL_TS_ERRORS" -eq 0 ] && echo "✅ 通過" || echo "❌ 失敗") | $TOTAL_TS_ERRORS |
| ESLint 錯誤 | $([ "$TOTAL_ESLINT_ERRORS" -eq 0 ] && echo "✅ 通過" || echo "❌ 失敗") | $TOTAL_ESLINT_ERRORS |
| ESLint 警告 | $([ "$TOTAL_ESLINT_WARNINGS" -lt 10 ] && echo "✅ 良好" || echo "⚠️ 注意") | $TOTAL_ESLINT_WARNINGS |
| 建置錯誤 | $([ "$TOTAL_BUILD_ERRORS" -eq 0 ] && echo "✅ 通過" || echo "❌ 失敗") | $TOTAL_BUILD_ERRORS |
| 安全問題 | $([ "$TOTAL_SECURITY_ISSUES" -eq 0 ] && echo "✅ 安全" || echo "❌ 風險") | $TOTAL_SECURITY_ISSUES |

## 統計

- **通過檢查:** $TOTAL_CHECKS_PASSED
- **失敗檢查:** $TOTAL_CHECKS_FAILED
- **上市就緒:** $([ "$TOTAL_CHECKS_FAILED" -eq 0 ] && echo "✅ 是" || echo "❌ 否，需修復 $TOTAL_CHECKS_FAILED 個問題")

## 建議

$([ "$TOTAL_TS_ERRORS" -gt 0 ] && echo "- 修復 TypeScript 類型錯誤是最高優先事項" || true)
$([ "$TOTAL_ESLINT_ERRORS" -gt 0 ] && echo "- 修復 ESLint 錯誤以確保程式碼品質" || true)
$([ "$TOTAL_BUILD_ERRORS" -gt 0 ] && echo "- 修復建置錯誤，否則無法部署" || true)
$([ "$TOTAL_SECURITY_ISSUES" -gt 0 ] && echo "- 處理安全漏洞以保護使用者資料" || true)
$([ "$TOTAL_CHECKS_FAILED" -eq 0 ] && echo "- 所有檢查通過，程式碼已達上市標準！" || true)

---
*由 TrvicERP Goose QA Loop 自動產生*
REPORT

    echo -e "\n${CYAN}📄 報告已存儲: $REPORT_FILE${NC}"
}

# ═══════════════════════════════════════════════════════════════
# 主迴圈
# ═══════════════════════════════════════════════════════════════

main() {
    header "TrvicERP Goose QA 檢查迴圈 - 上市就緒驗證"
    echo -e "${BLUE}  最大迭代: ${YELLOW}$MAX_ITERATIONS${NC}"
    echo -e "${BLUE}  自動修復: ${YELLOW}$([ "$AUTO_FIX" = true ] && echo "啟用" || echo "停用")${NC}"
    echo -e "${BLUE}  嚴格模式: ${YELLOW}$([ "$STRICT_MODE" = true ] && echo "啟用" || echo "停用")${NC}"
    echo -e "${BLUE}  專案路徑: ${YELLOW}$PROJECT_ROOT${NC}"

    log "開始 QA 檢查迴圈" "$BLUE"

    for iteration in $(seq 1 "$MAX_ITERATIONS"); do
        header "第 $iteration 次迭代（共 $MAX_ITERATIONS 次）"

        # 重置計數
        TOTAL_CHECKS_PASSED=0
        TOTAL_CHECKS_FAILED=0
        local failed=0

        # 執行所有檢查
        check_typescript   || failed=$((failed + 1))
        check_eslint       || failed=$((failed + 1))
        check_imports      || failed=$((failed + 1))
        check_security     || failed=$((failed + 1))
        check_design_system || failed=$((failed + 1))
        check_dependencies || failed=$((failed + 1))
        check_env          || failed=$((failed + 1))

        # 只在最後一次或全部通過時執行 build
        if [ $failed -eq 0 ] || [ "$iteration" -eq "$MAX_ITERATIONS" ]; then
            check_build || failed=$((failed + 1))
        fi

        # 總結本次迭代
        echo ""
        echo -e "${BOLD}──── 第 $iteration 次迭代結果 ────${NC}"
        echo -e "  通過: ${GREEN}$TOTAL_CHECKS_PASSED${NC}  失敗: ${RED}$TOTAL_CHECKS_FAILED${NC}"

        log "第 $iteration 次迭代: 通過=$TOTAL_CHECKS_PASSED 失敗=$TOTAL_CHECKS_FAILED" "$BLUE"

        if [ $failed -eq 0 ]; then
            echo ""
            echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
            echo -e "${GREEN}║                                                              ║${NC}"
            echo -e "${GREEN}║   所有 QA 檢查通過！程式碼已達上市就緒標準                    ║${NC}"
            echo -e "${GREEN}║   共執行 $iteration 次迭代                                        ║${NC}"
            echo -e "${GREEN}║                                                              ║${NC}"
            echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"

            log "QA 檢查全部通過！" "$GREEN"

            if [ "$GENERATE_REPORT" = true ]; then
                generate_report "$iteration"
            fi

            exit 0
        fi

        # 自動修復
        if [ "$AUTO_FIX" = true ] && [ "$iteration" -lt "$MAX_ITERATIONS" ]; then
            run_auto_fix
            echo -e "${YELLOW}等待 2 秒後重新檢查...${NC}"
            sleep 2
        else
            break
        fi
    done

    # 未通過
    echo ""
    echo -e "${RED}╔══════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                              ║${NC}"
    echo -e "${RED}║   QA 檢查未全部通過，需要手動介入修復                        ║${NC}"
    echo -e "${RED}║                                                              ║${NC}"
    echo -e "${RED}╚══════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}問題摘要:${NC}"
    echo -e "  TypeScript 錯誤: ${RED}$TOTAL_TS_ERRORS${NC}"
    echo -e "  ESLint 錯誤:     ${RED}$TOTAL_ESLINT_ERRORS${NC}"
    echo -e "  ESLint 警告:     ${YELLOW}$TOTAL_ESLINT_WARNINGS${NC}"
    echo -e "  建置錯誤:        ${RED}$TOTAL_BUILD_ERRORS${NC}"
    echo -e "  安全問題:        ${RED}$TOTAL_SECURITY_ISSUES${NC}"

    if [ "$GENERATE_REPORT" = true ]; then
        generate_report "$MAX_ITERATIONS"
    fi

    log "QA 檢查未通過，需要修復" "$RED"
    exit 1
}

main "$@"
