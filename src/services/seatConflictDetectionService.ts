import type { Session, Customer } from '../core/types'; // 假設這些類型存在

/**
 * Logger Interface for dependency injection
 */
interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug?(message: string, ...args: any[]): void;
}

/**
 * Console Logger implementation
 */
class ConsoleLogger implements Logger {
  info(message: string, ...args: any[]): void {
    console.info(`[INFO] ${message}`, ...args);
  }
  warn(message: string, ...args: any[]): void {
    console.warn(`[WARN] ${message}`, ...args);
  }
  error(message: string, ...args: any[]): void {
    console.error(`[ERROR] ${message}`, ...args);
  }
  debug(message: string, ...args: any[]): void {
    console.debug(`[DEBUG] ${message}`, ...args);
  }
}

// Global logger instance for convenience, but can be injected
const defaultLogger: Logger = new ConsoleLogger();

/**
 * 座位配置
 */
export interface SeatConfiguration {
  vehicleId: string;
  vehicleType: 'bus' | 'train' | 'plane' | 'minibus';
  totalSeats: number;
  seatLayout: {
    rows: number;
    seatsPerRow: number;
    seatMap: string[][]; // 'available', 'occupied', 'reserved', 'blocked'
  };
}

/**
 * 座位分配記錄
 */
export interface SeatAllocation {
  id: string;
  sessionId: string;
  customerId: string;
  vehicleId: string;
  seatNumber: string; // e.g., "A1", "B2"
  seatType: 'regular' | 'premium' | 'wheelchair' | 'infant';
  allocationDate: string;
  allocatedBy: string;
  status: 'confirmed' | 'reserved' | 'cancelled' | 'transferred';
  transferHistory?: Array<{
    fromSeat: string;
    toSeat: string;
    transferDate: string;
    reason: string;
  }>;
}

/**
 * 衝突檢測結果
 */
