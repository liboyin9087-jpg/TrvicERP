# TrvicERP - AWS 部署指南

## Free Tier 最佳化架構

```
        使用者
          │
          ▼
   ┌──────────────┐
   │  CloudFront  │  ← Free Tier: 1TB/月 + HTTPS
   │  (CDN+HTTPS) │
   └──┬────┬───┬──┘
      │    │   │
 /*.html  /api/* /ai/*
      │    │   │
      ▼    ▼   ▼
   ┌────┐ ┌────────────────────────┐
   │ S3 │ │          ALB           │
   │    │ │  (path-based routing)  │
   └────┘ └────┬──────────┬────────┘
               │          │
         ┌─────▼──────┐ ┌─▼──────────┐
         │  Backend   │ │ AI Server  │
         │  (Fargate) │ │ (Fargate)  │
         │ 0.25vCPU   │ │ 0.25vCPU   │
         └─────┬──────┘ └────────────┘
               │
         ┌─────▼──────┐
         │    RDS      │  ← Free Tier: 750hr/月
         │ PostgreSQL  │
         │ db.t3.micro │
         └────────────┘
```

## 方案比較：原始版 vs Free Tier 版

### 價格對照表

| 元件 | 原始方案 | Free Tier 方案 | 差異 |
|------|---------|---------------|------|
| **前端** | ECS Fargate ×2 (Nginx) | **S3 + CloudFront** | 省 $18/月 |
| | 0.25 vCPU / 512MB | Free Tier: 1TB 傳輸 | 靜態檔更快 |
| **後端** | ECS Fargate ×2 | ECS Fargate **×1** | 省 $18/月 |
| | 0.5 vCPU / 1GB | **0.25 vCPU / 512MB** | 降規格 |
| **AI Server** | ECS Fargate ×1 | ECS Fargate ×1 | - |
| | 0.5 vCPU / 1GB | **0.25 vCPU / 512MB** | 省 $9/月 |
| **資料庫** | RDS db.t3.micro | RDS db.t3.micro | 同 (Free Tier 免費) |
| **快取** | ElastiCache Redis | **移除 (in-memory)** | 省 $12/月 |
| **網路** | NAT Gateway | **移除 (public subnet)** | 省 $32/月 |
| **日誌** | CloudWatch 30天 | CloudWatch **7天** | 省 ~$3/月 |
| **Container Insights** | 開啟 | **關閉** | 省 ~$5/月 |
| **Auto Scaling** | min 2 / max 6 | **固定 1** | 省運算費 |
| **HTTPS** | 需自行配 ACM | **CloudFront 內建** | 免費 HTTPS |

### 月費總覽

| | 原始方案 | Free Tier 方案 |
|---|---------|---------------|
| **首年月費** | ~$158 | **~$15-25** |
| **首年後月費** | ~$158 | ~$55-70 |

### 重要差異說明

#### 1. 前端：ECS Nginx → S3 + CloudFront
- **原始**: 用 Docker 跑 Nginx 服務靜態檔案，需 ECS 運算資源
- **Free Tier**: 靜態檔案直接放 S3，透過 CloudFront CDN 分發
- **好處**: 更快 (全球邊緣節點)、更便宜、自動 HTTPS、無需管容器
- **限制**: 無法執行伺服器端邏輯 (但 React SPA 不需要)

#### 2. 網路：NAT Gateway 移除
- **原始**: ECS 在 private subnet，需 NAT Gateway 出外網 ($32/月固定費)
- **Free Tier**: ECS 在 public subnet，直接分配 public IP
- **影響**: 安全性略降 (ECS 有公開 IP)，但有 Security Group 保護
- **RDS 仍在 private subnet**，不受影響

#### 3. 快取：ElastiCache → In-memory
- **原始**: 獨立 Redis 實例，支援多節點共享快取
- **Free Tier**: AI Server 內部 dict 快取，重啟後清空
- **影響**: 快取命中率不變 (單實例)，但重新部署後需重建快取
- **未來升級**: 可隨時加回 ElastiCache

#### 4. 高可用性
- **原始**: Backend ×2，跨 AZ 部署，Auto Scaling
- **Free Tier**: Backend ×1，單實例
- **影響**: 部署時有短暫中斷 (~30秒)，無自動擴縮
- **適合**: 初期用戶量小的階段

---

## 快速部署 (Free Tier)

### 前置條件

1. AWS CLI v2 已設定 (`aws configure`)
2. Docker 已安裝並執行
3. Node.js 18+ (用於建構前端)

### 一鍵部署

```bash
# 1. 設定環境變數
cp aws/.env.aws.example aws/.env.aws
# 編輯 aws/.env.aws 填入密鑰

# 2. 載入變數並部署
source aws/.env.aws
chmod +x aws/deploy.sh
./aws/deploy.sh production
```

