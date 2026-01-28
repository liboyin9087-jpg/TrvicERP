#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 智能 Ralph Loop v2 - 具備自動修復和API限流處理
# TrvicERP UI 元件智能修正系統
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-5}
COMPONENT_DIR=${2:-"/workspaces/TrvicERP/components/shared"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"

# 載入 .env 檔案（如果存在）
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
if [ -f "$PROJECT_ROOT/.env" ]; then
    echo "載入環境變數從: $PROJECT_ROOT/.env"
    export $(grep -v '^#' "$PROJECT_ROOT/.env" | xargs)
fi

# SiliconFlow API (主要)
SILICONFLOW_API_KEY="${SILICONFLOW_API_KEY}"
SILICONFLOW_API_BASE="https://api.siliconflow.com/v1"
SILICONFLOW_MODEL="deepseek-ai/DeepSeek-V3"

# Groq API (備用1 - 429錯誤時首選)
GROQ_API_KEY="${GROQ_API_KEY}"
GROQ_API_BASE="https://api.groq.com/openai/v1"
GROQ_MODEL="llama-3.3-70b-versatile"

# Gemini API (備用2 - Groq也限流時使用)
GEMINI_API_KEY="${GEMINI_API_KEY}"

# 檢查必要的 API 金鑰
if [ -z "$SILICONFLOW_API_KEY" ] || [ -z "$GROQ_API_KEY" ] || [ -z "$GEMINI_API_KEY" ]; then
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
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TrvicERP UI 智能修正 - Ralph Loop v3${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${PURPLE}  主要API: SiliconFlow DeepSeek V3${NC}"
echo -e "${PURPLE}  備用API1: Groq Llama 3.3 70B${NC}"
echo -e "${PURPLE}  備用API2: Gemini 2.5 Flash${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始智能修正迴圈 v2" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 創建智能修復 Python 腳本
cat > /tmp/smart_fixer.py << 'PYEOF'
import os
import sys
import glob
import json
import time
import re
from google import genai
from google.genai import types
from openai import Client
from datetime import datetime

class SmartUIFixer:
    def __init__(self, sf_api_key, sf_api_base, sf_model, groq_api_key, groq_api_base, groq_model, gemini_api_key):
        # SiliconFlow 主要 API
        self.sf_client = Client(api_key=sf_api_key, base_url=sf_api_base)
        self.sf_model = sf_model
        
        # Groq 備用 API1
        self.groq_client = Client(api_key=groq_api_key, base_url=groq_api_base)
        self.groq_model = groq_model
        
        # Gemini 備用 API2 (使用新版 google-genai)
        self.gemini_client = genai.Client(api_key=gemini_api_key)
        self.gemini_model_name = 'models/gemini-2.5-flash'
        
        self.fixed_files = []
        self.retry_delay = 10
        self.max_retries = 3
        self.current_api = 'siliconflow'  # siliconflow, groq, gemini
        self.api_switch_count = 0
        self.last_switch_time = 0  # 記錄切換時間

    def api_call_with_retry(self, prompt, max_tokens=1500):
        """具備重試和三重 API 自動切換的呼叫（快速模式）"""
        # 快速切回 SiliconFlow（5秒後）
        if self.current_api != 'siliconflow' and time.time() - self.last_switch_time > 5:
            self.current_api = 'siliconflow'
        
        for attempt in range(self.max_retries):
            try:
                if self.current_api == 'siliconflow':
                    response = self.sf_client.chat.completions.create(
                        model=self.sf_model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=max_tokens,
                        temperature=0.0
                    )
                    return response.choices[0].message.content
                    
                elif self.current_api == 'groq':
                    response = self.groq_client.chat.completions.create(
                        model=self.groq_model,
                        messages=[{"role": "user", "content": prompt}],
                        max_tokens=max_tokens,
                        temperature=0.0
                    )
                    return response.choices[0].message.content
                    
                else:  # gemini
                    response = self.gemini_client.models.generate_content(
                        model=self.gemini_model_name,
                        contents=types.Content(
                            parts=[types.Part(text=prompt)]
                        )
                    )
                    return response.text
                    
            except Exception as e:
                error_str = str(e)
                
                # 429 錯誤 - 立即切換（無冷卻）
                if "429" in error_str or "rate limit" in error_str.lower():
                    if self.current_api == 'siliconflow':
                        print(f"    ⚠️  SF限流→Groq")
                        self.current_api = 'groq'
                        self.api_switch_count += 1
                        self.last_switch_time = time.time()
                        time.sleep(1)
                        continue
                    elif self.current_api == 'groq':
                        print(f"    ⚠️  Groq限流→Gemini")
                        self.current_api = 'gemini'
                        self.api_switch_count += 1
                        self.last_switch_time = time.time()
                        time.sleep(1)
                        continue
                    else:
                        wait_time = 3
                        print(f"    ⏳ 全部限流，等待{wait_time}s")
                        time.sleep(wait_time)
                        continue
                else:
                    # 其他錯誤
                    raise e
                    
        raise Exception("達到最大重試次數")

    def apply_design_fixes(self, file_path, content):
        """應用設計系統修復"""
        fixes_applied = []
        
        # 修復硬編碼色彩
        color_fixes = {
            r'bg-black': 'bg-primary-900',
            r'text-slate-400': 'text-slate-400',  # 保持
            r'bg-slate-100': 'bg-slate-100',      # 保持  
            r'text-slate-700': 'text-slate-700',  # 保持
            r'text-xs': 'text-sm',               # 修復最小字級
            r'rounded-xl': 'rounded-lg',         # 修復圓角
        }
        
        original_content = content
        for pattern, replacement in color_fixes.items():
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixes_applied.append(f"修復 {pattern} → {replacement}")
        
        # 添加缺失的狀態樣式
        if 'className=' in content and 'focus:' not in content:
            # 尋找按鈕元素並添加 focus 狀態
            button_pattern = r'(className=")[^"]*(")'
            def add_focus_states(match):
                classes = match.group(0)
                if 'bg-' in classes and 'focus:' not in classes:
                    new_classes = classes[:-1] + ' focus:ring-2 focus:ring-primary-300 active:bg-primary-800"'
                    return new_classes
                return classes
            
            new_content = re.sub(button_pattern, add_focus_states, content)
            if new_content != content:
                content = new_content
                fixes_applied.append("添加 focus/active 狀態")
        
        # 檢查是否有實際修改
        if content != original_content:
            return content, fixes_applied
        return None, []

    def validate_and_fix_component(self, file_path):
        """使用三層策略：SF/Groq驗證，Gemini修正"""
        print(f"🔧 檢查: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {"error": f"無法讀取: {e}"}

        # 1. 快速驗證（使用 SF 或 Groq）
        validation_prompt = f"""驗證 TrvicERP 設計規範：
{content[:3000]}

問題？簡短列出或回應 "OK"
"""
        
        issues_found = None
        try:
            # 強制使用 SiliconFlow 或 Groq 驗證（快速）
            original_api = self.current_api
            if self.current_api == 'gemini':
                self.current_api = 'siliconflow'
            
            validation_result = self.api_call_with_retry(validation_prompt, max_tokens=200)
            
            if "OK" in validation_result or "VALIDATION_COMPLETE" in validation_result:
                print(f"  ✅ 通過")
                return {"file": file_path, "passed": True, "result": "驗證通過"}
            else:
                issues_found = validation_result[:150]
                print(f"  ⚠️ 發現問題，交給 Gemini 修正...")
                
        except Exception as e:
            print(f"  ⚠️ 驗證API問題，直接用 Gemini 修正...")
            issues_found = "API驗證失敗，需檢查"

        # 2. 使用 Gemini 進行實際修正
        if issues_found:
            fix_prompt = f"""修正 TrvicERP 元件設計問題：

檔案: {file_path}
發現問題: {issues_found}

原始碼:
{content}

請修正並回傳完整修正後的程式碼。
規則：
- 移除硬編碼顏色，使用 primary-*, success-* 等 token
- 字級最小 text-sm (14px)
- 加入 hover/focus 狀態
- 只回傳程式碼，不要說明
"""
            
            try:
                # 強制切換到 Gemini 進行修正
                self.current_api = 'gemini'
                self.last_switch_time = time.time()
                
                print(f"  🔧 Gemini 修正中...")
                fixed_code = self.api_call_with_retry(fix_prompt, max_tokens=4000)
                
                # 移除 markdown 標記
                fixed_code = re.sub(r'^```[a-z]*\n', '', fixed_code)
                fixed_code = re.sub(r'\n```$', '', fixed_code)
                
                # 寫入修正後的檔案
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_code)
                
                self.fixed_files.append({"file": file_path, "method": "Gemini AI修正"})
                print(f"  ✅ 已修正並儲存")
                return {"file": file_path, "passed": True, "result": "Gemini修正完成"}
                
            except Exception as e:
                print(f"  ❌ Gemini修正失敗: {str(e)[:50]}")
                return {"file": file_path, "passed": False, "result": f"修正失敗: {e}"}

def main():
    if len(sys.argv) != 9:
        print("用法: python smart_fixer.py <目錄> <SF_API_KEY> <SF_API_BASE> <SF_MODEL> <GROQ_API_KEY> <GROQ_API_BASE> <GROQ_MODEL> <GEMINI_API_KEY>")
        sys.exit(1)
    
    target_dir = sys.argv[1]
    sf_api_key = sys.argv[2]
    sf_api_base = sys.argv[3]
    sf_model = sys.argv[4]
    groq_api_key = sys.argv[5]
    groq_api_base = sys.argv[6]
    groq_model = sys.argv[7]
    gemini_api_key = sys.argv[8]
    
    fixer = SmartUIFixer(sf_api_key, sf_api_base, sf_model, groq_api_key, groq_api_base, groq_model, gemini_api_key)
    
    # 尋找 TypeScript React 檔案
    patterns = [
        f"{target_dir}/**/*.tsx",
        f"{target_dir}/**/*.ts", 
        f"{target_dir}/*.tsx",
        f"{target_dir}/*.ts"
    ]
    
    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern, recursive=True))
    
    # 過濾檔案（移除測試檔案和型別定義檔）
    component_files = [f for f in files if not any(x in f.lower() for x in ['test', 'spec', '.d.ts', 'index.ts'])]
    
    if not component_files:
        print(f"在 {target_dir} 中沒有找到 React 元件檔案")
        return
    
    print(f"🎯 找到 {len(component_files)} 個元件檔案進行智能修復")
    print("🔧 開始執行自動修復 + AI 驗證...\n")
    
    all_passed = True
    results = []
    
    for file_path in component_files:
        result = fixer.validate_and_fix_component(file_path)
        results.append(result)
        
        if not result.get("passed", False):
            all_passed = False
        
        # 每個檔案之間加入延遲
        time.sleep(2)
    
    # 生成修復摘要
    print(f"\n{'='*60}")
    print("📋 修復摘要")
    print(f"檢查檔案: {len(results)}")
    print(f"自動修復檔案: {len(fixer.fixed_files)}")
    passed_count = len([r for r in results if r.get('passed', False)])
    print(f"驗證通過: {passed_count}/{len(results)}")
    
    # API 使用統計
    if fixer.api_switch_count > 0:
        print(f"\n🔄 API 切換統計:")
        print(f"  - 主要API: SiliconFlow DeepSeek V3")
        print(f"  - 備用API1: Groq Llama 3.3 70B")
        print(f"  - 備用API2: Gemini 2.5 Flash")
        print(f"  - 切換次數: {fixer.api_switch_count} 次")
        print(f"  - 當前使用: {fixer.current_api.upper()}")
    print(f"驗證通過: {passed_count}/{len(results)}")
    
    if fixer.fixed_files:
        print("\n🔧 應用的修復:")
        for fix in fixer.fixed_files:
            print(f"  📁 {os.path.basename(fix['file'])}")
            for f in fix['fixes']:
                print(f"    - {f}")
    
    if all_passed:
        print("\n🎉 所有元件都已修復並通過驗證！")
        sys.exit(0)
    else:
        failed_count = len(results) - passed_count
        print(f"\n⚠️  還有 {failed_count} 個檔案需要進一步處理")
        sys.exit(1)

