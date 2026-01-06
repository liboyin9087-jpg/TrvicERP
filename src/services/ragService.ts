/**
 * RAG (Retrieval-Augmented Generation) Service
 * 
 * Provides semantic search and retrieval for policy documents,
 * travel reimbursement rules, and company guidelines
 * 
 * Features:
 * - Document chunking and embedding
 * - Vector similarity search
 * - Context-aware answer generation
 */

import { localStorageService } from './localStorageService';

interface PolicyDocument {
  id: number;
  title: string;
  category: string;
  content: string;
  metadata?: {
    department?: string;
    version?: string;
    lastUpdated?: string;
  };
  embedding?: number[];
}

interface DocumentChunk {
  id: string;
  documentId: number;
  content: string;
  embedding?: number[];
  metadata: {
    chunkIndex: number;
    totalChunks: number;
    documentTitle: string;
  };
}

interface SearchResult {
  chunk: DocumentChunk;
  score: number;
  document: PolicyDocument;
}

interface RAGResponse {
  answer: string;
  sources: SearchResult[];
  confidence: number;
}

class RAGService {
  private readonly CHUNK_SIZE = 500; // characters
  private readonly CHUNK_OVERLAP = 50; // characters
  private readonly TOP_K = 3; // number of chunks to retrieve

  /**
   * Initialize RAG service with policy documents
   */
  async initialize(): Promise<void> {
    console.log('[RAG] Initializing RAG service...');
    
    // Check if we have policies in local storage
    const policies = await localStorageService.getAll<PolicyDocument>('policies');
    
    if (policies.length === 0) {
      console.log('[RAG] No policies found. Loading sample policies...');
      await this.loadSamplePolicies();
    }

    console.log(`[RAG] Initialized with ${policies.length} policy documents`);
  }

  /**
   * Load sample policies for demonstration
   */
  private async loadSamplePolicies(): Promise<void> {
    const samplePolicies: Omit<PolicyDocument, 'id'>[] = [
      {
        title: '差旅費用報銷政策',
        category: 'reimbursement',
        content: `
          一、適用範圍：本政策適用於所有因公出差的員工。
          
          二、報銷標準：
          1. 國內出差：
             - 住宿費：每晚上限 3,000 元（台北）、2,000 元（其他城市）
             - 交通費：實報實銷，需檢附收據
             - 餐費：每日 600 元（含早、午、晚餐）
          
          2. 國際出差：
             - 住宿費：依目的地不同，每晚 3,000-8,000 元
             - 機票：經濟艙為主，超過 8 小時航程可申請商務艙
             - 餐費：每日 1,500-2,500 元
          
          三、申請流程：
          1. 出差前須填寫「出差申請單」經主管核准
          2. 返回後 7 個工作天內提交費用報銷
          3. 需檢附完整收據及發票
          4. 超過標準金額需事前申請並經總經理核准
          
          四、特殊規定：
          - 陪同眷屬之費用不予報銷
          - 個人消費（如迷你吧、付費電視）不予報銷
          - 逾期未申請視同放棄
        `,
        metadata: {
          department: 'HR',
          version: '2.1',
          lastUpdated: '2024-01-01',
        },
      },
      {
        title: '員工旅遊辦理規範',
        category: 'employee-travel',
        content: `
          一、辦理原則：
          1. 每年度舉辦一次員工旅遊
          2. 以增進員工情誼、促進身心健康為目的
          3. 採自由參加制，不強迫參與
          
          二、補助標準：
          1. 正職員工：每人補助上限 10,000 元
          2. 約聘員工：每人補助上限 7,000 元
          3. 眷屬參加：需自費，優惠價格為員工補助額的 80%
          
          三、行程規劃：
          1. 由福委會規劃 2-3 個方案供員工投票
          2. 行程天數：2-3 天為原則
          3. 目的地：優先考慮國內或鄰近國家
          4. 需考慮無障礙設施及特殊飲食需求
          
          四、報名與繳費：
          1. 開放報名期限：出發前 60 天
          2. 繳費期限：出發前 30 天
          3. 取消政策：
             - 出發前 30 天取消：全額退費
             - 出發前 15-29 天取消：退費 50%
             - 出發前 14 天內取消：不退費
          
          五、注意事項：
          - 參加者須自行投保旅遊平安險
          - 未滿 18 歲參加者需家長同意書
          - 行程中須遵守團體紀律
        `,
        metadata: {
          department: 'HR',
          version: '1.5',
          lastUpdated: '2024-01-15',
        },
      },
      {
        title: '海外商務考察準則',
        category: 'business-travel',
        content: `
          一、目的：
          規範海外商務考察活動，確保符合公司發展需求並有效管理成本。
          
          二、申請資格：
          1. 部門主管以上職級
          2. 與業務發展直接相關之專案負責人
          3. 經總經理核准之特殊專案人員
          
          三、考察類型與預算：
          1. 市場調研：每人每次上限 50,000 元
          2. 技術交流：每人每次上限 80,000 元
          3. 展會參訪：依展會規模與地點核定
          
          四、申請流程：
          1. 提前 30 天提出申請
          2. 說明考察目的、行程規劃、預期效益
          3. 經部門主管、財務部、總經理核准
          
          五、成果報告：
          1. 返國後 14 天內提交考察報告
          2. 報告內容應包含：
             - 考察目的達成情況
             - 重要發現與建議
             - 可行性評估
             - 後續行動計畫
          3. 於部門會議中分享成果
          
          六、費用管理：
          - 機票：商務艙需事前核准
          - 住宿：依當地物價水平核定
          - 交通：優先使用大眾運輸工具
          - 餐費：包含於每日定額中
        `,
        metadata: {
          department: 'Admin',
          version: '2.0',
          lastUpdated: '2023-12-01',
        },
      },
    ];

    for (const policy of samplePolicies) {
      await localStorageService.put('policies', policy);
    }
  }

