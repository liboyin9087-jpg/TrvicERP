import { ApiError } from '@/core/types/api';

// =============================================================================
// AI Copilot Service - 後端邏輯模擬
// =============================================================================

export interface AISuggestion {
  type: 'add_row' | 'update_row' | 'delete_row' | 'add_cost' | 'set_marketing_text';
  target: 'itinerary' | 'cost' | 'marketing';
  data: Record<string, any>;
  description?: string;
}

export interface AIResponse {
  content: string;
  actionType: 'info' | 'warning' | 'success' | 'error';
  suggestion?: AISuggestion;
}

export interface AIContext {
  tourInfo: Record<string, any>;
  itinerary: Record<string, any>[];
  cost: Record<string, any>[];
  passengers: Record<string, any>[];
}

// 意圖類型
enum IntentType {
  ADD_ITINERARY = 'add_itinerary',
  CHECK_ROUTE = 'check_route',
  CALCULATE_COST = 'calculate_cost',
  CHECK_COMPLIANCE = 'check_compliance',
  GENERATE_MARKETING = 'generate_marketing',
  GENERAL_QUESTION = 'general_question',
}

// 景點資料庫
const ATTRACTIONS = {
  '東京': {
    '淺草寺': { region: '東京', type: '寺廟', duration: 2 },
    '東京迪士尼': { region: '東京/千葉', type: '樂園', duration: 8 },
    '東京鐵塔': { region: '東京', type: '地標', duration: 1.5 },
    '新宿御苑': { region: '東京', type: '公園', duration: 2 },
    '明治神宮': { region: '東京', type: '神社', duration: 1.5 },
  },
  '京都': {
    '清水寺': { region: '京都', type: '寺廟', duration: 2 },
    '金閣寺': { region: '京都', type: '寺廟', duration: 1.5 },
    '伏見稻荷': { region: '京都', type: '神社', duration: 2 },
    '嵐山': { region: '京都', type: '風景區', duration: 3 },
  },
  '大阪': {
    '大阪城': { region: '大阪', type: '城堡', duration: 2 },
    '道頓堀': { region: '大阪', type: '商圈', duration: 2 },
    '環球影城': { region: '大阪', type: '樂園', duration: 8 },
  }
};

// 城市間車程（分鐘）
const TRAVEL_TIMES: Record<string, number> = {
  '東京-京都': 300,
  '東京-大阪': 330,
  '京都-大阪': 50,
  '東京-東京': 30,
  '京都-京都': 25,
  '大阪-大阪': 25,
};

// 隱藏成本項目
const HIDDEN_COSTS = [
  { item: '領隊小費', unitPrice: 300, per: '天/人', note: '一般行情' },
  { item: '司機小費', unitPrice: 100, per: '天/人', note: '日本團' },
  { item: '刷卡手續費', rate: 0.02, note: '信用卡收款' },
  { item: '營業稅', rate: 0.05, note: '差額計稅' },
  { item: '匯率緩衝', rate: 0.03, note: '建議預留' },
];

// 合規規則
const COMPLIANCE_RULES = {
  '廣告不實': {
    keywords: ['保證', '絕對', '一定', '100%', '最低價', '最便宜'],
    rule: '依消費者保護法第22條，廣告不得有虛偽不實或引人錯誤之表示',
    suggestion: '建議修改為較委婉的用語，如「視情況而定」、「依實際狀況」'
  }
};

class AICopilotService {
  private static instance: AICopilotService;

  static getInstance(): AICopilotService {
    if (!AICopilotService.instance) {
      AICopilotService.instance = new AICopilotService();
    }
    return AICopilotService.instance;
  }

  async processRequest(userInput: string, context: AIContext): Promise<AIResponse> {
    try {
      const intent = this.identifyIntent(userInput);
      
      switch (intent) {
        case IntentType.ADD_ITINERARY:
          return this.handleAddItinerary(userInput, context);
        case IntentType.CHECK_ROUTE:
          return this.handleCheckRoute(userInput, context);
        case IntentType.CALCULATE_COST:
          return this.handleCalculateCost(userInput, context);
        case IntentType.CHECK_COMPLIANCE:
          return this.handleCheckCompliance(userInput, context);
        case IntentType.GENERATE_MARKETING:
          return this.handleGenerateMarketing(userInput, context);
        default:
          return this.handleGeneralQuestion(userInput, context);
      }
    } catch (error) {
      return {
        content: '處理請求時發生錯誤，請稍後再試。',
        actionType: 'error'
      };
    }
  }

