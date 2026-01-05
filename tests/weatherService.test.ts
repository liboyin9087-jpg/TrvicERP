/**
 * Weather Service Tests
 * 
 * 測試天氣服務的核心功能
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Weather Service', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('getWeather with Open-Meteo', () => {
    it('should fetch weather data successfully', async () => {
      // Mock geocoding response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ latitude: 25.033, longitude: 121.565, name: '台北市', country: '台灣' }],
        }),
      });

      // Mock weather response
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 25,
            relative_humidity_2m: 70,
            apparent_temperature: 27,
            weather_code: 1,
            wind_speed_10m: 10,
            visibility: 10000,
          },
          daily: {
            time: ['2024-01-01', '2024-01-02', '2024-01-03'],
            weather_code: [1, 2, 3],
            temperature_2m_max: [28, 27, 26],
            temperature_2m_min: [20, 19, 18],
            precipitation_probability_max: [10, 20, 30],
          },
        }),
      });

      const { getWeather } = await import('../src/services/weatherService');
      const result = await getWeather('台北');

      expect(result.current).toBeDefined();
      expect(result.current.temperature).toBe(25);
      expect(result.forecast).toHaveLength(3);
    });

    it('should handle geocoding errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });

      const { getWeather } = await import('../src/services/weatherService');
      
      await expect(getWeather('不存在的城市')).rejects.toThrow('Location not found');
    });
  });

  describe('getWeatherCached', () => {
    it('should cache weather data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          results: [{ latitude: 25.033, longitude: 121.565, name: '台北市' }],
        }),
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          current: {
            temperature_2m: 25,
            relative_humidity_2m: 70,
            apparent_temperature: 27,
            weather_code: 1,
            wind_speed_10m: 10,
          },
          daily: {
            time: ['2024-01-01'],
            weather_code: [1],
            temperature_2m_max: [28],
            temperature_2m_min: [20],
            precipitation_probability_max: [10],
          },
        }),
      });

      const { getWeatherCached } = await import('../src/services/weatherService');
      
      // First call - should fetch
      await getWeatherCached('台北');
      expect(mockFetch).toHaveBeenCalledTimes(2);

      // Second call - should use cache
      await getWeatherCached('台北');
      expect(mockFetch).toHaveBeenCalledTimes(2); // No additional calls
    });
  });

  describe('utility functions', () => {
    it('should format temperature correctly', async () => {
      const { formatTemperature } = await import('../src/services/weatherService');
      
      expect(formatTemperature(25, 'C')).toBe('25°C');
      expect(formatTemperature(25, 'F')).toBe('77°F');
    });

    it('should provide weather advice', async () => {
      const { getWeatherAdvice } = await import('../src/services/weatherService');
      
      const hotWeather = {
        location: '台北',
        temperature: 36,
        feelsLike: 38,
        humidity: 80,
        description: '晴朗',
        icon: '☀️',
        windSpeed: 5,
        visibility: 10,
        updatedAt: new Date().toISOString(),
      };

      const advice = getWeatherAdvice(hotWeather);
      expect(advice).toContain('高溫');
    });
  });
});
