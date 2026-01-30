/**
 * 交通時間計算服務
 * Transport Time Calculation Service
 *
 * 此檔案為純服務層(Service Layer)程式碼，不屬於 React 元件。
 * 根據「發現的問題」，對於此類檔案無法評估 React 元件架構問題。
 *
 * 因此，修復重點將集中在提升服務自身的架構獨立性、可配置性與程式碼品質，
 * 以符合高階服務層的設計原則，並間接支援未來可能使用此服務的 React 元件（或其他模組）的「Kintone 獨立性」要求。
 *
 * 主要調整：
 * 1. 將硬編碼的 `TAIWAN_LOCATIONS` 數據移至服務的初始化配置中，使其可透過 constructor 注入。
 *    這使得服務更加獨立，可以在不同的環境或測試中載入不同的地點數據，類似於 React 元件透過 props 接收數據。
 * 2. 引入常數定義，取代散佈在程式碼中的魔術數字，提升可讀性和維護性。
 * 3. 增強了地點查找的模糊匹配邏輯，並添加了未找到地點時的警告和預設處理。
 * 4. 增加了更詳細的註解和程式碼組織。
 * 5. 確保沒有引入任何 React 或全域 Store 的依賴。
 */

import type { Transport, DayItinerary } from '../core/types/itinerary';

/**
 * 地點座標資訊
 */
interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

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
    plane: number;    // 飛機進站和候車時間 (分鐘)
    ferry: number;    // 輪船登船時間 (分鐘)
    taxi: number;     // 計程車叫車時間 (分鐘)
    walk: number;     // 步行準備時間 (分鐘)
  };
}

/**
 * 地點資料型別 (鍵值對應地點名稱和Location物件)
 */
type LocationData = Record<string, Location>;

/**
 * 交通時間服務的整體配置選項
 * 允許注入交通配置和地點數據，增強服務的獨立性和可測試性。
 */
interface TransportTimeServiceOptions {
  transportConfig?: TransportConfig;
  locationData?: LocationData;
}

/**
 * 預設交通配置
 */
