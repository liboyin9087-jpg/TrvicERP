"""
Financial / Invoice API endpoints for TrvicERP
Manages invoices, accounts receivable, accounts payable, and exchange rates
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4

router = APIRouter(prefix="/api/v1/financial", tags=["Financial"])


# ─── Pydantic Schemas ───

class InvoiceItemSchema(BaseModel):
    description: str
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(..., ge=0)
    amount: float = Field(..., ge=0)
    taxable: bool = True
    category: Optional[str] = None


class InvoiceBase(BaseModel):
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str
    invoice_type: str = Field(default="standard", description="standard, proforma, credit_note")
    issue_date: date
    due_date: date
    items: List[InvoiceItemSchema] = []
    subtotal: float = Field(..., ge=0)
    tax_rate: float = Field(default=0.05, ge=0, le=1)
    tax_amount: float = Field(..., ge=0)
    total: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    exchange_rate: float = Field(default=1.0)
    buyer_tax_id: Optional[str] = None
    buyer_address: Optional[str] = None
    notes: Optional[str] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[str] = None
    due_date: Optional[date] = None
    items: Optional[List[InvoiceItemSchema]] = None
    subtotal: Optional[float] = None
    tax_amount: Optional[float] = None
    total: Optional[float] = None
    paid_amount: Optional[float] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None


class InvoiceResponse(InvoiceBase):
    id: str
    invoice_number: str
    status: str
    paid_amount: float
    balance: float
    payment_method: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── AR/AP Schemas ───

class ARBase(BaseModel):
    invoice_id: Optional[str] = None
    customer_id: Optional[str] = None
    amount: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    due_date: date
    notes: Optional[str] = None


class ARCreate(ARBase):
    pass


class ARResponse(ARBase):
    id: str
    status: str
    paid_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class APBase(BaseModel):
    supplier_id: Optional[str] = None
    supplier_name: str
    amount: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    due_date: date
    description: Optional[str] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class APCreate(APBase):
    pass


class APResponse(APBase):
    id: str
    status: str
    paid_amount: float
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── In-memory Storage ───
invoices_db: dict = {}
ar_db: dict = {}
ap_db: dict = {}
invoice_counter = 1


# ═══════════════════════════════════════
# Invoice Endpoints
# ═══════════════════════════════════════

@router.get("/invoices", response_model=List[InvoiceResponse])
async def list_invoices(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    invoice_type: Optional[str] = None,
    currency: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出所有發票"""
    results = list(invoices_db.values())
    if status:
        results = [i for i in results if i.get("status") == status]
    if customer_id:
        results = [i for i in results if i.get("customer_id") == customer_id]
    if invoice_type:
        results = [i for i in results if i.get("invoice_type") == invoice_type]
    if currency:
        results = [i for i in results if i.get("currency") == currency]
    return results[skip:skip + limit]


