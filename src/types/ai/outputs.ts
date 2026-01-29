/**
 * AI output and response types
 */

export interface AIOutput {
  id: string;
  type: 'text' | 'structured' | 'suggestion' | 'analysis';
  content: unknown;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

export interface ProposalComparisonOutput {
  proposalId: string;
  score: number;
  comparison: Record<string, unknown>;
  recommendation?: string;
}

export interface ProposalTier {
  id: string;
  name: string;
  level: 'basic' | 'standard' | 'premium';
  score: number;
  features: string[];
}

export interface AnalysisOutput extends AIOutput {
  type: 'analysis';
  findings: string[];
  recommendations: string[];
  severity?: 'low' | 'medium' | 'high';
}
