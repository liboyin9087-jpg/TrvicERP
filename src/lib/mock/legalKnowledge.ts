interface LegalKnowledgeDetail {
  point: string;
  subPoints?: string[];
}

interface LegalKnowledgeSection {
  heading: string;
  details: (string | LegalKnowledgeDetail)[];
}

interface LegalKnowledgeEntry {
  id: string; // Unique identifier, often matching the key in the top-level object
  title: string; // A concise title for the knowledge piece
  summary: string; // A brief summary of the knowledge
  category: string; // Categorization for better organization and filtering
  sections?: LegalKnowledgeSection[]; // Detailed breakdown for complex topics
}

export const LEGAL_KNOWLEDGE: Record<string, LegalKnowledgeEntry> = {
  // --- 首次申請護照親辦一站式服務 (2024/10 最新細則) ---
  PASSPORT_FIRST_TIME: {
    id: 'PASSPORT_FIRST_TIME',
    title: '首次申請護照親辦一站式服務',
    summary: '首次申請護照親辦（一站式服務）詳細規範，包含適用對象、應備文件、規費、流程、時效與注意事項。',
    category: '護照與出入境',
    sections: [
      {
        heading: '1. 適用對象',
        details: [
          '在臺設有戶籍國民，且為「首次申請」（從未領過護照）。'
        ]
      },
      {
        heading: '2. 應備文件與規費表',
        details: [
          {
            point: '滿 18 歲以上',
            subPoints: ['身分證正本、照片2張。', '規費 1,300 元。']
          },
          {
            point: '滿 14 歲至未滿 18 歲',
            subPoints: ['身分證正本、照片2張、法定代理人身分證及同意書。', '規費 1,300 元。']
          },
          {
            point: '未滿 14 歲',
            subPoints: ['照片2張、法定代理人身分證及同意書。', '戶所會產生電子戶籍謄本，無須備戶口名簿。', '規費 900 元。']
          },
          {
            point: '受監護宣告',
            subPoints: ['監護人陪同或委任，檢附相關證件。', '規費 1,300 元。']
          }
        ]
      },
      {
        heading: '3. 關鍵流程與時效',
        details: [
          '繳費期限：送件後 7 天內 須至五大超商(7-11/全家/萊爾富/OK/美廉社)、郵局或農漁會繳款。',
          '製發時間：自繳費起 14 個工作天 領照。',
          '手續費：每筆另付 15 元通路手續費。'
        ]
      },
      {
        heading: '4. 領照方式',
        details: [
          '途徑 A：至原戶所領取。',
          {
            point: '途徑 B：郵寄至指定地址',
            subPoints: ['快遞費：同縣市 110 元、不同縣市 150 元、離島 170 元。']
          }
        ]
      },
      {
        heading: '5. 注意事項',
        details: [
          '一站式服務不適用急件。急件須親至領務局辦理。'
        ]
      }
    ]
  },

  // --- 國際航空與公約 ---
  WARSAW_CONVENTION: {
    id: 'WARSAW_CONVENTION',
    title: '華沙公約 (1929)',
    summary: '適用於所有以航空器運送旅客、行李或貨物之國際運輸，責任限額採法郎制。',
    category: '國際航空與公約'
  },

  MONTREAL_CONVENTION: {
    id: 'MONTREAL_CONVENTION',
    title: '1999 年蒙特利爾公約 (MC99)',
    summary: '規定了國際航空運輸中旅客、行李和貨物的損害賠償責任限額。',
    category: '國際航空與公約',
    sections: [
      {
        heading: '2024 最新責任限額 (2024/12/28 生效)',
        details: [
          '死亡/傷害：151,880 SDR。',
          '運輸延誤：6,303 SDR。',
          '行李損毀/遺失：1,519 SDR。'
        ]
      }
    ]
  },

  // --- 消費者保護 ---
  CONSUMER_PROTECTION: {
    id: 'CONSUMER_PROTECTION',
    title: '消費者保護法',
    summary: '提供合理審閱期，疑義時應為有利於消費者之解釋，保護消費者權益。',
    category: '法律與條例'
  },

  // --- 專業人員規範 ---
  PROFESSIONAL_STAFF: {
    id: 'PROFESSIONAL_STAFF',
    title: '導遊領隊規則',
    summary: '導遊領隊須佩掛執業證。發生意外須於24小時內報備。',
    category: '專業人員規範'
  },

  // --- 旅館業管理 ---
  HOTEL_MANAGEMENT: {
    id: 'HOTEL_MANAGEMENT',
    title: '旅館業管理',
    summary: '旅館業需登記旅客個資並保存半年。房價須置於客房明顯處。',
    category: '旅館業與住宿'
  },

  // --- 保險相關 ---
  AUTO_INSURANCE: {
    id: 'AUTO_INSURANCE',
    title: '強制汽車責任保險法',
    summary: '受害人請求權時效為2年。',
    category: '保險與契約'
  },

  INSURANCE_TERMS: {
    id: 'INSURANCE_TERMS',
    title: '旅行業責任保險',
    summary: '承保意外致傷害、失能或死亡，含必要醫療費用，為旅客提供保障。',
    category: '保險與契約'
  },

  // --- 旅遊契約 ---
  TRAVEL_CONTRACT: {
    id: 'TRAVEL_CONTRACT',
    title: '國外旅遊定型化契約',
    summary: '若領隊違規未派，賠償每日1,500元之3倍。',
    category: '保險與契約'
  },

  DOMESTIC_TRAVEL_CONTRACT: {
    id: 'DOMESTIC_TRAVEL_CONTRACT',
    title: '國內旅遊定型化契約',
    summary: '棄置旅客須賠償5倍違約金。',
    category: '保險與契約'
  }
};