@router.post("/invoices", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
async def create_invoice(invoice: InvoiceCreate):
    """建立發票"""
    global invoice_counter
    inv_id = f"inv_{uuid4().hex[:12]}"
    inv_number = f"INV-{datetime.utcnow().strftime('%Y%m')}-{invoice_counter:04d}"
    invoice_counter += 1
    now = datetime.utcnow()

    inv_data = {
        "id": inv_id,
        "invoice_number": inv_number,
        "status": "draft",
        "paid_amount": 0,
        "balance": invoice.total,
        "payment_method": None,
        **invoice.dict(),
        "created_at": now,
        "updated_at": now,
    }
    invoices_db[inv_id] = inv_data
    return inv_data


@router.get("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str):
    """取得發票詳情"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    return invoices_db[invoice_id]


@router.put("/invoices/{invoice_id}", response_model=InvoiceResponse)
async def update_invoice(invoice_id: str, invoice: InvoiceUpdate):
    """更新發票"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    existing = invoices_db[invoice_id]
    for key, value in invoice.dict(exclude_unset=True).items():
        existing[key] = value
    # Recalculate balance
    if "paid_amount" in invoice.dict(exclude_unset=True) or "total" in invoice.dict(exclude_unset=True):
        existing["balance"] = existing.get("total", 0) - existing.get("paid_amount", 0)
    existing["updated_at"] = datetime.utcnow()
    invoices_db[invoice_id] = existing
    return existing


@router.delete("/invoices/{invoice_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_invoice(invoice_id: str):
    """刪除發票 (僅限草稿)"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    if invoices_db[invoice_id].get("status") != "draft":
        raise HTTPException(status_code=400, detail="Only draft invoices can be deleted")
    del invoices_db[invoice_id]
    return None


@router.post("/invoices/{invoice_id}/send", response_model=InvoiceResponse)
async def send_invoice(invoice_id: str):
    """發送發票"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    existing = invoices_db[invoice_id]
    existing["status"] = "sent"
    existing["updated_at"] = datetime.utcnow()
    return existing


@router.post("/invoices/{invoice_id}/record-payment")
async def record_payment(invoice_id: str, amount: float, payment_method: str = "bank_transfer"):
    """記錄付款"""
    if invoice_id not in invoices_db:
        raise HTTPException(status_code=404, detail=f"Invoice {invoice_id} not found")
    existing = invoices_db[invoice_id]
    existing["paid_amount"] = existing.get("paid_amount", 0) + amount
    existing["balance"] = existing.get("total", 0) - existing["paid_amount"]
    existing["payment_method"] = payment_method
    if existing["balance"] <= 0:
        existing["status"] = "paid"
        existing["balance"] = 0
    else:
        existing["status"] = "partial"
    existing["updated_at"] = datetime.utcnow()
    return existing


# ═══════════════════════════════════════
# Accounts Receivable
# ═══════════════════════════════════════

@router.get("/ar", response_model=List[ARResponse])
async def list_accounts_receivable(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出應收帳款"""
    results = list(ar_db.values())
    if status:
        results = [r for r in results if r.get("status") == status]
    if customer_id:
        results = [r for r in results if r.get("customer_id") == customer_id]
    return results[skip:skip + limit]


@router.post("/ar", response_model=ARResponse, status_code=status.HTTP_201_CREATED)
async def create_ar(ar: ARCreate):
    """建立應收帳款"""
    ar_id = f"ar_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    ar_data = {
        "id": ar_id,
        "status": "pending",
        "paid_amount": 0,
        **ar.dict(),
        "created_at": now,
        "updated_at": now,
    }
    ar_db[ar_id] = ar_data
    return ar_data


# ═══════════════════════════════════════
# Accounts Payable
# ═══════════════════════════════════════

@router.get("/ap", response_model=List[APResponse])
async def list_accounts_payable(
    status: Optional[str] = None,
    supplier_id: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出應付帳款"""
    results = list(ap_db.values())
    if status:
        results = [r for r in results if r.get("status") == status]
    if supplier_id:
        results = [r for r in results if r.get("supplier_id") == supplier_id]
    return results[skip:skip + limit]


@router.post("/ap", response_model=APResponse, status_code=status.HTTP_201_CREATED)
async def create_ap(ap: APCreate):
    """建立應付帳款"""
    ap_id = f"ap_{uuid4().hex[:12]}"
    now = datetime.utcnow()
    ap_data = {
        "id": ap_id,
        "status": "pending",
        "paid_amount": 0,
        **ap.dict(),
        "created_at": now,
        "updated_at": now,
    }
    ap_db[ap_id] = ap_data
    return ap_data


# ═══════════════════════════════════════
# Exchange Rates
# ═══════════════════════════════════════

@router.get("/exchange-rates")
async def get_exchange_rates(base: str = "TWD"):
    """取得匯率 (靜態參考值)"""
    rates = {
        "TWD": {"USD": 0.031, "EUR": 0.029, "JPY": 4.65, "CNY": 0.22, "HKD": 0.24, "SGD": 0.042},
        "USD": {"TWD": 32.1, "EUR": 0.92, "JPY": 149.5, "CNY": 7.24, "HKD": 7.83, "SGD": 1.35},
    }
    base_upper = base.upper()
    if base_upper not in rates:
        return {"base": base_upper, "rates": {}, "note": "Base currency not found, use TWD or USD"}
    return {
        "base": base_upper,
        "rates": rates[base_upper],
        "updated_at": datetime.utcnow().isoformat(),
        "source": "static_reference"
    }


# ═══════════════════════════════════════
# Financial Summary / Dashboard
# ═══════════════════════════════════════

@router.get("/summary")
async def get_financial_summary():
    """取得財務總覽"""
    total_invoiced = sum(i.get("total", 0) for i in invoices_db.values())
    total_collected = sum(i.get("paid_amount", 0) for i in invoices_db.values())
    total_ar = sum(r.get("amount", 0) - r.get("paid_amount", 0) for r in ar_db.values() if r.get("status") != "paid")
    total_ap = sum(p.get("amount", 0) - p.get("paid_amount", 0) for p in ap_db.values() if p.get("status") != "paid")
    overdue_invoices = [i for i in invoices_db.values() if i.get("status") == "overdue"]

    return {
        "total_invoiced": total_invoiced,
        "total_collected": total_collected,
        "outstanding_balance": total_invoiced - total_collected,
        "accounts_receivable": total_ar,
        "accounts_payable": total_ap,
        "net_position": total_ar - total_ap,
        "overdue_count": len(overdue_invoices),
        "invoice_count": len(invoices_db),
        "currency": "TWD",
    }