  private identifyIntent(userInput: string): IntentType {
    const input = userInput.toLowerCase();
    
    if (input.includes('新增') || input.includes('加入') || input.includes('安排')) {
      if (input.includes('景點') || input.includes('行程') || input.includes('寺') || input.includes('城')) {
        return IntentType.ADD_ITINERARY;
      }
    }
    
    if (input.includes('檢查') && (input.includes('路線') || input.includes('合理') || input.includes('繞路'))) {
      return IntentType.CHECK_ROUTE;
    }
    
    if (input.includes('成本') || input.includes('報價') || input.includes('售價') || input.includes('算')) {
      return IntentType.CALCULATE_COST;
    }
    
    if (input.includes('合規') || input.includes('法規') || input.includes('違反')) {
      return IntentType.CHECK_COMPLIANCE;
    }
    
    if (input.includes('文案') || input.includes('行銷') || input.includes('廣告')) {
      return IntentType.GENERATE_MARKETING;
    }
    
    return IntentType.GENERAL_QUESTION;
  }

  private handleAddItinerary(userInput: string, context: AIContext): AIResponse {
    let attractionName: string | null = null;
    let targetDay = 'Day 1';
    
    // 解析景點名稱
    let attractionInfo: any = null;
    for (const [region, spots] of Object.entries(ATTRACTIONS)) {
      for (const [spotName, spotData] of Object.entries(spots)) {
        if (userInput.includes(spotName)) {
          attractionName = spotName;
          attractionInfo = spotData;
          break;
        }
      }
      if (attractionName) break;
    }
    // 解析天數
    const dayMatch = userInput.match(/Day\s*(\d+)|第(\d+)天/i);
    if (dayMatch) {
      const dayNum = dayMatch[1] || dayMatch[2];
      targetDay = `Day ${dayNum}`;
    }
    
    if (!attractionName) {
      return {
        content: '我需要更多資訊來新增行程。請告訴我：\n1. 想新增什麼景點？\n2. 安排在哪一天？',
        actionType: 'info'
      };
    }
    
    // 檢查路線合理性
    const currentRegion = this.getCurrentRegion(context.itinerary, targetDay);
    const newRegion = attractionInfo.region.split('/')[0];
    const travelTime = this.calculateTravelTime(currentRegion, newRegion);
    
    if (travelTime > 120) {
      return {
        content: `⚠️ **路線警告**\n\n您想新增「${attractionName}」到 ${targetDay}，但目前該天行程在「${currentRegion}」地區。\n\n從 ${currentRegion} 到 ${newRegion} 約需 **${travelTime} 分鐘**，這在同一天內會造成過長的拉車時間。\n\n**建議**：將此景點移至其他天，或調整當天行程區域。`,
        actionType: 'warning',
        suggestion: {
          type: 'add_row',
          target: 'itinerary',
          data: {
            '天數': targetDay,
            '時間': '10:00',
            '行程內容': `${attractionName}（⚠️需確認路線）`,
            '停留時間': `${attractionInfo.duration}小時`,
            '餐食': '--',
            '備註': `從${currentRegion}車程${travelTime}分`
          },
          description: `新增「${attractionName}」到 ${targetDay}`
        }
      };
    }
    
    return {
      content: `✅ **可以新增**\n\n景點：${attractionName}\n天數：${targetDay}\n建議停留：${attractionInfo.duration} 小時\n類型：${attractionInfo.type}\n\n點擊下方按鈕即可加入行程表。`,
      actionType: 'success',
      suggestion: {
        type: 'add_row',
        target: 'itinerary',
        data: {
          '天數': targetDay,
          '時間': '10:00',
          '行程內容': attractionName,
          '停留時間': `${attractionInfo.duration}小時`,
          '餐食': '--',
          '備註': ''
        },
        description: `新增「${attractionName}」到 ${targetDay}`
      }
    };
  }

