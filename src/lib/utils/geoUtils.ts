/**
 * 地理工具函數
 * Geographic Utilities
 */

/**
 * 計算兩點間的直線距離 (Haversine formula)
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 地球半徑 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * 根據距離預估交通時間 (分鐘)
 * 假設平均時速：城市 30km/h, 山區 20km/h
 */
export function estimateTravelTime(distanceKm: number, type: string): number {
  const speed = type === '山區' ? 20 : 35;
  return Math.round((distanceKm / speed) * 60) + 10; // 加 10 分鐘緩衝
}
