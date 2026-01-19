import OpenAI from "openai";

// 初始化 SiliconFlow 客戶端
export const siliconClient = new OpenAI({
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY, 
  baseURL: "https://api.siliconflow.cn/v1",
  dangerouslyAllowBrowser: true // 允許前端直接呼叫 (注意：生產環境建議透過後端轉發)
});

// 快速測試與呼叫函數
export const chatWithSiliconFlow = async (message: string) => {
  try {
    const response = await siliconClient.chat.completions.create({
      model: "deepseek-ai/DeepSeek-V3", // 預設使用 DeepSeek V3，可依需求修改
      messages: [
        { role: "system", content: "你是一個專業的旅遊業助手。" },
        { role: "user", content: message }
      ],
      stream: false,
    });
    return response.choices[0].message.content;
  } catch (error) {
    console.error("SiliconFlow API Error:", error);
    throw error;
  }
};
