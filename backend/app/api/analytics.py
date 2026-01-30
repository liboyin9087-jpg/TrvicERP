"""
API routes for Profit/Loss Calculation and Case Closure Reports
損益計算與結案報表 API
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
from app.db.database import get_db
from app.models.models import Order, Session as SessionModel, Payment, Flight, HotelAllotment, Insurance
from app.core.auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/analytics", tags=["analytics"])


class ProfitLossResponse(BaseModel):
    """損益分析回應"""
    order_id: Optional[str] = None
    session_id: Optional[str] = None
    total_revenue: float
    total_cost: float
    gross_profit: float
    profit_margin: float
    breakdown: Dict[str, Any]


class CostBreakdown(BaseModel):
    """成本細項"""
    category: str
    amount: float
    currency: str
    description: Optional[str] = None


@router.get("/profit-loss/order/{order_id}", response_model=ProfitLossResponse)
async def calculate_order_profit_loss(
    order_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate profit and loss for a specific order
    計算訂單的損益
    """
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        # Calculate revenue (from payments)
        receivables = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.type == "receivable",
            Payment.payment_status == "completed"
        ).all()
        total_revenue = sum(p.amount for p in receivables)
        
        # Calculate costs (from payables)
        payables = db.query(Payment).filter(
            Payment.order_id == order_id,
            Payment.type == "payable"
        ).all()
        supplier_costs = sum(p.amount for p in payables)
        
        # Calculate flights cost
        flights = db.query(Flight).filter(Flight.order_id == order_id).all()
        flights_cost = sum(f.total_price or 0 for f in flights)
        
        # Calculate insurance cost
        insurances = db.query(Insurance).filter(Insurance.order_id == order_id).all()
        insurance_cost = sum(i.premium or 0 for i in insurances)
        
        # Total cost
        total_cost = supplier_costs + flights_cost + insurance_cost
        
        # Calculate profit
        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        breakdown = {
            "revenue": {
                "payments": total_revenue,
                "currency": "TWD"
            },
            "costs": {
                "suppliers": sum(p.amount for p in payables),
                "flights": flights_cost,
                "insurance": insurance_cost,
                "total": total_cost,
                "currency": "TWD"
            },
            "payments_count": {
                "receivables": len(receivables),
                "payables": len(payables)
            }
        }
        
        return ProfitLossResponse(
            order_id=order_id,
            total_revenue=total_revenue,
            total_cost=total_cost,
            gross_profit=gross_profit,
            profit_margin=profit_margin,
            breakdown=breakdown
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.get("/profit-loss/session/{session_id}", response_model=ProfitLossResponse)
async def calculate_session_profit_loss(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Calculate profit and loss for a specific session (tour departure)
    計算團期的損益
    """
    try:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get all orders for this session
        orders = db.query(Order).filter(Order.session_id == session_id).all()
        order_ids = [o.id for o in orders]
        
        # Calculate total revenue from all orders
        receivables = db.query(Payment).filter(
            Payment.order_id.in_(order_ids),
            Payment.type == "receivable",
            Payment.payment_status == "completed"
        ).all()
        total_revenue = sum(p.amount for p in receivables)
        
        # Calculate all costs
        payables = db.query(Payment).filter(
            Payment.order_id.in_(order_ids),
            Payment.type == "payable"
        ).all()
        supplier_costs = sum(p.amount for p in payables)
        
        # Flight costs
        flights = db.query(Flight).filter(Flight.session_id == session_id).all()
        flights_cost = sum(f.total_price or 0 for f in flights)
        
        # Hotel costs
        hotels = db.query(HotelAllotment).filter(HotelAllotment.session_id == session_id).all()
        hotel_cost = sum((h.price_per_room or 0) * (h.allocated_rooms or 0) for h in hotels)
        
        # Insurance costs
        insurances = db.query(Insurance).filter(Insurance.session_id == session_id).all()
        insurance_cost = sum(i.premium or 0 for i in insurances)
        
        total_cost = supplier_costs + flights_cost + hotel_cost + insurance_cost
        
        # Calculate profit
        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        breakdown = {
            "revenue": {
                "total_orders": len(orders),
                "total_payments": total_revenue,
                "currency": "TWD"
            },
            "costs": {
                "suppliers": supplier_costs,
                "flights": flights_cost,
                "hotels": hotel_cost,
                "insurance": insurance_cost,
                "total": total_cost,
                "currency": "TWD"
            },
            "participant_count": session.confirmed_pax or 0
        }
        
        return ProfitLossResponse(
            session_id=session_id,
            total_revenue=total_revenue,
            total_cost=total_cost,
            gross_profit=gross_profit,
            profit_margin=profit_margin,
            breakdown=breakdown
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Calculation failed: {str(e)}")


@router.get("/case-closure/{session_id}")
async def generate_case_closure_report(
    session_id: str,
    include_details: bool = True,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Generate comprehensive case closure report for a completed tour
    生成團期結案報告
    """
    try:
        session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Get profit/loss calculation
        profit_loss = await calculate_session_profit_loss(session_id, db, current_user)
        
        # Get payment status
        orders = db.query(Order).filter(Order.session_id == session_id).all()
        order_ids = [o.id for o in orders]
        
        receivables = db.query(Payment).filter(
            Payment.order_id.in_(order_ids),
            Payment.type == "receivable"
        ).all()
        
        payables = db.query(Payment).filter(
            Payment.order_id.in_(order_ids),
            Payment.type == "payable"
        ).all()
        
        # Payment statistics
        receivable_completed = len([p for p in receivables if p.payment_status == "completed"])
        receivable_pending = len([p for p in receivables if p.payment_status == "pending"])
        
        payable_completed = len([p for p in payables if p.payment_status == "completed"])
        payable_pending = len([p for p in payables if p.payment_status == "pending"])
        
        report = {
            "session_id": session_id,
            "session_name": session.departure_date,  # Using departure_date as name placeholder
            "status": session.status,
            "closure_date": datetime.utcnow().isoformat(),
            
            "financial_summary": {
                "total_revenue": profit_loss.total_revenue,
                "total_cost": profit_loss.total_cost,
                "gross_profit": profit_loss.gross_profit,
                "profit_margin": profit_loss.profit_margin,
                "currency": "TWD"
            },
            
            "payment_status": {
                "receivables": {
                    "total": len(receivables),
                    "completed": receivable_completed,
                    "pending": receivable_pending,
                    "completion_rate": (receivable_completed / len(receivables) * 100) if receivables else 0
                },
                "payables": {
                    "total": len(payables),
                    "completed": payable_completed,
                    "pending": payable_pending,
                    "completion_rate": (payable_completed / len(payables) * 100) if payables else 0
                }
            },
            
            "operations": {
                "total_orders": len(orders),
                "confirmed_pax": session.confirmed_pax or 0,
                "departure_date": session.departure_date
            }
        }
        
        if include_details:
            report["detailed_breakdown"] = profit_loss.breakdown
        
        return report
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")


@router.get("/dashboard/summary")
async def get_dashboard_summary(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get financial dashboard summary
    取得財務儀表板摘要
    """
    try:
        # Total revenue
        receivables = db.query(Payment).filter(
            Payment.type == "receivable",
            Payment.payment_status == "completed"
        )
        if start_date:
            receivables = receivables.filter(Payment.paid_date >= start_date)
        if end_date:
            receivables = receivables.filter(Payment.paid_date <= end_date)
        
        total_revenue = sum(p.amount for p in receivables.all())
        
        # Total costs
        payables = db.query(Payment).filter(
            Payment.type == "payable"
        )
        if start_date:
            payables = payables.filter(Payment.paid_date >= start_date)
        if end_date:
            payables = payables.filter(Payment.paid_date <= end_date)
        
        total_cost = sum(p.amount for p in payables.all())
        
        # Active sessions
        active_sessions = db.query(SessionModel).filter(
            SessionModel.status.in_(["confirmed", "in_progress"])
        ).count()
        
        # Pending payments
        pending_receivables = db.query(Payment).filter(
            Payment.type == "receivable",
            Payment.payment_status == "pending"
        ).count()
        
        return {
            "period": {
                "start_date": start_date,
                "end_date": end_date
            },
            "financial": {
                "total_revenue": total_revenue,
                "total_cost": total_cost,
                "gross_profit": total_revenue - total_cost,
                "profit_margin": ((total_revenue - total_cost) / total_revenue * 100) if total_revenue > 0 else 0
            },
            "operations": {
                "active_sessions": active_sessions,
                "pending_payments": pending_receivables
            },
            "currency": "TWD"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summary generation failed: {str(e)}")
