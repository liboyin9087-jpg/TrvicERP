"""
檔案打包與壓縮 API
Archive and compression API for TrvicERP
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from typing import List
import zipfile
import io
from pathlib import Path
import os
from datetime import datetime

router = APIRouter(prefix="/api/v1/archive", tags=["archive"])


@router.post("/create-zip")
async def create_zip(files: List[UploadFile] = File(...)):
    """
    建立 ZIP 檔案 - 將多個上傳檔案壓縮成一個 ZIP
    Create a ZIP file from multiple uploaded files
    
    Args:
        files: 上傳的文件列表
        
    Returns:
        StreamingResponse: ZIP 檔案流
    """
    try:
        # 建立 ZIP 檔案在記憶體中
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file in files:
                # 讀取文件內容
                content = await file.read()
                
                # 添加至 ZIP
                zip_file.writestr(file.filename or f"file_{len(zip_file.namelist())}", content)
        
        # 重置指針到開始
        zip_buffer.seek(0)
        
        # 生成 ZIP 檔案名稱
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"files_{timestamp}.zip"
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"建立 ZIP 檔案失敗: {str(e)}")


@router.post("/export-documents")
async def export_documents(
    document_types: List[str] = None,
    session_id: str = None,
    background_tasks: BackgroundTasks = BackgroundTasks()
):
    """
    匯出多個文檔為 ZIP
    Export multiple documents to a ZIP file
    
    Args:
        document_types: 文檔類型列表 ['itinerary', 'room_list', 'roster', ...]
        session_id: 團次 ID
        
    Returns:
        StreamingResponse: ZIP 檔案流
    """
    try:
        if not document_types:
            document_types = ['itinerary', 'room_list', 'roster']
        
        if not session_id:
            raise HTTPException(status_code=400, detail="session_id 必需")
        
        # 建立 ZIP 檔案
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # 為每個文檔類型生成內容
            for doc_type in document_types:
                try:
                    # 這裡應該調用真實的文檔生成函數
                    # 現在使用模擬實現
                    content = generate_document(doc_type, session_id)
                    filename = f"{doc_type}_{session_id}_{datetime.now().strftime('%Y%m%d')}.pdf"
                    zip_file.writestr(filename, content)
                except Exception as e:
                    print(f"生成 {doc_type} 失敗: {e}")
                    continue
        
        zip_buffer.seek(0)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"documents_{session_id}_{timestamp}.zip"
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"匯出文檔失敗: {str(e)}")


@router.post("/extract-zip")
async def extract_zip(file: UploadFile = File(...)):
    """
    解壓 ZIP 檔案 - 取得檔案列表
    Extract and list contents of a ZIP file
    
    Args:
        file: 上傳的 ZIP 檔案
        
    Returns:
        dict: 檔案列表與信息
    """
    try:
        # 檢查檔案類型
        if not file.filename.endswith('.zip'):
            raise HTTPException(status_code=400, detail="檔案必須是 ZIP 格式")
        
        # 讀取 ZIP 檔案
        content = await file.read()
        zip_buffer = io.BytesIO(content)
        
        file_list = []
        with zipfile.ZipFile(zip_buffer, 'r') as zip_file:
            for info in zip_file.filelist:
                file_list.append({
                    "filename": info.filename,
                    "file_size": info.file_size,
                    "compressed_size": info.compress_size,
                    "date_time": str(info.date_time),
                    "is_dir": info.is_dir(),
                })
        
        return {
            "status": "success",
            "total_files": len(file_list),
            "total_size": content.__sizeof__(),
            "files": file_list
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"解壓 ZIP 檔案失敗: {str(e)}")


@router.post("/batch-compress")
async def batch_compress(
    directory_path: str = None,
    exclude_patterns: List[str] = None
):
    """
    批量壓縮目錄
    Batch compress a directory with optional exclusion patterns
    
    Args:
        directory_path: 目錄路徑
        exclude_patterns: 排除模式列表 (支持萬用字符)
        
    Returns:
        StreamingResponse: ZIP 檔案流
    """
    try:
        if not directory_path:
            raise HTTPException(status_code=400, detail="directory_path 必需")
        
        path = Path(directory_path)
        if not path.is_dir():
            raise HTTPException(status_code=400, detail="路徑不存在或不是目錄")
        
        exclude_patterns = exclude_patterns or []
        
        # 建立 ZIP 檔案
        zip_buffer = io.BytesIO()
        
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_path in path.rglob('*'):
                # 檢查是否應該排除此文件
                should_exclude = False
                for pattern in exclude_patterns:
                    if pattern in str(file_path):
                        should_exclude = True
                        break
                
                if should_exclude or file_path.is_dir():
                    continue
                
                # 計算相對路徑以保持目錄結構
                relative_path = file_path.relative_to(path)
                zip_file.write(file_path, arcname=relative_path)
        
        zip_buffer.seek(0)
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        zip_filename = f"{path.name}_{timestamp}.zip"
        
        return StreamingResponse(
            iter([zip_buffer.getvalue()]),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={zip_filename}"}
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"批量壓縮失敗: {str(e)}")


def generate_document(doc_type: str, session_id: str) -> bytes:
    """
    生成文檔內容（模擬實現）
    Generate document content (mock implementation)
    
    在實際應用中，這應該調用真實的文檔生成邏輯
    In production, this should call real document generation logic
    """
    content = f"""
    {doc_type.upper()} - Session {session_id}
    
    Generated at: {datetime.now().isoformat()}
    
    This is a mock document content.
    In production, this would contain actual document data.
    """
    return content.encode('utf-8')


# 健康檢查
@router.get("/health")
async def health_check():
    """檢查 Archive API 是否健康"""
    return {
        "status": "healthy",
        "service": "archive",
        "timestamp": datetime.now().isoformat()
    }
