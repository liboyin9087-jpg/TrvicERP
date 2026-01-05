/**
 * Prompt Templates Library
 * 
 * 預定義的 AI Prompt 模板，確保一致性和品質
 * 
 * 使用方式:
 * import { PROMPTS, buildPrompt } from '@/constants/prompts';
 * const prompt = buildPrompt(PROMPTS.PROPOSAL, { destination: '日本', duration: '5天' });
 */

// ==============================================
// System Prompts (角色定義)
// ==============================================

export const SYSTEM_PROMPTS = {
  // 旅遊顧問角色
  TRAVEL_CONSULTANT: `你是一位資深旅遊顧問，專精於企業獎勵旅遊和團體旅遊規劃。
你的特點：
- 熟悉台灣企業文化和福委會運作
- 了解日本、韓國、東南亞等熱門旅遊目的地
- 擅長為不同產業（科技業、金融業、製造業）量身打造行程
- 使用專業但溫暖的語氣，避免過度推銷

重要規則：
1. 所有回覆使用繁體中文
2. 控制字數在指定範圍內
3. 不使用 Markdown 格式（無粗體、標題等）
4. 著重情感連結和獨特價值`,

  // 文案專家角色
  COPYWRITER: `你是一位精通市場行銷的文案專家，專門撰寫旅遊相關文案。
風格特點：
- 簡潔有力，直擊痛點
- 略帶幽默但不失專業
- 善用對比和比喻
- 避免陳腔濫調

語言：繁體中文
格式：純文字，無 Markdown`,

  // RFP 分析師角色
  RFP_ANALYST: `你是一位專業的招標文件分析師，協助旅行社分析和回應 RFP。
能力：
- 快速抓取 RFP 重點需求
- 識別潛在風險和機會
- 提供競爭力報價建議
- 撰寫專業的提案摘要

語言：繁體中文
格式：結構化但簡潔`,

  // 行程規劃師角色
  ITINERARY_PLANNER: `你是一位經驗豐富的行程規劃師。
專長：
- 優化行程動線，減少舟車勞頓
- 平衡觀光、用餐、休息時間
- 考慮季節、天氣、當地活動
- 預留彈性空間應對突發狀況

語言：繁體中文`,
};

// ==============================================
// User Prompt Templates
// ==============================================

export const PROMPTS = {
  // 提案生成
  PROPOSAL: `請根據以下資訊，生成一段吸引人的旅遊提案文案：

目的地：{{destination}}
天數：{{duration}}
人數：{{headcount}}
預算區間：{{budgetMin}} - {{budgetMax}} {{currency}}/人
特殊需求：{{requirements}}
目標對象：{{audience}}

已選配置：
{{configurations}}

請撰寫一段 80-100 字的提案文案，強調：
1. 此行程的獨特價值
2. 針對目標對象的特別安排
3. 情感層面的期待

只輸出文案內容，無需其他說明。`,

  // 競品警告文案
  COMPETITOR_WARNING: `客戶選擇了這個高品質選項：「{{optionTitle}}」（{{optionDescription}}）

請用幽默但專業的口吻，撰寫一句「競品警告」文案，暗示選擇低價替代品的風險。

規則：
1. 最多 2 句話
2. 略帶諷刺但不失禮貌
3. 突出高品質選項的優勢
4. 繁體中文

只輸出警告文案。`,

  // RFP 摘要
  RFP_SUMMARY: `請分析以下 RFP（招標文件）並提供摘要：

公司名稱：{{companyName}}
聯絡人：{{contactPerson}}
預計人數：{{headcount}} 人
預算範圍：{{budgetMin}} - {{budgetMax}} TWD/人
目的地偏好：{{destination}}
行程天數：{{duration}} 天
出發日期：{{departureDate}}
截止日期：{{deadline}}
特殊需求：{{specialRequirements}}
其他備註：{{notes}}

請提供：
1. 需求重點摘要（3-5 點）
2. 建議報價策略
3. 注意事項或風險提醒

控制在 200 字內。`,

  // 行程描述生成
  ITINERARY_DESCRIPTION: `請為以下行程日撰寫描述：

日期：第 {{dayNumber}} 天
地點：{{location}}
主要活動：{{activities}}
餐食安排：{{meals}}
住宿：{{accommodation}}

請用生動但專業的語氣，撰寫 50-80 字的行程描述，讓團員期待這一天的旅程。`,

  // 供應商評價摘要
  SUPPLIER_REVIEW: `請根據以下評價資訊，生成供應商摘要：

供應商名稱：{{supplierName}}
類型：{{supplierType}}
評價數量：{{reviewCount}}
平均評分：{{avgRating}}/5

正面評價關鍵詞：{{positiveKeywords}}
負面評價關鍵詞：{{negativeKeywords}}

請用 50 字以內摘要此供應商的優缺點，幫助同業快速判斷是否合作。`,

  // 投票選項描述
  VOTING_OPTION: `請為以下旅遊投票選項撰寫吸引人的描述：

選項名稱：{{optionName}}
目的地：{{destination}}
特色：{{highlights}}
價格：{{price}} TWD/人

請用 30-50 字描述此選項的亮點，讓員工想要投票給它。`,

  // 天氣提醒
  WEATHER_ADVICE: `根據以下天氣資訊，提供旅遊建議：

地點：{{location}}
日期：{{date}}
天氣：{{weather}}
氣溫：{{temperature}}°C
降雨機率：{{precipitation}}%

請用 30 字以內提供今日旅遊建議。`,
};

