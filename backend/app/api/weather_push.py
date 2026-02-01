"""
CWA 天氣 + Gemini AI 推播 API
- GET  /api/v1/weather/forecast      取得指定地點天氣預報
- GET  /api/v1/weather/alerts         取得天氣警特報
- POST /api/v1/weather/push           觸發 AI 推播（PoP>=60% 雨具提醒、MaxT>=33 防曬）
- POST /api/v1/weather/push/auto      排程用：自動偵測並推播
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import Notification
from datetime import datetime
from uuid import uuid4
import httpx
import os
import json

router = APIRouter(prefix="/api/v1/weather", tags=["Weather Push"])

# ============ Config ============

CWA_API_KEY = os.getenv("CWA_API_KEY", "")
CWA_BASE_URL = "https://opendata.cwa.gov.tw/api/v1/rest/datastore"

# 36 小時天氣預報 dataset
CWA_FORECAST_36H = "F-C0032-001"

# 各縣市 36h 預報 dataset ID
CITY_FORECAST_IDS = {
    "臺北市": "F-D0047-061", "新北市": "F-D0047-069", "基隆市": "F-D0047-049",
    "桃園市": "F-D0047-005", "新竹市": "F-D0047-053", "新竹縣": "F-D0047-009",
    "苗栗縣": "F-D0047-013", "臺中市": "F-D0047-073", "彰化縣": "F-D0047-017",
    "南投縣": "F-D0047-021", "雲林縣": "F-D0047-025", "嘉義市": "F-D0047-057",
    "嘉義縣": "F-D0047-029", "臺南市": "F-D0047-077", "高雄市": "F-D0047-065",
    "屏東縣": "F-D0047-033", "宜蘭縣": "F-D0047-001", "花蓮縣": "F-D0047-041",
    "臺東縣": "F-D0047-037", "澎湖縣": "F-D0047-045", "金門縣": "F-D0047-085",
    "連江縣": "F-D0047-081",
}

# Gemini config
GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"

# 推播閾值
POP_RAIN_THRESHOLD = 60      # 降雨機率 >= 60% 觸發雨具提醒
MAXT_HEAT_THRESHOLD = 33     # 最高溫 >= 33°C 觸發防曬提醒

# ============ Schemas ============

class ForecastResponse(BaseModel):
    location: str
    forecasts: List[Dict[str, Any]]

class WeatherAlert(BaseModel):
    type: str  # rain / heat / cold / storm
    location: str
    summary: str
    pop: Optional[int] = None
    max_t: Optional[float] = None
    min_t: Optional[float] = None

class PushRequest(BaseModel):
    location: str  # 縣市名稱
    session_id: Optional[str] = None  # 關聯的團次
    user_id: Optional[str] = None     # 推送對象

class PushResponse(BaseModel):
    alerts: List[WeatherAlert]
    ai_message: str
    notification_ids: List[str]

# ============ CWA Helpers ============

async def fetch_cwa_forecast(location: str) -> Dict[str, Any]:
    """從 CWA 取得指定縣市的 36h 天氣預報"""
    if not CWA_API_KEY:
        raise HTTPException(status_code=503, detail="CWA API key not configured (set CWA_API_KEY)")

    params = {
        "Authorization": CWA_API_KEY,
        "locationName": location,
    }
    url = f"{CWA_BASE_URL}/{CWA_FORECAST_36H}"

    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"CWA API error: {resp.status_code}")
        return resp.json()


def parse_forecast_elements(location_data: Dict) -> List[Dict[str, Any]]:
    """解析 CWA 回傳的 weather elements 成簡化結構"""
    forecasts = []
    elements = location_data.get("weatherElement", [])

    # Build a time-indexed dict
    time_slots: Dict[str, Dict[str, Any]] = {}

    for elem in elements:
        name = elem.get("elementName", "")
        for t in elem.get("time", []):
            start = t.get("startTime", "")
            if start not in time_slots:
                time_slots[start] = {
                    "start_time": start,
                    "end_time": t.get("endTime", ""),
                }
            param = t.get("parameter", {})
            value = param.get("parameterName", "")

            if name == "Wx":
                time_slots[start]["weather"] = value
            elif name == "PoP":
                time_slots[start]["pop"] = int(value) if value.isdigit() else 0
            elif name == "MinT":
                try:
                    time_slots[start]["min_t"] = float(value)
                except ValueError:
                    pass
            elif name == "MaxT":
                try:
                    time_slots[start]["max_t"] = float(value)
                except ValueError:
                    pass
            elif name == "CI":
                time_slots[start]["comfort"] = value

    for slot in sorted(time_slots.values(), key=lambda x: x.get("start_time", "")):
        forecasts.append(slot)

    return forecasts


def detect_alerts(location: str, forecasts: List[Dict[str, Any]]) -> List[WeatherAlert]:
    """根據預報資料偵測需要推播的警示"""
    alerts = []
    for f in forecasts:
        pop = f.get("pop", 0)
        max_t = f.get("max_t")
        min_t = f.get("min_t")

        if pop >= POP_RAIN_THRESHOLD:
            alerts.append(WeatherAlert(
                type="rain",
                location=location,
                summary=f"{f.get('start_time', '')} 降雨機率 {pop}%，建議攜帶雨具",
                pop=pop,
            ))
        if max_t is not None and max_t >= MAXT_HEAT_THRESHOLD:
            alerts.append(WeatherAlert(
                type="heat",
                location=location,
                summary=f"{f.get('start_time', '')} 最高溫 {max_t}°C，注意防曬補水",
                max_t=max_t,
            ))
        if min_t is not None and min_t <= 10:
            alerts.append(WeatherAlert(
                type="cold",
                location=location,
                summary=f"{f.get('start_time', '')} 最低溫 {min_t}°C，請注意保暖",
                min_t=min_t,
            ))

    return alerts

# ============ Gemini AI ============

async def generate_push_message(location: str, alerts: List[WeatherAlert], forecasts: List[Dict]) -> str:
    """使用 Gemini 產生友善的推播文案"""
    if not GEMINI_API_KEY:
        # Fallback: 不用 AI，直接拼接
        if not alerts:
            return f"{location} 天氣穩定，祝旅途愉快！"
        lines = [a.summary for a in alerts]
        return f"【{location} 天氣提醒】\n" + "\n".join(lines)

    alerts_text = "\n".join([f"- [{a.type}] {a.summary}" for a in alerts])
    forecast_summary = json.dumps(forecasts[:3], ensure_ascii=False, default=str)

    prompt = f"""你是一位專業旅遊領隊，正在帶團前往{location}。
