let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const getAuthToken = async () => {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', import.meta.env.VITE_TDX_CLIENT_ID);
  params.append('client_secret', import.meta.env.VITE_TDX_CLIENT_SECRET);
  try {
    const res = await fetch('https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const data = await res.json();
    cachedToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return cachedToken;
  } catch (error) {
    console.error('TDX Auth Failed:', error);
    return null;
  }
};

const fetchWithAuth = async (url: string) => {
  const token = await getAuthToken();
  if (!token) throw new Error('無法取得 TDX Token');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

export const tdxService = {
  // 搜尋景點 (TDX 觀光 API)
  async searchSpots(keyword: string = '') {
    // 篩選：有圖片且有名稱
    let filter = "Picture/PictureUrl1 ne null";
    if (keyword) filter += ` and contains(ScenicSpotName, '${keyword}')`;
    
    // 抓取欄位包含 Position (座標) 與 Address (地址)
    const url = `https://tdx.transportdata.tw/api/basic/v2/Tourism/ScenicSpot?$filter=${encodeURIComponent(filter)}&$top=30&$format=JSON`;
    
    const data = await fetchWithAuth(url);
    
    return data.map((item: any) => ({
      id: item.ScenicSpotID,
      name: item.ScenicSpotName,
      category: ['文化深度體驗'], // 若需自動分類，可依據 item.Class1 判斷
      county: item.Address?.substring(0, 3) || '台灣',
      // 將 TDX 資料對應到新的 location 結構
      location: {
        lat: item.Position?.PositionLat || 23.5,
        lng: item.Position?.PositionLon || 121.0,
        address: item.Address || item.City + item.ScenicSpotName
      },
      duration: 90, // 預設 1.5 小時
      description: item.DescriptionDetail || item.Description,
      image: item.Picture.PictureUrl1,
      price: item.TicketInfo ? 100 : 0,
      tags: [item.Class1, item.Class2].filter(Boolean),
      season: ['春', '夏', '秋', '冬'],
      target_audience: ['大眾']
    }));
  },
  // 查詢台鐵時刻
  async getTRATimetable(date: string, originId: string, destId: string) {
    const url = `https://tdx.transportdata.tw/api/basic/v2/Rail/TRA/DailyTimetable/OD/${originId}/to/${destId}/${date}?$format=JSON`;
    return fetchWithAuth(url);
  }
};
