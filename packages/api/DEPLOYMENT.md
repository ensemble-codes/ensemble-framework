# Ensemble API Deployment Guide

This guide covers deploying the Ensemble API service to AWS App Runner and other container platforms.

## Prerequisites

- Docker installed locally
- AWS CLI configured (for App Runner deployment)
- Access to required environment variables

## Local Development

### Using Docker

```bash
# Build the Docker image
docker build -t ensemble-api .

# Run with environment file
docker run -p 3000:3000 --env-file .env.local ensemble-api

# Run with individual environment variables
docker run -p 3000:3000 \
  -e NODE_ENV=development \
  -e PORT=3000 \
  -e NETWORK_RPC_URL=your-rpc-url \
  -e AGENT_REGISTRY_ADDRESS=0xDbF645cC23066cc364C4Db915c78135eE52f11B2 \
  -e SERVICE_REGISTRY_ADDRESS=0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244 \
  -e TASK_REGISTRY_ADDRESS=0x847fA49b999489fD2780fe2843A7b1608106b49b \
  -e ENSEMBLE_SUBGRAPH_URL=your-subgraph-url \
  ensemble-api
```

### Test the Container

```bash
# Health check
curl http://localhost:3000/health

# API documentation
open http://localhost:3000/docs

# Test agent endpoint
curl http://localhost:3000/api/v1/agents
```

## AWS App Runner Deployment

### Method 1: Using AWS Console (Recommended)

1. **Prepare Your Repository**
   ```bash
   # Ensure your code is pushed to GitHub/GitLab
   git add .
   git commit -m "Add API deployment configuration"
   git push origin main
   ```

2. **Create App Runner Service**
   - Go to AWS App Runner Console
   - Click "Create service"
   - **Source**: Connect to GitHub/GitLab repository
   - **Repository**: Select your ensemble-framework repository
   - **Branch**: main
   - **Source directory**: `packages/api`

3. **Configure Build**
   - **Configuration file**: Use configuration file (apprunner.yaml)
   - The apprunner.yaml file will handle the Docker build

4. **Configure Service**
   - **Service name**: ensemble-api-production
   - **CPU & Memory**: 1 vCPU, 2 GB (adjust as needed)
   - **Auto scaling**: 1-10 instances
   - **Health check**: `/health`

5. **Set Environment Variables**
   Add these in the App Runner console (Security & Configuration):
   ```
   JWT_SECRET=your-secure-jwt-secret-256-bits
   NETWORK_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_ALCHEMY_KEY
   ```

6. **Deploy**
   - Review settings and click "Create & deploy"
   - Wait for deployment to complete (5-10 minutes)

### Method 2: Using AWS CLI

```bash
# Create apprunner.json configuration
cat > apprunner-config.json << 'EOF'
{
  "ServiceName": "ensemble-api-production",
  "SourceConfiguration": {
    "CodeRepository": {
      "RepositoryUrl": "https://github.com/your-org/ensemble-framework",
      "SourceCodeVersion": {
        "Type": "BRANCH",
        "Value": "main"
      },
      "CodeConfiguration": {
        "ConfigurationSource": "REPOSITORY",
        "CodeConfigurationValues": {
          "Runtime": "DOCKER",
          "BuildCommand": "echo 'Building in Dockerfile'",
          "StartCommand": "node dist/index.js",
          "RuntimeEnvironmentVariables": {
            "NODE_ENV": "production",
            "PORT": "3000",
            "AGENT_REGISTRY_ADDRESS": "0xDbF645cC23066cc364C4Db915c78135eE52f11B2",
            "SERVICE_REGISTRY_ADDRESS": "0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244",
            "TASK_REGISTRY_ADDRESS": "0x847fA49b999489fD2780fe2843A7b1608106b49b",
            "ENSEMBLE_SUBGRAPH_URL": "https://api.goldsky.com/api/public/project_cmcnps2k01akp01uobifl4bby/subgraphs/ensemble-subgraph/0.0.5/gn"
          }
        }
      }
    }
  },
  "InstanceConfiguration": {
    "Cpu": "1 vCPU",
    "Memory": "2 GB"
  },
  "AutoScalingConfigurationArn": "arn:aws:apprunner:region:account:autoscalingconfiguration/DefaultConfiguration/1/00000000000000000000000000000001"
}
EOF

# Create the service
aws apprunner create-service --cli-input-json file://apprunner-config.json

# Set sensitive environment variables separately
aws apprunner update-service --service-arn <your-service-arn> \
  --source-configuration '{
    "CodeRepository": {
      "CodeConfiguration": {
        "CodeConfigurationValues": {
          "RuntimeEnvironmentVariables": {
            "JWT_SECRET": "your-secure-jwt-secret",
            "NETWORK_RPC_URL": "your-rpc-url"
          }
        }
      }
    }
  }'
```

