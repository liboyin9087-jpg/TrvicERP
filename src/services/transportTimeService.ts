/**
 * 交通時間計算服務
 * Transport Time Calculation Service
 */

import type { Transport, DayItinerary } from '../core/types/itinerary';

/**
 * 交通時間計算配置
 */
interface TransportConfig {
  averageSpeed: {
    bus: number;      // 公車平均速度 (km/h)
    train: number;    // 火車平均速度 (km/h)
    plane: number;    // 飛機平均速度 (km/h)
    ferry: number;    // 輪船平均速度 (km/h)
    taxi: number;     // 計程車平均速度 (km/h)
    walk: number;     // 步行速度 (km/h)
  };
  bufferTime: {
    bus: number;      // 公車緩衝時間 (分鐘)
    train: number;    // 火車緩衝時間 (分鐘)
    plane: number;    // 飛機緩衝時間 (分鐘)
    ferry: number;    // 輪船緩衝時間 (分鐘)
    taxi: number;     // 計程車緩衝時間 (分鐘)
    walk: number;     // 步行緩衝時間 (分鐘)
  };
}

/**
 * 預設交通配置
 */
const DEFAULT_CONFIG: TransportConfig = {
  averageSpeed: {
    bus: 40,      // 市區公車平均速度
    train: 80,    // 火車平均速度
    plane: 800,   // 飛機平均速度
    ferry: 30,    // 輪船平均速度
    taxi: 50,     // 計程車平均速度
    walk: 5       // 步行速度
  },
  bufferTime: {
    bus: 15,      // 公車等待和交通狀況緩衝
    train: 30,    // 火車進站和候車時間
    plane: 120,   // 飛機機場安檢和登機時間
    ferry: 45,    // 輪船登船時間
    taxi: 10,     // 計程車叫車時間
    walk: 5       // 步行準備時間
  }
};

/**
 * 地點座標資訊
 */
interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

/**
 * 台灣主要景點座標資料庫
 */
