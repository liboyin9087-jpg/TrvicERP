/**
 * Weather Service - 天氣 API 整合
 * 
 * 支援的 API:
 * - OpenWeatherMap (推薦)
 * - Open-Meteo (免費，無需 API Key)
 * - 台灣中央氣象署 (CWA)
 */

// ==============================================
// Types
// ==============================================

export interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  description: string;
  icon: string;
  windSpeed: number;
  visibility: number;
  sunrise?: string;
  sunset?: string;
  updatedAt: string;
}

export interface ForecastData {
  date: string;
  dayOfWeek: string;
  high: number;
  low: number;
  description: string;
  icon: string;
  precipitation: number;
}

export interface WeatherResponse {
  current: WeatherData;
  forecast: ForecastData[];
  alerts?: WeatherAlert[];
}

export interface WeatherAlert {
  title: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  start: string;
  end: string;
}

// ==============================================
// Configuration
// ==============================================

type WeatherProvider = 'openweathermap' | 'open-meteo' | 'cwa';

const getWeatherConfig = () => ({
  provider: (import.meta.env.VITE_WEATHER_PROVIDER || 'open-meteo') as WeatherProvider,
  apiKey: import.meta.env.VITE_WEATHER_API_KEY || '',
  cwaApiKey: import.meta.env.VITE_CWA_API_KEY || '',
});

// ==============================================
// Weather Icon Mapping
// ==============================================

const weatherIcons: Record<string, string> = {
  'clear': '☀️',
  'sunny': '☀️',
  'partly-cloudy': '⛅',
  'cloudy': '☁️',
  'overcast': '🌥️',
  'rain': '🌧️',
  'drizzle': '🌦️',
  'thunderstorm': '⛈️',
  'snow': '🌨️',
  'fog': '🌫️',
  'mist': '🌫️',
  'wind': '💨',
  'night-clear': '🌙',
  'night-cloudy': '☁️',
};

function getWeatherIcon(code: number | string, isDay: boolean = true): string {
  // OpenWeatherMap icon codes
  const iconMap: Record<string, string> = {
    '01d': '☀️', '01n': '🌙',
    '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️',
    '04d': '🌥️', '04n': '🌥️',
    '09d': '🌧️', '09n': '🌧️',
    '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️',
    '13d': '🌨️', '13n': '🌨️',
    '50d': '🌫️', '50n': '🌫️',
  };
  
  if (typeof code === 'string') {
    return iconMap[code] || '🌤️';
  }
  
  // WMO weather codes (Open-Meteo)
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return '⛅';
  if (code <= 48) return '🌫️';
  if (code <= 57) return '🌦️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code <= 99) return '⛈️';
  
  return '🌤️';
}

// ==============================================
// OpenWeatherMap API
// ==============================================

async function fetchOpenWeatherMap(city: string): Promise<WeatherResponse> {
  const config = getWeatherConfig();
  
  if (!config.apiKey) {
    throw new Error('OpenWeatherMap API key not configured');
  }

  // Current weather
  const currentUrl = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${config.apiKey}&units=metric&lang=zh_tw`;
  const currentRes = await fetch(currentUrl);
  
  if (!currentRes.ok) {
    throw new Error(`Weather API error: ${currentRes.statusText}`);
  }
  
  const currentData = await currentRes.json();
  
  // 5-day forecast
  const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${config.apiKey}&units=metric&lang=zh_tw`;
  const forecastRes = await fetch(forecastUrl);
  const forecastData = await forecastRes.json();

  const current: WeatherData = {
    location: `${currentData.name}, ${currentData.sys.country}`,
    temperature: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    humidity: currentData.main.humidity,
    description: currentData.weather[0].description,
    icon: getWeatherIcon(currentData.weather[0].icon),
    windSpeed: Math.round(currentData.wind.speed * 3.6), // m/s to km/h
    visibility: Math.round(currentData.visibility / 1000),
    sunrise: new Date(currentData.sys.sunrise * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    sunset: new Date(currentData.sys.sunset * 1000).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
    updatedAt: new Date().toISOString(),
  };

  // Process forecast (group by day)
  const dailyMap = new Map<string, ForecastData>();
  
  forecastData.list?.forEach((item: any) => {
    const date = new Date(item.dt * 1000);
    const dateKey = date.toISOString().split('T')[0];
    
    const existing = dailyMap.get(dateKey);
    if (!existing) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dayOfWeek: date.toLocaleDateString('zh-TW', { weekday: 'short' }),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        description: item.weather[0].description,
        icon: getWeatherIcon(item.weather[0].icon),
        precipitation: Math.round((item.pop || 0) * 100),
      });
    } else {
      existing.high = Math.max(existing.high, Math.round(item.main.temp_max));
      existing.low = Math.min(existing.low, Math.round(item.main.temp_min));
    }
  });

  const forecast = Array.from(dailyMap.values()).slice(0, 5);

  return { current, forecast };
}

// ==============================================
// Open-Meteo API (Free, no API key needed)
// ==============================================

