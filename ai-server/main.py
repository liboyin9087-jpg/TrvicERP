# ai-server/main.py
"""
TrvicERP AI Copilot - FastAPI 後端
實現多智能體動態路由架構
使用 Google Gemini (免費額度) 或 SiliconFlow + DeepSeek-V3
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import re
import json
import httpx
from typing import Optional, List, Dict, Any, Tuple
import prompt_templates

load_dotenv()

app = FastAPI(
    title="TrvicERP AI Copilot",
    description="多智能體動態路由 AI 服務",
    version="2.0.0"
)

# 允許 React 前端跨域呼叫
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 開發階段允許所有來源
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 設定
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
SILICONFLOW_API_URL = "https://api.siliconflow.com/v1/chat/completions"
SILICONFLOW_MODEL = "deepseek-ai/DeepSeek-V3"

# 使用哪個 LLM 提供者：'gemini' 或 'siliconflow'
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

# Function calling definitions
VIEW_KEYS = [
    "dashboard", "sessions", "planner", "crm", "payments", "passport",
    "costing", "insurance", "quotation", "operations", "expense", "chat",
    "estimator", "map", "welfare", "builder", "traveler", "itinerary",
    "voting", "briefing", "addons", "footprint", "tour-management", "ai-copilot"
]

WIDGET_TYPES = [
    "kpi-card", "chart-line", "chart-bar", "chart-pie", "data-table",
    "quick-actions", "calendar", "notifications", "weather", "recent-orders",
    "pending-tasks", "customer-ranking"
]

KPI_TYPES = ["revenue", "orders", "customers", "satisfaction"]
DATE_RANGES = ["today", "week", "month", "quarter"]

WIDGET_CONFIG_SCHEMA = {
    "type": "object",
    "properties": {
        "kpiType": {"type": "string", "enum": KPI_TYPES},
        "dateRange": {"type": "string", "enum": DATE_RANGES},
        "chartDataSource": {"type": "string"},
        "chartPeriod": {"type": "number"},
        "tableColumns": {"type": "array", "items": {"type": "string"}},
        "tableRowLimit": {"type": "number"},
        "refreshInterval": {"type": "number"},
        "showTrend": {"type": "boolean"},
    },
}

WIDGET_LAYOUT_SCHEMA = {
    "type": "object",
    "properties": {
        "x": {"type": "number"},
        "y": {"type": "number"},
        "w": {"type": "number"},
        "h": {"type": "number"},
        "minW": {"type": "number"},
        "minH": {"type": "number"},
        "maxW": {"type": "number"},
        "maxH": {"type": "number"},
    },
}

FUNCTION_DECLARATIONS = [
    {
        "name": "navigate",
        "description": "Navigate to a specific ERP view",
        "parameters": {
            "type": "object",
            "properties": {"viewKey": {"type": "string", "enum": VIEW_KEYS}},
            "required": ["viewKey"],
        },
    },
    {
        "name": "showCustomerData",
        "description": "Open customer management and optionally search",
        "parameters": {
            "type": "object",
            "properties": {"searchQuery": {"type": "string"}},
        },
    },
    {
        "name": "showQuotation",
        "description": "Open quotation page and optionally prefill destination",
        "parameters": {
            "type": "object",
            "properties": {"destination": {"type": "string"}},
        },
    },
    {
        "name": "showItinerary",
        "description": "Open itinerary page and optionally focus session",
        "parameters": {
            "type": "object",
            "properties": {"sessionId": {"type": "string"}},
        },
    },
    {
        "name": "setDashboardEditMode",
        "description": "Enable or disable dashboard edit mode",
        "parameters": {
            "type": "object",
            "properties": {"enabled": {"type": "boolean"}},
            "required": ["enabled"],
        },
    },
    {
        "name": "addDashboardWidget",
        "description": "Add a dashboard widget",
        "parameters": {
            "type": "object",
            "properties": {
                "type": {"type": "string", "enum": WIDGET_TYPES},
                "title": {"type": "string"},
                "config": WIDGET_CONFIG_SCHEMA,
                "layout": WIDGET_LAYOUT_SCHEMA,
            },
            "required": ["type"],
        },
    },
    {
        "name": "removeDashboardWidget",
        "description": "Remove a dashboard widget by id",
        "parameters": {
            "type": "object",
            "properties": {"id": {"type": "string"}},
            "required": ["id"],
        },
    },
    {
        "name": "updateDashboardWidget",
        "description": "Update dashboard widget title, config, or layout",
        "parameters": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "title": {"type": "string"},
                "config": WIDGET_CONFIG_SCHEMA,
                "layout": WIDGET_LAYOUT_SCHEMA,
            },
            "required": ["id"],
        },
    },
]

OPENAI_TOOLS = [{"type": "function", "function": decl} for decl in FUNCTION_DECLARATIONS]

# 讀取法規知識庫
def load_rules() -> str:
    """載入法規知識庫"""
    possible_paths = [
        "rules.txt",
        os.path.join(os.path.dirname(__file__), "rules.txt"),
    ]

    for path in possible_paths:
        try:
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                print(f"✅ 法規知識庫載入成功: {path} ({len(content)} 字元)")
                return content
        except FileNotFoundError:
            continue

    print("⚠️ 未找到法規知識庫")
    return "暫無法規資料"

RULES = load_rules()


def parse_gemini_response(result: Dict[str, Any]) -> Tuple[str, List["FunctionCall"]]:
    content = result.get("candidates", [{}])[0].get("content", {})
    parts = content.get("parts", [])
    text_parts: List[str] = []
    function_calls: List[FunctionCall] = []

    for part in parts:
        if isinstance(part, dict) and "text" in part:
            text_parts.append(part["text"])
        if isinstance(part, dict) and "functionCall" in part:
            call = part.get("functionCall", {})
            name = call.get("name", "")
            args = call.get("args") or {}
            function_calls.append(FunctionCall(name=name, arguments=args))

    return "\n".join(text_parts).strip(), function_calls


def parse_openai_response(result: Dict[str, Any]) -> Tuple[str, List["FunctionCall"]]:
    message = result.get("choices", [{}])[0].get("message", {})
    text = message.get("content") or ""
    function_calls: List[FunctionCall] = []

    tool_calls = message.get("tool_calls") or []
    for call in tool_calls:
        func = call.get("function", {})
        name = func.get("name", "")
        raw_args = func.get("arguments")
        args: Dict[str, Any] = {}
        if isinstance(raw_args, str):
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                args = {}
        elif isinstance(raw_args, dict):
            args = raw_args
        function_calls.append(FunctionCall(name=name, arguments=args))

    if not tool_calls and message.get("function_call"):
        func = message.get("function_call", {})
        name = func.get("name", "")
        raw_args = func.get("arguments")
        args = {}
        if isinstance(raw_args, str):
            try:
                args = json.loads(raw_args)
            except json.JSONDecodeError:
                args = {}
        elif isinstance(raw_args, dict):
            args = raw_args
        function_calls.append(FunctionCall(name=name, arguments=args))

    return text.strip(), function_calls


async def call_gemini(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.5
) -> Tuple[str, List["FunctionCall"]]:
    """
    呼叫 Google Gemini API (免費額度)
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="後端未設定 GOOGLE_API_KEY，請在 .env 中配置"
        )

    url = f"{GEMINI_API_URL}?key={api_key}"

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [{"text": f"{system_prompt}\n\n用戶問題：{user_message}"}]
            }
        ],
        "tools": [
            {
                "functionDeclarations": FUNCTION_DECLARATIONS
            }
        ],
        "toolConfig": {
            "functionCallingConfig": {
                "mode": "AUTO"
            }
        },
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 4096,
        }
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(url, json=payload)

        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Gemini API 錯誤: {error_detail}"
            )

        result = response.json()
        try:
            return parse_gemini_response(result)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Gemini 回應解析錯誤: {str(e)}"
            )


