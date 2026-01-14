interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
}

export const getWeatherByLocation = async (lat: number, lon: number): Promise<WeatherData> => {
  // 這是一個模擬函數，實際使用時需要替換為真正的天氣 API
  return {
    temperature: Math.floor(Math.random() * 35) + 5,
    condition: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 100),
    windSpeed: Math.floor(Math.random() * 20) + 1
  };
};

export const getWeatherByCity = async (city: string): Promise<WeatherData> => {
  // 這是一個模擬函數，實際使用時需要替換為真正的天氣 API
  return {
    temperature: Math.floor(Math.random() * 35) + 5,
    condition: ['sunny', 'cloudy', 'rainy', 'partly-cloudy'][Math.floor(Math.random() * 4)],
    humidity: Math.floor(Math.random() * 100),
    windSpeed: Math.floor(Math.random() * 20) + 1
  };
};
