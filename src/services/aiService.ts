import OpenAI from 'openai';

// 初始化 SiliconFlow Client
// 注意：正式上線建議透過後端 Proxy 以保護 Key
const client = new OpenAI({
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY, 
  baseURL: 'https://api.siliconflow.cn/v1',
  dangerouslyAllowBrowser: true // 允許前端直接呼叫
});

export const aiService = {
  /**
   * 🧠 邏輯大腦：使用 DeepSeek-V3 生成行程建議
   */
  async getDeepSeekSuggestions(
    currentPlan: any, 
    userPreference: string = '喜歡深度文化體驗，不要太趕'
  ) {
    try {
      const response = await client.chat.completions.create({
        model: 'deepseek-ai/DeepSeek-V3',
        messages: [
          {
            role: 'system',
            content: `你是一位資深的台灣旅遊規劃師。請根據使用者的行程草稿，推薦 3 個適合插入的景點。
            格式必須為 JSON Array，包含: name(景點名), region(地區), duration(建議停留分鐘), reason(推薦理由), tags(標籤陣列)。`
          },
          {
            role: 'user',
            content: `目前行程: ${JSON.stringify(currentPlan)}\n使用者偏好: ${userPreference}`
          }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '{"suggestions": []}';
      return JSON.parse(content);
    } catch (error) {
      console.error('DeepSeek AI Error:', error);
      // 發生錯誤時回傳空陣列，避免前端崩潰
      return { suggestions: [] };
    }
  },

  /**
   * 👁️ 視覺眼睛：使用 Qwen2-VL 解析圖片 (門票、菜單、景點照)
   */
  async analyzeImageWithQwen(imageBase64: string, prompt: string = '這張圖片裡有什麼旅遊資訊？') {
    try {
      const response = await client.chat.completions.create({
        model: 'Qwen/Qwen2-VL-72B-Instruct',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 1024,
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('Qwen Vision Error:', error);
      throw error;
    }
  }
};
