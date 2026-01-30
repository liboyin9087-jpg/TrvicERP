#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 多角色 Ralph Loop v5 - 持續自動修復迴圈
# ═══════════════════════════════════════════════════════════════
# 工作流程:
#   1. 👷 架構師 (SiliconFlow/DeepSeek V3) 審查架構問題
#   2. 🎨 設計師 (Groq/Llama 3.3) 審查 UI/UX 問題
#   3. 🔧 Gemini 2.5 Flash 修復發現的問題
#   4. 🔄 重複直到所有檔案處理完成
#
# 用法: ./multi-role-ralph-loop.sh [max_loops] [target_dir]
#       max_loops: 最大迴圈次數 (預設: 0 = 無限)
#       target_dir: 目標目錄 (預設: 自動偵測 src/)
#
# 環境變數:
#   SILICONFLOW_API_KEY - SiliconFlow API 金鑰
#   GROQ_API_KEY - Groq API 金鑰
#   GEMINI_API_KEY - Google Gemini API 金鑰
# ═══════════════════════════════════════════════════════════════

# 不使用 set -e，改用手動錯誤處理以確保迴圈持續
# set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"

# 自動偵測目標目錄
if [ -n "$2" ]; then
    TARGET_DIR="$2"
elif [ -d "$PROJECT_ROOT/src" ]; then
    TARGET_DIR="$PROJECT_ROOT/src"
else
    TARGET_DIR="$PROJECT_ROOT"
fi

# 迴圈設定
MAX_LOOPS=${1:-0}  # 0 = 無限迴圈
CURRENT_LOOP=0
LOOP_DELAY=5  # 每次迴圈間隔秒數
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"
COMPONENTS_DIR="$PROJECT_ROOT/components"

# 載入 .env 檔案（如果存在）
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "載入環境變數從: $PROJECT_ROOT/.env"
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# API 設定
API_KEY="${SILICONFLOW_API_KEY}"
API_BASE="https://api.siliconflow.com/v1"
API_MODEL="deepseek-ai/DeepSeek-V3"

GROQ_API_KEY="${GROQ_API_KEY}"
GROQ_API_BASE="https://api.groq.com/openai/v1"
GROQ_MODEL="llama-3.3-70b-versatile"

GEMINI_API_KEY="${GEMINI_API_KEY}"

# 檢查必要的 API 金鑰
if [ -z "$API_KEY" ] || [ -z "$GROQ_API_KEY" ] || [ -z "$GEMINI_API_KEY" ]; then
    echo "錯誤: 缺少必要的 API 金鑰"
    echo "請確保在 .env 檔案中設置了以下變數:"
    echo "  - SILICONFLOW_API_KEY"
    echo "  - GROQ_API_KEY"
    echo "  - GEMINI_API_KEY"
    exit 1
fi

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 進度追蹤檔案
PROGRESS_DIR="$SCRIPT_DIR/../progress"
mkdir -p "$PROGRESS_DIR"
PROGRESS_SUMMARY="$PROGRESS_DIR/summary.json"
PROGRESS_COMPLETED="$PROGRESS_DIR/completed.txt"
PROGRESS_FAILED="$PROGRESS_DIR/failed.txt"
PROGRESS_CURRENT="$PROGRESS_DIR/current.txt"

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TravelMaster 多角色自動修復系統 (v5)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  👷 架構師: SiliconFlow (DeepSeek V3)${NC}"
echo -e "${CYAN}  🎨 設計師: Groq (Llama 3.3 70B)${NC}"
echo -e "${CYAN}  🔧 修復者: Gemini 2.5 Flash${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 創建 Python 腳本
cat > /tmp/multi_role_validator.py << 'PYEOF'
# -*- coding: utf-8 -*-
import os
import sys
import glob
import time
import re
import json
import datetime
from openai import Client
from google import genai
from google.genai import types

