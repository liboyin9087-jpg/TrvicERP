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

import Fuse, { type FuseResultMatch, type IFuseOptions } from 'fuse.js';

/**
 * Fuse.js configuration interface to make search parameters configurable.
 * This extends IFuseOptions from fuse.js for type safety.
 */
export interface FuseSearchConfig<T> extends IFuseOptions<T> {
  keys: (keyof T | { name: keyof T; weight?: number })[];
}

/**
 * Configuration for the RAGEngine, allowing dependency injection of data
 * and search parameters.
 */
export interface RAGEngineConfig {
  spotsData: SpotRecord[];
  legalDocumentsData: LegalDocument[];
  spotsFuseConfig?: FuseSearchConfig<SpotRecord>;
  legalFuseConfig?: FuseSearchConfig<LegalDocument>;
  spotsStats?: { total: number; version: string; lastUpdated: string; }; // Optional metadata
  legalStats?: { total: number; categories: string[]; version: string; lastUpdated: string; }; // Optional metadata
}

// ============================================
// Default Fuse.js Search Configurations
// These provide sensible defaults but can be overridden via RAGEngineConfig.
// ============================================

const defaultSpotsFuseConfig: FuseSearchConfig<SpotRecord> = {
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
};

const defaultLegalFuseConfig: FuseSearchConfig<LegalDocument> = {
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
};

// ============================================
// RAG Engine Class
// ============================================

export class RAGEngine {
  private readonly spots: SpotRecord[];
  private readonly legalDocuments: LegalDocument[];
  private readonly spotsIndex: Fuse<SpotRecord>;
  private readonly legalIndex: Fuse<LegalDocument>;
  private readonly spotsStats?: { total: number; version: string; lastUpdated: string; };
  private readonly legalStats?: { total: number; categories: string[]; version: string; lastUpdated: string; };

  /**
   * Constructs the RAGEngine with injected data and configurable search parameters.
   * @param config Configuration object containing spot data, legal data, and optional Fuse.js configs.
   */
  constructor(config: RAGEngineConfig) {
    // Inject data directly, solving direct JSON dependency and enabling DI
    this.spots = config.spotsData;
    this.legalDocuments = config.legalDocumentsData;

    // Initialize Fuse.js indices with provided data and configurable options
    // Uses default configs if not explicitly provided, addressing hardcoded search parameters
    this.spotsIndex = new Fuse<SpotRecord>(
      this.spots,
      config.spotsFuseConfig ?? defaultSpotsFuseConfig
    );
    this.legalIndex = new Fuse<LegalDocument>(
      this.legalDocuments,
      config.legalFuseConfig ?? defaultLegalFuseConfig
    );

    // Store optional stats metadata
    this.spotsStats = config.spotsStats;
    this.legalStats = config.legalStats;
  }

  // ========== Spots Search & Retrieval ==========

  /**
   * Search spots by query string.
   * @param query The search query string.
   * @param limit The maximum number of results to return.
   * @returns An array of search results for spots.
   */
  searchSpots(query: string, limit: number = 10): SearchResult<SpotRecord>[] {
    const results = this.spotsIndex.search(query, { limit });
    return results.map(r => ({
      item: r.item,
      score: r.score ?? 0, // Ensure score is always a number for consistency
      matches: r.matches,
    }));
  }

  /**
   * Get spots by region.
   * This method now operates on the injected data, not external JSON imports.
   * @param region The region to filter by (e.g., "新北市").
   * @returns An array of SpotRecord objects.
   */
  getSpotsByRegion(region: string): SpotRecord[] {
    return this.spots.filter(spot =>
      spot.region.includes(region)
    );
  }

  /**
   * Get spots by audience type.
   * This method now operates on the injected data.
   * @param audience The audience type to filter by.
   * @returns An array of SpotRecord objects.
   */
  getSpotsByAudience(audience: string): SpotRecord[] {
    return this.spots.filter(spot =>
      spot.audience.some(a => a.includes(audience))
    );
  }