export interface ConflictResult {
  hasConflict: boolean;
  conflicts: SeatConflict[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

/**
 * 座位衝突類型
 */
export interface SeatConflict {
  type: 'double_booking' | 'overbooking' | 'invalid_seat' | 'capacity_exceeded' | 'timing_conflict';
  vehicleId: string;
  seatNumber?: string;
  customerIds: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution: string;
}

/**
 * 車輛座位配置資料 (作為外部資料來源，由服務接收)
 */
const VEHICLE_CONFIGURATIONS_DATA: Record<string, SeatConfiguration> = {
  // 大型遊覽車
  'BUS-001': {
    vehicleId: 'BUS-001',
    vehicleType: 'bus',
    totalSeats: 45,
    seatLayout: {
      rows: 11,
      seatsPerRow: 4,
      seatMap: Array(11).fill(null).map(() => Array(4).fill('available'))
    }
  },
  'BUS-002': {
    vehicleId: 'BUS-002',
    vehicleType: 'bus',
    totalSeats: 45,
    seatLayout: {
      rows: 11,
      seatsPerRow: 4,
      seatMap: Array(11).fill(null).map(() => Array(4).fill('available'))
    }
  },
  
  // 中型巴士
  'MINIBUS-001': {
    vehicleId: 'MINIBUS-001',
    vehicleType: 'minibus',
    totalSeats: 25,
    seatLayout: {
      rows: 7,
      seatsPerRow: 4,
      seatMap: Array(7).fill(null).map(() => Array(4).fill('available'))
    }
  },
  
  // 高鐵車廂（模擬）
  'HSR-001': {
    vehicleId: 'HSR-001',
    vehicleType: 'train',
    totalSeats: 60,
    seatLayout: {
      rows: 15,
      seatsPerRow: 4,
      seatMap: Array(15).fill(null).map(() => Array(4).fill('available'))
    }
  }
};

/**
 * 助手函數：解析座位號碼 (e.g., "A1" -> [0, 0])
 */
function parseSeatNumber(seatNumber: string): [number, number] {
  if (!seatNumber || seatNumber.length < 2) {
    return [-1, -1]; // Invalid format
  }
  const rowChar = seatNumber.charAt(0).toUpperCase();
  const colNumStr = seatNumber.substring(1);
  const colNum = parseInt(colNumStr, 10) - 1; // Seats usually 1-indexed for column
  const row = rowChar.charCodeAt(0) - 'A'.charCodeAt(0);
  return [row, colNum];
}

/**
 * 助手函數：檢查座位號碼是否有效
 */
function isValidSeatNumber(seatNumber: string, config: SeatConfiguration): boolean {
  const [row, col] = parseSeatNumber(seatNumber);
  return row >= 0 && row < config.seatLayout.rows && 
         col >= 0 && col < config.seatLayout.seatsPerRow;
}


/**
 * 座位衝突檢測器服務
 * 專注於檢測衝突，不管理分配狀態或車輛配置，而是通過參數接收數據。
 * 這符合單一職責原則。
 */
export class SeatConflictDetector {
  private readonly logger: Logger;

  constructor(logger: Logger = defaultLogger) {
    this.logger = logger;
    this.logger.debug('SeatConflictDetector initialized.');
  }

  /**
   * 檢查單一座位分配操作的衝突
   * @param vehicleId 車輛ID
   * @param seatNumber 待分配的座位號碼
   * @param currentAllocations 該車輛當前所有已確認的分配記錄
   * @param vehicleConfig 車輛配置
   * @param excludeAllocationId 排除此分配ID的檢查 (用於轉移座位時，排除舊座位記錄)
   * @returns 衝突列表
   */
  checkSeatConflict(
    vehicleId: string, 
    seatNumber: string, 
    currentAllocations: SeatAllocation[],
    vehicleConfig: SeatConfiguration,
    excludeAllocationId?: string
  ): SeatConflict[] {
    const conflicts: SeatConflict[] = [];

    // 檢查座位號碼是否有效
    if (!isValidSeatNumber(seatNumber, vehicleConfig)) {
      this.logger.warn(`Invalid seat number: ${seatNumber} for vehicle ${vehicleId}.`);
      conflicts.push({
        type: 'invalid_seat',
        vehicleId,
        seatNumber,
        customerIds: [],
        description: `座位號碼 ${seatNumber} 無效，不在車輛 ${vehicleId} 的佈局範圍內`,
        severity: 'high',
        suggestedResolution: '請選擇有效的座位號碼'
      });
    }

    // 檢查是否已被分配
    const conflictingAllocation = currentAllocations.find(alloc => 
      alloc.seatNumber === seatNumber && 
      alloc.status === 'confirmed' &&
      alloc.id !== excludeAllocationId
    );

    if (conflictingAllocation) {
      this.logger.warn(`Seat ${seatNumber} on vehicle ${vehicleId} is already confirmed by ${conflictingAllocation.customerId}.`);
      conflicts.push({
        type: 'double_booking',
        vehicleId,
        seatNumber,
        customerIds: [conflictingAllocation.customerId],
        description: `座位 ${seatNumber} 已被分配給客戶 ${conflictingAllocation.customerId}`,
        severity: 'critical',
        suggestedResolution: '請選擇其他座位或與客戶協調座位變更'
      });
    }

    // 檢查車輛容量 (預檢，檢查分配後是否會超載)
    const confirmedAllocationsCount = currentAllocations.filter(alloc => 
      alloc.status === 'confirmed' && alloc.id !== excludeAllocationId
    ).length;
    
    // 如果嘗試分配的座位會導致超載，則報告
    // 注意：這個檢查是基於 *當前已確認* 的分配數，加上一個即將分配的座位。
    // 如果分配前已滿，則表示該車輛容量已達上限。
    if (confirmedAllocationsCount >= vehicleConfig.totalSeats) {
        this.logger.warn(`Vehicle ${vehicleId} is at or exceeding capacity. Current confirmed: ${confirmedAllocationsCount}, Total capacity: ${vehicleConfig.totalSeats}.`);
        conflicts.push({
            type: 'capacity_exceeded',
            vehicleId,
            customerIds: currentAllocations.map(alloc => alloc.customerId),
            description: `車輛 ${vehicleId} 已達最大容量 (${vehicleConfig.totalSeats} 個座位) 或將超載`,
            severity: 'high',
            suggestedResolution: '請分配其他車輛或增加車輛容量'
        });
    }

    this.logger.debug(`Found ${conflicts.length} conflicts for vehicle ${vehicleId}, seat ${seatNumber}.`);
    return conflicts;
  }

  /**
   * 檢查團次 (Session) 的座位衝突
   * @param allSessionAllocations 該團次所有分配記錄
   * @param vehicleConfigs 所有車輛配置 (Map 形式)
   * @returns 衝突檢測結果
   */
  checkSessionSeatConflicts(
    allSessionAllocations: SeatAllocation[], 
    vehicleConfigs: Map<string, SeatConfiguration>
  ): ConflictResult {
    const conflicts: SeatConflict[] = [];
    const vehicleUsage: Map<string, number> = new Map(); // vehicleId -> count of confirmed seats

    // 統計各車輛使用情況
    allSessionAllocations.forEach(allocation => {
      if (allocation.status === 'confirmed') {
        vehicleUsage.set(
          allocation.vehicleId, 
          (vehicleUsage.get(allocation.vehicleId) || 0) + 1
        );
      }
    });

    // 檢查車輛超載 (overbooking)
    vehicleUsage.forEach((allocatedCount, vehicleId) => {
      const config = vehicleConfigs.get(vehicleId);
      if (!config) {
        this.logger.error(`Invalid vehicle ID found during session conflict check: ${vehicleId}.`);
        conflicts.push({
            type: 'invalid_seat', // Use invalid_seat for invalid vehicle ID itself
            vehicleId,
            customerIds: allSessionAllocations
                .filter(alloc => alloc.vehicleId === vehicleId && alloc.status === 'confirmed')
                .map(alloc => alloc.customerId),
            description: `車輛 ${vehicleId} 配置不存在，無法進行容量檢查`,
            severity: 'critical',
            suggestedResolution: '請檢查車輛配置資料的完整性'
        });
        return;
      }
      if (allocatedCount > config.totalSeats) {
        this.logger.warn(`Vehicle ${vehicleId} is overbooked: ${allocatedCount} seats allocated, capacity ${config.totalSeats}.`);
        conflicts.push({
          type: 'overbooking',
          vehicleId,
          customerIds: allSessionAllocations
            .filter(alloc => alloc.vehicleId === vehicleId && alloc.status === 'confirmed')
            .map(alloc => alloc.customerId),
          description: `車輛 ${vehicleId} 超載：已分配 ${allocatedCount} 個座位，容量 ${config.totalSeats}`,
          severity: 'critical',
          suggestedResolution: '立即重新分配座位或增加車輛'
        });
      }
    });

    // 檢查重複座位分配 (double_booking within the same session)
    const seatUsage: Map<string, SeatAllocation[]> = new Map(); // key: vehicleId-seatNumber
    allSessionAllocations.forEach(allocation => {
      if (allocation.status === 'confirmed') {
        const key = `${allocation.vehicleId}-${allocation.seatNumber}`;
        if (!seatUsage.has(key)) {
          seatUsage.set(key, []);
        }
        seatUsage.get(key)!.push(allocation);
      }
    });

    seatUsage.forEach((allocations, seatKey) => {
      if (allocations.length > 1) {
        const [vehicleId, seatNumber] = seatKey.split('-');
        this.logger.warn(`Seat ${seatNumber} (vehicle ${vehicleId}) double booked in the same session.`);
        conflicts.push({
          type: 'double_booking',
          vehicleId,
          seatNumber,
          customerIds: allocations.map(alloc => alloc.customerId),
          description: `座位 ${seatNumber} (車輛 ${vehicleId}) 重複分配給多個客戶`,
          severity: 'critical',
          suggestedResolution: '立即重新分配座位，確保每個座位只分配給一個客戶'
        });
      }
    });

    // 檢查無效座位號碼 (根據配置)
    allSessionAllocations.forEach(allocation => {
        const config = vehicleConfigs.get(allocation.vehicleId);
        if (config && !isValidSeatNumber(allocation.seatNumber, config)) {
            this.logger.warn(`Invalid seat number ${allocation.seatNumber} for vehicle ${allocation.vehicleId} found in session.`);
            conflicts.push({
                type: 'invalid_seat',
                vehicleId: allocation.vehicleId,
                seatNumber: allocation.seatNumber,
                customerIds: [allocation.customerId],
                description: `座位號碼 ${allocation.seatNumber} 在車輛 ${allocation.vehicleId} 配置中無效`,
                severity: 'high',
                suggestedResolution: '請修正座位號碼或車輛配置'
            });
        }
    });

    // 計算嚴重程度
    const severity = this.calculateConflictSeverity(conflicts);
    const recommendations = this.generateRecommendations(conflicts);

    this.logger.info(`Session conflict check completed. Conflicts found: ${conflicts.length}, Severity: ${severity}.`);
    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      severity,
      recommendations
    };
  }

  private calculateConflictSeverity(conflicts: SeatConflict[]): 'low' | 'medium' | 'high' | 'critical' {
    if (conflicts.length === 0) return 'low';
    
    const hasCritical = conflicts.some(c => c.severity === 'critical');
    const hasHigh = conflicts.some(c => c.severity === 'high');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (conflicts.length > 3) return 'medium'; // Heuristic for medium
    return 'low';
  }

  private generateRecommendations(conflicts: SeatConflict[]): string[] {
    const uniqueRecommendations = new Set<string>();

    for (const c of conflicts) {
        switch (c.type) {
            case 'overbooking':
                uniqueRecommendations.add('建議增加車輛或重新分配部分客戶到其他車輛以解決超載問題。');
                break;
            case 'double_booking':
                uniqueRecommendations.add('立即解決重複座位分配，確保每個客戶都有唯一座位。');
                break;
            case 'capacity_exceeded':
                uniqueRecommendations.add('檢查車輛容量配置，考慮使用更大容量的車輛或限制分配。');
                break;
            case 'invalid_seat':
                uniqueRecommendations.add('檢查座位號碼格式和車輛配置的一致性，確保座位號碼有效。');
                break;
            case 'timing_conflict':
                uniqueRecommendations.add('檢查團次或車輛行程時間是否有重疊導致的衝突。');
                break;
            default:
                uniqueRecommendations.add('根據具體衝突類型，考慮重新分配或調整車輛配置。');
                break;
        }
    }
    
    return Array.from(uniqueRecommendations);
  }
}

/**
 * 服務的配置介面
 * [architect] [架構] 缺少明確的 Config Props 介面定義 (已修復)
 */
export interface SeatAllocationManagerConfig {
  vehicleConfigurations: Record<string, SeatConfiguration>;
  logger?: Logger;
  // 可以注入其他依賴，例如一個 ID 生成器
  // idGenerator?: () => string;
}

/**
 * 座位分配管理服務
 * 負責座位分配、轉移、取消以及報告生成。
 * 它內部使用 `SeatConflictDetector` 處理衝突檢測，遵循單一職責原則。
 */
export class SeatAllocationManager {
  // 內部狀態：車輛配置 (初始化時深拷貝，後續更新也進行不可變處理)
  private vehicleConfigs: Map<string, SeatConfiguration>;
  // 內部狀態：座位分配記錄 (key: sessionId, value: allocations for that session)
  private seatAllocations: Map<string, SeatAllocation[]> = new Map();

