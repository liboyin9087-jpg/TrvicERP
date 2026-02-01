"""
Skyscanner Flight & Airline Scraper
爬取 Skyscanner 航班資訊與班機時間（不含價格）

策略：
1. 航線搜尋頁 → 解析 __NEXT_DATA__ 取得航班清單
2. 從搜尋結果取得：航空公司、航班號、出發/到達時間、飛行時間、機型、轉機資訊
3. 彙整航空公司清單（IATA code、聯盟、樞紐機場）
"""
import re
import json
import logging
from typing import Optional
from datetime import datetime, timedelta
from bs4 import BeautifulSoup

from scrapers.base import BaseScraper
from scrapers.models import Airline, FlightRoute
from scrapers.config import (
    FLIGHT_ROUTES, SKYSCANNER_CONFIG, RATE_LIMIT,
)

logger = logging.getLogger(__name__)

# 已知航空公司資料（補充 Skyscanner 可能不完整的欄位）
KNOWN_AIRLINES = {
    "CI": {"name": "中華航空", "name_en": "China Airlines", "icao": "CAL", "country": "台灣", "alliance": "SkyTeam"},
    "BR": {"name": "長榮航空", "name_en": "EVA Air", "icao": "EVA", "country": "台灣", "alliance": "Star Alliance"},
    "JX": {"name": "星宇航空", "name_en": "STARLUX Airlines", "icao": "SJX", "country": "台灣", "alliance": ""},
    "IT": {"name": "台灣虎航", "name_en": "Tigerair Taiwan", "icao": "TTW", "country": "台灣", "alliance": ""},
    "JL": {"name": "日本航空", "name_en": "Japan Airlines", "icao": "JAL", "country": "日本", "alliance": "oneworld"},
    "NH": {"name": "全日空", "name_en": "All Nippon Airways", "icao": "ANA", "country": "日本", "alliance": "Star Alliance"},
    "MM": {"name": "樂桃航空", "name_en": "Peach Aviation", "icao": "APJ", "country": "日本", "alliance": ""},
    "TR": {"name": "酷航", "name_en": "Scoot", "icao": "TGW", "country": "新加坡", "alliance": ""},
    "CX": {"name": "國泰航空", "name_en": "Cathay Pacific", "icao": "CPA", "country": "香港", "alliance": "oneworld"},
    "UO": {"name": "香港快運", "name_en": "HK Express", "icao": "HKE", "country": "香港", "alliance": ""},
    "KE": {"name": "大韓航空", "name_en": "Korean Air", "icao": "KAL", "country": "韓國", "alliance": "SkyTeam"},
    "OZ": {"name": "韓亞航空", "name_en": "Asiana Airlines", "icao": "AAR", "country": "韓國", "alliance": "Star Alliance"},
    "7C": {"name": "濟州航空", "name_en": "Jeju Air", "icao": "JJA", "country": "韓國", "alliance": ""},
    "LJ": {"name": "真航空", "name_en": "Jin Air", "icao": "JNA", "country": "韓國", "alliance": ""},
    "TG": {"name": "泰國航空", "name_en": "Thai Airways", "icao": "THA", "country": "泰國", "alliance": "Star Alliance"},
    "SL": {"name": "泰國獅子航空", "name_en": "Thai Lion Air", "icao": "TLM", "country": "泰國", "alliance": ""},
    "VJ": {"name": "越捷航空", "name_en": "VietJet Air", "icao": "VJC", "country": "越南", "alliance": ""},
    "PR": {"name": "菲律賓航空", "name_en": "Philippine Airlines", "icao": "PAL", "country": "菲律賓", "alliance": ""},
    "5J": {"name": "宿霧太平洋航空", "name_en": "Cebu Pacific", "icao": "CEB", "country": "菲律賓", "alliance": ""},
    "SQ": {"name": "新加坡航空", "name_en": "Singapore Airlines", "icao": "SIA", "country": "新加坡", "alliance": "Star Alliance"},
    "AK": {"name": "亞洲航空", "name_en": "AirAsia", "icao": "AXM", "country": "馬來西亞", "alliance": ""},
    "MH": {"name": "馬來西亞航空", "name_en": "Malaysia Airlines", "icao": "MAS", "country": "馬來西亞", "alliance": "oneworld"},
    "UA": {"name": "聯合航空", "name_en": "United Airlines", "icao": "UAL", "country": "美國", "alliance": "Star Alliance"},
    "AA": {"name": "美國航空", "name_en": "American Airlines", "icao": "AAL", "country": "美國", "alliance": "oneworld"},
    "DL": {"name": "達美航空", "name_en": "Delta Air Lines", "icao": "DAL", "country": "美國", "alliance": "SkyTeam"},
    "KL": {"name": "荷蘭皇家航空", "name_en": "KLM Royal Dutch Airlines", "icao": "KLM", "country": "荷蘭", "alliance": "SkyTeam"},
    "TK": {"name": "土耳其航空", "name_en": "Turkish Airlines", "icao": "THY", "country": "土耳其", "alliance": "Star Alliance"},
    "EK": {"name": "阿聯酋航空", "name_en": "Emirates", "icao": "UAE", "country": "阿聯酋", "alliance": ""},
    "LH": {"name": "漢莎航空", "name_en": "Lufthansa", "icao": "DLH", "country": "德國", "alliance": "Star Alliance"},
    "BA": {"name": "英國航空", "name_en": "British Airways", "icao": "BAW", "country": "英國", "alliance": "oneworld"},
    "QF": {"name": "澳洲航空", "name_en": "Qantas", "icao": "QFA", "country": "澳洲", "alliance": "oneworld"},
    "HX": {"name": "香港航空", "name_en": "Hong Kong Airlines", "icao": "CRK", "country": "香港", "alliance": ""},
    "GA": {"name": "印尼嘉魯達航空", "name_en": "Garuda Indonesia", "icao": "GIA", "country": "印尼", "alliance": "SkyTeam"},
    "QD": {"name": "柬埔寨吳哥航空", "name_en": "Cambodia Angkor Air", "icao": "KHV", "country": "柬埔寨", "alliance": ""},
    "VN": {"name": "越南航空", "name_en": "Vietnam Airlines", "icao": "HVN", "country": "越南", "alliance": "SkyTeam"},
}

