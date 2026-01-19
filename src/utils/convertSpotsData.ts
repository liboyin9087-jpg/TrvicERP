/**
 * 轉換景點數據工具
 * 將 trvic-spots-mock-data 的數據轉換為 Spot 格式
 * 並添加團體旅遊標籤
 */

import type { Spot, SpotCategory } from '@/store/useItineraryBuilderStore';

// 動態導入以避免循環依賴
let spotsMockData: any[] = [];
try {
  const module = require('../../trvic-spots-mock-data');
  spotsMockData = module.spotsMockData || module.default || [];
} catch (error) {
  console.warn('無法載入 trvic-spots-mock-data', error);
}

/**
 * 根據景點特性生成團體旅遊標籤
 */
function generateGroupTourTags(spot: any): string[] {
  const tags: string[] = [];
  const originalTags = spot.tags || [];
  
  // 保留原有標籤
  tags.push(...originalTags);

  // 團體旅遊專用標籤
  const description = (spot.description || '').toLowerCase();
  const name = (spot.name || '').toLowerCase();
  const county = (spot.county || '').toLowerCase();
  const category = (spot.category || []).join(' ').toLowerCase();
  const targetAudience = (spot.target_audience || []).join(' ').toLowerCase();

  // 適合團體規模
  if (description.includes('適合') || description.includes('團體') || targetAudience.includes('團體')) {
    tags.push('適合團體');
  }
  if (description.includes('企業') || description.includes('esg')) {
    tags.push('適合企業團');
  }
  if (targetAudience.includes('親子') || description.includes('親子')) {
    tags.push('適合親子團');
  }
  if (targetAudience.includes('銀髮') || targetAudience.includes('長輩')) {
    tags.push('適合長輩團');
  }

  // 預約相關
  if (description.includes('預約') || description.includes('申請') || description.includes('限額')) {
    tags.push('需提前預約');
  } else if (description.includes('現場') || !description.includes('預約')) {
    tags.push('可現場購票');
  }

  // 設施標籤
  if (description.includes('住宿') || category.includes('住宿')) {
    tags.push('有住宿');
  }
  if (description.includes('餐廳') || description.includes('料理') || description.includes('美食')) {
    tags.push('有餐廳');
  }
  if (description.includes('停車') || description.includes('停車場')) {
    tags.push('有停車場');
  } else if (!description.includes('無停車')) {
    // 大部分景點都有停車場，除非明確說明沒有
    tags.push('有停車場');
  }
  if (description.includes('無障礙') || description.includes('輪椅')) {
    tags.push('無障礙設施');
  }

  // 導覽服務
  if (description.includes('導覽') || description.includes('解說') || description.includes('體驗')) {
    tags.push('有導覽服務');
  }
  if (description.includes('DIY') || description.includes('手作') || description.includes('體驗')) {
    tags.push('可體驗活動');
  }

  // 拍照相關
  if (description.includes('拍照') || description.includes('攝影') || description.includes('打卡') || 
      description.includes('秘境') || description.includes('美景') || description.includes('風景')) {
    tags.push('適合拍照');
  }
  if (description.includes('日落') || description.includes('日出') || description.includes('夜景')) {
    tags.push('最佳拍照時段');
  }

  // 時間相關
  if (description.includes('一日') || description.includes('整天') || description.includes('全天')) {
    tags.push('適合全天');
  } else if (description.includes('半天') || description.includes('半日')) {
    tags.push('適合半天');
  } else {
    // 根據 duration 判斷（如果有的話）
    tags.push('適合半天');
  }

  // 天氣相關
  if (description.includes('室內') || description.includes('博物館') || description.includes('工坊') || 
      category.includes('文化') || category.includes('都市')) {
    tags.push('適合雨天');
  }
  if (description.includes('戶外') || description.includes('自然') || description.includes('山') || 
      description.includes('海') || description.includes('森林')) {
    tags.push('適合晴天');
  }

  // 季節相關（從 season 判斷）
  const seasons = spot.season || [];
  if (seasons.length === 4) {
    tags.push('全年適合');
  } else if (seasons.length >= 2) {
    tags.push('多季節適合');
  }

  // 特殊需求
  if (description.includes('入山證') || description.includes('申請')) {
    tags.push('需申請許可');
  }
  if (description.includes('限額') || description.includes('限人數')) {
    tags.push('有人數限制');
  }
  if (description.includes('紀念品') || description.includes('選物') || description.includes('文創')) {
    tags.push('有紀念品');
  }

  // 去重並返回
  return Array.from(new Set(tags));
}

