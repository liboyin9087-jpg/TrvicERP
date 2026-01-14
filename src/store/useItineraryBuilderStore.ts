import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SeasonType = 'all' | 'spring' | 'summer' | 'autumn' | 'winter';

// ============================================
// Type Definitions
// ============================================

export type SpotCategory =
  | '綠色永續景點'
  | '山林秘境'
  | '海岸離島'
  | '文化深度體驗'
  | '農村慢旅'
  | '都市邊緣秘境';

export interface Spot {
  id: string;
  name: string;
  category: SpotCategory[];
  county: string; // replaces location
  description: string;
  image: string;
  price: number;
  tags: string[];
  season: string[]; // e.g., ['春', '夏', '秋', '冬']
  sustainability_index: string;
  target_audience: string[];
  // Legacy fields for compatibility
  duration?: number;
  rating?: number;
  lat?: number;
  lng?: number;
}

export interface ScheduledSpot extends Spot {
  instanceId: string; // unique ID for this scheduled instance
  startTime?: string; // HH:mm
  endTime?: string;   // HH:mm
  notes?: string;
}

export interface DayPlan {
  id: string;
  dayNumber: number;
  date?: string;
  title: string;
  spots: ScheduledSpot[];
}

export interface ItineraryVersion {
  version: number;
  created_at: string;
  created_by: string;
  changes: string; // 變更說明
  itinerary_data: {
    days: DayPlan[];
    destination: string;
    startDate: string;
    endDate: string;
  };
}

export interface ItineraryPlan {
  id: string;
  name: string;
  destination: string;
  startDate: string;
  endDate: string;
  days: DayPlan[];
  createdAt: string;
  updatedAt: string;
  // 版本控制
  current_version?: number;
  versions?: ItineraryVersion[];
}

// ============================================
// Mock Data - Resource Library (30 台灣小眾景點)
// ============================================

