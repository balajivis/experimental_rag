#!/bin/bash

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🛑 Stopping RAG Application Services...${NC}\n"

docker compose down

echo -e "${GREEN}✅ Services stopped${NC}"
echo -e "\n${YELLOW}To remove all data (reset database):${NC}"
echo -e "docker compose down -v"