  /**
   * Chunk a document into smaller pieces for better retrieval
   */
  private chunkDocument(document: PolicyDocument): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    const content = document.content.trim();
    
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + this.CHUNK_SIZE, content.length);
      const chunkContent = content.substring(startIndex, endIndex);

      chunks.push({
        id: `${document.id}-chunk-${chunkIndex}`,
        documentId: document.id,
        content: chunkContent,
        metadata: {
          chunkIndex,
          totalChunks: 0, // Will be updated later
          documentTitle: document.title,
        },
      });

      startIndex = endIndex - this.CHUNK_OVERLAP;
      chunkIndex++;
    }

    // Update total chunks
    chunks.forEach(chunk => {
      chunk.metadata.totalChunks = chunks.length;
    });

    return chunks;
  }

  /**
   * Simple embedding using TF-IDF-like approach (for offline use)
   * In production, use a proper embedding model
   */
  private generateSimpleEmbedding(text: string): number[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 1);

    // Create a simple frequency-based vector
    const wordFreq: { [key: string]: number } = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    // Convert to fixed-length vector (using hash-based indexing)
    const vectorSize = 128;
    const vector = new Array(vectorSize).fill(0);

    Object.entries(wordFreq).forEach(([word, freq]) => {
      // Simple hash function
      const hash = word.split('').reduce((acc, char) => {
        return ((acc << 5) - acc + char.charCodeAt(0)) | 0;
      }, 0);
      
      const index = Math.abs(hash) % vectorSize;
      vector[index] += freq;
    });

    // Normalize
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(v => v / magnitude) : vector;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;

    let dotProduct = 0;
    let mag1 = 0;
    let mag2 = 0;

    for (let i = 0; i < vec1.length; i++) {
      dotProduct += vec1[i] * vec2[i];
      mag1 += vec1[i] * vec1[i];
      mag2 += vec2[i] * vec2[i];
    }

    mag1 = Math.sqrt(mag1);
    mag2 = Math.sqrt(mag2);

    if (mag1 === 0 || mag2 === 0) return 0;

    return dotProduct / (mag1 * mag2);
  }

  /**
   * Search for relevant document chunks
   */
  async search(query: string): Promise<SearchResult[]> {
    // Get all policies
    const policies = await localStorageService.getAll<PolicyDocument>('policies');
    
    if (policies.length === 0) {
      console.warn('[RAG] No policies found for search');
      return [];
    }

    // Chunk all documents
    const allChunks: { chunk: DocumentChunk; document: PolicyDocument }[] = [];
    
    for (const policy of policies) {
      const chunks = this.chunkDocument(policy);
      chunks.forEach(chunk => {
        allChunks.push({ chunk, document: policy });
      });
    }

    // Generate query embedding
    const queryEmbedding = this.generateSimpleEmbedding(query);

    // Calculate similarity scores
    const results: SearchResult[] = allChunks.map(({ chunk, document }) => {
      const chunkEmbedding = this.generateSimpleEmbedding(chunk.content);
      const score = this.cosineSimilarity(queryEmbedding, chunkEmbedding);

      return { chunk, document, score };
    });

    // Sort by score and return top K
    results.sort((a, b) => b.score - a.score);
    return results.slice(0, this.TOP_K);
  }

  /**
   * Generate answer using retrieved context
   */
  async query(question: string): Promise<RAGResponse> {
    console.log(`[RAG] Processing query: "${question}"`);

    // Search for relevant chunks
    const searchResults = await this.search(question);

    if (searchResults.length === 0) {
      return {
        answer: '抱歉，我在政策文件中找不到相關資訊。請聯繫人力資源部門獲取更多幫助。',
        sources: [],
        confidence: 0,
      };
    }

    // Build context from search results
    const context = searchResults
      .map((result, index) => {
        return `參考資料 ${index + 1}（${result.document.title}）：\n${result.chunk.content}`;
      })
      .join('\n\n');

    // Calculate average confidence
    const avgScore = searchResults.reduce((sum, r) => sum + r.score, 0) / searchResults.length;

    // Generate answer (this would use LLM in production)
    const answer = this.generateAnswerFromContext(question, context, searchResults);

    return {
      answer,
      sources: searchResults,
      confidence: avgScore,
    };
  }

  /**
   * Generate answer from context (simplified version)
   * In production, this would call the LLM service with the context
   */
  private generateAnswerFromContext(
    question: string,
    context: string,
    results: SearchResult[]
  ): string {
    // Extract key information from the most relevant chunk
    const topResult = results[0];
    
    // Simple pattern matching for common questions
    const lowerQuestion = question.toLowerCase();

    if (lowerQuestion.includes('住宿') || lowerQuestion.includes('飯店')) {
      const match = context.match(/住宿費[：:]\s*([^\n]+)/);
      if (match) {
        return `根據《${topResult.document.title}》，${match[1]}`;
      }
    }

    if (lowerQuestion.includes('報銷') || lowerQuestion.includes('申請')) {
      const match = context.match(/申請流程[：:]\s*([^。]+。[^。]+。[^。]+。)/);
      if (match) {
        return `根據《${topResult.document.title}》，報銷申請流程如下：${match[1]}`;
      }
    }

    if (lowerQuestion.includes('補助') || lowerQuestion.includes('預算')) {
      const match = context.match(/補助[標準額][：:]\s*([^\n]+)/);
      if (match) {
        return `根據《${topResult.document.title}》，${match[1]}`;
      }
    }

    // Default response with top chunk
    return `根據《${topResult.document.title}》：\n\n${topResult.chunk.content.substring(0, 200)}...\n\n建議您查閱完整政策文件以獲取更詳細的資訊。`;
  }

  /**
   * Get all policy categories
   */
  async getCategories(): Promise<string[]> {
    const policies = await localStorageService.getAll<PolicyDocument>('policies');
    const categories = [...new Set(policies.map(p => p.category))];
    return categories;
  }

  /**
   * Get policies by category
   */
  async getPoliciesByCategory(category: string): Promise<PolicyDocument[]> {
    return localStorageService.getByIndex<PolicyDocument>('policies', 'category', category);
  }
}

// Export singleton instance
export const ragService = new RAGService();

export default ragService;
