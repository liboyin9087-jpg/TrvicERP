"""
Reports API endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Dict, Any, List
from app.db.database import get_db
from app.models.models import Order, Customer, User
from datetime import datetime
import io
import csv

router = APIRouter(prefix="/api/v1/reports", tags=["Reports"])


@router.get("/revenue", response_model=Dict[str, Any])
async def get_revenue_report(
    start_date: str = None,
    end_date: str = None,
    db: Session = Depends(get_db)
):
    """Get revenue report"""
    query = db.query(Order)
    
    # Apply date filters if provided
    if start_date:
        try:
            start = datetime.fromisoformat(start_date)
            query = query.filter(Order.created_at >= start)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="開始日期格式錯誤")
    
    if end_date:
        try:
            end = datetime.fromisoformat(end_date)
            query = query.filter(Order.created_at <= end)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="結束日期格式錯誤")
    
    # Calculate metrics
    total_revenue = query.with_entities(func.sum(Order.paid_amount)).scalar() or 0
    total_orders = query.count()
    
    # Revenue by status
    revenue_by_status = db.query(
        Order.status,
        func.sum(Order.paid_amount).label("revenue"),
        func.count(Order.id).label("count")
    ).filter(
        Order.created_at >= datetime.fromisoformat(start_date) if start_date else True,
        Order.created_at <= datetime.fromisoformat(end_date) if end_date else True
    ).group_by(Order.status).all()
    
    # Monthly revenue trend
    monthly_revenue = db.query(
        extract('year', Order.created_at).label('year'),
        extract('month', Order.created_at).label('month'),
        func.sum(Order.paid_amount).label('revenue')
    ).filter(
        Order.created_at >= datetime.fromisoformat(start_date) if start_date else True,
        Order.created_at <= datetime.fromisoformat(end_date) if end_date else True
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    return {
        "total_revenue": float(total_revenue),
        "total_orders": total_orders,
        "average_order_value": float(total_revenue / total_orders) if total_orders > 0 else 0,
        "revenue_by_status": [
            {"status": item.status, "revenue": float(item.revenue), "count": item.count}
            for item in revenue_by_status
        ],
        "monthly_trend": [
            {"year": int(item.year), "month": int(item.month), "revenue": float(item.revenue)}
            for item in monthly_revenue
        ]
    }


@router.get("/customers", response_model=Dict[str, Any])
async def get_customers_report(db: Session = Depends(get_db)):
    """Get customers report"""
    total_customers = db.query(Customer).count()
    
    # Customers with orders
    customers_with_orders = db.query(Customer).join(Order).distinct().count()
    
    # Top customers by revenue
    top_customers = db.query(
        Customer.id,
        Customer.name,
        func.sum(Order.paid_amount).label('total_spent'),
        func.count(Order.id).label('order_count')
    ).join(Order).group_by(Customer.id, Customer.name).order_by(
        func.sum(Order.paid_amount).desc()
    ).limit(10).all()
    
    # New customers by month
    new_customers_monthly = db.query(
        extract('year', Customer.created_at).label('year'),
        extract('month', Customer.created_at).label('month'),
        func.count(Customer.id).label('count')
    ).group_by('year', 'month').order_by('year', 'month').all()
    
    return {
        "total_customers": total_customers,
        "customers_with_orders": customers_with_orders,
        "conversion_rate": (customers_with_orders / total_customers * 100) if total_customers > 0 else 0,
        "top_customers": [
            {
                "id": item.id,
                "name": item.name,
                "total_spent": float(item.total_spent),
                "order_count": item.order_count
            }
            for item in top_customers
        ],
        "new_customers_monthly": [
            {"year": int(item.year), "month": int(item.month), "count": item.count}
            for item in new_customers_monthly
        ]
    }


@router.get("/teams", response_model=Dict[str, Any])
async def get_teams_report(db: Session = Depends(get_db)):
    """Get teams report"""
    total_users = db.query(User).count()
    active_users = db.query(User).filter(User.is_active == True).count()
    
    # Users by role
    users_by_role = db.query(
        User.role,
        func.count(User.id).label('count')
    ).group_by(User.role).all()
    
    # Orders by creator
    orders_by_creator = db.query(
        User.id,
        User.full_name,
        User.role,
        func.count(Order.id).label('order_count'),
        func.sum(Order.paid_amount).label('total_revenue')
    ).join(Order, User.id == Order.created_by).group_by(
        User.id, User.full_name, User.role
    ).order_by(func.count(Order.id).desc()).limit(10).all()
    
    return {
        "total_users": total_users,
        "active_users": active_users,
        "users_by_role": [
            {"role": item.role, "count": item.count}
            for item in users_by_role
        ],
        "top_performers": [
            {
                "id": item.id,
                "name": item.full_name,
                "role": item.role,
                "order_count": item.order_count,
                "total_revenue": float(item.total_revenue) if item.total_revenue else 0
            }
            for item in orders_by_creator
        ]
    }


@router.get("/{report_type}/export")
async def export_report(report_type: str, db: Session = Depends(get_db)):
    """Export report as CSV"""
    if report_type not in ["revenue", "customers", "teams"]:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="不支援的報表類型")
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    if report_type == "revenue":
        writer.writerow(["訂單編號", "客戶姓名", "金額", "狀態", "付款狀態", "建立日期"])
        orders = db.query(Order).join(Customer).all()
        for order in orders:
            writer.writerow([
                order.order_number,
                order.customer.name if order.customer else "",
                order.paid_amount,
                order.status,
                order.payment_status,
                order.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
    
    elif report_type == "customers":
        writer.writerow(["客戶ID", "姓名", "電子郵件", "電話", "訂單數", "總消費", "註冊日期"])
        customers = db.query(
            Customer,
            func.count(Order.id).label('order_count'),
            func.sum(Order.paid_amount).label('total_spent')
        ).outerjoin(Order).group_by(Customer.id).all()
        
        for item in customers:
            customer = item.Customer
            writer.writerow([
                customer.id,
                customer.name,
                customer.email or "",
                customer.phone or "",
                item.order_count,
                float(item.total_spent) if item.total_spent else 0,
                customer.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
    
    elif report_type == "teams":
        writer.writerow(["員工ID", "姓名", "職位", "電子郵件", "狀態", "訂單數", "加入日期"])
        users = db.query(
            User,
            func.count(Order.id).label('order_count')
        ).outerjoin(Order, User.id == Order.created_by).group_by(User.id).all()
        
        for item in users:
            user = item.User
            writer.writerow([
                user.id,
                user.full_name or "",
                user.role,
                user.email,
                "啟用" if user.is_active else "停用",
                item.order_count,
                user.created_at.strftime("%Y-%m-%d %H:%M:%S")
            ])
    
    # Prepare response
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={report_type}_report_{datetime.now().strftime('%Y%m%d')}.csv"
        }
    )
