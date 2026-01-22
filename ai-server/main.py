# ai-server/main.py
"""
TrvicERP AI Copilot - FastAPI 後端
實現多智能體動態路由架構
使用 Google Gemini (免費額度) 或 SiliconFlow + DeepSeek-V3
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv
import os
import re
import json
import httpx
import math
from uuid import uuid4
from typing import Optional, List, Dict, Any, Tuple
import asyncio
import prompt_templates

BASE_DIR = os.path.dirname(__file__)
load_dotenv(os.path.join(BASE_DIR, ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, ".env.local"), override=False)
load_dotenv(os.path.join(BASE_DIR, "..", ".env"), override=False)
load_dotenv(os.path.join(BASE_DIR, "..", ".env.local"), override=False)

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
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
GEMINI_API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent"
GEMINI_DEFAULT_MAX_TOKENS = int(os.getenv("GEMINI_DEFAULT_MAX_TOKENS", "4000"))
GEMINI_GENERAL_MAX_TOKENS = int(os.getenv("GEMINI_GENERAL_MAX_TOKENS", "1000"))
GEMINI_LEGAL_MAX_TOKENS = int(os.getenv("GEMINI_LEGAL_MAX_TOKENS", "4000"))
GEMINI_MARKETING_MAX_TOKENS = int(os.getenv("GEMINI_MARKETING_MAX_TOKENS", "10000"))
SILICONFLOW_API_URL = "https://api.siliconflow.com/v1/chat/completions"
SILICONFLOW_MODEL = os.getenv("SILICONFLOW_MODEL", "deepseek-ai/DeepSeek-V3")
SILICONFLOW_MARKETING_MODEL = os.getenv(
    "SILICONFLOW_MARKETING_MODEL",
    "Qwen/Qwen2.5-32B-Instruct"
)
SILICONFLOW_MARKETING_TEMPERATURE = float(os.getenv("SILICONFLOW_MARKETING_TEMPERATURE", "0.7"))
SILICONFLOW_MARKETING_MAX_TOKENS = int(os.getenv("SILICONFLOW_MARKETING_MAX_TOKENS", "10000"))

BFL_BASE_URL = os.getenv("BFL_BASE_URL", "https://api.bfl.ml/v1")
BFL_MODEL = os.getenv("BFL_MODEL", "flux-pro")
BFL_API_KEY = os.getenv("BFL_API_KEY")
BFL_API_STYLE = os.getenv("BFL_API_STYLE", "auto")

# 使用哪個 LLM 提供者：'gemini' 或 'siliconflow'
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "gemini")

# Function calling definitions
VIEW_KEYS = [
    "dashboard", "sessions", "planner", "crm", "payments", "passport",
    "costing", "insurance", "quotation", "operations", "expense", "chat",
    "estimator", "map", "welfare", "builder", "traveler", "itinerary",
    "voting", "briefing", "addons", "footprint", "tour-management", "ai-copilot",
    "proposal-engine"
]

WIDGET_TYPES = [
    "kpi-card", "chart-line", "chart-bar", "chart-pie", "data-table",
    "quick-actions", "calendar", "notifications", "weather", "recent-orders",
    "pending-tasks", "customer-ranking"
]

ROLE_TOOL_PERMISSIONS: Dict[str, List[str]] = {
    "staff": [
        "navigate", "showCustomerData", "showQuotation", "showItinerary",
        "setDashboardEditMode", "addDashboardWidget", "removeDashboardWidget",
        "updateDashboardWidget", "generateMarketingImage"
    ],
    "welfare": [
        "navigate", "showItinerary", "showQuotation", "showCustomerData"
    ],
    "traveler": [
        "navigate", "showItinerary"
    ],
}

SENSITIVE_TOOLS = {
    "addDashboardWidget",
    "removeDashboardWidget",
    "updateDashboardWidget",
}

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
    {
        "name": "generateMarketingImage",
        "description": "Generate a marketing image using a text prompt",
        "parameters": {
            "type": "object",
            "properties": {
                "prompt": {"type": "string"},
                "width": {"type": "number"},
                "height": {"type": "number"},
                "seed": {"type": "number"},
                "steps": {"type": "number"},
                "guidance": {"type": "number"},
                "output_format": {"type": "string"},
            },
            "required": ["prompt"],
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

RAG_MAX_CHARS = int(os.getenv("RAG_MAX_CHARS", "900"))
RAG_TOP_K = int(os.getenv("RAG_TOP_K", "4"))
LEGAL_KEYWORDS = [
    "法規", "條款", "合約", "契約", "退費", "取消", "賠償", "保險", "護照",
    "簽證", "消保", "消費者", "旅遊定型化契約", "責任", "罰則", "違規"
]


def chunk_text(text: str, max_chars: int) -> List[str]:
    paragraphs = [p.strip() for p in re.split(r"\n{2,}", text) if p.strip()]
    chunks: List[str] = []
    buffer: List[str] = []
    current_len = 0

    for paragraph in paragraphs:
        if current_len + len(paragraph) + 2 > max_chars and buffer:
            chunks.append("\n\n".join(buffer).strip())
            buffer = [paragraph]
            current_len = len(paragraph)
        else:
            buffer.append(paragraph)
            current_len += len(paragraph) + 2

    if buffer:
        chunks.append("\n\n".join(buffer).strip())

    return chunks


RULES_CHUNKS = chunk_text(RULES, RAG_MAX_CHARS) if RULES and len(RULES) > 20 else []


def extract_keywords(query: str) -> List[str]:
    raw_tokens = re.findall(r"[A-Za-z0-9_]+|[\u4e00-\u9fff]{2,}", query)
    tokens = []
    for token in raw_tokens:
        cleaned = token.strip().lower()
        if len(cleaned) < 2:
            continue
        tokens.append(cleaned)
    return list(dict.fromkeys(tokens))


def score_chunk(chunk: str, keywords: List[str]) -> float:
    if not keywords:
        return 0.0
    score = 0.0
    lowered = chunk.lower()
    for keyword in keywords:
        count = lowered.count(keyword) if keyword.isascii() else chunk.count(keyword)
        if count:
            score += count * max(1.0, len(keyword) / 2)
    return score


def retrieve_rules_snippets(query: str, top_k: int = RAG_TOP_K) -> List[Dict[str, Any]]:
    if not RULES_CHUNKS:
        return []
    keywords = extract_keywords(query)
    if not keywords:
        return []

    scored = []
    for idx, chunk in enumerate(RULES_CHUNKS):
        score = score_chunk(chunk, keywords)
        if score > 0:
            scored.append((score, idx, chunk))

    if not scored:
        return []

    scored.sort(key=lambda item: item[0], reverse=True)
    snippets = []
    for score, _, chunk in scored[:top_k]:
        snippets.append({"score": score, "text": chunk})
    return snippets


def should_use_rag(mode: str, message: str) -> bool:
    if mode == "legal":
        return True
    if mode == "general":
        return any(keyword in message for keyword in LEGAL_KEYWORDS)
    return False


def build_rules_context(mode: str, message: str) -> Tuple[str, List[str]]:
    if not should_use_rag(mode, message):
        return "", []
    snippets = retrieve_rules_snippets(message)
    if not snippets:
        return "", []
    rendered = []
    sources = []
    for idx, snippet in enumerate(snippets, start=1):
        text = snippet["text"]
        rendered.append(f"{idx}. {text}")
        sources.append(text[:240].replace("\n", " "))
    return "以下為本次問題檢索到的法規摘要：\n" + "\n\n".join(rendered), sources


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
    temperature: float = 0.5,
    max_tokens: int = GEMINI_DEFAULT_MAX_TOKENS,
    enable_tools: bool = True,
    response_mime_type: Optional[str] = None
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
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": max_tokens,
        }
    }
    if enable_tools:
        payload["tools"] = [
            {
                "functionDeclarations": FUNCTION_DECLARATIONS
            }
        ]
        payload["toolConfig"] = {
            "functionCallingConfig": {
                "mode": "AUTO"
            }
        }
    if response_mime_type:
        payload["generationConfig"]["responseMimeType"] = response_mime_type

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
    temperature: float = 0.5,
    model: str = SILICONFLOW_MODEL,
    max_tokens: int = 4096,
    enable_tools: bool = True,
    response_format: Optional[Dict[str, Any]] = None
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
        "model": model,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_message}
        ],
        "temperature": temperature,
        "max_tokens": max_tokens
    }
    if enable_tools:
        payload["tools"] = OPENAI_TOOLS
        payload["tool_choice"] = "auto"
    if response_format:
        payload["response_format"] = response_format

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
    temperature: float = 0.5,
    provider: Optional[str] = None,
    model: Optional[str] = None,
    max_tokens: Optional[int] = None,
    gemini_max_tokens: Optional[int] = None,
    enable_tools: bool = True,
    response_mime_type: Optional[str] = None,
    response_format: Optional[Dict[str, Any]] = None
) -> Tuple[str, List["FunctionCall"]]:
    """
    統一 LLM 呼叫介面，根據設定選擇提供者
    優先使用 Gemini (免費額度)，失敗時切換到 SiliconFlow
    """
    selected_provider = (provider or LLM_PROVIDER or "gemini").lower()
    selected_model = model or SILICONFLOW_MODEL

    if selected_provider == "siliconflow":
        try:
            return await call_siliconflow(
                system_prompt,
                user_message,
                temperature,
                model=selected_model,
                max_tokens=max_tokens or 4096,
                enable_tools=enable_tools,
                response_format=response_format
            )
        except HTTPException as e:
            if os.getenv("GOOGLE_API_KEY"):
                print(f"⚠️ SiliconFlow 失敗 ({e.detail})，切換到 Gemini...")
                return await call_gemini(
                    system_prompt,
                    user_message,
                    temperature,
                    max_tokens=gemini_max_tokens or GEMINI_DEFAULT_MAX_TOKENS,
                    enable_tools=enable_tools,
                    response_mime_type=response_mime_type
                )
            raise
    try:
        return await call_gemini(
            system_prompt,
            user_message,
            temperature,
            max_tokens=gemini_max_tokens or GEMINI_DEFAULT_MAX_TOKENS,
            enable_tools=enable_tools,
            response_mime_type=response_mime_type
        )
    except HTTPException as e:
        if os.getenv("SILICONFLOW_API_KEY"):
            print(f"⚠️ Gemini 失敗 ({e.detail})，切換到 SiliconFlow...")
            return await call_siliconflow(
                system_prompt,
                user_message,
                temperature,
                model=selected_model,
                max_tokens=max_tokens or 4096,
                enable_tools=enable_tools,
                response_format=response_format
            )
        raise


def select_llm_for_mode(mode: str) -> Tuple[str, Optional[str], Optional[float], Optional[int], Optional[int]]:
    """
    根據模式選擇 LLM 提供者與模型
    - 行銷文案：優先使用 Qwen2.5 (SiliconFlow)
    - 其他模式：依 LLM_PROVIDER 設定
    """
    if mode == "marketing":
        return (
            "siliconflow",
            SILICONFLOW_MARKETING_MODEL,
            SILICONFLOW_MARKETING_TEMPERATURE,
            SILICONFLOW_MARKETING_MAX_TOKENS,
            GEMINI_MARKETING_MAX_TOKENS
        )
    if mode == "legal":
        return (LLM_PROVIDER or "gemini"), None, None, None, GEMINI_LEGAL_MAX_TOKENS
    if mode == "general":
        return (LLM_PROVIDER or "gemini"), None, None, None, GEMINI_GENERAL_MAX_TOKENS
    return (LLM_PROVIDER or "gemini"), None, None, None, GEMINI_DEFAULT_MAX_TOKENS


def extract_image_url(payload: Dict[str, Any]) -> Optional[str]:
    if not payload:
        return None
    for key in ["image_url", "url", "sample", "output"]:
        value = payload.get(key)
        if isinstance(value, str):
            return value
    result = payload.get("result")
    if isinstance(result, dict):
        for key in ["sample", "image_url", "url"]:
            value = result.get(key)
            if isinstance(value, str):
                return value
    if isinstance(result, list) and result:
        if isinstance(result[0], str):
            return result[0]
    data = payload.get("data")
    if isinstance(data, list) and data:
        first = data[0]
        if isinstance(first, dict):
            url = first.get("url") or first.get("image_url")
            if isinstance(url, str):
                return url
            b64 = first.get("b64_json")
            if isinstance(b64, str):
                return f"data:image/png;base64,{b64}"
    return None


def is_siliconflow_bfl_style() -> bool:
    if BFL_API_STYLE == "siliconflow":
        return True
    if BFL_API_STYLE == "bfl":
        return False
    return "siliconflow" in BFL_BASE_URL or "/chat/completions" in BFL_BASE_URL


async def call_bfl_flux(
    prompt: str,
    width: int = 1024,
    height: int = 1024,
    steps: int = 30,
    guidance: float = 3.5,
    seed: Optional[int] = None,
    output_format: str = "png"
) -> Dict[str, Any]:
    api_key = BFL_API_KEY or os.getenv("SILICONFLOW_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="後端未設定 BFL_API_KEY 或 SILICONFLOW_API_KEY，無法生成圖片"
        )

    if is_siliconflow_bfl_style():
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": BFL_MODEL,
            "messages": [
                {"role": "system", "content": "You are an image generator. Return an image URL if available."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.2,
            "max_tokens": 1024,
            "width": width,
            "height": height,
            "steps": steps,
            "guidance": guidance,
            "seed": seed,
            "output_format": output_format,
        }

        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                BFL_BASE_URL,
                headers=headers,
                json=payload
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"BFL(SiliconFlow) API 錯誤: {response.text}"
                )
            data = response.json()
            image_url = extract_image_url(data)
            if not image_url:
                text, _ = parse_openai_response(data)
                image_url = extract_image_url({"text": text})
            return {"image_url": image_url, "raw": data}

    headers = {
        "x-key": api_key,
        "Content-Type": "application/json",
    }
    payload = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "steps": steps,
        "guidance": guidance,
        "output_format": output_format,
    }
    if seed is not None:
        payload["seed"] = seed

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{BFL_BASE_URL}/{BFL_MODEL}",
            headers=headers,
            json=payload
        )
        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"BFL API 錯誤: {response.text}"
            )

        data = response.json()
        image_url = extract_image_url(data)
        if image_url:
            return {"image_url": image_url, "raw": data}

        request_id = data.get("id") or data.get("request_id")
        if not request_id:
            return {"image_url": None, "raw": data}

        for _ in range(20):
            await asyncio.sleep(1)
            result_resp = await client.get(
                f"{BFL_BASE_URL}/get_result",
                headers=headers,
                params={"id": request_id}
            )
            if result_resp.status_code != 200:
                continue
            result_data = result_resp.json()
            status = (result_data.get("status") or result_data.get("state") or "").lower()
            if status in ["ready", "succeeded", "success", "completed"]:
                return {"image_url": extract_image_url(result_data), "raw": result_data}
            if status in ["failed", "error"]:
                break

        return {"image_url": None, "raw": data}


# Request/Response Models
class ChatRequest(BaseModel):
    message: str
    mode: str = "general"
    context: str = ""
    user_role: Optional[str] = None
    user_id: Optional[str] = None


class FunctionCall(BaseModel):
    """AI 函數呼叫格式"""
    name: str
    arguments: dict


class ChatResponse(BaseModel):
    reply: str
    mode: str
    mode_description: str
    function_calls: Optional[List[FunctionCall]] = None
    image_url: Optional[str] = None
    image_prompt: Optional[str] = None
    rag_sources: Optional[List[str]] = None
    pending_actions: Optional[List["PendingAction"]] = None
    blocked_actions: Optional[List["PendingAction"]] = None


class PendingAction(BaseModel):
    id: str
    call: FunctionCall
    reason: str


class StructuredOutputRequest(BaseModel):
    message: str
    mode: str = "general"
    context: str = ""
    schema: str = "itinerary"
    user_role: Optional[str] = None
    user_id: Optional[str] = None
    max_attempts: int = 2


class StructuredOutputResponse(BaseModel):
    schema: str
    data: Dict[str, Any]
    raw_text: str
    attempts: int
    provider: str


class ItineraryActivity(BaseModel):
    time: str = Field(..., description="Time or time range")
    title: str = Field(..., description="Activity title")
    stay_hours: float = Field(..., ge=0, description="Estimated stay duration in hours")
    notes: Optional[str] = Field(default=None, description="Notes or cautions")


class ItineraryDay(BaseModel):
    day: int = Field(..., ge=1, description="Day number")
    title: str = Field(..., description="Day title")
    meals: List[str] = Field(default_factory=list, description="Meals included")
    lodging: str = Field(..., description="Hotel or lodging")
    activities: List[ItineraryActivity] = Field(default_factory=list)


class ItineraryOutput(BaseModel):
    title: str = Field(..., description="Trip title")
    days: List[ItineraryDay] = Field(default_factory=list)
    highlights: List[str] = Field(default_factory=list)
    cautions: List[str] = Field(default_factory=list)


class ProposalTier(BaseModel):
    name: str = Field(..., description="Tier name")
    price_per_person: int = Field(..., ge=0)
    margin_percent: float = Field(..., ge=0)
    lodging: str
    transport: str
    meals: str
    highlights: List[str] = Field(default_factory=list)


class ProposalComparisonOutput(BaseModel):
    title: str
    summary: str
    tiers: List[ProposalTier] = Field(default_factory=list)
    inclusions: List[str] = Field(default_factory=list)
    exclusions: List[str] = Field(default_factory=list)
    safety_commitments: List[str] = Field(default_factory=list)


class NpsInsightOutput(BaseModel):
    nps_score: int = Field(..., ge=-100, le=100)
    response_count: int = Field(..., ge=0)
    promoter_ratio: float = Field(..., ge=0, le=100)
    detractor_ratio: float = Field(..., ge=0, le=100)
    key_themes: List[str] = Field(default_factory=list)
    improvement_actions: List[str] = Field(default_factory=list)


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


def is_finite_number(value: Any) -> Optional[float]:
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    if not math.isfinite(number):
        return None
    return number


def coerce_bool(value: Any) -> Optional[bool]:
    if isinstance(value, bool):
        return value
    if isinstance(value, (int, float)) and math.isfinite(value):
        return bool(value)
    if isinstance(value, str):
        lowered = value.strip().lower()
        if lowered in ("true", "1", "yes", "y"):
            return True
        if lowered in ("false", "0", "no", "n"):
            return False
    return None


def sanitize_layout(layout: Any) -> Dict[str, Any]:
    if not isinstance(layout, dict):
        return {}
    sanitized: Dict[str, Any] = {}
    for key in ["x", "y", "w", "h", "minW", "minH", "maxW", "maxH"]:
        value = is_finite_number(layout.get(key))
        if value is None:
            continue
        if key in ["w", "h", "minW", "minH", "maxW", "maxH"]:
            value = max(1, int(value))
        else:
            value = int(value)
        sanitized[key] = value
    return sanitized


def sanitize_widget_config(config: Any) -> Dict[str, Any]:
    if not isinstance(config, dict):
        return {}
    sanitized: Dict[str, Any] = {}

    kpi_type = config.get("kpiType")
    if isinstance(kpi_type, str) and kpi_type in KPI_TYPES:
        sanitized["kpiType"] = kpi_type

    date_range = config.get("dateRange")
    if isinstance(date_range, str) and date_range in DATE_RANGES:
        sanitized["dateRange"] = date_range

    chart_data_source = config.get("chartDataSource")
    if isinstance(chart_data_source, str) and chart_data_source.strip():
        sanitized["chartDataSource"] = chart_data_source.strip()

    chart_period = is_finite_number(config.get("chartPeriod"))
    if chart_period is not None:
        sanitized["chartPeriod"] = max(1, int(chart_period))

    table_columns = config.get("tableColumns")
    if isinstance(table_columns, list):
        columns = [str(item).strip() for item in table_columns if str(item).strip()]
        if columns:
            sanitized["tableColumns"] = columns

    table_row_limit = is_finite_number(config.get("tableRowLimit"))
    if table_row_limit is not None:
        sanitized["tableRowLimit"] = max(1, int(table_row_limit))

    refresh_interval = is_finite_number(config.get("refreshInterval"))
    if refresh_interval is not None:
        sanitized["refreshInterval"] = max(1, int(refresh_interval))

    show_trend = coerce_bool(config.get("showTrend"))
    if show_trend is not None:
        sanitized["showTrend"] = show_trend

    return sanitized


def sanitize_function_calls(calls: Optional[List[FunctionCall]]) -> List[FunctionCall]:
    if not calls:
        return []

    allowed = {
        "navigate",
        "showCustomerData",
        "showQuotation",
        "showItinerary",
        "setDashboardEditMode",
        "addDashboardWidget",
        "removeDashboardWidget",
        "updateDashboardWidget",
        "generateMarketingImage",
    }

    sanitized_calls: List[FunctionCall] = []
    for call in calls:
        name = getattr(call, "name", None)
        args = getattr(call, "arguments", None)
        if isinstance(call, dict):
            name = call.get("name") or name
            args = call.get("arguments") or args
        if not name or name not in allowed:
            continue
        if not isinstance(args, dict):
            args = {}

        if name == "navigate":
            view_key = str(args.get("viewKey", "")).strip()
            if view_key in VIEW_KEYS:
                sanitized_calls.append(FunctionCall(name=name, arguments={"viewKey": view_key}))
            continue

        if name == "showCustomerData":
            search_query = args.get("searchQuery")
            payload: Dict[str, Any] = {}
            if isinstance(search_query, str) and search_query.strip():
                payload["searchQuery"] = search_query.strip()
            sanitized_calls.append(FunctionCall(name=name, arguments=payload))
            continue

        if name == "showQuotation":
            destination = args.get("destination")
            payload = {}
            if isinstance(destination, str) and destination.strip():
                payload["destination"] = destination.strip()
            sanitized_calls.append(FunctionCall(name=name, arguments=payload))
            continue

        if name == "showItinerary":
            session_id = args.get("sessionId")
            payload = {}
            if isinstance(session_id, str) and session_id.strip():
                payload["sessionId"] = session_id.strip()
            sanitized_calls.append(FunctionCall(name=name, arguments=payload))
            continue

        if name == "setDashboardEditMode":
            enabled = coerce_bool(args.get("enabled"))
            if enabled is not None:
                sanitized_calls.append(FunctionCall(name=name, arguments={"enabled": enabled}))
            continue

        if name == "addDashboardWidget":
            widget_type = args.get("type")
            if not isinstance(widget_type, str) or widget_type not in WIDGET_TYPES:
                continue
            payload: Dict[str, Any] = {"type": widget_type}
            title = args.get("title")
            if isinstance(title, str) and title.strip():
                payload["title"] = title.strip()
            config = sanitize_widget_config(args.get("config"))
            if config:
                payload["config"] = config
            layout = sanitize_layout(args.get("layout"))
            if layout:
                payload["layout"] = layout
            sanitized_calls.append(FunctionCall(name=name, arguments=payload))
            continue

        if name == "removeDashboardWidget":
            widget_id = args.get("id")
            if isinstance(widget_id, str) and widget_id.strip():
                sanitized_calls.append(FunctionCall(name=name, arguments={"id": widget_id.strip()}))
            continue

        if name == "updateDashboardWidget":
            widget_id = args.get("id")
            if not isinstance(widget_id, str) or not widget_id.strip():
                continue
            payload = {"id": widget_id.strip()}
            title = args.get("title")
            if isinstance(title, str) and title.strip():
                payload["title"] = title.strip()
            config = sanitize_widget_config(args.get("config"))
            if config:
                payload["config"] = config
            layout = sanitize_layout(args.get("layout"))
            if layout:
                payload["layout"] = layout
            sanitized_calls.append(FunctionCall(name=name, arguments=payload))
            continue

        if name == "generateMarketingImage":
            prompt = args.get("prompt")
            if isinstance(prompt, str) and prompt.strip():
                payload = {"prompt": prompt.strip()}
            else:
                payload = {}
            width = is_finite_number(args.get("width"))
            height = is_finite_number(args.get("height"))
            steps = is_finite_number(args.get("steps"))
            guidance = is_finite_number(args.get("guidance"))
            seed = is_finite_number(args.get("seed"))
            output_format = args.get("output_format")

            if width is not None:
                payload["width"] = int(width)
            if height is not None:
                payload["height"] = int(height)
            if steps is not None:
                payload["steps"] = int(steps)
            if guidance is not None:
                payload["guidance"] = float(guidance)
            if seed is not None:
                payload["seed"] = int(seed)
            if isinstance(output_format, str) and output_format.strip():
                payload["output_format"] = output_format.strip()

            sanitized_calls.append(FunctionCall(name=name, arguments=payload))

    return sanitized_calls


def apply_tool_governance(
    calls: List[FunctionCall],
    user_role: Optional[str]
) -> Tuple[List[FunctionCall], List[PendingAction], List[PendingAction]]:
    role = (user_role or "staff").lower()
    allowed = set(ROLE_TOOL_PERMISSIONS.get(role, ROLE_TOOL_PERMISSIONS["staff"]))

    approved: List[FunctionCall] = []
    pending: List[PendingAction] = []
    blocked: List[PendingAction] = []

    for call in calls:
        if call.name not in allowed:
            blocked.append(
                PendingAction(
                    id=f"blocked_{uuid4().hex}",
                    call=call,
                    reason=f"RBAC: {role} 不允許執行 {call.name}"
                )
            )
            continue

        if call.name in SENSITIVE_TOOLS:
            pending.append(
                PendingAction(
                    id=f"pending_{uuid4().hex}",
                    call=call,
                    reason="需人工確認後執行"
                )
            )
            continue

        approved.append(call)

    return approved, pending, blocked


STRUCTURED_SCHEMA_MAP: Dict[str, type[BaseModel]] = {
    "itinerary": ItineraryOutput,
    "proposal_comparison": ProposalComparisonOutput,
    "nps_insight": NpsInsightOutput,
}


def get_schema_json(model: type[BaseModel]) -> Dict[str, Any]:
    if hasattr(model, "model_json_schema"):
        return model.model_json_schema()  # type: ignore[return-value]
    return model.schema()  # type: ignore[return-value]


def extract_json_payload(text: str) -> str:
    text = text.strip()
    if text.startswith("{") and text.endswith("}"):
        return text
    if text.startswith("[") and text.endswith("]"):
        return text
    candidates = [text.find("{"), text.find("[")]
    start = min((idx for idx in candidates if idx != -1), default=-1)
    end_obj = text.rfind("}")
    end_arr = text.rfind("]")
    end = max(end_obj, end_arr)
    if start >= 0 and end > start:
        return text[start:end + 1]
    return text


def build_structured_prompt(base_prompt: str, schema_name: str, model: type[BaseModel]) -> str:
    schema_json = get_schema_json(model)
    schema_string = json.dumps(schema_json, ensure_ascii=False)
    return (
        f"{base_prompt}\n\n"
        "請只輸出 JSON，禁止輸出 Markdown 或額外說明文字。\n"
        f"JSON 必須符合 schema: {schema_name}\n"
        f"Schema JSON: {schema_string}\n"
        "若欄位無資料，請輸出空陣列或空字串，不要省略必填欄位。"
    )


async def generate_structured_output(
    schema_name: str,
    message: str,
    mode: str,
    context: str,
    max_attempts: int = 2
) -> StructuredOutputResponse:
    model = STRUCTURED_SCHEMA_MAP.get(schema_name)
    if model is None:
        raise HTTPException(status_code=400, detail=f"未知 schema: {schema_name}")

    base_prompt = prompt_templates.get_prompt_template(mode, rules=RULES)
    structured_prompt = build_structured_prompt(base_prompt, schema_name, model)
    final_prompt = f"""{structured_prompt}

