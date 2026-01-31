"""
Taiwan Government Open API Clients
台灣政府開放資料 API 客戶端

1. 觀光局 Tourism Bureau API — 景點、旅館、活動、餐廳
2. 中央氣象署 CWA API — 天氣預報、特報
3. TDX 交通部公共運輸 API — 高鐵、台鐵、客運、航班

注意：TDX 和氣象署需要申請 API Key，觀光局可直接使用
- TDX: https://tdx.transportdata.tw/ 註冊取得 Client ID + Secret
- CWA: https://opendata.cwa.gov.tw/ 註冊取得 Authorization Key
"""
import os
import time
import json
import logging
from typing import Optional
from dataclasses import dataclass, field, asdict
from datetime import datetime

from scrapers.base import BaseScraper

logger = logging.getLogger(__name__)


# ============ Data Models ============

@dataclass
class TourismSpot:
    """觀光景點"""
    name: str
    spot_id: str = ""
    description: str = ""
    address: str = ""
    city: str = ""
    district: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str = ""
    open_time: str = ""
    website: str = ""
    picture_urls: list[str] = field(default_factory=list)
    travel_info: str = ""          # 交通資訊
    category: str = ""             # 分類
    tags: list[str] = field(default_factory=list)
    source: str = "tourism_bureau"


@dataclass
class TourismHotel:
    """觀光局登記旅館"""
    name: str
    hotel_id: str = ""
    address: str = ""
    city: str = ""
    district: str = ""
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    phone: str = ""
    fax: str = ""
    star_rating: Optional[float] = None
    room_count: int = 0
    description: str = ""
    website: str = ""
    picture_urls: list[str] = field(default_factory=list)
    facilities: list[str] = field(default_factory=list)
    property_class: str = ""       # 旅館類別: 觀光旅館/一般旅館/民宿
    source: str = "tourism_bureau"


@dataclass
class WeatherForecast:
    """天氣預報"""
    location: str
    start_time: str
    end_time: str
    weather_description: str = ""
    min_temp: Optional[float] = None
    max_temp: Optional[float] = None
    rain_probability: Optional[int] = None  # 降雨機率 %
    comfort: str = ""
    wind_speed: str = ""
    humidity: str = ""
    uvi: Optional[float] = None       # 紫外線指數
    source: str = "cwa"


@dataclass
class WeatherAlert:
    """天氣特報"""
    title: str
    content: str = ""
    alert_type: str = ""       # 豪雨、颱風、高溫等
    affected_areas: list[str] = field(default_factory=list)
    issued_time: str = ""
    valid_until: str = ""
    severity: str = ""         # 大雨/豪雨/大豪雨/超大豪雨
    source: str = "cwa"


@dataclass
class TrainSchedule:
    """高鐵/台鐵時刻"""
    train_type: str             # THSR (高鐵) / TRA (台鐵)
    train_number: str
    departure_station: str
    arrival_station: str
    departure_time: str
    arrival_time: str
    duration_minutes: int = 0
    train_class: str = ""       # 自強/莒光/區間/...
    via_stations: list[str] = field(default_factory=list)
    operating_days: list[str] = field(default_factory=list)
    has_reserved_seat: bool = True
    source: str = "tdx"


@dataclass
class BusRoute:
    """客運路線"""
    route_name: str
    operator: str = ""
    departure_stop: str = ""
    arrival_stop: str = ""
    frequency: str = ""         # 班次間隔描述
    duration_minutes: int = 0
    route_type: str = ""        # 國道客運/市區公車/...
    stops: list[str] = field(default_factory=list)
    source: str = "tdx"


@dataclass
class DomesticFlight:
    """國內航班 (TDX)"""
    airline_name: str
    airline_id: str = ""
    flight_number: str = ""
    departure_airport: str = ""
    arrival_airport: str = ""
    departure_time: str = ""
    arrival_time: str = ""
    operating_days: list[str] = field(default_factory=list)
    source: str = "tdx"


# ============ Tourism Bureau API ============

