#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
IMAGE_NAME="asgm-antd"
IMAGE_TAG="${1:-latest}"
CONTAINER_NAME="asgm-antd-web"

echo -e "${YELLOW}Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}${NC}"
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .

echo -e "${YELLOW}Stopping old container...${NC}"
docker-compose down || true

echo -e "${YELLOW}Starting new container...${NC}"
docker-compose up -d

echo -e "${YELLOW}Waiting for container to be healthy...${NC}"
sleep 5

# Check if container is running
if docker ps | grep -q ${CONTAINER_NAME}; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo -e "${GREEN}Application is running at http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Deployment failed!${NC}"
    echo -e "${RED}Check logs with: docker-compose logs${NC}"
    exit 1
fi

# Show logs
echo -e "${YELLOW}Recent logs:${NC}"
docker-compose logs --tail=20
