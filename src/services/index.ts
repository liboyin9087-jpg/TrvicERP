// =====================================================
// TravelCanvas - Service Exports
// =====================================================

// Mock Data Service (fallback for demo mode)
export * from './mockDataService';

// LLM Service (AI-powered features)
export * from './llmService';

// Database Service (mock implementation)
export * from './databaseService';

// Type definitions
export * from './types';

// Supabase Service (production database)
export { supabaseService, default as supabaseServiceDefault } from './supabaseService';

// Voting Store (localStorage + Supabase hybrid)
export * from './votingStore';
export * from './votingStoreEnhanced';

// Local Storage Service (IndexedDB for offline-first)
export { localStorageService, default as localStorageServiceDefault } from './localStorageService';

// Sync Service (bi-directional sync)
export { syncService, default as syncServiceDefault } from './syncService';

// RAG Service (policy search and retrieval)
export { ragService, default as ragServiceDefault } from './ragService';

// AI Agent Service (intent recognition and automation)
export { aiAgentService, default as aiAgentServiceDefault } from './aiAgentService';
