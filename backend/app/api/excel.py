"""
Excel API endpoints for TrvicERP
Handles Excel import/export for various data types
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, date
from uuid import uuid4
import io
import json
from app.db.database import get_db

router = APIRouter(prefix="/api/v1/excel", tags=["Excel Import/Export"])


# Pydantic Schemas
class ExportRequest(BaseModel):
    data_type: str = Field(..., description="Type of data to export: customers, orders, tours, quotations, suppliers")
    filters: Optional[Dict[str, Any]] = Field(default_factory=dict)
    columns: Optional[List[str]] = Field(default=None, description="Specific columns to include")
    format: str = Field(default="xlsx", description="Export format: xlsx, csv")


class ImportResult(BaseModel):
    success: bool
    total_rows: int
    imported_rows: int
    failed_rows: int
    errors: List[Dict[str, Any]]


class ImportTemplate(BaseModel):
    data_type: str
    columns: List[Dict[str, str]]
    sample_data: List[Dict[str, Any]]


# Template definitions
IMPORT_TEMPLATES = {
    "customers": {
        "columns": [
            {"name": "name", "type": "string", "required": True, "description": "客戶名稱"},
            {"name": "email", "type": "string", "required": False, "description": "電子郵件"},
            {"name": "phone", "type": "string", "required": False, "description": "電話號碼"},
            {"name": "company", "type": "string", "required": False, "description": "公司名稱"},
            {"name": "address", "type": "string", "required": False, "description": "地址"},
            {"name": "notes", "type": "string", "required": False, "description": "備註"}
        ],
        "sample_data": [
            {"name": "王小明", "email": "wang@example.com", "phone": "0912345678", "company": "ABC公司", "address": "台北市信義區", "notes": "VIP客戶"},
            {"name": "李小華", "email": "lee@example.com", "phone": "0923456789", "company": "", "address": "新北市板橋區", "notes": ""}
        ]
    },
    "suppliers": {
        "columns": [
            {"name": "name", "type": "string", "required": True, "description": "供應商名稱"},
            {"name": "supplier_type", "type": "string", "required": True, "description": "類型: hotel, airline, transport, restaurant, guide"},
            {"name": "contact_person", "type": "string", "required": False, "description": "聯絡人"},
            {"name": "email", "type": "string", "required": False, "description": "電子郵件"},
            {"name": "phone", "type": "string", "required": False, "description": "電話"},
            {"name": "country", "type": "string", "required": False, "description": "國家"},
            {"name": "currency", "type": "string", "required": False, "description": "幣別 (TWD, USD, JPY)"},
            {"name": "payment_terms", "type": "string", "required": False, "description": "付款條件"}
        ],
        "sample_data": [
            {"name": "台北大飯店", "supplier_type": "hotel", "contact_person": "陳經理", "email": "hotel@example.com", "phone": "02-12345678", "country": "TW", "currency": "TWD", "payment_terms": "NET30"},
            {"name": "ABC旅遊巴士", "supplier_type": "transport", "contact_person": "林先生", "email": "bus@example.com", "phone": "02-87654321", "country": "TW", "currency": "TWD", "payment_terms": "COD"}
        ]
    },
    "tours": {
        "columns": [
            {"name": "name", "type": "string", "required": True, "description": "行程名稱"},
            {"name": "destination", "type": "string", "required": True, "description": "目的地"},
            {"name": "duration_days", "type": "integer", "required": True, "description": "天數"},
            {"name": "price", "type": "number", "required": True, "description": "價格"},
            {"name": "min_participants", "type": "integer", "required": False, "description": "最少人數"},
            {"name": "max_participants", "type": "integer", "required": False, "description": "最多人數"},
            {"name": "description", "type": "string", "required": False, "description": "行程描述"}
        ],
        "sample_data": [
            {"name": "日本東京5日遊", "destination": "日本東京", "duration_days": 5, "price": 35000, "min_participants": 16, "max_participants": 40, "description": "東京迪士尼、淺草寺、銀座購物"},
            {"name": "韓國首爾4日遊", "destination": "韓國首爾", "duration_days": 4, "price": 28000, "min_participants": 16, "max_participants": 40, "description": "明洞購物、景福宮、北村韓屋村"}
        ]
    }
}


@router.get("/templates")
async def list_import_templates():
    """List all available import templates"""
    return {
        "templates": list(IMPORT_TEMPLATES.keys()),
        "description": {
            "customers": "客戶資料匯入",
            "suppliers": "供應商資料匯入",
            "tours": "行程資料匯入"
        }
    }


@router.get("/templates/{data_type}", response_model=ImportTemplate)
async def get_import_template(data_type: str):
    """Get import template for a specific data type"""
    if data_type not in IMPORT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for {data_type} not found. Available: {list(IMPORT_TEMPLATES.keys())}"
        )
    
    template = IMPORT_TEMPLATES[data_type]
    return {
        "data_type": data_type,
        "columns": template["columns"],
        "sample_data": template["sample_data"]
    }


@router.get("/templates/{data_type}/download")
async def download_import_template(data_type: str, format: str = "csv"):
    """Download import template as CSV or Excel"""
    if data_type not in IMPORT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template for {data_type} not found"
        )
    
    template = IMPORT_TEMPLATES[data_type]
    
    # Generate CSV content
    columns = [col["name"] for col in template["columns"]]
    
    csv_content = ",".join(columns) + "\n"
    for row in template["sample_data"]:
        csv_content += ",".join([str(row.get(col, "")) for col in columns]) + "\n"
    
    # Return as downloadable file
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={data_type}_template.csv"
        }
    )


@router.post("/import/{data_type}", response_model=ImportResult)
async def import_data(
    data_type: str,
    file: UploadFile = File(...),
    skip_header: bool = True,
    validate_only: bool = False
):
    """Import data from Excel/CSV file"""
    if data_type not in IMPORT_TEMPLATES:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Import for {data_type} not supported"
        )
    
    # Read file content
    content = await file.read()
    
    try:
        # Parse CSV (simplified - in production use pandas or openpyxl)
        lines = content.decode('utf-8').strip().split('\n')
        
        if skip_header and len(lines) > 0:
            header = lines[0].split(',')
            data_lines = lines[1:]
        else:
            header = [col["name"] for col in IMPORT_TEMPLATES[data_type]["columns"]]
            data_lines = lines
        
        imported_rows = 0
        failed_rows = 0
        errors = []
        
        for i, line in enumerate(data_lines):
            try:
                values = line.split(',')
                row_data = {header[j].strip(): values[j].strip() if j < len(values) else "" for j in range(len(header))}
                
                # Validate required fields
                template = IMPORT_TEMPLATES[data_type]
                for col in template["columns"]:
                    if col["required"] and not row_data.get(col["name"]):
                        raise ValueError(f"Missing required field: {col['name']}")
                
                if not validate_only:
                    # Here you would actually insert the data into the database
                    # For now, we just count it as imported
                    pass
                
                imported_rows += 1
                
            except Exception as e:
                failed_rows += 1
                errors.append({
                    "row": i + (2 if skip_header else 1),
                    "error": str(e),
                    "data": line[:100]
                })
        
        return {
            "success": failed_rows == 0,
            "total_rows": len(data_lines),
            "imported_rows": imported_rows,
            "failed_rows": failed_rows,
            "errors": errors[:10]  # Limit errors to first 10
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to parse file: {str(e)}"
        )


@router.post("/export")
async def export_data(request: ExportRequest):
    """Export data to Excel/CSV format"""
    
    # Simulated data export (in production, query from database)
    sample_data = {
        "customers": [
            {"id": "cus_001", "name": "王小明", "email": "wang@example.com", "phone": "0912345678"},
            {"id": "cus_002", "name": "李小華", "email": "lee@example.com", "phone": "0923456789"}
        ],
        "orders": [
            {"id": "ord_001", "customer": "王小明", "tour": "日本東京5日遊", "total": 35000, "status": "confirmed"},
            {"id": "ord_002", "customer": "李小華", "tour": "韓國首爾4日遊", "total": 28000, "status": "pending"}
        ],
        "suppliers": [
            {"id": "sup_001", "name": "台北大飯店", "type": "hotel", "contact": "陳經理"},
            {"id": "sup_002", "name": "ABC旅遊巴士", "type": "transport", "contact": "林先生"}
        ]
    }
    
    if request.data_type not in sample_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Export for {request.data_type} not supported"
        )
    
    data = sample_data[request.data_type]
    
    # Filter columns if specified
    if request.columns:
        data = [{k: v for k, v in row.items() if k in request.columns} for row in data]
    
    # Generate CSV
    if not data:
        csv_content = "No data"
    else:
        columns = list(data[0].keys())
        csv_content = ",".join(columns) + "\n"
        for row in data:
            csv_content += ",".join([str(row.get(col, "")) for col in columns]) + "\n"
    
    filename = f"{request.data_type}_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    
    return StreamingResponse(
        io.StringIO(csv_content),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename={filename}"
        }
    )


@router.get("/export/batch-status/{job_id}")
async def get_export_status(job_id: str):
    """Check status of a batch export job"""
    # In production, this would check actual job status from a job queue
    return {
        "job_id": job_id,
        "status": "completed",
        "progress": 100,
        "download_url": f"/api/v1/excel/download/{job_id}",
        "expires_at": datetime.utcnow().isoformat()
    }