"""
Visa Application API endpoints for TrvicERP
Manages visa applications, document tracking, and requirements
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4

router = APIRouter(prefix="/api/v1/visa", tags=["Visa"])


# ─── Pydantic Schemas ───

class VisaApplicationBase(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str = Field(..., description="申請人姓名")
    passport_number: Optional[str] = None
    nationality: Optional[str] = Field(default="TW")
    destination_country: str = Field(..., description="目的國家代碼")
    visa_type: str = Field(..., description="tourist, business, work, student, transit")
    application_date: Optional[date] = None
    appointment_date: Optional[date] = None
    entry_type: Optional[str] = Field(default="single", description="single, multiple")
    duration_of_stay: Optional[str] = None
    processing_fee: Optional[float] = None
    service_fee: Optional[float] = None
    currency: str = Field(default="TWD")
    documents: Optional[list] = None
    notes: Optional[str] = None


class VisaApplicationCreate(VisaApplicationBase):
    pass


class VisaApplicationUpdate(BaseModel):
    status: Optional[str] = None
    appointment_date: Optional[date] = None
    expected_issue_date: Optional[date] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    entry_type: Optional[str] = None
    duration_of_stay: Optional[str] = None
    documents: Optional[list] = None
    embassy_notes: Optional[str] = None
    notes: Optional[str] = None
    assigned_to: Optional[str] = None


class VisaApplicationResponse(VisaApplicationBase):
    id: str
    application_number: str
    status: str
    expected_issue_date: Optional[date] = None
    issue_date: Optional[date] = None
    expiry_date: Optional[date] = None
    embassy_notes: Optional[str] = None
    assigned_to: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── In-memory Storage ───
applications_db: dict = {}
application_counter = 1


# ─── Application Endpoints ───

@router.get("", response_model=List[VisaApplicationResponse])
async def list_applications(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    destination_country: Optional[str] = None,
    visa_type: Optional[str] = None,
    assigned_to: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出所有簽證申請"""
    results = list(applications_db.values())
    if status:
        results = [a for a in results if a.get("status") == status]
    if customer_id:
        results = [a for a in results if a.get("customer_id") == customer_id]
    if destination_country:
        results = [a for a in results if a.get("destination_country") == destination_country]
    if visa_type:
        results = [a for a in results if a.get("visa_type") == visa_type]
    if assigned_to:
        results = [a for a in results if a.get("assigned_to") == assigned_to]
    return results[skip:skip + limit]


@router.post("", response_model=VisaApplicationResponse, status_code=status.HTTP_201_CREATED)
async def create_application(application: VisaApplicationCreate):
    """建立簽證申請"""
    global application_counter
    app_id = f"visa_{uuid4().hex[:12]}"
    app_number = f"VISA-{datetime.utcnow().strftime('%Y%m')}-{application_counter:04d}"
    application_counter += 1
    now = datetime.utcnow()

    app_data = {
        "id": app_id,
        "application_number": app_number,
        "status": "draft",
        "expected_issue_date": None,
        "issue_date": None,
        "expiry_date": None,
        "embassy_notes": None,
        "assigned_to": None,
        **application.dict(),
        "created_at": now,
        "updated_at": now,
    }
    applications_db[app_id] = app_data
    return app_data


@router.get("/{application_id}", response_model=VisaApplicationResponse)
async def get_application(application_id: str):
    """取得單一簽證申請"""
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
    return applications_db[application_id]


@router.put("/{application_id}", response_model=VisaApplicationResponse)
async def update_application(application_id: str, application: VisaApplicationUpdate):
    """更新簽證申請"""
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
    existing = applications_db[application_id]
    for key, value in application.dict(exclude_unset=True).items():
        existing[key] = value
    existing["updated_at"] = datetime.utcnow()
    applications_db[application_id] = existing
    return existing


