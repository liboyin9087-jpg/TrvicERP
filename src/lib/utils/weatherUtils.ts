/**
 * 天氣工具函數
 * Weather Utilities
 *
 * 這個檔案負責與天氣相關的 API 互動、資料處理及快取管理。
 * 遵循 Single Responsibility Principle，將配置、快取、API 請求、
 * 資料轉換及錯誤處理等職責明確區分。
 */

// --- 1. 資料介面定義 ---

/**
 * 天氣資料介面
 */
export interface WeatherData {
  temperature: number; // 攝氏溫度
  condition: 'sunny' | 'cloudy' | 'rainy' | 'partly-cloudy' | 'snowy' | 'windy' | 'thunderstorm' | 'foggy';
  humidity: number; // 相對濕度 (%)
  windSpeed: number; // 風速 (km/h)
  description?: string; // 天氣描述
  icon?: string; // 天氣圖示 URL
}

/**
 * 天氣預報資料
 */
export interface WeatherForecast {
  date: string; // YYYY-MM-DD
  high: number; // 最高溫
  low: number; // 最低溫
  condition: WeatherData['condition'];
  description?: string;
  icon?: string;
}

// --- 2. 自定義錯誤類別 ---

/**
 * 配置錯誤
 */
export class ConfigError extends Error {
  constructor(message: string) {
    super(`配置錯誤: ${message}`);
    this.name = 'ConfigError';
  }
}

/**
 * 天氣 API 錯誤
 */
export class WeatherAPIError extends Error {
  constructor(provider: string, message: string, originalError?: unknown) {
    super(`天氣 API (${provider}) 錯誤: ${message}`);
    this.name = 'WeatherAPIError';
    if (originalError instanceof Error) {
      this.stack = originalError.stack; // 保留原始錯誤堆疊
    }
  }
}

/**
 * 快取錯誤
 */
export class CacheError extends Error {
  constructor(message: string) {
    super(`快取錯誤: ${message}`);
    this.name = 'CacheError';
  }
}

// --- 3. 配置管理 ---

/**
 * 天氣 API 配置介面
 */
export interface WeatherAPIConfig {
  provider: 'openweathermap' | 'cwb' | 'mock';
  apiKey: string;
  baseUrl: string;
  forecastUrl?: string; // 某些供應商預報 API 可能有不同 URL
}

/**
 * 從環境變數載入並驗證天氣 API 配置
 * @returns WeatherAPIConfig
 * @throws ConfigError 如果缺少必要的環境變數
 */
function loadWeatherConfig(): WeatherAPIConfig {
  const provider = (import.meta.env.VITE_WEATHER_PROVIDER || 'openweathermap').toLowerCase();
  const apiKey = import.meta.env.VITE_WEATHER_API_KEY || '';
  let baseUrl = import.meta.env.VITE_WEATHER_API_URL || '';
  let forecastUrl = import.meta.env.VITE_WEATHER_FORECAST_API_URL || '';

  if (provider !== 'mock' && !apiKey) {
    throw new ConfigError(`環境變數 VITE_WEATHER_API_KEY 未設定，但天氣供應商為 '${provider}'。`);
  }

  switch (provider) {
    case 'openweathermap':
      if (!baseUrl) {
        baseUrl = 'https://api.openweathermap.org/data/2.5';
      }
      if (!forecastUrl) {
        forecastUrl = baseUrl; // OpenWeatherMap current and forecast use same base
      }
      break;
    case 'cwb':
      if (!baseUrl) {
        baseUrl = 'https://opendata.cwa.gov.tw/api/v1/rest/datastore';
      }
      if (!forecastUrl) {
        forecastUrl = baseUrl; // CWA current and forecast use same base
      }
      break;
    case 'mock':
      // Mock provider doesn't require API key or base URL
      break;
    default:
      throw new ConfigError(`不支援的天氣供應商: ${provider}`);
  }

  // 確保 baseUrl 不為空 (除了 mock 之外)
  if (provider !== 'mock' && !baseUrl) {
    throw new ConfigError(`天氣供應商為 '${provider}'，但 VITE_WEATHER_API_URL 未設定且無預設值。`);
  }

  return {
    provider: provider as WeatherAPIConfig['provider'],
    apiKey,
    baseUrl,
    forecastUrl: forecastUrl || baseUrl, // 預設使用 baseUrl
  };
}

