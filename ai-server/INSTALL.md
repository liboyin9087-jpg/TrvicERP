# TrvicERP AI Server 安裝與部署指南

## 📦 安裝步驟

### 1. 基礎依賴安裝

```bash
cd /workspaces/TrvicERP/ai-server
pip install -r requirements.txt
```

這會安裝：

- ✅ FastAPI & Uvicorn（必需）
- ✅ Pydantic & python-dotenv（必需）
- ✅ httpx（必需）
- ⚠️ Redis（可選，用於快取）
- ⚠️ Qdrant & sentence-transformers（可選，用於向量檢索）

---

## 🐳 Docker 快速啟動（推薦）

### 方式 1：Docker Compose（一鍵啟動）

創建 `docker-compose.yml`：

```yaml
version: "3.8"

services:
  ai-server:
    build: .
    ports:
      - "4000:4000"
    environment:
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - REDIS_HOST=redis
      - QDRANT_HOST=qdrant
    depends_on:
      - redis
      - qdrant
    volumes:
      - .:/app

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
    volumes:
      - qdrant_data:/qdrant/storage

volumes:
  qdrant_data:
```

啟動所有服務：

```bash
docker-compose up -d
```

### 方式 2：個別啟動容器

#### Redis

```bash
docker run -d \
  --name trvic-redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### Qdrant

```bash
docker run -d \
  --name trvic-qdrant \
  -p 6333:6333 \
  -v $(pwd)/qdrant_data:/qdrant/storage \
  qdrant/qdrant:latest
```

#### AI Server

```bash
cd /workspaces/TrvicERP/ai-server
python main.py
```

---

## 🔧 本地開發設定

### 1. 僅使用 LLM（最小配置）

如果不需要快取與向量檢索，僅需：

```env
# .env
LLM_PROVIDER=gemini
GOOGLE_API_KEY=your_gemini_key
REDIS_ENABLED=false
QDRANT_ENABLED=false
```

```bash
python main.py
```

### 2. 啟用 Redis 快取

#### 安裝 Redis（macOS）

```bash
brew install redis
brew services start redis
```

#### 安裝 Redis（Ubuntu/Debian）

```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis
```

#### 配置

```env
REDIS_ENABLED=true
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. 啟用 Qdrant 向量檢索

#### 使用 Docker（推薦）

```bash
docker run -d -p 6333:6333 qdrant/qdrant
```

#### 使用 Qdrant Cloud

1. 註冊 https://cloud.qdrant.io
2. 創建 cluster
3. 配置：

```env
QDRANT_ENABLED=true
QDRANT_HOST=your-cluster.qdrant.io
QDRANT_PORT=6333
QDRANT_API_KEY=your_api_key
```

---

## 🚀 生產環境部署

### Vercel / Railway / Render 部署

#### 1. 準備 Dockerfile

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 4000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "4000"]
```

#### 2. 環境變數設定

在平台設定以下環境變數：

```
GOOGLE_API_KEY=xxx
REDIS_HOST=your-redis-host
QDRANT_HOST=your-qdrant-host
FRONTEND_URL=https://your-frontend.vercel.app
```

#### 3. 使用外部服務

**Redis Cloud**（免費 30MB）：

- https://redis.com/try-free/
- 設定 `REDIS_HOST` 與 `REDIS_PASSWORD`

**Qdrant Cloud**（免費 1GB）：

- https://cloud.qdrant.io
- 設定 `QDRANT_HOST` 與 `QDRANT_API_KEY`

---

## 📋 部署檢查清單

### 啟動前檢查

- [ ] 已安裝 Python 3.10+
- [ ] 已執行 `pip install -r requirements.txt`
- [ ] 已複製 `.env.example` 為 `.env`
- [ ] 已填入 `GOOGLE_API_KEY` 或 `SILICONFLOW_API_KEY`
- [ ] Redis 服務已啟動（若啟用）
- [ ] Qdrant 服務已啟動（若啟用）

### 啟動後驗證

```bash
# 1. 檢查服務健康狀態
curl http://localhost:4000/health

# 2. 測試聊天 API
curl -X POST http://localhost:4000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好",
    "mode": "general"
  }'

# 3. 檢查 Redis 連線（若啟用）
redis-cli ping

