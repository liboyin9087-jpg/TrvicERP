#!/usr/bin/env python3
"""
TrvicERP Scraper Scheduler
定時排程爬取 — 支援兩種模式：

1. 獨立運行 (daemon): python -m scrapers.scheduler
2. 搭配 cron:         見 scrapers/crontab.example

排程邏輯：
- 飯店資料 (Booking/Agoda): 每週一次（資料變動慢）
- 航班資料 (Skyscanner):    每週兩次（班表較固定）
- 觀光局景點/旅館:          每月一次（政府資料更新慢）
- 天氣預報:                 每 6 小時（即時性高）
- 交通時刻表:               每週一次
- 航空公司靜態資料:          每月一次
"""
import os
import sys
import json
import signal
import logging
import argparse
from datetime import datetime
from pathlib import Path

# ---- 第三方 (選用) ----
try:
    from apscheduler.schedulers.blocking import BlockingScheduler
    from apscheduler.triggers.cron import CronTrigger
    HAS_APSCHEDULER = True
except ImportError:
    HAS_APSCHEDULER = False

from scrapers.config import OUTPUT_DIR

# ============ Logging ============

LOG_DIR = os.path.join(OUTPUT_DIR, "logs")


def setup_logging():
    os.makedirs(LOG_DIR, exist_ok=True)
    log_file = os.path.join(LOG_DIR, f"scheduler_{datetime.now():%Y%m%d}.log")

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
        handlers=[
            logging.FileHandler(log_file, encoding="utf-8"),
            logging.StreamHandler(sys.stdout),
        ],
    )
    return logging.getLogger("scheduler")


# ============ Job Functions ============

def job_booking():
    """定時爬 Booking.com 飯店"""
    logger = logging.getLogger("scheduler.booking")
    logger.info("=== START: Booking.com 飯店爬取 ===")
    try:
        from scrapers.booking_scraper import BookingScraper
        from scrapers.models import save_hotels
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        scraper = BookingScraper()
        cities = ["台北", "台中", "高雄", "花蓮", "台東", "墾丁", "宜蘭", "嘉義"]
        hotels = scraper.scrape(cities=cities, max_per_city=30)

        if hotels:
            ts = datetime.now().strftime("%Y%m%d_%H%M")
            path = os.path.join(OUTPUT_DIR, f"booking_hotels_{ts}.json")
            save_hotels(hotels, path)
            logger.info(f"Booking.com 完成: {len(hotels)} 間飯店")
            _write_status("booking", "success", len(hotels))
        else:
            logger.warning("Booking.com: 沒有取得任何資料")
            _write_status("booking", "empty", 0)
    except Exception as e:
        logger.error(f"Booking.com 失敗: {e}", exc_info=True)
        _write_status("booking", "error", 0, str(e))


def job_agoda():
    """定時爬 Agoda 飯店"""
    logger = logging.getLogger("scheduler.agoda")
    logger.info("=== START: Agoda 飯店爬取 ===")
    try:
        from scrapers.agoda_scraper import AgodaScraper
        from scrapers.models import save_hotels
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        scraper = AgodaScraper()
        cities = ["台北", "台中", "高雄", "花蓮", "台東", "墾丁", "宜蘭", "嘉義"]
        hotels = scraper.scrape(cities=cities, max_per_city=30)

        if hotels:
            ts = datetime.now().strftime("%Y%m%d_%H%M")
            path = os.path.join(OUTPUT_DIR, f"agoda_hotels_{ts}.json")
            save_hotels(hotels, path)
            logger.info(f"Agoda 完成: {len(hotels)} 間飯店")
            _write_status("agoda", "success", len(hotels))
        else:
            logger.warning("Agoda: 沒有取得任何資料")
            _write_status("agoda", "empty", 0)
    except Exception as e:
        logger.error(f"Agoda 失敗: {e}", exc_info=True)
        _write_status("agoda", "error", 0, str(e))


def job_skyscanner():
    """定時爬 Skyscanner 航班"""
    logger = logging.getLogger("scheduler.skyscanner")
    logger.info("=== START: Skyscanner 航班爬取 ===")
    try:
        from scrapers.skyscanner_scraper import SkyscannerScraper
        from scrapers.models import save_flights, save_airlines
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        scraper = SkyscannerScraper()
        flights, airlines = scraper.scrape()

        ts = datetime.now().strftime("%Y%m%d_%H%M")
        if flights:
            save_flights(flights, os.path.join(OUTPUT_DIR, f"skyscanner_flights_{ts}.json"))
        if airlines:
            save_airlines(airlines, os.path.join(OUTPUT_DIR, f"skyscanner_airlines_{ts}.json"))

        logger.info(f"Skyscanner 完成: {len(flights)} 航班, {len(airlines)} 航空公司")
        _write_status("skyscanner", "success", len(flights))
    except Exception as e:
        logger.error(f"Skyscanner 失敗: {e}", exc_info=True)
        _write_status("skyscanner", "error", 0, str(e))