class ProgressTracker:
    def __init__(self, progress_dir):
        self.progress_dir = progress_dir
        self.summary_file = os.path.join(progress_dir, 'summary.json')
        self.completed_file = os.path.join(progress_dir, 'completed.txt')
        self.failed_file = os.path.join(progress_dir, 'failed.txt')
        self.current_file = os.path.join(progress_dir, 'current.txt')
        
        # 初始化進度檔案
        os.makedirs(progress_dir, exist_ok=True)
        
    def init_progress(self, total_files, file_list):
        summary = {
            'total_files': total_files,
            'completed': 0,
            'failed': 0,
            'success_rate': 0.0,
            'start_time': datetime.datetime.now().isoformat(),
            'current_file': '',
            'remaining_files': file_list.copy()
        }
        with open(self.summary_file, 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
        
        # 清空其他檔案
        open(self.completed_file, 'w').close()
        open(self.failed_file, 'w').close()
        open(self.current_file, 'w').close()
        
    def update_current(self, current_file, progress_info):
        with open(self.current_file, 'w', encoding='utf-8') as f:
            f.write(f"當前處理: {current_file}\n")
            f.write(f"進度: {progress_info}\n")
            f.write(f"時間: {datetime.datetime.now().strftime('%H:%M:%S')}\n")
            
        # 更新 summary
        with open(self.summary_file, 'r') as f:
            summary = json.load(f)
        summary['current_file'] = current_file
        with open(self.summary_file, 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
    
    def mark_completed(self, file_path, success=True):
        target_file = self.completed_file if success else self.failed_file
        
        with open(target_file, 'a', encoding='utf-8') as f:
            f.write(f"{file_path}\n")
        
        # 更新 summary
        with open(self.summary_file, 'r') as f:
            summary = json.load(f)
        
        if success:
            summary['completed'] += 1
        else:
            summary['failed'] += 1
            
        # 從剩餘列表中移除
        if file_path in summary['remaining_files']:
            summary['remaining_files'].remove(file_path)
            
        processed = summary['completed'] + summary['failed']
        if processed > 0:
            summary['success_rate'] = (summary['completed'] / processed) * 100
            
        with open(self.summary_file, 'w') as f:
            json.dump(summary, f, indent=2, ensure_ascii=False)
    
    def get_progress(self):
        if not os.path.exists(self.summary_file):
            return None
        with open(self.summary_file, 'r') as f:
            return json.load(f)
    
    def print_status(self):
        progress = self.get_progress()
        if not progress:
            print("❌ 沒有進度資料")
            return
            
        processed = progress['completed'] + progress['failed']
        total = progress['total_files']
        remaining = total - processed
        
        print(f"\n{'='*80}")
        print(f"📊 TravelMaster 檔案修正進度報告")
        print(f"{'='*80}")
        print(f"📁 總檔案數: {total}")
        print(f"✅ 已完成: {progress['completed']} ({progress['completed']/total*100:.1f}%)")
        print(f"❌ 失敗: {progress['failed']} ({progress['failed']/total*100:.1f}%)")
        print(f"⏳ 剩餘: {remaining} ({remaining/total*100:.1f}%)")
        print(f"📈 成功率: {progress['success_rate']:.1f}%")
        
        if progress['current_file']:
            print(f"\n🔄 目前處理: {progress['current_file']}")
            
        print(f"\n⏰ 開始時間: {progress['start_time']}")
        print(f"{'='*80}\n")

class GeminiFixer:
    def __init__(self, api_key):
        self.client = genai.Client(api_key=api_key)
        self.model = 'models/gemini-2.5-flash'

    def fix_file(self, file_path, content, issues):
        print(f"    🔧 Gemini 正在修復 {len(issues)} 個問題...")
        print(f"       (問題範例: {issues[0]['problem'][:50]}...)")
        
        issue_desc = "\n".join([f"- [{i['role']}] {i['problem']} ({i['severity']})" for i in issues])
        
        prompt = f"""
你是一個資深 React/TypeScript 全端工程師。
請根據以下發現的架構與設計問題，重寫並修復這個檔案。

### 檔案路徑
{file_path}

### 發現的問題
{issue_desc}

### 原始程式碼
{content}

### 修復規範 (必須嚴格遵守)
1. **Kintone 獨立性 (架構)**: 
   - 移除對全域 Store (由 useAppStore 等) 的直接依賴。
   - 改為透過定義 `interface {{file_path_name}}Config` props 來接收資料。
   - 確保元件可以作為獨立 Widget 被拖曳與配置。
2. **Dashtail UI 規範 (設計)**:
   - 顏色: 必須使用 Tailwind Token (如 `bg-primary-900`, `text-primary-900`)，嚴禁硬編碼色碼 (#3b82f6 等)。
   - 結構: 如果是 Widget，確保外層有標準 Card 結構。
   - 拖曳: 確保支援 `.drag-handle` 類別。
3. **輸出要求**:
   - 直接輸出完整的、可運行的 TypeScript 代碼。
   - 不要包含 Markdown ```typescript 標記，直接輸出純文字代碼。
   - 不要輸出解釋文字。
"""
        try:
            response = self.client.models.generate_content(
                model=self.model, contents=types.Content(parts=[types.Part(text=prompt)])
            )
            fixed_code = response.text
            # 清理 Markdown
            fixed_code = re.sub(r'^```[a-z]*\n', '', fixed_code, flags=re.MULTILINE)
            fixed_code = re.sub(r'\n```$', '', fixed_code, flags=re.MULTILINE)
            return fixed_code.strip()
        except Exception as e:
            print(f"    ❌ Gemini 修復失敗: {e}")
            return None

class MultiRoleValidator:
    def __init__(self, sf_key, sf_base, sf_model, groq_key, groq_base, groq_model, gemini_key, progress_tracker=None):
        self.sf_client = Client(api_key=sf_key, base_url=sf_base)
        self.sf_model = sf_model
        self.groq_client = Client(api_key=groq_key, base_url=groq_base)
        self.groq_model = groq_model
        
        self.fixer = GeminiFixer(gemini_key)
        self.progress_tracker = progress_tracker
        
        # 輪流使用不同 API 進行審查
        self.roles = {
            "architect": {
                "name": "架構師",
                "emoji": "👷",
                "prompt_func": self._get_architect_prompt,
                "api": "siliconflow"  # 架構師使用 SiliconFlow (DeepSeek V3)
            },
            "designer": {
                "name": "設計師",
                "emoji": "🎨",
                "prompt_func": self._get_designer_prompt,
                "api": "groq"  # 設計師使用 Groq (Llama 3.3)
            }
        }

    def _api_call(self, prompt, api_preference="siliconflow"):
        """根據角色選擇 API，實現輪流檢查"""
        if api_preference == "groq":
            # 設計師優先使用 Groq
            apis = [
                ('groq', self.groq_client, self.groq_model),
                ('siliconflow', self.sf_client, self.sf_model)  # fallback
            ]
        else:
            # 架構師優先使用 SiliconFlow
            apis = [
                ('siliconflow', self.sf_client, self.sf_model),
                ('groq', self.groq_client, self.groq_model)  # fallback
            ]

        for name, client, model in apis:
            try:
                print(f"      🔗 使用 {name} ({model})...")
                response = client.chat.completions.create(
                    model=model, messages=[{"role": "user", "content": prompt}],
                    max_tokens=1000, temperature=0.0
                )
                return response.choices[0].message.content
            except Exception as e:
                print(f"      ⚠️  {name} API 錯誤: {str(e)[:50]}，嘗試備用...")
                continue
        return ""

    def _get_architect_prompt(self, file_path, content):
        return f"""
請審查此 React 元件的架構問題：
檔案: {file_path}
```typescript
{content[:3000]}... (省略部分)
```
重點檢查：
1. 是否依賴全域 Store (應改用 Props)？
2. 是否有定義 Config Props 介面？
3. 是否符合 Single Responsibility？

輸出格式：
[架構] 問題描述 | 嚴重度: 高/中
若無問題回應 VALIDATION_COMPLETE
"""

    def _get_designer_prompt(self, file_path, content):
        return f"""
請審查此 React 元件的設計問題 (Dashtail/TravelMaster 規範)：
檔案: {file_path}
```typescript
{content[:3000]}... (省略部分)
```
重點檢查：
1. 是否有 Hardcoded 顏色 (如 #3b82f6)？應使用 Tailwind primary-900。
2. 是否包含 drag-handle 結構？
3. 字體與間距是否使用 Tailwind class？

輸出格式：
[設計] 問題描述 | 嚴重度: 高/中
若無問題回應 VALIDATION_COMPLETE
"""

    def validate_and_fix(self, file_path):
        print(f"\n📂 [{file_path}]")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            print(f"  ❌ 讀取失敗: {e}")
            if self.progress_tracker:
                self.progress_tracker.mark_completed(file_path, success=False)
            return False

        all_issues = []
        print("  🕵️  輪流審查中...")

        for role_key, role in self.roles.items():
            print(f"    {role['emoji']} {role['name']} 審查中...")
            prompt = role['prompt_func'](file_path, content)
            # 根據角色選擇不同的 API（輪流檢查）
            api_preference = role.get('api', 'siliconflow')
            result = self._api_call(prompt, api_preference)

            # 簡易解析
            for line in result.split('\n'):
                if "[" in line and "|" in line:
                    all_issues.append({
                        "role": role_key,
                        "problem": line.split("|")[0].strip(),
                        "severity": "高" if "高" in line else "中"
                    })

        if not all_issues:
            print("  ✅ 無需修復")
            if self.progress_tracker:
                self.progress_tracker.mark_completed(file_path, success=True)
            return True

        print(f"  ⚠️  發現 {len(all_issues)} 個問題，🔧 Gemini 2.5 Flash 介入修復...")
        fixed_content = self.fixer.fix_file(file_path, content, all_issues)
        
        if fixed_content and len(fixed_content) > 50:
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                print("  🎉 修復完成並儲存")
                if self.progress_tracker:
                    self.progress_tracker.mark_completed(file_path, success=True)
                return True
            except Exception as e:
                print(f"  ❌ 儲存失敗: {e}")
                if self.progress_tracker:
                    self.progress_tracker.mark_completed(file_path, success=False)
                return False
        else:
            print("  ❌ 修復失敗 (內容無效)")
            if self.progress_tracker:
                self.progress_tracker.mark_completed(file_path, success=False)
            return False

def main():
    target_dir = sys.argv[1]
    progress_dir = sys.argv[9] if len(sys.argv) > 9 else os.path.join(os.path.dirname(os.path.dirname(__file__)), 'progress')
    components_dir = sys.argv[10] if len(sys.argv) > 10 else None

    # 初始化進度追蹤
    progress_tracker = ProgressTracker(progress_dir)

    validator = MultiRoleValidator(
        sys.argv[2], sys.argv[3], sys.argv[4],
        sys.argv[5], sys.argv[6], sys.argv[7],
        sys.argv[8], progress_tracker
    )

    # 收集 src 和 components 目錄的檔案
    all_files = []
    directories_to_scan = [target_dir]
    if components_dir and os.path.exists(components_dir):
        directories_to_scan.append(components_dir)

    for directory in directories_to_scan:
        if os.path.exists(directory):
            tsx_files = glob.glob(f"{directory}/**/*.tsx", recursive=True)
            ts_files = glob.glob(f"{directory}/**/*.ts", recursive=True)
            all_files.extend(tsx_files + ts_files)
    
    # 過濾和排序 - 處理所有檔案
    valid_files = [f for f in all_files if "node_modules" not in f and ".d.ts" not in f and ".test." not in f]
    valid_files.sort()
    
    print(f"🎯 總檔案數: {len(valid_files)} (src + components)")
    
    # 初始化進度追蹤
    progress_tracker.init_progress(len(valid_files), valid_files)
    
    success_count = 0
    for i, f in enumerate(valid_files, 1):
        progress_info = f"[{i}/{len(valid_files)}] ({i/len(valid_files)*100:.1f}%)"
        
        progress_tracker.update_current(f, progress_info)
        progress_tracker.print_status()
        
        print(f"\n{'='*80}")
        print(f"進度: {progress_info}")
        print(f"剩餘: {len(valid_files)-i} 個檔案")
        print(f"成功: {success_count}/{i-1} ({success_count/(i-1)*100:.1f}% 成功率)" if i > 1 else "成功: 0/0")
        print(f"{'='*80}")
        
        if validator.validate_and_fix(f):
            success_count += 1
        time.sleep(1)
    
    # 最終報告
    progress_tracker.print_status()
    print(f"\n🎉 完成！處理 {len(valid_files)} 檔案，成功修復 {success_count} 個")
    print(f"📊 最終成功率: {success_count/len(valid_files)*100:.1f}%")
    
    # 顯示失敗檔案
    failed_files = []
    with open(progress_tracker.failed_file, 'r') as f:
        failed_files = [line.strip() for line in f.readlines() if line.strip()]
    
    if failed_files:
        print(f"\n❌ 失敗檔案清單 ({len(failed_files)} 個):")
        for failed in failed_files[:10]:  # 只顯示前10個
            print(f"   - {failed}")
        if len(failed_files) > 10:
            print(f"   ... 還有 {len(failed_files)-10} 個檔案")

if __name__ == "__main__":
    main()
PYEOF

# 找到可用的 Python
find_python() {
    # 優先順序: venv -> python3 -> python
    if [ -f "$PROJECT_ROOT/.venv/bin/python" ]; then
        echo "$PROJECT_ROOT/.venv/bin/python"
    elif command -v python3 &> /dev/null; then
        echo "python3"
    elif command -v python &> /dev/null; then
        echo "python"
    else
        echo ""
    fi
}

PYTHON_CMD=$(find_python)
if [ -z "$PYTHON_CMD" ]; then
    echo -e "${RED}❌ 找不到 Python，請先安裝 Python 3${NC}"
    exit 1
fi

echo -e "${GREEN}✓ 使用 Python: $PYTHON_CMD${NC}"
echo -e "${CYAN}📁 專案根目錄: $PROJECT_ROOT${NC}"
echo -e "${CYAN}📂 目標目錄: $TARGET_DIR${NC}"
echo -e "${CYAN}📂 元件目錄: $COMPONENTS_DIR${NC}"

# 持續迴圈執行
run_validation_loop() {
    echo -e "\n${BLUE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}  開始第 $((CURRENT_LOOP + 1)) 次驗證迴圈${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

    $PYTHON_CMD /tmp/multi_role_validator.py \
        "$TARGET_DIR" \
        "$API_KEY" "$API_BASE" "$API_MODEL" \
        "$GROQ_API_KEY" "$GROQ_API_BASE" "$GROQ_MODEL" \
        "$GEMINI_API_KEY" \
        "$SCRIPT_DIR/../progress" \
        "$COMPONENTS_DIR"

    return $?
}

# 主迴圈
echo -e "${YELLOW}🔄 啟動持續自動修復迴圈...${NC}"
echo -e "${YELLOW}   按 Ctrl+C 停止${NC}"

while true; do
    CURRENT_LOOP=$((CURRENT_LOOP + 1))

    run_validation_loop
    EXIT_CODE=$?

    if [ $EXIT_CODE -ne 0 ]; then
        echo -e "${YELLOW}⚠️  迴圈 $CURRENT_LOOP 遇到錯誤 (代碼: $EXIT_CODE)，${LOOP_DELAY} 秒後重試...${NC}"
    else
        echo -e "${GREEN}✅ 迴圈 $CURRENT_LOOP 完成${NC}"
    fi

    # 檢查是否達到最大迴圈次數
    if [ $MAX_LOOPS -gt 0 ] && [ $CURRENT_LOOP -ge $MAX_LOOPS ]; then
        echo -e "${GREEN}🎉 已達到最大迴圈次數 ($MAX_LOOPS)，結束執行${NC}"
        break
    fi

    # 等待後繼續下一次迴圈
    echo -e "${CYAN}⏳ ${LOOP_DELAY} 秒後開始下一次迴圈... (按 Ctrl+C 停止)${NC}"
    sleep $LOOP_DELAY
done

echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  自動修復迴圈結束${NC}"
echo -e "${GREEN}  總共執行 $CURRENT_LOOP 次迴圈${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