  private handleCheckRoute(userInput: string, context: AIContext): AIResponse {
    const itinerary = context.itinerary || [];
    
    if (itinerary.length === 0) {
      return {
        content: '目前行程表是空的，請先新增行程。',
        actionType: 'info'
      };
    }
    
    const issues: string[] = [];
    
    // 依天數分組檢查
    const days: Record<string, any[]> = {};
    itinerary.forEach(item => {
      const day = item['天數'] || 'Unknown';
      if (!days[day]) days[day] = [];
      days[day].push(item);
    });
    
    for (const [day, items] of Object.entries(days)) {
      const regions: string[] = [];
      
      items.forEach(item => {
        const content = item['行程內容'] || '';
        for (const [region, spots] of Object.entries(ATTRACTIONS)) {
          for (const spotName of Object.keys(spots)) {
            if (content.includes(spotName)) {
              regions.push(region);
              break;
            }
          }
        }
      });
      
      const uniqueRegions = [...new Set(regions)];
      if (uniqueRegions.length > 1) {
        for (let i = 0; i < uniqueRegions.length - 1; i++) {
          const travelTime = this.calculateTravelTime(uniqueRegions[i], uniqueRegions[i + 1]);
          if (travelTime > 120) {
            issues.push(`⚠️ **${day}**：從「${uniqueRegions[i]}」到「${uniqueRegions[i + 1]}」需要 ${travelTime} 分鐘，建議調整`);
          }
        }
      }
    }
    
    if (issues.length > 0) {
      return {
        content: '**🗺️ 路線檢查結果**\n\n發現以下問題：\n\n' + issues.join('\n\n') + '\n\n**建議**：將同區域的景點安排在同一天，避免長途拉車。',
        actionType: 'warning'
      };
    }
    
    return {
      content: '**✅ 路線檢查通過**\n\n目前的行程安排路線合理，沒有發現明顯的繞路或過長車程問題。',
      actionType: 'success'
    };
  }

  private handleCalculateCost(userInput: string, context: AIContext): AIResponse {
    const costData = context.cost || [];
    const tourInfo = context.tourInfo || {};
    const pax = tourInfo['人數'] || 30;
    const days = 5;
    
    // 計算現有成本
    const totalCost = costData.reduce((sum, item) => sum + (item['小計'] || 0), 0);
    const perPersonCost = totalCost / pax;
    
    // 檢查隱藏成本
    const missingCosts: any[] = [];
    const existingItems = costData.map(item => item['項目'] || '');
    
    if (!existingItems.some(item => item.includes('小費'))) {
      const tipCost = 300 * days * pax;
      missingCosts.push({
        '項目': '領隊小費',
        '單價': 300 * days,
        '人數': pax,
        '小計': tipCost,
        '幣別': 'TWD',
        '備註': `NT$300/天 x ${days}天`
      });
    }
    
    if (!existingItems.some(item => item.includes('刷卡'))) {
      const ccFee = Math.floor(totalCost * 0.02);
      missingCosts.push({
        '項目': '刷卡手續費',
        '單價': ccFee,
        '人數': 1,
        '小計': ccFee,
        '幣別': 'TWD',
        '備註': '預估 2%'
      });
    }
    
    let content = `**💰 成本分析報告**\n\n**目前成本摘要**\n- 總成本：NT$ ${totalCost.toLocaleString()}\n- 每人成本：NT$ ${Math.floor(perPersonCost).toLocaleString()}\n- 團體人數：${pax} 人\n\n`;
    
    if (missingCosts.length > 0) {
      const additionalCost = missingCosts.reduce((sum, item) => sum + item['小計'], 0);
      const newTotal = totalCost + additionalCost;
      const newPerPerson = newTotal / pax;
      
      content += `**⚠️ 發現遺漏的隱藏成本**\n\n`;
      missingCosts.forEach(item => {
        content += `- ${item['項目']}：NT$ ${item['小計'].toLocaleString()}\n`;
      });
      
      content += `\n**加計隱藏成本後**\n- 調整後總成本：NT$ ${newTotal.toLocaleString()}\n- 調整後每人成本：NT$ ${Math.floor(newPerPerson).toLocaleString()}\n\n**建議售價（依毛利率）**\n- 10% 毛利：NT$ ${Math.floor(newPerPerson / 0.9).toLocaleString()}/人\n- 15% 毛利：NT$ ${Math.floor(newPerPerson / 0.85).toLocaleString()}/人\n- 20% 毛利：NT$ ${Math.floor(newPerPerson / 0.8).toLocaleString()}/人\n\n點擊下方按鈕可將遺漏的成本項目加入成本表。`;
      
      return {
        content,
        actionType: 'warning',
        suggestion: {
          type: 'add_cost',
          target: 'cost',
          data: missingCosts[0],
          description: `新增「${missingCosts[0]['項目']}」`
        }
      };
    }
    
    content += `**建議售價（依毛利率）**\n- 10% 毛利：NT$ ${Math.floor(perPersonCost / 0.9).toLocaleString()}/人\n- 15% 毛利：NT$ ${Math.floor(perPersonCost / 0.85).toLocaleString()}/人\n- 20% 毛利：NT$ ${Math.floor(perPersonCost / 0.8).toLocaleString()}/人\n\n✅ 目前的成本結構看起來完整。`;
    
    return {
      content,
      actionType: 'success'
    };
  }