async def call_siliconflow(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.5
) -> Tuple[str, List["FunctionCall"]]:
    """
    呼叫 SiliconFlow API (DeepSeek-V3) - 備用
    """
    api_key = os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="後端未設定 SILICONFLOW_API_KEY，請在 .env 中配置"
        )

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    payload = {
        "model": SILICONFLOW_MODEL,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "tools": OPENAI_TOOLS,
        "tool_choice": "auto",
        "temperature": temperature,
        "max_tokens": 4096
    }

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            SILICONFLOW_API_URL,
            headers=headers,
            json=payload
        )

        if response.status_code != 200:
            error_detail = response.text
            raise HTTPException(
                status_code=response.status_code,
                detail=f"SiliconFlow API 錯誤: {error_detail}"
            )

        result = response.json()
        return parse_openai_response(result)


async def call_llm(
    system_prompt: str,
    user_message: str,
    temperature: float = 0.5
) -> Tuple[str, List["FunctionCall"]]:
    """
    統一 LLM 呼叫介面，根據設定選擇提供者
    優先使用 Gemini (免費額度)，失敗時切換到 SiliconFlow
    """
    try:
        # 優先使用 Gemini
        return await call_gemini(system_prompt, user_message, temperature)
    except HTTPException as e:
        # 如果 Gemini 失敗且有 SiliconFlow key，嘗試備用
        if os.getenv("SILICONFLOW_API_KEY"):
            print(f"⚠️ Gemini 失敗 ({e.detail})，切換到 SiliconFlow...")
            return await call_siliconflow(system_prompt, user_message, temperature)
        raise


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    mode: str = "general"
    context: str = ""


