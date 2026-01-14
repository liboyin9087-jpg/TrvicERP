import Fuse, { type FuseResultMatch } from 'fuse.js';
import spotsData from '../../data/spotsDb.json';
import legalData from '../../data/legalDb.json';

// ============================================
// Type Definitions
// ============================================

export interface SpotRecord {
  id: string;
  name: string;
  region: string;
  tags: string[];
  audience: string[];
  attributes: Record<string, string>;
  activities: string[];
  season: string;
  sustainability: string;
  note?: string;
}

export interface LegalDocument {
  id: string;
  title: string;
  category: string;
  keywords: string[];
  content: string;
  source: string;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  matches?: readonly FuseResultMatch[];
}

export interface RecommendationContext {
  currentRegion?: string;
  audience?: string[];
  tags?: string[];
  excludeIds?: string[];
}

// ============================================
// Fuse.js Search Indices
// ============================================

// Spots search index
const spotsIndex = new Fuse<SpotRecord>(spotsData.spots as SpotRecord[], {
  keys: [
    { name: 'name', weight: 2 },
    { name: 'tags', weight: 1.5 },
    { name: 'audience', weight: 1.2 },
    { name: 'region', weight: 1 },
    { name: 'sustainability', weight: 0.8 },
    { name: 'activities', weight: 0.8 },
  ],
  threshold: 0.4,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
});

// Legal documents search index
const legalIndex = new Fuse<LegalDocument>(legalData.documents as LegalDocument[], {
  keys: [
    { name: 'title', weight: 2 },
    { name: 'keywords', weight: 1.5 },
    { name: 'content', weight: 1 },
    { name: 'category', weight: 0.8 },
  ],
  threshold: 0.3,
  includeScore: true,
  includeMatches: true,
  minMatchCharLength: 2,
});

// ============================================
// RAG Engine Class
// ============================================

class RAGEngine {
  // ========== Spots Search ==========

  /**
   * Search spots by query string
   */
  searchSpots(query: string, limit: number = 10): SearchResult<SpotRecord>[] {
    const results = spotsIndex.search(query, { limit });
    return results.map(r => ({
      item: r.item,
      score: r.score ?? 0,
      matches: r.matches,
    }));
  }

  /**
   * Get spots by region
   */
  getSpotsByRegion(region: string): SpotRecord[] {
    return (spotsData.spots as SpotRecord[]).filter(spot =>
      spot.region.includes(region)
    );
  }

  /**
   * Get spots by audience type
   */
  getSpotsByAudience(audience: string): SpotRecord[] {
    return (spotsData.spots as SpotRecord[]).filter(spot =>
      spot.audience.some(a => a.includes(audience))
    );
  }

  /**
   * Get AI recommendations based on context
   */
  getRecommendations(context: RecommendationContext, limit: number = 5): SpotRecord[] {
    let candidates = spotsData.spots as SpotRecord[];

    // Filter by region if specified
    if (context.currentRegion) {
      // Extract city/county from region (e.g., "新北市" from "新北市坪林區")
      const cityMatch = context.currentRegion.match(/^(.+?[市縣])/);
      if (cityMatch) {
        const city = cityMatch[1];
        candidates = candidates.filter(spot => spot.region.startsWith(city));
      }
    }

    // Exclude already selected spots
    if (context.excludeIds && context.excludeIds.length > 0) {
      candidates = candidates.filter(spot => !context.excludeIds!.includes(spot.id));
    }

    // Score candidates based on matching criteria
    const scored = candidates.map(spot => {
      let score = 0;

      // Audience match
      if (context.audience && context.audience.length > 0) {
        const audienceMatches = spot.audience.filter(a =>
          context.audience!.some(ca => a.includes(ca) || ca.includes(a))
        ).length;
        score += audienceMatches * 2;
      }

      // Tag match
      if (context.tags && context.tags.length > 0) {
        const tagMatches = spot.tags.filter(t =>
          context.tags!.some(ct => t.includes(ct) || ct.includes(t))
        ).length;
        score += tagMatches * 1.5;
      }

      // Bonus for sustainable spots
      if (spot.sustainability) {
        score += 0.5;
      }

      return { spot, score };
    });

    // Sort by score and return top results
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(s => s.spot);
  }