  private readonly conflictDetector: SeatConflictDetector;
  private readonly logger: Logger;

  /**
   * 服務初始化
   * [designer] [設計] 初始化邏輯直接在建構子中執行 (已修復，現在接受配置並進行合理的初始化)
   * [architect] [架構] 使用全域常數 VEHICLE_CONFIGURATIONS 作為資料來源，應改為透過 Props 或依賴注入傳入 (已修復)
   */
  constructor(config: SeatAllocationManagerConfig) {
    this.logger = config.logger || defaultLogger;
    this.vehicleConfigs = new Map();
    
    // 初始化車輛配置時進行深拷貝，確保原始配置數據不會被服務直接修改
    Object.values(config.vehicleConfigurations).forEach(cfg => {
      const clonedSeatMap = cfg.seatLayout.seatMap.map(row => [...row]); // 深拷貝 seatMap
      this.vehicleConfigs.set(cfg.vehicleId, {
        ...cfg,
        seatLayout: {
          ...cfg.seatLayout,
          seatMap: clonedSeatMap
        }
      });
    });

    this.conflictDetector = new SeatConflictDetector(this.logger);
    this.logger.info('SeatAllocationManager initialized with provided configurations.');
  }

  /**
   * 分配座位
   * [architect] [架構] 服務類別同時負責座位分配與衝突檢測 (已部分解決，衝突檢測現在由 `SeatConflictDetector` 代理)
   * [architect] [架構] 直接操作 seatMap 陣列而無不可變(immutable)處理 (已修復)
   */
  allocateSeat(allocationInput: Omit<SeatAllocation, 'id' | 'status' | 'allocationDate'>): {
    success: boolean;
    conflict?: SeatConflict;
    allocationId?: string;
  } {
    const { vehicleId, seatNumber, sessionId } = allocationInput;
    this.logger.info(`Attempting to allocate seat ${seatNumber} on vehicle ${vehicleId} for session ${sessionId}.`);

    const vehicleConfig = this.vehicleConfigs.get(vehicleId);
    if (!vehicleConfig) {
      this.logger.error(`Allocation failed: Vehicle configuration not found for ${vehicleId}.`);
      return {
        success: false,
        conflict: {
          type: 'invalid_seat',
          vehicleId,
          customerIds: [allocationInput.customerId],
          description: `車輛 ${vehicleId} 配置不存在，無法分配座位`,
          severity: 'critical',
          suggestedResolution: '請檢查車輛配置或選擇有效車輛'
        }
      };
    }

    // 獲取該車輛當前所有已確認的分配記錄，用於衝突檢測
    const currentAllocationsForVehicle = this.getAllocationsByVehicle(vehicleId).filter(a => a.status === 'confirmed');
    const conflicts = this.conflictDetector.checkSeatConflict(
      vehicleId, 
      seatNumber, 
      currentAllocationsForVehicle, 
      vehicleConfig
    );
    
    if (conflicts.length > 0) {
      this.logger.warn(`Allocation conflict detected for seat ${seatNumber} on vehicle ${vehicleId}: ${conflicts[0].description}`);
      return {
        success: false,
        conflict: conflicts[0]
      };
    }

    const newAllocation: SeatAllocation = {
      ...allocationInput,
      id: this.generateAllocationId(),
      status: 'confirmed',
      allocationDate: new Date().toISOString() // 確保分配日期設置
    };

    // 儲存分配記錄 (對 Map 中的數組進行不可變更新)
    const sessionAllocations = this.seatAllocations.get(sessionId) || [];
    this.seatAllocations.set(sessionId, [...sessionAllocations, newAllocation]);
    
    this.logger.info(`Seat ${seatNumber} allocated successfully with ID ${newAllocation.id}.`);

    // 更新座位圖狀態 (不可變處理)
    this.updateVehicleSeatMapState(vehicleId, seatNumber, 'occupied');

    return {
      success: true,
      allocationId: newAllocation.id
    };
  }