class FunctionCall(BaseModel):
    """AI 函數呼叫格式"""
    name: str
    arguments: dict


class ChatResponse(BaseModel):
    reply: str
    mode: str
    mode_description: str
    function_calls: Optional[List[FunctionCall]] = None


def parse_function_calls(text: str) -> tuple[str, List[FunctionCall]]:
    """
    解析 AI 回應中的函數呼叫標記
    """
    function_calls = []
    clean_text = text

    pattern = r'\[FUNCTION_CALLS\]\s*(.*?)\s*\[/FUNCTION_CALLS\]'
    matches = re.findall(pattern, text, re.DOTALL)

    if matches:
        for match in matches:
            try:
                calls_data = json.loads(match.strip())
                if isinstance(calls_data, list):
                    for call in calls_data:
                        function_calls.append(FunctionCall(
                            name=call.get('name', ''),
                            arguments=call.get('arguments', {})
                        ))
                elif isinstance(calls_data, dict):
                    function_calls.append(FunctionCall(
                        name=calls_data.get('name', ''),
                        arguments=calls_data.get('arguments', {})
                    ))
            except json.JSONDecodeError:
                pass

        clean_text = re.sub(pattern, '', text, flags=re.DOTALL).strip()

    return clean_text, function_calls


class HealthResponse(BaseModel):
    status: str
    llm_configured: bool
    rules_loaded: bool
    provider: str


# API Endpoints
@app.get("/health", response_model=HealthResponse)
async def health_check():
    """健康檢查端點"""
    gemini_key = os.getenv("GOOGLE_API_KEY")
    siliconflow_key = os.getenv("SILICONFLOW_API_KEY")

    provider = "gemini" if gemini_key else ("siliconflow" if siliconflow_key else "none")

    return HealthResponse(
        status="healthy",
        llm_configured=bool(gemini_key or siliconflow_key),
        rules_loaded=len(RULES) > 50,
        provider=provider
    )


@app.get("/api/modes")
async def get_modes():
    """取得所有可用的專家模式"""
    return {
        "modes": [
            {"id": "itinerary", "label": "📅 行程", "description": "行程規劃專家"},
            {"id": "marketing", "label": "✨ 行銷", "description": "行銷文案專家"},
            {"id": "costing", "label": "💰 成本", "description": "成本試算專家"},
            {"id": "legal", "label": "⚖️ 法規", "description": "法規諮詢專家"},
            {"id": "general", "label": "🧭 通用", "description": "團控通用助手"},
        ]
    }


@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    """
    主要聊天端點 - 動態路由架構
    """
    # 1. 根據模式取得溫度
    temperature = prompt_templates.get_temperature(req.mode)

    # 2. 根據模式取得專家 System Prompt
    system_prompt = prompt_templates.get_prompt_template(req.mode, rules=RULES)

    # 3. 組合最終 Prompt
    final_prompt = f"""{system_prompt}

【當前業務情境】：
{req.context if req.context else "無額外情境資訊"}
"""

    # 4. 執行 LLM 呼叫
    try:
        response_text, function_calls = await call_llm(
            system_prompt=final_prompt,
            user_message=req.message,
            temperature=temperature
        )

        # 5. 解析函數呼叫（若工具呼叫為空，嘗試解析標記格式）
        clean_reply = response_text.strip()
        if not function_calls:
            clean_reply, function_calls = parse_function_calls(response_text)
        if not clean_reply:
            clean_reply = "已完成操作。"

        return ChatResponse(
            reply=clean_reply,
            mode=req.mode,
            mode_description=prompt_templates.get_mode_description(req.mode),
            function_calls=function_calls if function_calls else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 服務異常: {str(e)}"
        )


# 開發時直接執行
if __name__ == "__main__":
    import uvicorn
    print("🚀 TrvicERP AI Copilot 啟動中...")
    print(f"📚 法規知識庫: {'已載入' if len(RULES) > 50 else '未載入'}")
    print(f"🔑 Gemini API: {'已設定' if os.getenv('GOOGLE_API_KEY') else '未設定'}")
    print(f"🔑 SiliconFlow API: {'已設定 (備用)' if os.getenv('SILICONFLOW_API_KEY') else '未設定'}")
    uvicorn.run(app, host="0.0.0.0", port=4000, reload=True)
