/**
 * 行程產品核心類型定義
 * Tour Product Core Types
 */

/**
 * 行程狀態
 * 表示行程產品在系統中的生命週期狀態。
 */
export type TourStatus =
  /**
   * 草稿狀態：行程尚未完成編輯，對外不可見。
   */
  | 'draft'
  /**
   * 啟用狀態：行程已完成編輯，對外公開可預訂。
   */
  | 'active'
  /**
   * 停用狀態：行程暫時下架，對外不可見，但仍可於後台管理。
   */
  | 'inactive'
  /**
   * 歸檔狀態：行程已結束或不再提供，數據保留用於歷史查詢。
   */
  | 'archived';

/**
 * 行程類型
 * 定義行程產品的服務模式或目標客群。
 */
export type TourType =
  /**
   * 團體旅遊：固定出發日期和行程，供多個散客報名組成團體。
   */
  | 'group'
  /**
   * 自由行：提供機票、住宿等基本元素，行程安排彈性大。
   */
  | 'fit' // Free Independent Traveler
  /**
   * 半自由行：結合團體行程的某些部分（如交通、特定景點），並提供部分自由活動時間。
   */
  | 'semi-fit'
  /**
   * 獎勵旅遊：企業為激勵員工或客戶而組織的特殊旅遊。
   */
  | 'incentive'
  /**
   * 會議、獎勵、研討會、展覽：專為商業活動設計的旅遊服務。
   */
  | 'mice'; // Meetings, Incentives, Conferences, Exhibitions

/**
 * 難度等級
 * 衡量行程的體力消耗、活動強度或專業要求。
 */
export type DifficultyLevel =
  /**
   * 輕鬆：適合所有年齡層和體能水平，活動量小，以觀光為主。
   */
  | 'easy'
  /**
   * 中等：需要適度體力，包含步行、輕度徒步或少量體力活動。
   */
  | 'moderate'
  /**
   * 挑戰性：需要良好體能，可能涉及長時間步行、徒步、或某些專業技能。
   */
  | 'challenging'
  /**
   * 困難：適合經驗豐富的旅行者，可能包含高強度體力活動、極端環境或專業技能要求。
   */
  | 'difficult';

/**
 * 景點
 * 行程中包含的具體地點或活動點。
 */
export interface Attraction {
  /**
   * 景點唯一識別碼。
   */
  id: string;
  /**
   * 景點名稱。
   */
  name: string;
  /**
   * 景點代表圖片的 URL。
   */
  imageUrl: string;
  /**
   * 景點類型 (例如：歷史古蹟, 自然風光, 博物館, 主題樂園等)。
   */
  type: string;
  /**
   * 在此景點預計停留的持續時間 (分鐘)。
   */
  durationMinutes: number;
  /**
   * 景點緯度座標 (可選)。
   */
  lat?: number;
  /**
   * 景點經度座標 (可選)。
   */
  lng?: number;
  /**
   * 景點的詳細描述 (可選)。
   */
  description?: string;
  /**
   * 景點的地址 (可選)。
   */
  address?: string;
}

/**
 * 行程亮點
 * 突顯行程獨特賣點或重要特色。
 */
export interface TourHighlight {
  /**
   * 亮點唯一識別碼。
   */
  id: string;
  /**
   * 亮點標題。
   */
  title: string;
  /**
   * 亮點詳細描述。
   */
  description: string;
  /**
   * 亮點相關圖片的 URL (可選)。
   */
  imageUrl?: string;
}

/**
 * 包含項目
 * 行程費用中涵蓋的服務或物品。
 */
export interface InclusionItem {
  /**
   * 包含項目唯一識別碼。
   */
  id: string;
  /**
   * 包含項目類別。
   */
  category:
    /** 交通服務，如機票、火車票、巴士。 */
    | 'transport'
    /** 住宿安排，如飯店、民宿。 */
    | 'accommodation'
    /** 餐飲服務，如早餐、午餐、晚餐。 */
    | 'meal'
    /** 景點門票、活動入場券。 */
    | 'ticket'
    /** 導遊或領隊服務。 */
    | 'guide'
    /** 旅遊保險。 */
    | 'insurance'
    /** 其他未分類的服務或物品。 */
    | 'other';
  /**
   * 包含項目的詳細描述。
   */
  description: string;
  /**
   * 表示該項目是否包含在行程費用中。
   */
  isIncluded: boolean;
}

/**
 * 行程天數內容的餐飲安排。
 */
export interface TourDayMeals {
  /**
   * 早餐描述 (可選)。
   */
  breakfast?: string;
  /**
   * 午餐描述 (可選)。
   */
  lunch?: string;
  /**
   * 晚餐描述 (可選)。
   */
  dinner?: string;
}

/**
 * 行程天數內容
 * 描述每一天的詳細行程安排。
 */
