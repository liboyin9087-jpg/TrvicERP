#!/usr/bin/env python3
"""
TrvicERP Scraper CLI Runner
統一入口：爬取飯店、航班、政府開放資料

Usage:
    python -m scrapers.run --all                          # 全部跑
    python -m scrapers.run --booking --cities 台北 花蓮    # 只跑 Booking.com 指定城市
    python -m scrapers.run --agoda --cities 墾丁 台東     # 只跑 Agoda
    python -m scrapers.run --skyscanner                    # 航班+航空公司
    python -m scrapers.run --tourism                       # 觀光局景點+旅館
    python -m scrapers.run --weather                       # 天氣預報
    python -m scrapers.run --transport                     # 高鐵/台鐵/客運
    python -m scrapers.run --airlines-only                 # 只輸出靜態航空公司清單
"""
import argparse
import logging
import os
import sys
import json
from datetime import datetime

from scrapers.config import OUTPUT_DIR

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("scrapers")


def ensure_output_dir():
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M")


def run_booking(cities: list[str] | None, max_per_city: int):
    from scrapers.booking_scraper import BookingScraper
    from scrapers.models import save_hotels

    scraper = BookingScraper()
    hotels = scraper.scrape(cities=cities, max_per_city=max_per_city)
    if hotels:
        path = os.path.join(OUTPUT_DIR, f"booking_hotels_{timestamp()}.json")
        save_hotels(hotels, path)
    return hotels


def run_agoda(cities: list[str] | None, max_per_city: int):
    from scrapers.agoda_scraper import AgodaScraper
    from scrapers.models import save_hotels

    scraper = AgodaScraper()
    hotels = scraper.scrape(cities=cities, max_per_city=max_per_city)
    if hotels:
        path = os.path.join(OUTPUT_DIR, f"agoda_hotels_{timestamp()}.json")
        save_hotels(hotels, path)
    return hotels


def run_skyscanner(routes: list[dict] | None):
    from scrapers.skyscanner_scraper import SkyscannerScraper
    from scrapers.models import save_flights, save_airlines

    scraper = SkyscannerScraper()
    flights, airlines = scraper.scrape(routes=routes)

    if flights:
        path = os.path.join(OUTPUT_DIR, f"skyscanner_flights_{timestamp()}.json")
        save_flights(flights, path)
    if airlines:
        path = os.path.join(OUTPUT_DIR, f"skyscanner_airlines_{timestamp()}.json")
        save_airlines(airlines, path)

    return flights, airlines


def run_airlines_static():
    from scrapers.skyscanner_scraper import SkyscannerScraper
    from scrapers.models import save_airlines

    scraper = SkyscannerScraper()
    airlines = scraper.get_all_known_airlines()
    path = os.path.join(OUTPUT_DIR, f"airlines_static_{timestamp()}.json")
    save_airlines(airlines, path)
    return airlines


def run_tourism(cities: list[str] | None, top: int):
    from scrapers.taiwan_gov_api import TourismBureauAPI, save_data

    api = TourismBureauAPI()
    results = {}

    # 景點
    city_en_map = {
        "台北": "Taipei", "新北": "NewTaipei", "桃園": "Taoyuan",
        "台中": "Taichung", "台南": "Tainan", "高雄": "Kaohsiung",
        "基隆": "Keelung", "新竹": "HsinchuCounty", "苗栗": "MiaoliCounty",
        "彰化": "ChanghuaCounty", "南投": "NantouCounty", "雲林": "YunlinCounty",
        "嘉義": "ChiayiCounty", "屏東": "PingtungCounty", "宜蘭": "YilanCounty",
        "花蓮": "HualienCounty", "台東": "TaitungCounty",
        "澎湖": "PenghuCounty", "金門": "KinmenCounty",
    }

    if cities:
        for city in cities:
            city_en = city_en_map.get(city)
            if city_en:
                spots = api.get_scenic_spots(city=city_en, top=top)
                hotels = api.get_hotels(city=city_en, top=top)
                results[city] = {"spots": spots, "hotels": hotels}
    else:
        spots = api.get_scenic_spots(top=top)
        hotels = api.get_hotels(top=top)
        restaurants = api.get_restaurants(top=top)
        activities = api.get_activities(top=top)
        results["全台"] = {
            "spots": spots, "hotels": hotels,
            "restaurants": restaurants, "activities": activities,
        }

    # 儲存
    for key, data in results.items():
        for data_type, items in data.items():
            if items:
                path = os.path.join(OUTPUT_DIR, f"tourism_{data_type}_{key}_{timestamp()}.json")
                save_data(items, path, label=f"{key} {data_type}")

    return results


def run_weather(locations: list[str] | None):
    from scrapers.taiwan_gov_api import WeatherAPI, save_data

    api = WeatherAPI()

    # 36h 預報
    if locations:
        all_forecasts = []
        for loc in locations:
            fc = api.get_forecast_36h(location=loc)
            all_forecasts.extend(fc)
    else:
        all_forecasts = api.get_forecast_36h()

    if all_forecasts:
        path = os.path.join(OUTPUT_DIR, f"weather_forecast_{timestamp()}.json")
        save_data(all_forecasts, path, label="天氣預報")

    # 特報
    alerts = api.get_weather_alerts()
    if alerts:
        path = os.path.join(OUTPUT_DIR, f"weather_alerts_{timestamp()}.json")
        save_data(alerts, path, label="天氣特報")

    return all_forecasts, alerts