const TAIWAN_LOCATIONS: Record<string, Location> = {
  // 台北地區
  '台北車站': { name: '台北車站', latitude: 25.0478, longitude: 121.5318 },
  '台北101': { name: '台北101', latitude: 25.0340, longitude: 121.5645 },
  '故宮博物院': { name: '故宮博物院', latitude: 25.0200, longitude: 121.5510 },
  '中正紀念堂': { name: '中正紀念堂', latitude: 25.0369, longitude: 121.5209 },
  '西門町': { name: '西門町', latitude: 25.0419, longitude: 121.5069 },
  
  // 新北地區
  '九份老街': { name: '九份老街', latitude: 25.1086, longitude: 121.8457 },
  '淡水老街': { name: '淡水老街', latitude: 25.1675, longitude: 121.4393 },
  '烏來老街': { name: '烏來老街', latitude: 24.8646, longitude: 121.5356 },
  
  // 桃園地區
  '桃園機場': { name: '桃園機場', latitude: 25.0777, longitude: 121.2328 },
  '大溪老街': { name: '大溪老街', latitude: 24.8836, longitude: 121.2867 },
  
  // 新竹地區
  '新竹城隍廟': { name: '新竹城隍廟', latitude: 24.8138, longitude: 120.9675 },
  '青草湖': { name: '青草湖', latitude: 24.8236, longitude: 120.9652 },
  
  // 台中地區
  '台中車站': { name: '台中車站', latitude: 24.1368, longitude: 120.6850 },
  '逢甲夜市': { name: '逢甲夜市', latitude: 24.1799, longitude: 120.6468 },
  '日月潭': { name: '日月潭', latitude: 23.8594, longitude: 120.9120 },
  '清境農場': { name: '清境農場', latitude: 23.9675, longitude: 121.1678 },
  
  // 南投地區
  '溪頭自然教育園區': { name: '溪頭自然教育園區', latitude: 23.6668, longitude: 120.8153 },
  '阿里山森林遊樂區': { name: '阿里山森林遊樂區', latitude: 23.5089, longitude: 120.7956 },
  
  // 雲林地區
  '劍湖山世界': { name: '劍湖山世界', latitude: 23.6103, longitude: 120.4043 },
  '北港朝天宮': { name: '北港朝天宮', latitude: 23.5649, longitude: 120.3027 },
  
  // 嘉義地區
  '嘉義車站': { name: '嘉義車站', latitude: 23.4801, longitude: 120.4491 },
  '故宮南院': { name: '故宮南院', latitude: 23.4306, longitude: 120.5764 },
  
  // 台南地區
  '台南車站': { name: '台南車站', latitude: 22.9999, longitude: 120.2269 },
  '赤崁樓': { name: '赤崁樓', latitude: 22.9968, longitude: 120.2014 },
  '安平古堡': { name: '安平古堡', latitude: 23.0002, longitude: 120.1662 },
  '奇美博物館': { name: '奇美博物館', latitude: 22.9246, longitude: 120.2856 },
  
  // 高雄地區
  '高雄車站': { name: '高雄車站', latitude: 22.6427, longitude: 120.3013 },
  '愛河': { name: '愛河', latitude: 22.6273, longitude: 120.2992 },
  '蓮池潭': { name: '蓮池潭', latitude: 22.6901, longitude: 120.2965 },
  '西子灣': { name: '西子灣', latitude: 22.6267, longitude: 120.2685 },
  
  // 屏東地區
  '墾丁大街': { name: '墾丁大街', latitude: 21.9446, longitude: 120.7475 },
  '鵝鑾鼻燈塔': { name: '鵝鑾鼻燈塔', latitude: 21.9026, longitude: 120.8508 },
  '國立海洋生物博物館': { name: '國立海洋生物博物館', latitude: 22.0478, longitude: 120.7019 },
  
  // 台東地區
  '台東車站': { name: '台東車站', latitude: 22.7560, longitude: 121.1536 },
  '伯朗大道': { name: '伯朗大道', latitude: 23.1289, longitude: 121.2089 },
  '三仙台': { name: '三仙台', latitude: 23.0986, longitude: 121.4216 },
  
  // 花蓮地區
  '花蓮車站': { name: '花蓮車站', latitude: 23.9769, longitude: 121.6058 },
  '太魯閣國家公園': { name: '太魯閣國家公園', latitude: 24.1516, longitude: 121.6339 },
  '七星潭': { name: '七星潭', latitude: 23.9958, longitude: 121.6086 },
  '雲山水': { name: '雲山水', latitude: 23.8436, longitude: 121.5192 },
  
  // 宜蘭地區
  '宜蘭車站': { name: '宜蘭車站', latitude: 24.7661, longitude: 121.7511 },
  '羅東夜市': { name: '羅東夜市', latitude: 24.6770, longitude: 121.7668 },
  '烏石港': { name: '烏石港', latitude: 24.6328, longitude: 121.8169 },
  '蘇澳冷泉': { name: '蘇澳冷泉', latitude: 24.5946, longitude: 121.8428 },
  
  // 澎湖地區
  '馬公市': { name: '馬公市', latitude: 23.5658, longitude: 119.5656 },
  '七美雙心石滬': { name: '七美雙心石滬', latitude: 23.2017, longitude: 119.4178 },
  '吉貝沙尾': { name: '吉貝沙尾', latitude: 23.7342, longitude: 119.5689 },
  
  // 金門地區
  '金城鎮': { name: '金城鎮', latitude: 24.4328, longitude: 118.3169 },
  '莒光樓': { name: '莒光樓', latitude: 24.4331, longitude: 118.3178 },
  
  // 連江地區
  '南竿': { name: '南竿', latitude: 26.1556, longitude: 119.9456 },
  '北竿': { name: '北竿', latitude: 26.2217, longitude: 119.9456 }
};

/**
 * 計算兩點之間的直線距離（公里）
 */
function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371; // 地球半徑（公里）
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * 角度轉弧度
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 交通時間計算服務類別
 */
export class TransportTimeService {
  private config: TransportConfig;