// --- 4. 快取機制 ---

/**
 * 快取資料的結構
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * 快取介面 (用於未來擴展或替換實作)
 */
interface IWeatherCache {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, durationMs: number): void;
  delete(key: string): void;
  clear(): void;
}

/**
 * 實作帶有 localStorage 持久化的快取
 */
class LocalStorageWeatherCache implements IWeatherCache {
  private inMemoryCache: Map<string, CacheEntry<any>>; // in-memory cache for speed

  constructor() {
    this.inMemoryCache = new Map();
    // 嘗試從 localStorage 載入快取 (簡單版本，可以優化為僅載入特定 key)
    try {
      const storedCache = localStorage.getItem('weather_cache');
      if (storedCache) {
        const parsedCache = JSON.parse(storedCache);
        for (const key in parsedCache) {
          if (Object.prototype.hasOwnProperty.call(parsedCache, key)) {
            this.inMemoryCache.set(key, parsedCache[key]);
          }
        }
      }
    } catch (e) {
      console.warn('載入天氣快取失敗:', e);
      localStorage.removeItem('weather_cache'); // 清除可能損壞的快取
    }
  }

  private saveToLocalStorage(): void {
    try {
      localStorage.setItem('weather_cache', JSON.stringify(Object.fromEntries(this.inMemoryCache)));
    } catch (e) {
      console.warn('儲存天氣快取失敗:', e);
    }
  }

  get<T>(key: string): T | null {
    const cached = this.inMemoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < (cached as any).durationMs) { // durationMs is added during set
      return cached.data;
    }
    this.delete(key); // 快取過期或不存在，刪除
    return null;
  }

  set<T>(key: string, data: T, durationMs: number): void {
    if (durationMs <= 0) {
      this.delete(key);
      return;
    }
    this.inMemoryCache.set(key, { data, timestamp: Date.now(), durationMs });
    this.saveToLocalStorage();
  }

  delete(key: string): void {
    this.inMemoryCache.delete(key);
    this.saveToLocalStorage();
  }

  clear(): void {
    this.inMemoryCache.clear();
    this.saveToLocalStorage();
  }
}

const DEFAULT_CACHE_DURATION = 10 * 60 * 1000; // 10 分鐘
const weatherCache: IWeatherCache = new LocalStorageWeatherCache(); // 全局單例快取實例

// --- 5. 輔助函數 ---

/**
 * 將 OpenWeatherMap 天氣代碼轉換為通用條件
 */
function mapOpenWeatherMapCodeToCondition(code: number): WeatherData['condition'] {
  if (code >= 200 && code < 300) return 'thunderstorm'; // 雷雨
  if (code >= 300 && code < 400) return 'rainy'; // 毛毛雨
  if (code >= 500 && code < 600) return 'rainy'; // 雨
  if (code >= 600 && code < 700) return 'snowy'; // 雪
  if (code >= 700 && code < 800) { // 大氣現象 (霧、煙、霾等)
    if (code === 701 || code === 721 || code === 741) return 'foggy'; // 霧、霾
    return 'cloudy'; // 其他歸類為多雲
  }
  if (code === 800) return 'sunny'; // 晴朗
  if (code > 800) return 'cloudy'; // 多雲
  return 'cloudy'; // 預設為多雲
}

/**
 * 將 CWA 天氣描述轉換為通用條件
 */
function mapCWADescriptionToCondition(weatherStr: string): WeatherData['condition'] {
  if (!weatherStr) return 'cloudy';

  if (weatherStr.includes('晴')) return 'sunny';
  if (weatherStr.includes('雨')) return 'rainy';
  if (weatherStr.includes('陰') || weatherStr.includes('多雲')) return 'cloudy';
  if (weatherStr.includes('雪')) return 'snowy';
  if (weatherStr.includes('雷')) return 'thunderstorm';
  if (weatherStr.includes('霧') || weatherStr.includes('霾')) return 'foggy';
  if (weatherStr.includes('風')) return 'windy';

  return 'cloudy'; // 預設為多雲
}