  /**
   * Get similar spots based on a reference spot
   */
  getSimilarSpots(spotId: string, limit: number = 5): SpotRecord[] {
    const referenceSpot = (spotsData.spots as SpotRecord[]).find(s => s.id === spotId);
    if (!referenceSpot) return [];

    // Use tags and audience as search query
    const query = [...referenceSpot.tags, ...referenceSpot.audience].join(' ');
    const results = this.searchSpots(query, limit + 1);

    // Filter out the reference spot itself
    return results
      .filter(r => r.item.id !== spotId)
      .slice(0, limit)
      .map(r => r.item);
  }

  // ========== Legal Search ==========

  /**
   * Search legal documents by query
   */
  searchLegal(query: string, limit: number = 5): SearchResult<LegalDocument>[] {
    const results = legalIndex.search(query, { limit });
    return results.map(r => ({
      item: r.item,
      score: r.score ?? 0,
      matches: r.matches,
    }));
  }

  /**
   * Get legal documents by category
   */
  getLegalByCategory(category: string): LegalDocument[] {
    return (legalData.documents as LegalDocument[]).filter(
      doc => doc.category === category
    );
  }

  /**
   * Get legal answer for a question
   */
  getLegalAnswer(question: string): { documents: LegalDocument[]; summary: string } {
    const results = this.searchLegal(question, 3);
    const documents = results.map(r => r.item);

    // Generate a simple summary
    let summary = '';
    if (documents.length > 0) {
      summary = `根據相關法規，以下是與您問題相關的規定：\n\n`;
      documents.forEach((doc, idx) => {
        summary += `【${idx + 1}. ${doc.title}】\n`;
        // Truncate content for summary
        const shortContent = doc.content.length > 200
          ? doc.content.substring(0, 200) + '...'
          : doc.content;
        summary += `${shortContent}\n\n`;
      });
      summary += `資料來源：${documents.map(d => d.source).join('、')}`;
    } else {
      summary = '抱歉，找不到與您問題相關的法規資料。請嘗試使用不同的關鍵字。';
    }

    return { documents, summary };
  }

  // ========== Statistics ==========

  /**
   * Get database statistics
   */
  getStats() {
    return {
      spots: {
        total: spotsData.totalSpots,
        version: spotsData.version,
        lastUpdated: spotsData.lastUpdated,
      },
      legal: {
        total: legalData.documents.length,
        categories: legalData.categories,
        version: legalData.version,
        lastUpdated: legalData.lastUpdated,
      },
    };
  }

  /**
   * Get all unique regions from spots
   */
  getAllRegions(): string[] {
    const regions = new Set<string>();
    (spotsData.spots as SpotRecord[]).forEach(spot => {
      const cityMatch = spot.region.match(/^(.+?[市縣])/);
      if (cityMatch) {
        regions.add(cityMatch[1]);
      }
    });
    return Array.from(regions).sort();
  }

  /**
   * Get all unique audience types
   */
  getAllAudiences(): string[] {
    const audiences = new Set<string>();
    (spotsData.spots as SpotRecord[]).forEach(spot => {
      spot.audience.forEach(a => audiences.add(a));
    });
    return Array.from(audiences).sort();
  }

  /**
   * Get all spots (for browsing)
   */
  getAllSpots(): SpotRecord[] {
    return spotsData.spots as SpotRecord[];
  }
}

// Export singleton instance
export const ragEngine = new RAGEngine();

// Export convenience functions
export const searchSpots = (query: string, limit?: number) =>
  ragEngine.searchSpots(query, limit);

export const searchLegal = (query: string, limit?: number) =>
  ragEngine.searchLegal(query, limit);

export const getRecommendations = (context: RecommendationContext, limit?: number) =>
  ragEngine.getRecommendations(context, limit);

export const getLegalAnswer = (question: string) =>
  ragEngine.getLegalAnswer(question);
