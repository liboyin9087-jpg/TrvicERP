/**
 * 座位分配衝突偵測服務
 * Seat Allocation Conflict Detection Service
 */

import type { Session, Customer } from '../core/types';

/**
 * 座位配置
 */
interface SeatConfiguration {
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
interface SeatAllocation {
  id: string;
  sessionId: string;
  customerId: string;
  vehicleId: string;
  seatNumber: string;
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
interface ConflictResult {
  hasConflict: boolean;
  conflicts: SeatConflict[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

/**
 * 座位衝突類型
 */
interface SeatConflict {
  type: 'double_booking' | 'overbooking' | 'invalid_seat' | 'capacity_exceeded' | 'timing_conflict';
  vehicleId: string;
  seatNumber?: string;
  customerIds: string[];
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  suggestedResolution: string;
}

/**
 * 車輛座位配置資料庫
 */
const VEHICLE_CONFIGURATIONS: Record<string, SeatConfiguration> = {
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
 * 座位衝突偵測服務類別
 */
export class SeatConflictDetectionService {
  private seatAllocations: Map<string, SeatAllocation[]> = new Map();
  private vehicleConfigs: Map<string, SeatConfiguration> = new Map();

  constructor() {
    // 初始化車輛配置
    Object.values(VEHICLE_CONFIGURATIONS).forEach(config => {
      this.vehicleConfigs.set(config.vehicleId, config);
    });
  }

  /**
   * 分配座位
   */
  allocateSeat(allocation: Omit<SeatAllocation, 'id'>): {
    success: boolean;
    conflict?: SeatConflict;
    allocationId?: string;
  } {
    const conflicts = this.checkSeatConflict(allocation.vehicleId, allocation.seatNumber, allocation.sessionId);
    
    if (conflicts.length > 0) {
      return {
        success: false,
        conflict: conflicts[0]
      };
    }

    const newAllocation: SeatAllocation = {
      ...allocation,
      id: this.generateAllocationId(),
      status: 'confirmed'
    };

    // 儲存分配記錄
    if (!this.seatAllocations.has(allocation.sessionId)) {
      this.seatAllocations.set(allocation.sessionId, []);
    }
    this.seatAllocations.get(allocation.sessionId)!.push(newAllocation);

    // 更新座位圖
    this.updateSeatMap(allocation.vehicleId, allocation.seatNumber, 'occupied');

    return {
      success: true,
      allocationId: newAllocation.id
    };
  }

  /**
   * 檢查座位衝突
   */
  checkSeatConflict(
    vehicleId: string, 
    seatNumber: string, 
    sessionId: string,
    excludeAllocationId?: string
  ): SeatConflict[] {
    const conflicts: SeatConflict[] = [];
    const vehicleConfig = this.vehicleConfigs.get(vehicleId);

    if (!vehicleConfig) {
      conflicts.push({
        type: 'invalid_seat',
        vehicleId,
        customerIds: [],
        description: `車輛 ${vehicleId} 配置不存在`,
        severity: 'critical',
        suggestedResolution: '請檢查車輛配置或選擇有效車輛'
      });
      return conflicts;
    }

    // 檢查座位號碼是否有效
    if (!this.isValidSeatNumber(seatNumber, vehicleConfig)) {
      conflicts.push({
        type: 'invalid_seat',
        vehicleId,
        seatNumber,
        customerIds: [],
        description: `座位號碼 ${seatNumber} 無效`,
        severity: 'high',
        suggestedResolution: '請選擇有效的座位號碼'
      });
    }

    // 檢查是否已被分配
    const existingAllocations = this.getAllocationsByVehicle(vehicleId);
    const conflictingAllocation = existingAllocations.find(alloc => 
      alloc.seatNumber === seatNumber && 
      alloc.status === 'confirmed' &&
      alloc.id !== excludeAllocationId
    );

    if (conflictingAllocation) {
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

    // 檢查車輛容量
    const totalAllocated = existingAllocations.filter(alloc => 
      alloc.status === 'confirmed' && alloc.id !== excludeAllocationId
    ).length;

    if (totalAllocated >= vehicleConfig.totalSeats) {
      conflicts.push({
        type: 'capacity_exceeded',
        vehicleId,
        customerIds: existingAllocations.map(alloc => alloc.customerId),
        description: `車輛 ${vehicleId} 已達最大容量 (${vehicleConfig.totalSeats} 個座位)`,
        severity: 'high',
        suggestedResolution: '請分配其他車輛或增加車輛容量'
      });
    }

    return conflicts;
  }

  /**
   * 檢查團次座位衝突
   */
  checkSessionSeatConflicts(sessionId: string): ConflictResult {
    const sessionAllocations = this.seatAllocations.get(sessionId) || [];
    const conflicts: SeatConflict[] = [];
    const vehicleUsage: Map<string, number> = new Map();

    // 統計各車輛使用情況
    sessionAllocations.forEach(allocation => {
      if (allocation.status === 'confirmed') {
        vehicleUsage.set(
          allocation.vehicleId, 
          (vehicleUsage.get(allocation.vehicleId) || 0) + 1
        );
      }
    });

    // 檢查車輛超載
    vehicleUsage.forEach((allocatedCount, vehicleId) => {
      const config = this.vehicleConfigs.get(vehicleId);
      if (config && allocatedCount > config.totalSeats) {
        conflicts.push({
          type: 'overbooking',
          vehicleId,
          customerIds: sessionAllocations
            .filter(alloc => alloc.vehicleId === vehicleId && alloc.status === 'confirmed')
            .map(alloc => alloc.customerId),
          description: `車輛 ${vehicleId} 超載：已分配 ${allocatedCount} 個座位，容量 ${config.totalSeats}`,
          severity: 'critical',
          suggestedResolution: '立即重新分配座位或增加車輛'
        });
      }
    });

    // 檢查重複座位分配
    const seatUsage: Map<string, SeatAllocation[]> = new Map();
    sessionAllocations.forEach(allocation => {
      const key = `${allocation.vehicleId}-${allocation.seatNumber}`;
      if (!seatUsage.has(key)) {
        seatUsage.set(key, []);
      }
      seatUsage.get(key)!.push(allocation);
    });

    seatUsage.forEach((allocations, seatKey) => {
      const confirmedAllocations = allocations.filter(alloc => alloc.status === 'confirmed');
      if (confirmedAllocations.length > 1) {
        const [vehicleId, seatNumber] = seatKey.split('-');
        conflicts.push({
          type: 'double_booking',
          vehicleId,
          seatNumber,
          customerIds: confirmedAllocations.map(alloc => alloc.customerId),
          description: `座位 ${seatNumber} 重複分配給多個客戶`,
          severity: 'critical',
          suggestedResolution: '立即重新分配座位，確保每個座位只分配給一個客戶'
        });
      }
    });

    // 計算嚴重程度
    const severity = this.calculateConflictSeverity(conflicts);
    const recommendations = this.generateRecommendations(conflicts);

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
      severity,
      recommendations
    };
  }

  /**
   * 轉移座位
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
    const allocation = this.findAllocation(allocationId);
    if (!allocation) {
      return {
        success: false,
        conflict: {
          type: 'invalid_seat',
          vehicleId: '',
          customerIds: [],
          description: '找不到指定的座位分配記錄',
          severity: 'high',
          suggestedResolution: '請檢查分配ID是否正確'
        }
      };
    }

    // 檢查新座位是否有衝突
    const conflicts = this.checkSeatConflict(
      allocation.vehicleId, 
      newSeatNumber, 
      allocation.sessionId,
      allocationId
    );

    if (conflicts.length > 0) {
      return {
        success: false,
        conflict: conflicts[0]
      };
    }

    // 更新舊座位狀態
    this.updateSeatMap(allocation.vehicleId, allocation.seatNumber, 'available');

    // 轉移座位
    const oldSeatNumber = allocation.seatNumber;
    allocation.seatNumber = newSeatNumber;
    allocation.transferHistory = allocation.transferHistory || [];
    allocation.transferHistory.push({
      fromSeat: oldSeatNumber,
      toSeat: newSeatNumber,
      transferDate: new Date().toISOString(),
      reason
    });

    // 更新新座位狀態
    this.updateSeatMap(allocation.vehicleId, newSeatNumber, 'occupied');

    return {
      success: true,
      updatedAllocation: allocation
    };
  }

  /**
   * 取消座位分配
   */
  cancelSeatAllocation(allocationId: string): {
    success: boolean;
    error?: string;
  } {
    const allocation = this.findAllocation(allocationId);
    if (!allocation) {
      return {
        success: false,
        error: '找不到指定的座位分配記錄'
      };
    }

    allocation.status = 'cancelled';
    this.updateSeatMap(allocation.vehicleId, allocation.seatNumber, 'available');

    return { success: true };
  }

  /**
   * 取得車輛座位圖
   */
  getVehicleSeatMap(vehicleId: string): {
    config: SeatConfiguration | null;
    currentAllocation: SeatAllocation[];
    seatStatus: string[][];
  } {
    const config = this.vehicleConfigs.get(vehicleId) || null;
    const allocations = this.getAllocationsByVehicle(vehicleId);
    const seatStatus = config ? 
      Array(config.seatLayout.rows).fill(null).map(() => Array(config.seatLayout.seatsPerRow).fill('available')) :
      [];

    // 標記已佔用座位
    allocations.forEach(allocation => {
      if (allocation.status === 'confirmed') {
        const [row, col] = this.parseSeatNumber(allocation.seatNumber);
        if (row >= 0 && col >= 0 && seatStatus[row] && seatStatus[row][col] !== undefined) {
          seatStatus[row][col] = 'occupied';
        }
      }
    });

    return {
      config,
      currentAllocation: allocations,
      seatStatus
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
    const allocations = this.seatAllocations.get(sessionId) || [];
    const confirmedAllocations = allocations.filter(alloc => alloc.status === 'confirmed');
    const conflictResult = this.checkSessionSeatConflicts(sessionId);

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
      const config = this.vehicleConfigs.get(vehicleId)!;
      return {
        vehicleId,
        vehicleType: stats.type,
        totalSeats: config.totalSeats,
        allocatedSeats: stats.allocated,
        utilizationRate: Math.round((stats.allocated / config.totalSeats) * 100)
      };
    });

    const totalSeats = vehicleBreakdown.reduce((sum, vehicle) => sum + vehicle.totalSeats, 0);
    const totalAllocated = confirmedAllocations.length;

    return {
      summary: {
        totalCustomers: confirmedAllocations.length,
        allocatedSeats: totalAllocated,
        availableSeats: totalSeats - totalAllocated,
        utilizationRate: totalSeats > 0 ? Math.round((totalAllocated / totalSeats) * 100) : 0
      },
      vehicleBreakdown,
      conflicts: conflictResult.conflicts
    };
  }

  // 私有方法

  private generateAllocationId(): string {
    return `ALLOC_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isValidSeatNumber(seatNumber: string, config: SeatConfiguration): boolean {
    const [row, col] = this.parseSeatNumber(seatNumber);
    return row >= 0 && row < config.seatLayout.rows && 
           col >= 0 && col < config.seatLayout.seatsPerRow;
  }

  private parseSeatNumber(seatNumber: string): [number, number] {
    // 假設座位號碼格式為 "A1", "A2", "B1", "B2" 等
    const rowChar = seatNumber.charAt(0).toUpperCase();
    const colNum = parseInt(seatNumber.substr(1)) - 1;
    const row = rowChar.charCodeAt(0) - 'A'.charCodeAt(0);
    return [row, colNum];
  }

  private updateSeatMap(vehicleId: string, seatNumber: string, status: string): void {
    const config = this.vehicleConfigs.get(vehicleId);
    if (config) {
      const [row, col] = this.parseSeatNumber(seatNumber);
      if (row >= 0 && row < config.seatLayout.rows && 
          col >= 0 && col < config.seatLayout.seatsPerRow) {
        config.seatLayout.seatMap[row][col] = status;
      }
    }
  }

  private getAllocationsByVehicle(vehicleId: string): SeatAllocation[] {
    const allocations: SeatAllocation[] = [];
    this.seatAllocations.forEach(sessionAllocations => {
      allocations.push(...sessionAllocations.filter(alloc => alloc.vehicleId === vehicleId));
    });
    return allocations;
  }

  private findAllocation(allocationId: string): SeatAllocation | null {
    for (const sessionAllocations of this.seatAllocations.values()) {
      const allocation = sessionAllocations.find(alloc => alloc.id === allocationId);
      if (allocation) return allocation;
    }
    return null;
  }

  private calculateConflictSeverity(conflicts: SeatConflict[]): 'low' | 'medium' | 'high' | 'critical' {
    if (conflicts.length === 0) return 'low';
    
    const hasCritical = conflicts.some(c => c.severity === 'critical');
    const hasHigh = conflicts.some(c => c.severity === 'high');
    
    if (hasCritical) return 'critical';
    if (hasHigh) return 'high';
    if (conflicts.length > 3) return 'medium';
    return 'low';
  }

  private generateRecommendations(conflicts: SeatConflict[]): string[] {
    const recommendations: string[] = [];
    
    if (conflicts.some(c => c.type === 'overbooking')) {
      recommendations.push('建議增加車輛或重新分配部分客戶到其他車輛');
    }
    
    if (conflicts.some(c => c.type === 'double_booking')) {
      recommendations.push('立即解決重複座位分配，確保每個客戶都有唯一座位');
    }
    
    if (conflicts.some(c => c.type === 'capacity_exceeded')) {
      recommendations.push('檢查車輛容量配置，考慮使用更大容量的車輛');
    }
    
    if (conflicts.some(c => c.type === 'invalid_seat')) {
      recommendations.push('檢查座位號碼格式和車輛配置的一致性');
    }

    return recommendations;
  }
}

// 建立全域實例
export const seatConflictDetectionService = new SeatConflictDetectionService();

export default SeatConflictDetectionService;
