import { ApiError } from '@/core/types/api';

// =============================================================================
// RAG 法規檢索服務
// =============================================================================

export interface LegalDocument {
  id: string;
  title: string;
  content: string;
  category: string;
  keywords: string[];
  source: string;
  lastUpdated: string;
}

export interface RetrievalResult {
  document: LegalDocument;
  score: number;
  relevance: string;
}

export interface RAGConfig {
  embeddingModel?: string;
  similarityThreshold?: number;
  maxResults?: number;
}

class RAGService {
  private static instance: RAGService;
  private documents: LegalDocument[] = [];
  private config: RAGConfig;

  constructor(config: RAGConfig = {}) {
    this.config = {
      embeddingModel: 'text-embedding-ada-002',
      similarityThreshold: 0.7,
      maxResults: 5,
      ...config
    };
    
    this.initializeLegalDocuments();
  }

  static getInstance(config?: RAGConfig): RAGService {
    if (!RAGService.instance) {
      RAGService.instance = new RAGService(config);
    }
    return RAGService.instance;
  }

  private initializeLegalDocuments(): void {
    // 初始化法規文檔資料庫
    this.documents = [
      {
        id: 'consumer-protection-22',
        title: '消費者保護法第22條 - 廣告不實',
        content: `企業不得為虛偽不實或引人錯誤之廣告。廣告內容應具體、真實，不得有誇大不實之表示。
        
        違規情形包括：
        1. 使用「保證」、「絕對」、「一定」、「100%」等絕對性用語
        2. 虛構不存在的優惠或服務
        3. 隱瞞重要資訊或誤導消費者
        4. 比較性廣告缺乏客觀依據
        
        處罰：最高可處新台幣100萬元罰鍰，並得命其停止刊登、更正廣告內容。`,
        category: '廣告法規',
        keywords: ['廣告', '不實', '虛偽', '保證', '絕對', '100%', '最低價'],
        source: '消費者保護法',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'travel-contract-13',
        title: '國外旅遊定型化契約第13條 - 解約退費',
        content: `旅客解約之賠償標準如下：
        
        1. 出發前41日以前：賠償旅費5%
        2. 出發前31日至40日：賠償旅費10%
        3. 出發前21日至30日：賠償旅費20%
        4. 出發前2日至20日：賠償旅費30%
        5. 出發前1日：賠償旅費50%
        6. 出發當日或No Show：賠償旅費100%
        
        例外情形：
        - 不可抗力因素：全額退費
        - 旅行社違約：全額退費並賠償損失
        - 旅客重病或死亡：憑證明退費（扣除已發生費用）`,
        category: '旅遊契約',
        keywords: ['退費', '解約', '取消', '賠償', '比例', '出發前'],
        source: '國外旅遊定型化契約',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'travel-contract-6',
        title: '國外旅遊定型化契約第6條 - 應記載事項',
        content: `旅行社應於契約中明確記載下列事項：
        
        1. 旅遊地點、行程、住宿、餐食、交通
        2. 旅費包含項目及不包含項目
        3. 旅遊費用、附加費用及可能增加之費用
        4. 解約條件及退費標準
        5. 旅遊責任保險之投保範圍及金額
        6. 緊急聯絡方式及處理程序
        7. 旅客應遵守事項及違約責任
        
        未記載或記載不明者，以有利於旅客之解釋為準。`,
        category: '旅遊契約',
        keywords: ['契約', '應記載', '事項', '旅費', '保險', '責任'],
        source: '國外旅遊定型化契約',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'passport-regulation',
        title: '護照效期規定',
        content: `護照效期規範：
        
        1. 一般國家要求：護照效期從入境日起算至少6個月以上
        2. 部分國家要求：護照效期至少1年（如沙烏地阿拉伯）
        3. 歐洲申根區：效期需超過預定離境日3個月以上
        4. 美國：效期需超過預定離境日6個月以上
        5. 日本：效期需超過預定離境日6個月以上
        
        旅行社責任：
        - 收到團員護照影本後應立即檢查效期
        - 效期不足者應提醒更新
        - 行前說明會應再次確認
        - 協助緊急換發證照`,
        category: '證照規定',
        keywords: ['護照', '效期', '6個月', '入境', '檢查', '更新'],
        source: '外交部領事事務局',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'insurance-regulation',
        title: '旅遊責任保險規定',
        content: `旅遊業應投保責任保險，保障範圍包括：
        
        1. 意外死亡：每人最低新台幣200萬元
        2. 意外傷害：每人最低新台幣50萬元
        3. 疾病醫療：每人最低新台幣10萬元
        4. 證件遺失：每次事故最低新台幣2萬元
        5. 行李遺失：每位旅客最低新台幣2萬元
        6. 行李延誤：每位旅客每日新台幣3千元
        
        保險證明應於行程開始前交付旅客，並記載：
        - 保險公司名稱及保單號碼
        - 保險期間及保險範圍
        - 理賠申請方式及聯絡電話
        - 除外條款及重要事項`,
        category: '保險規定',
        keywords: ['保險', '責任險', '理賠', '意外', '醫療', '行李'],
        source: '發展觀光條例',
        lastUpdated: '2024-01-01'
      },
      {
        id: 'pricing-regulation',
        title: '旅遊定價規範',
        content: `旅遊費用定價應遵守以下原則：
        
        1. 明確標示：所有費用應清楚標示，不得隱藏額外費用
        2. 分項列舉：機票、住宿、餐食、門票等應分項列舉
        3. 幣別標示：應標示幣別及匯率基準日
        4. 加價說明：燃油附加費、機場稅等應說明計算方式
        5. 優惠限制：早鳥、團體優惠等應標示限制條件
        
        禁止行為：
        - 虛構原價再打折
        - 隱藏必須支付之費用
        - 不當比較價格
        - 誇大節省金額`,
        category: '定價規範',
        keywords: ['定價', '費用', '標示', '隱藏', '加價', '優惠'],
        source: '公平交易法',
        lastUpdated: '2024-01-01'
      }
    ];
  }

