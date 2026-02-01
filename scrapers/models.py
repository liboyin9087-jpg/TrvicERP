"""
Hotel, Room, Flight & Airline data models for scraper output.
飯店房型 / 航班航空公司 資料結構定義
"""
from dataclasses import dataclass, field, asdict
from typing import Optional
import json


@dataclass
class RoomType:
    """房型資料"""
    name: str                                  # 房型名稱 e.g. "豪華雙人房"
    bed_type: str = ""                         # 床型 e.g. "一張特大雙人床"
    max_occupancy: int = 2                     # 最大入住人數
    room_size_sqm: Optional[float] = None      # 房間面積 (平方公尺)
    amenities: list[str] = field(default_factory=list)  # 房間設施
    description: str = ""                      # 房型描述
    photos: list[str] = field(default_factory=list)     # 房型照片 URLs
    is_smoking: Optional[bool] = None          # 是否可吸菸
    has_wifi: Optional[bool] = None
    has_breakfast: Optional[bool] = None
    view_type: str = ""                        # 景觀類型 e.g. "海景", "山景", "市景"


@dataclass
class Hotel:
    """飯店資料"""
    name: str                                  # 飯店名稱
    source: str                                # 資料來源 "booking" | "agoda"
    source_id: str = ""                        # 平台上的飯店 ID
    source_url: str = ""                       # 平台上的飯店頁面 URL
    address: str = ""
    city: str = ""                             # 城市 e.g. "台北市"
    district: str = ""                         # 區域 e.g. "中山區"
    country: str = "台灣"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    star_rating: Optional[float] = None        # 星等 1~5
    review_score: Optional[float] = None       # 評分 (Booking 1-10, Agoda 1-10)
    review_count: int = 0                      # 評論數
    property_type: str = ""                    # 類型: hotel, hostel, resort, bnb, villa
    description: str = ""
    check_in_time: str = ""                    # e.g. "15:00"
    check_out_time: str = ""                   # e.g. "11:00"
    facilities: list[str] = field(default_factory=list)   # 飯店設施
    photos: list[str] = field(default_factory=list)       # 飯店照片 URLs
    room_types: list[RoomType] = field(default_factory=list)
    languages_spoken: list[str] = field(default_factory=list)
    nearby_attractions: list[str] = field(default_factory=list)
    sustainability_info: str = ""              # 永續/環保認證資訊
    raw_data: dict = field(default_factory=dict)  # 原始爬取資料保留

    def to_dict(self) -> dict:
        d = asdict(self)
        d.pop("raw_data", None)
        return d

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), ensure_ascii=False, indent=indent)


@dataclass
class Airline:
    """航空公司資料"""
    name: str                                  # 航空公司名稱 e.g. "中華航空"
    name_en: str = ""                          # 英文名 e.g. "China Airlines"
    iata_code: str = ""                        # IATA 二字碼 e.g. "CI"
    icao_code: str = ""                        # ICAO 三字碼 e.g. "CAL"
    country: str = ""                          # 所屬國家
    alliance: str = ""                         # 聯盟 e.g. "SkyTeam", "Star Alliance", "oneworld"
    hub_airports: list[str] = field(default_factory=list)   # 樞紐機場
    logo_url: str = ""
    source: str = "skyscanner"


@dataclass
class FlightRoute:
    """航線班機資料"""
    airline_name: str                          # 航空公司名稱
    airline_iata: str = ""                     # IATA code
    flight_number: str = ""                    # 航班號 e.g. "CI-101"
    departure_airport: str = ""                # 出發機場 IATA e.g. "TPE"
    departure_airport_name: str = ""           # 出發機場名稱 e.g. "桃園國際機場"
    arrival_airport: str = ""                  # 抵達機場 IATA e.g. "NRT"
    arrival_airport_name: str = ""             # 抵達機場名稱 e.g. "成田國際機場"
    departure_time: str = ""                   # 出發時間 e.g. "08:30"
    arrival_time: str = ""                     # 抵達時間 e.g. "12:45"
    duration_minutes: int = 0                  # 飛行時間（分鐘）
    stops: int = 0                             # 轉機次數
    stop_airports: list[str] = field(default_factory=list)  # 轉機機場
    aircraft_type: str = ""                    # 機型 e.g. "Boeing 777-300ER"
    cabin_classes: list[str] = field(default_factory=list)   # 可用艙等
    operating_days: list[str] = field(default_factory=list)  # 營運日 ["Mon","Tue",...]
    is_codeshare: bool = False                 # 是否為聯營班機
    codeshare_airline: str = ""                # 實際營運航空
    source: str = "skyscanner"
    source_url: str = ""
    raw_data: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        d = asdict(self)
        d.pop("raw_data", None)
        return d


def save_hotels(hotels: list[Hotel], filepath: str):
    """將飯店列表存成 JSON"""
    data = [h.to_dict() for h in hotels]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已儲存 {len(data)} 筆飯店資料 -> {filepath}")


def save_flights(flights: list[FlightRoute], filepath: str):
    """將航班列表存成 JSON"""
    data = [f.to_dict() for f in flights]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已儲存 {len(data)} 筆航班資料 -> {filepath}")


def save_airlines(airlines: list[Airline], filepath: str):
    """將航空公司列表存成 JSON"""
    data = [asdict(a) for a in airlines]
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[OK] 已儲存 {len(data)} 筆航空公司資料 -> {filepath}")
