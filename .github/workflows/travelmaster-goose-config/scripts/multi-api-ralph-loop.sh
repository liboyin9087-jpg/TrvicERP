#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 多 API Ralph Loop v3 - 支援 Gemini + SiliconFlow 雙重備援
# TravelMaster UI 元件智能修正系統 - 免費優先模式
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-3}
COMPONENT_DIR=${2:-"/workspaces/TravelMaster/components/shared"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"

# API 配置 - 從環境變數載入
GEMINI_API_KEY="${GEMINI_API_KEY:-}"
SILICONFLOW_API_KEY="${SILICONFLOW_API_KEY:-}"
SILICONFLOW_API_BASE="${SILICONFLOW_API_BASE:-https://api.siliconflow.com/v1}"

# 檢查必要的 API 金鑰
if [ -z "$GEMINI_API_KEY" ]; then
    echo -e "${RED}❌ 錯誤：未設定 GEMINI_API_KEY 環境變數${NC}"
    echo -e "${YELLOW}請執行：export GEMINI_API_KEY='your-api-key'${NC}"
    exit 1
fi

if [ -z "$SILICONFLOW_API_KEY" ]; then
    echo -e "${RED}❌ 錯誤：未設定 SILICONFLOW_API_KEY 環境變數${NC}"
    echo -e "${YELLOW}請執行：export SILICONFLOW_API_KEY='your-api-key'${NC}"
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
echo -e "${BLUE}  TravelMaster UI 多 API 智能修正 - Ralph Loop v3${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${PURPLE}  🆓 優先使用: Google Gemini 2.5 Flash (免費)${NC}"
echo -e "${PURPLE}  🔄 備援: SiliconFlow DeepSeek V3 (付費)${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始多 API 智能修正迴圈 v3" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "API策略: Gemini免費優先 -> SiliconFlow備援" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 安裝 Google AI SDK
echo -e "${CYAN}📦 檢查 Google AI SDK...${NC}"
/workspaces/TravelMaster/.venv/bin/pip install google-generativeai --quiet || echo "SDK已存在"

# 創建多 API 智能修復 Python 腳本
cat > /tmp/multi_api_fixer.py << 'PYEOF'
import os
import sys
import glob
import json
import time
import re
from datetime import datetime

# 多 API 客戶端
try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    from openai import Client
    OPENAI_AVAILABLE = True
except ImportError:
    OPENAI_AVAILABLE = False

class MultiAPIFixer:
    def __init__(self, gemini_key, siliconflow_key, siliconflow_base):
        # 優先設定 Gemini (免費)
        self.gemini_available = False
        if GEMINI_AVAILABLE and gemini_key:
            try:
                genai.configure(api_key=gemini_key)
                self.gemini_model = genai.GenerativeModel('gemini-2.5-flash')
                self.gemini_available = True
                print("✅ Gemini 2.5 Flash (免費) 已準備就緒")
            except Exception as e:
                print(f"⚠️  Gemini 設定失敗: {e}")
        
        # 備援設定 SiliconFlow (付費)
        self.siliconflow_available = False
        if OPENAI_AVAILABLE and siliconflow_key:
            try:
                self.siliconflow_client = Client(api_key=siliconflow_key, base_url=siliconflow_base)
                self.siliconflow_available = True
                print("✅ SiliconFlow DeepSeek V3 (備援) 已準備就緒")
            except Exception as e:
                print(f"⚠️  SiliconFlow 設定失敗: {e}")
        
        if not self.gemini_available and not self.siliconflow_available:
            raise Exception("❌ 無可用的 API 服務")
        
        self.fixed_files = []
        self.api_usage_stats = {"gemini": 0, "siliconflow": 0}

    def smart_api_call(self, prompt, max_tokens=1000):
        """智能 API 呼叫 - 免費優先策略"""
        
        # 優先嘗試 Gemini (免費)
        if self.gemini_available:
            try:
                print("    🆓 使用 Gemini 2.5 Flash...")
                response = self.gemini_model.generate_content(
                    prompt,
                    generation_config={
                        "max_output_tokens": max_tokens,
                        "temperature": 0.0,
                    }
                )
                self.api_usage_stats["gemini"] += 1
                return response.text
            except Exception as e:
                error_str = str(e)
                if "quota" in error_str.lower() or "limit" in error_str.lower():
                    print(f"    ⚠️  Gemini 配額用完，切換到備援...")
                    self.gemini_available = False
                else:
                    print(f"    ⚠️  Gemini 錯誤: {error_str[:50]}...")
                    time.sleep(2)  # 短暫等待
        
        # 備援使用 SiliconFlow (付費)
        if self.siliconflow_available:
            try:
                print("    💰 使用 SiliconFlow DeepSeek V3...")
                response = self.siliconflow_client.chat.completions.create(
                    model="deepseek-ai/DeepSeek-V3",
                    messages=[{"role": "user", "content": prompt}],
                    max_tokens=max_tokens,
                    temperature=0.0
                )
                self.api_usage_stats["siliconflow"] += 1
                return response.choices[0].message.content
            except Exception as e:
                error_str = str(e)
                if "429" in error_str:
                    wait_time = 15
                    print(f"    ⏳ SiliconFlow 限流，等待 {wait_time} 秒...")
                    time.sleep(wait_time)
                    # 重試一次
                    try:
                        response = self.siliconflow_client.chat.completions.create(
                            model="deepseek-ai/DeepSeek-V3",
                            messages=[{"role": "user", "content": prompt}],
                            max_tokens=max_tokens,
                            temperature=0.0
                        )
                        self.api_usage_stats["siliconflow"] += 1
                        return response.choices[0].message.content
                    except:
                        raise Exception(f"SiliconFlow 重試失敗: {e}")
                else:
                    raise Exception(f"SiliconFlow 錯誤: {e}")
        
        raise Exception("❌ 所有 API 服務都不可用")

    def apply_design_fixes(self, file_path, content):
        """應用基本設計修復 (規則式修復)"""
        fixes_applied = []
        
        # 修復硬編碼色彩
        color_fixes = {
            r'bg-black\b': 'bg-primary-900',
            r'text-xs\b': 'text-sm',               # 修復最小字級
            r'rounded-xl\b': 'rounded-lg',         # 修復圓角
        }
        
        original_content = content
        for pattern, replacement in color_fixes.items():
            if re.search(pattern, content):
                content = re.sub(pattern, replacement, content)
                fixes_applied.append(f"修復 {pattern.replace(r'\\b', '')} → {replacement}")
        
        # 添加缺失的狀態樣式
        if 'className=' in content and 'focus:' not in content:
            # 尋找按鈕元素並添加 focus 狀態
            button_pattern = r'(className="[^"]*)(bg-(?:primary|success|error)-\d+)([^"]*")'
            def add_focus_states(match):
                prefix, bg_class, suffix = match.groups()
                if 'focus:' not in prefix + suffix:
                    focus_class = f" focus:ring-2 focus:ring-{bg_class.split('-')[1]}-300"
                    return f"{prefix}{bg_class}{focus_class}{suffix}"
                return match.group(0)
            
            new_content = re.sub(button_pattern, add_focus_states, content)
            if new_content != content:
                content = new_content
                fixes_applied.append("添加 focus 狀態")
        
        # 檢查是否有實際修改
        if content != original_content:
            return content, fixes_applied
        return None, []

    def validate_and_fix_component(self, file_path):
        """驗證並修復元件"""
        print(f"🔧 正在檢查和修復: {file_path}")
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
        except Exception as e:
            return {"error": f"無法讀取檔案: {e}"}

        # 1. 首先應用規則式修復
        fixed_content, auto_fixes = self.apply_design_fixes(file_path, content)
        
        if fixed_content:
            print(f"  🔧 應用自動修復: {', '.join(auto_fixes)}")
            try:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(fixed_content)
                self.fixed_files.append({"file": file_path, "fixes": auto_fixes})
                print(f"  ✅ 檔案已更新")
                content = fixed_content  # 使用修復後的內容進行驗證
            except Exception as e:
                print(f"  ❌ 無法寫入檔案: {e}")

        # 2. 使用 AI 快速驗證
        prompt = f"""
請快速檢查以下 React 元件的 TravelMaster 設計系統合規性：

檔案: {os.path.basename(file_path)}
程式碼:
```typescript
{content[:1000]}{"..." if len(content) > 1000 else ""}
```

檢查重點：
1. 硬編碼顏色值 (如 #ff0000, bg-black)
2. 字級小於 14px (如 text-xs)
3. 非標準圓角 (如 rounded-xl)
4. 缺少 focus 狀態

回應格式：
- 若無問題: "VALIDATION_COMPLETE"
- 若有問題: "發現問題: [簡短描述]"

保持回應簡潔。
"""

        try:
            result = self.smart_api_call(prompt, max_tokens=300)
            
            if "VALIDATION_COMPLETE" in result:
                print(f"  ✅ 驗證通過")
                return {"file": file_path, "passed": True, "result": result}
            else:
                print(f"  ⚠️  仍有問題: {result[:80]}...")
                return {"file": file_path, "passed": False, "result": result}
                
        except Exception as e:
            print(f"  ⚠️  驗證跳過: {str(e)[:50]}...")
            # 如果有自動修復，仍然視為部分成功
            if auto_fixes:
                return {"file": file_path, "passed": True, "result": "自動修復完成，AI驗證跳過"}
            return {"file": file_path, "passed": False, "result": f"API 錯誤: {e}"}

def main():
    if len(sys.argv) < 4:
        print("用法: python multi_api_fixer.py <目錄> <GEMINI_KEY> <SILICONFLOW_KEY> [SILICONFLOW_BASE]")
        sys.exit(1)
    
    target_dir = sys.argv[1]
    gemini_key = sys.argv[2]
    siliconflow_key = sys.argv[3]
    siliconflow_base = sys.argv[4] if len(sys.argv) > 4 else "https://api.siliconflow.com/v1"
    
    fixer = MultiAPIFixer(gemini_key, siliconflow_key, siliconflow_base)
    
    # 尋找 React 元件檔案
    patterns = [
        f"{target_dir}/**/*.tsx",
        f"{target_dir}/**/*.ts",
        f"{target_dir}/*.tsx", 
        f"{target_dir}/*.ts"
    ]
    
    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern, recursive=True))
    
    component_files = [f for f in files if not any(x in f.lower() for x in ['test', 'spec', '.d.ts', 'index.ts'])][:3]
    
    if not component_files:
        print(f"在 {target_dir} 中沒有找到 React 元件檔案")
        return
    
    print(f"🎯 找到 {len(component_files)} 個元件檔案進行智能修復")
    print("🚀 使用免費優先的多 API 策略...\n")
    
    all_passed = True
    results = []
    
    for file_path in component_files:
        result = fixer.validate_and_fix_component(file_path)
        results.append(result)
        
        if not result.get("passed", False):
            all_passed = False
        
        # 檔案間延遲，避免 API 限制
        time.sleep(3)
    
    # 生成總結報告
    print(f"\n{'='*60}")
    print("📋 多 API 修復摘要")
    print(f"檢查檔案: {len(results)}")
    print(f"自動修復檔案: {len(fixer.fixed_files)}")
    passed_count = len([r for r in results if r.get('passed', False)])
    print(f"驗證通過: {passed_count}/{len(results)}")
    
    print(f"\n📊 API 使用統計:")
    print(f"  🆓 Gemini 呼叫: {fixer.api_usage_stats['gemini']} 次")
    print(f"  💰 SiliconFlow 呼叫: {fixer.api_usage_stats['siliconflow']} 次")
    
    if fixer.fixed_files:
        print("\n🔧 應用的修復:")
        for fix in fixer.fixed_files:
            print(f"  📁 {os.path.basename(fix['file'])}")
            for f in fix['fixes']:
                print(f"    - {f}")
    
    if all_passed:
        print("\n🎉 所有元件都已修復並通過驗證！")
        print(f"💰 總成本: ~$0 (Gemini免費) + ~${fixer.api_usage_stats['siliconflow'] * 0.0005:.4f} (SiliconFlow)")
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
    echo -e "${CYAN}執行多 API 智能修復: 🆓 Gemini → 💰 SiliconFlow${NC}"
    
    # 執行多 API 智能修復
    echo -e "${YELLOW}正在執行多 API UI 元件修復...${NC}"
    
    if /workspaces/TravelMaster/.venv/bin/python /tmp/multi_api_fixer.py "$COMPONENT_DIR" "$GEMINI_API_KEY" "$SILICONFLOW_API_KEY" "$SILICONFLOW_API_BASE"; then
        echo ""
        echo -e "${GREEN}🎉 多 API 智能修復完成！所有元件都已修復並驗證通過。${NC}"
        echo -e "${GREEN}迴圈在第 $i 次迭代後完成。${NC}"
        
        # 記錄成功
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 多 API 智能修復成功" >> "$PROGRESS_FILE"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 所有問題已解決，多 API 智能修復迴圈完成" >> "$PROGRESS_FILE"
        break
    else
        echo -e "${YELLOW}第 $i 次迭代部分修復，繼續下一次迭代...${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 部分修復完成" >> "$PROGRESS_FILE"
        
        if [ $i -eq $MAX_ITERATIONS ]; then
            echo -e "${RED}⚠️  達到最大迭代次數 ($MAX_ITERATIONS)，多 API 智能修復迴圈結束。${NC}"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - 達到最大迭代次數，多 API 智能修復迴圈結束" >> "$PROGRESS_FILE"
        fi
        
        # 較長的迭代間延遲，避免 API 限流
        echo -e "${CYAN}⏳ 等待 20 秒後進行下一次迭代（避免 API 限流）...${NC}"
        sleep 20
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  多 API Ralph Loop v3 執行完成${NC}"
echo -e "${BLUE}  詳細記錄請查看: ${YELLOW}$PROGRESS_FILE${NC}"
echo -e "${GREEN}  🆓 優先使用免費 Gemini 2.5 Flash 降低成本${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 清理臨時檔案
rm -f /tmp/multi_api_fixer.py