  async searchDocuments(query: string, category?: string): Promise<RetrievalResult[]> {
    try {
      // 簡化的相似度計算（實際應使用 embedding）
      const results: RetrievalResult[] = [];
      const queryLower = query.toLowerCase();
      
      for (const doc of this.documents) {
        if (category && doc.category !== category) continue;
        
        // 計算關鍵詞匹配分數
        const keywordMatches = doc.keywords.filter(keyword => 
          queryLower.includes(keyword.toLowerCase()) || 
          keyword.toLowerCase().includes(queryLower)
        );
        
        // 計算內容匹配分數
        const contentMatches = this.countContentMatches(queryLower, doc.content.toLowerCase());
        
        // 計算標題匹配分數
        const titleMatches = this.countContentMatches(queryLower, doc.title.toLowerCase());
        
        // 綜合評分
        const score = (keywordMatches.length * 0.4) + (contentMatches * 0.3) + (titleMatches * 0.3);
        
        if (score >= this.config.similarityThreshold) {
          results.push({
            document: doc,
            score: Math.min(score, 1.0),
            relevance: this.getRelevanceLevel(score)
          });
        }
      }
      
      // 按分數排序並限制結果數量
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, this.config.maxResults);
        
    } catch (error) {
      console.error('RAG search error:', error);
      throw new ApiError(
        error instanceof Error ? error.message : 'RAG service error',
        'RAG_SERVICE_ERROR'
      );
    }
  }

  private countContentMatches(query: string, content: string): number {
    const queryWords = query.split(/\s+/).filter(word => word.length > 1);
    let matches = 0;
    
    for (const word of queryWords) {
      if (content.includes(word)) {
        matches++;
      }
    }
    
    return matches / queryWords.length;
  }

  private getRelevanceLevel(score: number): string {
    if (score >= 0.8) return '高度相關';
    if (score >= 0.6) return '中度相關';
    if (score >= 0.4) return '低度相關';
    return '微弱相關';
  }

  async getDocumentById(id: string): Promise<LegalDocument | null> {
    return this.documents.find(doc => doc.id === id) || null;
  }

  async getAllCategories(): Promise<string[]> {
    const categories = [...new Set(this.documents.map(doc => doc.category))];
    return categories.sort();
  }

  async addDocument(document: Omit<LegalDocument, 'id' | 'lastUpdated'>): Promise<LegalDocument> {
    const newDoc: LegalDocument = {
      ...document,
      id: `doc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      lastUpdated: new Date().toISOString().split('T')[0]
    };
    
    this.documents.push(newDoc);
    return newDoc;
  }

  updateConfig(newConfig: Partial<RAGConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }
}

// 初始化 RAG 服務
let ragService: RAGService | null = null;

export function initializeRAGService(config?: RAGConfig): RAGService {
  ragService = RAGService.getInstance(config);
  return ragService;
}

export function getRAGService(): RAGService {
  if (!ragService) {
    throw new Error('RAG service not initialized. Call initializeRAGService first.');
  }
  return ragService;
}
