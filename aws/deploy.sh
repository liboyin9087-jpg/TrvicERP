#!/bin/bash
# ============================================
# TrvicERP - AWS Deployment Script
# ============================================
# Prerequisites:
#   - AWS CLI v2 configured (aws configure)
#   - Docker installed and running
#   - Sufficient AWS IAM permissions
# ============================================

set -euo pipefail

# ─── Configuration ───
AWS_REGION="${AWS_REGION:-ap-northeast-1}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ENVIRONMENT="${1:-staging}"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
STACK_NAME="trvicerp-${ENVIRONMENT}"

echo "============================================"
echo " TrvicERP AWS Deployment"
echo " Environment: ${ENVIRONMENT}"
echo " Region: ${AWS_REGION}"
echo " Account: ${AWS_ACCOUNT_ID}"
echo "============================================"

# ─── Step 1: Create ECR Repositories ───
echo ""
echo "[1/5] Creating ECR repositories..."

for repo in trvicerp-frontend trvicerp-backend trvicerp-ai-server; do
  aws ecr describe-repositories --repository-names "${repo}" --region "${AWS_REGION}" 2>/dev/null || \
    aws ecr create-repository \
      --repository-name "${repo}" \
      --region "${AWS_REGION}" \
      --image-scanning-configuration scanOnPush=true \
      --encryption-configuration encryptionType=AES256
  echo "  ✓ ${repo}"
done

# ─── Step 2: Login to ECR ───
echo ""
echo "[2/5] Authenticating with ECR..."
aws ecr get-login-password --region "${AWS_REGION}" | \
  docker login --username AWS --password-stdin "${ECR_REGISTRY}"
echo "  ✓ ECR login successful"

# ─── Step 3: Build & Push Docker Images ───
echo ""
echo "[3/5] Building and pushing Docker images..."

# Frontend
echo "  Building frontend..."
docker build -t trvicerp-frontend \
  -f Dockerfile.frontend \
  --build-arg VITE_API_URL="/api" \
  --build-arg VITE_AI_API_URL="/ai" \
  --build-arg VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-}" \
  --build-arg VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-}" \
  .
docker tag trvicerp-frontend "${ECR_REGISTRY}/trvicerp-frontend:${ENVIRONMENT}"
docker push "${ECR_REGISTRY}/trvicerp-frontend:${ENVIRONMENT}"
echo "  ✓ Frontend pushed"

# Backend
echo "  Building backend..."
docker build -t trvicerp-backend -f backend/Dockerfile ./backend
docker tag trvicerp-backend "${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}"
docker push "${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}"
echo "  ✓ Backend pushed"

# AI Server
echo "  Building AI server..."
docker build -t trvicerp-ai-server -f ai-server/Dockerfile ./ai-server
docker tag trvicerp-ai-server "${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}"
docker push "${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}"
echo "  ✓ AI server pushed"

# ─── Step 4: Deploy CloudFormation Stack ───
echo ""
echo "[4/5] Deploying CloudFormation stack: ${STACK_NAME}..."

# Check if required env vars are set
if [ -z "${DB_PASSWORD:-}" ]; then
  echo "  ERROR: DB_PASSWORD environment variable is required"
  echo "  Usage: DB_PASSWORD=xxx JWT_SECRET=xxx ./aws/deploy.sh production"
  exit 1
fi

if [ -z "${JWT_SECRET:-}" ]; then
  echo "  ERROR: JWT_SECRET environment variable is required"
  exit 1
fi

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
    FrontendImage="${ECR_REGISTRY}/trvicerp-frontend:${ENVIRONMENT}" \
    BackendImage="${ECR_REGISTRY}/trvicerp-backend:${ENVIRONMENT}" \
    AIServerImage="${ECR_REGISTRY}/trvicerp-ai-server:${ENVIRONMENT}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region "${AWS_REGION}" \
  --no-fail-on-empty-changeset

echo "  ✓ CloudFormation stack deployed"

# ─── Step 5: Show Outputs ───
echo ""
echo "[5/5] Deployment complete!"
echo ""
echo "Stack outputs:"
aws cloudformation describe-stacks \
  --stack-name "${STACK_NAME}" \
  --query "Stacks[0].Outputs[*].[OutputKey,OutputValue]" \
  --output table \
  --region "${AWS_REGION}"

echo ""
echo "============================================"
echo " Deployment successful!"
echo " Run 'aws cloudformation describe-stacks --stack-name ${STACK_NAME}'"
echo " to view all output values."
echo "============================================"