  /**
   * 檢查座位衝突 (代理到 `SeatConflictDetector`)
   * 外部調用者可以直接使用此服務的此方法，服務內部會使用 `SeatConflictDetector`。
   */
  checkSeatConflict(
    vehicleId: string, 
    seatNumber: string, 
    sessionId: string,
    excludeAllocationId?: string
  ): SeatConflict[] {
    const vehicleConfig = this.vehicleConfigs.get(vehicleId);
    if (!vehicleConfig) {
      this.logger.warn(`Attempted conflict check for non-existent vehicle config: ${vehicleId}`);
      return [{
        type: 'invalid_seat',
        vehicleId,
        customerIds: [],
        description: `車輛 ${vehicleId} 配置不存在`,
        severity: 'critical',
        suggestedResolution: '請檢查車輛配置或選擇有效車輛'
      }];
    }
    const currentAllocationsForVehicle = this.getAllocationsByVehicle(vehicleId).filter(a => a.status === 'confirmed');
    return this.conflictDetector.checkSeatConflict(
      vehicleId, 
      seatNumber, 
      currentAllocationsForVehicle, 
      vehicleConfig, 
      excludeAllocationId
    );
  }

  /**
   * 檢查團次座位衝突 (代理到 `SeatConflictDetector`)
   */
  checkSessionSeatConflicts(sessionId: string): ConflictResult {
    this.logger.info(`Performing session seat conflict check for session ID: ${sessionId}.`);
    const sessionAllocations = this.seatAllocations.get(sessionId) || [];
    const result = this.conflictDetector.checkSessionSeatConflicts(sessionAllocations, this.vehicleConfigs);
    if (result.hasConflict) {
        this.logger.warn(`Session ${sessionId} has conflicts: ${result.conflicts.length} found, severity: ${result.severity}.`);
    } else {
        this.logger.info(`Session ${sessionId} has no conflicts.`);
    }
    return result;
  }