/**
 * 安全解析數值
 */
function parseNumberValue(value: any, defaultValue: number = 0): number {
  if (value == null) return defaultValue;
  const parsed = parseFloat(String(value)); // 確保能處理字串數字
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * 計算兩點之間的距離（使用 Haversine 公式）
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半徑（公里）
  const toRad = (value: number) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 構建帶有參數的 URL
 */
function buildUrl(baseUrl: string, path: string, params: Record<string, string | number>): URL {
  const url = new URL(`${baseUrl}${path}`);
  for (const key in params) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      url.searchParams.append(key, String(params[key]));
    }
  }
  return url;
}

// --- 6. 天氣供應商 API 實作 ---

/**
 * 使用 OpenWeatherMap API 取得天氣
 */
async function getWeatherFromOpenWeatherMap(
  config: WeatherAPIConfig,
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!config.apiKey) {
    throw new WeatherAPIError('openweathermap', 'API Key 未設定');
  }

  const url = buildUrl(config.baseUrl, '/weather', {
    lat,
    lon,
    appid: config.apiKey,
    units: 'metric', // 攝氏
    lang: 'zh_tw',
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`狀態碼: ${response.status}`);
    }

    const data = await response.json();

    const weatherCode = data.weather[0].id;
    const condition = mapOpenWeatherMapCodeToCondition(weatherCode);

    return {
      temperature: Math.round(parseNumberValue(data.main.temp)),
      condition,
      humidity: Math.round(parseNumberValue(data.main.humidity)),
      windSpeed: Math.round(parseNumberValue(data.wind.speed) * 3.6), // m/s 轉換為 km/h
      description: data.weather[0].description,
      icon: `https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`,
    };
  } catch (error) {
    throw new WeatherAPIError('openweathermap', `請求失敗: ${(error as Error).message}`, error);
  }
}

/**
 * 使用 OpenWeatherMap API 取得天氣預報
 */
async function getForecastFromOpenWeatherMap(
  config: WeatherAPIConfig,
  lat: number,
  lon: number,
  days: number
): Promise<WeatherForecast[]> {
  if (!config.apiKey) {
    throw new WeatherAPIError('openweathermap', 'API Key 未設定');
  }

  // OpenWeatherMap 的 /forecast 每次給 3 小時一筆，最多 40 筆 (5天)
  // 如果需要超過 5 天，需要使用 One Call API 的 daily forecast，但這需要不同的配置和請求
  // 這裡假設 forecastUrl 指向 /forecast 端點
  const requestDays = Math.min(days, 5); // /forecast 最多提供 5 天資料
  const url = buildUrl(config.forecastUrl || config.baseUrl, '/forecast', {
    lat,
    lon,
    appid: config.apiKey,
    units: 'metric',
    lang: 'zh_tw',
    cnt: requestDays * 8, // 每天 8 筆 (3小時一筆)，取得所需天數的資料
  });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`狀態碼: ${response.status}`);
    }

    const data = await response.json();
    const forecastsMap = new Map<string, { temps: number[]; conditions: WeatherData['condition'][]; icons: string[] }>();

    data.list.forEach((item: any) => {
      const dateKey = new Date(item.dt * 1000).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!forecastsMap.has(dateKey)) {
        forecastsMap.set(dateKey, { temps: [], conditions: [], icons: [] });
      }
      const dailyEntry = forecastsMap.get(dateKey)!;
      dailyEntry.temps.push(parseNumberValue(item.main.temp));
      dailyEntry.conditions.push(mapOpenWeatherMapCodeToCondition(item.weather[0].id));
      dailyEntry.icons.push(item.weather[0].icon);
    });

    const forecasts: WeatherForecast[] = Array.from(forecastsMap.entries())
      .map(([date, { temps, conditions, icons }]) => {
        // 選擇最常出現的天氣條件和圖示
        const conditionCounts = conditions.reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {} as Record<WeatherData['condition'], number>);
        const mostFrequentCondition = Object.entries(conditionCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0] || 'cloudy';

        const iconCounts = icons.reduce((acc, c) => {
          acc[c] = (acc[c] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const mostFrequentIcon = Object.entries(iconCounts).sort(([, countA], [, countB]) => countB - countA)[0]?.[0];

        return {
          date,
          high: Math.round(Math.max(...temps)),
          low: Math.round(Math.min(...temps)),
          condition: mostFrequentCondition as WeatherData['condition'],
          description: mostFrequentCondition, // OpenWeatherMap forecast description is often too granular
          icon: mostFrequentIcon ? `https://openweathermap.org/img/wn/${mostFrequentIcon}@2x.png` : undefined,
        };
      })
      .slice(0, days); // 確保只返回所需天數的預報
    
    // 如果 OpenWeatherMap forecast 只能給 5 天，但要求更多天，則補足模擬資料
    if (forecasts.length < days) {
      const lastForecastDate = forecasts.length > 0 ? new Date(forecasts[forecasts.length - 1].date) : new Date();
      for (let i = forecasts.length; i < days; i++) {
        const date = new Date(lastForecastDate);
        date.setDate(date.getDate() + 1);
        forecasts.push({
          date: date.toISOString().split('T')[0],
          high: 25 + Math.floor(Math.random() * 10),
          low: 15 + Math.floor(Math.random() * 10),
          condition: 'cloudy',
          description: '模擬預報',
        });
        lastForecastDate.setDate(lastForecastDate.getDate() + 1);
      }
    }
    return forecasts;
  } catch (error) {
    throw new WeatherAPIError('openweathermap', `預報請求失敗: ${(error as Error).message}`, error);
  }
}


