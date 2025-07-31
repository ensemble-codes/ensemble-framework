#!/bin/bash

# Build and push Docker image to AWS ECR for AppRunner deployment
# Usage: ./scripts/build-and-push-ecr.sh [region] [ecr-repository-name]

set -e

# Configuration
AWS_REGION=${1:-us-east-1}
ECR_REPOSITORY_NAME=${2:-ensemble-api}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
IMAGE_TAG=${IMAGE_TAG:-latest}

# Additional tags
COMMIT_SHA=$(git rev-parse --short HEAD)
DATE_TAG=$(date +%Y%m%d-%H%M%S)

echo "Starting ECR build and push process..."
echo "Region: ${AWS_REGION}"
echo "Repository: ${ECR_REPOSITORY_NAME}"
echo "Registry: ${ECR_REGISTRY}"

# Authenticate Docker to ECR
echo "Authenticating Docker to ECR..."
aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${ECR_REGISTRY}

# Create ECR repository if it doesn't exist
echo "Ensuring ECR repository exists..."
aws ecr describe-repositories --repository-names ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} 2>/dev/null || \
    aws ecr create-repository --repository-name ${ECR_REPOSITORY_NAME} --region ${AWS_REGION} --image-scanning-configuration scanOnPush=true

# Prepare build context
echo "Preparing build context..."
cd ..
# cp ../pnpm-lock.yaml api/

# Build Docker image
echo "Building Docker image..."
docker build -t ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} -f api/Dockerfile api

# Clean up
rm api/pnpm-lock.yaml

# Tag the image for ECR
echo "Tagging image for ECR..."
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${IMAGE_TAG}
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${COMMIT_SHA}
docker tag ${ECR_REPOSITORY_NAME}:${IMAGE_TAG} ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${DATE_TAG}

# Push images to ECR
echo "Pushing images to ECR..."
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${IMAGE_TAG}
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${COMMIT_SHA}
docker push ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${DATE_TAG}

# Output the image URI for AppRunner
echo ""
echo "Successfully pushed Docker image to ECR!"
echo "Image URIs:"
echo "  Latest: ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${IMAGE_TAG}"
echo "  Commit: ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${COMMIT_SHA}"
echo "  Date: ${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${DATE_TAG}"
echo ""
echo "Use this image URI in your AppRunner configuration:"
echo "${ECR_REGISTRY}/${ECR_REPOSITORY_NAME}:${IMAGE_TAG}"