  /**
   * 轉移座位
   * [architect] [架構] 直接操作 seatMap 陣列而無不可變(immutable)處理 (已修復)
   */
  transferSeat(
    allocationId: string,
    newSeatNumber: string,
    reason: string
  ): {
    success: boolean;
    conflict?: SeatConflict;
    updatedAllocation?: SeatAllocation;
  } {
    this.logger.info(`Attempting to transfer allocation ${allocationId} to new seat ${newSeatNumber}.`);
    const allocation = this.findAllocation(allocationId);
    if (!allocation) {
      this.logger.warn(`Transfer failed: Allocation ${allocationId} not found.`);
      return {
        success: false,
        conflict: {
          type: 'invalid_seat',
          vehicleId: '', // Can't determine vehicleId without allocation
          customerIds: [],
          description: '找不到指定的座位分配記錄',
          severity: 'high',
          suggestedResolution: '請檢查分配ID是否正確'
        }
      };
    }

    const vehicleConfig = this.vehicleConfigs.get(allocation.vehicleId);
    if (!vehicleConfig) {
      this.logger.error(`Transfer failed: Vehicle configuration not found for ${allocation.vehicleId}.`);
      return {
        success: false,
        conflict: {
          type: 'invalid_seat',
          vehicleId: allocation.vehicleId,
          customerIds: [allocation.customerId],
          description: `車輛 ${allocation.vehicleId} 配置不存在，無法轉移座位`,
          severity: 'critical',
          suggestedResolution: '請檢查車輛配置或選擇有效車輛'
        }
      };
    }

    // 檢查新座位是否有衝突
    const currentAllocationsForVehicle = this.getAllocationsByVehicle(allocation.vehicleId).filter(a => a.status === 'confirmed');
    const conflicts = this.conflictDetector.checkSeatConflict(
      allocation.vehicleId, 
      newSeatNumber, 
      currentAllocationsForVehicle, 
      vehicleConfig,
      allocationId // 排除當前正在轉移的分配
    );

    if (conflicts.length > 0) {
      this.logger.warn(`Transfer conflict detected for new seat ${newSeatNumber}: ${conflicts[0].description}`);
      return {
        success: false,
        conflict: conflicts[0]
      };
    }

    // 更新舊座位狀態 (不可變)
    this.updateVehicleSeatMapState(allocation.vehicleId, allocation.seatNumber, 'available');

    // 創建新的分配記錄，替換舊的，以實現不可變性
    const sessionAllocations = this.seatAllocations.get(allocation.sessionId);
    if (sessionAllocations) {
        const allocationIndex = sessionAllocations.findIndex(alloc => alloc.id === allocationId);
        if (allocationIndex > -1) {
            const oldSeatNumber = allocation.seatNumber;
            const updatedAllocation: SeatAllocation = {
                ...allocation,
                seatNumber: newSeatNumber,
                transferHistory: [
                    ...(allocation.transferHistory || []),
                    {
                        fromSeat: oldSeatNumber,
                        toSeat: newSeatNumber,
                        transferDate: new Date().toISOString(),
                        reason
                    }
                ]
            };
            // 使用新數組替換舊數組，確保 Map 內的數據不可變
            this.seatAllocations.set(
                allocation.sessionId,
                [
                    ...sessionAllocations.slice(0, allocationIndex),
                    updatedAllocation,
                    ...sessionAllocations.slice(allocationIndex + 1)
                ]
            );
            this.logger.info(`Allocation ${allocationId} transferred from ${oldSeatNumber} to ${newSeatNumber}.`);

            // 更新新座位狀態 (不可變)
            this.updateVehicleSeatMapState(allocation.vehicleId, newSeatNumber, 'occupied');

            return {
                success: true,
                updatedAllocation: updatedAllocation
            };
        }
    }
    
    this.logger.error(`Failed to find and update allocation ${allocationId} in session map during transfer.`);
    return {
        success: false,
        conflict: {
            type: 'invalid_seat',
            vehicleId: allocation.vehicleId,
            customerIds: [allocation.customerId],
            description: '座位轉移失敗：內部狀態不一致，找不到原始分配',
            severity: 'critical',
            suggestedResolution: '請聯繫系統管理員'
        }
    };
  }

