export const weatherService = {
  async getCurrentForecast(city: string) {
    const API_KEY = import.meta.env.VITE_CWA_API_KEY;
    
    // 1. 先統一轉成繁體「臺」
    let name = city.replace(/台/g, '臺');
    
    // 2. 移除使用者可能已經輸入的「縣」或「市」，方便統一處理
    name = name.replace(/[縣市]/g, '');

    // 3. 定義台灣的「市」列表 (6都 + 3省轄市)
    const cityList = [
      '臺北', '新北', '桃園', '臺中', '臺南', '高雄', // 六都
      '基隆', '新竹', '嘉義' // 省轄市
    ];

    // 4. 判斷邏輯：如果在市列表內加「市」，否則加「縣」
    // (注意：這裡假設輸入「嘉義」預設查「嘉義市」，輸入「新竹」預設查「新竹市」)
    let formattedCity = '';
    if (cityList.includes(name)) {
      formattedCity = name + '市';
    } else if (name === '金門' || name === '連江') {
        formattedCity = name + '縣'; 
    } else {
        formattedCity = name + '縣'; // 宜蘭、花蓮、臺東、彰化、南投、雲林、屏東...
    }

    const url = `https://opendata.cwa.gov.tw/api/v1/rest/datastore/F-C0032-001?Authorization=${API_KEY}&locationName=${encodeURIComponent(formattedCity)}`;
    
    try {
      const res = await fetch(url);
      const data = await res.json();
      
      // 檢查是否成功取得 location
      const location = data.records?.location?.[0];
      if (!location) {
        console.warn(`找不到氣象資料: ${formattedCity}`);
        return null;
      }

      const wx = location.weatherElement.find((e: any) => e.elementName === 'Wx').time[0].parameter.parameterName;
      const pop = location.weatherElement.find((e: any) => e.elementName === 'PoP').time[0].parameter.parameterName;
      const maxT = location.weatherElement.find((e: any) => e.elementName === 'MaxT').time[0].parameter.parameterName;
      
      return { 
        condition: wx, 
        rainProb: pop, 
        temp: maxT,
        city: formattedCity // 回傳校正後的縣市名
      };
    } catch (error) {
      console.error('Weather API Error:', error);
      return null;
    }
  }
};