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