  /**
   * 取消座位分配
   * [architect] [架構] 直接操作 seatMap 陣列而無不可變(immutable)處理 (已修復)
   */
  cancelSeatAllocation(allocationId: string): {
    success: boolean;
    error?: string;
  } {
    this.logger.info(`Attempting to cancel allocation ${allocationId}.`);
    const allocation = this.findAllocation(allocationId);
    if (!allocation) {
      this.logger.warn(`Cancellation failed: Allocation ${allocationId} not found.`);
      return {
        success: false,
        error: '找不到指定的座位分配記錄'
      };
    }

    // 找到會話並以不可變方式更新分配
    const sessionAllocations = this.seatAllocations.get(allocation.sessionId);
    if (sessionAllocations) {
        const allocationIndex = sessionAllocations.findIndex(alloc => alloc.id === allocationId);
        if (allocationIndex > -1) {
            const updatedAllocation: SeatAllocation = {
                ...allocation,
                status: 'cancelled'
            };
            this.seatAllocations.set(
                allocation.sessionId,
                [
                    ...sessionAllocations.slice(0, allocationIndex),
                    updatedAllocation,
                    ...sessionAllocations.slice(allocationIndex + 1)
                ]
            );
            this.logger.info(`Allocation ${allocationId} cancelled successfully.`);
            this.updateVehicleSeatMapState(allocation.vehicleId, allocation.seatNumber, 'available');
            return { success: true };
        }
    }

    this.logger.error(`Failed to find and update allocation ${allocationId} in session map during cancellation.`);
    return { success: false, error: '取消失敗：內部狀態不一致，找不到原始分配' };
  }

