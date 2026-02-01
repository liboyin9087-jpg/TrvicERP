"""
Import API endpoints - Chrome Extension / JSON 匯入競品訂單資料
POST /api/v1/import       - 批次匯入
POST /api/v1/import/upsert - 依 external_id 去重匯入（單筆）
GET  /api/v1/import        - 列出所有匯入資料
GET  /api/v1/import/{id}   - 取得單筆
DELETE /api/v1/import/{id} - 刪除
POST /api/v1/import/{id}/convert - 轉為正式訂單
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schemas.schemas import (
    ImportedOrderCreate, ImportedOrderUpdate, ImportedOrderResponse,
    ImportBatchRequest, ImportBatchResponse, ImportUpsertRequest,
)
from app.models.models import ImportedOrder, Order
from uuid import uuid4
from datetime import datetime
import json

router = APIRouter(prefix="/api/v1/import", tags=["Import"])


@router.get("", response_model=List[ImportedOrderResponse])
async def list_imported_orders(
    company: Optional[str] = None,
    status_filter: Optional[str] = None,
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """列出所有匯入訂單，支援篩選"""
    query = db.query(ImportedOrder)
    if company:
        query = query.filter(ImportedOrder.company == company)
    if status_filter:
        query = query.filter(ImportedOrder.status == status_filter)
    if source:
        query = query.filter(ImportedOrder.source == source)
    return query.order_by(ImportedOrder.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/stats")
async def import_stats(db: Session = Depends(get_db)):
    """匯入統計"""
    total = db.query(ImportedOrder).count()
    by_company = {}
    by_status = {}
    rows = db.query(ImportedOrder.company, ImportedOrder.status).all()
    for company, s in rows:
        by_company[company] = by_company.get(company, 0) + 1
        by_status[s] = by_status.get(s, 0) + 1
    return {
        "total": total,
        "by_company": by_company,
        "by_status": by_status,
    }


@router.get("/{import_id}", response_model=ImportedOrderResponse)
async def get_imported_order(import_id: str, db: Session = Depends(get_db)):
    """取得單筆匯入訂單"""
    item = db.query(ImportedOrder).filter(ImportedOrder.id == import_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imported order not found")
    return item


@router.post("", response_model=ImportBatchResponse, status_code=status.HTTP_201_CREATED)
async def batch_import(req: ImportBatchRequest, db: Session = Depends(get_db)):
    """
    批次匯入 - Chrome Extension 同步 / JSON 檔案上傳
    以 external_id 為去重鍵：存在則更新，不存在則新增
    """
    created = 0
    updated = 0
    errors = []

    for idx, item in enumerate(req.items):
        try:
            existing = db.query(ImportedOrder).filter(
                ImportedOrder.external_id == item.external_id
            ).first()

            if existing:
                # Update existing
                update_data = item.dict(exclude_unset=True, exclude={"external_id"})
                for key, value in update_data.items():
                    setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
                updated += 1
            else:
                # Create new
                db_item = ImportedOrder(
                    id=f"imp_{uuid4().hex[:12]}",
                    **item.dict(),
                )
                db.add(db_item)
                created += 1
        except Exception as e:
            errors.append({
                "index": idx,
                "external_id": item.external_id,
                "error": str(e),
            })

    db.commit()

    return ImportBatchResponse(
        total=len(req.items),
        created=created,
        updated=updated,
        errors=errors,
    )


@router.post("/upsert", response_model=ImportedOrderResponse)
async def upsert_import(req: ImportUpsertRequest, db: Session = Depends(get_db)):
    """
    單筆 Upsert - 依 external_id 去重
    存在 → 更新欄位；不存在 → 新增
    """
    existing = db.query(ImportedOrder).filter(
        ImportedOrder.external_id == req.external_id
    ).first()

    if existing:
        update_data = req.dict(exclude_unset=True, exclude={"external_id"})
        for key, value in update_data.items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_item = ImportedOrder(
            id=f"imp_{uuid4().hex[:12]}",
            external_id=req.external_id,
            company=req.company,
            product_name=req.product_name,
            group_name=req.group_name,
            destination=req.destination,
            depart_date=req.depart_date,
            return_date=req.return_date,
            days=req.days,
            nights=req.nights,
            pax=req.pax,
            total_price=req.total_price,
            poi_list=req.poi_list,
            itinerary=req.itinerary,
            cost_breakdown=req.cost_breakdown,
            inclusions=req.inclusions,
            exclusions=req.exclusions,
            payment_status=req.payment_status,
            source=req.source,
            raw_data=req.raw_data,
            tags=req.tags,
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item


@router.post("/upload", response_model=ImportBatchResponse, status_code=status.HTTP_201_CREATED)
async def upload_json_file(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    上傳 JSON 檔案匯入 - 接受 Chrome Extension 匯出的 JSON
    檔案格式: { "items": [...], "exported_at": "..." } 或直接 [...]
    """
    if not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="Only JSON files are accepted")

    content = await file.read()
    try:
        data = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")

    # Support both { items: [...] } and direct array
    if isinstance(data, dict):
        items_raw = data.get("items", [])
    elif isinstance(data, list):
        items_raw = data
    else:
        raise HTTPException(status_code=400, detail="JSON must be an object or array")

    created = 0
    updated = 0
    errors = []

    for idx, raw in enumerate(items_raw):
        try:
            item = ImportedOrderCreate(**raw)
            existing = db.query(ImportedOrder).filter(
                ImportedOrder.external_id == item.external_id
            ).first()

            if existing:
                update_data = item.dict(exclude_unset=True, exclude={"external_id"})
                for key, value in update_data.items():
                    setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
                updated += 1
            else:
                db_item = ImportedOrder(
                    id=f"imp_{uuid4().hex[:12]}",
                    **item.dict(),
                )
                db.add(db_item)
                created += 1
        except Exception as e:
            errors.append({
                "index": idx,
                "external_id": raw.get("external_id", "unknown"),
                "error": str(e),
            })

    db.commit()

    return ImportBatchResponse(
        total=len(items_raw),
        created=created,
        updated=updated,
        errors=errors,
    )


