#!/bin/bash
# ============================================
# TrvicERP - AWS Free Tier Deployment Script
# ============================================
# Architecture: S3+CloudFront (frontend) + ECS Fargate (backend/AI)
#
# Prerequisites:
#   - AWS CLI v2 configured (aws configure)
#   - Docker installed and running
#   - Node.js 18+ (for frontend build)
#
# Usage:
#   source aws/.env.aws
#   ./aws/deploy.sh production
# ============================================

set -euo pipefail

# ─── Configuration ───
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ENVIRONMENT="${1:-staging}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
STACK_NAME="trvicerp-${ENVIRONMENT}"

echo "============================================"
echo " TrvicERP AWS Deployment (Free Tier)"
echo " Environment: ${ENVIRONMENT}"
echo " Region: ${AWS_REGION}"
echo " Account: ${AWS_ACCOUNT_ID}"
echo "============================================"

# ─── Validate required env vars ───
if [ -z "${DB_PASSWORD:-}" ]; then
  echo "ERROR: DB_PASSWORD is required"
  echo "Usage: DB_PASSWORD=xxx JWT_SECRET=xxx ./aws/deploy.sh production"
  exit 1
fi
if [ -z "${JWT_SECRET:-}" ]; then
  echo "ERROR: JWT_SECRET is required"
  exit 1
fi

# ─── Step 1: Create ECR Repositories (backend only) ───
echo ""
echo "[1/6] Creating ECR repositories..."

for repo in trvicerp-backend trvicerp-ai-server; do
  aws ecr describe-repositories --repository-names "${repo}" --region "${AWS_REGION}" 2>/dev/null || \
    aws ecr create-repository \
      --repository-name "${repo}" \
      --region "${AWS_REGION}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256
  echo "  + ${repo}"
done

# ─── Step 2: Login to ECR ───
echo ""
echo "[2/6] Authenticating with ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"
echo "  + ECR login successful"

# ─── Step 3: Build & Push Backend Docker Images ───
echo ""
echo "[3/6] Building and pushing Docker images..."

# Backend
echo "  Building backend..."
docker build -t trvicerp-backend -f backend/Dockerfile ./backend
docker tag trvicerp-backend "${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}"
docker push "${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}"
echo "  + Backend pushed"

# AI Server
echo "  Building AI server..."
docker build -t trvicerp-ai-server -f ai-server/Dockerfile ./ai-server
docker tag trvicerp-ai-server "${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}"
docker push "${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}"
echo "  + AI server pushed"

# ─── Step 4: Deploy CloudFormation Stack ───
echo ""
echo "[4/6] Deploying CloudFormation stack: ${STACK_NAME}..."

aws cloudformation deploy \
  --template-file aws/cloudformation.yml \
  --stack-name "${STACK_NAME}" \
  --parameter-overrides \
    Environment="${ENVIRONMENT}" \
    DBPassword="${DB_PASSWORD}" \
    JWTSecretKey="${JWT_SECRET}" \
    GeminiApiKey="${GEMINI_API_KEY:-}" \
    SupabaseUrl="${VITE_SUPABASE_URL:-}" \
    SupabaseAnonKey="${VITE_SUPABASE_ANON_KEY:-}" \
    BackendImage="${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}" \
    AIServerImage="${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${AWS_REGION}" \
  --no-fail-on-empty-changeset

echo "  + CloudFormation stack deployed"

# ─── Step 5: Build & Deploy Frontend to S3 ───
echo ""
echo "[5/6] Building and deploying frontend to S3..."

# Get S3 bucket name and CloudFront distribution ID from stack outputs
S3_BUCKET=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='FrontendBucketName'].OutputValue" \
  --output text --region "${AWS_REGION}")

CF_DIST_ID=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" \
  --output text --region "${AWS_REGION}")

ALB_DNS=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='ALBEndpoint'].OutputValue" \
  --output text --region "${AWS_REGION}")

# Build frontend with correct API URLs
echo "  Building frontend (npm run build)..."
VITE_API_URL="/api" \
VITE_AI_API_URL="/ai" \
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}" \
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}" \
VITE_USE_MOCK=false \
  npm run build

# Upload to S3
echo "  Uploading to S3: ${S3_BUCKET}..."
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --delete \
  --cache-control "public, max-age=31536000, immutable" \
  --exclude "index.html" \
  --exclude "*.json"

# Upload index.html and JSON with shorter cache
aws s3 cp dist/index.html "s3://${S3_BUCKET}/index.html" \
  --cache-control "public, max-age=0, must-revalidate"
aws s3 sync dist/ "s3://${S3_BUCKET}/" \
  --exclude "*" --include "*.json" \
  --cache-control "public, max-age=0, must-revalidate"

echo "  + Frontend uploaded to S3"

# Invalidate CloudFront cache
echo "  Invalidating CloudFront cache..."
aws cloudfront create-invalidation \
  --distribution-id "${CF_DIST_ID}" \
  --paths "/*" \
  --region "${AWS_REGION}" > /dev/null

echo "  + CloudFront cache invalidated"

# ─── Step 6: Show Results ───
echo ""
echo "[6/6] Deployment complete!"
echo ""

CF_URL=$(aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[?OutputKey=='CloudFrontURL'].OutputValue" \
  --output text --region "${AWS_REGION}")

echo "============================================"
echo " Deployment successful!"
echo ""
echo " Frontend:   ${CF_URL}"
echo " Backend:    ${CF_URL}/api"
echo " AI Server:  ${CF_URL}/ai"
echo " API Docs:   http://${ALB_DNS}/api/docs"
echo ""
echo " S3 Bucket:  ${S3_BUCKET}"
echo " CloudFront: ${CF_DIST_ID}"
echo "============================================"