## Other Container Platforms

### Google Cloud Run

```bash
# Build and push to Google Container Registry
docker build -t gcr.io/PROJECT_ID/ensemble-api .
docker push gcr.io/PROJECT_ID/ensemble-api

# Deploy to Cloud Run
gcloud run deploy ensemble-api \
  --image gcr.io/PROJECT_ID/ensemble-api \
  --platform managed \
  --region us-central1 \
  --set-env-vars NODE_ENV=production,PORT=3000 \
  --set-env-vars AGENT_REGISTRY_ADDRESS=0xDbF645cC23066cc364C4Db915c78135eE52f11B2 \
  --allow-unauthenticated
```

### Azure Container Instances

```bash
# Create resource group
az group create --name ensemble-api --location eastus

# Deploy container
az container create \
  --resource-group ensemble-api \
  --name ensemble-api \
  --image your-registry/ensemble-api \
  --dns-name-label ensemble-api \
  --ports 3000 \
  --environment-variables NODE_ENV=production PORT=3000 \
  --secure-environment-variables JWT_SECRET=your-secret NETWORK_RPC_URL=your-rpc
```

### DigitalOcean App Platform

Create `digitalocean-app.yaml`:

```yaml
name: ensemble-api
services:
- name: api
  source_dir: /packages/api
  github:
    repo: your-org/ensemble-framework
    branch: main
  run_command: node dist/index.js
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  dockerfile_path: packages/api/Dockerfile
  envs:
  - key: NODE_ENV
    value: production
  - key: PORT
    value: "3000"
  - key: AGENT_REGISTRY_ADDRESS
    value: "0xDbF645cC23066cc364C4Db915c78135eE52f11B2"
  - key: JWT_SECRET
    value: your-secret
    type: SECRET
  - key: NETWORK_RPC_URL
    value: your-rpc-url
    type: SECRET
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |
| `NETWORK_RPC_URL` | Blockchain RPC endpoint | `https://base-sepolia.g.alchemy.com/v2/key` |
| `AGENT_REGISTRY_ADDRESS` | Agent registry contract | `0xDbF645cC23066cc364C4Db915c78135eE52f11B2` |
| `SERVICE_REGISTRY_ADDRESS` | Service registry contract | `0x3Acbf1Ca047a18bE88E7160738A9B0bB64203244` |
| `TASK_REGISTRY_ADDRESS` | Task registry contract | `0x847fA49b999489fD2780fe2843A7b1608106b49b` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret | Generated |
| `ENSEMBLE_SUBGRAPH_URL` | Subgraph endpoint | Default subgraph |

### Security Best Practices

1. **Never commit secrets to git**
2. **Use strong JWT secrets** (256-bit minimum)
3. **Use secure RPC endpoints** with API keys
4. **Enable HTTPS** in production
5. **Monitor API usage** and set up alerts

## Health Monitoring

### Health Check Endpoint

```bash
# Check service health
curl https://your-api-url/health

# Expected response
{
  "status": "ok",
  "timestamp": "2025-01-27T...",
  "version": "0.1.0"
}
```

### Monitoring Setup

1. **AWS CloudWatch** (for App Runner)
   - Automatic metrics collection
   - Set up alarms for CPU/Memory usage
   - Monitor request latency and error rates

2. **Custom Metrics**
   ```bash
   # API endpoint metrics
   curl https://your-api-url/api/v1/agents | jq '.length'
   
   # Response time check
   time curl https://your-api-url/health
   ```

## Scaling Configuration

### App Runner Auto Scaling

```json
{
  "MaxConcurrency": 100,
  "MaxSize": 10,
  "MinSize": 1
}
```

### Performance Tuning

1. **Memory**: Start with 2GB, scale based on usage
2. **CPU**: 1 vCPU sufficient for most workloads
3. **Concurrency**: 100 concurrent requests per instance
4. **Cache**: Consider adding Redis for caching agent data

## Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check Docker build locally
   docker build -t ensemble-api .
   
   # Check logs
   docker run ensemble-api
   ```

2. **Environment Variable Issues**
   ```bash
   # Verify variables are set
   curl https://your-api-url/health
   ```

3. **Network Connectivity**
   ```bash
   # Test RPC connection
   curl -X POST your-rpc-url \
     -H "Content-Type: application/json" \
     -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
   ```

### Logs Access

- **App Runner**: AWS CloudWatch Logs
- **Cloud Run**: `gcloud logs read`
- **Local**: `docker logs container-id`

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Deploy to App Runner
on:
  push:
    branches: [main]
    paths: ['packages/api/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v1
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1
    
    - name: Deploy to App Runner
      run: |
        aws apprunner start-deployment --service-arn ${{ secrets.APPRUNNER_SERVICE_ARN }}
```

This deployment setup provides a production-ready API service with proper security, monitoring, and scaling capabilities.