# 4. 檢查 Qdrant 連線（若啟用）
curl http://localhost:6333/collections
```

---

## ⚙️ 效能調優

### Redis 快取策略

**快取 TTL 調整**：

```env
# 高流量場景：延長快取時間
REDIS_CACHE_TTL=7200  # 2 小時

# 低流量場景：縮短快取時間
REDIS_CACHE_TTL=1800  # 30 分鐘
```

**快取預熱**：

```python
# 預先快取常見問題
common_questions = [
    "出發前 15 天取消要扣多少？",
    "護照效期要求？",
    "司機工時限制？"
]

for q in common_questions:
    # 發送請求，觸發快取
    requests.post("http://localhost:4000/api/chat", json={
        "message": q,
        "mode": "legal"
    })
```

### Qdrant 效能優化

**增加向量維度（提升精準度）**：

```python
# 使用更大的模型
embedding_model = SentenceTransformer('paraphrase-multilingual-mpnet-base-v2')
# 維度：384 → 768
```

**調整檢索數量**：

```env
# 預設 4 個片段
RAG_TOP_K=6  # 增加到 6 個（更全面但稍慢）
```

---

## 🐛 疑難排解

### 問題 1：Redis 連線被拒絕

**錯誤訊息**：

```
⚠️ Redis 連線失敗: Connection refused
```

**解決方法**：

```bash
# 檢查 Redis 是否運行
redis-cli ping

# 若未運行，啟動 Redis
redis-server

# 或暫時停用 Redis
echo "REDIS_ENABLED=false" >> .env
```

### 問題 2：Qdrant 初始化失敗

**錯誤訊息**：

```
⚠️ Qdrant 初始化失敗: Cannot connect to host
```

**解決方法**：

```bash
# 檢查 Qdrant 是否運行
curl http://localhost:6333/collections

# 若未運行，啟動 Qdrant
docker run -d -p 6333:6333 qdrant/qdrant

# 或暫時停用 Qdrant
echo "QDRANT_ENABLED=false" >> .env
```

### 問題 3：圖片生成一直 pending

**原因**：BFL API 回應慢或配額用盡

**解決方法**：

```bash
# 1. 檢查 API Key 是否正確
curl -H "x-key: $BFL_API_KEY" https://api.bfl.ml/v1/flux-pro

# 2. 增加超時時間
echo "IMAGE_GENERATION_TIMEOUT=120" >> .env

# 3. 切換為同步模式（調試用）
echo "IMAGE_GENERATION_ASYNC=false" >> .env
```

### 問題 4：記憶體佔用過高

**原因**：嵌入模型載入到記憶體

**解決方法**：

```env
# 暫時停用 Qdrant（使用傳統 RAG）
QDRANT_ENABLED=false

# 或使用更小的模型
# 在 main.py 修改：
# embedding_model = SentenceTransformer('all-MiniLM-L6-v2')  # 僅 80MB
```

---

## 📊 監控與日誌

### 啟用結構化日誌

在 `main.py` 加入：

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s',
    handlers=[
        logging.FileHandler('ai-server.log'),
        logging.StreamHandler()
    ]
)
```

### 監控 Redis 快取命中率

```bash
redis-cli INFO stats | grep keyspace_hits
redis-cli INFO stats | grep keyspace_misses
```

計算命中率：

```
命中率 = hits / (hits + misses) * 100%
```

### 監控 Qdrant 檢索效能

在 Qdrant Dashboard 查看：

```
http://localhost:6333/dashboard
```

---

## 🔐 安全性建議

### 1. API Key 保護

```bash
# 不要提交 .env 到 Git
echo ".env" >> .gitignore

# 使用環境變數注入（生產環境）
export GOOGLE_API_KEY="your_key"
```

### 2. CORS 限制

```env
# 僅允許特定來源
FRONTEND_URL=https://your-app.vercel.app
CORS_ORIGIN=https://admin.your-app.com
```

### 3. Redis 密碼保護

```bash
# 設定 Redis 密碼
redis-cli CONFIG SET requirepass "your_strong_password"
```

```env
REDIS_PASSWORD=your_strong_password
```

---

## 📞 支援

- **文件**：[README.md](README.md)
- **GitHub Issues**：https://github.com/liboyin9087-jpg/TrvicERP/issues
- **Email**：support@trvicerp.com

---

**最後更新**：2026-01-29