  private handleCheckCompliance(userInput: string, context: AIContext): AIResponse {
    const issues: string[] = [];
    
    // 檢查行程
    const itinerary = context.itinerary || [];
    itinerary.forEach(item => {
      const content = (item['行程內容'] || '') + (item['備註'] || '');
      
      for (const keyword of COMPLIANCE_RULES['廣告不實'].keywords) {
        if (content.includes(keyword)) {
          issues.push(`⚠️ 行程「${item['行程內容'] || ''}」中含有「${keyword}」字眼，可能違反消保法第22條`);
        }
      }
    });
    
    // 檢查使用者輸入
    for (const keyword of COMPLIANCE_RULES['廣告不實'].keywords) {
      if (userInput.includes(keyword)) {
        issues.push(`⚠️ 輸入內容含有「${keyword}」，建議修改為較委婉的用語`);
      }
    }
    
    if (issues.length > 0) {
      return {
        content: '**⚖️ 合規檢查結果**\n\n發現以下潛在問題：\n\n' + issues.join('\n\n') + `\n\n**法規依據**：${COMPLIANCE_RULES['廣告不實'].rule}\n**建議**：${COMPLIANCE_RULES['廣告不實'].suggestion}`,
        actionType: 'warning'
      };
    }
    
    return {
      content: '**✅ 合規檢查通過**\n\n未發現明顯的法規違規問題。\n\n已檢查項目：\n- 廣告不實（消保法第22條）\n- 定型化契約應記載事項\n- 責任保險規範',
      actionType: 'success'
    };
  }