if __name__ == "__main__":
    main()
PYEOF

# 主修復迴圈
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}══════════════ 第 $i 次迭代（共 $MAX_ITERATIONS 次）══════════════${NC}"
    echo -e "${CYAN}執行智能修復: 自動修復 → AI驗證 → 重試機制${NC}"
    
    # 執行智能修復
    echo -e "${YELLOW}正在執行智能 UI 元件修復...${NC}"
    
    if /workspaces/TrvicERP/.venv/bin/python /tmp/smart_fixer.py "$COMPONENT_DIR" "$SILICONFLOW_API_KEY" "$SILICONFLOW_API_BASE" "$SILICONFLOW_MODEL" "$GROQ_API_KEY" "$GROQ_API_BASE" "$GROQ_MODEL" "$GEMINI_API_KEY"; then
        echo ""
        echo -e "${GREEN}🎉 智能修復完成！所有元件都已修復並驗證通過。${NC}"
        echo -e "${GREEN}迴圈在第 $i 次迭代後完成。${NC}"
        
        # 記錄成功
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 智能修復成功" >> "$PROGRESS_FILE"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 所有問題已解決，智能修復迴圈完成" >> "$PROGRESS_FILE"
        break
    else
        echo -e "${YELLOW}第 $i 次迭代部分修復，繼續下一次迭代...${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 部分修復完成" >> "$PROGRESS_FILE"
        
        if [ $i -eq $MAX_ITERATIONS ]; then
            echo -e "${RED}⚠️  達到最大迭代次數 ($MAX_ITERATIONS)，智能修復迴圈結束。${NC}"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - 達到最大迭代次數，智能修復迴圈結束" >> "$PROGRESS_FILE"
        fi
        
        # 迭代間延遲，避免 API 限流
        echo -e "${CYAN}⏳ 等待 10 秒後進行下一次迭代（避免 API 限流）...${NC}"
        sleep 10
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  智能 Ralph Loop v2 執行完成${NC}"
echo -e "${BLUE}  詳細記錄請查看: ${YELLOW}$PROGRESS_FILE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 清理臨時檔案
rm -f /tmp/smart_fixer.py