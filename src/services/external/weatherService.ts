/**
 * 中央氣象局 OpenData API 服務
 * 資料集：F-C0032-001 - 一般天氣預報-今明36小時天氣預報
 * API 文件：https://opendata.cwa.gov.tw/dist/opendata-swagger.html#/
 */

interface WeatherParameter {
  parameterName: string;
  parameterValue?: string;
  parameterUnit?: string;
}

interface WeatherTime {
  startTime: string;
  endTime: string;
  parameter: WeatherParameter;
}

interface WeatherElement {
  elementName: string;
  description?: string;
  time: WeatherTime[];
}

interface WeatherLocation {
  locationName: string;
  geocode?: string;
  lat?: string;
  lon?: string;
  weatherElement: WeatherElement[];
}

interface WeatherRecords {
  datasetDescription: string;
  location: WeatherLocation[];
}

interface WeatherResponse {
  success: string;
  result: {
    resource_id: string;
    fields: Array<{
      id: string;
      type: string;
    }>;
  };
  records: WeatherRecords;
}

export interface WeatherForecast {
  condition: string;
  rainProb?: string;
  temp?: string;
  minTemp?: string;
  city: string;
  startTime?: string;
  endTime?: string;
  parameterValue?: string;
}

export interface CWAQueryOptions {
  locationName?: string | string[];
  elementName?: string | string[];
  limit?: number;
  offset?: number;
  format?: 'JSON' | 'XML';
  sort?: string;
  timeFrom?: string;
  timeTo?: string;
}

const CITY_MAPPING: Record<string, string> = {
  '台北': '臺北市',
  '新北': '新北市',
  '桃園': '桃園市',
  '台中': '臺中市',
  '台南': '臺南市',
  '高雄': '高雄市',
  '基隆': '基隆市',
  '新竹': '新竹市',
  '嘉義': '嘉義市',
  '金門': '金門縣',
  '連江': '連江縣',
  '宜蘭': '宜蘭縣',
  '花蓮': '花蓮縣',
  '台東': '臺東縣',
  '屏東': '屏東縣',
  '澎湖': '澎湖縣',
  '苗栗': '苗栗縣',
  '彰化': '彰化縣',
  '南投': '南投縣',
  '雲林': '雲林縣',
};

function formatCityName(city: string): string {
  let name = city.replace(/台/g, '臺').replace(/[縣市]/g, '');
  if (CITY_MAPPING[name]) {
    return CITY_MAPPING[name];
  }
  const cityList = ['臺北', '新北', '桃園', '臺中', '臺南', '高雄', '基隆', '新竹', '嘉義'];
  if (cityList.includes(name)) {
    return name + '市';
  } else if (name === '金門' || name === '連江') {
    return name + '縣';
  } else {
    return name + '縣';
  }
}

function buildQueryParams(options: CWAQueryOptions, apiKey: string): URLSearchParams {
  const params = new URLSearchParams();
  params.append('Authorization', apiKey);
  params.append('format', 'JSON');
  
  if (options.locationName !== undefined) {
    if (Array.isArray(options.locationName)) {
      options.locationName.forEach(loc => {
        if (loc) params.append('locationName', formatCityName(loc));
      });
    } else if (options.locationName) {
      params.append('locationName', formatCityName(options.locationName));
    }
  }
  
  if (options.elementName) {
    const elements = Array.isArray(options.elementName) ? options.elementName : [options.elementName];
    elements.forEach(elem => params.append('elementName', elem));
  }
  
  if (options.limit !== undefined) params.append('limit', options.limit.toString());
  if (options.offset !== undefined) params.append('offset', options.offset.toString());
  if (options.sort) params.append('sort', options.sort);
  if (options.timeFrom) params.append('timeFrom', options.timeFrom);
  if (options.timeTo) params.append('timeTo', options.timeTo);
  
  return params;
}

export const weatherService = {
  async getCurrentForecast(
    city?: string,
    options: Partial<CWAQueryOptions> = {}
  ): Promise<WeatherForecast | WeatherForecast[] | null> {
    // 使用環境變數或預設 API Key（生產環境建議使用環境變數）
    const API_KEY = import.meta.env.VITE_CWA_API_KEY || 'CWA-319AFA4F-6F57-4109-BDD6-F8DB65789EC5';
    
    if (!API_KEY) {
      console.warn('[CWA API] API Key 未設定');
      return null;
    }
    
    const queryOptions: CWAQueryOptions = {
      locationName: city,
      elementName: options.elementName || ['Wx', 'PoP', 'MaxT', 'MinT'],
      format: 'JSON',
      ...options
    };
    
    const params = buildQueryParams(queryOptions, API_KEY);
    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?${params.toString()}`;
    
    try {
      const res = await fetch(url, {
        headers: { 'accept': 'application/json' }
      });
      
      if (!res.ok) {
        if (res.status === 401) {
          console.error('[CWA API] 認證失敗');
        } else if (res.status === 404) {
          console.warn(`[CWA API] 找不到城市資料: ${city}`);
        } else {
          console.error(`[CWA API] HTTP 錯誤: ${res.status}`);
        }
        return null;
      }

      const data: WeatherResponse = await res.json();
      
      if (data.success !== 'true') {
        console.warn('[CWA API] API 回應失敗:', data);
        return null;
      }
      
      const locations = data.records?.location || [];
      if (!locations.length) {
        console.warn('[CWA API] 找不到氣象資料');
        return null;
      }

      if (city && locations.length === 1) {
        return this.parseLocationForecast(locations[0]);
      }
      
      return locations.map(loc => this.parseLocationForecast(loc));
    } catch (error) {
      console.error('[CWA API] 請求失敗:', error);
      return null;
    }
  },

  parseLocationForecast(location: WeatherLocation): WeatherForecast {
    const findElement = (name: string) => location.weatherElement.find(e => e.elementName === name);
    const wxElement = findElement('Wx');
    const popElement = findElement('PoP');
    const maxTElement = findElement('MaxT');
    const minTElement = findElement('MinT');

    const time = wxElement?.time?.[0];
    
    return {
      condition: time?.parameter?.parameterName || '多雲',
      rainProb: popElement?.time?.[0]?.parameter?.parameterName,
      temp: maxTElement?.time?.[0]?.parameter?.parameterName,
      minTemp: minTElement?.time?.[0]?.parameter?.parameterName,
      city: location.locationName,
      startTime: time?.startTime,
      endTime: time?.endTime,
      parameterValue: time?.parameter?.parameterValue,
    };
  },

  async getAllCitiesForecast(options: Partial<CWAQueryOptions> = {}): Promise<WeatherForecast[]> {
    const result = await this.getCurrentForecast(undefined, options);
    if (Array.isArray(result)) return result;
    return result ? [result] : [];
  },

  async getMultipleCitiesForecast(
    cities: string[],
    options: Partial<CWAQueryOptions> = {}
  ): Promise<WeatherForecast[]> {
    const result = await this.getCurrentForecast(cities[0], {
      ...options,
      locationName: cities
    });
    if (Array.isArray(result)) return result;
    return result ? [result] : [];
  }
};
