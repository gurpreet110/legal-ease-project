import axios from "axios";

const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({ baseURL: BASE, timeout: 90000 });

// ── Contracts ─────────────────────────────────────────────────────────────────
export const uploadContract = (file, onProgress) => {
  const fd = new FormData();
  fd.append("file", file);
  return api.post("/upload", fd, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (e) => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  });
};

// ── Analysis ──────────────────────────────────────────────────────────────────
export const analyzeContract = (contractId, options = {}) =>
  api.post(`/analyze/${contractId}`, options);

export const getAnalysis = (analysisId) => api.get(`/analyze/${analysisId}`);

// ── Chat ──────────────────────────────────────────────────────────────────────
export const sendChatMessage = (contractId, message, history = [], language = "en") =>
  api.post(`/chat/${contractId}`, { message, history, language });

// ── Compare ───────────────────────────────────────────────────────────────────
export const compareContracts = (contractA, contractB) =>
  api.post("/compare", { contractA, contractB });

// ── Report ────────────────────────────────────────────────────────────────────
export const downloadReport = async (analysisId, filename = "report") => {
  const res = await api.get(`/report/${analysisId}`, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}_legalease_report.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get("/dashboard/stats");

export default api;
