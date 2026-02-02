"""
Insurance API endpoints for TrvicERP
Manages insurance policies and claims
"""
from fastapi import APIRouter, HTTPException, status
from typing import List, Optional
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4

router = APIRouter(prefix="/api/v1/insurance", tags=["Insurance"])


# ─── Pydantic Schemas ───

class InsurancePolicyBase(BaseModel):
    order_id: Optional[str] = None
    customer_id: Optional[str] = None
    customer_name: str = Field(..., description="被保人姓名")
    provider: str = Field(..., description="保險公司")
    plan_type: str = Field(..., description="basic, standard, premium, comprehensive")
    start_date: date
    end_date: date
    destination: Optional[str] = None
    coverage_amount: Optional[float] = None
    medical_coverage: Optional[float] = None
    flight_delay_coverage: Optional[float] = None
    luggage_coverage: Optional[float] = None
    premium: float = Field(..., ge=0)
    currency: str = Field(default="TWD")
    beneficiary: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None


class InsurancePolicyCreate(InsurancePolicyBase):
    pass


class InsurancePolicyUpdate(BaseModel):
    status: Optional[str] = None
    provider: Optional[str] = None
    plan_type: Optional[str] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    coverage_amount: Optional[float] = None
    medical_coverage: Optional[float] = None
    premium: Optional[float] = None
    beneficiary: Optional[str] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    notes: Optional[str] = None


class InsurancePolicyResponse(InsurancePolicyBase):
    id: str
    policy_number: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class InsuranceClaimBase(BaseModel):
    policy_id: str
    claim_type: str = Field(..., description="medical, flight_delay, luggage_loss, trip_cancellation, other")
    incident_date: date
    description: str
    claim_amount: float = Field(..., ge=0)
    documents: Optional[list] = None


class InsuranceClaimCreate(InsuranceClaimBase):
    pass


class InsuranceClaimUpdate(BaseModel):
    status: Optional[str] = None
    approved_amount: Optional[float] = None
    reviewer: Optional[str] = None
    review_notes: Optional[str] = None


class InsuranceClaimResponse(InsuranceClaimBase):
    id: str
    claim_number: str
    status: str
    approved_amount: Optional[float] = None
    reviewer: Optional[str] = None
    review_date: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ─── In-memory Storage ───
policies_db: dict = {}
claims_db: dict = {}
policy_counter = 1
claim_counter = 1


# ─── Policy Endpoints ───