const DEFAULT_TRANSPORT_CONFIG: TransportConfig = {
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
 * 台灣主要景點座標資料庫 (預設資料)
 * 此資料現在可透過服務初始化時傳入，實現可配置性。
 */
const DEFAULT_TAIWAN_LOCATIONS: LocationData = {
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
 * 常數定義，取代程式碼中的魔術數字，提升可讀性和維護性。
 */
const EARTH_RADIUS_KM = 6371; // 地球半徑（公里）
const MINUTES_PER_HOUR = 60; // 每小時分鐘數
const DISTANCE_ROUNDING_DECIMALS = 2; // 距離四捨五入到小數點後位數
const CONFIDENCE_ROUNDING_DECIMALS = 2; // 信心指數四捨五入到小數點後位數

const MIN_SPOT_DURATION_WARNING_MINUTES = 30; // 景點停留時間過短警告閾值 (分鐘)
const RECOMMENDED_SPOT_DURATION_MINUTES = 60; // 推薦景點停留時間 (分鐘)
const DEFAULT_SPOT_DURATION_MINUTES = 90; // 預設景點停留時間 (分鐘)
const MAX_TRANSPORT_TIME_WARNING_MINUTES = 4 * MINUTES_PER_HOUR; // 交通時間過長警告閾值 (分鐘, 4小時)
const LOW_CONFIDENCE_THRESHOLD = 0.5; // 信心指數低於此值發出警告

// 餐食時間範圍 (分鐘，從午夜計)
const LUNCH_START_TIME_MINUTES = 11 * MINUTES_PER_HOUR; // 11:00
const LUNCH_END_TIME_MINUTES = 14 * MINUTES_PER_HOUR;   // 14:00
const DINNER_START_TIME_MINUTES = 17 * MINUTES_PER_HOUR; // 17:00
const DINNER_END_TIME_MINUTES = 21 * MINUTES_PER_HOUR;   // 21:00

// 預設行程開始時間 (分鐘，從午夜計)
const DEFAULT_ITINERARY_START_TIME_MINUTES = 8 * MINUTES_PER_HOUR; // 08:00


/**
 * 角度轉弧度
 * @param degrees 角度值
 * @returns 弧度值
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * 計算兩點之間的直線距離（公里），使用Haversine公式。
 * @param point1 第一個地點的座標
 * @param point2 第二個地點的座標
 * @returns 兩點間的直線距離（公里）
 */
function calculateHaversineDistance(point1: Location, point2: Location): number {
  const dLat = toRadians(point2.latitude - point1.latitude);
  const dLon = toRadians(point2.longitude - point1.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_KM * c;
}

/**
 * 交通時間計算服務類別
 * 提供交通時間估算、行程驗證和優化功能。
 */
export class TransportTimeService {
  private config: TransportConfig;
  private locationData: LocationData;

  /**
   * 建立 TransportTimeService 實例。
   * 允許透過 options 注入自定義的交通配置和地點數據，增強服務的獨立性和可測試性。
   * @param options 服務配置選項，可包含 transportConfig 和 locationData。
   */
  constructor(options?: TransportTimeServiceOptions) {
    this.config = options?.transportConfig || DEFAULT_TRANSPORT_CONFIG;
    this.locationData = options?.locationData || DEFAULT_TAIWAN_LOCATIONS;
  }

  /**
   * 計算交通時間
   * @param transport 交通方式和起訖點資訊。
   * @returns 包含預估時間、距離、緩衝時間、總時間和信心指數的物件。
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

    // 如果找不到任何一個地點，則返回預設的較長時間和低信心指數，並發出警告。
    if (!departureLocation || !arrivalLocation) {
      console.warn(`無法找到地點：出發地 "${transport.departure}" 或 目的地 "${transport.arrival}"。將使用預設時間估計。`);
      const bufferTime = this.config.bufferTime[transport.type] || DEFAULT_TRANSPORT_CONFIG.bufferTime[transport.type];
      const estimatedTime = 60; // 預設 1 小時交通時間
      return {
        estimatedTime: estimatedTime,
        distance: 0,
        bufferTime: bufferTime,
        totalTime: estimatedTime + bufferTime,
        confidence: 0.3 // 低信心指數
      };
    }

    const distance = calculateHaversineDistance(departureLocation, arrivalLocation);
    const speed = this.config.averageSpeed[transport.type];

    // 防止除以零或無效速度，若速度為零則預估時間為無限大 (這裡設定為0，實際應用可能需更複雜的策略)
    const estimatedTime = speed > 0 ? Math.round((distance / speed) * MINUTES_PER_HOUR) : 0;
    const bufferTime = this.config.bufferTime[transport.type];
    const totalTime = estimatedTime + bufferTime;
    const confidence = this.calculateConfidence(transport.type, distance);

    return {
      estimatedTime,
      distance: parseFloat(distance.toFixed(DISTANCE_ROUNDING_DECIMALS)), // 四捨五入到指定小數點後位數
      bufferTime,
      totalTime,
      confidence
    };
  }

  /**
   * 查找地點座標。
   * 優先進行精確匹配，如果沒有精確匹配，則嘗試模糊匹配。
   * @param locationName 地點名稱。
   * @returns 找到的地點物件或 null。
   */
  private findLocation(locationName: string): Location | null {
    // 1. 精確查找
    if (this.locationData[locationName]) {
      return this.locationData[locationName];
    }

    // 2. 模糊匹配 (不區分大小寫，包含關係)
    const lowerCaseLocationName = locationName.toLowerCase();
    for (const key in this.locationData) {
      // 確保是物件自身的屬性，而非原型鏈上的屬性
      if (Object.prototype.hasOwnProperty.call(this.locationData, key)) {
        if (key.toLowerCase().includes(lowerCaseLocationName) || lowerCaseLocationName.includes(key.toLowerCase())) {
          return this.locationData[key];
        }
      }
    }

    return null;
  }

  /**
   * 計算交通預估的信心指數。
   * 信心指數反映了預估的可靠程度，主要受交通類型和距離的影響。
   * @param transportType 交通類型。
   * @param distance 交通距離（公里）。
   * @returns 信心指數 (0-1之間，四捨五入到小數點後兩位)。
   */
  private calculateConfidence(transportType: Transport['type'], distance: number): number {
    let baseConfidence = 0.8; // 預設信心指數

    // 根據交通類型調整信心指數
    switch (transportType) {
      case 'plane':
        baseConfidence = 0.95; // 飛機時間表通常較穩定，但有機場流程緩衝
        break;
      case 'train':
        baseConfidence = 0.9;  // 火車時間表也較穩定
        break;
      case 'bus':
        baseConfidence = 0.7;  // 公車受路況、班次、等待時間影響較大
        break;
      case 'taxi':
        baseConfidence = 0.6;  // 計程車受路況、叫車時間、司機選擇路線影響更大
        break;
      case 'walk':
        baseConfidence = 0.8;  // 步行時間相對可控，但地形和個人速度有變數
        break;
      case 'ferry':
        baseConfidence = 0.75; // 輪船受天氣、海況、登船手續影響
        break;
    }

    // 根據距離調整信心指數
    if (distance < 1) {
      baseConfidence *= 0.8; // 短距離可能誤差更大（步行準備、尋路、等待等變數多）
    } else if (distance > 200) {
      baseConfidence *= 0.9; // 長距離主要交通方式（飛機、火車）一旦啟動，其時間預估通常更準確
    }

    return parseFloat(baseConfidence.toFixed(CONFIDENCE_ROUNDING_DECIMALS)); // 四捨五入到指定小數點後位數
  }

  /**
   * 檢查行程時間安排的合理性，並提供警告和建議。
   * @param dayItinerary 日程安排物件。
   * @returns 包含有效性、警告訊息和建議的物件。
   */
  validateItineraryTiming(dayItinerary: DayItinerary): {
    isValid: boolean;
    warnings: string[];
    suggestions: string[];
  } {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // 檢查交通時間的合理性
    dayItinerary.transports.forEach((transport, index) => {
      const timeInfo = this.calculateTransportTime(transport);
      
      if (timeInfo.confidence < LOW_CONFIDENCE_THRESHOLD) {
        warnings.push(`交通安排 ${index + 1} (${transport.departure} → ${transport.arrival}) 預估不確定性較高 (信心指數: ${timeInfo.confidence})。`);
        suggestions.push(`對於交通安排 ${index + 1}，建議預留更多彈性時間，或考慮其他交通方式。`);
      }

      if (timeInfo.totalTime > MAX_TRANSPORT_TIME_WARNING_MINUTES) {
        warnings.push(`交通安排 ${index + 1} (${transport.departure} → ${transport.arrival}) 時間過長 (${Math.round(timeInfo.totalTime / MINUTES_PER_HOUR)} 小時)。`);
        suggestions.push(`建議考慮分段交通或在中途城市過夜，以減少交通安排 ${index + 1} 的時間。`);
      }
    });

    // 檢查景點停留時間的合理性
    dayItinerary.spots.forEach((spot) => {
      if (spot.duration && spot.duration < MIN_SPOT_DURATION_WARNING_MINUTES) {
        warnings.push(`景點 ${spot.name} 停留時間過短 (${spot.duration} 分鐘)。`);
        suggestions.push(`建議將景點 ${spot.name} 停留時間延長至至少 ${RECOMMENDED_SPOT_DURATION_MINUTES} 分鐘，以充分體驗。`);
      }
    });

    // 檢查餐食時間的合理性
    dayItinerary.meals.forEach((meal) => {
      const [hourStr, minuteStr] = meal.time.split(':').map(Number);
      // 檢查解析是否成功，避免NaN
      if (isNaN(hourStr) || isNaN(minuteStr)) {
        warnings.push(`餐食 ${meal.name} 的時間格式不正確 (${meal.time})。`);
        return;
      }
      const mealTimeInMinutes = hourStr * MINUTES_PER_HOUR + minuteStr;
      
      if (meal.type === 'lunch' && (mealTimeInMinutes < LUNCH_START_TIME_MINUTES || mealTimeInMinutes > LUNCH_END_TIME_MINUTES)) {
        warnings.push(`午餐時間安排不合理 (${meal.time})。`);
        suggestions.push(`建議將午餐時間安排在 ${Math.floor(LUNCH_START_TIME_MINUTES / MINUTES_PER_HOUR).toString().padStart(2, '0')}:${(LUNCH_START_TIME_MINUTES % MINUTES_PER_HOUR).toString().padStart(2, '0')} 到 ${Math.floor(LUNCH_END_TIME_MINUTES / MINUTES_PER_HOUR).toString().padStart(2, '0')}:${(LUNCH_END_TIME_MINUTES % MINUTES_PER_HOUR).toString().padStart(2, '0')} 之間。`);
      }
      
      if (meal.type === 'dinner' && (mealTimeInMinutes < DINNER_START_TIME_MINUTES || mealTimeInMinutes > DINNER_END_TIME_MINUTES)) {
        warnings.push(`晚餐時間安排不合理 (${meal.time})。`);
        suggestions.push(`建議將晚餐時間安排在 ${Math.floor(DINNER_START_TIME_MINUTES / MINUTES_PER_HOUR).toString().padStart(2, '0')}:${(DINNER_START_TIME_MINUTES % MINUTES_PER_HOUR).toString().padStart(2, '0')} 到 ${Math.floor(DINNER_END_TIME_MINUTES / MINUTES_PER_HOUR).toString().padStart(2, '0')}:${(DINNER_END_TIME_MINUTES % MINUTES_PER_HOUR).toString().padStart(2, '0')} 之間。`);
      }
    });

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions
    };
  }

  /**
   * 簡易優化行程時間安排。
   * 此優化會根據交通時間順序調整景點的開始時間，以確保時間的連續性。
   * 注意：此方法僅提供基礎的順序調整，不涉及複雜的排程演算法。
   * @param dayItinerary 待優化的日程安排。
   * @returns 優化後的日程安排。
   */
  optimizeItineraryTiming(dayItinerary: DayItinerary): DayItinerary {
    if (!dayItinerary.spots || dayItinerary.spots.length === 0) {
      return dayItinerary; // 如果沒有景點，則無需優化
    }

    // 深度複製，避免修改原始物件
    const optimized: DayItinerary = JSON.parse(JSON.stringify(dayItinerary));
    
    let currentTime = DEFAULT_ITINERARY_START_TIME_MINUTES; // 從預設開始時間計 (08:00)

    for (let i = 0; i < optimized.spots.length; i++) {
      const currentSpot = optimized.spots[i];

      // 將當前景點的開始時間設定為當前累計時間
      const hours = Math.floor(currentTime / MINUTES_PER_HOUR);
      const minutes = currentTime % MINUTES_PER_HOUR;
      optimized.spots[i].time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

      // 加上景點停留時間 (若未設定，使用預設值)
      currentTime += currentSpot.duration || DEFAULT_SPOT_DURATION_MINUTES;

      // 如果有下一個交通環節 (即將從當前景點前往下一個景點或目的地)，則加上交通時間
      // 這裡假設 transports 陣列的索引與 spots 陣列的索引對應，
      // 即 transports[i] 是從 spots[i] 到 spots[i+1] (或最終目的地) 的交通。
      if (i < optimized.transports.length) {
        const transport = optimized.transports[i];
        const timeInfo = this.calculateTransportTime(transport);
        currentTime += timeInfo.totalTime;
      }
    }

    // 餐食時間自動調整：根據行程推進的時間點，自動插入餐食到合理的時段
    this.autoScheduleMeals(optimized, currentTime);

    return optimized;
  }

  /**
   * 自動調整餐食時間安排。
   * 檢查已有的餐食類型，若缺少午餐或晚餐且行程時間涵蓋該餐期，
   * 則在適當的時間點自動插入一筆餐食。早餐通常在出發前已完成，不自動插入。
   *
   * @param dayItinerary 待調整的日程（會直接修改此物件）。
   * @param itineraryEndTimeMinutes 行程結束時的累計分鐘數（從午夜起算）。
   */
  private autoScheduleMeals(dayItinerary: DayItinerary, itineraryEndTimeMinutes: number): void {
    const existingMealTypes = new Set(dayItinerary.meals.map(m => m.type));

    // 午餐：行程是否跨越午餐時段
    if (
      !existingMealTypes.has('lunch') &&
      DEFAULT_ITINERARY_START_TIME_MINUTES < LUNCH_END_TIME_MINUTES &&
      itineraryEndTimeMinutes > LUNCH_START_TIME_MINUTES
    ) {
      // 尋找最佳午餐時間：在午餐時段內，找到離景點間隔最近的空檔
      const lunchTime = this.findBestMealSlot(
        dayItinerary,
        LUNCH_START_TIME_MINUTES,
        LUNCH_END_TIME_MINUTES,
        12 * MINUTES_PER_HOUR // 預設 12:00
      );
      dayItinerary.meals.push({
        id: `auto_lunch_${Date.now()}`,
        type: 'lunch',
        time: this.minutesToTimeString(lunchTime),
        location: '行程安排中的餐廳',
        notes: '系統自動排程',
      });
    }

    // 晚餐：行程是否跨越晚餐時段
    if (
      !existingMealTypes.has('dinner') &&
      itineraryEndTimeMinutes > DINNER_START_TIME_MINUTES
    ) {
      const dinnerTime = this.findBestMealSlot(
        dayItinerary,
        DINNER_START_TIME_MINUTES,
        DINNER_END_TIME_MINUTES,
        18 * MINUTES_PER_HOUR // 預設 18:00
      );
      dayItinerary.meals.push({
        id: `auto_dinner_${Date.now()}`,
        type: 'dinner',
        time: this.minutesToTimeString(dinnerTime),
        location: '行程安排中的餐廳',
        notes: '系統自動排程',
      });
    }

    // 按時間排序餐食
    dayItinerary.meals.sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * 在指定的餐期時段內，尋找最適合插入餐食的時間點。
   * 優先選擇景點之間的空檔時間。
   *
   * @param dayItinerary 日程安排。
   * @param periodStart 餐期開始（分鐘）。
   * @param periodEnd 餐期結束（分鐘）。
   * @param defaultTime 若無法找到空檔，則使用的預設時間（分鐘）。
   * @returns 最佳餐食時間（分鐘）。
   */
  private findBestMealSlot(
    dayItinerary: DayItinerary,
    periodStart: number,
    periodEnd: number,
    defaultTime: number
  ): number {
    // 蒐集所有景點的結束時間（景點開始時間 + 停留時間），作為可能的餐食插入點
    const spotEndTimes: number[] = [];
    for (const spot of dayItinerary.spots) {
      const [h, m] = spot.time.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;
      const spotStart = h * MINUTES_PER_HOUR + m;
      const spotEnd = spotStart + (spot.duration || DEFAULT_SPOT_DURATION_MINUTES);
      // 若景點結束時間落在餐期範圍內，則為理想的餐食開始時間
      if (spotEnd >= periodStart && spotEnd <= periodEnd) {
        spotEndTimes.push(spotEnd);
      }
    }

    if (spotEndTimes.length > 0) {
      // 取最接近餐期中間點的景點結束時間
      const mid = (periodStart + periodEnd) / 2;
      spotEndTimes.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
      return spotEndTimes[0];
    }

    // 無合適空檔時，使用預設時間（確保在餐期範圍內）
    return Math.max(periodStart, Math.min(defaultTime, periodEnd));
  }

  /**
   * 將分鐘數轉換為 HH:mm 格式的時間字串。
   * @param minutes 從午夜起算的分鐘數。
   * @returns HH:mm 格式的字串。
   */
  private minutesToTimeString(minutes: number): string {
    const h = Math.floor(minutes / MINUTES_PER_HOUR);
    const m = minutes % MINUTES_PER_HOUR;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  /**
   * 取得服務支援的所有地點列表。
   * @returns 所有地點物件的陣列。
   */
  getSupportedLocations(): Location[] {
    return Object.values(this.locationData);
  }

  /**
   * 根據查詢字串搜尋地點。
   * 搜尋是基於地點名稱進行不區分大小寫的模糊匹配。
   * @param query 搜尋關鍵字。
   * @returns 匹配到的地點物件陣列。
   */
  searchLocations(query: string): Location[] {
    const results: Location[] = [];
    const lowerQuery = query.toLowerCase();

    Object.values(this.locationData).forEach(location => {
      if (location.name.toLowerCase().includes(lowerQuery)) {
        results.push(location);
      }
    });

    return results;
  }
}

// 建立預設實例，使用預設配置。
// 這允許在不傳遞任何選項的情況下，直接使用服務。
export const transportTimeService = new TransportTimeService();

// 導出類別本身，以便在需要自定義配置時可以實例化。
export default TransportTimeService;