【當前業務情境】：
{context if context else "無額外情境資訊"}
"""

    provider, selected_model, override_temperature, max_tokens, gemini_max_tokens = select_llm_for_mode(mode)
    temperature = override_temperature if override_temperature is not None else prompt_templates.get_temperature(mode)

    attempts = 0
    last_error = ""
    for _ in range(max_attempts):
        attempts += 1
        response_text, _ = await call_llm(
            system_prompt=final_prompt,
            user_message=message,
            temperature=temperature,
            provider=provider,
            model=selected_model,
            max_tokens=max_tokens,
            gemini_max_tokens=gemini_max_tokens,
            enable_tools=False,
            response_mime_type="application/json",
            response_format={"type": "json_object"},
        )
        try:
            payload_text = extract_json_payload(response_text)
            data = json.loads(payload_text)
            if hasattr(model, "model_validate"):
                parsed = model.model_validate(data)
                data = parsed.model_dump()
            else:
                parsed = model.parse_obj(data)
                data = parsed.dict()
            return StructuredOutputResponse(
                schema=schema_name,
                data=data,
                raw_text=response_text,
                attempts=attempts,
                provider=provider,
            )
        except (json.JSONDecodeError, ValidationError) as exc:
            last_error = str(exc)
            final_prompt = (
                f"{structured_prompt}\n\n"
                "上一版 JSON 驗證失敗，請只回傳修正後 JSON。\n"
                f"錯誤訊息: {last_error}\n"
                f"上一版輸出: {response_text}"
            )

    raise HTTPException(status_code=422, detail=f"Structured output 解析失敗: {last_error}")


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

    # 2. RAG 檢索法規摘要（僅法律/通用）
    rag_context, rag_sources = build_rules_context(req.mode, req.message)
    rules_context = rag_context if rag_context else RULES

    # 3. 根據模式取得專家 System Prompt
    system_prompt = prompt_templates.get_prompt_template(req.mode, rules=rules_context)

    # 4. 組合最終 Prompt
    final_prompt = f"""{system_prompt}

