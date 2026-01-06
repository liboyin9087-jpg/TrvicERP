/**
 * AI Agent Service - Intent Recognition and Action Execution
 * 
 * Provides intelligent task automation with Human-in-Loop (HIL) verification
 * Supports natural language understanding and multi-step task execution
 * 
 * Features:
 * - Intent recognition from natural language
 * - Automated task workflow execution
 * - HIL verification for critical actions
 * - Integration with existing services
 */

import { ragService } from './ragService';

export type IntentType =
  | 'search_policy'
  | 'book_trip'
  | 'submit_expense'
  | 'check_budget'
  | 'create_proposal'
  | 'ask_question'
  | 'unknown';

export interface Intent {
  type: IntentType;
  confidence: number;
  entities: {
    [key: string]: any;
  };
}

export interface AgentAction {
  id: string;
  intent: Intent;
  description: string;
  requiresConfirmation: boolean;
  steps: ActionStep[];
  status: 'pending' | 'confirmed' | 'executing' | 'completed' | 'cancelled' | 'failed';
  result?: any;
  error?: string;
}

export interface ActionStep {
  id: string;
  description: string;
  action: string;
  params: any;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  result?: any;
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  intent?: Intent;
  action?: AgentAction;
}

class AIAgentService {
  private conversationHistory: ConversationMessage[] = [];

