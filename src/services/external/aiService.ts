import type { Spot } from '@/store/useItineraryBuilderStore';

interface AISpotRecommendation {
  name: string;
  description: string;
  county: string;
  tags: string[];
}

interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

const API_KEY = import.meta.env.VITE_SILICONFLOW_API_KEY;
const API_URL = import.meta.env.VITE_SILICONFLOW_BASE_URL
  ? `${import.meta.env.VITE_SILICONFLOW_BASE_URL}/chat/completions`
  : 'https://api.siliconflow.cn/v1/chat/completions';

export const aiService = {
  async getRecommendations(destination: string, existingSpots: Spot[]): Promise<Partial<Spot>[]> {
    if (!API_KEY) {
      console.error("缺少 VITE_SILICONFLOW_API_KEY");
      throw new Error("請先設定 AI 金鑰");
    }

    const spotNames = existingSpots.map(s => s.name).join(', ');
    const prompt = `
      你是專業的台灣旅遊規劃師。
      目的地：${destination}
      目前已安排景點：${spotNames || '尚無'}
      
      請推薦 3 個適合加入此行程的「順路」或「高相關性」景點。
      
      請嚴格遵守以下 JSON 格式回傳 (不要有 Markdown 標記，純 JSON)：
      [
        {
          "name": "景點名稱",
          "description": "簡短介紹 (50字內)",
          "county": "縣市",
          "tags": ["標籤1", "標籤2"]
        }
      ]
    `;

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-ai/DeepSeek-V3",
          messages: [
            { role: "system", content: "你是一個只輸出 JSON 的旅遊資料庫。" },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });

      if (!response.ok) {
        throw new Error(`AI API Error: ${response.status}`);
      }

      const data: AIResponse = await response.json();
      const content = data.choices[0].message.content;
      const cleanJson = content.replace(/```json/g, '').replace(/```/g, '').trim();
      const recommendations: AISpotRecommendation[] = JSON.parse(cleanJson);

      return recommendations.map((item, index) => ({
        id: `ai-rec-${Date.now()}-${index}`,
        ...item,
        category: ['文化深度體驗'],
        location: { lat: 0, lng: 0, address: item.county || '台灣' },
        image: `https://picsum.photos/seed/ai-${Date.now()}-${index}/400/300`,
        price: 0,
        duration: 60,
        season: ['春', '夏', '秋', '冬'],
        target_audience: ['大眾']
      }));

    } catch (error) {
      console.error("AI 推薦失敗:", error);
      return [];
    }
  }
};