### 手動部署步驟

```bash
# Step 1: 建立 ECR 倉庫 (僅後端，前端用 S3)
aws ecr create-repository --repository-name trvicerp-backend
aws ecr create-repository --repository-name trvicerp-ai-server

# Step 2: 建構前端並上傳 S3
npm run build
aws s3 sync dist/ s3://trvicerp-production-frontend-<ACCOUNT_ID>/ --delete

# Step 3: 使 CloudFront 快取失效
aws cloudfront create-invalidation \
  --distribution-id <DIST_ID> \
  --paths "/*"

# Step 4: 建構並推送後端映像
ECR=<ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com
aws ecr get-login-password | docker login --username AWS --password-stdin $ECR

docker build -t trvicerp-backend -f backend/Dockerfile ./backend
docker tag trvicerp-backend $ECR/trvicerp-backend:production
docker push $ECR/trvicerp-backend:production

docker build -t trvicerp-ai-server -f ai-server/Dockerfile ./ai-server
docker tag trvicerp-ai-server $ECR/trvicerp-ai-server:production
docker push $ECR/trvicerp-ai-server:production

# Step 5: 部署 CloudFormation
aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name trvicerp-production \
  --parameter-overrides \
    Environment=production \
    DBPassword=<password> \
    JWTSecretKey=<jwt-secret> \
    BackendImage=$ECR/trvicerp-backend:production \
    AIServerImage=$ECR/trvicerp-ai-server:production \
  --capabilities CAPABILITY_NAMED_IAM
```

## GitHub Actions CI/CD

### 設定 GitHub Secrets

| Secret 名稱 | 說明 |
|-------------|------|
| `AWS_ROLE_ARN` | AWS IAM Role ARN (OIDC) |
| `DB_PASSWORD` | PostgreSQL 密碼 |
| `JWT_SECRET_KEY` | JWT 簽名金鑰 |
| `GEMINI_API_KEY` | Google Gemini API Key |
| `VITE_SUPABASE_URL` | Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Anon Key |

### 觸發部署

1. 前往 GitHub > Actions > "Deploy to AWS"
2. 點擊 "Run workflow"
3. 選擇環境 (staging / production)

## 本機測試 (Docker Compose)

```bash
# 啟動所有服務 (含 PostgreSQL, Redis, Qdrant)
docker compose up -d

# 查看狀態
docker compose ps

# 查看日誌
docker compose logs -f backend

# 停止
docker compose down
```

存取：
- 前端: http://localhost
- 後端 API: http://localhost:4000
- AI Server: http://localhost:4001

## 路由規則

CloudFront + ALB path-based routing：

| 路徑 | 目標 | 說明 |
|------|------|------|
| `/*` (預設) | S3 Bucket | 前端靜態檔案 |
| `/api/*` | ALB → Backend (4000) | REST API |
| `/ai/*` | ALB → AI Server (4001) | AI Copilot API |

## 監控

```bash
# 查看 ECS 服務狀態
aws ecs describe-services \
  --cluster trvicerp-production \
  --services trvicerp-production-backend

# 查看 CloudWatch 日誌
aws logs tail /ecs/trvicerp-production/backend --follow

# 查看 S3 前端檔案
aws s3 ls s3://trvicerp-production-frontend-<ACCOUNT_ID>/

# 查看 CloudFront 統計
aws cloudfront get-distribution --id <DIST_ID>
```

## 安全建議

1. **HTTPS 已內建** — CloudFront 自動提供 HTTPS
2. **使用 AWS Secrets Manager** 管理 API Key 和密碼
3. **RDS 加密已啟用** — CloudFormation 中設定
4. **S3 Bucket 完全私有** — 僅 CloudFront OAC 可存取
5. **定期更新 Docker base images** 修補安全漏洞

## 升級路徑 (Free Tier → 正式生產)

當用戶量增長時，逐步升級：

```
Phase 1 (現在): Free Tier ~$15-25/月
  → 適合 1-10 同時在線用戶

Phase 2: 加回 Auto Scaling ~$40-50/月
  → Backend min=2, max=4
  → 適合 10-50 同時在線用戶

Phase 3: 完整生產 ~$100-150/月
  → 加回 ElastiCache Redis
  → 加回 NAT Gateway (private subnet)
  → RDS 升級 db.t3.small
  → 適合 50-200 同時在線用戶
```

## 清理資源

```bash
# 清空 S3 bucket (必須先清空才能刪除)
aws s3 rm s3://trvicerp-staging-frontend-<ACCOUNT_ID>/ --recursive

# 刪除 CloudFormation stack
aws cloudformation delete-stack --stack-name trvicerp-staging

# 刪除 ECR 映像
aws ecr batch-delete-image \
  --repository-name trvicerp-backend \
  --image-ids imageTag=staging
```