export const MOCK_SPOTS: Spot[] = [
  // ==================== 1. 綠色永續景點 ====================
  {
    id: "green-001",
    name: "世芳有機茶園",
    county: "新北市坪林區",
    category: ["綠色永續景點"],
    tags: ["有機茶園", "製茶體驗", "食農教育"],
    description: "位於翡翠水庫上游的有機茶園，提供一日茶農體驗，從採茶到製茶完整學習包種茶文化。園區堅持有機栽培，是北台灣最具代表性的永續茶園。",
    price: 1800,
    image: "https://picsum.photos/seed/tea-farm/400/300",
    season: ["春"],
    sustainability_index: "有機認證、水源保護區",
    target_audience: ["親子", "文青", "銀髮"],
    duration: 180,
  },
  {
    id: "green-002",
    name: "兩腳詩集綠活學旅",
    county: "南投縣集集鎮",
    category: ["綠色永續景點"],
    tags: ["永續住宿", "環保標章", "國際認證"],
    description: "全台少數獲得CU-GSTC國際永續旅遊認證的住宿，融合在地文化與環保理念。提供綠色導覽與生態體驗，是追求永續旅行者的首選。",
    price: 3500,
    image: "https://picsum.photos/seed/eco-hotel/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "CU-GSTC國際認證、GTS三星",
    target_audience: ["環保旅人", "情侶"],
    duration: 120,
  },
  {
    id: "green-003",
    name: "馬太鞍濕地生態園區",
    county: "花蓮縣光復鄉",
    category: ["綠色永續景點"],
    tags: ["原住民部落", "濕地生態", "巴拉告捕魚"],
    description: "阿美族傳統領域中的濕地秘境，保存完整的巴拉告生態捕魚法。由部落族人帶領體驗傳統漁獵智慧，是認識原住民永續生態智慧的最佳場域。",
    price: 2200,
    image: "https://picsum.photos/seed/wetland/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "濕地生態保育",
    target_audience: ["親子", "文化體驗"],
    duration: 150,
  },
  {
    id: "green-004",
    name: "頭城休閒農場",
    county: "宜蘭縣頭城鎮",
    category: ["綠色永續景點"],
    tags: ["永續農場", "食農體驗", "環境教育"],
    description: "獲得國際永續旅遊認證的休閒農場，提供從農場到餐桌的完整食農教育體驗。適合企業ESG活動與親子農村體驗，是東北角最具規模的永續農場。",
    price: 2800,
    image: "https://picsum.photos/seed/organic-farm/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "CU-GSTC國際認證",
    target_audience: ["親子", "團體", "企業ESG"],
    duration: 240,
  },
  {
    id: "green-005",
    name: "深山林內生態農場",
    county: "南投縣竹山鎮",
    category: ["綠色永續景點"],
    tags: ["星空住宿", "雲海秘境", "芬多精"],
    description: "隱身竹山深山的低度開發農場，以觀星住宿聞名。秋冬時節可欣賞壯闘雲海，是遠離塵囂、享受森林芬多精的療癒秘境。",
    price: 4200,
    image: "https://picsum.photos/seed/mountain-stars/400/300",
    season: ["秋", "冬"],
    sustainability_index: "低度開發",
    target_audience: ["情侶", "攝影", "登山"],
    duration: 180,
  },

  // ==================== 2. 山林秘境 ====================
  {
    id: "mountain-001",
    name: "司馬庫斯部落",
    county: "新竹縣尖石鄉",
    category: ["山林秘境"],
    tags: ["神木群", "泰雅族", "雲霧秘境"],
    description: "被譽為「上帝的部落」的泰雅族聖地，擁有全台最大的紅檜巨木群。部落採共同經營制度，是原住民永續觀光的典範。需辦入山證，建議預約導覽深度體驗。",
    price: 3200,
    image: "https://picsum.photos/seed/giant-tree/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "觀光100亮點、部落共同經營",
    target_audience: ["登山", "攝影", "文青"],
    duration: 480,
  },
  {
    id: "mountain-002",
    name: "霧台部落",
    county: "屏東縣霧台鄉",
    category: ["山林秘境"],
    tags: ["魯凱族", "石板屋", "雲海秘境"],
    description: "全台首個原住民自然人文生態景觀區，保存完整的魯凱族石板屋建築。雲霧繚繞的山城景致如詩如畫，是南台灣最具文化深度的部落秘境。",
    price: 2500,
    image: "https://picsum.photos/seed/tribe-village/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "全國首個原住民自然人文生態景觀區",
    target_audience: ["情侶", "文青", "攝影"],
    duration: 300,
  },
  {
    id: "mountain-003",
    name: "鸞山森林博物館",
    county: "台東縣延平鄉",
    category: ["山林秘境"],
    tags: ["布農族", "森林博物館", "阿凡達原鄉"],
    description: "布農族人自籌資金買地護林建立的森林博物館，被稱為「台灣阿凡達」。百年白榕樹盤根錯節的奇景令人讚嘆，是台灣最獨特的族人自主保育成功案例。",
    price: 1800,
    image: "https://picsum.photos/seed/banyan-forest/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "族人買地護林",
    target_audience: ["親子", "情侶", "生態"],
    duration: 180,
  },
  {
    id: "mountain-004",
    name: "眠月線",
    county: "嘉義縣阿里山鄉",
    category: ["山林秘境"],
    tags: ["廢棄鐵道", "秘境攝影", "探險"],
    description: "阿里山最神秘的廢棄鐵道秘境，沿途隧道與橋樑構成獨特的末日美學。每日限額350人，需事先申請入園，是攝影愛好者的朝聖地。",
    price: 1500,
    image: "https://picsum.photos/seed/abandoned-railway/400/300",
    season: ["春", "秋"],
    sustainability_index: "限額管制",
    target_audience: ["攝影", "冒險愛好者"],
    duration: 360,
  },
  {
    id: "mountain-005",
    name: "栗松溫泉",
    county: "台東縣海端鄉",
    category: ["山林秘境"],
    tags: ["野溪溫泉", "秘境探險", "彩色岩壁"],
    description: "被譽為「全台最美野溪溫泉」，翡翠色溫泉水與七彩礦物岩壁構成絕美畫面。需溯溪攀繩才能抵達，是探險家心中的終極秘境。",
    price: 3500,
    image: "https://picsum.photos/seed/hot-spring/400/300",
    season: ["秋", "冬"],
    sustainability_index: "台灣最美野溪溫泉",
    target_audience: ["冒險", "攝影"],
    duration: 420,
  },

  // ==================== 3. 海岸離島 ====================
  {
    id: "ocean-001",
    name: "東清秘境",
    county: "台東縣蘭嶼鄉",
    category: ["海岸離島"],
    tags: ["天然海池", "珊瑚礁秘境", "達悟族"],
    description: "蘭嶼最具代表性的天然海水泳池，被珊瑚礁環繞的湛藍秘境。清澈見底的海水與達悟族傳統拼板舟構成獨特風景，是體驗蘭嶼海洋文化的最佳去處。",
    price: 4500,
    image: "https://picsum.photos/seed/lanyu-ocean/400/300",
    season: ["春", "夏", "秋"],
    sustainability_index: "珊瑚礁保護",
    target_audience: ["情侶", "潛水", "攝影"],
    duration: 240,
  },
  {
    id: "ocean-002",
    name: "東湧燈塔",
    county: "連江縣東引鄉",
    category: ["海岸離島"],
    tags: ["歐式燈塔", "國之北疆", "日落秘境"],
    description: "台灣最北端的國境之塔，歐式純白燈塔佇立於懸崖之上。日落時分的金色光芒照耀海面，是馬祖最浪漫的打卡聖地。東引已獲國際慢城認證。",
    price: 5000,
    image: "https://picsum.photos/seed/lighthouse/400/300",
    season: ["春", "夏", "秋"],
    sustainability_index: "國際慢城認證",
    target_audience: ["攝影", "情侶", "文青"],
    duration: 180,
  },
  {
    id: "ocean-003",
    name: "杉福沙灘",
    county: "屏東縣琉球鄉",
    category: ["海岸離島"],
    tags: ["海龜天堂", "秘境沙灘", "沉船潛點"],
    description: "小琉球最容易遇見海龜的秘境沙灘，海洋保護區內綠蠵龜自在優游。沉船潛點更是潛水愛好者的天堂，是台灣海龜生態旅遊的代表景點。",
    price: 3200,
    image: "https://picsum.photos/seed/turtle-beach/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "海洋保護區",
    target_audience: ["親子", "潛水", "情侶"],
    duration: 180,
  },
  {
    id: "ocean-004",
    name: "綠島藍洞",
    county: "台東縣綠島鄉",
    category: ["海岸離島"],
    tags: ["藍洞秘境", "跳水勝地", "珊瑚礁"],
    description: "綠島最神秘的海蝕洞穴，陽光透過海水折射出夢幻藍光。從洞口一躍而下的跳水體驗刺激難忘，是潛水玩家必訪的台灣藍洞秘境。",
    price: 3800,
    image: "https://picsum.photos/seed/blue-cave/400/300",
    season: ["夏"],
    sustainability_index: "綠島海域保護區",
    target_audience: ["潛水", "冒險", "攝影"],
    duration: 150,
  },
  {
    id: "ocean-005",
    name: "望安網垵口沙灘",
    county: "澎湖縣望安鄉",
    category: ["海岸離島"],
    tags: ["綠蠵龜產卵地", "貝殼沙", "生態保育"],
    description: "澎湖望安島上的綠蠵龜產卵保育區，每年夏季海龜上岸產卵的珍貴生態秘境。細緻的貝殼沙灘與湛藍海水，是澎湖離島最原始純淨的海岸。",
    price: 4200,
    image: "https://picsum.photos/seed/penghu-beach/400/300",
    season: ["春", "夏"],
    sustainability_index: "綠蠵龜保育區",
    target_audience: ["生態", "親子", "攝影"],
    duration: 240,
  },

  // ==================== 4. 文化深度體驗 ====================
  {
    id: "culture-001",
    name: "三峽藍染工坊",
    county: "新北市三峽區",
    category: ["文化深度體驗"],
    tags: ["傳統藍染", "植物染料", "百年技藝"],
    description: "延續三峽百年藍染傳統的工藝體驗工坊，使用在地種植的馬藍提取天然染料。從紮布到浸染的完整體驗，讓你親手創作獨一無二的藍染作品。",
    price: 1600,
    image: "https://picsum.photos/seed/indigo-dye/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "傳統技藝復興",
    target_audience: ["文青", "親子", "情侶"],
    duration: 180,
  },
  {
    id: "culture-002",
    name: "銅門部落山刀工藝",
    county: "花蓮縣秀林鄉",
    category: ["文化深度體驗"],
    tags: ["太魯閣族", "山刀工藝", "獵人文化"],
    description: "太魯閣族傳統山刀鍛造工藝體驗，由部落耆老傳授百年獵人智慧。從選材到鍛打的完整過程，是認識台灣原住民冶金技術的珍貴機會。",
    price: 2800,
    image: "https://picsum.photos/seed/tribe-craft/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "傳統技藝傳承",
    target_audience: ["登山", "冒險", "攝影"],
    duration: 240,
  },
  {
    id: "culture-003",
    name: "芹壁聚落",
    county: "連江縣北竿鄉",
    category: ["文化深度體驗"],
    tags: ["閩東建築", "石頭屋", "海景聚落"],
    description: "被譽為「台灣地中海」的馬祖最美聚落，花崗岩石頭屋依山面海層層堆疊。傍晚時分的金色夕陽灑落聚落，是攝影愛好者的夢幻場景。",
    price: 4800,
    image: "https://picsum.photos/seed/matsu-village/400/300",
    season: ["春", "夏", "秋"],
    sustainability_index: "台灣地中海",
    target_audience: ["攝影", "情侶", "文青"],
    duration: 300,
  },
  {
    id: "culture-004",
    name: "台灣文學基地",
    county: "台北市中正區",
    category: ["文化深度體驗"],
    tags: ["日式老宅", "文學藝術", "城市秘境"],
    description: "隱身台北市區的日式宿舍群，活化為文學主題園區。漫步在老榕樹下的木造建築間，定期舉辦文學展覽與講座，是都市中的文青秘密基地。",
    price: 1500,
    image: "https://picsum.photos/seed/japanese-house/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "文化資產活化",
    target_audience: ["文青", "情侶", "攝影"],
    duration: 120,
  },
  {
    id: "culture-005",
    name: "中興文化創意園區",
    county: "宜蘭縣五結鄉",
    category: ["文化深度體驗"],
    tags: ["產業遺址活化", "文創園區", "廢墟美學"],
    description: "昔日造紙廠蛻變為文創園區，保留工業時代的斑駁牆面與機具遺跡。廢墟美學與當代藝術完美結合，是宜蘭最具特色的文創空間。",
    price: 1500,
    image: "https://picsum.photos/seed/creative-park/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "工業遺產再利用",
    target_audience: ["文青", "親子", "攝影"],
    duration: 150,
  },

  // ==================== 5. 農村慢旅 ====================
  {
    id: "rural-001",
    name: "卓也小屋",
    county: "苗栗縣三義鄉",
    category: ["農村慢旅"],
    tags: ["藍染DIY", "螢火蟲季", "穀倉民宿"],
    description: "苗栗三義的客家藍染工藝聚落，穀倉改建的特色民宿充滿古早味。春季螢火蟲飛舞、秋季柿染體驗，是體驗客庄慢活的最佳去處。",
    price: 3500,
    image: "https://picsum.photos/seed/countryside-house/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "地方創生",
    target_audience: ["情侶", "親子", "文青"],
    duration: 180,
  },
  {
    id: "rural-002",
    name: "君達休閒農場",
    county: "花蓮縣吉安鄉",
    category: ["農村慢旅"],
    tags: ["有機香草", "芳療體驗", "深度療癒"],
    description: "東台灣最具規模的有機香草農場，薰衣草、迷迭香遍布園區。提供專業芳療體驗與香草料理，是身心靈療癒的世外桃源。",
    price: 2600,
    image: "https://picsum.photos/seed/herb-farm/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "有機認證、無毒栽培",
    target_audience: ["情侶", "銀髮", "療癒"],
    duration: 180,
  },
  {
    id: "rural-003",
    name: "新社海梯田",
    county: "花蓮縣豐濱鄉",
    category: ["農村慢旅"],
    tags: ["海梯田", "噶瑪蘭族", "大地藝術節"],
    description: "面向太平洋的壯闊梯田景觀，噶瑪蘭族傳統領域的農耕智慧結晶。每年大地藝術節期間，藝術裝置點綴田間，是最具國際知名度的花東秘境。",
    price: 1800,
    image: "https://picsum.photos/seed/rice-terrace/400/300",
    season: ["夏", "秋"],
    sustainability_index: "原民文化、友善耕作",
    target_audience: ["攝影", "單車", "文青"],
    duration: 120,
  },
  {
    id: "rural-004",
    name: "貢寮和禾水梯田",
    county: "新北市貢寮區",
    category: ["農村慢旅"],
    tags: ["水梯田復育", "里山生態", "和禾米香"],
    description: "北台灣僅存的水梯田復育區，保存傳統貢寮農村的里山地景。田間棲息多種保育類生物，「和禾米」更是友善農耕的代表品牌。",
    price: 2000,
    image: "https://picsum.photos/seed/paddy-ecology/400/300",
    season: ["春", "夏", "秋"],
    sustainability_index: "農村再生、生態復育",
    target_audience: ["生態", "親子", "銀髮"],
    duration: 150,
  },
  {
    id: "rural-005",
    name: "金山八煙聚落",
    county: "新北市金山區",
    category: ["農村慢旅"],
    tags: ["水梯田", "石砌屋", "魚路古道"],
    description: "陽明山腳下的百年石砌聚落，保存完整的水梯田濕地景觀。連接金山與士林的魚路古道經此，是北台灣最具歷史感的農村秘境。",
    price: 1500,
    image: "https://picsum.photos/seed/stone-village/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "水梯田濕地復育",
    target_audience: ["登山", "攝影", "文青"],
    duration: 180,
  },

  // ==================== 6. 都市邊緣秘境 ====================
  {
    id: "urban-001",
    name: "0KM山物所",
    county: "台北市大安區",
    category: ["都市邊緣秘境"],
    tags: ["預約制", "和式老屋", "城市綠洲"],
    description: "隱身台北市區的日式老屋秘境，需預約才能進入的城市森林。結合植栽選物與老建築美學，是都市人逃離喧囂的午後療癒空間。",
    price: 1800,
    image: "https://picsum.photos/seed/japanese-garden/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "需事先預約",
    target_audience: ["文青", "情侶", "攝影"],
    duration: 90,
  },
  {
    id: "urban-002",
    name: "審計新村",
    county: "台中市西區",
    category: ["都市邊緣秘境"],
    tags: ["眷村改造", "文創聚落", "假日市集"],
    description: "台中最具代表性的眷村活化案例，老宿舍群蛻變為青年創業文創基地。週末市集匯聚在地品牌，是中部文青的聚集地。",
    price: 1500,
    image: "https://picsum.photos/seed/creative-market/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "青年創業基地",
    target_audience: ["文青", "情侶", "攝影"],
    duration: 120,
  },
  {
    id: "urban-003",
    name: "金馬賓館當代美術館",
    county: "高雄市鼓山區",
    category: ["都市邊緣秘境"],
    tags: ["軍事建築活化", "當代藝術", "高端午茶"],
    description: "昔日金門馬祖阿兵哥返台必經的軍事賓館，華麗轉身為當代美術館。保留軍事建築的肅穆感，結合國際級藝術展覽與精緻餐飲。",
    price: 2500,
    image: "https://picsum.photos/seed/art-museum/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "歷史建築再利用",
    target_audience: ["文青", "藝術", "情侶"],
    duration: 150,
  },
  {
    id: "urban-004",
    name: "窄門咖啡館",
    county: "台南市中西區",
    category: ["都市邊緣秘境"],
    tags: ["百年老屋", "窄門入口", "歷史空間"],
    description: "台南最具傳奇性的老屋咖啡館，僅容一人側身通過的窄門入口。穿越時光走進百年老宅，品嚐咖啡的同時感受府城的歷史底蘊。",
    price: 1600,
    image: "https://picsum.photos/seed/vintage-cafe/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "台南經典老屋咖啡",
    target_audience: ["文青", "攝影", "情侶"],
    duration: 90,
  },
  {
    id: "urban-005",
    name: "台灣花磚博物館",
    county: "嘉義市西區",
    category: ["都市邊緣秘境"],
    tags: ["花磚保存", "日式老建築", "文化傳承"],
    description: "搶救台灣即將消失的彩瓷花磚文化，創辦人二十年來從老屋拆除現場救回上千片珍貴花磚。每一片花磚都是台灣百年工藝的見證。",
    price: 1500,
    image: "https://picsum.photos/seed/tile-museum/400/300",
    season: ["春", "夏", "秋", "冬"],
    sustainability_index: "文化資產搶救保存",
    target_audience: ["文青", "文化", "攝影"],
    duration: 120,
  },
];

