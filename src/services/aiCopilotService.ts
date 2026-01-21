/**
 * TrvicERP AI Copilot Service
 *
 * 架構：後端優先 (Backend-First)
 * - 優先呼叫 Python FastAPI 後端的多智能體系統
 * - 後端不可用時，fallback 到本地規則模擬
 *
 * @version 3.0.0
 */

// =============================================================================
// Types & Interfaces
// =============================================================================

export interface AISuggestion {
  type: 'add_row' | 'update_row' | 'delete_row' | 'add_cost' | 'set_marketing_text';
  target: 'itinerary' | 'cost' | 'marketing';
  data: Record<string, unknown>;
  description?: string;
}

export interface AIResponse {
  content: string;
  actionType: 'info' | 'warning' | 'success' | 'error';
  suggestion?: AISuggestion;
  mode?: string;
  modeDescription?: string;
}

export interface AIContext {
  tourInfo: Record<string, unknown>;
  itinerary: Record<string, unknown>[];
  cost: Record<string, unknown>[];
  passengers: Record<string, unknown>[];
}

/** 專家模式 */
export type ExpertMode = 'itinerary' | 'marketing' | 'costing' | 'legal' | 'general';

export interface ExpertModeInfo {
  id: ExpertMode;
  label: string;
  description: string;
}

// =============================================================================
// Configuration
// =============================================================================

/** 後端 API 設定 */
const API_CONFIG = {
  baseUrl: import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:8000',
  endpoints: {
    chat: '/api/chat',
    modes: '/api/modes',
    health: '/health',
  },
  timeout: 30000, // 30 秒
};

// =============================================================================
// AI Copilot Service Class
// =============================================================================

class AICopilotService {
  private static instance: AICopilotService;
  private backendAvailable: boolean | null = null;
  private lastHealthCheck: number = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 分鐘

  private constructor() {
    // 初始化時檢查後端
    this.checkBackendHealth();
  }

  static getInstance(): AICopilotService {
    if (!AICopilotService.instance) {
      AICopilotService.instance = new AICopilotService();
    }
    return AICopilotService.instance;
  }

  // ===========================================================================
  // Public API
  // ===========================================================================

  /**
   * 主要入口：處理使用者請求
   * @param userInput 使用者輸入
   * @param context 業務上下文
   * @param mode 專家模式（可選，預設自動偵測）
   */
  async processRequest(
    userInput: string,
    context: AIContext,
    mode?: ExpertMode
  ): Promise<AIResponse> {
    // 如果沒有指定模式，自動偵測
    const finalMode = mode || this.detectMode(userInput);

    try {
      // 優先使用後端
      if (await this.isBackendAvailable()) {
        return await this.callBackend(userInput, context, finalMode);
      }
    } catch (error) {
      console.warn('[AI Copilot] Backend call failed, falling back to local rules:', error);
    }

    // Fallback: 本地規則模擬
    return this.processWithLocalRules(userInput, context, finalMode);
  }

  /**
   * 取得可用的專家模式列表
   */
  async getAvailableModes(): Promise<ExpertModeInfo[]> {
    try {
      if (await this.isBackendAvailable()) {
        const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.modes}`);
        if (response.ok) {
          const data = await response.json();
          return data.modes;
        }
      }
    } catch (error) {
      console.warn('[AI Copilot] Failed to fetch modes from backend');
    }

    // Fallback: 本地定義
    return [
      { id: 'itinerary', label: '📅 行程', description: '行程規劃專家' },
      { id: 'marketing', label: '✨ 行銷', description: '行銷文案專家' },
      { id: 'costing', label: '💰 成本', description: '成本試算專家' },
      { id: 'legal', label: '⚖️ 法規', description: '法規諮詢專家' },
      { id: 'general', label: '🧭 通用', description: '團控通用助手' },
    ];
  }

  /**
   * 檢查後端服務狀態
   */
  async checkBackendHealth(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.health}`, {
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        this.backendAvailable = data.status === 'healthy' && data.llm_configured;
        this.lastHealthCheck = Date.now();
        console.log(`[AI Copilot] Backend status: ${this.backendAvailable ? '✅ Available' : '⚠️ LLM not configured'}`);
        return this.backendAvailable;
      }
    } catch (error) {
      console.warn('[AI Copilot] Backend health check failed:', error);
      this.backendAvailable = false;
    }

    this.lastHealthCheck = Date.now();
    return false;
  }