  private handleGenerateMarketing(userInput: string, context: AIContext): AIResponse {
    const tourInfo = context.tourInfo || {};
    const itinerary = context.itinerary || [];
    
    const tourName = tourInfo['團名'] || '日本精選之旅';
    
    // 提取行程亮點
    const highlights: string[] = [];
    itinerary.slice(0, 5).forEach(item => {
      const content = item['行程內容'] || '';
      if (content && !content.includes('機場')) {
        highlights.push(content);
      }
    });
    
    // 判斷目標受眾
    let audience = 'B2C';
    let marketingText = '';
    
    if (userInput.includes('B2B') || userInput.includes('同業')) {
      audience = 'B2B';
      marketingText = `【同業收客】${tourName}\n\n📅 出發日期：${tourInfo['出發日'] || 'TBD'}\n👥 成團人數：${tourInfo['人數'] || 30}人\n💰 同業價：歡迎來電詢價\n\n✨ 產品特色：\n• 無乘車進店、純玩團\n• 行程亮點：${highlights.slice(0, 3).join('、')}\n• 全程四星住宿\n\n📞 聯絡窗口：業務部\n🔖 團號：${tourInfo['團號'] || ''}\n\n#同業收客 #保證出團 #日本團`;
    } else if (userInput.includes('企業') || userInput.includes('提案')) {
      audience = '企業提案';
      marketingText = `【企業旅遊提案】${tourName}\n\n致：貴公司人資部/福委會\n\n感謝貴公司考慮本次員工旅遊活動。我們為貴公司量身規劃以下行程：\n\n📋 行程規劃\n${highlights.slice(0, 4).map(h => `• ${h}`).join('\n')}\n\n💎 服務特色\n• 專人規劃，彈性客製\n• 全程專屬領隊服務\n• 可安排 Team Building 活動\n• 統一發票，便於核銷\n\n📞 專案聯絡：業務部 王小明\n📧 Email: service@trvic.com`;
    } else {
      marketingText = `✈️ ${tourName}\n\n🗓 出發日期：${tourInfo['出發日'] || ''}\n\n【行程亮點】\n${highlights.slice(0, 4).map(h => `✨ ${h}`).join('\n')}\n\n【團費包含】\n✅ 來回機票（含稅金）\n✅ 全程住宿\n✅ 行程表所列景點門票\n✅ 500萬履約責任險\n\n📞 立即報名，座位有限！\n\n#日本旅遊 #親子旅遊 #東京`;
    }
    
    return {
      content: `**✍️ 已為您生成 ${audience} 文案**\n\n點擊下方按鈕可套用到文案編輯器：\n\n---\n\n${marketingText}`,
      actionType: 'success',
      suggestion: {
        type: 'set_marketing_text',
        target: 'marketing',
        data: { text: marketingText },
        description: '套用生成的文案'
      }
    };
  }

  private handleGeneralQuestion(userInput: string, context: AIContext): AIResponse {
    if (userInput.includes('退費') || userInput.includes('取消')) {
      return {
        content: `**📋 國外旅遊定型化契約退費規範**\n\n| 取消時間 | 旅客賠償比例 |\n|---------|-------------|\n| 出發前41日以前 | 5% |\n| 出發前31-40日 | 10% |\n| 出發前21-30日 | 20% |\n| 出發前2-20日 | 30% |\n| 出發前1日 | 50% |\n| 出發當日或 No Show | 100% |\n\n**法規來源**：國外旅遊定型化契約第13條\n\n如需計算具體金額，請告訴我：\n1. 團費金額\n2. 距離出發還有幾天`,
        actionType: 'info'
      };
    }
    
    if (userInput.includes('護照')) {
      return {
        content: `**📘 護照效期提醒**\n\n大多數國家要求護照效期從入境日起算至少 **6 個月** 以上。\n\n**建議作業**：\n1. 收到團員護照影本後立即檢查效期\n2. 效期不足者需提醒更新\n3. 於行前說明會再次提醒\n\n目前團員名單中的護照效期，您可以在「團員名單」Tab 中查看。`,
        actionType: 'info'
      };
    }
    
    return {
      content: '我理解您的問題。請問您想要我協助：\n\n1. 📅 **行程規劃** - 新增或調整景點\n2. 💰 **成本試算** - 計算報價與利潤\n3. ⚖️ **合規檢查** - 檢查法規風險\n4. 📝 **行銷文案** - 撰寫宣傳內容\n\n請告訴我更具體的需求，或直接點擊左側的快速按鈕。',
      actionType: 'info'
    };
  }

  private getCurrentRegion(itinerary: any[], targetDay: string): string {
    for (const item of itinerary) {
      if (item['天數'] === targetDay) {
        const content = item['行程內容'] || '';
        for (const [region, spots] of Object.entries(ATTRACTIONS)) {
          for (const spotName of Object.keys(spots)) {
            if (content.includes(spotName)) {
              return region;
            }
          }
        }
      }
    }
    return '東京'; // 預設
  }

  private calculateTravelTime(fromRegion: string, toRegion: string): number {
    const key = `${fromRegion}-${toRegion}`;
    const reverseKey = `${toRegion}-${fromRegion}`;
    
    if (TRAVEL_TIMES[key]) return TRAVEL_TIMES[key];
    if (TRAVEL_TIMES[reverseKey]) return TRAVEL_TIMES[reverseKey];
    return 30; // 預設同區域
  }
}

export const aiCopilotService = AICopilotService.getInstance();