def job_tourism():
    """定時抓觀光局資料"""
    logger = logging.getLogger("scheduler.tourism")
    logger.info("=== START: 觀光局資料 ===")
    try:
        from scrapers.taiwan_gov_api import TourismBureauAPI, save_data
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        api = TourismBureauAPI()
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        total = 0

        spots = api.get_scenic_spots(top=500)
        if spots:
            save_data(spots, os.path.join(OUTPUT_DIR, f"tourism_spots_{ts}.json"), "景點")
            total += len(spots)

        hotels = api.get_hotels(top=500)
        if hotels:
            save_data(hotels, os.path.join(OUTPUT_DIR, f"tourism_hotels_{ts}.json"), "旅館")
            total += len(hotels)

        restaurants = api.get_restaurants(top=300)
        if restaurants:
            save_data(restaurants, os.path.join(OUTPUT_DIR, f"tourism_restaurants_{ts}.json"), "餐廳")
            total += len(restaurants)

        logger.info(f"觀光局完成: {total} 筆資料")
        _write_status("tourism", "success", total)
    except Exception as e:
        logger.error(f"觀光局失敗: {e}", exc_info=True)
        _write_status("tourism", "error", 0, str(e))


def job_weather():
    """定時抓天氣預報"""
    logger = logging.getLogger("scheduler.weather")
    logger.info("=== START: 天氣預報 ===")
    try:
        from scrapers.taiwan_gov_api import WeatherAPI, save_data
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        api = WeatherAPI()
        ts = datetime.now().strftime("%Y%m%d_%H%M")

        forecasts = api.get_forecast_36h()
        if forecasts:
            save_data(forecasts, os.path.join(OUTPUT_DIR, f"weather_{ts}.json"), "天氣預報")

        alerts = api.get_weather_alerts()
        if alerts:
            save_data(alerts, os.path.join(OUTPUT_DIR, f"weather_alerts_{ts}.json"), "天氣特報")

        total = len(forecasts) + len(alerts)
        logger.info(f"天氣完成: {len(forecasts)} 預報, {len(alerts)} 特報")
        _write_status("weather", "success", total)
    except Exception as e:
        logger.error(f"天氣失敗: {e}", exc_info=True)
        _write_status("weather", "error", 0, str(e))


def job_transport():
    """定時抓交通時刻表"""
    logger = logging.getLogger("scheduler.transport")
    logger.info("=== START: 交通時刻表 ===")
    try:
        from scrapers.taiwan_gov_api import TDXTransportAPI, save_data
        os.makedirs(OUTPUT_DIR, exist_ok=True)

        api = TDXTransportAPI()
        ts = datetime.now().strftime("%Y%m%d_%H%M")
        total = 0

        thsr = api.get_thsr_timetable(top=200)
        if thsr:
            save_data(thsr, os.path.join(OUTPUT_DIR, f"thsr_{ts}.json"), "高鐵")
            total += len(thsr)

        tra = api.get_tra_timetable(top=200)
        if tra:
            save_data(tra, os.path.join(OUTPUT_DIR, f"tra_{ts}.json"), "台鐵")
            total += len(tra)

        logger.info(f"交通完成: {total} 筆時刻")
        _write_status("transport", "success", total)
    except Exception as e:
        logger.error(f"交通失敗: {e}", exc_info=True)
        _write_status("transport", "error", 0, str(e))