// ==============================================
// Audience-specific Context
// ==============================================

export const AUDIENCE_CONTEXT: Record<string, string> = {
  TECH: `目標對象：科技業團隊
重點強調：放鬆充電、靈感激發、數位排毒、高規格設施
避免：老套的團建口號、過度熱鬧的活動`,

  SALES: `目標對象：業務團隊
重點強調：慶功、夜生活、社交聯誼、獎勵體驗、高能量活動
氛圍：熱情、慶祝、犒賞`,

  EXECUTIVE: `目標對象：高階主管
重點強調：投資報酬率、高端人脈、效率、隱私、獨家體驗
風格：低調奢華、品味獨到`,

  MANUFACTURING: `目標對象：製造業團隊
重點強調：辛勞的犒賞、家庭同歡、實在的價值
氛圍：溫馨、感恩、輕鬆`,

  FINANCE: `目標對象：金融業團隊
重點強調：專業服務、風險管控、高端體驗、人脈交流
風格：穩重、可靠、尊榮`,

  GENERAL: `目標對象：一般企業團隊
重點強調：優質體驗、超值感受、團隊凝聚
氛圍：友善、愉快、難忘`,
};

// ==============================================
// Helper Functions
// ==============================================

/**
 * 將模板中的 {{variable}} 替換為實際值
 */
export function buildPrompt(template: string, variables: Record<string, string | number>): string {
  let result = template;
  
  for (const [key, value] of Object.entries(variables)) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(placeholder, String(value));
  }
  
  // 移除未填入的變數
  result = result.replace(/{{[^}]+}}/g, '');
  
  return result.trim();
}

/**
 * 建立完整的 messages 陣列供 API 使用
 */
export function buildMessages(
  systemPrompt: string,
  userPrompt: string
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * 根據受眾類型建立個人化提案 prompt
 */
export function buildProposalPrompt(params: {
  destination: string;
  duration: string;
  headcount: number;
  budgetMin: number;
  budgetMax: number;
  currency?: string;
  requirements?: string;
  audience?: string;
  configurations?: string;
}): { system: string; user: string } {
  const audience = params.audience || 'GENERAL';
  const audienceContext = AUDIENCE_CONTEXT[audience] || AUDIENCE_CONTEXT.GENERAL;
  
  const system = SYSTEM_PROMPTS.TRAVEL_CONSULTANT + '\n\n' + audienceContext;
  
  const user = buildPrompt(PROMPTS.PROPOSAL, {
    destination: params.destination,
    duration: params.duration,
    headcount: params.headcount,
    budgetMin: params.budgetMin,
    budgetMax: params.budgetMax,
    currency: params.currency || 'TWD',
    requirements: params.requirements || '無',
    audience: audience,
    configurations: params.configurations || '標準配置',
  });
  
  return { system, user };
}

/**
 * 建立競品警告 prompt
 */
export function buildCompetitorWarningPrompt(params: {
  optionTitle: string;
  optionDescription: string;
}): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPTS.COPYWRITER,
    user: buildPrompt(PROMPTS.COMPETITOR_WARNING, params),
  };
}

/**
 * 建立 RFP 摘要 prompt
 */
export function buildRFPSummaryPrompt(params: {
  companyName: string;
  contactPerson: string;
  headcount: number;
  budgetMin: number;
  budgetMax: number;
  destination: string;
  duration: number;
  departureDate?: string;
  deadline: string;
  specialRequirements?: string;
  notes?: string;
}): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPTS.RFP_ANALYST,
    user: buildPrompt(PROMPTS.RFP_SUMMARY, {
      ...params,
      departureDate: params.departureDate || '待定',
      specialRequirements: params.specialRequirements || '無',
      notes: params.notes || '無',
    }),
  };
}

// ==============================================
// Export Default
// ==============================================

export default {
  SYSTEM_PROMPTS,
  PROMPTS,
  AUDIENCE_CONTEXT,
  buildPrompt,
  buildMessages,
  buildProposalPrompt,
  buildCompetitorWarningPrompt,
  buildRFPSummaryPrompt,
};