@router.get("/policies", response_model=List[InsurancePolicyResponse])
async def list_policies(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    provider: Optional[str] = None,
    plan_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出所有保險保單"""
    results = list(policies_db.values())
    if status:
        results = [p for p in results if p.get("status") == status]
    if customer_id:
        results = [p for p in results if p.get("customer_id") == customer_id]
    if provider:
        results = [p for p in results if p.get("provider") == provider]
    if plan_type:
        results = [p for p in results if p.get("plan_type") == plan_type]
    return results[skip:skip + limit]


@router.post("/policies", response_model=InsurancePolicyResponse, status_code=status.HTTP_201_CREATED)
async def create_policy(policy: InsurancePolicyCreate):
    """建立保險保單"""
    global policy_counter
    policy_id = f"ins_{uuid4().hex[:12]}"
    policy_number = f"INS-{datetime.utcnow().strftime('%Y%m')}-{policy_counter:04d}"
    policy_counter += 1
    now = datetime.utcnow()

    policy_data = {
        "id": policy_id,
        "policy_number": policy_number,
        "status": "active",
        **policy.dict(),
        "created_at": now,
        "updated_at": now,
    }
    policies_db[policy_id] = policy_data
    return policy_data


@router.get("/policies/{policy_id}", response_model=InsurancePolicyResponse)
async def get_policy(policy_id: str):
    """取得單一保單詳情"""
    if policy_id not in policies_db:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    return policies_db[policy_id]


@router.put("/policies/{policy_id}", response_model=InsurancePolicyResponse)
async def update_policy(policy_id: str, policy: InsurancePolicyUpdate):
    """更新保單"""
    if policy_id not in policies_db:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    existing = policies_db[policy_id]
    for key, value in policy.dict(exclude_unset=True).items():
        existing[key] = value
    existing["updated_at"] = datetime.utcnow()
    policies_db[policy_id] = existing
    return existing


@router.delete("/policies/{policy_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_policy(policy_id: str):
    """刪除保單"""
    if policy_id not in policies_db:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    del policies_db[policy_id]
    return None


# ─── Claim Endpoints ───

@router.get("/claims", response_model=List[InsuranceClaimResponse])
async def list_claims(
    policy_id: Optional[str] = None,
    status: Optional[str] = None,
    claim_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
):
    """列出所有理賠申請"""
    results = list(claims_db.values())
    if policy_id:
        results = [c for c in results if c.get("policy_id") == policy_id]
    if status:
        results = [c for c in results if c.get("status") == status]
    if claim_type:
        results = [c for c in results if c.get("claim_type") == claim_type]
    return results[skip:skip + limit]


@router.post("/claims", response_model=InsuranceClaimResponse, status_code=status.HTTP_201_CREATED)
async def create_claim(claim: InsuranceClaimCreate):
    """建立理賠申請"""
    global claim_counter
    if claim.policy_id not in policies_db:
        raise HTTPException(status_code=404, detail=f"Policy {claim.policy_id} not found")

    claim_id = f"clm_{uuid4().hex[:12]}"
    claim_number = f"CLM-{datetime.utcnow().strftime('%Y%m')}-{claim_counter:04d}"
    claim_counter += 1
    now = datetime.utcnow()

    claim_data = {
        "id": claim_id,
        "claim_number": claim_number,
        "status": "submitted",
        "approved_amount": None,
        "reviewer": None,
        "review_date": None,
        "review_notes": None,
        **claim.dict(),
        "created_at": now,
        "updated_at": now,
    }
    claims_db[claim_id] = claim_data

    # Update policy status
    policies_db[claim.policy_id]["status"] = "claimed"
    return claim_data


@router.put("/claims/{claim_id}", response_model=InsuranceClaimResponse)
async def update_claim(claim_id: str, claim: InsuranceClaimUpdate):
    """更新理賠狀態 (審核)"""
    if claim_id not in claims_db:
        raise HTTPException(status_code=404, detail=f"Claim {claim_id} not found")
    existing = claims_db[claim_id]
    for key, value in claim.dict(exclude_unset=True).items():
        existing[key] = value
    if claim.status in ("approved", "rejected"):
        existing["review_date"] = datetime.utcnow()
    existing["updated_at"] = datetime.utcnow()
    claims_db[claim_id] = existing
    return existing


# ─── Provider & Plan Reference ───

@router.get("/providers")
async def list_providers():
    """列出可用保險公司"""
    return {
        "providers": [
            {"id": "cathay", "name": "國泰產險", "name_en": "Cathay Century Insurance"},
            {"id": "fubon", "name": "富邦產險", "name_en": "Fubon Insurance"},
            {"id": "nanshan", "name": "南山人壽", "name_en": "Nan Shan Life Insurance"},
            {"id": "shinkong", "name": "新光產險", "name_en": "Shin Kong Insurance"},
            {"id": "taiwanlife", "name": "台灣人壽", "name_en": "Taiwan Life Insurance"},
            {"id": "allianz", "name": "安聯產險", "name_en": "Allianz Insurance"},
            {"id": "aig", "name": "美亞產險", "name_en": "AIG Insurance"},
            {"id": "msig", "name": "明台產險", "name_en": "MSIG Insurance"},
        ]
    }


@router.get("/plans")
async def list_plans():
    """列出保險方案"""
    return {
        "plans": [
            {
                "id": "basic",
                "name": "基本型",
                "daily_premium": 150,
                "coverage": 1000000,
                "medical": 500000,
                "flight_delay": 5000,
                "luggage": 10000,
            },
            {
                "id": "standard",
                "name": "標準型",
                "daily_premium": 280,
                "coverage": 3000000,
                "medical": 1500000,
                "flight_delay": 10000,
                "luggage": 20000,
            },
            {
                "id": "premium",
                "name": "豪華型",
                "daily_premium": 450,
                "coverage": 5000000,
                "medical": 3000000,
                "flight_delay": 20000,
                "luggage": 50000,
            },
            {
                "id": "comprehensive",
                "name": "全方位型",
                "daily_premium": 680,
                "coverage": 10000000,
                "medical": 5000000,
                "flight_delay": 30000,
                "luggage": 100000,
            },
        ]
    }
