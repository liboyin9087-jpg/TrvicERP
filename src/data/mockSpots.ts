/**
 * Mock Spots Data for Itinerary Builder
 */

import type { Spot } from '../types/itinerary';

export const MOCK_SPOTS: Spot[] = [
  {
    id: 'spot-001',
    name: '陽明山國家公園',
    category: ['山林秘境'],
    region: '台北',
    county: '台北市',
    description: '擁有豐富的火山地形與自然景觀',
    duration: 180,
    season: ['春', '秋', '冬'],
    tags: ['自然', '健行', '溫泉'],
    target_audience: ['親子', '登山客', '攝影師'],
    coordinates: { lat: 25.1552, lng: 121.5564 }
  },
  {
    id: 'spot-002',
    name: '綠島',
    category: ['海岸離島'],
    region: '台東',
    county: '台東縣',
    description: '美麗的海洋生態與潛水勝地',
    duration: 480,
    season: ['春', '夏', '秋'],
    tags: ['海洋', '潛水', '生態'],
    target_audience: ['情侶', '潛水愛好者', '冒險家'],
    coordinates: { lat: 22.6671, lng: 121.4686 }
  },
  {
    id: 'spot-003',
    name: '九份老街',
    category: ['文化深度體驗'],
    region: '新北',
    county: '新北市',
    description: '懷舊山城與茶文化體驗',
    duration: 240,
    season: ['春', '夏', '秋', '冬'],
    tags: ['文化', '美食', '歷史'],
    target_audience: ['文青', '美食愛好者', '攝影師'],
    coordinates: { lat: 25.1094, lng: 121.8445 }
  },
  {
    id: 'spot-004',
    name: '池上伯朗大道',
    category: ['農村慢旅'],
    region: '台東',
    county: '台東縣',
    description: '金黃稻浪與自行車道',
    duration: 120,
    season: ['春', '夏', '秋'],
    tags: ['農村', '自行車', '攝影'],
    target_audience: ['親子', '單車客', '攝影師'],
    coordinates: { lat: 23.1174, lng: 121.2186 }
  },
  {
    id: 'spot-005',
    name: '松山文創園區',
    category: ['都市邊緣秘境'],
    region: '台北',
    county: '台北市',
    description: '文創藝術與創意市集',
    duration: 180,
    season: ['春', '夏', '秋', '冬'],
    tags: ['文創', '藝術', '市集'],
    target_audience: ['文青', '藝術愛好者', '親子'],
    coordinates: { lat: 25.0437, lng: 121.5609 }
  },
  {
    id: 'spot-006',
    name: '太魯閣國家公園',
    category: ['綠色永續景點'],
    region: '花蓮',
    county: '花蓮縣',
    description: '壯麗的峽谷與大理石地形',
    duration: 300,
    season: ['春', '秋', '冬'],
    tags: ['峽谷', '健行', '生態'],
    target_audience: ['登山客', '親子', '攝影師'],
    coordinates: { lat: 24.1942, lng: 121.4909 }
  },
  {
    id: 'spot-007',
    name: '澎湖跨海大橋',
    category: ['海岸離島'],
    region: '澎湖',
    county: '澎湖縣',
    description: '連接白沙與西嶼的地標',
    duration: 60,
    season: ['春', '夏', '秋'],
    tags: ['海洋', '地標', '攝影'],
    target_audience: ['親子', '攝影師', '情侶'],
    coordinates: { lat: 23.6478, lng: 119.5397 }
  },
  {
    id: 'spot-008',
    name: '鹿港老街',
    category: ['文化深度體驗'],
    region: '彰化',
    county: '彰化縣',
    description: '傳統工藝與小吃文化',
    duration: 180,
    season: ['春', '夏', '秋', '冬'],
    tags: ['文化', '美食', '工藝'],
    target_audience: ['文青', '美食愛好者', '親子'],
    coordinates: { lat: 24.0540, lng: 120.4361 }
  }
];
