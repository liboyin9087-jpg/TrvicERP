/**
 * 天氣工具函數（改進版 - 支援真實 API）
 * Weather Utilities (Enhanced - Support Real API)
 */

/**
 * 天氣資料介面
 */
export interface WeatherData {
  temperature: number;
  condition: 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy' | 'snowy' | 'windy';
  humidity: number;
  windSpeed: number;
  description?: string;
  icon?: string;
}

/**
 * 天氣預報資料
 */
export interface WeatherForecast {
  date: string;
  high: number;
  low: number;
  condition: WeatherData['condition'];
  description?: string;
  icon?: string;
}

/**
 * 天氣 API 配置
 */
const WEATHER_API_CONFIG = {
  provider: import.meta.env.VITE_WEATHER_PROVIDER || 'openweathermap', // 'openweathermap' | 'cwb' | 'mock'
  apiKey: import.meta.env.VITE_WEATHER_API_KEY || '',
  baseUrl: import.meta.env.VITE_WEATHER_API_URL || 'https://api.openweathermap.org/data/2.5',
};

/**
 * 快取設定
 */
const CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘
const cache = new Map<string, { data: WeatherData; timestamp: number }>();

/**
 * 取得快取的天氣資料
 */
function getCachedWeather(key: string): WeatherData | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

/**
 * 設定快取
 */
function setCachedWeather(key: string, data: WeatherData): void {
  cache.set(key, { data, timestamp: Date.now() });
}

/**
 * 使用 OpenWeatherMap API 取得天氣
 */
async function getWeatherFromOpenWeatherMap(
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!WEATHER_API_CONFIG.apiKey) {
    throw new Error('OpenWeatherMap API Key 未設定');
  }

  const url = `${WEATHER_API_CONFIG.baseUrl}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_CONFIG.apiKey}&units=metric&lang=zh_tw`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`天氣 API 錯誤: ${response.status}`);
    }

    const data = await response.json();

    // 轉換天氣代碼為條件
    const weatherCode = data.weather[0].id;
    let condition: WeatherData['condition'] = 'cloudy';
    if (weatherCode >= 200 && weatherCode < 300) {
      condition = 'rainy';
    } else if (weatherCode >= 300 && weatherCode < 400) {
      condition = 'rainy';
    } else if (weatherCode >= 500 && weatherCode < 600) {
      condition = 'rainy';
    } else if (weatherCode >= 600 && weatherCode < 700) {
      condition = 'snowy';
    } else if (weatherCode >= 700 && weatherCode < 800) {
      condition = 'windy';
    } else if (weatherCode === 800) {
      condition = 'sunny';
    } else if (weatherCode > 800) {
      condition = 'cloudy';
    }

    return {
      temperature: Math.round(data.main.temp),
      condition,
      humidity: data.main.humidity,
      windSpeed: Math.round(data.wind.speed * 3.6), // 轉換為 km/h
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    };
  } catch (error) {
    console.error('OpenWeatherMap API 錯誤:', error);
    throw error;
  }
}

/**
 * 使用中央氣象局 API 取得天氣（台灣地區）
 */
async function getWeatherFromCWB(
  lat: number,
  lon: number
): Promise<WeatherData> {
  // 中央氣象局 API 需要特殊處理
  // 這裡提供基本結構，實際需要根據 CWB API 文件實作
  throw new Error('中央氣象局 API 尚未實作');
}

/**
 * Mock 天氣資料（降級方案）
 */
function getMockWeather(lat: number, lon: number): WeatherData {
  // 根據緯度模擬不同氣溫
  const baseTemp = 20 + (lat - 25) * 2; // 台灣緯度約 22-25
  const conditions: WeatherData['condition'][] = [
    'sunny',
    'cloudy',
    'rainy',
    'partly-cloudy',
  ];

  return {
    temperature: Math.floor(baseTemp + (Math.random() * 10 - 5)),
    condition: conditions[Math.floor(Math.random() * conditions.length)],
    humidity: Math.floor(Math.random() * 100),
    windSpeed: Math.floor(Math.random() * 20) + 1,
    description: '模擬天氣資料',
  };
}

/**
 * 根據座標取得天氣
 */
export async function getWeatherByLocation(
  lat: number,
  lon: number
): Promise<WeatherData> {
  const cacheKey = `weather_${lat}_${lon}`;
  
  // 檢查快取
  const cached = getCachedWeather(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    let weather: WeatherData;

    switch (WEATHER_API_CONFIG.provider) {
      case 'openweathermap':
        weather = await getWeatherFromOpenWeatherMap(lat, lon);
        break;
      case 'cwb':
        weather = await getWeatherFromCWB(lat, lon);
        break;
      case 'mock':
      default:
        weather = getMockWeather(lat, lon);
        break;
    }

    // 設定快取
    setCachedWeather(cacheKey, weather);
    return weather;
  } catch (error) {
    console.warn('天氣 API 失敗，使用模擬資料:', error);
    // 降級到模擬資料
    return getMockWeather(lat, lon);
  }
}

/**
 * 根據城市名稱取得天氣
 */
export async function getWeatherByCity(city: string): Promise<WeatherData> {
  // 簡化版本：需要地理編碼服務將城市名稱轉換為座標
  // 這裡先使用模擬資料
  return getMockWeather(25, 121); // 台北座標
}

/**
 * 取得天氣預報（7 天）
 */
export async function getWeatherForecast(
  lat: number,
  lon: number,
  days: number = 7
): Promise<WeatherForecast[]> {
  if (WEATHER_API_CONFIG.provider === 'openweathermap' && WEATHER_API_CONFIG.apiKey) {
    try {
      const url = `${WEATHER_API_CONFIG.baseUrl}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_CONFIG.apiKey}&units=metric&lang=zh_tw&cnt=${days * 8}`; // 每 3 小時一筆，一天 8 筆

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`天氣預報 API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const forecasts: WeatherForecast[] = [];

      // 簡化處理：取每天的最高和最低溫
      const dailyData = new Map<string, { temps: number[]; conditions: string[] }>();

      data.list.forEach((item: any) => {
        const date = new Date(item.dt * 1000).toISOString().split('T')[0];
        if (!dailyData.has(date)) {
          dailyData.set(date, { temps: [], conditions: [] });
        }
        dailyData.get(date)!.temps.push(item.main.temp);
        dailyData.get(date)!.conditions.push(item.weather[0].main);
      });

      dailyData.forEach((value, date) => {
        forecasts.push({
          date,
          high: Math.round(Math.max(...value.temps)),
          low: Math.round(Math.min(...value.temps)),
          condition: 'cloudy', // 簡化處理
          description: '天氣預報',
        });
      });

      return forecasts.slice(0, days);
    } catch (error) {
      console.error('天氣預報 API 錯誤:', error);
    }
  }

  // 降級到模擬資料
  const forecasts: WeatherForecast[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecasts.push({
      date: date.toISOString().split('T')[0],
      high: 25 + Math.floor(Math.random() * 10),
      low: 15 + Math.floor(Math.random() * 10),
      condition: 'cloudy',
      description: '模擬預報',
    });
  }
  return forecasts;
}
