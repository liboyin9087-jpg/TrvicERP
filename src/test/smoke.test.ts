import { describe, it, expect } from 'vitest';

describe('Test infrastructure', () => {
  it('should run a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should support async tests', async () => {
    const result = await Promise.resolve('TravelMaster');
    expect(result).toBe('TravelMaster');
  });
});