// Category labels for UI
export const CATEGORY_CONFIG: Record<SpotCategory, { label: string; color: string; icon: string }> = {
  '綠色永續景點': { label: '綠色永續', color: 'bg-emerald-500', icon: '🌱' },
  '山林秘境': { label: '山林秘境', color: 'bg-green-600', icon: '🏔️' },
  '海岸離島': { label: '海岸離島', color: 'bg-blue-500', icon: '🏝️' },
  '文化深度體驗': { label: '文化體驗', color: 'bg-amber-500', icon: '🎭' },
  '農村慢旅': { label: '農村慢旅', color: 'bg-yellow-600', icon: '🌾' },
  '都市邊緣秘境': { label: '都市秘境', color: 'bg-purple-500', icon: '🏙️' },
};

// ============================================
// Store State & Actions
// ============================================

interface ItineraryBuilderState {
  // Current itinerary being edited
  currentPlan: ItineraryPlan | null;

  // Resource library filter
  searchQuery: string;
  categoryFilter: SpotCategory | 'all';
  seasonFilter: SeasonType;
  audienceFilter: string[]; // e.g., ['親子', '文青', '情侶']

  // UI state
  isDragging: boolean;
  activeDragId: string | null;

  // Saved itineraries
  savedPlans: ItineraryPlan[];
}