def job_cleanup():
    """清理 7 天前的舊檔案"""
    logger = logging.getLogger("scheduler.cleanup")
    import time

    cutoff = time.time() - 7 * 86400
    removed = 0
    for f in Path(OUTPUT_DIR).glob("*.json"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            removed += 1

    for f in Path(LOG_DIR).glob("*.log"):
        if f.stat().st_mtime < cutoff:
            f.unlink()
            removed += 1

    if removed:
        logger.info(f"清理完成: 刪除 {removed} 個過期檔案")


# ============ Status Tracking ============

def _write_status(source: str, status: str, count: int, error: str = ""):
    """寫入最後執行狀態，方便 dashboard 讀取"""
    status_file = os.path.join(OUTPUT_DIR, "scraper_status.json")

    # 讀取現有狀態
    existing = {}
    if os.path.exists(status_file):
        try:
            with open(status_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
        except (json.JSONDecodeError, IOError):
            pass

    existing[source] = {
        "status": status,
        "count": count,
        "last_run": datetime.now().isoformat(),
        "error": error,
    }

    with open(status_file, "w", encoding="utf-8") as f:
        json.dump(existing, f, ensure_ascii=False, indent=2)


# ============ APScheduler Daemon ============

def run_daemon():
    """以 daemon 模式運行，使用 APScheduler 定時排程"""
    if not HAS_APSCHEDULER:
        print("ERROR: 需要安裝 apscheduler:")
        print("  pip install apscheduler")
        sys.exit(1)

    logger = setup_logging()
    logger.info("Scraper scheduler daemon starting...")

    scheduler = BlockingScheduler(timezone="Asia/Taipei")

    # ---- 排程設定 ----

    # 飯店：每週日 02:00 (Booking) / 03:00 (Agoda)
    scheduler.add_job(job_booking, CronTrigger(day_of_week="sun", hour=2, minute=0),
                      id="booking", name="Booking.com Hotels")
    scheduler.add_job(job_agoda, CronTrigger(day_of_week="sun", hour=3, minute=0),
                      id="agoda", name="Agoda Hotels")

    # 航班：每週三、六 04:00
    scheduler.add_job(job_skyscanner, CronTrigger(day_of_week="wed,sat", hour=4, minute=0),
                      id="skyscanner", name="Skyscanner Flights")

    # 觀光局：每月 1 號 05:00
    scheduler.add_job(job_tourism, CronTrigger(day=1, hour=5, minute=0),
                      id="tourism", name="Tourism Bureau")

    # 天氣：每 6 小時 (00:00, 06:00, 12:00, 18:00)
    scheduler.add_job(job_weather, CronTrigger(hour="0,6,12,18", minute=0),
                      id="weather", name="Weather Forecast")

    # 交通：每週一 05:30
    scheduler.add_job(job_transport, CronTrigger(day_of_week="mon", hour=5, minute=30),
                      id="transport", name="Transport Timetables")

    # 清理舊檔：每天 06:00
    scheduler.add_job(job_cleanup, CronTrigger(hour=6, minute=0),
                      id="cleanup", name="Cleanup Old Files")

    # 列出所有排程
    logger.info("Scheduled jobs:")
    for job in scheduler.get_jobs():
        logger.info(f"  {job.name:30s} | next: {job.next_run_time}")

    # 優雅關閉
    def shutdown(signum, frame):
        logger.info("Shutting down scheduler...")
        scheduler.shutdown(wait=False)

    signal.signal(signal.SIGINT, shutdown)
    signal.signal(signal.SIGTERM, shutdown)

    print("\nScheduler running. Press Ctrl+C to stop.\n")

    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Scheduler stopped.")


# ============ One-Shot (for cron) ============

def run_once(job_name: str):
    """執行單一 job（供 cron 呼叫）"""
    setup_logging()

    jobs = {
        "booking": job_booking,
        "agoda": job_agoda,
        "skyscanner": job_skyscanner,
        "tourism": job_tourism,
        "weather": job_weather,
        "transport": job_transport,
        "cleanup": job_cleanup,
    }

    if job_name == "all":
        for name, fn in jobs.items():
            fn()
    elif job_name in jobs:
        jobs[job_name]()
    else:
        print(f"Unknown job: {job_name}")
        print(f"Available: {', '.join(jobs.keys())}, all")
        sys.exit(1)


# ============ Main ============

def main():
    parser = argparse.ArgumentParser(
        description="TrvicERP Scraper Scheduler — 定時爬取排程",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
模式:
  daemon  以 APScheduler 背景常駐運行（需 pip install apscheduler）
  once    執行單一 job 後結束（搭配 cron 使用）
  status  查看最後執行狀態

範例:
  python -m scrapers.scheduler daemon              # 背景常駐
  python -m scrapers.scheduler once booking         # 跑一次 Booking
  python -m scrapers.scheduler once weather         # 跑一次天氣
  python -m scrapers.scheduler once all             # 全部跑一次
  python -m scrapers.scheduler status               # 查看狀態
        """,
    )

    parser.add_argument("mode", choices=["daemon", "once", "status"],
                        help="運行模式")
    parser.add_argument("job", nargs="?", default="all",
                        help="(once 模式) job 名稱: booking/agoda/skyscanner/tourism/weather/transport/cleanup/all")

    args = parser.parse_args()

    if args.mode == "daemon":
        run_daemon()
    elif args.mode == "once":
        run_once(args.job)
    elif args.mode == "status":
        show_status()


def show_status():
    """顯示各爬蟲最後執行狀態"""
    status_file = os.path.join(OUTPUT_DIR, "scraper_status.json")
    if not os.path.exists(status_file):
        print("尚未有任何執行紀錄")
        return

    with open(status_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    print(f"\n{'Source':15s} {'Status':10s} {'Count':>8s}  {'Last Run':20s}  Error")
    print("-" * 80)
    for source, info in data.items():
        status = info.get("status", "?")
        count = info.get("count", 0)
        last_run = info.get("last_run", "?")[:19]
        error = info.get("error", "")[:30]

        status_icon = "OK" if status == "success" else "!!" if status == "error" else "--"
        print(f"{source:15s} {status_icon} {status:7s} {count:>8d}  {last_run:20s}  {error}")

    print()


if __name__ == "__main__":
    main()
