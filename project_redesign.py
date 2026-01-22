import os
import sys
import requests
import json

# =================設定區=================
# ⚠️ 安全提醒：請將您的 Key 設為環境變數，或在此填入新的 Key (不要上傳到公開網路)
API_KEY = "ssk-datneleaegsucsfbqrlsdgzppzcoxhzgeurtseabxeposdvg"  # 請填入您的新 Key

# 模型設定
MODEL_NAME = "deepseek-ai/DeepSeek-V3"
API_URL = "https://api.siliconflow.com/v1/chat/completions" # SiliconFlow 官方建議網址

# 指定要讀取的檔案類型 (只讀取前端相關)
TARGET_EXTENSIONS = {'.jsx', '.js', '.tsx', '.ts', '.css', '.html', '.vue'}

# 忽略的資料夾 (已優化：加入 ai-server, public 以節省 Token)
IGNORE_DIRS = {
    'node_modules', '.git', 'dist', 'build', '.next', 'coverage', 
    'ai-server', 'public', '.vscode', '.idea'
}
# =======================================

SYSTEM_PROMPT = """
# Role: Senior UI/UX Designer Agent

你是一位資深的 UI/UX 設計師，專精於將技術需求轉化為視覺解決方案。

## 🎯 你的任務
分析傳入的專案程式碼，並重寫為一個現代化的 React + Tailwind 版本。

## 輸出要求
1. **Envato/Figma 設計風格建議**
2. **AI Copilot (FAB/Dynamic Island) 的實作建議**
3. **視覺切換器 (Visual Angle Switcher) 的實作建議**
4. **具體的 Tailwind CSS 程式碼片段**

請直接輸出 Markdown 格式的重構報告。
"""

def scan_directory(directory_path):
    """遞迴讀取資料夾內的程式碼檔案"""
    code_content = ""
    file_count = 0
    
    print(f"📂 正在掃描目錄：{directory_path} ...")

    for root, dirs, files in os.walk(directory_path):
        # 過濾忽略的資料夾
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in TARGET_EXTENSIONS:
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        # 標記檔案位置
                        code_content += f"\n\n--- FILE: {file} ---\n"
                        code_content += content
                        file_count += 1
                        print(f"  - 讀取: {file}")
                except Exception as e:
                    print(f"  ⚠️ 無法讀取 {file}: {e}")

    print(f"✅ 掃描完成，共讀取 {file_count} 個檔案。")
    return code_content

def analyze_project(directory_path):
    # 1. 讀取專案程式碼
    project_code = scan_directory(directory_path)
    
    if not project_code:
        print("❌ 沒有讀取到任何有效的程式碼檔案。請確認路徑或副檔名設定。")
        return

    # Token 保護機制：DeepSeek V3 支援較長 Context，這裡設定較寬鬆的限制
    # 如果專案真的超大，建議分資料夾執行
    MAX_CHARS = 50000 
    if len(project_code) > MAX_CHARS:
        print(f"⚠️ 警告：專案程式碼過長 ({len(project_code)} 字元)，將僅傳送前 {MAX_CHARS} 字元...")
        project_code = project_code[:MAX_CHARS] + "\n...(truncated)..."

    # 2. 呼叫 API
    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "system",
                "content": SYSTEM_PROMPT
            },
            {
                "role": "user",
                "content": f"這是我的舊專案程式碼，請幫我依據指示進行 UI/UX 大改版與功能重構：\n\n{project_code}"
            }
        ],
        "max_tokens": 4096,
        "temperature": 0.7,
        "stream": False
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }

    print("\n🚀 正在將程式碼傳送至 SiliconFlow 進行分析 (這可能需要幾分鐘)...")
    
    try:
        response = requests.post(API_URL, headers=headers, json=payload, timeout=120) # 增加 timeout
        response.raise_for_status()
        
        result = response.json()
        
        if 'choices' in result and len(result['choices']) > 0:
            content = result['choices'][0]['message']['content']
            
            print("\n✅ 重構建議已生成！")
            
            # 儲存結果
            output_file = "project_redesign_plan.md"
            with open(output_file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"📄 請查看報告：{output_file}")
        else:
            print("❌ API 回傳格式不如預期：", result)

    except requests.exceptions.RequestException as e:
        print(f"❌ API 請求失敗：{e}")
        if 'response' in locals():
            print("錯誤詳情:", response.text)

if __name__ == "__main__":
    # 從指令參數讀取路徑，如果沒有就預設當前目錄
    target_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    
    if os.path.exists(target_dir):
        analyze_project(target_dir)
    else:
        print(f"❌ 找不到路徑：{target_dir}")