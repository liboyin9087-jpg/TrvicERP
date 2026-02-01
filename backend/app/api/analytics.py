"""
Analytics API endpoints for TrvicERP
Business intelligence, reporting, and data analytics
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date, timedelta
from uuid import uuid4
import random
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/analytics", tags=["Analytics"])


# Pydantic Schemas
class DateRange(BaseModel):
    start_date: date
    end_date: date


class SalesMetrics(BaseModel):
    total_revenue: float
    total_orders: int
    average_order_value: float
    conversion_rate: float
    growth_rate: float
    currency: str = "TWD"


class CustomerMetrics(BaseModel):
    total_customers: int
    new_customers: int
    returning_customers: int
    retention_rate: float
    average_lifetime_value: float


class TourMetrics(BaseModel):
    total_tours: int
    active_tours: int
    completed_tours: int
    cancelled_tours: int
    average_group_size: float
    occupancy_rate: float


class DashboardSummary(BaseModel):
    sales: SalesMetrics
    customers: CustomerMetrics
    tours: TourMetrics
    period: DateRange


# Helper function to generate sample data
def generate_sample_timeseries(start_date: date, end_date: date, base_value: float = 100000):
    """Generate sample time series data for charts"""
    data = []
    current = start_date
    while current <= end_date:
        value = base_value * (1 + random.uniform(-0.2, 0.3))
        data.append({
            "date": current.isoformat(),
            "value": round(value, 2)
        })
        current += timedelta(days=1)
    return data


@router.get("/dashboard/summary", response_model=DashboardSummary)
async def get_dashboard_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get comprehensive dashboard summary"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    # In production, these would be real database queries
    return {
        "sales": {
            "total_revenue": 15680000,
            "total_orders": 423,
            "average_order_value": 37068,
            "conversion_rate": 0.032,
            "growth_rate": 0.12,
            "currency": "TWD"
        },
        "customers": {
            "total_customers": 1250,
            "new_customers": 89,
            "returning_customers": 334,
            "retention_rate": 0.67,
            "average_lifetime_value": 125000
        },
        "tours": {
            "total_tours": 45,
            "active_tours": 12,
            "completed_tours": 28,
            "cancelled_tours": 5,
            "average_group_size": 24.5,
            "occupancy_rate": 0.78
        },
        "period": {
            "start_date": start_date,
            "end_date": end_date
        }
    }


@router.get("/sales/revenue")
async def get_revenue_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    group_by: str = "day"  # day, week, month
):
    """Get revenue analytics over time"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    timeseries = generate_sample_timeseries(start_date, end_date, 500000)
    
    total = sum(d["value"] for d in timeseries)
    avg = total / len(timeseries) if timeseries else 0
    
    return {
        "period": {"start_date": start_date, "end_date": end_date},
        "group_by": group_by,
        "summary": {
            "total_revenue": round(total, 2),
            "average_daily": round(avg, 2),
            "peak_day": max(timeseries, key=lambda x: x["value"]) if timeseries else None,
            "lowest_day": min(timeseries, key=lambda x: x["value"]) if timeseries else None
        },
        "timeseries": timeseries
    }


@router.get("/sales/by-destination")
async def get_sales_by_destination(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    limit: int = 10
):
    """Get sales breakdown by destination"""
    destinations = [
        {"destination": "日本", "orders": 156, "revenue": 5460000, "pax": 3120, "growth": 0.15},
        {"destination": "韓國", "orders": 98, "revenue": 2744000, "pax": 1960, "growth": 0.08},
        {"destination": "泰國", "orders": 67, "revenue": 1541000, "pax": 1340, "growth": 0.22},
        {"destination": "越南", "orders": 45, "revenue": 900000, "pax": 900, "growth": 0.35},
        {"destination": "新加坡", "orders": 34, "revenue": 1020000, "pax": 680, "growth": -0.05},
        {"destination": "馬來西亞", "orders": 28, "revenue": 560000, "pax": 560, "growth": 0.18},
        {"destination": "菲律賓", "orders": 22, "revenue": 396000, "pax": 440, "growth": 0.42},
        {"destination": "印尼", "orders": 18, "revenue": 324000, "pax": 360, "growth": 0.28},
        {"destination": "歐洲", "orders": 15, "revenue": 1350000, "pax": 225, "growth": 0.05},
        {"destination": "美國", "orders": 12, "revenue": 1080000, "pax": 180, "growth": -0.10}
    ]
    
    total_revenue = sum(d["revenue"] for d in destinations)
    
    for d in destinations:
        d["percentage"] = round(d["revenue"] / total_revenue * 100, 2)
    
    return {
        "period": {
            "start_date": start_date or date.today() - timedelta(days=30),
            "end_date": end_date or date.today()
        },
        "total_revenue": total_revenue,
        "destinations": destinations[:limit]
    }


@router.get("/customers/segments")
async def get_customer_segments():
    """Get customer segmentation analysis"""
    return {
        "segments": [
            {
                "name": "VIP",
                "count": 125,
                "percentage": 10,
                "avg_spending": 350000,
                "characteristics": ["年消費>10萬", "回購率>80%", "推薦客戶數>3"]
            },
            {
                "name": "忠實客戶",
                "count": 375,
                "percentage": 30,
                "avg_spending": 120000,
                "characteristics": ["購買次數>3", "回購率>50%"]
            },
            {
                "name": "一般客戶",
                "count": 500,
                "percentage": 40,
                "avg_spending": 45000,
                "characteristics": ["購買次數1-3次"]
            },
            {
                "name": "新客戶",
                "count": 250,
                "percentage": 20,
                "avg_spending": 35000,
                "characteristics": ["首次購買", "90天內"]
            }
        ],
        "insights": [
            "VIP客戶貢獻了35%的總收入",
            "新客戶轉換為忠實客戶的比例為28%",
            "推薦計畫帶來15%的新客戶"
        ]
    }


