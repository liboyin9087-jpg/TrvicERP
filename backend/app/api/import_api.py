"""
Import API endpoints for TrvicERP
Handles data import from external sources including Chrome extension
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import uuid4
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/import", tags=["Data Import"])


# Pydantic Schemas
class ImportSourceBase(BaseModel):
    source_type: str = Field(..., description="Type: competitor, excel, api, chrome_extension")
    source_name: str = Field(..., description="Name of the import source")
    source_url: Optional[str] = None
    credentials: Optional[Dict[str, Any]] = Field(default=None, exclude=True)
    is_active: bool = True
    sync_frequency: Optional[str] = Field(default="manual", description="manual, hourly, daily, weekly")


class ImportSourceCreate(ImportSourceBase):
    pass


class ImportSourceResponse(ImportSourceBase):
    id: str
    last_sync_at: Optional[datetime] = None
    sync_status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ImportJobBase(BaseModel):
    source_id: str
    data_type: str = Field(..., description="Type of data: tours, prices, availability")
    raw_data: Dict[str, Any]


class ImportJobCreate(ImportJobBase):
    pass


class ImportJobResponse(BaseModel):
    id: str
    source_id: str
    data_type: str
    status: str = Field(..., description="pending, processing, completed, failed")
    records_total: int
    records_processed: int
    records_failed: int
    errors: List[Dict[str, Any]]
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class CompetitorTourData(BaseModel):
    competitor_name: str
    tour_name: str
    destination: str
    duration_days: int
    price: float
    currency: str = "TWD"
    departure_dates: List[str] = Field(default_factory=list)
    inclusions: List[str] = Field(default_factory=list)
    source_url: Optional[str] = None
    scraped_at: datetime = Field(default_factory=datetime.utcnow)


class ChromeExtensionPayload(BaseModel):
    page_url: str
    page_title: str
    extracted_data: Dict[str, Any]
    extraction_type: str = Field(..., description="tour, price, competitor")
    user_agent: Optional[str] = None


# In-memory storage
import_sources_db: dict = {}
import_jobs_db: dict = {}
competitor_data_db: dict = {}


# Import Source Management
@router.get("/sources", response_model=List[ImportSourceResponse])
async def list_import_sources(
    source_type: Optional[str] = None,
    is_active: Optional[bool] = None
):
    """List all import sources"""
    results = list(import_sources_db.values())
    
    if source_type:
        results = [s for s in results if s.get("source_type") == source_type]
    if is_active is not None:
        results = [s for s in results if s.get("is_active") == is_active]
    
    return results


@router.post("/sources", response_model=ImportSourceResponse, status_code=status.HTTP_201_CREATED)
async def create_import_source(source: ImportSourceCreate):
    """Create a new import source"""
    source_id = f"src_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    source_data = {
        "id": source_id,
        **source.dict(exclude={"credentials"}),
        "last_sync_at": None,
        "sync_status": "never_synced",
        "created_at": now,
        "updated_at": now
    }
    
    import_sources_db[source_id] = source_data
    return source_data


@router.get("/sources/{source_id}", response_model=ImportSourceResponse)
async def get_import_source(source_id: str):
    """Get a specific import source"""
    if source_id not in import_sources_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import source {source_id} not found"
        )
    return import_sources_db[source_id]


@router.delete("/sources/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_import_source(source_id: str):
    """Delete an import source"""
    if source_id not in import_sources_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import source {source_id} not found"
        )
    
    del import_sources_db[source_id]
    return None


# Import Job Management
@router.get("/jobs", response_model=List[ImportJobResponse])
async def list_import_jobs(
    source_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50
):
    """List import jobs"""
    results = list(import_jobs_db.values())
    
    if source_id:
        results = [j for j in results if j.get("source_id") == source_id]
    if status:
        results = [j for j in results if j.get("status") == status]
    
    # Sort by created_at descending
    results.sort(key=lambda x: x.get("created_at", datetime.min), reverse=True)
    
    return results[:limit]


@router.post("/jobs", response_model=ImportJobResponse, status_code=status.HTTP_201_CREATED)
async def create_import_job(job: ImportJobCreate):
    """Create a new import job"""
    job_id = f"job_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    # Validate source exists
    if job.source_id not in import_sources_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import source {job.source_id} not found"
        )
    
    # Process the import (simplified)
    records = job.raw_data.get("records", [])
    records_total = len(records) if isinstance(records, list) else 1
    
    job_data = {
        "id": job_id,
        "source_id": job.source_id,
        "data_type": job.data_type,
        "status": "completed",
        "records_total": records_total,
        "records_processed": records_total,
        "records_failed": 0,
        "errors": [],
        "created_at": now,
        "completed_at": now
    }
    
    import_jobs_db[job_id] = job_data
    
    # Update source last sync time
    if job.source_id in import_sources_db:
        import_sources_db[job.source_id]["last_sync_at"] = now
        import_sources_db[job.source_id]["sync_status"] = "success"
    
    return job_data


@router.get("/jobs/{job_id}", response_model=ImportJobResponse)
async def get_import_job(job_id: str):
    """Get a specific import job"""
    if job_id not in import_jobs_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import job {job_id} not found"
        )
    return import_jobs_db[job_id]


# Competitor Data Import
@router.post("/competitor/tour")
async def import_competitor_tour(tour_data: CompetitorTourData):
    """Import competitor tour data"""
    data_id = f"cmp_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    data_record = {
        "id": data_id,
        **tour_data.dict(),
        "imported_at": now,
        "status": "active",
        "price_history": [
            {"price": tour_data.price, "date": now.isoformat()}
        ]
    }
    
    competitor_data_db[data_id] = data_record
    
    return {
        "message": "Competitor tour data imported successfully",
        "data_id": data_id,
        "competitor": tour_data.competitor_name,
        "tour": tour_data.tour_name
    }


@router.get("/competitor/tours")
async def list_competitor_tours(
    competitor_name: Optional[str] = None,
    destination: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None
):
    """List imported competitor tour data"""
    results = list(competitor_data_db.values())
    
    if competitor_name:
        results = [t for t in results if t.get("competitor_name") == competitor_name]
    if destination:
        results = [t for t in results if destination.lower() in t.get("destination", "").lower()]
    if min_price:
        results = [t for t in results if t.get("price", 0) >= min_price]
    if max_price:
        results = [t for t in results if t.get("price", float('inf')) <= max_price]
    
    return {"tours": results, "total": len(results)}


@router.get("/competitor/analysis")
async def get_competitor_analysis(destination: Optional[str] = None):
    """Get competitor price analysis"""
    tours = list(competitor_data_db.values())
    
    if destination:
        tours = [t for t in tours if destination.lower() in t.get("destination", "").lower()]
    
    if not tours:
        return {"message": "No competitor data available", "tours": 0}
    
    prices = [t.get("price", 0) for t in tours]
    
    # Group by competitor
    by_competitor = {}
    for t in tours:
        comp = t.get("competitor_name", "Unknown")
        if comp not in by_competitor:
            by_competitor[comp] = []
        by_competitor[comp].append(t.get("price", 0))
    
    competitor_stats = []
    for comp, comp_prices in by_competitor.items():
        competitor_stats.append({
            "competitor": comp,
            "tour_count": len(comp_prices),
            "avg_price": round(sum(comp_prices) / len(comp_prices), 2),
            "min_price": min(comp_prices),
            "max_price": max(comp_prices)
        })
    
    return {
        "destination": destination or "all",
        "total_tours": len(tours),
        "price_analysis": {
            "average": round(sum(prices) / len(prices), 2),
            "minimum": min(prices),
            "maximum": max(prices),
            "median": sorted(prices)[len(prices) // 2]
        },
        "by_competitor": competitor_stats,
        "insights": [
            f"共收集 {len(tours)} 個競爭對手行程資料",
            f"平均價格為 {round(sum(prices) / len(prices), 2)} TWD",
            f"價格範圍從 {min(prices)} 到 {max(prices)} TWD"
        ]
    }


# Chrome Extension Integration
@router.post("/chrome-extension/submit")
async def submit_chrome_extension_data(payload: ChromeExtensionPayload):
    """Receive data from Chrome extension"""
    submission_id = f"ext_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    # Process based on extraction type
    if payload.extraction_type == "tour":
        # Extract tour data
        extracted = payload.extracted_data
        tour_data = {
            "id": submission_id,
            "source": "chrome_extension",
            "page_url": payload.page_url,
            "page_title": payload.page_title,
            "tour_name": extracted.get("tour_name", ""),
            "destination": extracted.get("destination", ""),
            "price": extracted.get("price", 0),
            "duration": extracted.get("duration", ""),
            "extracted_at": now,
            "raw_data": extracted
        }
        competitor_data_db[submission_id] = tour_data
    
    return {
        "message": "Data received successfully",
        "submission_id": submission_id,
        "extraction_type": payload.extraction_type,
        "timestamp": now.isoformat()
    }


@router.get("/chrome-extension/config")
async def get_chrome_extension_config():
    """Get Chrome extension configuration"""
    return {
        "version": "1.0.0",
        "api_endpoint": "/api/v1/import/chrome-extension/submit",
        "supported_sites": [
            {"domain": "*.liontravel.com", "type": "competitor"},
            {"domain": "*.colatour.com.tw", "type": "competitor"},
            {"domain": "*.settour.com.tw", "type": "competitor"},
            {"domain": "*.startravel.com.tw", "type": "competitor"},
            {"domain": "*.eztravel.com.tw", "type": "competitor"}
        ],
        "extraction_rules": {
            "tour_name": ["h1.tour-title", ".product-name", "[data-tour-name]"],
            "price": [".price", ".tour-price", "[data-price]"],
            "destination": [".destination", ".tour-destination"]
        },
        "auto_submit": False,
        "sync_interval": 3600
    }
