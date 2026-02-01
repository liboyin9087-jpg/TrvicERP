"""
Operations API endpoints for TrvicERP
Manages tour operations, daily schedules, and operational logistics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date, time
from uuid import uuid4
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/operations", tags=["Operations"])


# Pydantic Schemas
class OperationActivityBase(BaseModel):
    tour_id: str = Field(..., description="Associated tour ID")
    day_number: int = Field(..., ge=1, description="Day number in itinerary")
    activity_date: date
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    activity_type: str = Field(..., description="transport, accommodation, meal, attraction, free_time, other")
    title: str
    description: Optional[str] = None
    location: Optional[str] = None
    supplier_id: Optional[str] = None
    confirmation_number: Optional[str] = None
    cost: float = Field(default=0.0, ge=0)
    currency: str = Field(default="TWD")
    pax_count: Optional[int] = None
    contact_info: Optional[str] = None
    notes: Optional[str] = None
    status: str = Field(default="scheduled", description="scheduled, confirmed, in_progress, completed, cancelled")


class OperationActivityCreate(OperationActivityBase):
    pass


class OperationActivityUpdate(BaseModel):
    day_number: Optional[int] = None
    activity_date: Optional[date] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None
    activity_type: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    supplier_id: Optional[str] = None
    confirmation_number: Optional[str] = None
    cost: Optional[float] = None
    pax_count: Optional[int] = None
    contact_info: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


class OperationActivityResponse(OperationActivityBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TourGuideAssignment(BaseModel):
    tour_id: str
    guide_id: str
    guide_name: str
    guide_type: str = Field(..., description="tour_leader, local_guide, driver")
    start_date: date
    end_date: date
    daily_rate: Optional[float] = None
    contact_phone: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    notes: Optional[str] = None


class TourGuideAssignmentResponse(TourGuideAssignment):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DailyReportBase(BaseModel):
    tour_id: str
    report_date: date
    day_number: int
    weather: Optional[str] = None
    pax_count: int
    activities_completed: List[str] = Field(default_factory=list)
    issues: Optional[str] = None
    highlights: Optional[str] = None
    expenses: List[Dict[str, Any]] = Field(default_factory=list)
    photos_uploaded: int = Field(default=0)
    customer_feedback: Optional[str] = None
    reported_by: str
    report_status: str = Field(default="draft", description="draft, submitted, approved")


class DailyReportCreate(DailyReportBase):
    pass


class DailyReportResponse(DailyReportBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# In-memory storage
activities_db: dict = {}
guide_assignments_db: dict = {}
daily_reports_db: dict = {}


# Activity Management
@router.get("/activities", response_model=List[OperationActivityResponse])
async def list_activities(
    tour_id: Optional[str] = None,
    activity_date: Optional[date] = None,
    activity_type: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """List all operation activities"""
    results = list(activities_db.values())
    
    if tour_id:
        results = [a for a in results if a.get("tour_id") == tour_id]
    if activity_date:
        results = [a for a in results if a.get("activity_date") == activity_date]
    if activity_type:
        results = [a for a in results if a.get("activity_type") == activity_type]
    if status:
        results = [a for a in results if a.get("status") == status]
    
    # Sort by date and time
    results.sort(key=lambda x: (x.get("activity_date"), x.get("start_time") or time(0, 0)))
    
    return results[skip:skip + limit]


@router.post("/activities", response_model=OperationActivityResponse, status_code=status.HTTP_201_CREATED)
async def create_activity(activity: OperationActivityCreate):
    """Create a new operation activity"""
    activity_id = f"act_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    activity_data = {
        "id": activity_id,
        **activity.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    activities_db[activity_id] = activity_data
    return activity_data


@router.get("/activities/{activity_id}", response_model=OperationActivityResponse)
async def get_activity(activity_id: str):
    """Get a specific activity by ID"""
    if activity_id not in activities_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity {activity_id} not found"
        )
    return activities_db[activity_id]


@router.put("/activities/{activity_id}", response_model=OperationActivityResponse)
async def update_activity(activity_id: str, activity: OperationActivityUpdate):
    """Update an activity"""
    if activity_id not in activities_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity {activity_id} not found"
        )
    
    existing = activities_db[activity_id]
    update_data = activity.dict(exclude_unset=True)
    
    for key, value in update_data.items():
        existing[key] = value
    
    existing["updated_at"] = datetime.utcnow()
    activities_db[activity_id] = existing
    
    return existing


@router.delete("/activities/{activity_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_activity(activity_id: str):
    """Delete an activity"""
    if activity_id not in activities_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Activity {activity_id} not found"
        )
    
    del activities_db[activity_id]
    return None


# Guide Assignment Management
@router.get("/guides", response_model=List[TourGuideAssignmentResponse])
async def list_guide_assignments(
    tour_id: Optional[str] = None,
    guide_type: Optional[str] = None,
    date_range_start: Optional[date] = None,
    date_range_end: Optional[date] = None
):
    """List all guide assignments"""
    results = list(guide_assignments_db.values())
    
    if tour_id:
        results = [g for g in results if g.get("tour_id") == tour_id]
    if guide_type:
        results = [g for g in results if g.get("guide_type") == guide_type]
    if date_range_start:
        results = [g for g in results if g.get("end_date") >= date_range_start]
    if date_range_end:
        results = [g for g in results if g.get("start_date") <= date_range_end]
    
    return results


@router.post("/guides", response_model=TourGuideAssignmentResponse, status_code=status.HTTP_201_CREATED)
async def create_guide_assignment(assignment: TourGuideAssignment):
    """Assign a guide to a tour"""
    assignment_id = f"gda_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    assignment_data = {
        "id": assignment_id,
        **assignment.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    guide_assignments_db[assignment_id] = assignment_data
    return assignment_data


@router.delete("/guides/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_guide_assignment(assignment_id: str):
    """Remove a guide assignment"""
    if assignment_id not in guide_assignments_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Assignment {assignment_id} not found"
        )
    
    del guide_assignments_db[assignment_id]
    return None


# Daily Reports
@router.get("/reports", response_model=List[DailyReportResponse])
async def list_daily_reports(
    tour_id: Optional[str] = None,
    report_date: Optional[date] = None,
    report_status: Optional[str] = None
):
    """List all daily reports"""
    results = list(daily_reports_db.values())
    
    if tour_id:
        results = [r for r in results if r.get("tour_id") == tour_id]
    if report_date:
        results = [r for r in results if r.get("report_date") == report_date]
    if report_status:
        results = [r for r in results if r.get("report_status") == report_status]
    
    return results


@router.post("/reports", response_model=DailyReportResponse, status_code=status.HTTP_201_CREATED)
async def create_daily_report(report: DailyReportCreate):
    """Create a daily operation report"""
    report_id = f"rpt_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    
    report_data = {
        "id": report_id,
        **report.dict(),
        "created_at": now,
        "updated_at": now
    }
    
    daily_reports_db[report_id] = report_data
    return report_data


@router.get("/reports/{report_id}", response_model=DailyReportResponse)
async def get_daily_report(report_id: str):
    """Get a specific daily report"""
    if report_id not in daily_reports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found"
        )
    return daily_reports_db[report_id]


@router.post("/reports/{report_id}/submit")
async def submit_daily_report(report_id: str):
    """Submit a daily report for approval"""
    if report_id not in daily_reports_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report {report_id} not found"
        )
    
    daily_reports_db[report_id]["report_status"] = "submitted"
    daily_reports_db[report_id]["updated_at"] = datetime.utcnow()
    
    return {"message": "Report submitted", "report_id": report_id}


# Tour Operations Dashboard
@router.get("/dashboard/{tour_id}")
async def get_tour_operations_dashboard(tour_id: str):
    """Get operations dashboard for a specific tour"""
    tour_activities = [a for a in activities_db.values() if a.get("tour_id") == tour_id]
    tour_guides = [g for g in guide_assignments_db.values() if g.get("tour_id") == tour_id]
    tour_reports = [r for r in daily_reports_db.values() if r.get("tour_id") == tour_id]
    
    # Calculate statistics
    total_activities = len(tour_activities)
    completed_activities = len([a for a in tour_activities if a.get("status") == "completed"])
    confirmed_activities = len([a for a in tour_activities if a.get("status") == "confirmed"])
    pending_activities = len([a for a in tour_activities if a.get("status") == "scheduled"])
    
    total_cost = sum(a.get("cost", 0) for a in tour_activities)
    
    return {
        "tour_id": tour_id,
        "statistics": {
            "total_activities": total_activities,
            "completed": completed_activities,
            "confirmed": confirmed_activities,
            "pending": pending_activities,
            "completion_rate": (completed_activities / total_activities * 100) if total_activities > 0 else 0
        },
        "financial": {
            "total_operational_cost": total_cost,
            "currency": "TWD"
        },
        "guides": {
            "total_assigned": len(tour_guides),
            "assignments": tour_guides
        },
        "reports": {
            "total_submitted": len([r for r in tour_reports if r.get("report_status") == "submitted"]),
            "total_approved": len([r for r in tour_reports if r.get("report_status") == "approved"]),
            "pending_reports": len([r for r in tour_reports if r.get("report_status") == "draft"])
        }
    }


@router.get("/today")
async def get_today_operations():
    """Get all operations scheduled for today"""
    today = date.today()
    
    today_activities = [a for a in activities_db.values() if a.get("activity_date") == today]
    today_activities.sort(key=lambda x: x.get("start_time") or time(0, 0))
    
    return {
        "date": today,
        "total_activities": len(today_activities),
        "activities": today_activities,
        "by_status": {
            "scheduled": len([a for a in today_activities if a.get("status") == "scheduled"]),
            "confirmed": len([a for a in today_activities if a.get("status") == "confirmed"]),
            "in_progress": len([a for a in today_activities if a.get("status") == "in_progress"]),
            "completed": len([a for a in today_activities if a.get("status") == "completed"])
        }
    }