  /**
   * 取得車輛座位圖
   */
  getVehicleSeatMap(vehicleId: string): {
    config: SeatConfiguration | null;
    currentAllocation: SeatAllocation[];
    seatStatus: string[][];
  } {
    this.logger.debug(`Retrieving seat map for vehicle ${vehicleId}.`);
    const config = this.vehicleConfigs.get(vehicleId);
    if (!config) {
      this.logger.warn(`Vehicle configuration not found for seat map retrieval: ${vehicleId}.`);
      return {
        config: null,
        currentAllocation: [],
        seatStatus: []
      };
    }

    // 返回一個深拷貝的配置和座位圖，防止外部修改內部狀態
    const clonedConfig: SeatConfiguration = { 
        ...config, 
        seatLayout: { 
            ...config.seatLayout, 
            seatMap: config.seatLayout.seatMap.map(row => [...row]) 
        } 
    };

    const allocations = this.getAllocationsByVehicle(vehicleId);

    // 根據當前實際的confirmed allocations重新繪製座位狀態，確保數據一致性
    const recomputedSeatStatus: string[][] = Array(config.seatLayout.rows).fill(null).map(() => Array(config.seatLayout.seatsPerRow).fill('available'));
    allocations.forEach(allocation => {
      if (allocation.status === 'confirmed') {
        const [row, col] = parseSeatNumber(allocation.seatNumber);
        if (row >= 0 && col >= 0 && recomputedSeatStatus[row] && recomputedSeatStatus[row][col] !== undefined) {
          recomputedSeatStatus[row][col] = 'occupied';
        }
      }
    });

    return {
      config: clonedConfig,
      currentAllocation: allocations,
      seatStatus: recomputedSeatStatus
    };
  }

  /**
   * 產生座位分配報告
   */
  generateSeatAllocationReport(sessionId: string): {
    summary: {
      totalCustomers: number;
      allocatedSeats: number;
      availableSeats: number;
      utilizationRate: number;
    };
    vehicleBreakdown: Array<{
      vehicleId: string;
      vehicleType: string;
      totalSeats: number;
      allocatedSeats: number;
      utilizationRate: number;
    }>;
    conflicts: SeatConflict[];
  } {
    this.logger.info(`Generating seat allocation report for session ID: ${sessionId}.`);
    const allocations = this.seatAllocations.get(sessionId) || [];
    const confirmedAllocations = allocations.filter(alloc => alloc.status === 'confirmed');
    
    // 使用 `SeatConflictDetector` 獲取衝突資訊
    const conflictResult = this.conflictDetector.checkSessionSeatConflicts(confirmedAllocations, this.vehicleConfigs);

    // 車輛使用統計
    const vehicleStats: Map<string, { allocated: number; type: string }> = new Map();
    confirmedAllocations.forEach(allocation => {
      const config = this.vehicleConfigs.get(allocation.vehicleId);
      if (config) {
        if (!vehicleStats.has(allocation.vehicleId)) {
          vehicleStats.set(allocation.vehicleId, { 
            allocated: 0, 
            type: config.vehicleType 
          });
        }
        vehicleStats.get(allocation.vehicleId)!.allocated++;
      }
    });

    const vehicleBreakdown = Array.from(vehicleStats.entries()).map(([vehicleId, stats]) => {
      const config = this.vehicleConfigs.get(vehicleId)!; // config 應該存在，因為它在 vehicleStats 中
      return {
        vehicleId,
        vehicleType: stats.type,
        totalSeats: config.totalSeats,
        allocatedSeats: stats.allocated,
        utilizationRate: config.totalSeats > 0 ? Math.round((stats.allocated / config.totalSeats) * 100) : 0
      };
    });

    // 計算總座位數：考慮所有被分配了座位的車輛
    const allActiveVehicleIdsInSession = new Set(confirmedAllocations.map(a => a.vehicleId));
    let totalOverallSeats = 0;
    allActiveVehicleIdsInSession.forEach(vehicleId => {
        const config = this.vehicleConfigs.get(vehicleId);
        if (config) {
            totalOverallSeats += config.totalSeats;
        }
    });

    const totalAllocated = confirmedAllocations.length;

    return {
      summary: {
        totalCustomers: confirmedAllocations.length,
        allocatedSeats: totalAllocated,
        availableSeats: totalOverallSeats - totalAllocated,
        utilizationRate: totalOverallSeats > 0 ? Math.round((totalAllocated / totalOverallSeats) * 100) : 0
      },
      vehicleBreakdown,
      conflicts: conflictResult.conflicts
    };
  }