# 機場代碼→中文名
AIRPORT_NAMES = {
    "TPE": "桃園國際機場", "TSA": "台北松山機場", "KHH": "高雄國際機場",
    "RMQ": "台中清泉崗機場", "TNN": "台南機場", "KNH": "金門機場",
    "MZG": "澎湖機場", "HUN": "花蓮機場", "TTT": "台東機場",
    "NRT": "東京成田機場", "HND": "東京羽田機場", "KIX": "大阪關西機場",
    "ICN": "首爾仁川機場", "GMP": "首爾金浦機場",
    "CTS": "札幌新千歲機場", "OKA": "沖繩那霸機場",
    "FUK": "福岡機場", "NGO": "名古屋中部機場",
    "BKK": "曼谷素萬那普機場", "DMK": "曼谷廊曼機場",
    "SIN": "新加坡樟宜機場", "MNL": "馬尼拉艾奎諾機場",
    "SGN": "胡志明市新山一機場", "HAN": "河內內排機場",
    "DPS": "峇里島伍拉·賴機場", "KUL": "吉隆坡國際機場",
    "HKG": "香港國際機場", "PVG": "上海浦東機場", "PEK": "北京首都機場",
    "LAX": "洛杉磯國際機場", "SFO": "舊金山國際機場",
    "AMS": "阿姆斯特丹史基浦機場", "FRA": "法蘭克福機場",
    "LHR": "倫敦希斯洛機場", "SYD": "雪梨國際機場",
}