export interface TourDayContent {
  /**
   * 天數編號，從 1 開始。
   */
  day: number;
  /**
   * 該天的標題或主題。
   */
  title: string;
  /**
   * 該天的詳細描述。
   */
  description: string;
  /**
   * 該天造訪的景點列表。
   */
  attractions: Attraction[];
  /**
   * 該天的餐飲安排。
   */
  meals: TourDayMeals;
  /**
   * 該天的住宿地點描述 (可選)。
   */
  accommodation?: string;
}

/**
 * 行程產品的核心基礎資訊。
 */
export interface TourCoreDetails {
  /**
   * 行程唯一識別碼。
   */
  id: string;
  /**
   * 行程產品的內部編碼。
   */
  code: string;
  /**
   * 行程產品的中文名稱。
   */
  name: string;
  /**
   * 行程產品的英文名稱 (可選)。
   */
  englishName?: string;
  /**
   * 行程類型。
   */
  type: TourType;
  /**
   * 行程的當前狀態。
   */
  status: TourStatus;
  /**
   * 行程的主要目的地。
   */
  destination: string;
  /**
   * 行程經過的國家列表。
   */
  countries: string[];
  /**
   * 行程總天數。
   */
  days: number;
  /**
   * 行程總晚數。
   */
  nights: number;
  /**
   * 行程難度等級 (可選)。
   */
  difficulty?: DifficultyLevel;
  /**
   * 行程的完整詳細描述。
   */
  description: string;
  /**
   * 行程的簡短描述，常用於列表或摘要 (可選)。
   */
  shortDescription?: string;
}

/**
 * 行程產品的媒體資訊。
 */
export interface TourMedia {
  /**
   * 行程的封面圖片 URL。
   */
  coverImage: string;
  /**
   * 行程的其他圖片 URL 列表 (可選)。
   */
  images?: string[];
}

/**
 * 行程產品的內容組成，如亮點、包含項目和每日行程。
 */
export interface TourContent {
  /**
   * 行程的亮點列表。
   */
  highlights: TourHighlight[];
  /**
   * 行程費用包含的項目列表。
   */
  inclusions: InclusionItem[];
  /**
   * 每日行程內容的詳細安排。
   */
  dayContents: TourDayContent[];
}

/**
 * 行程產品的定價資訊。
 */
export interface TourPricing {
  /**
   * 行程的基本價格。
   */
  basePrice: number;
  /**
   * 價格使用的貨幣代碼 (例如：'TWD', 'USD')。
   */
  currency: string;
  /**
   * 最小成團人數。
   */
  minPax: number;
  /**
   * 最大可接受人數。
   */
  maxPax: number;
}

/**
 * 行程產品的分類和標籤。
 */
export interface TourMetadata {
  /**
   * 用於快速分類和搜尋的標籤列表 (可選)。
   */
  tags?: string[];
  /**
   * 行程所屬的類別列表 (可選)。
   */
  categories?: string[];
}

/**
 * 行程產品的搜尋引擎最佳化 (SEO) 相關資訊。
 */
export interface TourSEO {
  /**
   * 用於 URL 的友善名稱 (可選)。
   */
  slug?: string;
  /**
   * 頁面標題，用於瀏覽器標籤和搜尋引擎結果 (可選)。
   */
  metaTitle?: string;
  /**
   * 頁面描述，用於搜尋引擎結果摘要 (可選)。
   */
  metaDescription?: string;
}

/**
 * 行程產品的建立與更新時間戳。
 */
export interface TourTimestamps {
  /**
   * 行程建立時間 (ISO 8601 格式字串)。
   */
  createdAt: string;
  /**
   * 行程最後更新時間 (ISO 8601 格式字串)。
   */
  updatedAt: string;
  /**
   * 建立此行程的使用者識別碼 (可選)。
   */
  createdBy?: string;
}

/**
 * 行程產品
 * 組合所有相關資訊，形成完整的行程產品定義。
 */
export interface Tour
  extends TourCoreDetails,
    TourMedia,
    TourContent,
    TourPricing,
    TourMetadata,
    TourSEO,
    TourTimestamps {}

/**
 * 公開行程資料（分享用）
 * 專為外部分享或公開展示設計的精簡行程資料。
 * 注意：itineraryJson 格式與 TourDayContent 不同，是特定分享需求的結構。
 */
export interface PublicTourData {
  /**
   * 行程唯一識別碼。
   */
  id: string;
  /**
   * 行程標題。
   */
  title: string;
  /**
   * 行程天數。
   */
  days: number;
  /**
   * 行程基本價格。
   */
  basePrice: number;
  /**
   * 行程封面圖片 URL。
   */
  coverImage: string;
  /**
   * 行程描述。
   */
  description: string;
  /**
   * 行程的詳細行程規劃，以特定 JSON 格式呈現。
   */
  itineraryJson: {
    /**
     * 該天的行程點列表。
     */
    points: {
      /**
       * 行程點的預計時間。
       */
      time: string;
      /**
       * 行程點名稱。
       */
      name: string;
      /**
       * 行程點描述。
       */
      desc: string;
      /**
       * 行程點圖片 URL (可選)。
       */
      image?: string;
    }[];
    /**
     * 該天的住宿飯店描述。
     */
    hotel: string;
  }[];
  /**
   * 用於分享的唯一權杖。
   */
  shareToken: string;
}