  constructor(config: TransportConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * 計算交通時間
   */
  calculateTransportTime(transport: Transport): {
    estimatedTime: number;    // 預估時間（分鐘）
    distance: number;          // 距離（公里）
    bufferTime: number;        // 緩衝時間（分鐘）
    totalTime: number;         // 總時間（分鐘）
    confidence: number;        // 信心指數（0-1）
  } {
    const departureLocation = this.findLocation(transport.departure);
    const arrivalLocation = this.findLocation(transport.arrival);

    if (!departureLocation || !arrivalLocation) {
      return {
        estimatedTime: 60,
        distance: 0,
        bufferTime: this.config.bufferTime[transport.type],
        totalTime: 60 + this.config.bufferTime[transport.type],
        confidence: 0.3
      };
    }

    const distance = calculateDistance(departureLocation, arrivalLocation);
    const speed = this.config.averageSpeed[transport.type];
    const estimatedTime = Math.round((distance / speed) * 60); // 轉換為分鐘
    const bufferTime = this.config.bufferTime[transport.type];
    const totalTime = estimatedTime + bufferTime;
    const confidence = this.calculateConfidence(transport.type, distance);

    return {
      estimatedTime,
      distance: Math.round(distance * 100) / 100,
      bufferTime,
      totalTime,
      confidence
    };
  }

  /**
   * 查找地點座標
   */
  private findLocation(locationName: string): Location | null {
    // 直接查找
    if (TAIWAN_LOCATIONS[locationName]) {
      return TAIWAN_LOCATIONS[locationName];
    }

    // 模糊匹配
    const keys = Object.keys(TAIWAN_LOCATIONS);
    for (const key of keys) {
      if (key.includes(locationName) || locationName.includes(key)) {
        return TAIWAN_LOCATIONS[key];
      }
    }

    return null;
  }

  /**
   * 計算信心指數
   */
  private calculateConfidence(transportType: Transport['type'], distance: number): number {
    let baseConfidence = 0.8;

    // 根據交通類型調整信心指數
    switch (transportType) {
      case 'plane':
        baseConfidence = 0.95;
        break;
      case 'train':
        baseConfidence = 0.9;
        break;
      case 'bus':
        baseConfidence = 0.7;
        break;
      case 'taxi':
        baseConfidence = 0.6;
        break;
      case 'walk':
        baseConfidence = 0.8;
        break;
      case 'ferry':
        baseConfidence = 0.75;
        break;
    }

    // 根據距離調整信心指數
    if (distance < 1) {
      baseConfidence *= 0.8; // 短距離不確定性較高
    } else if (distance > 200) {
      baseConfidence *= 0.9; // 長距離主要交通較可靠
    }

    return Math.round(baseConfidence * 100) / 100;
  }

  /**
   * 檢查行程時間合理性
   */
  validateItineraryTiming(dayItinerary: DayItinerary): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 檢查交通時間
    dayItinerary.transports.forEach((transport, index) => {
      const timeInfo = this.calculateTransportTime(transport);
      
      if (timeInfo.confidence < 0.5) {
        warnings.push(`交通安排 ${index + 1} 時間預估不確定性較高 (${transport.departure} → ${transport.arrival})`);
      }

      if (timeInfo.totalTime > 240) { // 超過4小時
        warnings.push(`交通安排 ${index + 1} 時間過長 (${Math.round(timeInfo.totalTime / 60)}小時)`);
        suggestions.push(`建議考慮分段交通或過夜安排`);
      }
    });

    // 檢查景點停留時間
    dayItinerary.spots.forEach((spot, index) => {
      if (spot.duration && spot.duration < 30) {
        warnings.push(`景點 ${spot.name} 停留時間過短 (${spot.duration}分鐘)`);
        suggestions.push(`建議 ${spot.name} 停留時間至少60分鐘`);
      }
    });

    // 檢查餐食時間
    dayItinerary.meals.forEach((meal, index) => {
      const mealTime = parseInt(meal.time.split(':')[0]) * 60 + parseInt(meal.time.split(':')[1]);
      
      if (meal.type === 'lunch' && (mealTime < 660 || mealTime > 840)) {
        warnings.push(`午餐時間安排不合理 (${meal.time})`);
        suggestions.push(`建議午餐時間安排在 11:00-14:00 之間`);
      }
      
      if (meal.type === 'dinner' && (mealTime < 1020 || mealTime > 1260)) {
        warnings.push(`晚餐時間安排不合理 (${meal.time})`);
        suggestions.push(`建議晚餐時間安排在 17:00-21:00 之間`);
      }
    });

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  /**
   * 優化行程時間安排
   */
  optimizeItineraryTiming(dayItinerary: DayItinerary): DayItinerary {
    const optimized = { ...dayItinerary };
    
    // 根據交通時間調整景點時間
    let currentTime = 480; // 從早上8:00開始 (8*60)

    dayItinerary.spots.forEach((spot, index) => {
      // 計算到下一個景點的交通時間
      if (index < dayItinerary.transports.length) {
        const transport = dayItinerary.transports[index];
        const timeInfo = this.calculateTransportTime(transport);
        currentTime += timeInfo.totalTime;
      }

      // 調整景點時間
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      optimized.spots[index] = {
        ...spot,
        time: `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
      };

      // 加上景點停留時間
      currentTime += spot.duration || 90; // 預設停留90分鐘
    });

    return optimized;
  }

  /**
   * 取得所有支援的地點
   */
  getSupportedLocations(): Location[] {
    return Object.values(TAIWAN_LOCATIONS);
  }

  /**
   * 搜尋地點
   */
  searchLocations(query: string): Location[] {
    const results: Location[] = [];
    const lowerQuery = query.toLowerCase();

    Object.values(TAIWAN_LOCATIONS).forEach(location => {
      if (location.name.toLowerCase().includes(lowerQuery)) {
        results.push(location);
      }
    });

    return results;
  }
}

// 建立預設實例
export const transportTimeService = new TransportTimeService();

export default TransportTimeService;
