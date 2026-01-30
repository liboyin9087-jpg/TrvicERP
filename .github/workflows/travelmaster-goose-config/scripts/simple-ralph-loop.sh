#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# 簡化版 Ralph Loop - 直接使用 OpenAI 客戶端進行 UI 元件驗證
# ═══════════════════════════════════════════════════════════════

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MAX_ITERATIONS=${1:-3}
COMPONENT_DIR=${2:-"/workspaces/TravelMaster/components/shared"}
PROGRESS_FILE="$SCRIPT_DIR/../.validation-progress.log"
API_KEY="${SILICONFLOW_API_KEY:-}"
API_BASE="${SILICONFLOW_API_BASE:-https://api.siliconflow.com/v1}"

# 檢查必要的 API 金鑰
if [ -z "$API_KEY" ]; then
    echo -e "${RED}❌ 錯誤：未設定 SILICONFLOW_API_KEY 環境變數${NC}"
    echo -e "${YELLOW}請執行：export SILICONFLOW_API_KEY='your-api-key'${NC}"
    exit 1
fi

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  TravelMaster UI 驗證 - 簡化版 Ralph Loop${NC}"
echo -e "${BLUE}  最大迭代次數: ${YELLOW}$MAX_ITERATIONS${NC}"
echo -e "${BLUE}  目標目錄: ${YELLOW}$COMPONENT_DIR${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 初始化進度檔案
mkdir -p "$(dirname "$PROGRESS_FILE")"
echo "$(date '+%Y-%m-%d %H:%M:%S') - 開始簡化驗證迴圈" > "$PROGRESS_FILE"
echo "目標目錄: $COMPONENT_DIR" >> "$PROGRESS_FILE"
echo "最大迭代: $MAX_ITERATIONS" >> "$PROGRESS_FILE"
echo "---" >> "$PROGRESS_FILE"

# 創建 Python 驗證腳本
cat > /tmp/ui_validator.py << 'PYEOF'
import os
import sys
import glob
import json
from openai import Client

def validate_component(file_path, api_key, api_base):
    """驗證單個 UI 元件"""
    client = Client(api_key=api_key, base_url=api_base)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return {"error": f"無法讀取檔案: {e}"}
    
    prompt = f"""
請分析以下 React TypeScript 元件是否符合 TravelMaster 設計系統規範：

檔案: {file_path}
內容:
```typescript
{content}
```

檢查項目：
1. 硬編碼顏色值（如 #ff0000, #cccccc 等）
2. 內聯樣式使用
3. 設計系統代碼使用
4. TypeScript 類型定義
5. 元件結構和命名

請提供：
- 問題清單
- 修正建議
- 改進後的程式碼（如有需要）

如果沒有問題，請回應 "VALIDATION_COMPLETE"。
"""
    
    try:
        response = client.chat.completions.create(
            model="deepseek-ai/DeepSeek-V3",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=2048,
            temperature=0.0
        )
        
        result = response.choices[0].message.content
        return {
            "file": file_path,
            "result": result,
            "completed": "VALIDATION_COMPLETE" in result
        }
    except Exception as e:
        return {"error": f"API 呼叫失敗: {e}"}

def main():
    if len(sys.argv) != 4:
        print("用法: python ui_validator.py <目錄> <API_KEY> <API_BASE>")
        sys.exit(1)
    
    target_dir = sys.argv[1]
    api_key = sys.argv[2]
    api_base = sys.argv[3]
    
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
    
    # 過濾掉測試檔案和類型檔案
    component_files = [f for f in files if not any(x in f.lower() for x in ['test', 'spec', '.d.ts', 'index.ts'])]
    
    if not component_files:
        print(f"在 {target_dir} 中沒有找到 React 元件檔案")
        return
    
    print(f"找到 {len(component_files)} 個元件檔案")
    
    results = []
    all_completed = True
    
    for file_path in component_files[:5]:  # 限制每次處理 5 個檔案
        print(f"正在驗證: {file_path}")
        result = validate_component(file_path, api_key, api_base)
        results.append(result)
        
        if not result.get("completed", False):
            all_completed = False
        
        # 輸出結果
        if "error" in result:
            print(f"❌ 錯誤: {result['error']}")
        else:
            print(f"✅ 完成: {result.get('completed', False)}")
            if not result.get("completed", False):
                print(f"發現問題:\n{result['result'][:200]}...")
    
    # 輸出總結
    print(f"\n═══ 驗證總結 ═══")
    print(f"檢查檔案: {len(results)}")
    print(f"全部通過: {all_completed}")
    
    if all_completed:
        print("🎉 所有元件都符合規範！")
        sys.exit(0)
    else:
        print("⚠️  發現需要修正的問題")
        sys.exit(1)

if __name__ == "__main__":
    main()
PYEOF

# 主驗證迴圈
for i in $(seq 1 $MAX_ITERATIONS); do
    echo ""
    echo -e "${BLUE}══════════════ 第 $i 次迭代（共 $MAX_ITERATIONS 次）══════════════${NC}"
    
    # 執行 Python 驗證
    echo -e "${YELLOW}正在執行 UI 元件驗證...${NC}"
    
    if /workspaces/TravelMaster/.venv/bin/python /tmp/ui_validator.py "$COMPONENT_DIR" "$API_KEY" "$API_BASE"; then
        echo ""
        echo -e "${GREEN}🎉 驗證完成！所有元件都符合規範。${NC}"
        echo -e "${GREEN}迴圈在第 $i 次迭代後完成。${NC}"
        
        # 記錄成功
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 驗證成功" >> "$PROGRESS_FILE"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 所有問題已解決，迴圈完成" >> "$PROGRESS_FILE"
        break
    else
        echo -e "${YELLOW}第 $i 次迭代發現問題，繼續下一次迭代...${NC}"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - 第 $i 次迭代: 發現問題" >> "$PROGRESS_FILE"
        
        if [ $i -eq $MAX_ITERATIONS ]; then
            echo -e "${RED}⚠️  達到最大迭代次數 ($MAX_ITERATIONS)，迴圈結束。${NC}"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - 達到最大迭代次數，迴圈結束" >> "$PROGRESS_FILE"
        fi
        
        # 迭代間延遲
        sleep 2
    fi
done

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Ralph Loop 執行完成${NC}"
echo -e "${BLUE}  詳細記錄請查看: ${YELLOW}$PROGRESS_FILE${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════════${NC}"

# 清理臨時檔案
rm -f /tmp/ui_validator.py