  /**
   * Get AI recommendations based on context.
   * This method now operates on the injected data, separating data retrieval from business logic.
   * @param context The recommendation context (e.g., current region, audience, tags).
   * @param limit The maximum number of recommendations to return.
   * @returns An array of recommended SpotRecord objects.
   */
  getRecommendations(context: RecommendationContext, limit: number = 5): SpotRecord[] {
    let candidates = this.spots; // Start with all injected spots

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
   * Get similar spots based on a reference spot.
   * This method now operates on the injected data.
   * @param spotId The ID of the reference spot.
   * @param limit The maximum number of similar spots to return.
   * @returns An array of similar SpotRecord objects.
   */
  getSimilarSpots(spotId: string, limit: number = 5): SpotRecord[] {
    const referenceSpot = this.spots.find(s => s.id === spotId);
    if (!referenceSpot) return [];

    // Use tags and audience as search query
    const query = [...referenceSpot.tags, ...referenceSpot.audience].join(' ');
    const results = this.searchSpots(query, limit + 1); // Get one more to potentially filter out reference

    // Filter out the reference spot itself
    return results
      .filter(r => r.item.id !== spotId)
      .slice(0, limit)
      .map(r => r.item);
  }

  // ========== Legal Search & Retrieval ==========

  /**
   * Search legal documents by query.
   * @param query The search query string.
   * @param limit The maximum number of results to return.
   * @returns An array of search results for legal documents.
   */
  searchLegal(query: string, limit: number = 5): SearchResult<LegalDocument>[] {
    const results = this.legalIndex.search(query, { limit });
    return results.map(r => ({
      item: r.item,
      score: r.score ?? 0,
      matches: r.matches,
    }));
  }

  /**
   * Get legal documents by category.
   * This method now operates on the injected data.
   * @param category The category to filter by.
   * @returns An array of LegalDocument objects.
   */
  getLegalByCategory(category: string): LegalDocument[] {
    return this.legalDocuments.filter(
      doc => doc.category === category
    );
  }

  /**
   * Get legal answer for a question.
   * This method now operates on the injected data, promoting separation of concerns.
   * The return type is explicitly defined and consistent.
   * @param question The user's question.
   * @returns An object containing relevant documents and a generated summary.
   */
  getLegalAnswer(question: string): { documents: LegalDocument[]; summary: string } {
    const results = this.searchLegal(question, 3); // Get top 3 most relevant documents
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

  // ========== Statistics & Metadata ==========

  /**
   * Get database statistics.
   * This now returns the injected stats if available, or calculates basic stats from injected data.
   * @returns An object containing statistics for spots and legal documents.
   */
  getStats() {
    return {
      spots: this.spotsStats ?? {
        total: this.spots.length,
        version: 'N/A', // Default if not provided in config
        lastUpdated: 'N/A', // Default if not provided in config
      },
      legal: this.legalStats ?? {
        total: this.legalDocuments.length,
        categories: Array.from(new Set(this.legalDocuments.map(d => d.category))).sort(),
        version: 'N/A', // Default if not provided in config
        lastUpdated: 'N/A', // Default if not provided in config
      },
    };
  }

  /**
   * Get all unique regions (cities/counties) from spots.
   * This method now operates on the injected data.
   * @returns An array of unique region strings.
   */
  getAllRegions(): string[] {
    const regions = new Set<string>();
    this.spots.forEach(spot => {
      const cityMatch = spot.region.match(/^(.+?[市縣])/);
      if (cityMatch) {
        regions.add(cityMatch[1]);
      }
    });
    return Array.from(regions).sort();
  }

  /**
   * Get all unique audience types.
   * This method now operates on the injected data.
   * @returns An array of unique audience type strings.
   */
  getAllAudiences(): string[] {
    const audiences = new Set<string>();
    this.spots.forEach(spot => {
      spot.audience.forEach(a => audiences.add(a));
    });
    return Array.from(audiences).sort();
  }

  /**
   * Get all spots (for browsing).
   * This method now returns the injected data directly.
   * @returns An array of all SpotRecord objects.
   */
  getAllSpots(): SpotRecord[] {
    return this.spots;
  }
}

// The singleton instance and convenience functions (ragEngine, searchSpots, etc.)
// are removed to promote dependency injection and allow consumers to manage
// instantiation and configuration of the RAGEngine class.
//
// Example Usage:
//
// // In your application's entry point or data loading service:
// import { RAGEngine, RAGEngineConfig } from './lib/ai/RAGEngine';
// import spotsDb from '../../data/spotsDb.json'; // Assuming data is loaded elsewhere
// import legalDb from '../../data/legalDb.json';
//
// const ragEngineConfig: RAGEngineConfig = {
//   spotsData: spotsDb.spots as SpotRecord[],
//   legalDocumentsData: legalDb.documents as LegalDocument[],
//   // Optionally override Fuse.js configs here:
//   // spotsFuseConfig: { keys: [{ name: 'name', weight: 3 }], threshold: 0.2 },
//   spotsStats: {
//     total: spotsDb.totalSpots,
//     version: spotsDb.version,
//     lastUpdated: spotsDb.lastUpdated
//   },
//   legalStats: {
//     total: legalDb.documents.length,
//     categories: legalDb.categories,
//     version: legalDb.version,
//     lastUpdated: legalDb.lastUpdated
//   }
// };
//
// export const globalRAGEngineInstance = new RAGEngine(ragEngineConfig);
//
// // In a component or service that needs to use the engine:
// // import { globalRAGEngineInstance } from '.../your-app-setup';
// // const results = globalRAGEngineInstance.searchSpots('hiking');
// // const recommendations = globalRAGEngineInstance.getRecommendations({ audience: ['family'] });