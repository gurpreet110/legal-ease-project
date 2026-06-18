#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  LegalEase MERN — Setup Script
# ─────────────────────────────────────────────────────────────────────────────
set -e
GREEN='\033[0;32m'; GOLD='\033[0;33m'; RED='\033[0;31m'; NC='\033[0m'

echo -e "${GOLD}"
echo "  ⚖  LegalEase — MERN Stack Setup"
echo -e "${NC}"

# ── Prerequisites ─────────────────────────────────────────────────────────────
echo -e "${GOLD}[1/4] Checking prerequisites...${NC}"
command -v node  >/dev/null 2>&1 || { echo -e "${RED}✗ Node.js not found → https://nodejs.org${NC}"; exit 1; }
command -v npm   >/dev/null 2>&1 || { echo -e "${RED}✗ npm not found${NC}"; exit 1; }

NODE_VER=$(node -v | cut -dv -f2 | cut -d. -f1)
[ "$NODE_VER" -ge 18 ] || { echo -e "${RED}✗ Node.js 18+ required (found $(node -v))${NC}"; exit 1; }
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# MongoDB check (optional — Atlas also works)
if command -v mongod >/dev/null 2>&1; then
  echo -e "${GREEN}✓ MongoDB found${NC}"
else
  echo -e "${GOLD}⚠  MongoDB not found locally — make sure MONGODB_URI points to Atlas or a running instance${NC}"
fi

# ── Backend ───────────────────────────────────────────────────────────────────
echo -e "\n${GOLD}[2/4] Installing backend dependencies...${NC}"
cd backend
npm install
[ -f .env ] || { cp .env.example .env; echo -e "${GOLD}⚠  Created backend/.env — please add your ANTHROPIC_API_KEY${NC}"; }
cd ..
echo -e "${GREEN}✓ Backend ready${NC}"

# ── Frontend ──────────────────────────────────────────────────────────────────
echo -e "\n${GOLD}[3/4] Installing frontend dependencies...${NC}"
cd frontend
npm install
[ -f .env.local ] || cp .env.example .env.local
cd ..
echo -e "${GREEN}✓ Frontend ready${NC}"

# ── Done ──────────────────────────────────────────────────────────────────────
echo -e "\n${GOLD}[4/4] Setup complete!${NC}\n"
echo -e "  Edit ${GOLD}backend/.env${NC} and set your ANTHROPIC_API_KEY\n"
echo -e "  Then start with:"
echo -e "    ${GREEN}./scripts/run.sh${NC}           — run both servers"
echo -e "    ${GREEN}docker-compose -f docker/docker-compose.yml up --build${NC}  — Docker\n"
echo -e "  Open → ${GREEN}http://localhost:5173${NC}"
echo -e "  API  → ${GREEN}http://localhost:5000${NC}\n"