class SkyscannerScraper(BaseScraper):
    """Skyscanner 航班/航空公司爬蟲"""

    BASE_URL = "https://www.skyscanner.com.tw"

    def __init__(self):
        rate = RATE_LIMIT["skyscanner"]
        super().__init__(min_delay=rate["min_delay"], max_delay=rate["max_delay"])
        self.session.headers.update({
            "Referer": "https://www.skyscanner.com.tw/",
        })
        self._seen_airlines: dict[str, Airline] = {}

    def scrape(self, routes: Optional[list[dict]] = None) -> tuple[list[FlightRoute], list[Airline]]:
        """
        爬取航線資訊

        Returns:
            (航班列表, 航空公司列表)
        """
        target_routes = routes or FLIGHT_ROUTES
        all_flights: list[FlightRoute] = []

        for route in target_routes:
            dep = route["from"]
            arr = route["to"]
            label = route.get("label", f"{dep}->{arr}")
            logger.info(f"=== Skyscanner 爬取航線: {label} ===")

            try:
                flights = self._scrape_route(dep, arr)
                all_flights.extend(flights)
                logger.info(f"{label}: 取得 {len(flights)} 筆航班")
            except Exception as e:
                logger.error(f"航線 {label} 爬取失敗: {e}")

        airlines = list(self._seen_airlines.values())
        return all_flights, airlines

    def _scrape_route(self, dep: str, arr: str) -> list[FlightRoute]:
        """爬取單一航線"""
        # 搜尋日期：未來 14 天（讓結果有班表資料）
        search_date = (datetime.now() + timedelta(days=14)).strftime("%y%m%d")

        # Skyscanner URL 格式: /transport/flights/{from}/{to}/{date}/
        search_url = (
            f"{self.BASE_URL}/transport/flights/"
            f"{dep.lower()}/{arr.lower()}/{search_date}/"
            f"?adultsv2=1&cabinclass=economy&childrenv2=&inboundaltsen498=false"
            f"&outboundaltsenabled=false&preferdirects=false&rtn=0"
        )

        try:
            resp = self.get(search_url)
        except Exception as e:
            logger.error(f"請求失敗 {dep}->{arr}: {e}")
            return []

        flights = []

        # 策略1: 解析 __NEXT_DATA__
        next_flights = self._parse_next_data(resp.text, dep, arr)
        if next_flights:
            flights.extend(next_flights)

        # 策略2: 解析 HTML
        if not flights:
            html_flights = self._parse_html_results(resp.text, dep, arr)
            flights.extend(html_flights)

        # 登記發現的航空公司
        for f in flights:
            self._register_airline(f.airline_iata, f.airline_name)

        return flights

    def _parse_next_data(self, html: str, dep: str, arr: str) -> list[FlightRoute]:
        """從 __NEXT_DATA__ 解析航班"""
        flights = []

        match = re.search(
            r'<script\s+id="__NEXT_DATA__"\s+type="application/json">(.*?)</script>',
            html, re.DOTALL
        )
        if not match:
            return flights

        try:
            data = json.loads(match.group(1))
        except json.JSONDecodeError:
            return flights

        # 嘗試多種可能的 JSON 路徑
        itineraries = self._find_itineraries(data)
        legs = self._find_legs(data)
        carriers = self._find_carriers(data)

        if not legs:
            return flights

        seen_flights = set()

        for leg_id, leg in legs.items():
            try:
                origin = leg.get("originPlaceId", leg.get("origin", ""))
                destination = leg.get("destinationPlaceId", leg.get("destination", ""))

                # 出發/到達時間
                dep_time = leg.get("departureDateTime", leg.get("departure", ""))
                arr_time = leg.get("arrivalDateTime", leg.get("arrival", ""))
                dep_time_str = self._format_time(dep_time)
                arr_time_str = self._format_time(arr_time)

                # 飛行時間
                duration = leg.get("durationInMinutes", leg.get("duration", 0))

                # 轉機
                stop_count = leg.get("stopCount", 0)
                stops = leg.get("stops", [])
                stop_codes = []
                for s in stops:
                    code = s.get("id", s.get("iata", "")) if isinstance(s, dict) else str(s)
                    if code:
                        stop_codes.append(code)

                # 航段（可能多段）
                segments = leg.get("segmentIds", leg.get("segments", []))
                carrier_ids = leg.get("operatingCarrierIds",
                                      leg.get("marketingCarrierIds",
                                               leg.get("carriers", [])))

                # 取第一個（主要）航空公司
                airline_id = ""
                if carrier_ids:
                    airline_id = str(carrier_ids[0]) if isinstance(carrier_ids[0], (int, str)) else ""

                airline_name = ""
                airline_iata = ""
                if carriers and airline_id:
                    carrier = carriers.get(str(airline_id), carriers.get(airline_id, {}))
                    if isinstance(carrier, dict):
                        airline_name = carrier.get("name", "")
                        airline_iata = carrier.get("iata", carrier.get("code", ""))

                # 如果沒有 carrier 資料，嘗試從 known airlines 補
                if airline_iata and not airline_name and airline_iata in KNOWN_AIRLINES:
                    airline_name = KNOWN_AIRLINES[airline_iata]["name"]

                # 航班號
                flight_number = ""
                if airline_iata and segments:
                    first_seg = segments[0]
                    if isinstance(first_seg, dict):
                        fn = first_seg.get("flightNumber", first_seg.get("marketingFlightNumber", ""))
                        if fn:
                            flight_number = f"{airline_iata}-{fn}"

                # 去重 key
                key = f"{airline_iata}_{dep_time_str}_{arr_time_str}"
                if key in seen_flights:
                    continue
                seen_flights.add(key)

                # 機型
                aircraft = ""
                if segments and isinstance(segments[0], dict):
                    aircraft = segments[0].get("aircraft", segments[0].get("equipmentType", ""))

                route = FlightRoute(
                    airline_name=airline_name,
                    airline_iata=airline_iata,
                    flight_number=flight_number,
                    departure_airport=dep,
                    departure_airport_name=AIRPORT_NAMES.get(dep, dep),
                    arrival_airport=arr,
                    arrival_airport_name=AIRPORT_NAMES.get(arr, arr),
                    departure_time=dep_time_str,
                    arrival_time=arr_time_str,
                    duration_minutes=int(duration) if duration else 0,
                    stops=stop_count,
                    stop_airports=stop_codes,
                    aircraft_type=aircraft,
                    source="skyscanner",
                )

                flights.append(route)

            except Exception as e:
                logger.debug(f"解析航班 leg 失敗: {e}")
                continue

        return flights

    def _find_itineraries(self, data: dict) -> dict:
        """遞迴搜尋 itineraries 資料"""
        return self._deep_find(data, "itineraries")

    def _find_legs(self, data: dict) -> dict:
        """遞迴搜尋 legs 資料"""
        return self._deep_find(data, "legs")

    def _find_carriers(self, data: dict) -> dict:
        """遞迴搜尋 carriers 資料"""
        return self._deep_find(data, "carriers")

    def _deep_find(self, obj, key: str, max_depth: int = 8) -> dict:
        """在嵌套 dict 中深度搜尋特定 key"""
        if max_depth <= 0:
            return {}

        if isinstance(obj, dict):
            if key in obj and isinstance(obj[key], dict):
                return obj[key]
            for v in obj.values():
                result = self._deep_find(v, key, max_depth - 1)
                if result:
                    return result

        if isinstance(obj, list):
            for item in obj[:10]:  # 限制搜尋範圍
                result = self._deep_find(item, key, max_depth - 1)
                if result:
                    return result

        return {}

    def _parse_html_results(self, html: str, dep: str, arr: str) -> list[FlightRoute]:
        """解析 HTML 搜尋結果"""
        soup = BeautifulSoup(html, "html.parser")
        flights = []
        seen = set()

        # Skyscanner 結果卡片
        result_cards = soup.select(
            '[class*="FlightsResults"], '
            '[class*="ItineraryCard"], '
            '[data-testid="itinerary-card"], '
            '.day-list-item'
        )

        for card in result_cards:
            try:
                flight = self._parse_flight_card(card, dep, arr)
                if flight:
                    key = f"{flight.airline_iata}_{flight.departure_time}"
                    if key not in seen:
                        seen.add(key)
                        flights.append(flight)
            except Exception as e:
                logger.debug(f"解析航班卡片失敗: {e}")

        return flights

    def _parse_flight_card(self, card, dep: str, arr: str) -> Optional[FlightRoute]:
        """解析單張航班卡片"""
        # 航空公司名稱
        airline_el = card.select_one(
            '[class*="CarrierName"], '
            '[class*="airline-name"], '
            '.carrier-name'
        )
        airline_name = airline_el.get_text(strip=True) if airline_el else ""

        # 航空公司 logo alt 通常有名稱
        if not airline_name:
            logo = card.select_one("img[alt]")
            if logo:
                airline_name = logo.get("alt", "").replace("logo", "").strip()

        if not airline_name:
            return None

        # IATA code
        airline_iata = ""
        for code, info in KNOWN_AIRLINES.items():
            if info["name"] == airline_name or info["name_en"].lower() in airline_name.lower():
                airline_iata = code
                break

        # 時間
        time_els = card.select(
            '[class*="TimeValue"], '
            '[class*="departure-time"], '
            '[class*="arrival-time"], '
            'time'
        )
        dep_time = ""
        arr_time = ""
        if len(time_els) >= 2:
            dep_time = time_els[0].get_text(strip=True)
            arr_time = time_els[1].get_text(strip=True)
        elif len(time_els) == 1:
            dep_time = time_els[0].get_text(strip=True)

        # 飛行時間
        duration_el = card.select_one(
            '[class*="Duration"], [class*="duration"]'
        )
        duration_min = 0
        if duration_el:
            text = duration_el.get_text(strip=True)
            h_match = re.search(r"(\d+)\s*[hH小時]", text)
            m_match = re.search(r"(\d+)\s*[mM分]", text)
            if h_match:
                duration_min += int(h_match.group(1)) * 60
            if m_match:
                duration_min += int(m_match.group(1))

        # 轉機
        stops = 0
        stop_el = card.select_one(
            '[class*="StopCount"], [class*="stops"]'
        )
        if stop_el:
            text = stop_el.get_text(strip=True)
            if "直飛" in text or "direct" in text.lower() or "nonstop" in text.lower():
                stops = 0
            else:
                match = re.search(r"(\d+)", text)
                if match:
                    stops = int(match.group(1))

        return FlightRoute(
            airline_name=airline_name,
            airline_iata=airline_iata,
            departure_airport=dep,
            departure_airport_name=AIRPORT_NAMES.get(dep, dep),
            arrival_airport=arr,
            arrival_airport_name=AIRPORT_NAMES.get(arr, arr),
            departure_time=dep_time,
            arrival_time=arr_time,
            duration_minutes=duration_min,
            stops=stops,
            source="skyscanner",
        )

    def _format_time(self, time_data) -> str:
        """格式化時間資料"""
        if isinstance(time_data, str):
            # ISO format: "2026-02-14T08:30:00"
            match = re.search(r"(\d{2}:\d{2})", time_data)
            return match.group(1) if match else time_data

        if isinstance(time_data, dict):
            # {hour: 8, minute: 30, ...}
            h = time_data.get("hour", 0)
            m = time_data.get("minute", 0)
            return f"{h:02d}:{m:02d}"

        return ""

    def _register_airline(self, iata: str, name: str):
        """登記發現的航空公司"""
        if not iata or iata in self._seen_airlines:
            return

        known = KNOWN_AIRLINES.get(iata, {})
        airline = Airline(
            name=known.get("name", name),
            name_en=known.get("name_en", ""),
            iata_code=iata,
            icao_code=known.get("icao", ""),
            country=known.get("country", ""),
            alliance=known.get("alliance", ""),
        )
        self._seen_airlines[iata] = airline

    def get_all_known_airlines(self) -> list[Airline]:
        """取得所有已知航空公司（含靜態資料）"""
        airlines = []
        for iata, info in KNOWN_AIRLINES.items():
            airlines.append(Airline(
                name=info["name"],
                name_en=info["name_en"],
                iata_code=iata,
                icao_code=info.get("icao", ""),
                country=info["country"],
                alliance=info["alliance"],
                source="static_data",
            ))
        return airlines