  // 私有方法

  /**
   * 生成唯一的分配ID
   */
  private generateAllocationId(): string {
    // 為了更好的可測試性，這可以作為依賴注入
    return `ALLOC_${Date.now()}_${Math.random().toString(36).substring(2, 11).toUpperCase()}`;
  }

  /**
   * 內部方法，用於以不可變方式更新車輛的座位圖狀態
   * [architect] [架構] 直接操作 seatMap 陣列而無不可變(immutable)處理 (已修復)
   */
  private updateVehicleSeatMapState(vehicleId: string, seatNumber: string, status: string): void {
    const originalConfig = this.vehicleConfigs.get(vehicleId);
    if (!originalConfig) {
      this.logger.error(`Attempted to update seat map for non-existent vehicle: ${vehicleId}`);
      return;
    }

    if (!isValidSeatNumber(seatNumber, originalConfig)) {
      this.logger.warn(`Attempted to update invalid seat number ${seatNumber} for vehicle ${vehicleId}.`);
      return;
    }

    const [row, col] = parseSeatNumber(seatNumber);

    // 深拷貝 seatMap 並更新拷貝的版本
    const newSeatMap: string[][] = originalConfig.seatLayout.seatMap.map(r => [...r]);
    newSeatMap[row][col] = status;

    // 創建一個新的 SeatConfiguration 物件，包含更新後的 seatMap
    const updatedConfig: SeatConfiguration = {
      ...originalConfig,
      seatLayout: {
        ...originalConfig.seatLayout,
        seatMap: newSeatMap // 使用新的、拷貝的 seat map
      }
    };

    // 使用新的、不可變的 SeatConfiguration 物件更新 Map
    this.vehicleConfigs.set(vehicleId, updatedConfig);
    this.logger.debug(`Seat map for vehicle ${vehicleId} updated: seat ${seatNumber} is now ${status}.`);
  }

  /**
   * 獲取特定車輛的所有分配記錄
   */
  private getAllocationsByVehicle(vehicleId: string): SeatAllocation[] {
    const allocations: SeatAllocation[] = [];
    this.seatAllocations.forEach(sessionAllocations => {
      allocations.push(...sessionAllocations.filter(alloc => alloc.vehicleId === vehicleId));
    });
    return allocations;
  }

  /**
   * 查找單個分配記錄
   */
  private findAllocation(allocationId: string): SeatAllocation | null {
    for (const sessionAllocations of this.seatAllocations.values()) {
      const allocation = sessionAllocations.find(alloc => alloc.id === allocationId);
      if (allocation) return allocation;
    }
    return null;
  }
}

// 根據 Kintone 獨立性原則，不應在服務檔案中建立全域實例，
// 而是由應用程式層負責實例化和注入，或者在需要的地方創建實例。
// 移除了原始的 `export const seatConflictDetectionService = new SeatConflictDetectionService();`

// 直接輸出以便其他模組導入
export { VEHICLE_CONFIGURATIONS_DATA }; // 導出原始配置數據，供外部使用/注入
export default SeatAllocationManager;