class TourismBureauAPI(BaseScraper):
    """
    交通部觀光署 Tourism Bureau Open API
    https://tdx.transportdata.tw/api-service/swagger/basic/268fc230-2e04-471b-a728-a726dc1f3ac8

    免費使用，不需要 API Key (但有 rate limit)
    提供：景點、旅館、餐廳、活動等觀光資料
    """

    BASE_URL = "https://tdx.transportdata.tw/api/basic"
    TOURISM_BASE = "https://tdx.transportdata.tw/api/basic/v2/Tourism"

    def __init__(self, client_id: str = "", client_secret: str = ""):
        super().__init__(min_delay=1.0, max_delay=2.0)
        self.client_id = client_id or os.environ.get("TDX_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("TDX_CLIENT_SECRET", "")
        self._access_token = ""
        self._token_expiry = 0.0

        if self.client_id and self.client_secret:
            self._get_token()

    def _get_token(self):
        """取得 TDX access token"""
        url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        try:
            resp = self.session.post(url, data=data, timeout=10)
            resp.raise_for_status()
            result = resp.json()
            self._access_token = result.get("access_token", "")
            expires_in = result.get("expires_in", 86400)
            self._token_expiry = time.time() + expires_in - 60
            logger.info("TDX token acquired")
        except Exception as e:
            logger.warning(f"TDX token acquisition failed: {e}")

    def _get_auth_headers(self) -> dict:
        """取得認證 headers"""
        if self._access_token and time.time() < self._token_expiry:
            return {"Authorization": f"Bearer {self._access_token}"}
        elif self.client_id:
            self._get_token()
            if self._access_token:
                return {"Authorization": f"Bearer {self._access_token}"}
        return {}

    def scrape(self, **kwargs):
        """主要入口"""
        return self.get_scenic_spots()

    def get_scenic_spots(self, city: Optional[str] = None,
                         top: int = 100) -> list[TourismSpot]:
        """
        取得觀光景點

        Args:
            city: 城市名（英文），如 "Taipei", "Hualien"。None = 全台
            top: 最多筆數
        """
        if city:
            url = f"{self.TOURISM_BASE}/ScenicSpot/{city}"
        else:
            url = f"{self.TOURISM_BASE}/ScenicSpot"

        params = {
            "$top": str(top),
            "$format": "JSON",
        }

        try:
            resp = self.get(url, params=params, extra_headers=self._get_auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"景點 API 失敗: {e}")
            return []

        spots = []
        items = data if isinstance(data, list) else data.get("ScenicSpots", data.get("value", []))
        for item in items:
            spot = TourismSpot(
                name=item.get("ScenicSpotName", ""),
                spot_id=item.get("ScenicSpotID", ""),
                description=item.get("Description", "")[:500],
                address=item.get("Address", ""),
                city=item.get("City", ""),
                phone=item.get("Phone", ""),
                open_time=item.get("OpenTime", ""),
                website=item.get("WebsiteUrl", ""),
                travel_info=item.get("TravelInfo", ""),
                category=item.get("Class1", ""),
            )

            # 座標
            pos = item.get("Position", {})
            if pos:
                spot.latitude = pos.get("PositionLat")
                spot.longitude = pos.get("PositionLon")

            # 照片
            for i in range(1, 4):
                pic = item.get(f"Picture{i}", item.get("Picture", {}).get(f"PictureUrl{i}", ""))
                if isinstance(pic, dict):
                    pic = pic.get("PictureUrl1", pic.get("PictureUrl", ""))
                if pic:
                    spot.picture_urls.append(pic)

            # 分類標籤
            for cls_key in ["Class1", "Class2", "Class3"]:
                cls = item.get(cls_key, "")
                if cls:
                    spot.tags.append(cls)

            if spot.name:
                spots.append(spot)

        logger.info(f"取得 {len(spots)} 個景點")
        return spots

    def get_hotels(self, city: Optional[str] = None,
                   top: int = 100) -> list[TourismHotel]:
        """取得觀光局登記旅館"""
        if city:
            url = f"{self.TOURISM_BASE}/Hotel/{city}"
        else:
            url = f"{self.TOURISM_BASE}/Hotel"

        params = {
            "$top": str(top),
            "$format": "JSON",
        }

        try:
            resp = self.get(url, params=params, extra_headers=self._get_auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"旅館 API 失敗: {e}")
            return []

        hotels = []
        items = data if isinstance(data, list) else data.get("Hotels", data.get("value", []))
        for item in items:
            hotel = TourismHotel(
                name=item.get("HotelName", ""),
                hotel_id=item.get("HotelID", ""),
                address=item.get("Address", ""),
                city=item.get("City", ""),
                phone=item.get("Phone", ""),
                fax=item.get("Fax", ""),
                description=item.get("Description", "")[:500],
                website=item.get("WebsiteUrl", ""),
                property_class=item.get("Class", ""),
            )

            pos = item.get("Position", {})
            if pos:
                hotel.latitude = pos.get("PositionLat")
                hotel.longitude = pos.get("PositionLon")

            # 照片
            pic = item.get("Picture", {})
            if isinstance(pic, dict):
                for i in range(1, 4):
                    url = pic.get(f"PictureUrl{i}", "")
                    if url:
                        hotel.picture_urls.append(url)

            # 設施
            specs = item.get("Spec", "")
            if specs:
                hotel.facilities = [s.strip() for s in specs.split(",") if s.strip()]

            if hotel.name:
                hotels.append(hotel)

        logger.info(f"取得 {len(hotels)} 間旅館")
        return hotels

    def get_restaurants(self, city: Optional[str] = None,
                        top: int = 100) -> list[dict]:
        """取得觀光餐廳"""
        if city:
            url = f"{self.TOURISM_BASE}/Restaurant/{city}"
        else:
            url = f"{self.TOURISM_BASE}/Restaurant"

        params = {"$top": str(top), "$format": "JSON"}

        try:
            resp = self.get(url, params=params, extra_headers=self._get_auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"餐廳 API 失敗: {e}")
            return []

        items = data if isinstance(data, list) else data.get("Restaurants", data.get("value", []))
        restaurants = []
        for item in items:
            r = {
                "name": item.get("RestaurantName", ""),
                "id": item.get("RestaurantID", ""),
                "address": item.get("Address", ""),
                "city": item.get("City", ""),
                "phone": item.get("Phone", ""),
                "open_time": item.get("OpenTime", ""),
                "description": item.get("Description", "")[:300],
                "category": item.get("Class", ""),
            }
            pos = item.get("Position", {})
            if pos:
                r["latitude"] = pos.get("PositionLat")
                r["longitude"] = pos.get("PositionLon")
            if r["name"]:
                restaurants.append(r)

        logger.info(f"取得 {len(restaurants)} 間餐廳")
        return restaurants

    def get_activities(self, city: Optional[str] = None,
                       top: int = 50) -> list[dict]:
        """取得觀光活動"""
        if city:
            url = f"{self.TOURISM_BASE}/Activity/{city}"
        else:
            url = f"{self.TOURISM_BASE}/Activity"

        params = {"$top": str(top), "$format": "JSON"}

        try:
            resp = self.get(url, params=params, extra_headers=self._get_auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"活動 API 失敗: {e}")
            return []

        items = data if isinstance(data, list) else data.get("Activities", data.get("value", []))
        activities = []
        for item in items:
            a = {
                "name": item.get("ActivityName", ""),
                "id": item.get("ActivityID", ""),
                "address": item.get("Address", ""),
                "city": item.get("City", ""),
                "description": item.get("Description", "")[:300],
                "start_time": item.get("StartTime", ""),
                "end_time": item.get("EndTime", ""),
                "organizer": item.get("Organizer", ""),
                "category": item.get("Class1", ""),
            }
            pos = item.get("Position", {})
            if pos:
                a["latitude"] = pos.get("PositionLat")
                a["longitude"] = pos.get("PositionLon")
            if a["name"]:
                activities.append(a)

        logger.info(f"取得 {len(activities)} 個活動")
        return activities


# ============ Weather API ============

class WeatherAPI(BaseScraper):
    """
    中央氣象署 Central Weather Administration (CWA) Open API
    https://opendata.cwa.gov.tw/

    需要申請 Authorization Key (免費)
    提供：天氣預報、特報、觀測資料
    """

    BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"

    # 常用資料集 ID
    DATASETS = {
        # 36 小時天氣預報（全台各縣市）
        "forecast_36h": "F-C0032-001",
        # 7 天天氣預報（全台各縣市）
        "forecast_7d": "F-D0047-091",
        # 天氣特報
        "weather_alert": "W-C0033-001",
        # 紫外線指數
        "uvi_forecast": "F-J0026-001",
        # 各縣市個別 36h 預報
        "forecast_city": {
            "台北市": "F-D0047-061", "新北市": "F-D0047-069",
            "桃園市": "F-D0047-005", "台中市": "F-D0047-073",
            "台南市": "F-D0047-077", "高雄市": "F-D0047-065",
            "基隆市": "F-D0047-049", "新竹市": "F-D0047-053",
            "嘉義市": "F-D0047-057", "宜蘭縣": "F-D0047-001",
            "新竹縣": "F-D0047-009", "苗栗縣": "F-D0047-013",
            "彰化縣": "F-D0047-017", "南投縣": "F-D0047-021",
            "雲林縣": "F-D0047-025", "嘉義縣": "F-D0047-029",
            "屏東縣": "F-D0047-033", "台東縣": "F-D0047-037",
            "花蓮縣": "F-D0047-041", "澎湖縣": "F-D0047-045",
            "金門縣": "F-D0047-085", "連江縣": "F-D0047-081",
        }
    }

    def __init__(self, api_key: str = ""):
        super().__init__(min_delay=0.5, max_delay=1.5)
        self.api_key = api_key or os.environ.get("CWA_API_KEY", "")
        if not self.api_key:
            logger.warning(
                "CWA API Key 未設定。請至 https://opendata.cwa.gov.tw/ 申請，"
                "並設定環境變數 CWA_API_KEY 或初始化時傳入。"
            )

    def scrape(self, **kwargs):
        return self.get_forecast_36h()

    def get_forecast_36h(self, location: Optional[str] = None) -> list[WeatherForecast]:
        """
        取得 36 小時天氣預報

        Args:
            location: 縣市名（如 "臺北市"），None = 全部
        """
        if not self.api_key:
            logger.error("未設定 CWA API Key")
            return []

        params = {
            "Authorization": self.api_key,
            "format": "JSON",
        }
        if location:
            params["locationName"] = location

        url = f"{self.BASE_URL}/{self.DATASETS['forecast_36h']}"

        try:
            resp = self.get(url, params=params)
            data = resp.json()
        except Exception as e:
            logger.error(f"天氣預報 API 失敗: {e}")
            return []

        forecasts = []
        records = data.get("records", {})
        locations = records.get("location", [])

        for loc in locations:
            loc_name = loc.get("locationName", "")
            elements = {e["elementName"]: e for e in loc.get("weatherElement", [])}

            # 取各時段預報
            wx = elements.get("Wx", {}).get("time", [])
            for i, period in enumerate(wx):
                fc = WeatherForecast(
                    location=loc_name,
                    start_time=period.get("startTime", ""),
                    end_time=period.get("endTime", ""),
                    weather_description=period.get("parameter", {}).get("parameterName", ""),
                )

                # 最高溫
                max_t = elements.get("MaxT", {}).get("time", [])
                if i < len(max_t):
                    try:
                        fc.max_temp = float(max_t[i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        pass

                # 最低溫
                min_t = elements.get("MinT", {}).get("time", [])
                if i < len(min_t):
                    try:
                        fc.min_temp = float(min_t[i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        pass

                # 降雨機率
                pop = elements.get("PoP", {}).get("time", [])
                if i < len(pop):
                    try:
                        fc.rain_probability = int(pop[i].get("parameter", {}).get("parameterName", 0))
                    except (ValueError, TypeError):
                        pass

                # 舒適度
                ci = elements.get("CI", {}).get("time", [])
                if i < len(ci):
                    fc.comfort = ci[i].get("parameter", {}).get("parameterName", "")

                forecasts.append(fc)

        logger.info(f"取得 {len(forecasts)} 筆天氣預報")
        return forecasts

    def get_weather_alerts(self) -> list[WeatherAlert]:
        """取得天氣特報（颱風、豪雨、高溫等）"""
        if not self.api_key:
            return []

        params = {"Authorization": self.api_key, "format": "JSON"}
        url = f"{self.BASE_URL}/{self.DATASETS['weather_alert']}"

        try:
            resp = self.get(url, params=params)
            data = resp.json()
        except Exception as e:
            logger.error(f"天氣特報 API 失敗: {e}")
            return []

        alerts = []
        records = data.get("records", {})
        warnings = records.get("record", [])

        for w in warnings:
            alert = WeatherAlert(
                title=w.get("datasetDescription", ""),
                content=w.get("contents", {}).get("content", {}).get("contentText", ""),
                issued_time=w.get("issueTime", ""),
            )
            # 影響地區
            hazards = w.get("hazardConditions", {}).get("hazards", [])
            for h in hazards:
                info = h.get("info", {})
                alert.alert_type = info.get("phenomena", "")
                alert.severity = info.get("significance", "")
                areas = info.get("affectedAreas", [])
                for a in areas:
                    name = a.get("locationName", "") if isinstance(a, dict) else str(a)
                    if name:
                        alert.affected_areas.append(name)

            if alert.title:
                alerts.append(alert)

        logger.info(f"取得 {len(alerts)} 筆天氣特報")
        return alerts


# ============ TDX Transport API ============

class TDXTransportAPI(BaseScraper):
    """
    交通部 TDX (Transport Data eXchange) API
    https://tdx.transportdata.tw/

    需要申請 Client ID + Secret (免費方案每日 50 次)
    提供：高鐵、台鐵、客運、公車、航班等交通資料
    """

    BASE_URL = "https://tdx.transportdata.tw/api/basic/v2"

    def __init__(self, client_id: str = "", client_secret: str = ""):
        super().__init__(min_delay=1.0, max_delay=2.0)
        self.client_id = client_id or os.environ.get("TDX_CLIENT_ID", "")
        self.client_secret = client_secret or os.environ.get("TDX_CLIENT_SECRET", "")
        self._access_token = ""
        self._token_expiry = 0.0

        if self.client_id and self.client_secret:
            self._get_token()

    def _get_token(self):
        """取得 access token"""
        url = "https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token"
        data = {
            "grant_type": "client_credentials",
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        try:
            resp = self.session.post(url, data=data, timeout=10)
            resp.raise_for_status()
            result = resp.json()
            self._access_token = result["access_token"]
            self._token_expiry = time.time() + result.get("expires_in", 86400) - 60
            logger.info("TDX Transport token acquired")
        except Exception as e:
            logger.warning(f"TDX token failed: {e}")

    def _auth_headers(self) -> dict:
        if self._access_token and time.time() < self._token_expiry:
            return {"Authorization": f"Bearer {self._access_token}"}
        elif self.client_id:
            self._get_token()
            if self._access_token:
                return {"Authorization": f"Bearer {self._access_token}"}
        return {}

    def scrape(self, **kwargs):
        return self.get_thsr_timetable()

    # ---------- 高鐵 THSR ----------

    def get_thsr_timetable(self, origin: str = "", destination: str = "",
                           top: int = 50) -> list[TrainSchedule]:
        """
        取得高鐵時刻表

        Args:
            origin: 出發站 (如 "1000" 台北, "1035" 左營)
            destination: 到達站
            top: 最多筆數
        """
        if origin and destination:
            url = f"{self.BASE_URL}/Rail/THSR/DailyTimetable/OD/{origin}/to/{destination}/today"
        else:
            url = f"{self.BASE_URL}/Rail/THSR/GeneralTimetable"

        params = {"$top": str(top), "$format": "JSON"}

        try:
            resp = self.get(url, params=params, extra_headers=self._auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"高鐵時刻表 API 失敗: {e}")
            return []

        schedules = []
        items = data if isinstance(data, list) else data.get("value", data.get("TrainTimetables", []))

        for item in items:
            info = item.get("GeneralTimetable", item)
            train_info = info.get("GeneralTrainInfo", info.get("DailyTrainInfo", {}))
            stops = info.get("StopTimes", info.get("GeneralStopTimes", []))

            if not stops:
                continue

            first_stop = stops[0]
            last_stop = stops[-1]

            schedule = TrainSchedule(
                train_type="THSR",
                train_number=train_info.get("TrainNo", ""),
                departure_station=first_stop.get("StationName", {}).get("Zh_tw",
                                  first_stop.get("StationName", "")),
                arrival_station=last_stop.get("StationName", {}).get("Zh_tw",
                                last_stop.get("StationName", "")),
                departure_time=first_stop.get("DepartureTime", ""),
                arrival_time=last_stop.get("ArrivalTime", ""),
            )

            # 計算行車時間
            try:
                dep_t = datetime.strptime(schedule.departure_time, "%H:%M")
                arr_t = datetime.strptime(schedule.arrival_time, "%H:%M")
                diff = (arr_t - dep_t).total_seconds() / 60
                schedule.duration_minutes = int(diff) if diff > 0 else int(diff + 1440)
            except ValueError:
                pass

            # 中間停靠站
            for stop in stops[1:-1]:
                sname = stop.get("StationName", {})
                name = sname.get("Zh_tw", "") if isinstance(sname, dict) else str(sname)
                if name:
                    schedule.via_stations.append(name)

            # 營運日
            service_day = train_info.get("ServiceDay", {})
            day_map = {
                "Monday": "Mon", "Tuesday": "Tue", "Wednesday": "Wed",
                "Thursday": "Thu", "Friday": "Fri", "Saturday": "Sat", "Sunday": "Sun"
            }
            for day_en, day_short in day_map.items():
                if service_day.get(day_en, 0) == 1:
                    schedule.operating_days.append(day_short)

            schedules.append(schedule)

        logger.info(f"取得 {len(schedules)} 筆高鐵時刻")
        return schedules

    # ---------- 台鐵 TRA ----------

    def get_tra_timetable(self, origin: str = "", destination: str = "",
                          train_class: str = "",
                          top: int = 50) -> list[TrainSchedule]:
        """
        取得台鐵時刻表

        Args:
            origin: 出發站代碼 (如 "1000" 台北)
            destination: 到達站代碼
            train_class: 車種 (1100=自強, 1200=莒光, 1300=復興, 1400=區間)
            top: 最多筆數
        """
        if origin and destination:
            url = f"{self.BASE_URL}/Rail/TRA/DailyTimetable/OD/{origin}/to/{destination}/today"
        else:
            url = f"{self.BASE_URL}/Rail/TRA/GeneralTimetable"

        params = {"$top": str(top), "$format": "JSON"}
        if train_class:
            params["$filter"] = f"TrainTypeName/Zh_tw eq '{train_class}'"

        try:
            resp = self.get(url, params=params, extra_headers=self._auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"台鐵時刻表 API 失敗: {e}")
            return []

        schedules = []
        items = data if isinstance(data, list) else data.get("value", data.get("TrainTimetables", []))

        for item in items:
            info = item.get("GeneralTimetable", item)
            train_info = info.get("GeneralTrainInfo", info.get("DailyTrainInfo", {}))
            stops = info.get("StopTimes", info.get("GeneralStopTimes", []))

            if not stops:
                continue

            first_stop = stops[0]
            last_stop = stops[-1]

            # 車種
            train_type_name = train_info.get("TrainTypeName", {})
            tclass = train_type_name.get("Zh_tw", "") if isinstance(train_type_name, dict) else str(train_type_name)

            schedule = TrainSchedule(
                train_type="TRA",
                train_number=str(train_info.get("TrainNo", "")),
                departure_station=self._get_station_name(first_stop),
                arrival_station=self._get_station_name(last_stop),
                departure_time=first_stop.get("DepartureTime", ""),
                arrival_time=last_stop.get("ArrivalTime", ""),
                train_class=tclass,
            )

            try:
                dep_t = datetime.strptime(schedule.departure_time, "%H:%M")
                arr_t = datetime.strptime(schedule.arrival_time, "%H:%M")
                diff = (arr_t - dep_t).total_seconds() / 60
                schedule.duration_minutes = int(diff) if diff > 0 else int(diff + 1440)
            except ValueError:
                pass

            for stop in stops[1:-1]:
                name = self._get_station_name(stop)
                if name:
                    schedule.via_stations.append(name)

            schedules.append(schedule)

        logger.info(f"取得 {len(schedules)} 筆台鐵時刻")
        return schedules

    # ---------- 國內航班 ----------

    def get_domestic_flights(self, top: int = 100) -> list[DomesticFlight]:
        """取得國內航線班表"""
        url = f"{self.BASE_URL}/Air/FIDS/Airport/Departure"
        params = {
            "$top": str(top),
            "$format": "JSON",
            "$filter": "IsDomestic eq true",
        }

        try:
            resp = self.get(url, params=params, extra_headers=self._auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"國內航班 API 失敗: {e}")
            return []

        flights = []
        items = data if isinstance(data, list) else data.get("value", data.get("FIDSAirport", []))

        for item in items:
            flight = DomesticFlight(
                airline_name=item.get("AirlineName", {}).get("Zh_tw", ""),
                airline_id=item.get("AirlineID", ""),
                flight_number=item.get("FlightNumber", ""),
                departure_airport=item.get("DepartureAirportID", ""),
                arrival_airport=item.get("ArrivalAirportID", ""),
                departure_time=item.get("ScheduleDepartureTime", ""),
                arrival_time=item.get("ScheduleArrivalTime", ""),
            )
            if flight.airline_name:
                flights.append(flight)

        logger.info(f"取得 {len(flights)} 筆國內航班")
        return flights

    # ---------- 客運 ----------

    def get_intercity_bus_routes(self, top: int = 100) -> list[BusRoute]:
        """取得國道客運路線"""
        url = f"{self.BASE_URL}/Bus/Route/InterCity"
        params = {"$top": str(top), "$format": "JSON"}

        try:
            resp = self.get(url, params=params, extra_headers=self._auth_headers())
            data = resp.json()
        except Exception as e:
            logger.error(f"客運路線 API 失敗: {e}")
            return []

        routes = []
        items = data if isinstance(data, list) else data.get("value", [])

        for item in items:
            route_name = item.get("RouteName", {})
            name = route_name.get("Zh_tw", "") if isinstance(route_name, dict) else str(route_name)

            operators = item.get("Operators", [])
            operator_name = ""
            if operators:
                op = operators[0]
                op_name = op.get("OperatorName", {})
                operator_name = op_name.get("Zh_tw", "") if isinstance(op_name, dict) else str(op_name)

            dep = item.get("DepartureStopNameZh", "")
            arr = item.get("DestinationStopNameZh", "")

            route = BusRoute(
                route_name=name,
                operator=operator_name,
                departure_stop=dep,
                arrival_stop=arr,
                route_type="國道客運",
            )

            if route.route_name:
                routes.append(route)

        logger.info(f"取得 {len(routes)} 條客運路線")
        return routes

    @staticmethod
    def _get_station_name(stop: dict) -> str:
        sname = stop.get("StationName", {})
        if isinstance(sname, dict):
            return sname.get("Zh_tw", sname.get("En", ""))
        return str(sname)


# ============ Utility ============

def save_data(data: list, filepath: str, label: str = "資料"):
    """通用儲存"""
    serialized = []
    for item in data:
        if hasattr(item, "__dataclass_fields__"):
            serialized.append(asdict(item))
        elif isinstance(item, dict):
            serialized.append(item)
        else:
            serialized.append(str(item))

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(serialized, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已儲存 {len(serialized)} 筆{label} -> {filepath}")
