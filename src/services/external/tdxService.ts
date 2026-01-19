import { z } from 'zod';

interface TdxAuthResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface Position {
  PositionLat: number;
  PositionLon: number;
}

interface Picture {
  PictureUrl1: string;
  PictureUrl2?: string;
  PictureUrl3?: string;
}

interface ScenicSpotItem {
  ScenicSpotID: string;
  ScenicSpotName: string;
  Class1?: string;
  Class2?: string;
  Class3?: string;
  Description?: string;
  DescriptionDetail?: string;
  Address?: string;
  City?: string;
  Position?: Position;
  Picture: Picture;
  TicketInfo?: string;
}

interface ScenicSpotResponse {
  id: string;
  name: string;
  category: string[];
  county: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  duration: number;
  description: string | undefined;
  image: string;
  price: number;
  tags: string[];
  season: string[];
  target_audience: string[];
}

interface TrainTimetableResponse {
  DailyTrainInfo: {
    TrainNo: string;
    StartingStationID: string;
    StartingStationName: {
      Zh_tw: string;
      En: string;
    };
    EndingStationID: string;
    EndingStationName: {
      Zh_tw: string;
      En: string;
    };
  };
  OriginStopTime: {
    StopSequence: number;
    StationID: string;
    StationName: {
      Zh_tw: string;
      En: string;
    };
    ArrivalTime: string;
    DepartureTime: string;
  };
  DestinationStopTime: {
    StopSequence: number;
    StationID: string;
    StationName: {
      Zh_tw: string;
      En: string;
    };
    ArrivalTime: string;
    DepartureTime: string;
  };
}

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const getAuthToken = async (): Promise<string | null> => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  // 使用環境變數或預設值（生產環境建議使用環境變數）
  params.append('client_id', import.meta.env.VITE_TDX_CLIENT_ID || 'liboyin9087-96e69e28-fb9e-4c25');
  params.append('client_secret', import.meta.env.VITE_TDX_CLIENT_SECRET || '4c94f8a3-5896-48b7-8a4f-bc67c6924959');

  try {
    const res = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });

    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const data: TdxAuthResponse = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('TDX Auth Failed:', error);
    return null;
  }
};

const fetchWithAuth = async <T>(url: string): Promise<T> => {
  const token = await getAuthToken();
  if (!token) throw new Error('無法取得 TDX Token');

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

  return res.json() as Promise<T>;
};

const scenicSpotSchema = z.object({
  ScenicSpotID: z.string(),
  ScenicSpotName: z.string(),
  Class1: z.string().optional(),
  Class2: z.string().optional(),
  Class3: z.string().optional(),
  Description: z.string().optional(),
  DescriptionDetail: z.string().optional(),
  Address: z.string().optional(),
  City: z.string().optional(),
  Position: z.object({
    PositionLat: z.number(),
    PositionLon: z.number()
  }).optional(),
  Picture: z.object({
    PictureUrl1: z.string()
  }),
  TicketInfo: z.string().optional()
}).array();

export const tdxService = {
  async searchSpots(keyword: string = ''): Promise<ScenicSpotResponse[]> {
    let filter = "Picture/PictureUrl1 ne null";
    if (keyword) filter += ` and contains(ScenicSpotName, '${keyword}')`;
    
    const url = `https://tdx.transportdata.tw/api/basic/v2/Tourism/ScenicSpot?$filter=${encodeURIComponent(filter)}&$top=30&$format=JSON`;
    
    try {
      const data = await fetchWithAuth<ScenicSpotItem[]>(url);
      const validatedData = scenicSpotSchema.parse(data);

      return validatedData.map((item) => ({
        id: item.ScenicSpotID,
        name: item.ScenicSpotName,
        category: ['文化深度體驗'],
        county: item.Address?.substring(0, 3) || '台灣',
        location: {
          lat: item.Position?.PositionLat || 23.5,
          lng: item.Position?.PositionLon || 121.0,
          address: item.Address || `${item.City || ''}${item.ScenicSpotName}`
        },
        duration: 90,
        description: item.DescriptionDetail || item.Description,
        image: item.Picture.PictureUrl1,
        price: item.TicketInfo ? 100 : 0,
        tags: [item.Class1, item.Class2].filter((tag): tag is string => !!tag),
        season: ['春', '夏', '秋', '冬'],
        target_audience: ['大眾']
      }));
    } catch (error) {
      console.error('Failed to fetch scenic spots:', error);
      throw new Error('取得景點資料失敗');
    }
  },

  async getTRATimetable(date: string, originId: string, destId: string): Promise<TrainTimetableResponse[]> {
    const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${originId}/to/${destId}/${date}?$format=JSON`;
    try {
      return await fetchWithAuth<TrainTimetableResponse[]>(url);
    } catch (error) {
      console.error('Failed to fetch train timetable:', error);
      throw new Error('取得台鐵時刻表失敗');
    }
  }
};