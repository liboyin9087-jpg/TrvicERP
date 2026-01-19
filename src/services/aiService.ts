import OpenAI from 'openai';

interface Suggestion {
  name: string;
  region: string;
  duration: number;
  reason: string;
  tags: string[];
}

interface Plan {
  [key: string]: unknown;
}

interface AIResponse {
  suggestions: Suggestion[];
}

// 使用環境變數或預設 API Key（生產環境建議使用環境變數）
// 注意：SiliconFlow 使用 api.siliconflow.com（國際版）或 api.siliconflow.cn（中國版）
const client = new OpenAI({
  apiKey: import.meta.env.VITE_SILICONFLOW_API_KEY || 'sk-datneleaegsucsfbqrlsdgzppzcoxhzgeurtseabxeposdvg', 
  baseURL: 'https://api.siliconflow.com/v1', // 使用國際版 API
  dangerouslyAllowBrowser: true
});

export const aiService = {
  async getDeepSeekSuggestions(
    currentPlan: Plan, 
    userPreference: string = '喜歡深度文化體驗，不要太趕'
  ): Promise<AIResponse> {
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

      const content = response.choices[0]?.message?.content || '{"suggestions": []}';
      return JSON.parse(content) as AIResponse;
    } catch (error) {
      console.error('DeepSeek AI Error:', error);
      return { suggestions: [] };
    }
  },

  async analyzeImageWithQwen(
    imageBase64: string, 
    prompt: string = '這張圖片裡有什麼旅遊資訊？'
  ): Promise<string | null> {
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

      return response.choices[0]?.message?.content || null;
    } catch (error) {
      console.error('Qwen Vision Error:', error);
      throw new Error('圖片分析失敗');
    }
  }
};