@router.patch("/{import_id}", response_model=ImportedOrderResponse)
async def update_imported_order(
    import_id: str, update: ImportedOrderUpdate, db: Session = Depends(get_db)
):
    """更新匯入訂單欄位"""
    item = db.query(ImportedOrder).filter(ImportedOrder.id == import_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imported order not found")

    update_data = update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(item)
    return item


@router.delete("/{import_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_imported_order(import_id: str, db: Session = Depends(get_db)):
    """刪除匯入訂單"""
    item = db.query(ImportedOrder).filter(ImportedOrder.id == import_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imported order not found")
    db.delete(item)
    db.commit()


@router.post("/{import_id}/convert")
async def convert_to_order(import_id: str, db: Session = Depends(get_db)):
    """
    將匯入的競品訂單轉為正式 TrvicERP 訂單
    建立 Order + 更新 ImportedOrder.status='converted'
    """
    item = db.query(ImportedOrder).filter(ImportedOrder.id == import_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Imported order not found")
    if item.status == "converted":
        raise HTTPException(status_code=400, detail="Already converted")

    # Create a new Order from imported data
    new_order = Order(
        id=f"ord_{uuid4().hex[:12]}",
        order_number=f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid4().hex[:6].upper()}",
        customer_id="pending",  # 需後續綁定客戶
        total_amount=item.total_price or 0,
        participants=None,
        notes=f"[自動轉換] 來源: {item.company} | 外部單號: {item.external_id} | 產品: {item.product_name or ''}",
    )
    db.add(new_order)

    # Mark imported order as converted
    item.status = "converted"
    item.converted_order_id = new_order.id
    item.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(new_order)

    return {
        "message": "Converted successfully",
        "imported_order_id": import_id,
        "new_order_id": new_order.id,
        "order_number": new_order.order_number,
    }