  /**
   * Process user input and determine intent
   */
  async processInput(userInput: string): Promise<ConversationMessage> {
    const userMessage: ConversationMessage = {
      id: this.generateId(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };

    this.conversationHistory.push(userMessage);

    // Recognize intent
    const intent = this.recognizeIntent(userInput);
    userMessage.intent = intent;

    // Generate response based on intent
    const response = await this.generateResponse(intent, userInput);
    
    this.conversationHistory.push(response);
    return response;
  }

  /**
   * Recognize user intent from natural language
   */
  private recognizeIntent(input: string): Intent {
    const lowerInput = input.toLowerCase();

    // Policy search patterns
    if (
      lowerInput.includes('政策') ||
      lowerInput.includes('規定') ||
      lowerInput.includes('報銷') ||
      lowerInput.includes('差旅') ||
      lowerInput.includes('補助')
    ) {
      return {
        type: 'search_policy',
        confidence: 0.9,
        entities: { query: input },
      };
    }

    // Trip booking patterns
    if (
      (lowerInput.includes('訂') || lowerInput.includes('預訂') || lowerInput.includes('安排')) &&
      (lowerInput.includes('機票') || 
       lowerInput.includes('飯店') || 
       lowerInput.includes('旅程') ||
       lowerInput.includes('行程'))
    ) {
      const entities = this.extractTripEntities(input);
      return {
        type: 'book_trip',
        confidence: 0.85,
        entities,
      };
    }

    // Expense submission patterns
    if (
      (lowerInput.includes('提交') || lowerInput.includes('申請')) &&
      (lowerInput.includes('費用') || lowerInput.includes('報銷') || lowerInput.includes('單據'))
    ) {
      return {
        type: 'submit_expense',
        confidence: 0.8,
        entities: {},
      };
    }

    // Budget check patterns
    if (
      (lowerInput.includes('查詢') || lowerInput.includes('檢查')) &&
      (lowerInput.includes('預算') || lowerInput.includes('額度'))
    ) {
      return {
        type: 'check_budget',
        confidence: 0.85,
        entities: {},
      };
    }

    // Proposal creation patterns
    if (
      (lowerInput.includes('建立') || lowerInput.includes('產生') || lowerInput.includes('製作')) &&
      (lowerInput.includes('提案') || lowerInput.includes('方案'))
    ) {
      return {
        type: 'create_proposal',
        confidence: 0.8,
        entities: {},
      };
    }

    // General question patterns
    if (
      lowerInput.includes('什麼') ||
      lowerInput.includes('如何') ||
      lowerInput.includes('怎麼') ||
      lowerInput.includes('為什麼') ||
      lowerInput.endsWith('?') ||
      lowerInput.endsWith('？')
    ) {
      return {
        type: 'ask_question',
        confidence: 0.7,
        entities: { question: input },
      };
    }

    // Unknown intent
    return {
      type: 'unknown',
      confidence: 0.3,
      entities: {},
    };
  }

  /**
   * Extract trip-related entities from input
   */
  private extractTripEntities(input: string): any {
    const entities: any = {};

    // Extract destination
    const destinationMatch = input.match(/到|去|往|飛往?\s*([^\s,，。的]+)/);
    if (destinationMatch) {
      entities.destination = destinationMatch[1];
    }

    // Extract date/time
    const datePatterns = [
      /明天|明日/,
      /後天/,
      /下週|下周/,
      /(\d{1,2})\s*月\s*(\d{1,2})\s*[日號]/,
      /(\d{1,2})\s*點|時/,
    ];

    for (const pattern of datePatterns) {
      const match = input.match(pattern);
      if (match) {
        entities.date = match[0];
        break;
      }
    }

    // Extract trip type
    if (input.includes('機票') || input.includes('航班')) {
      entities.type = 'flight';
    } else if (input.includes('飯店') || input.includes('住宿')) {
      entities.type = 'hotel';
    }

    return entities;
  }

  /**
   * Generate response based on intent
   */
  private async generateResponse(intent: Intent, input: string): Promise<ConversationMessage> {
    const message: ConversationMessage = {
      id: this.generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      intent,
    };

    switch (intent.type) {
      case 'search_policy':
        message.content = await this.handlePolicySearch(intent);
        break;

      case 'book_trip':
        const action = this.createTripBookingAction(intent);
        message.action = action;
        message.content = this.formatActionConfirmation(action);
        break;

      case 'submit_expense':
        message.content = '我可以幫您提交費用報銷申請。請提供以下資訊：\n1. 費用類型（交通/住宿/餐費）\n2. 金額\n3. 日期\n4. 收據照片';
        break;

      case 'check_budget':
        message.content = '正在查詢您的預算額度...\n\n您當月的差旅預算：\n- 總額度：50,000 元\n- 已使用：12,500 元\n- 剩餘額度：37,500 元';
        break;

      case 'create_proposal':
        message.content = '我可以幫您建立旅遊提案。請告訴我：\n1. 目的地\n2. 天數\n3. 人數\n4. 預算範圍';
        break;

      case 'ask_question':
        message.content = await this.handleQuestion(intent);
        break;

      default:
        message.content = '抱歉，我不太理解您的意思。您可以問我關於差旅政策、行程預訂、費用報銷等問題。';
    }

    return message;
  }

  /**
   * Handle policy search requests
   */
  private async handlePolicySearch(intent: Intent): Promise<string> {
    const query = intent.entities.query || '';
    const ragResponse = await ragService.query(query);

    if (ragResponse.confidence < 0.3) {
      return '抱歉，我在政策文件中找不到相關資訊。請聯繫人力資源部門獲取更多幫助。';
    }

    let response = ragResponse.answer + '\n\n';

    if (ragResponse.sources.length > 0) {
      response += '參考資料：\n';
      ragResponse.sources.forEach((source, index) => {
        response += `${index + 1}. ${source.document.title}\n`;
      });
    }

    return response;
  }

  /**
   * Handle general questions
   */
  private async handleQuestion(intent: Intent): Promise<string> {
    const question = intent.entities.question || '';
    
    // Try RAG first
    const ragResponse = await ragService.query(question);
    
    if (ragResponse.confidence > 0.3) {
      return ragResponse.answer;
    }

    // Fallback responses
    return '這是一個很好的問題。讓我為您查詢相關資訊...\n\n' +
           '如需更詳細的資訊，建議您：\n' +
           '1. 查閱完整的政策文件\n' +
           '2. 聯繫人力資源部門\n' +
           '3. 詢問您的直屬主管';
  }

  /**
   * Create trip booking action with HIL confirmation
   */
  private createTripBookingAction(intent: Intent): AgentAction {
    const entities = intent.entities;

    const steps: ActionStep[] = [];

    if (entities.type === 'flight' || !entities.type) {
      steps.push({
        id: this.generateId(),
        description: `查詢飛往 ${entities.destination || '目的地'} 的航班`,
        action: 'search_flights',
        params: entities,
        status: 'pending',
      });
    }

    if (entities.type === 'hotel' || !entities.type) {
      steps.push({
        id: this.generateId(),
        description: `搜尋 ${entities.destination || '目的地'} 的住宿選項`,
        action: 'search_hotels',
        params: entities,
        status: 'pending',
      });
    }

    return {
      id: this.generateId(),
      intent,
      description: `預訂${entities.date || ''}前往 ${entities.destination || '目的地'} 的行程`,
      requiresConfirmation: true,
      steps,
      status: 'pending',
    };
  }

  /**
   * Format action for user confirmation
   */
  private formatActionConfirmation(action: AgentAction): string {
    let message = `我理解您想要${action.description}。\n\n`;
    message += '我將執行以下步驟：\n';

    action.steps.forEach((step, index) => {
      message += `${index + 1}. ${step.description}\n`;
    });

    message += '\n是否要繼續？（請回覆「確認」或「取消」）';

    return message;
  }

  /**
   * Confirm and execute an action
   */
  async confirmAction(actionId: string): Promise<ConversationMessage> {
    // Find the action in conversation history
    const actionMessage = this.conversationHistory.find(
      msg => msg.action?.id === actionId
    );

    if (!actionMessage || !actionMessage.action) {
      return this.createErrorMessage('找不到指定的操作');
    }

    const action = actionMessage.action;
    action.status = 'executing';

    try {
      // Execute each step
      for (const step of action.steps) {
        step.status = 'executing';
        
        // Simulate execution (in production, call actual services)
        await this.executeStep(step);
        
        step.status = 'completed';
      }

      action.status = 'completed';

      return {
        id: this.generateId(),
        role: 'assistant',
        content: `已完成！${action.description}已成功執行。\n\n執行結果：\n${this.formatExecutionResults(action)}`,
        timestamp: Date.now(),
      };
    } catch (error) {
      action.status = 'failed';
      action.error = error instanceof Error ? error.message : String(error);

      return this.createErrorMessage(`執行失敗：${action.error}`);
    }
  }

  /**
   * Execute a single action step
   */
  private async executeStep(step: ActionStep): Promise<void> {
    // Simulate async execution
    await new Promise(resolve => setTimeout(resolve, 500));

    switch (step.action) {
      case 'search_flights':
        step.result = {
          flights: [
            {
              airline: '中華航空',
              flightNumber: 'CI100',
              departure: '08:00',
              arrival: '12:30',
              price: 15000,
            },
          ],
        };
        break;

      case 'search_hotels':
        step.result = {
          hotels: [
            {
              name: '市中心商務飯店',
              rating: 4.5,
              price: 3500,
            },
          ],
        };
        break;

      default:
        step.result = { success: true };
    }
  }

  /**
   * Format execution results
   */
  private formatExecutionResults(action: AgentAction): string {
    return action.steps
      .map(step => `✓ ${step.description}`)
      .join('\n');
  }

  /**
   * Create error message
   */
  private createErrorMessage(content: string): ConversationMessage {
    return {
      id: this.generateId(),
      role: 'assistant',
      content,
      timestamp: Date.now(),
    };
  }

  /**
   * Get conversation history
   */
  getConversationHistory(): ConversationMessage[] {
    return [...this.conversationHistory];
  }

  /**
   * Clear conversation history
   */
  clearConversation(): void {
    this.conversationHistory = [];
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiAgentService = new AIAgentService();

export default aiAgentService;
