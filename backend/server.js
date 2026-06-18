require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");

const connectDB = require("./config/db");
const logger = require("./config/logger");
const errorHandler = require("./middleware/errorHandler");
const rateLimiter = require("./middleware/rateLimiter");

// ── Routes ───────────────────────────────────────────────────────────────────
const uploadRoutes = require("./routes/upload");
const analyzeRoutes = require("./routes/analyze");
const chatRoutes = require("./routes/chat");
const compareRoutes = require("./routes/compare");
const reportRoutes = require("./routes/report");
const dashboardRoutes = require("./routes/dashboard");

const app = express();
const PORT = process.env.PORT || 5000;

// ── Connect DB ───────────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(",") || "*", credentials: true }));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(morgan("dev"));
app.use(rateLimiter);

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/upload",    uploadRoutes);
app.use("/api/analyze",   analyzeRoutes);
app.use("/api/chat",      chatRoutes);
app.use("/api/compare",   compareRoutes);
app.use("/api/report",    reportRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── Health ────────────────────────────────────────────────────────────────────
app.get("/",        (_, res) => res.json({ app: "LegalEase", version: "1.0.0", status: "ok" }));
app.get("/health",  (_, res) => res.json({ status: "healthy", timestamp: new Date() }));

// ── Error Handler (must be last) ──────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`⚖  LegalEase API running on http://localhost:${PORT}`);
});

module.exports = app;