interface ItineraryBuilderActions {
  // Plan management
  createNewPlan: (name: string, destination: string, days: number) => void;
  loadPlan: (planId: string) => void;
  savePlan: (changes?: string) => void;
  deletePlan: (planId: string) => void;
  updatePlanInfo: (updates: Partial<Pick<ItineraryPlan, 'name' | 'destination' | 'startDate' | 'endDate'>>) => void;
  loadVersion: (version: number) => void; // 載入特定版本

  // Day management
  addDay: () => void;
  removeDay: (dayId: string) => void;
  updateDayTitle: (dayId: string, title: string) => void;

  // Spot management
  addSpotToDay: (dayId: string, spot: Spot, index?: number) => void;
  removeSpotFromDay: (dayId: string, instanceId: string) => void;
  moveSpot: (fromDayId: string, toDayId: string, instanceId: string, newIndex: number) => void;
  reorderSpots: (dayId: string, fromIndex: number, toIndex: number) => void;
  updateSpotTime: (dayId: string, instanceId: string, startTime: string) => void;
  updateSpotNotes: (dayId: string, instanceId: string, notes: string) => void;

  // Filter & search
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: SpotCategory | 'all') => void;
  setSeasonFilter: (season: SeasonType) => void;
  setAudienceFilter: (audiences: string[]) => void;

  // DnD state
  setDragging: (isDragging: boolean, activeId?: string | null) => void;

  // Utilities
  getDayTotalDuration: (dayId: string) => number;
  getFilteredSpots: () => Spot[];
  clearCurrentPlan: () => void;
}

