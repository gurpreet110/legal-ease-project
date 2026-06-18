#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
#  LegalEase MERN — Start backend + frontend in parallel
# ─────────────────────────────────────────────────────────────────────────────
GOLD='\033[0;33m'; GREEN='\033[0;32m'; NC='\033[0m'

echo -e "${GOLD}⚖  Starting LegalEase MERN...${NC}\n"

(cd backend  && echo -e "${GREEN}→ Backend  → http://localhost:5000${NC}" && npm run dev) &
BACK=$!

(cd frontend && echo -e "${GREEN}→ Frontend → http://localhost:5173${NC}" && npm run dev) &
FRONT=$!

echo -e "\n${GOLD}Press Ctrl+C to stop both servers.${NC}\n"
trap "kill $BACK $FRONT 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait
