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
  baseUrl: import.meta.env.VITE_WEATHER_API_URL || 
    (import.meta.env.VITE_WEATHER_PROVIDER === 'cwb' 
      ? 'https://opendata.cwa.gov.tw/api/v1/rest/datastore' 
      : 'https://api.openweathermap.org/data/2.5'),
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
 * 將 CWA 天氣描述轉換為條件
 */
function mapCWAWeatherToCondition(weatherStr: string): WeatherData['condition'] {
  if (!weatherStr) return 'cloudy';
  
  if (weatherStr.includes('晴')) return 'sunny';
  if (weatherStr.includes('雨')) return 'rainy';
  if (weatherStr.includes('多雲') || weatherStr.includes('陰')) return 'cloudy';
  if (weatherStr.includes('雪')) return 'snowy';
  if (weatherStr.includes('風')) return 'windy';
  
  return 'cloudy';
}

/**
 * 計算兩點之間的距離（使用 Haversine 公式）
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半徑（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 使用中央氣象局 API 取得天氣（台灣地區）
 */
async function getWeatherFromCWB(
  lat: number,
  lon: number
): Promise<WeatherData> {
  if (!WEATHER_API_CONFIG.apiKey) {
    throw new Error('CWA API Key 未設定');
  }

  // 使用 O-A0003-001 (自動氣象站-氣象觀測資料) 資料集
  const url = `${WEATHER_API_CONFIG.baseUrl}/O-A0003-001?Authorization=${WEATHER_API_CONFIG.apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`CWA API 錯誤: ${response.status}`);
    }

    const data = await response.json();

    // 找出最近的氣象站
    let nearestStation: any = null;
    let minDistance = Infinity;

    if (data.records && data.records.Station) {
      for (const station of data.records.Station) {
        // 獲取測站經緯度
        const stationLat = parseFloat(station.GeoInfo?.Coordinates?.[0]?.StationLatitude || 0);
        const stationLon = parseFloat(station.GeoInfo?.Coordinates?.[0]?.StationLongitude || 0);

        if (stationLat && stationLon) {
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

    // 從觀測資料提取天氣資訊
    const weatherElements = nearestStation.WeatherElement || {};
    
    // 溫度 (TEMP)
    const temp = parseFloat(weatherElements.AirTemperature || 0);
    
    // 濕度 (HUMD)
    const humidity = parseFloat(weatherElements.RelativeHumidity || 0);
    
    // 風速 (WDSD) - CWA 給的是 m/s，轉換為 km/h
    const windSpeed = Math.round(parseFloat(weatherElements.WindSpeed || 0) * 3.6);
    
    // 天氣描述 (Weather)
    const weatherDesc = weatherElements.Weather || '多雲';
    
    return {
      temperature: Math.round(temp),
      condition: mapCWAWeatherToCondition(weatherDesc),
      humidity: Math.round(humidity),
      windSpeed,
      description: weatherDesc,
    };
  } catch (error) {
    console.error('CWA API 錯誤:', error);
    throw error;
  }
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

  if (WEATHER_API_CONFIG.provider === 'cwb' && WEATHER_API_CONFIG.apiKey) {
    try {
      // 使用 F-C0032-001 (一般天氣預報-今明 36 小時天氣預報)
      // 或 F-D0047-091 (鄉鎮天氣預報-臺灣未來1週天氣預報)
      const url = `${WEATHER_API_CONFIG.baseUrl}/F-C0032-001?Authorization=${WEATHER_API_CONFIG.apiKey}`;

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`CWA 預報 API 錯誤: ${response.status}`);
      }

      const data = await response.json();
      const forecasts: WeatherForecast[] = [];

      if (data.records && data.records.location) {
        // 找出最近的縣市
        let nearestLocation: any = null;
        let minDistance = Infinity;

        for (const location of data.records.location) {
          // 使用縣市中心點座標（簡化處理）
          const locLat = parseFloat(location.lat || 0);
          const locLon = parseFloat(location.lon || 0);

          if (locLat && locLon) {
            const distance = calculateDistance(lat, lon, locLat, locLon);
            if (distance < minDistance) {
              minDistance = distance;
              nearestLocation = location;
            }
          }
        }

        if (nearestLocation && nearestLocation.weatherElement) {
          // 提取天氣元素
          const wxElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'Wx');
          const maxTElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'MaxT');
          const minTElement = nearestLocation.weatherElement.find((e: any) => e.elementName === 'MinT');

          if (wxElement && maxTElement && minTElement) {
            const timeCount = Math.min(
              wxElement.time?.length || 0,
              maxTElement.time?.length || 0,
              minTElement.time?.length || 0,
              days
            );

            for (let i = 0; i < timeCount; i++) {
              const startTime = wxElement.time[i].startTime;
              const date = new Date(startTime).toISOString().split('T')[0];
              const weatherDesc = wxElement.time[i].parameter?.parameterName || '多雲';
              const maxTemp = parseFloat(maxTElement.time[i].parameter?.parameterName || 25);
              const minTemp = parseFloat(minTElement.time[i].parameter?.parameterName || 20);

              forecasts.push({
                date,
                high: Math.round(maxTemp),
                low: Math.round(minTemp),
                condition: mapCWAWeatherToCondition(weatherDesc),
                description: weatherDesc,
              });
            }
          }
        }
      }

      // 如果有預報資料，回傳
      if (forecasts.length > 0) {
        return forecasts.slice(0, days);
      }
    } catch (error) {
      console.error('CWA 預報 API 錯誤:', error);
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
