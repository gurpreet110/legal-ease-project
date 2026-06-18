# ⚖️ LegalEase — AI-Powered Contract Intelligence

<div align="center">

![LegalEase](https://img.shields.io/badge/LegalEase-AI%20Contract%20Analysis-C9A84C?style=for-the-badge)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Express](https://img.shields.io/badge/Express-4.18-000000?style=flat-square&logo=express)](https://expressjs.com)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat-square&logo=node.js)](https://nodejs.org)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204-C9A84C?style=flat-square)](https://anthropic.com)

**Read contracts like a lawyer — in seconds.**

[🚀 Live Demo](#) · [📖 Docs](docs/setup.md) · [🐛 Issues](issues)

</div>

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🟢 | **Contract Upload** | PDF, TXT, DOCX — OCR for scanned docs |
| 🟢 | **AI Summarization** | Plain-English summary via Claude |
| 🟢 | **Multi-Language** | English · हिंदी · தமிழ் |
| 🟢 | **Risk Detection** | Identify unfair / one-sided clauses |
| 🟢 | **Severity Scoring** | LOW / MEDIUM / HIGH per clause |
| 🟢 | **Clause Explanation** | "What it means for you" |
| 🟡 | **Clause Highlighting** | Clickable highlights + side panel |
| 🟡 | **AI Chatbot** | Context-aware Q&A (Claude API) |
| 🟡 | **Clause Categories** | Payment · IP · Termination · Liability |
| 🟡 | **Health Score** | 0–100 contract safety score |
| 🟡 | **PDF Report** | Downloadable analysis report |
| 🔵 | **Contract Comparison** | Diff two versions side-by-side |
| 🔵 | **Dashboard Analytics** | Risk charts, clause breakdown |
| 🔵 | **Safer Suggestions** | AI-rewritten clause alternatives |

---

## 🏗️ Stack

```
┌─────────────────────────────────┐
│   React 18 + Vite (Frontend)    │
└──────────────┬──────────────────┘
               │ REST API
┌──────────────▼──────────────────┐
│   Express.js + Node.js          │
│   (Backend API)                 │
└──────────────┬──────────────────┘
               │
    ┌──────────┴──────────┐
    ▼                     ▼
┌────────┐        ┌──────────────┐
│MongoDB │        │ Claude API   │
│(Atlas) │        │ (Anthropic)  │
└────────┘        └──────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- MongoDB (local or [Atlas](https://cloud.mongodb.com))
- [Anthropic API Key](https://console.anthropic.com)

### 1. Clone
```bash
git clone https://github.com/yourusername/legal-ease.git
cd legal-ease
```

### 2. Setup & Run (Automated)
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### 3. Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Open → http://localhost:5173

### Docker
```bash
cp backend/.env.example backend/.env   # add keys
docker-compose -f docker/docker-compose.yml up --build
```

---

## 🔧 Environment Variables

### `backend/.env`
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/legalease
ANTHROPIC_API_KEY=sk-ant-your-key-here
JWT_SECRET=change-me-random-secret
MAX_FILE_SIZE_MB=10
NODE_ENV=development
```

### `frontend/.env.local`
```env
VITE_API_URL=http://localhost:5000/api
VITE_ANTHROPIC_API_KEY=sk-ant-your-key-here
```

---

## 📁 Structure

```
legal-ease/
├── frontend/          React 18 + Vite
│   └── src/
│       ├── pages/     Route-level pages
│       ├── components/  Reusable UI
│       └── services/  API layer (axios)
│
├── backend/           Express + Node.js
│   ├── routes/        API routes
│   ├── controllers/   Request handlers
│   ├── models/        Mongoose models
│   ├── services/      Business logic
│   │   ├── ingestion/ File parsing + OCR
│   │   ├── nlp/       Summarize, classify, translate
│   │   ├── risk/      Risk detection + scoring
│   │   ├── chatbot/   Q&A engine
│   │   ├── analytics/ Health score
│   │   ├── export/    PDF report generation
│   │   └── suggestions/ Clause rewriter
│   └── middleware/    Auth, error, upload
│
├── docker/            Dockerfiles + compose
├── scripts/           setup.sh + run.sh
├── docs/              Architecture, API, Setup
└── tests/             Jest test suites
```

---

## 📄 License

MIT © LegalEase