/**
 * 使用中央氣象局 API 取得天氣（台灣地區）
 */
async function getWeatherFromCWB(
  config: WeatherAPIConfig,
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!config.apiKey) {
    throw new WeatherAPIError('cwb', 'API Key 未設定');
  }

  // 使用 O-A0003-001 (自動氣象站-氣象觀測資料) 資料集
  const url = buildUrl(config.baseUrl, '/O-A0003-001', { Authorization: config.apiKey });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`狀態碼: ${response.status}`);
    }

    const data = await response.json();
    if (data.success !== 'true') {
      throw new Error(`API 返回錯誤: ${data.message || '未知錯誤'}`);
    }

    // 找出最近的氣象站
    let nearestStation: any = null;
    let minDistance = Infinity;

    if (data.records?.Station) {
      for (const station of data.records.Station) {
        const stationLat = parseNumberValue(station.GeoInfo?.Coordinates?.[0]?.StationLatitude);
        const stationLon = parseNumberValue(station.GeoInfo?.Coordinates?.[0]?.StationLongitude);

        if (!isNaN(stationLat) && !isNaN(stationLon)) {
          const distance = calculateDistance(lat, lon, stationLat, stationLon);
          if (distance < minDistance) {
            minDistance = distance;
            nearestStation = station;
          }
        }
      }
    }

    if (!nearestStation) {
      throw new Error('找不到附近的氣象站');
    }

    const weatherElements = nearestStation.WeatherElement || {};

    const temp = parseNumberValue(weatherElements.AirTemperature, 20);
    const humidity = parseNumberValue(weatherElements.RelativeHumidity, 60);
    const windSpeedMs = parseNumberValue(weatherElements.WindSpeed, 0);
    const windSpeed = Math.round(windSpeedMs * 3.6); // m/s 轉換為 km/h
    const weatherDesc = weatherElements.Weather || '多雲';

    return {
      temperature: Math.round(temp),
      condition: mapCWADescriptionToCondition(weatherDesc),
      humidity: Math.round(humidity),
      windSpeed,
      description: weatherDesc,
    };
  } catch (error) {
    throw new WeatherAPIError('cwb', `請求失敗: ${(error as Error).message}`, error);
  }
}

/**
 * 使用中央氣象局 API 取得天氣預報
 */
