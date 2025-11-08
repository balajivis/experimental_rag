#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting RAG Application Services${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker is not installed!${NC}"
    echo -e "${YELLOW}Please install Docker Desktop from: https://www.docker.com/products/docker-desktop/${NC}"
    exit 1
fi

# Check if Docker daemon is running
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker is not running!${NC}"
    echo -e "${YELLOW}Please start Docker Desktop${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}\n"

# Start Docker services
echo -e "${YELLOW}📦 Starting Postgres and ChromaDB...${NC}"
docker compose up -d

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if services are running
if docker compose ps | grep -q "running"; then
    echo -e "${GREEN}✅ Database services are running${NC}\n"

    # Show service status
    echo -e "${YELLOW}📊 Service Status:${NC}"
    docker compose ps

    echo -e "\n${GREEN}✅ Services started successfully!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo -e "1. cd backend"
    echo -e "2. npx prisma migrate dev --name init"
    echo -e "3. npm run dev"
    echo -e "\n${YELLOW}Access points:${NC}"
    echo -e "- Backend API: http://localhost:3001"
    echo -e "- Postgres: localhost:5432"
    echo -e "- ChromaDB: http://localhost:8000"
else
    echo -e "${RED}❌ Failed to start services${NC}"
    echo -e "${YELLOW}Run 'docker compose logs' to see what went wrong${NC}"
    exit 1
fi
