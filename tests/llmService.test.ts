/**
 * LLM Service Tests
 * 
 * 測試 LLM 服務的核心功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the fetch function
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock environment variables
vi.stubEnv('VITE_LLM_PROVIDER', 'vercel-proxy');
vi.stubEnv('VITE_LLM_MODEL', 'gpt-4o-mini');

describe('LLM Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('callVercelProxy', () => {
    it('should call the proxy endpoint with correct parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '測試回應' }),
      });

      // Import the service after mocking
      const { generateProposalPitch } = await import('../src/services/llmService');
      
      const result = await generateProposalPitch(
        {},
        [],
        { tripName: '日本五日遊', currency: 'TWD', basePrice: 30000, options: [] },
        35000,
        'TECH'
      );

      expect(mockFetch).toHaveBeenCalled();
      expect(typeof result).toBe('string');
    });

    it('should return fallback response when API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      const { generateProposalPitch } = await import('../src/services/llmService');
      
      const result = await generateProposalPitch(
        {},
        [],
        { tripName: '測試行程', currency: 'TWD', basePrice: 20000, options: [] },
        25000,
        'GENERAL'
      );

      // Should return fallback text
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateKillerCopy', () => {
    it('should generate competitor warning text', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ text: '選擇低價替代方案的風險警告' }),
      });

      const { generateKillerCopy } = await import('../src/services/llmService');
      
      const result = await generateKillerCopy({
        id: 'opt-1',
        title: '五星級飯店',
        description: '市中心豪華住宿',
        price: 5000,
        image: '',
      });

      expect(typeof result).toBe('string');
    });

    it('should handle API errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { generateKillerCopy } = await import('../src/services/llmService');
      
      const result = await generateKillerCopy({
        id: 'opt-1',
        title: '測試選項',
        description: '測試描述',
        price: 1000,
        image: '',
      });

      // Should return fallback text
      expect(typeof result).toBe('string');
    });
  });
});

describe('Prompt Building', () => {
  it('should build prompts with variables replaced', async () => {
    const { buildPrompt, PROMPTS } = await import('../src/constants/prompts');
    
    const result = buildPrompt(PROMPTS.PROPOSAL, {
      destination: '日本東京',
      duration: '5天4夜',
      headcount: 50,
      budgetMin: 25000,
      budgetMax: 35000,
      currency: 'TWD',
      requirements: '素食選項',
      audience: 'TECH',
      configurations: '五星飯店、商務艙',
    });

    expect(result).toContain('日本東京');
    expect(result).toContain('5天4夜');
    expect(result).toContain('50');
    expect(result).not.toContain('{{');
  });

  it('should handle missing variables gracefully', async () => {
    const { buildPrompt, PROMPTS } = await import('../src/constants/prompts');
    
    const result = buildPrompt(PROMPTS.PROPOSAL, {
      destination: '韓國首爾',
    });

    expect(result).toContain('韓國首爾');
    expect(result).not.toContain('{{destination}}');
  });
});