根據以下天氣預報與警示，撰寫一段簡短、溫暖、實用的推播訊息（繁體中文，100字以內）。
語氣要親切但專業，像在 LINE 群組跟團員說話。如果有雨，提醒帶傘；如果很熱，提醒防曬補水。

天氣警示:
{alerts_text if alerts_text else "無特殊警示"}

天氣預報摘要:
{forecast_summary}

請直接輸出推播文案，不要加任何前綴標題。"""

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"maxOutputTokens": 200, "temperature": 0.7},
    }

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            resp = await client.post(
                f"{GEMINI_API_URL}?key={GEMINI_API_KEY}",
                json=payload,
            )
            if resp.status_code == 200:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                return text.strip() if text else f"【{location}天氣提醒】" + (alerts[0].summary if alerts else "天氣良好")
    except Exception:
        pass

    # Fallback
    if alerts:
        return f"【{location} 天氣提醒】{alerts[0].summary}"
    return f"{location} 天氣穩定，祝旅途愉快！"

# ============ Endpoints ============

@router.get("/forecast", response_model=ForecastResponse)
async def get_forecast(location: str = "臺北市"):
    """取得指定縣市的 36 小時天氣預報"""
    data = await fetch_cwa_forecast(location)

    records = data.get("records", {})
    locations = records.get("location", [])
    if not locations:
        raise HTTPException(status_code=404, detail=f"No forecast data for {location}")

    loc_data = locations[0]
    forecasts = parse_forecast_elements(loc_data)

    return ForecastResponse(location=loc_data.get("locationName", location), forecasts=forecasts)


@router.get("/alerts")
async def get_alerts(location: str = "臺北市"):
    """取得指定縣市的天氣警示（PoP>=60, MaxT>=33, MinT<=10）"""
    data = await fetch_cwa_forecast(location)
    records = data.get("records", {})
    locations = records.get("location", [])
    if not locations:
        return {"location": location, "alerts": []}

    loc_data = locations[0]
    forecasts = parse_forecast_elements(loc_data)
    alerts = detect_alerts(location, forecasts)

    return {
        "location": location,
        "alerts": [a.dict() for a in alerts],
        "forecast_count": len(forecasts),
    }


@router.post("/push", response_model=PushResponse)
async def push_weather_notification(req: PushRequest, db: Session = Depends(get_db)):
    """
    手動觸發天氣推播:
    1. 查 CWA 天氣預報
    2. 偵測警示 (PoP>=60 / MaxT>=33 / MinT<=10)
    3. 用 Gemini 產生推播文案
    4. 寫入 Notification 表
    """
    data = await fetch_cwa_forecast(req.location)
    records = data.get("records", {})
    locations = records.get("location", [])

    if not locations:
        raise HTTPException(status_code=404, detail=f"No forecast data for {req.location}")

    loc_data = locations[0]
    forecasts = parse_forecast_elements(loc_data)
    alerts = detect_alerts(req.location, forecasts)
    ai_message = await generate_push_message(req.location, alerts, forecasts)

    # Save notification
    notification_ids = []
    notif = Notification(
        id=f"ntf_{uuid4().hex[:12]}",
        user_id=req.user_id,
        type="system",
        title=f"天氣提醒 - {req.location}",
        message=ai_message,
        status="sent",
        priority="high" if alerts else "normal",
        sent_at=datetime.utcnow(),
        notification_metadata={
            "source": "cwa_weather",
            "location": req.location,
            "session_id": req.session_id,
            "alerts_count": len(alerts),
            "alert_types": list(set(a.type for a in alerts)),
        },
    )
    db.add(notif)
    db.commit()
    notification_ids.append(notif.id)

    return PushResponse(
        alerts=alerts,
        ai_message=ai_message,
        notification_ids=notification_ids,
    )


@router.post("/push/auto")
async def auto_push_weather(
    locations: List[str] = ["臺北市", "高雄市", "花蓮縣"],
    db: Session = Depends(get_db),
):
    """
    排程用：自動檢查多個地點的天氣，有警示才推播
    適合放在 cron 或 APScheduler 每 6 小時執行一次
    """
    results = []
    for loc in locations:
        try:
            data = await fetch_cwa_forecast(loc)
            records = data.get("records", {})
            locs = records.get("location", [])
            if not locs:
                continue

            loc_data = locs[0]
            forecasts = parse_forecast_elements(loc_data)
            alerts = detect_alerts(loc, forecasts)

            if not alerts:
                results.append({"location": loc, "status": "no_alert"})
                continue

            ai_message = await generate_push_message(loc, alerts, forecasts)

            notif = Notification(
                id=f"ntf_{uuid4().hex[:12]}",
                type="system",
                title=f"天氣提醒 - {loc}",
                message=ai_message,
                status="sent",
                priority="high",
                sent_at=datetime.utcnow(),
                notification_metadata={
                    "source": "cwa_weather_auto",
                    "location": loc,
                    "alerts_count": len(alerts),
                },
            )
            db.add(notif)
            results.append({
                "location": loc,
                "status": "pushed",
                "alerts": len(alerts),
                "notification_id": notif.id,
            })
        except Exception as e:
            results.append({"location": loc, "status": "error", "error": str(e)})

    db.commit()
    return {"processed": len(locations), "results": results}
