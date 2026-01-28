/**
 * 行程安排核心類型定義
 * Itinerary Management Core Types
 *
 * 為了提升可維護性，此檔案的介面設計已朝向模組化方向調整，
 * 若檔案持續增長，可考慮將以下邏輯區塊拆分成獨立檔案，例如：
 * - `itinerary/common.ts` (MealType, TransportType, Identifiable)
 * - `itinerary/meal.ts` (MealSchedule)
 * - `itinerary/accommodation.ts` (Accommodation)
 * - `itinerary/transport.ts` (Transport)
 * - `itinerary/assignment.ts` (GuideAssignment, DriverAssignment)
 * - `itinerary/day-itinerary.ts` (DayItinerary)
 * - `itinerary/itinerary.ts` (Itinerary)
 * - `itinerary/resource-conflict.ts` (ResourceConflict, checkResourceConflicts)
 *
 * 目前版本將所有相關類型與功能集中在此單一檔案中，但結構已優化以利未來拆分。
 */

/**
 * 基礎可識別介面
 * 許多實體都有一個唯一的 ID
 */
export interface Identifiable {
  id: string;
}

/**
 * 餐食類型
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

/**
 * 餐食安排
 */
export interface MealSchedule extends Identifiable {
  type: MealType;
  time: string;              // 時間（HH:mm）
  location: string;          // 地點
  restaurant?: string;       // 餐廳名稱
  cuisine?: string;          // 菜系
  price?: number;            // 價格
  notes?: string;            // 備註
}

/**
 * 住宿資訊
 */