async function fetchOpenMeteo(lat: number, lon: number, locationName?: string): Promise<WeatherResponse> {
  const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=Asia%2FTaipei&forecast_days=7`;
  
  const res = await fetch(currentUrl);
  
  if (!res.ok) {
    throw new Error(`Open-Meteo API error: ${res.statusText}`);
  }
  
  const data = await res.json();
  const isDay = new Date().getHours() >= 6 && new Date().getHours() < 18;

  const current: WeatherData = {
    location: locationName || `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
    temperature: Math.round(data.current.temperature_2m),
    feelsLike: Math.round(data.current.apparent_temperature),
    humidity: data.current.relative_humidity_2m,
    description: getWeatherDescription(data.current.weather_code),
    icon: getWeatherIcon(data.current.weather_code, isDay),
    windSpeed: Math.round(data.current.wind_speed_10m),
    visibility: Math.round((data.current.visibility || 10000) / 1000),
    updatedAt: new Date().toISOString(),
  };

  const forecast: ForecastData[] = data.daily.time.slice(0, 5).map((date: string, i: number) => ({
    date,
    dayOfWeek: new Date(date).toLocaleDateString('zh-TW', { weekday: 'short' }),
    high: Math.round(data.daily.temperature_2m_max[i]),
    low: Math.round(data.daily.temperature_2m_min[i]),
    description: getWeatherDescription(data.daily.weather_code[i]),
    icon: getWeatherIcon(data.daily.weather_code[i]),
    precipitation: data.daily.precipitation_probability_max[i] || 0,
  }));

  return { current, forecast };
}

function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: '晴朗',
    1: '大致晴朗',
    2: '多雲',
    3: '陰天',
    45: '有霧',
    48: '霜霧',
    51: '細雨',
    53: '小雨',
    55: '中雨',
    61: '小雨',
    63: '中雨',
    65: '大雨',
    71: '小雪',
    73: '中雪',
    75: '大雪',
    77: '霰',
    80: '陣雨',
    81: '陣雨',
    82: '大陣雨',
    85: '小雪',
    86: '大雪',
    95: '雷雨',
    96: '雷雨伴冰雹',
    99: '雷雨伴大冰雹',
  };
  return descriptions[code] || '未知';
}

// ==============================================
// Taiwan CWA API (中央氣象署)
// ==============================================

async function fetchCWAWeather(locationId: string): Promise<WeatherResponse> {
  const config = getWeatherConfig();
  
  if (!config.cwaApiKey) {
    throw new Error('CWA API key not configured');
  }

  // CWA API implementation would go here
  // For now, fallback to Open-Meteo with Taiwan coordinates
  const taiwanLocations: Record<string, { lat: number; lon: number; name: string }> = {
    'taipei': { lat: 25.0330, lon: 121.5654, name: '台北市' },
    'taichung': { lat: 24.1477, lon: 120.6736, name: '台中市' },
    'kaohsiung': { lat: 22.6273, lon: 120.3014, name: '高雄市' },
    'tainan': { lat: 22.9999, lon: 120.2269, name: '台南市' },
    'hualien': { lat: 23.9910, lon: 121.6111, name: '花蓮市' },
  };

  const location = taiwanLocations[locationId.toLowerCase()] || taiwanLocations.taipei;
  return fetchOpenMeteo(location.lat, location.lon, location.name);
}

// ==============================================
// Geocoding Helper
// ==============================================

async function geocodeCity(city: string): Promise<{ lat: number; lon: number; name: string }> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`;
  
  const res = await fetch(url);
  const data = await res.json();
  
  if (!data.results || data.results.length === 0) {
    throw new Error(`Location not found: ${city}`);
  }

  const result = data.results[0];
  return {
    lat: result.latitude,
    lon: result.longitude,
    name: result.name + (result.country ? `, ${result.country}` : ''),
  };
}

// ==============================================
// Main Export Functions
// ==============================================

export async function getWeather(location: string): Promise<WeatherResponse> {
  const config = getWeatherConfig();

  try {
    switch (config.provider) {
      case 'openweathermap':
        return await fetchOpenWeatherMap(location);
      
      case 'cwa':
        return await fetchCWAWeather(location);
      
      case 'open-meteo':
      default:
        const geo = await geocodeCity(location);
        return await fetchOpenMeteo(geo.lat, geo.lon, geo.name);
    }
  } catch (error) {
    console.error('Weather API Error:', error);
    throw error;
  }
}

export async function getWeatherByCoords(lat: number, lon: number): Promise<WeatherResponse> {
  return fetchOpenMeteo(lat, lon);
}

// ==============================================
// Cache Implementation
// ==============================================

const weatherCache = new Map<string, { data: WeatherResponse; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export async function getWeatherCached(location: string): Promise<WeatherResponse> {
  const cacheKey = location.toLowerCase();
  const cached = weatherCache.get(cacheKey);
  
  if (cached && Date.now() < cached.expiry) {
    return cached.data;
  }

  const data = await getWeather(location);
  weatherCache.set(cacheKey, { data, expiry: Date.now() + CACHE_TTL });
  
  return data;
}

// ==============================================
// Utility Functions
// ==============================================

export function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${Math.round(temp * 9/5 + 32)}°F`;
  }
  return `${Math.round(temp)}°C`;
}

export function getWeatherAdvice(weather: WeatherData): string {
  const temp = weather.temperature;
  const description = weather.description.toLowerCase();

  if (description.includes('雨') || description.includes('rain')) {
    return '建議攜帶雨具，注意防滑';
  }
  if (temp >= 35) {
    return '高溫警報，注意防曬補水';
  }
  if (temp <= 10) {
    return '天氣寒冷，請注意保暖';
  }
  if (description.includes('霧') || description.includes('fog')) {
    return '能見度低，戶外活動請小心';
  }
  if (temp >= 25 && temp <= 30) {
    return '天氣宜人，適合戶外活動';
  }
  
  return '天氣穩定，旅途愉快';
}

export default {
  getWeather,
  getWeatherByCoords,
  getWeatherCached,
  formatTemperature,
  getWeatherAdvice,
};