async function getForecastFromCWB(
  config: WeatherAPIConfig,
  lat: number,
  lon: number,
  days: number
): Promise<WeatherForecast[]> {
  if (!config.apiKey) {
    throw new WeatherAPIError('cwb', 'API Key 未設定');
  }

  // CWA 預報通常有不同的資料集，例如 F-D0047-091 (鄉鎮天氣預報-未來1週天氣預報)
  // 這裡我們假設使用 F-C0032-001 (一般天氣預報-今明 36 小時天氣預報) 作為演示
  // 實際應用中可能需要根據 lat/lon 選擇最近的鄉鎮或縣市，並請求其專屬資料集
  const url = buildUrl(config.forecastUrl || config.baseUrl, '/F-C0032-001', { Authorization: config.apiKey });

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`狀態碼: ${response.status}`);
    }

    const data = await response.json();
    if (data.success !== 'true') {
      throw new Error(`API 返回錯誤: ${data.message || '未知錯誤'}`);
    }

    const forecasts: WeatherForecast[] = [];

    if (data.records?.location) {
      // 找出最近的縣市/地點
      let nearestLocation: any = null;
      let minDistance = Infinity;

      for (const location of data.records.location) {
        // CWA 地點通常會提供中心點座標，這裡假設有這些欄位
        const locLat = parseNumberValue(location.lat);
        const locLon = parseNumberValue(location.lon);

        if (!isNaN(locLat) && !isNaN(locLon)) {
          const distance = calculateDistance(lat, lon, locLat, locLon);
          if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
          }
        }
      }

      if (nearestLocation && nearestLocation.weatherElement) {
        const wxElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'Wx'); // 天氣現象
        const maxTElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'MaxT'); // 最高溫
        const minTElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'MinT'); // 最低溫

        if (wxElement && maxTElement && minTElement) {
          // 確保時間陣列長度一致，並限制在所需天數
          const timeCount = Math.min(
            wxElement.time?.length || 0,
            maxTElement.time?.length || 0,
            minTElement.time?.length || 0,
            days
          );

          for (let i = 0; i < timeCount; i++) {
            const startTime = wxElement.time[i]?.startTime; // 預報開始時間
            if (!startTime) continue; // 跳過無效的時間點

            const date = new Date(startTime).toISOString().split('T')[0];
            const weatherDesc = wxElement.time[i]?.parameter?.parameterName || '多雲';
            const maxTemp = parseNumberValue(maxTElement.time[i]?.parameter?.parameterName, 25);
            const minTemp = parseNumberValue(minTElement.time[i]?.parameter?.parameterName, 20);

            forecasts.push({
              date,
              high: Math.round(maxTemp),
              low: Math.round(minTemp),
              condition: mapCWADescriptionToCondition(weatherDesc),
              description: weatherDesc,
            });
          }
        }
      }
    }
    return forecasts.slice(0, days); // 確保只返回所需天數的預報
  } catch (error) {
    throw new WeatherAPIError('cwb', `預報請求失敗: ${(error as Error).message}`, error);
  }
}

/**
 * Mock 天氣資料（降級方案或開發用）
 */