export interface Accommodation extends Identifiable {
  hotelName: string;        // 飯店名稱
  checkIn: string;          // 入住日期 (YYYY-MM-DD)
  checkOut: string;         // 退房日期 (YYYY-MM-DD)
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
export interface Transport extends Identifiable {
  type: TransportType;      // 交通類型
  departure: string;        // 出發地點
  arrival: string;          // 抵達地點
  departureTime: string;    // 出發時間 (HH:mm)
  arrivalTime?: string;     // 抵達時間 (HH:mm)
  vehicleNumber?: string;   // 車號/航班號
  seatInfo?: string;        // 座位資訊
  price?: number;           // 價格
  notes?: string;           // 備註
}

/**
 * 導遊指派
 */
export interface GuideAssignment {
  guideId: string;          // 導遊 ID
  guideName: string;        // 導遊姓名
  phone: string;            // 聯絡電話
  email?: string;           // Email
  licenseNumber?: string;   // 執照號碼
  startTime?: string;       // 服務開始時間 (HH:mm)
  endTime?: string;         // 服務結束時間 (HH:mm)
}

/**
 * 司機指派
 */
export interface DriverAssignment {
  driverId: string;         // 司機 ID
  driverName: string;       // 司機姓名
  phone: string;            // 聯絡電話
  licenseNumber?: string;   // 駕照號碼
  vehicleNumber?: string;   // 車號
  startTime?: string;       // 服務開始時間 (HH:mm)
  endTime?: string;         // 服務結束時間 (HH:mm)
}

/**
 * 每日行程中的景點安排
 */
export interface DaySpot extends Identifiable {
  name: string;
  time: string;           // 景點活動開始時間 (HH:mm)
  duration?: number;      // 持續時間 (分鐘)
  description?: string;
}

/**
 * 每日行程
 */
export interface DayItinerary {
  day: number;              // 第幾天
  date: string;             // 日期 (YYYY-MM-DD)
  spots: DaySpot[];         // 景點安排
  meals: MealSchedule[];    // 餐食安排
  accommodation?: Accommodation; // 住宿資訊
  transports: Transport[];  // 交通安排
  guide?: GuideAssignment;   // 導遊指派
  driver?: DriverAssignment; // 司機指派
  notes?: string;            // 備註
}

/**
 * 完整行程
 */
export interface Itinerary extends Identifiable {
  sessionId: string;        // 關聯的團次 ID
  title: string;            // 行程標題
  days: DayItinerary[];     // 每日行程
  version: number;          // 版本號
  createdAt: string;        // 建立時間 (ISO 8601 string)
  updatedAt: string;        // 更新時間 (ISO 8601 string)
  createdBy: string;        // 建立者 ID
}

/**
 * 資源衝突檢查結果
 */
export interface ResourceConflict {
  type: 'guide' | 'driver' | 'vehicle';
  resourceId: string;
  resourceName: string;
  conflictDays: number[];   // 衝突的日期 (行程中的第幾天)
  message: string;
}

/**
 * 檢查資源衝突
 * 偵測多個行程在同一天共用同一導遊、司機或車輛的情況。
 * @param itineraries 待檢查的所有行程列表
 * @returns 資源衝突列表
 */
export function checkResourceConflicts(
  itineraries: Itinerary[]
): ResourceConflict[] {
  const conflicts: ResourceConflict[] = [];

  // Tracks resourceId -> dayNumber -> Set<itineraryId>
  const guideSchedule: Map<string, Map<number, Set<string>>> = new Map();
  const driverSchedule: Map<string, Map<number, Set<string>>> = new Map();
  const vehicleSchedule: Map<string, Map<number, Set<string>>> = new Map();

  // Helper to add assignment to a schedule map
  const addAssignment = (
    schedule: Map<string, Map<number, Set<string>>>,
    resourceId: string,
    dayNumber: number,
    itineraryId: string
  ) => {
    if (!schedule.has(resourceId)) {
      schedule.set(resourceId, new Map());
    }
    const dayMap = schedule.get(resourceId)!;
    if (!dayMap.has(dayNumber)) {
      dayMap.set(dayNumber, new Set());
    }
    dayMap.get(dayNumber)!.add(itineraryId);
  };

  // Collect all resource usage and their names
  const resourceNames: Map<string, string> = new Map(); // resourceId -> resourceName
  itineraries.forEach((itinerary) => {
    itinerary.days.forEach((day) => {
      if (day.guide) {
        addAssignment(guideSchedule, day.guide.guideId, day.day, itinerary.id);
        resourceNames.set(day.guide.guideId, day.guide.guideName);
      }

      if (day.driver) {
        addAssignment(driverSchedule, day.driver.driverId, day.day, itinerary.id);
        resourceNames.set(day.driver.driverId, day.driver.driverName);

        if (day.driver.vehicleNumber) {
          addAssignment(vehicleSchedule, day.driver.vehicleNumber, day.day, itinerary.id);
          resourceNames.set(day.driver.vehicleNumber, day.driver.vehicleNumber); // Vehicle number is its own name
        }
      }
    });
  });

  const getResourceNameById = (id: string) => resourceNames.get(id) || id;

  // Check for conflicts and populate the conflicts array
  const processSchedule = (
    schedule: Map<string, Map<number, Set<string>>>,
    type: 'guide' | 'driver' | 'vehicle'
  ) => {
    schedule.forEach((dayMap, resourceId) => {
      dayMap.forEach((itineraryIds, dayNumber) => {
        if (itineraryIds.size > 1) { // Conflict detected
          const resourceName = getResourceNameById(resourceId);
          conflicts.push({
            type,
            resourceId,
            resourceName,
            conflictDays: [dayNumber], // Initially add this specific conflicting day
            message: `Resource '${resourceName}' (${type}) is assigned to multiple itineraries on day ${dayNumber}.`,
          });
        }
      });
    });
  };

  processSchedule(guideSchedule, 'guide');
  processSchedule(driverSchedule, 'driver');
  processSchedule(vehicleSchedule, 'vehicle');

  // Group conflicting days for the same resource into a single ResourceConflict entry
  const groupedConflicts: Map<string, ResourceConflict> = new Map(); // Key: `${type}-${resourceId}`

  for (const conflict of conflicts) {
    const key = `${conflict.type}-${conflict.resourceId}`;
    if (!groupedConflicts.has(key)) {
      groupedConflicts.set(key, { ...conflict, conflictDays: [] });
    }
    groupedConflicts.get(key)!.conflictDays.push(...conflict.conflictDays);
  }

  // Finalize messages and sort conflict days
  const finalConflicts: ResourceConflict[] = Array.from(groupedConflicts.values()).map(gc => {
    const sortedDays = [...new Set(gc.conflictDays)].sort((a, b) => a - b); // Remove duplicates and sort
    return {
      ...gc,
      conflictDays: sortedDays,
      message: `Resource '${gc.resourceName}' (${gc.type}) is assigned to multiple itineraries on days: ${sortedDays.join(', ')}.`,
    };
  });

  return finalConflicts;
}