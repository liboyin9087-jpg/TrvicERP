# TrvicERP - AWS 部署指南

## 架構概覽

```
                    ┌──────────────┐
                    │  CloudFront  │  (可選 CDN)
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
        ┌──────────│     ALB      │──────────┐
        │          └──────┬───────┘          │
        │                 │                  │
   ┌────▼─────┐    ┌─────▼──────┐    ┌─────▼──────┐
   │ Frontend  │    │  Backend   │    │ AI Server  │
   │ (Nginx)   │    │ (FastAPI)  │    │ (FastAPI)  │
   │ Port 80   │    │ Port 4000  │    │ Port 4001  │
   └───────────┘    └─────┬──────┘    └──┬────┬────┘
                          │              │    │
                    ┌─────▼──────┐  ┌───▼──┐ ┌▼────────┐
                    │ RDS        │  │Redis │ │ Qdrant   │
                    │ PostgreSQL │  │Cache │ │ (可選)   │
                    └────────────┘  └──────┘ └─────────┘
```

## AWS 服務對照

| 元件 | AWS 服務 | 規格 | 月估費 (USD) |
|------|---------|------|-------------|
| Frontend | ECS Fargate | 0.25 vCPU / 512MB × 2 | ~$18 |
| Backend | ECS Fargate | 0.5 vCPU / 1GB × 2 | ~$36 |
| AI Server | ECS Fargate | 0.5 vCPU / 1GB × 1 | ~$18 |
| Database | RDS PostgreSQL | db.t3.micro (20GB) | ~$15 |
| Cache | ElastiCache Redis | cache.t3.micro | ~$12 |
| Load Balancer | ALB | 1 ALB | ~$22 |
| NAT Gateway | NAT Gateway | 1 NAT | ~$32 |
| Logs | CloudWatch | 30 天保留 | ~$5 |
| **合計** | | | **~$158/月** |

> 首年可用 AWS Free Tier 降低至約 $80/月

## 快速部署

### 前置條件

1. AWS CLI v2 已設定 (`aws configure`)
2. Docker 已安裝並執行
3. IAM 帳號具有 ECS, ECR, RDS, ElastiCache, CloudFormation, IAM 權限

### 一鍵部署

```bash
# 1. 設定環境變數
cp aws/.env.aws.example aws/.env.aws
# 編輯 aws/.env.aws 填入你的密鑰

# 2. 載入變數並部署
source aws/.env.aws
chmod +x aws/deploy.sh
./aws/deploy.sh production
```

### 手動部署步驟

```bash
# Step 1: 建立 ECR 倉庫
aws ecr create-repository --repository-name trvicerp-frontend
aws ecr create-repository --repository-name trvicerp-backend
aws ecr create-repository --repository-name trvicerp-ai-server

# Step 2: 登入 ECR
aws ecr get-login-password --region ap-northeast-1 | \
  docker login --username AWS --password-stdin \
  <ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com

# Step 3: 建構映像
docker build -t trvicerp-frontend -f Dockerfile.frontend .
docker build -t trvicerp-backend -f backend/Dockerfile ./backend
docker build -t trvicerp-ai-server -f ai-server/Dockerfile ./ai-server

# Step 4: 推送映像
ECR=<ACCOUNT_ID>.dkr.ecr.ap-northeast-1.amazonaws.com
docker tag trvicerp-frontend $ECR/trvicerp-frontend:production
docker push $ECR/trvicerp-frontend:production
# (重複 backend 和 ai-server)

# Step 5: 部署 CloudFormation
aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name trvicerp-production \
  --parameter-overrides \
    Environment=production \
    DBPassword=<password> \
    JWTSecretKey=<jwt-secret> \
    FrontendImage=$ECR/trvicerp-frontend:production \
    BackendImage=$ECR/trvicerp-backend:production \
    AIServerImage=$ECR/trvicerp-ai-server:production \
  --capabilities CAPABILITY_NAMED_IAM
```

## GitHub Actions CI/CD

### 設定 GitHub Secrets

在 GitHub Repository Settings > Secrets > Actions 中新增：

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
4. 點擊 "Run workflow" 確認

## 本機測試 (Docker Compose)

```bash
# 啟動所有服務
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

ALB 使用 path-based routing：

| 路徑 | 目標 |
|------|------|
| `/*` (預設) | Frontend (port 80) |
| `/api/*` | Backend (port 4000) |
| `/ai/*` | AI Server (port 4001) |

## 自動擴縮

Backend 服務啟用 Auto Scaling：
- 最小實例: 2
- 最大實例: 6
- 目標 CPU 使用率: 70%
- 縮容冷卻: 5 分鐘
- 擴容冷卻: 1 分鐘

## 監控

```bash
# 查看 ECS 服務狀態
aws ecs describe-services \
  --cluster trvicerp-production \
  --services trvicerp-production-backend

# 查看 CloudWatch 日誌
aws logs tail /ecs/trvicerp-production/backend --follow

# 查看 RDS 狀態
aws rds describe-db-instances \
  --db-instance-identifier trvicerp-production
```

## 安全建議

1. **生產環境必須啟用 HTTPS** — 在 ALB 加上 ACM 憑證
2. **使用 AWS Secrets Manager** 管理 API Key 和密碼
3. **啟用 RDS 加密** — 已在 CloudFormation 中設定
4. **設定 WAF** 保護 ALB 免受 DDoS 和 SQL Injection
5. **啟用 VPC Flow Logs** 監控網路流量
6. **定期更新 Docker base images** 修補安全漏洞

## 清理資源

```bash
# 刪除 CloudFormation stack (保留 RDS 快照)
aws cloudformation delete-stack --stack-name trvicerp-staging

# 刪除 ECR 映像
aws ecr batch-delete-image \
  --repository-name trvicerp-frontend \
  --image-ids imageTag=staging
```
