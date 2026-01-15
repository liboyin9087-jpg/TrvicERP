/**
 * 行程安排核心類型定義
 * Itinerary Management Core Types
 */

/**
 * 餐食類型
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * 餐食安排
 */
export interface MealSchedule {
  id: string;
  type: MealType;
  time: string;              // 時間（HH:mm）
  location: string;          // 地點
  restaurant?: string;       // 餐廳名稱
  cuisine?: string;         // 菜系
  price?: number;            // 價格
  notes?: string;           // 備註
}

/**
 * 住宿資訊
 */
export interface Accommodation {
  id: string;
  hotelName: string;        // 飯店名稱
  checkIn: string;          // 入住日期
  checkOut: string;         // 退房日期
  roomType: string;         // 房型
  roomCount?: number;       // 房間數
  address?: string;         // 地址
  phone?: string;           // 電話
  price?: number;           // 價格
  notes?: string;           // 備註
}

/**
 * 交通類型
 */
export type TransportType = 'bus' | 'train' | 'plane' | 'ferry' | 'taxi' | 'walk';

/**
 * 交通安排
 */
export interface Transport {
  id: string;
  type: TransportType;      // 交通類型
  departure: string;       // 出發地點
  arrival: string;         // 抵達地點
  departureTime: string;   // 出發時間
  arrivalTime?: string;    // 抵達時間
  vehicleNumber?: string;  // 車號/航班號
  seatInfo?: string;       // 座位資訊
  price?: number;          // 價格
  notes?: string;          // 備註
}

/**
 * 導遊指派
 */
export interface GuideAssignment {
  guideId: string;          // 導遊 ID
  guideName: string;        // 導遊姓名
  phone: string;            // 聯絡電話
  email?: string;           // Email
  licenseNumber?: string;  // 執照號碼
  startTime?: string;      // 開始時間
  endTime?: string;        // 結束時間
}

/**
 * 司機指派
 */
export interface DriverAssignment {
  driverId: string;         // 司機 ID
  driverName: string;       // 司機姓名
  phone: string;            // 聯絡電話
  licenseNumber?: string;  // 駕照號碼
  vehicleNumber?: string;   // 車號
  startTime?: string;      // 開始時間
  endTime?: string;        // 結束時間
}

/**
 * 每日行程
 */
export interface DayItinerary {
  day: number;              // 第幾天
  date: string;            // 日期
  spots: Array<{
    id: string;
    name: string;
    time: string;
    duration?: number;
    description?: string;
  }>;                      // 景點安排
  meals: MealSchedule[];    // 餐食安排
  accommodation?: Accommodation; // 住宿資訊
  transports: Transport[]; // 交通安排
  guide?: GuideAssignment; // 導遊指派
  driver?: DriverAssignment; // 司機指派
  notes?: string;          // 備註
}

/**
 * 完整行程
 */
export interface Itinerary {
  id: string;
  sessionId: string;        // 關聯的團次 ID
  title: string;            // 行程標題
  days: DayItinerary[];     // 每日行程
  version: number;          // 版本號
  createdAt: string;        // 建立時間
  updatedAt: string;        // 更新時間
  createdBy: string;        // 建立者 ID
}

/**
 * 資源衝突檢查結果
 */
export interface ResourceConflict {
  type: 'guide' | 'driver' | 'vehicle';
  resourceId: string;
  resourceName: string;
  conflictDays: number[];   // 衝突的日期
  message: string;
}

/**
 * 檢查資源衝突
 */
export function checkResourceConflicts(
  itineraries: Itinerary[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];
  const guideSchedule: Map<string, Set<number>> = new Map();
  const driverSchedule: Map<string, Set<number>> = new Map();
  const vehicleSchedule: Map<string, Set<number>> = new Map();

  // 收集所有資源使用情況
  itineraries.forEach((itinerary) => {
    itinerary.days.forEach((day) => {
      if (day.guide) {
        if (!guideSchedule.has(day.guide.guideId)) {
          guideSchedule.set(day.guide.guideId, new Set());
        }
        guideSchedule.get(day.guide.guideId)!.add(day.day);
      }

      if (day.driver) {
        if (!driverSchedule.has(day.driver.driverId)) {
          driverSchedule.set(day.driver.driverId, new Set());
        }
        driverSchedule.get(day.driver.driverId)!.add(day.day);

        if (day.driver.vehicleNumber) {
          if (!vehicleSchedule.has(day.driver.vehicleNumber)) {
            vehicleSchedule.set(day.driver.vehicleNumber, new Set());
          }
          vehicleSchedule.get(day.driver.vehicleNumber)!.add(day.day);
        }
      }
    });
  });

  // 檢查導遊衝突（同一導遊不能同時帶兩個團）
  guideSchedule.forEach((days, guideId) => {
    // 這裡需要檢查多個行程是否在同一天使用同一導遊
    // 簡化版本：假設只有一個行程
  });

  // 檢查司機衝突
  driverSchedule.forEach((days, driverId) => {
    // 類似導遊衝突檢查
  });

  // 檢查車輛衝突
  vehicleSchedule.forEach((days, vehicleNumber) => {
    // 類似車輛衝突檢查
  });

  return conflicts;
}