/**
 * 建立行程時所需的資料。
 * 包含所有必要且可由用戶輸入的行程屬性。
 */
export interface CreateTourData
  extends Omit<
    TourCoreDetails,
    'id' | 'status' | 'countries' | 'destination'
  >, // Omit generated/status fields
    Omit<TourMedia, 'images'>, // Images might be handled separately or added later
    Omit<TourPricing, 'currency' | 'minPax' | 'maxPax'>, // currency, min/max Pax might have defaults
    TourMetadata,
    TourSEO { // SEO fields can also be provided during creation
  /**
   * 目的地國家列表。
   */
  countries: string[];
  /**
   * 行程主要目的地。
   */
  destination: string;
  /**
   * 行程其他圖片 URL 列表 (可選)。
   */
  images?: string[];
  /**
   * 行程亮點列表 (創建時不需要 id)。
   */
  highlights?: Omit<TourHighlight, 'id'>[];
  /**
   * 包含項目列表 (創建時不需要 id)。
   */
  inclusions?: Omit<InclusionItem, 'id'>[];
  /**
   * 每日行程內容 (創建時不需要 'day' 字段，因為 'day' 由順序決定)。
   */
  dayContents?: Omit<TourDayContent, 'day'>[];
  /**
   * 價格使用的貨幣代碼 (例如：'TWD', 'USD')。如果未提供，系統將使用預設值。
   */
  currency?: string;
  /**
   * 最小成團人數。如果未提供，系統將使用預設值。
   */
  minPax?: number;
  /**
   * 最大可接受人數。如果未提供，系統將使用預設值。
   */
  maxPax?: number;
}

/**
 * 更新行程時所需的資料。
 * 所有字段都是可選的，以便部分更新。
 */
export interface UpdateTourData
  extends Partial<
    Omit<
      TourCoreDetails,
      'id' | 'createdAt' | 'updatedAt' | 'createdBy' // ID and timestamps are not updated directly
    >
  >,
    Partial<TourMedia>,
    Partial<TourPricing>,
    Partial<TourMetadata>,
    Partial<TourSEO> {
  // 對於集合類型的更新，可能需要更複雜的接口來處理增刪改，這裡只提供替換或部分替換的選項
  // 例如，如果需要增刪改單個亮點，會需要不同的 API 接口和類型。
  // 這裡提供一個包含 id 讓後端可以識別更新的項目的方式。
  /**
   * 行程亮點列表的替換 (可選)。注意：這會完全替換現有亮點，而不是增量更新。
   * 包含 `id` 字段以供識別已存在的亮點。
   */
  highlights?: (Omit<TourHighlight, 'id'> & { id?: string })[];
  /**
   * 包含項目列表的替換 (可選)。注意：這會完全替換現有包含項目，而不是增量更新。
   * 包含 `id` 字段以供識別已存在的包含項目。
   */
  inclusions?: (Omit<InclusionItem, 'id'> & { id?: string })[];
  /**
   * 每日行程內容的替換 (可選)。注意：這會完全替換現有每日行程，而不是增量更新。
   * 包含 `day` 字段以供識別已存在的每日行程。
   */
  dayContents?: (Omit<TourDayContent, 'day'> & { day?: number })[];
}

/**
 * 行程查詢條件
 * 用於篩選和分頁行程列表的參數。
 */
export interface TourQuery {
  /**
   * 根據一個或多個行程狀態篩選 (可選)。
   */
  status?: TourStatus | TourStatus[];
  /**
   * 根據一個或多個行程類型篩選 (可選)。
   */
  type?: TourType | TourType[];
  /**
   * 根據主要目的地篩選 (可選)。
   */
  destination?: string;
  /**
   * 根據行程經過的國家篩選 (可選)。
   */
  countries?: string[];
  /**
   * 最小行程天數 (可選)。
   */
  minDays?: number;
  /**
   * 最大行程天數 (可選)。
   */
  maxDays?: number;
  /**
   * 最小行程基本價格 (可選)。
   */
  minPrice?: number;
  /**
   * 最大行程基本價格 (可選)。
   */
  maxPrice?: number;
  /**
   * 根據包含的標籤篩選 (可選)。
   */
  tags?: string[];
  /**
   * 關鍵字搜尋 (可在名稱、描述等字段中搜尋) (可選)。
   */
  search?: string;
  /**
   * 查詢的頁碼，從 1 開始 (可選)。
   */
  page?: number;
  /**
   * 每頁返回的項目數量 (可選)。
   */
  limit?: number;
}