import os

import requests

import json



# ==========================================

# 請在下方填入您的 SiliconFlow API Key

# ==========================================

API_KEY = "sk-datneleaegsucsfbqrlsdgzppzcoxhzgeurtseabxeposdvg" 



# 使用的模型

MODEL_NAME = "deepseek-ai/DeepSeek-V3" 



def read_files():

    # 設定要讀取的檔案類型

    exts = [".tsx", ".ts", ".js", ".json", ".sql", ".md"]

    skip = ["node_modules", ".git", "dist", ".next"]

    

    combined_text = ""

    count = 0

    print("Step 1: Reading project files...")

    

    for root, dirs, files in os.walk("."):

        # 排除不需要的資料夾

        for d in skip:

            if d in dirs:

                dirs.remove(d)

        

        for file in files:

            # 檢查副檔名

            is_target = False

            for ext in exts:

                if file.endswith(ext):

                    is_target = True

                    break

            

            if is_target:

                path = os.path.join(root, file)

                try:

                    with open(path, "r", encoding="utf-8") as f:

                        data = f.read()

                        # 拼接字串 (分行寫避免錯誤)

                        header = "\n\n--- FILE: " + path + " ---\n"

                        combined_text += header + data[:1500]

                        count += 1

                except:

                    pass

                    

    print("Files read: " + str(count))

    return combined_text



def run_ai(text):

    print("Step 2: Sending to SiliconFlow...")

    

    url = "https://api.siliconflow.com/v1/chat/completions"

    

    # 建立 Prompt (分行寫更安全)

    prompt = "你是資深技術長 CTO。"

    prompt += "請審查這個 'TrvicERP' 旅遊系統專案。"

    prompt += "請列出：1.邏輯缺失 2.技術漏洞 3.建議。"

    prompt += "\n專案內容如下：\n"

    

    full_msg = prompt + text[:25000]



    payload = {

        "model": MODEL_NAME,

        "messages": [

            {"role": "user", "content": full_msg}

        ],

        "temperature": 0.2

    }

    

    headers = {

        "Authorization": "Bearer " + API_KEY,

        "Content-Type": "application/json"

    }

    

    try:

        res = requests.post(url, json=payload, headers=headers)

        if res.status_code == 200:

            return res.json()['choices'][0]['message']['content']

        else:

            return "Error: " + str(res.status_code) + "\n" + res.text

    except Exception as e:

        return "Connection Error: " + str(e)



if __name__ == "__main__":

    content = read_files()

    if len(content) > 0:

        report = run_ai(content)

        

        print("\n" + "="*30)

        print(" ANALYSIS REPORT ")

        print("="*30 + "\n")

        print(report)

        

        # 存檔

        with open("Report.md", "w", encoding="utf-8") as f:

            f.write(report)

        print("\nSaved to Report.md")

    else:

        print("No files found.")