type ItineraryBuilderStore = ItineraryBuilderState & ItineraryBuilderActions;

// ============================================
// Store Implementation
// ============================================

const generateId = () => Math.random().toString(36).substring(2, 11);

const createEmptyDay = (dayNumber: number): DayPlan => ({
  id: `day_${generateId()}`,
  dayNumber,
  title: `第 ${dayNumber} 天`,
  spots: [],
});

export const useItineraryBuilderStore = create<ItineraryBuilderStore>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPlan: null,
      searchQuery: '',
      categoryFilter: 'all',
      seasonFilter: 'all',
      audienceFilter: [],
      isDragging: false,
      activeDragId: null,
      savedPlans: [],

      // Plan management
      createNewPlan: (name, destination, days) => {
        const now = new Date().toISOString();
        const newPlan: ItineraryPlan = {
          id: `plan_${generateId()}`,
          name,
          destination,
          startDate: '',
          endDate: '',
          days: Array.from({ length: days }, (_, i) => createEmptyDay(i + 1)),
          createdAt: now,
          updatedAt: now,
        };
        set({ currentPlan: newPlan });
      },

      loadPlan: (planId) => {
        const { savedPlans } = get();
        const plan = savedPlans.find(p => p.id === planId);
        if (plan) {
          set({ currentPlan: { ...plan } });
        }
      },

      savePlan: (changes?: string) => {
        const { currentPlan, savedPlans } = get();
        if (!currentPlan) return;

        const now = new Date().toISOString();
        const currentVersion = currentPlan.current_version || 0;
        const newVersion = currentVersion + 1;

        // 創建版本記錄
        const versionRecord: ItineraryVersion = {
          version: newVersion,
          created_at: now,
          created_by: '系統管理員', // TODO: 從認證系統取得
          changes: changes || '行程更新',
          itinerary_data: {
            days: JSON.parse(JSON.stringify(currentPlan.days)), // 深拷貝
            destination: currentPlan.destination,
            startDate: currentPlan.startDate,
            endDate: currentPlan.endDate,
          },
        };

        const updatedPlan: ItineraryPlan = {
          ...currentPlan,
          updatedAt: now,
          current_version: newVersion,
          versions: [...(currentPlan.versions || []), versionRecord],
        };

        const existingIndex = savedPlans.findIndex(p => p.id === currentPlan.id);
        const newSavedPlans = existingIndex >= 0
          ? savedPlans.map((p, i) => i === existingIndex ? updatedPlan : p)
          : [...savedPlans, updatedPlan];

        set({
          currentPlan: updatedPlan,
          savedPlans: newSavedPlans,
        });
      },

      deletePlan: (planId) => {
        const { savedPlans, currentPlan } = get();
        set({
          savedPlans: savedPlans.filter(p => p.id !== planId),
          currentPlan: currentPlan?.id === planId ? null : currentPlan,
        });
      },

      updatePlanInfo: (updates) => {
        const { currentPlan } = get();
        if (!currentPlan) return;
        set({
          currentPlan: {
            ...currentPlan,
            ...updates,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      loadVersion: (version) => {
        const { currentPlan } = get();
        if (!currentPlan || !currentPlan.versions) return;
        
        const versionData = currentPlan.versions.find(v => v.version === version);
        if (versionData) {
          set({
            currentPlan: {
              ...currentPlan,
              days: JSON.parse(JSON.stringify(versionData.itinerary_data.days)),
              destination: versionData.itinerary_data.destination,
              startDate: versionData.itinerary_data.startDate,
              endDate: versionData.itinerary_data.endDate,
            },
          });
        }
      },

      // Day management
      addDay: () => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const newDayNumber = currentPlan.days.length + 1;
        set({
          currentPlan: {
            ...currentPlan,
            days: [...currentPlan.days, createEmptyDay(newDayNumber)],
            updatedAt: new Date().toISOString(),
          },
        });
      },

      removeDay: (dayId) => {
        const { currentPlan } = get();
        if (!currentPlan || currentPlan.days.length <= 1) return;

        const filteredDays = currentPlan.days
          .filter(d => d.id !== dayId)
          .map((d, i) => ({ ...d, dayNumber: i + 1, title: `第 ${i + 1} 天` }));

        set({
          currentPlan: {
            ...currentPlan,
            days: filteredDays,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateDayTitle: (dayId, title) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d =>
              d.id === dayId ? { ...d, title } : d
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Spot management
      addSpotToDay: (dayId, spot, index) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        const scheduledSpot: ScheduledSpot = {
          ...spot,
          instanceId: `inst_${generateId()}`,
        };

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d => {
              if (d.id !== dayId) return d;
              const newSpots = [...d.spots];
              if (index !== undefined && index >= 0) {
                newSpots.splice(index, 0, scheduledSpot);
              } else {
                newSpots.push(scheduledSpot);
              }
              return { ...d, spots: newSpots };
            }),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      removeSpotFromDay: (dayId, instanceId) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d =>
              d.id === dayId
                ? { ...d, spots: d.spots.filter(s => s.instanceId !== instanceId) }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      moveSpot: (fromDayId, toDayId, instanceId, newIndex) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        let movedSpot: ScheduledSpot | null = null;

        // Find and remove from source
        const daysAfterRemove = currentPlan.days.map(d => {
          if (d.id !== fromDayId) return d;
          const spotIndex = d.spots.findIndex(s => s.instanceId === instanceId);
          if (spotIndex === -1) return d;
          movedSpot = d.spots[spotIndex];
          return {
            ...d,
            spots: d.spots.filter(s => s.instanceId !== instanceId),
          };
        });

        if (!movedSpot) return;

        // Add to destination
        const daysAfterAdd = daysAfterRemove.map(d => {
          if (d.id !== toDayId) return d;
          const newSpots = [...d.spots];
          newSpots.splice(newIndex, 0, movedSpot!);
          return { ...d, spots: newSpots };
        });

        set({
          currentPlan: {
            ...currentPlan,
            days: daysAfterAdd,
            updatedAt: new Date().toISOString(),
          },
        });
      },

      reorderSpots: (dayId, fromIndex, toIndex) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d => {
              if (d.id !== dayId) return d;
              const newSpots = [...d.spots];
              const [removed] = newSpots.splice(fromIndex, 1);
              newSpots.splice(toIndex, 0, removed);
              return { ...d, spots: newSpots };
            }),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateSpotTime: (dayId, instanceId, startTime) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d =>
              d.id === dayId
                ? {
                    ...d,
                    spots: d.spots.map(s =>
                      s.instanceId === instanceId
                        ? { ...s, startTime }
                        : s
                    ),
                  }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      updateSpotNotes: (dayId, instanceId, notes) => {
        const { currentPlan } = get();
        if (!currentPlan) return;

        set({
          currentPlan: {
            ...currentPlan,
            days: currentPlan.days.map(d =>
              d.id === dayId
                ? {
                    ...d,
                    spots: d.spots.map(s =>
                      s.instanceId === instanceId
                        ? { ...s, notes }
                        : s
                    ),
                  }
                : d
            ),
            updatedAt: new Date().toISOString(),
          },
        });
      },

      // Filter & search
      setSearchQuery: (query) => set({ searchQuery: query }),
      setCategoryFilter: (category) => set({ categoryFilter: category }),
      setSeasonFilter: (season) => set({ seasonFilter: season }),
      setAudienceFilter: (audiences) => set({ audienceFilter: audiences }),

      // DnD state
      setDragging: (isDragging, activeId = null) => set({
        isDragging,
        activeDragId: activeId,
      }),

      // Utilities
      getDayTotalDuration: (dayId) => {
        const { currentPlan } = get();
        if (!currentPlan) return 0;
        const day = currentPlan.days.find(d => d.id === dayId);
        if (!day) return 0;
        return day.spots.reduce((sum, spot) => sum + spot.duration, 0);
      },

      getFilteredSpots: () => {
        const { searchQuery, categoryFilter, seasonFilter, audienceFilter } = get();
        let filtered = MOCK_SPOTS;

        // Category filtering (category is now an array)
        if (categoryFilter !== 'all') {
          filtered = filtered.filter(s => s.category.includes(categoryFilter));
        }

        // Season filtering (season is now an array like ['春', '夏'])
        if (seasonFilter !== 'all') {
          filtered = filtered.filter(s => {
            // If spot has no season data, show it for all filters
            if (!s.season || s.season.length === 0) return true;
            // If has all 4 seasons, it's year-round
            if (s.season.length === 4) return true;

            switch (seasonFilter) {
              case 'spring':
                return s.season.includes('春');
              case 'summer':
                return s.season.includes('夏');
              case 'autumn':
                return s.season.includes('秋');
              case 'winter':
                return s.season.includes('冬');
              default:
                return true;
            }
          });
        }

        // Audience filtering (check if any selected audience matches)
        if (audienceFilter.length > 0) {
          filtered = filtered.filter(s =>
            s.target_audience.some(audience => audienceFilter.includes(audience))
          );
        }

        // Search query filtering
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(s =>
            s.name.toLowerCase().includes(query) ||
            s.county.toLowerCase().includes(query) ||
            s.tags.some(t => t.toLowerCase().includes(query)) ||
            s.target_audience.some(a => a.toLowerCase().includes(query))
          );
        }

        return filtered;
      },

      clearCurrentPlan: () => set({ currentPlan: null }),
    }),
    {
      name: 'itinerary-builder-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        savedPlans: state.savedPlans,
        // Don't persist: currentPlan (to avoid stale editing state), filters, drag state
      }),
      version: 1,
    }
  )
);

// ============================================
// Selector Hooks
// ============================================

export const useCurrentPlan = () =>
  useItineraryBuilderStore((state) => state.currentPlan);

export const useDays = () =>
  useItineraryBuilderStore((state) => state.currentPlan?.days ?? []);

export const useFilteredSpots = () =>
  useItineraryBuilderStore((state) => state.getFilteredSpots());

export const useDragState = () =>
  useItineraryBuilderStore((state) => ({
    isDragging: state.isDragging,
    activeDragId: state.activeDragId,
  }));