function getMockWeather(lat: number, lon: number): WeatherData {
  const baseTemp = 20 + (lat - 25) * 2; // 根據緯度模擬不同氣溫
  const conditions: WeatherData['condition'][] = [
    'sunny', 'cloudy', 'rainy', 'partly-cloudy', 'snowy', 'windy', 'thunderstorm', 'foggy',
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
 * Mock 天氣預報資料
 */
function getMockWeatherForecast(days: number): WeatherForecast[] {
  const forecasts: WeatherForecast[] = [];
  const conditions: WeatherData['condition'][] = [
    'sunny', 'cloudy', 'rainy', 'partly-cloudy',
  ];

  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    forecasts.push({
      date: date.toISOString().split('T')[0],
      high: 25 + Math.floor(Math.random() * 10),
      low: 15 + Math.floor(Math.random() * 10),
      condition: conditions[Math.floor(Math.random() * conditions.length)],
      description: '模擬預報',
    });
  }
  return forecasts;
}

// --- 7. 核心天氣服務類別 ---

class WeatherService {
  private config: WeatherAPIConfig;
  private cache: IWeatherCache;

  constructor(config: WeatherAPIConfig, cache: IWeatherCache) {
    this.config = config;
    this.cache = cache;
  }

  /**
   * 根據座標取得目前天氣
   */
  public async getCurrentWeatherByLocation(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `current_weather_${lat}_${lon}`;
    const cached = this.cache.get<WeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let weather: WeatherData;
      switch (this.config.provider) {
        case 'openweathermap':
          weather = await getWeatherFromOpenWeatherMap(this.config, lat, lon);
          break;
        case 'cwb':
          weather = await getWeatherFromCWB(this.config, lat, lon);
          break;
        case 'mock':
        default:
          weather = getMockWeather(lat, lon);
          break;
      }
      this.cache.set(cacheKey, weather, DEFAULT_CACHE_DURATION);
      return weather;
    } catch (error) {
      console.warn(`[WeatherService] 取得目前天氣失敗 (供應商: ${this.config.provider}, 錯誤: ${error})，使用模擬資料。`);
      return getMockWeather(lat, lon); // 降級到模擬資料
    }
  }

  /**
   * 根據座標取得天氣預報
   */
  public async getLongTermWeatherForecast(
    lat: number,
    lon: number,
    days: number = 7
  ): Promise<WeatherForecast[]> {
    const cacheKey = `forecast_weather_${lat}_${lon}_${days}d`;
    const cached = this.cache.get<WeatherForecast[]>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      let forecasts: WeatherForecast[];
      switch (this.config.provider) {
        case 'openweathermap':
          forecasts = await getForecastFromOpenWeatherMap(this.config, lat, lon, days);
          break;
        case 'cwb':
          forecasts = await getForecastFromCWB(this.config, lat, lon, days);
          break;
        case 'mock':
        default:
          forecasts = getMockWeatherForecast(days);
          break;
      }
      this.cache.set(cacheKey, forecasts, DEFAULT_CACHE_DURATION);
      return forecasts;
    } catch (error) {
      console.warn(`[WeatherService] 取得天氣預報失敗 (供應商: ${this.config.provider}, 錯誤: ${error})，使用模擬資料。`);
      return getMockWeatherForecast(days); // 降級到模擬資料
    }
  }

  /**
   * 根據城市名稱取得目前天氣
   * 簡化版本：需要地理編碼服務將城市名稱轉換為座標
   */
  public async getCurrentWeatherByCity(city: string): Promise<WeatherData> {
    // 這裡應整合地理編碼服務 (例如 Google Geocoding API 或 Nominatim)
    // 由於原始問題沒有提供地理編碼服務，這裡仍使用固定座標和模擬資料作為降級
    console.warn(`[WeatherService] 不支援依城市名稱查詢，使用模擬資料。請整合地理編碼服務。`);
    // 假設台北座標
    return this.getCurrentWeatherByLocation(25.0330, 121.5654);
  }
}

// --- 8. 導出實例 ---

// 載入配置，如果失敗則輸出錯誤並使用 Mock 模式
let weatherConfig: WeatherAPIConfig;
try {
  weatherConfig = loadWeatherConfig();
  console.info(`[WeatherService] 使用天氣供應商: ${weatherConfig.provider}`);
} catch (error) {
  console.error(error);
  console.warn('[WeatherService] 天氣配置載入失敗，將自動降級為模擬天氣供應商。');
  weatherConfig = {
    provider: 'mock',
    apiKey: '',
    baseUrl: '',
  };
}

/**
 * 全局 WeatherService 實例。
 * 在應用程式中，可以選擇透過 React Context 提供這個服務，
 * 以便更方便地在元件中存取並支援測試。
 * 在這個工具檔案的上下文，直接導出一個實例是常見且可接受的做法。
 */
export const weatherService = new WeatherService(weatherConfig, weatherCache);

// 導出個別方法以便於直接使用，或者鼓勵使用 weatherService 實例
export const getWeatherByLocation = weatherService.getCurrentWeatherByLocation.bind(weatherService);
export const getWeatherByCity = weatherService.getCurrentWeatherByCity.bind(weatherService);
export const getWeatherForecast = weatherService.getLongTermWeatherForecast.bind(weatherService);