def run_transport():
    from scrapers.taiwan_gov_api import TDXTransportAPI, save_data

    api = TDXTransportAPI()
    results = {}

    # 高鐵
    thsr = api.get_thsr_timetable(top=100)
    if thsr:
        path = os.path.join(OUTPUT_DIR, f"thsr_timetable_{timestamp()}.json")
        save_data(thsr, path, label="高鐵時刻")
        results["thsr"] = thsr

    # 台鐵
    tra = api.get_tra_timetable(top=100)
    if tra:
        path = os.path.join(OUTPUT_DIR, f"tra_timetable_{timestamp()}.json")
        save_data(tra, path, label="台鐵時刻")
        results["tra"] = tra

    # 國內航班
    dom_flights = api.get_domestic_flights(top=100)
    if dom_flights:
        path = os.path.join(OUTPUT_DIR, f"domestic_flights_{timestamp()}.json")
        save_data(dom_flights, path, label="國內航班")
        results["domestic_flights"] = dom_flights

    # 客運
    bus = api.get_intercity_bus_routes(top=100)
    if bus:
        path = os.path.join(OUTPUT_DIR, f"bus_routes_{timestamp()}.json")
        save_data(bus, path, label="客運路線")
        results["bus"] = bus

    return results


def main():
    parser = argparse.ArgumentParser(
        description="TrvicERP 資料爬蟲 - 飯店/航班/政府開放資料",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例:
  python -m scrapers.run --all
  python -m scrapers.run --booking --agoda --cities 台北 花蓮 墾丁
  python -m scrapers.run --skyscanner
  python -m scrapers.run --tourism --cities 花蓮 台東
  python -m scrapers.run --weather --locations 臺北市 花蓮縣
  python -m scrapers.run --transport
  python -m scrapers.run --airlines-only

環境變數:
  TDX_CLIENT_ID      TDX API Client ID
  TDX_CLIENT_SECRET  TDX API Client Secret
  CWA_API_KEY        中央氣象署 API Key
        """,
    )

    # 資料源選擇
    parser.add_argument("--all", action="store_true", help="執行所有爬蟲")
    parser.add_argument("--booking", action="store_true", help="爬 Booking.com 飯店")
    parser.add_argument("--agoda", action="store_true", help="爬 Agoda 飯店")
    parser.add_argument("--skyscanner", action="store_true", help="爬 Skyscanner 航班")
    parser.add_argument("--tourism", action="store_true", help="觀光局景點/旅館")
    parser.add_argument("--weather", action="store_true", help="氣象署天氣預報")
    parser.add_argument("--transport", action="store_true", help="TDX 交通時刻表")
    parser.add_argument("--airlines-only", action="store_true", help="只輸出靜態航空公司清單")

    # 篩選條件
    parser.add_argument("--cities", nargs="+", default=None,
                        help="指定城市 (如: 台北 花蓮 墾丁)")
    parser.add_argument("--locations", nargs="+", default=None,
                        help="指定天氣地點 (如: 臺北市 花蓮縣)")
    parser.add_argument("--max-per-city", type=int, default=30,
                        help="每城市最多飯店數 (預設 30)")
    parser.add_argument("--top", type=int, default=100,
                        help="觀光局 API 最多筆數 (預設 100)")

    # 輸出
    parser.add_argument("--output-dir", default=OUTPUT_DIR,
                        help=f"輸出目錄 (預設 {OUTPUT_DIR})")
    parser.add_argument("--verbose", "-v", action="store_true",
                        help="顯示詳細日誌")

    args = parser.parse_args()

    if args.verbose:
        logging.getLogger().setLevel(logging.DEBUG)

    if args.output_dir != OUTPUT_DIR:
        # Override global config
        import scrapers.config
        scrapers.config.OUTPUT_DIR = args.output_dir

    ensure_output_dir()

    # 如果沒選任何爬蟲，顯示說明
    any_selected = (
        args.all or args.booking or args.agoda or args.skyscanner
        or args.tourism or args.weather or args.transport or args.airlines_only
    )
    if not any_selected:
        parser.print_help()
        sys.exit(0)

    print("=" * 60)
    print("  TrvicERP Data Scraper")
    print(f"  Output: {args.output_dir}")
    print("=" * 60)

    # 執行
    if args.all or args.airlines_only:
        print("\n--- Static Airlines Data ---")
        run_airlines_static()

    if args.all or args.booking:
        print("\n--- Booking.com Hotels ---")
        run_booking(args.cities, args.max_per_city)

    if args.all or args.agoda:
        print("\n--- Agoda Hotels ---")
        run_agoda(args.cities, args.max_per_city)

    if args.all or args.skyscanner:
        print("\n--- Skyscanner Flights ---")
        run_skyscanner(None)

    if args.all or args.tourism:
        print("\n--- Tourism Bureau Data ---")
        run_tourism(args.cities, args.top)

    if args.all or args.weather:
        print("\n--- Weather Forecast ---")
        run_weather(args.locations)

    if args.all or args.transport:
        print("\n--- Transport Timetables ---")
        run_transport()

    print("\n" + "=" * 60)
    print("  Done! Check output files in:", args.output_dir)
    print("=" * 60)


if __name__ == "__main__":
    main()
