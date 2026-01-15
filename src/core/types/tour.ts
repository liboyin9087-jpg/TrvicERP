/**
 * 行程產品核心類型定義
 * Tour Product Core Types
 */

/**
 * 行程狀態
 */
export type TourStatus = 'draft' | 'active' | 'inactive' | 'archived';

/**
 * 行程類型
 */
export type TourType = 'group' | 'fit' | 'semi-fit' | 'incentive' | 'mice';

/**
 * 難度等級
 */
export type DifficultyLevel = 'easy' | 'moderate' | 'challenging' | 'difficult';

/**
 * 景點
 */
export interface Attraction {
  id: string;
  name: string;
  imageUrl: string;
  type: string;
  durationMinutes: number;
  lat?: number;
  lng?: number;
  description?: string;
  address?: string;
}

/**
 * 行程亮點
 */
export interface TourHighlight {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

/**
 * 包含項目
 */
export interface InclusionItem {
  id: string;
  category: 'transport' | 'accommodation' | 'meal' | 'ticket' | 'guide' | 'insurance' | 'other';
  description: string;
  isIncluded: boolean;
}

/**
 * 行程天數內容
 */
export interface TourDayContent {
  day: number;
  title: string;
  description: string;
  attractions: Attraction[];
  meals: {
    breakfast?: string;
    lunch?: string;
    dinner?: string;
  };
  accommodation?: string;
}

/**
 * 行程產品
 */
export interface Tour {
  id: string;
  code: string;
  name: string;
  englishName?: string;
  type: TourType;
  status: TourStatus;
  destination: string;
  countries: string[];
  days: number;
  nights: number;
  difficulty?: DifficultyLevel;
  description: string;
  shortDescription?: string;
  coverImage: string;
  images?: string[];
  highlights: TourHighlight[];
  inclusions: InclusionItem[];
  dayContents: TourDayContent[];
  basePrice: number;
  currency: string;
  minPax: number;
  maxPax: number;
  // 標籤與分類
  tags?: string[];
  categories?: string[];
  // SEO
  slug?: string;
  metaTitle?: string;
  metaDescription?: string;
  // 時間戳
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

/**
 * 公開行程資料（分享用）
 */
export interface PublicTourData {
  id: string;
  title: string;
  days: number;
  basePrice: number;
  coverImage: string;
  description: string;
  itineraryJson: {
    points: { time: string; name: string; desc: string; image?: string }[];
    hotel: string;
  }[];
  shareToken: string;
}

/**
 * 建立行程資料
 */
export interface CreateTourData {
  code: string;
  name: string;
  englishName?: string;
  type: TourType;
  destination: string;
  countries: string[];
  days: number;
  nights: number;
  difficulty?: DifficultyLevel;
  description: string;
  shortDescription?: string;
  coverImage: string;
  images?: string[];
  highlights?: Omit<TourHighlight, 'id'>[];
  inclusions?: Omit<InclusionItem, 'id'>[];
  dayContents?: Omit<TourDayContent, 'day'>[];
  basePrice: number;
  currency?: string;
  minPax?: number;
  maxPax?: number;
  tags?: string[];
  categories?: string[];
}

/**
 * 更新行程資料
 */
export interface UpdateTourData {
  code?: string;
  name?: string;
  englishName?: string;
  type?: TourType;
  status?: TourStatus;
  destination?: string;
  countries?: string[];
  days?: number;
  nights?: number;
  difficulty?: DifficultyLevel;
  description?: string;
  shortDescription?: string;
  coverImage?: string;
  images?: string[];
  basePrice?: number;
  currency?: string;
  minPax?: number;
  maxPax?: number;
  tags?: string[];
  categories?: string[];
}

/**
 * 行程查詢條件
 */
export interface TourQuery {
  status?: TourStatus | TourStatus[];
  type?: TourType | TourType[];
  destination?: string;
  countries?: string[];
  minDays?: number;
  maxDays?: number;
  minPrice?: number;
  maxPrice?: number;
  tags?: string[];
  search?: string;
  page?: number;
  limit?: number;
}
