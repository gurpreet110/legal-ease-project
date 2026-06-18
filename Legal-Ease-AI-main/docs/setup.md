# LegalEase MERN — Setup Guide

## Stack
| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js 20 + Express 4 |
| Database | MongoDB 7 (Mongoose ODM) |
| AI | Claude Sonnet via Anthropic SDK |
| PDF Export | PDFKit |
| File Parsing | pdf-parse, mammoth, Tesseract.js (OCR) |

---

## Quick Start

```bash
git clone https://github.com/yourusername/legal-ease.git
cd legal-ease
chmod +x scripts/setup.sh && ./scripts/setup.sh

# Add your key:
nano backend/.env   # set ANTHROPIC_API_KEY

./scripts/run.sh
```
Open http://localhost:5173

---

## Manual Setup

### Backend
```bash
cd backend
npm install
cp .env.example .env    # fill in ANTHROPIC_API_KEY + MONGODB_URI
npm run dev             # starts on :5000
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev             # starts on :5173
```

---

## Docker

```bash
# Set env vars
echo "ANTHROPIC_API_KEY=sk-ant-..." > .env
echo "JWT_SECRET=$(node -e 'console.log(require(\"crypto\").randomBytes(32).toString(\"hex\"))')" >> .env

docker-compose -f docker/docker-compose.yml up --build
```

Services:
- Frontend: http://localhost:5173
- Backend:  http://localhost:5000
- MongoDB:  localhost:27017

---

## Environment Variables

### `backend/.env`
| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | ✅ | Claude API key from console.anthropic.com |
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `PORT` | No (5000) | Server port |
| `JWT_SECRET` | No | Secret for JWT signing |
| `MAX_FILE_SIZE_MB` | No (10) | Max upload size |
| `NODE_ENV` | No | `development` or `production` |
| `CLAUDE_MODEL` | No | Default: `claude-sonnet-4-20250514` |

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/upload` | Upload contract file |
| POST | `/api/analyze/:contractId` | Run AI analysis |
| GET  | `/api/analyze/:analysisId` | Fetch saved analysis |
| POST | `/api/chat/:contractId` | Chat Q&A |
| POST | `/api/compare` | Diff two contracts |
| GET  | `/api/report/:analysisId` | Download PDF report |
| GET  | `/api/dashboard/stats` | Aggregate stats |

---

## MongoDB Atlas Setup (Cloud)

1. Create free cluster at https://cloud.mongodb.com
2. Add your IP to Network Access
3. Create a database user
4. Copy connection string → `MONGODB_URI` in `.env`

```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/legalease
```