@router.delete("/{application_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_application(application_id: str):
    """刪除簽證申請"""
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
    del applications_db[application_id]
    return None


@router.post("/{application_id}/submit", response_model=VisaApplicationResponse)
async def submit_application(application_id: str):
    """提交簽證申請"""
    if application_id not in applications_db:
        raise HTTPException(status_code=404, detail=f"Application {application_id} not found")
    existing = applications_db[application_id]
    if existing["status"] != "draft":
        raise HTTPException(status_code=400, detail="Only draft applications can be submitted")
    existing["status"] = "submitted"
    existing["application_date"] = datetime.utcnow()
    existing["updated_at"] = datetime.utcnow()
    return existing


# ─── Visa Requirements Reference ───

@router.get("/requirements/{country_code}")
async def get_requirements(country_code: str):
    """取得目的國簽證需求"""
    requirements = {
        "JP": {
            "country": "日本", "country_en": "Japan",
            "visa_required": False,
            "stay_duration": "90 天",
            "documents": ["有效護照 (6個月以上)", "來回機票", "住宿證明"],
            "processing_days": 0,
            "fee": 0,
            "notes": "台灣護照免簽證"
        },
        "KR": {
            "country": "韓國", "country_en": "South Korea",
            "visa_required": False,
            "stay_duration": "90 天",
            "documents": ["有效護照 (6個月以上)", "來回機票"],
            "processing_days": 0,
            "fee": 0,
            "notes": "台灣護照免簽證 (K-ETA 已取消)"
        },
        "US": {
            "country": "美國", "country_en": "United States",
            "visa_required": True,
            "stay_duration": "依簽證類型",
            "documents": ["DS-160 表格", "有效護照", "照片 (5x5cm)", "財力證明", "在職證明", "旅行計畫"],
            "processing_days": 14,
            "fee": 5280,
            "notes": "需預約面談，B1/B2 觀光商務簽證"
        },
        "CN": {
            "country": "中國大陸", "country_en": "China",
            "visa_required": True,
            "stay_duration": "依簽證類型",
            "documents": ["台胞證或入出境許可", "有效護照", "照片", "邀請函 (商務)"],
            "processing_days": 7,
            "fee": 1700,
            "notes": "需辦理台胞證"
        },
        "TH": {
            "country": "泰國", "country_en": "Thailand",
            "visa_required": False,
            "stay_duration": "30 天",
            "documents": ["有效護照 (6個月以上)", "來回機票", "住宿證明"],
            "processing_days": 0,
            "fee": 0,
            "notes": "台灣護照免簽證 (2024 延長至2025年底)"
        },
        "VN": {
            "country": "越南", "country_en": "Vietnam",
            "visa_required": True,
            "stay_duration": "30-90 天",
            "documents": ["護照正本", "照片 (4x6cm)", "簽證申請表", "邀請函 (商務)"],
            "processing_days": 5,
            "fee": 1800,
            "notes": "可辦理電子簽證 (e-Visa)"
        },
        "AU": {
            "country": "澳洲", "country_en": "Australia",
            "visa_required": True,
            "stay_duration": "3-12 個月",
            "documents": ["有效護照", "線上申請 (ETA)", "財力證明", "健康檢查 (長期)"],
            "processing_days": 3,
            "fee": 700,
            "notes": "可線上申請 ETA 電子簽證"
        },
        "EU": {
            "country": "歐盟申根區", "country_en": "EU Schengen",
            "visa_required": False,
            "stay_duration": "90 天 (180天內)",
            "documents": ["有效護照 (3個月以上)", "來回機票", "旅遊保險", "住宿證明"],
            "processing_days": 0,
            "fee": 0,
            "notes": "台灣護照免簽證，2025 起需 ETIAS"
        },
    }

    code = country_code.upper()
    if code not in requirements:
        raise HTTPException(status_code=404, detail=f"Requirements for {country_code} not found")
    return {"country_code": code, **requirements[code]}


@router.get("/requirements")
async def list_all_requirements():
    """列出所有國家簽證需求摘要"""
    return {
        "countries": [
            {"code": "JP", "name": "日本", "visa_required": False},
            {"code": "KR", "name": "韓國", "visa_required": False},
            {"code": "US", "name": "美國", "visa_required": True},
            {"code": "CN", "name": "中國大陸", "visa_required": True},
            {"code": "TH", "name": "泰國", "visa_required": False},
            {"code": "VN", "name": "越南", "visa_required": True},
            {"code": "AU", "name": "澳洲", "visa_required": True},
            {"code": "EU", "name": "歐盟申根區", "visa_required": False},
        ]
    }