/**
 * 根據縣市生成預設座標（簡化版，實際應該從地理編碼服務獲取）
 */
function getDefaultCoordinates(county: string): { lat: number; lng: number } {
  // 台灣各縣市大致中心座標
  const coordinates: Record<string, { lat: number; lng: number }> = {
    '台北市': { lat: 25.0330, lng: 121.5654 },
    '新北市': { lat: 25.0169, lng: 121.4628 },
    '桃園市': { lat: 24.9936, lng: 121.3010 },
    '台中市': { lat: 24.1477, lng: 120.6736 },
    '台南市': { lat: 22.9999, lng: 120.2269 },
    '高雄市': { lat: 22.6273, lng: 120.3014 },
    '基隆市': { lat: 25.1276, lng: 121.7395 },
    '新竹市': { lat: 24.8036, lng: 120.9686 },
    '嘉義市': { lat: 23.4801, lng: 120.4491 },
    '新竹縣': { lat: 24.8294, lng: 121.0176 },
    '苗栗縣': { lat: 24.5632, lng: 120.8214 },
    '彰化縣': { lat: 24.0800, lng: 120.5419 },
    '南投縣': { lat: 23.9098, lng: 120.6874 },
    '雲林縣': { lat: 23.6969, lng: 120.5435 },
    '嘉義縣': { lat: 23.4518, lng: 120.2551 },
    '屏東縣': { lat: 22.5490, lng: 120.5487 },
    '宜蘭縣': { lat: 24.7021, lng: 121.7377 },
    '花蓮縣': { lat: 23.9739, lng: 121.6014 },
    '台東縣': { lat: 22.7556, lng: 121.1444 },
    '澎湖縣': { lat: 23.5694, lng: 119.5664 },
    '金門縣': { lat: 24.4333, lng: 118.3170 },
    '連江縣': { lat: 26.1972, lng: 119.9286 },
  };

  // 從縣市名稱中提取主要縣市
  for (const [key, coords] of Object.entries(coordinates)) {
    if (county.includes(key)) {
      return coords;
    }
  }

  // 預設為台灣中心（南投）
  return { lat: 23.9098, lng: 120.6874 };
}

/**
 * 轉換景點數據
 */
export function convertSpotsData(): Spot[] {
  return spotsMockData.map((item): Spot => {
    const coords = getDefaultCoordinates(item.county);
    const groupTourTags = generateGroupTourTags(item);
    
    // 轉換 category 為 SpotCategory[]
    const categories: SpotCategory[] = item.category
      .filter((cat: string) => 
        ['綠色永續景點', '山林秘境', '海岸離島', '文化深度體驗', '農村慢旅', '都市邊緣秘境'].includes(cat)
      ) as SpotCategory[];

    // 如果沒有符合的分類，預設為文化深度體驗
    if (categories.length === 0) {
      categories.push('文化深度體驗');
    }

    return {
      id: item.id,
      name: item.name,
      category: categories,
      county: item.county,
      location: {
        lat: coords.lat,
        lng: coords.lng,
        address: item.county + (item.name.includes(item.county) ? '' : item.name),
      },
      duration: 120, // 預設 2 小時，可根據實際調整
      description: item.description,
      image: item.image,
      price: item.price,
      tags: groupTourTags, // 使用增強後的標籤
      season: item.season,
      sustainability_index: item.sustainability_index,
      target_audience: item.target_audience,
    };
  });
}
