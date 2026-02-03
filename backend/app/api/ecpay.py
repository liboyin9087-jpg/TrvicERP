"""
ECPay (綠界) Payment Gateway Integration
台灣最大的第三方金流服務

API 文件: https://developers.ecpay.com.tw/
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel, Field
from typing import Optional, List
import hashlib
import urllib.parse
from datetime import datetime
import hmac
import json
import httpx
import logging

from app.core.config import settings
from app.db.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ecpay", tags=["Payment - ECPay"])


# ===========================================
# Configuration
# ===========================================
class ECPayConfig:
    """ECPay API Configuration"""
    
    # 測試環境
    SANDBOX_API_URL = "https://payment-stage.ecpay.com.tw"
    
    # 正式環境
    PRODUCTION_API_URL = "https://payment.ecpay.com.tw"
    
    @classmethod
    def get_api_url(cls) -> str:
        return cls.SANDBOX_API_URL if settings.ECPAY_SANDBOX else cls.PRODUCTION_API_URL
    
    @classmethod
    def get_credentials(cls) -> dict:
        return {
            "MerchantID": settings.ECPAY_MERCHANT_ID,
            "HashKey": settings.ECPAY_HASH_KEY,
            "HashIV": settings.ECPAY_HASH_IV,
        }


# ===========================================
# Request/Response Models
# ===========================================
class PaymentItem(BaseModel):
    """付款項目"""
    name: str = Field(..., description="商品名稱")
    price: int = Field(..., ge=1, description="單價 (TWD)")
    quantity: int = Field(default=1, ge=1, description="數量")


class CreatePaymentRequest(BaseModel):
    """建立付款請求"""
    order_id: str = Field(..., description="訂單編號")
    amount: int = Field(..., ge=1, description="付款金額 (TWD)")
    description: str = Field(..., description="交易描述")
    items: List[PaymentItem] = Field(..., min_length=1, description="付款項目")
    
    # 付款方式
    payment_method: str = Field(
        default="Credit",
        description="付款方式: Credit(信用卡), ATM(虛擬ATM), CVS(超商代碼), BARCODE(超商條碼)"
    )
    
    # 回調 URL
    return_url: Optional[str] = Field(None, description="付款完成後導向 URL")
    notify_url: Optional[str] = Field(None, description="Server 端接收付款結果 URL")
    
    # 客戶資訊
    customer_name: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None


class PaymentResponse(BaseModel):
    """付款回應"""
    success: bool
    payment_url: Optional[str] = None
    trade_no: Optional[str] = None
    error_message: Optional[str] = None


class PaymentCallbackData(BaseModel):
    """付款回調資料 (from ECPay)"""
    MerchantID: str
    MerchantTradeNo: str
    StoreID: Optional[str] = None
    RtnCode: int
    RtnMsg: str
    TradeNo: str
    TradeAmt: int
    PaymentDate: str
    PaymentType: str
    PaymentTypeChargeFee: int
    TradeDate: str
    SimulatePaid: int = 0
    CheckMacValue: str


# ===========================================
# ECPay Utility Functions
# ===========================================
def generate_check_mac_value(params: dict) -> str:
    """
    產生 ECPay 檢查碼
    步驟:
    1. 將參數依照 Key 由 A-Z 排序
    2. 組成 QueryString
    3. 加上 HashKey 與 HashIV
    4. URL Encode (小寫)
    5. SHA256 Hash
    6. 轉大寫
    """
    creds = ECPayConfig.get_credentials()
    
    # 排除 CheckMacValue
    filtered_params = {k: v for k, v in params.items() if k != "CheckMacValue"}
    
    # 依照 Key 排序
    sorted_params = sorted(filtered_params.items(), key=lambda x: x[0])
    
    # 組成 QueryString
    query_string = "&".join([f"{k}={v}" for k, v in sorted_params])
    
    # 加上 HashKey 與 HashIV
    raw = f"HashKey={creds['HashKey']}&{query_string}&HashIV={creds['HashIV']}"
    
    # URL Encode (ECPay 規定要小寫)
    encoded = urllib.parse.quote_plus(raw).lower()
    
    # 特殊字元轉換 (ECPay 規定)
    encoded = encoded.replace("%2d", "-")
    encoded = encoded.replace("%5f", "_")
    encoded = encoded.replace("%2e", ".")
    encoded = encoded.replace("%21", "!")
    encoded = encoded.replace("%2a", "*")
    encoded = encoded.replace("%28", "(")
    encoded = encoded.replace("%29", ")")
    
    # SHA256 Hash 並轉大寫
    hash_value = hashlib.sha256(encoded.encode("utf-8")).hexdigest().upper()
    
    return hash_value


def verify_check_mac_value(params: dict) -> bool:
    """驗證 ECPay 回傳的 CheckMacValue"""
    received_mac = params.get("CheckMacValue", "")
    calculated_mac = generate_check_mac_value(params)
    return received_mac.upper() == calculated_mac.upper()


# ===========================================
# API Endpoints
# ===========================================
@router.post("/create", response_model=PaymentResponse)
async def create_payment(request: CreatePaymentRequest, db: Session = Depends(get_db)):
    """
    建立 ECPay 付款
    回傳付款 URL，前端導向此 URL 進行付款
    """
    if not settings.ECPAY_MERCHANT_ID:
        raise HTTPException(status_code=500, detail="ECPay is not configured")
    
    creds = ECPayConfig.get_credentials()
    
    # 準備商品名稱 (ECPay 格式: 品名1 x 數量#品名2 x 數量)
    item_names = "#".join([f"{item.name} x {item.quantity}" for item in request.items])
    
    # 建立交易參數
    trade_date = datetime.now().strftime("%Y/%m/%d %H:%M:%S")
    
    params = {
        "MerchantID": creds["MerchantID"],
        "MerchantTradeNo": request.order_id,
        "MerchantTradeDate": trade_date,
        "PaymentType": "aio",
        "TotalAmount": request.amount,
        "TradeDesc": urllib.parse.quote(request.description),
        "ItemName": item_names,
        "ReturnURL": request.notify_url or f"{settings.VITE_APP_URL}/api/v1/ecpay/callback",
        "ChoosePayment": request.payment_method,
        "EncryptType": 1,  # SHA256
    }
    
    # 可選參數
    if request.return_url:
        params["OrderResultURL"] = request.return_url
    
    if request.customer_email:
        params["Email"] = request.customer_email
    
    # 產生檢查碼
    params["CheckMacValue"] = generate_check_mac_value(params)
    
    # 記錄交易 (可選: 存入資料庫)
    logger.info(f"Creating ECPay payment: {request.order_id}, amount: {request.amount}")
    
    # 回傳付款表單 URL
    api_url = f"{ECPayConfig.get_api_url()}/Cashier/AioCheckOut/V5"
    
    return PaymentResponse(
        success=True,
        payment_url=api_url,
        trade_no=request.order_id,
    )


@router.post("/callback")
async def payment_callback(request: Request, db: Session = Depends(get_db)):
    """
    ECPay 付款結果回調
    此 endpoint 接收 ECPay server 端的付款通知
    """
    try:
        # 解析 form data
        form_data = await request.form()
        params = dict(form_data)
        
        logger.info(f"ECPay callback received: {params.get('MerchantTradeNo')}")
        
        # 驗證 CheckMacValue
        if not verify_check_mac_value(params):
            logger.warning("ECPay callback: CheckMacValue verification failed")
            return "0|CheckMacValue verification failed"
        
        # 解析回調資料
        callback_data = PaymentCallbackData(**params)
        
        # 檢查付款狀態
        if callback_data.RtnCode == 1:
            # 付款成功
            logger.info(f"Payment successful: {callback_data.MerchantTradeNo}")
            
            # TODO: 更新訂單狀態
            # order = get_order(db, callback_data.MerchantTradeNo)
            # if order:
            #     order.payment_status = "paid"
            #     order.paid_amount = callback_data.TradeAmt
            #     db.commit()
            
            # TODO: 發送付款成功通知 (LINE, Email)
            
        else:
            # 付款失敗
            logger.warning(f"Payment failed: {callback_data.MerchantTradeNo}, reason: {callback_data.RtnMsg}")
        
        # ECPay 要求回傳 "1|OK" 表示收到
        return "1|OK"
        
    except Exception as e:
        logger.error(f"ECPay callback error: {e}")
        return "0|Error"


@router.get("/query/{trade_no}")
async def query_payment(trade_no: str):
    """
    查詢交易狀態
    """
    if not settings.ECPAY_MERCHANT_ID:
        raise HTTPException(status_code=500, detail="ECPay is not configured")
    
    creds = ECPayConfig.get_credentials()
    
    params = {
        "MerchantID": creds["MerchantID"],
        "MerchantTradeNo": trade_no,
        "TimeStamp": int(datetime.now().timestamp()),
        "PlatformID": "",
    }
    
    params["CheckMacValue"] = generate_check_mac_value(params)
    
    api_url = f"{ECPayConfig.get_api_url()}/Cashier/QueryTradeInfo/V5"
    
    async with httpx.AsyncClient() as client:
        response = await client.post(api_url, data=params)
        
        if response.status_code == 200:
            # 解析回應
            result = dict(urllib.parse.parse_qsl(response.text))
            return result
        else:
            raise HTTPException(status_code=500, detail="Failed to query payment status")


@router.post("/refund/{trade_no}")
async def refund_payment(trade_no: str, amount: int):
    """
    申請退款
    注意: 信用卡退款需要在綠界後台設定
    """
    if not settings.ECPAY_MERCHANT_ID:
        raise HTTPException(status_code=500, detail="ECPay is not configured")
    
    # TODO: Implement refund logic
    # ECPay 退款需要使用不同的 API endpoint
    
    raise HTTPException(status_code=501, detail="Refund API not implemented yet")