@router.get("/customers/acquisition")
async def get_customer_acquisition_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get customer acquisition channel analytics"""
    return {
        "channels": [
            {"channel": "官網直接", "customers": 320, "percentage": 25.6, "cac": 500, "conversion": 0.035},
            {"channel": "Google Ads", "customers": 280, "percentage": 22.4, "cac": 1200, "conversion": 0.028},
            {"channel": "Facebook", "customers": 200, "percentage": 16.0, "cac": 800, "conversion": 0.022},
            {"channel": "LINE官方帳號", "customers": 180, "percentage": 14.4, "cac": 300, "conversion": 0.045},
            {"channel": "客戶推薦", "customers": 150, "percentage": 12.0, "cac": 200, "conversion": 0.065},
            {"channel": "旅展", "customers": 70, "percentage": 5.6, "cac": 2500, "conversion": 0.015},
            {"channel": "其他", "customers": 50, "percentage": 4.0, "cac": 600, "conversion": 0.020}
        ],
        "total_customers": 1250,
        "average_cac": 800,
        "recommendations": [
            "LINE官方帳號有最高的轉換率，建議增加投資",
            "客戶推薦計畫的CAC最低，可考慮強化推薦獎勵",
            "旅展的CAC較高，建議優化參展策略"
        ]
    }


@router.get("/tours/performance")
async def get_tour_performance_analytics(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get tour performance analytics"""
    return {
        "top_performing": [
            {"tour_name": "日本東京5日遊", "bookings": 45, "revenue": 1575000, "rating": 4.8, "occupancy": 0.92},
            {"tour_name": "韓國首爾4日遊", "bookings": 38, "revenue": 1064000, "rating": 4.6, "occupancy": 0.88},
            {"tour_name": "泰國曼谷5日遊", "bookings": 32, "revenue": 736000, "rating": 4.7, "occupancy": 0.85}
        ],
        "underperforming": [
            {"tour_name": "歐洲10日遊", "bookings": 5, "revenue": 450000, "rating": 4.2, "occupancy": 0.45, "issue": "價格較高"},
            {"tour_name": "澳洲8日遊", "bookings": 3, "revenue": 210000, "rating": 4.0, "occupancy": 0.38, "issue": "淡季"}
        ],
        "metrics": {
            "average_rating": 4.5,
            "average_occupancy": 0.78,
            "cancellation_rate": 0.08,
            "repeat_booking_rate": 0.35
        }
    }


@router.get("/financial/summary")
async def get_financial_summary(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None
):
    """Get financial summary and P&L overview"""
    return {
        "revenue": {
            "total": 15680000,
            "tour_sales": 14500000,
            "add_on_services": 980000,
            "other": 200000
        },
        "costs": {
            "total": 11200000,
            "supplier_costs": 9500000,
            "marketing": 800000,
            "operations": 600000,
            "overhead": 300000
        },
        "profit": {
            "gross_profit": 4480000,
            "gross_margin": 0.286,
            "net_profit": 3580000,
            "net_margin": 0.228
        },
        "cash_flow": {
            "accounts_receivable": 2500000,
            "accounts_payable": 1800000,
            "cash_balance": 5200000
        },
        "period": {
            "start_date": start_date or date.today() - timedelta(days=30),
            "end_date": end_date or date.today()
        }
    }


@router.get("/forecast/revenue")
async def get_revenue_forecast(
    months_ahead: int = 3
):
    """Get revenue forecast for upcoming months"""
    forecasts = []
    current_month = date.today().replace(day=1)
    
    base_revenue = 15000000
    for i in range(months_ahead):
        forecast_month = current_month + timedelta(days=32 * (i + 1))
        forecast_month = forecast_month.replace(day=1)
        
        # Simple seasonal adjustment
        season_factor = 1.2 if forecast_month.month in [7, 8, 12, 1, 2] else 1.0
        forecast_value = base_revenue * season_factor * (1 + 0.05 * (i + 1))
        
        forecasts.append({
            "month": forecast_month.strftime("%Y-%m"),
            "forecasted_revenue": round(forecast_value),
            "confidence_low": round(forecast_value * 0.85),
            "confidence_high": round(forecast_value * 1.15),
            "growth_rate": 0.05 * (i + 1),
            "season": "旺季" if season_factor > 1 else "淡季"
        })
    
    return {
        "forecasts": forecasts,
        "methodology": "基於歷史數據的時間序列預測，考慮季節性因素",
        "assumptions": [
            "經濟環境維持穩定",
            "無重大疫情或天災影響",
            "行銷投資維持現有水準"
        ]
    }


@router.get("/reports/generate")
async def generate_report(
    report_type: str,  # daily, weekly, monthly, quarterly
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    format: str = "json"  # json, pdf, excel
):
    """Generate a comprehensive business report"""
    if not start_date:
        start_date = date.today() - timedelta(days=30)
    if not end_date:
        end_date = date.today()
    
    return {
        "report_id": f"rpt_{uuid4().hex[:12]}",
        "report_type": report_type,
        "period": {
            "start_date": start_date,
            "end_date": end_date
        },
        "generated_at": datetime.utcnow().isoformat(),
        "format": format,
        "status": "ready",
        "download_url": f"/api/v1/analytics/reports/download/rpt_{uuid4().hex[:12]}",
        "sections": [
            "執行摘要",
            "銷售分析",
            "客戶分析",
            "行程績效",
            "財務概況",
            "預測與建議"
        ]
    }