  // ===========================================================================
  // Backend Communication
  // ===========================================================================

  private async isBackendAvailable(): Promise<boolean> {
    // 如果距離上次檢查超過間隔，重新檢查
    if (
      this.backendAvailable === null ||
      Date.now() - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL
    ) {
      await this.checkBackendHealth();
    }
    return this.backendAvailable ?? false;
  }

  private async callBackend(
    message: string,
    context: AIContext,
    mode: ExpertMode
  ): Promise<AIResponse> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

    try {
      const response = await fetch(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.chat}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          mode,
          context: this.formatContextForBackend(context),
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(error.detail || `HTTP ${response.status}`);
      }

      const data = await response.json();

      return {
        content: data.reply,
        actionType: this.determineActionType(data.reply),
        mode: data.mode,
        modeDescription: data.mode_description,
        suggestion: this.extractSuggestion(data.reply),
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  private formatContextForBackend(context: AIContext): string {
    const tourInfo = context.tourInfo;
    const itinerary = context.itinerary;
    const cost = context.cost;

    let contextStr = `【團體資訊】
團號：${tourInfo['團號'] || 'N/A'}
團名：${tourInfo['團名'] || 'N/A'}
出發日：${tourInfo['出發日'] || 'N/A'}
回程日：${tourInfo['回程日'] || 'N/A'}
人數：${tourInfo['人數'] || 'N/A'}
目的地：${tourInfo['目的地'] || 'N/A'}

【目前行程】
${itinerary.length > 0
  ? itinerary.map(item => `- ${item['天數']} ${item['時間']} ${item['行程內容']}（${item['停留時間']}）`).join('\n')
  : '尚無行程資料'}

【成本項目】
${cost.length > 0
  ? cost.map(item => `- ${item['項目']}：NT$${item['單價']} × ${item['人數']} = NT$${item['小計']}`).join('\n')
  : '尚無成本資料'}`;

    return contextStr;
  }

  // ===========================================================================
  // Local Rules Fallback (當後端不可用時)
  // ===========================================================================

  private processWithLocalRules(
    userInput: string,
    context: AIContext,
    mode: ExpertMode
  ): AIResponse {
    switch (mode) {
      case 'itinerary':
        return this.handleItineraryLocal(userInput, context);
      case 'costing':
        return this.handleCostingLocal(userInput, context);
      case 'legal':
        return this.handleLegalLocal(userInput, context);
      case 'marketing':
        return this.handleMarketingLocal(userInput, context);
      default:
        return this.handleGeneralLocal(userInput, context);
    }
  }

  private handleItineraryLocal(userInput: string, context: AIContext): AIResponse {
    // 簡化的本地景點資料
    const ATTRACTIONS: Record<string, Record<string, { duration: number; type: string }>> = {
      '東京': {
        '淺草寺': { duration: 2, type: '寺廟' },
        '東京迪士尼': { duration: 8, type: '樂園' },
        '東京鐵塔': { duration: 1.5, type: '地標' },
      },
      '京都': {
        '清水寺': { duration: 2, type: '寺廟' },
        '金閣寺': { duration: 1.5, type: '寺廟' },
        '伏見稻荷': { duration: 2, type: '神社' },
      },
      '大阪': {
        '大阪城': { duration: 2, type: '城堡' },
        '環球影城': { duration: 8, type: '樂園' },
      },
    };

    // 嘗試識別景點
    for (const [region, spots] of Object.entries(ATTRACTIONS)) {
      for (const [spotName, spotInfo] of Object.entries(spots)) {
        if (userInput.includes(spotName)) {
          return {
            content: `**📅 行程建議**\n\n景點：**${spotName}**\n地區：${region}\n類型：${spotInfo.type}\n建議停留：${spotInfo.duration} 小時\n\n⚠️ 目前為離線模式，建議待後端服務啟動後再進行完整的路線檢查。`,
            actionType: 'success',
            suggestion: {
              type: 'add_row',
              target: 'itinerary',
              data: {
                '天數': 'Day 1',
                '時間': '10:00',
                '行程內容': spotName,
                '停留時間': `${spotInfo.duration}小時`,
                '餐食': '--',
                '備註': `（離線模式建議）`,
              },
              description: `新增「${spotName}」`,
            },
          };
        }
      }
    }

    return {
      content: '請告訴我您想新增的景點名稱和安排的天數。\n\n例如：「請幫我在 Day 2 新增清水寺」',
      actionType: 'info',
    };
  }

  private handleCostingLocal(userInput: string, context: AIContext): AIResponse {
    const costData = context.cost || [];
    const pax = (context.tourInfo['人數'] as number) || 30;

    const totalCost = costData.reduce((sum, item) => sum + ((item['小計'] as number) || 0), 0);
    const perPerson = totalCost / pax;

    // 檢查隱藏成本
    const existingItems = costData.map(item => String(item['項目'] || ''));
    const missingCosts: string[] = [];

    if (!existingItems.some(i => i.includes('小費'))) {
      missingCosts.push('領隊/司機小費（約 NT$300-400/天/人）');
    }
    if (!existingItems.some(i => i.includes('刷卡'))) {
      missingCosts.push('刷卡手續費（約 2%）');
    }
    if (!existingItems.some(i => i.includes('匯率'))) {
      missingCosts.push('匯率緩衝（建議預抓 3%）');
    }

    let content = `**💰 成本快速分析（離線模式）**\n\n`;
    content += `目前總成本：NT$ ${totalCost.toLocaleString()}\n`;
    content += `每人成本：NT$ ${Math.floor(perPerson).toLocaleString()}\n\n`;

    if (missingCosts.length > 0) {
      content += `**⚠️ 可能遺漏的隱藏成本：**\n`;
      missingCosts.forEach(cost => {
        content += `- ${cost}\n`;
      });
      content += `\n建議售價（含 15% 毛利）：約 NT$ ${Math.floor(perPerson * 1.2 / 0.85).toLocaleString()}/人`;
    }

    return {
      content,
      actionType: missingCosts.length > 0 ? 'warning' : 'success',
    };
  }

  private handleLegalLocal(userInput: string, context: AIContext): AIResponse {
    // 關鍵字檢查
    const riskyKeywords = ['保證', '絕對', '一定', '100%', '最低價', '最便宜'];
    const foundKeywords = riskyKeywords.filter(kw => userInput.includes(kw));

    if (foundKeywords.length > 0) {
      return {
        content: `**⚖️ 法規風險警告**\n\n您的內容包含以下可能違規的用語：\n${foundKeywords.map(kw => `- 「${kw}」`).join('\n')}\n\n**法規依據**：消費者保護法第 22 條\n> 企業經營者不得有虛偽不實或引人錯誤之表示。\n\n**建議修改為**：\n- 「保證」→「一般情況下」\n- 「絕對」→「依實際狀況」\n- 「最低價」→「優惠價格」`,
        actionType: 'warning',
      };
    }

    // 退費相關
    if (userInput.includes('退費') || userInput.includes('取消')) {
      return {
        content: `**📋 國外旅遊定型化契約退費規範**\n\n| 取消時間 | 賠償比例 |\n|---------|--------|\n| 出發前 41 日以前 | 5% |\n| 出發前 31-40 日 | 10% |\n| 出發前 21-30 日 | 20% |\n| 出發前 2-20 日 | 30% |\n| 出發前 1 日 | 50% |\n| 出發當日 | 100% |\n\n**法規來源**：國外旅遊定型化契約第 13 條`,
        actionType: 'info',
      };
    }

    return {
      content: '請描述您想諮詢的法規問題，例如：\n- 退費爭議\n- 廣告文案合規檢查\n- 護照效期規定\n- 保險責任範圍',
      actionType: 'info',
    };
  }

  private handleMarketingLocal(userInput: string, context: AIContext): AIResponse {
    const tourName = (context.tourInfo['團名'] as string) || '精選之旅';
    const highlights = context.itinerary
      .slice(0, 3)
      .map(item => item['行程內容'])
      .filter(Boolean);

    let audience = 'B2C';
    if (userInput.includes('B2B') || userInput.includes('同業')) {
      audience = 'B2B';
    } else if (userInput.includes('企業') || userInput.includes('提案')) {
      audience = '企業';
    }

    const marketingText = audience === 'B2B'
      ? `【同業收客】${tourName}\n\n📅 出發日期：洽詢\n💰 同業優惠價\n✨ 無乘車進店、純玩團\n\n亮點：${highlights.join('、') || '精選景點'}\n\n#同業收客 #保證出團`
      : audience === '企業'
      ? `【企業旅遊提案】${tourName}\n\n為貴公司規劃專屬行程\n• 彈性客製化安排\n• 專人全程服務\n• 可安排 Team Building\n• 統一發票便於核銷`
      : `✈️ ${tourName}\n\n✨ ${highlights.join(' ✨ ') || '精彩行程等你來發現！'}\n\n📞 立即報名，座位有限！`;

    return {
      content: `**✍️ ${audience} 文案（離線模式）**\n\n---\n\n${marketingText}\n\n---\n\n⚠️ 離線模式生成，建議上線後使用完整功能。`,
      actionType: 'success',
      suggestion: {
        type: 'set_marketing_text',
        target: 'marketing',
        data: { text: marketingText },
        description: '套用文案',
      },
    };
  }

  private handleGeneralLocal(userInput: string, _context: AIContext): AIResponse {
    return {
      content: `**🧭 團控助手（離線模式）**\n\n目前後端服務不可用，功能受限。\n\n可用的離線功能：\n- 📅 基礎行程建議\n- 💰 簡易成本檢查\n- ⚖️ 關鍵字法規檢查\n- ✨ 簡易文案生成\n\n如需完整的 AI 分析功能，請確認後端服務已啟動：\n\`\`\`bash\ncd ai-server && python main.py\n\`\`\``,
      actionType: 'info',
    };
  }

  // ===========================================================================
  // Utility Methods
  // ===========================================================================

  private detectMode(userInput: string): ExpertMode {
    const input = userInput.toLowerCase();

    if (input.includes('行程') || input.includes('景點') || input.includes('新增') || input.includes('安排')) {
      return 'itinerary';
    }
    if (input.includes('成本') || input.includes('報價') || input.includes('售價') || input.includes('利潤')) {
      return 'costing';
    }
    if (input.includes('法規') || input.includes('合規') || input.includes('退費') || input.includes('取消')) {
      return 'legal';
    }
    if (input.includes('文案') || input.includes('行銷') || input.includes('廣告') || input.includes('宣傳')) {
      return 'marketing';
    }

    return 'general';
  }

  private determineActionType(content: string): 'info' | 'warning' | 'success' | 'error' {
    if (content.includes('⚠️') || content.includes('警告') || content.includes('風險')) {
      return 'warning';
    }
    if (content.includes('✅') || content.includes('成功') || content.includes('通過')) {
      return 'success';
    }
    if (content.includes('❌') || content.includes('錯誤') || content.includes('失敗')) {
      return 'error';
    }
    return 'info';
  }

  private extractSuggestion(content: string): AISuggestion | undefined {
    // 嘗試從回應中提取 JSON 建議
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as AISuggestion;
      } catch {
        console.warn('[AI Copilot] Failed to parse suggestion JSON');
      }
    }
    return undefined;
  }
}

// =============================================================================
// Export Singleton Instance
// =============================================================================

export const aiCopilotService = AICopilotService.getInstance();