【當前業務情境】：
{req.context if req.context else "無額外情境資訊"}
"""

    # 5. 執行 LLM 呼叫
    try:
        provider, model, override_temperature, max_tokens, gemini_max_tokens = select_llm_for_mode(req.mode)
        final_temperature = override_temperature if override_temperature is not None else temperature
        response_text, function_calls = await call_llm(
            system_prompt=final_prompt,
            user_message=req.message,
            temperature=final_temperature,
            provider=provider,
            model=model,
            max_tokens=max_tokens,
            gemini_max_tokens=gemini_max_tokens
        )

        # 6. 解析函數呼叫（若工具呼叫為空，嘗試解析標記格式）
        clean_reply = response_text.strip()
        if not function_calls:
            clean_reply, function_calls = parse_function_calls(response_text)
        if not clean_reply:
            clean_reply = "已完成操作。"
        function_calls = sanitize_function_calls(function_calls)
        approved_calls, pending_actions, blocked_actions = apply_tool_governance(
            function_calls,
            req.user_role
        )
        function_calls = approved_calls

        # 7. 行銷模式圖片產出 (Flux Pro)
        image_url = None
        image_prompt = None
        image_args: Dict[str, Any] = {}
        filtered_calls: List[FunctionCall] = []
        for call in function_calls:
            if call.name == "generateMarketingImage":
                image_args = call.arguments or {}
                image_prompt = str(image_args.get("prompt") or "").strip()
            else:
                filtered_calls.append(call)

        if req.mode == "marketing":
            if not image_prompt:
                image_prompt = f"Travel marketing poster, {req.message}"
            if image_prompt:
                try:
                    image_result = await call_bfl_flux(
                        prompt=image_prompt,
                        width=int(image_args.get("width") or 1024),
                        height=int(image_args.get("height") or 1024),
                        steps=int(image_args.get("steps") or 30),
                        guidance=float(image_args.get("guidance") or 3.5),
                        seed=image_args.get("seed"),
                        output_format=str(image_args.get("output_format") or "png"),
                    )
                    image_url = image_result.get("image_url")
                except HTTPException as e:
                    print(f"⚠️ 圖片生成失敗: {e.detail}")

        return ChatResponse(
            reply=clean_reply,
            mode=req.mode,
            mode_description=prompt_templates.get_mode_description(req.mode),
            function_calls=filtered_calls if filtered_calls else None,
            image_url=image_url,
            image_prompt=image_prompt,
            rag_sources=rag_sources if rag_sources else None,
            pending_actions=pending_actions if pending_actions else None,
            blocked_actions=blocked_actions if blocked_actions else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"AI 服務異常: {str(e)}"
        )


@app.post("/api/structured", response_model=StructuredOutputResponse)
async def structured_output(req: StructuredOutputRequest):
    """
    結構化輸出端點 - 強制 JSON + Pydantic 驗證
    """
    return await generate_structured_output(
        schema_name=req.schema,
        message=req.message,
        mode=req.mode,
        context=req.context,
        max_attempts=max(1, min(req.max_attempts, 4))
    )


# 開發時直接執行
if __name__ == "__main__":
    import uvicorn
    print("🚀 TrvicERP AI Copilot 啟動中...")
    print(f"📚 法規知識庫: {'已載入' if len(RULES) > 50 else '未載入'}")
    print(f"🔑 Gemini API: {'已設定' if os.getenv('GOOGLE_API_KEY') else '未設定'}")
    print(f"🔑 SiliconFlow API: {'已設定 (備用)' if os.getenv('SILICONFLOW_API_KEY') else '未設定'}")
    uvicorn.run(app, host="0.0.0.0", port=4000, reload=True)
