const request = require("supertest");
const app = require("../server");
const { computeHealthScore, getScoreLabel } = require("../services/analytics/healthScore");
const { scoreSeverity } = require("../services/risk/severityScorer");
const { cleanText } = require("../services/ingestion/textCleaner");
const { classifyClauses, detectType } = require("../services/nlp/clauseClassifier");

// ── Health endpoint ───────────────────────────────────────────────────────────
describe("GET /health", () => {
  it("returns healthy status", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("healthy");
  });
});

describe("GET /", () => {
  it("returns app info", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toBe(200);
    expect(res.body.app).toBe("LegalEase");
  });
});

// ── Health score ──────────────────────────────────────────────────────────────
describe("computeHealthScore", () => {
  it("returns 95 for no clauses", () => {
    expect(computeHealthScore([])).toBe(95);
    expect(computeHealthScore(null)).toBe(95);
  });

  it("deducts 20 per HIGH (up to 5)", () => {
    const clauses = Array(5).fill({ severity: "HIGH" });
    expect(computeHealthScore(clauses)).toBe(0);
  });

  it("deducts correctly for mixed severities", () => {
    const clauses = [{ severity: "HIGH" }, { severity: "MEDIUM" }, { severity: "LOW" }];
    expect(computeHealthScore(clauses)).toBe(69); // 100 - 20 - 8 - 3
  });

  it("never goes below 0", () => {
    const clauses = Array(20).fill({ severity: "HIGH" });
    expect(computeHealthScore(clauses)).toBe(0);
  });
});

describe("getScoreLabel", () => {
  it("labels dangerous for score < 30", () => {
    expect(getScoreLabel(15).label).toBe("Dangerous");
    expect(getScoreLabel(15).color).toBe("#E05252");
  });
  it("labels safe for score >= 80", () => {
    expect(getScoreLabel(85).label).toBe("Safe");
  });
});

// ── Text cleaner ──────────────────────────────────────────────────────────────
describe("cleanText", () => {
  it("handles null/empty", () => {
    expect(cleanText("")).toBe("");
    expect(cleanText(null)).toBe("");
  });
  it("removes null bytes", () => {
    expect(cleanText("hello\x00world")).not.toContain("\x00");
  });
  it("collapses multiple spaces", () => {
    expect(cleanText("hello   world")).not.toMatch(/  /);
  });
  it("removes page numbers", () => {
    const text = "Content\nPage 3\nMore content";
    expect(cleanText(text)).not.toContain("Page 3");
  });
});

// ── Clause classifier ─────────────────────────────────────────────────────────
describe("detectType", () => {
  it("detects Payment type", () => {
    expect(detectType("Client shall pay all invoices within 7 days.")).toBe("Payment");
  });
  it("detects IP type", () => {
    expect(detectType("All intellectual property shall belong to the provider.")).toBe("IP");
  });
  it("detects Termination type", () => {
    expect(detectType("Either party may terminate this agreement with 30 days notice.")).toBe("Termination");
  });
  it("returns General for unrecognized text", () => {
    expect(detectType("Lorem ipsum dolor sit amet.")).toBe("General");
  });
});

describe("classifyClauses", () => {
  it("splits and classifies a multi-clause contract", () => {
    const text = `1. PAYMENT TERMS\nClient shall pay within 30 days.\n\n2. TERMINATION\nEither party may terminate.`;
    const clauses = classifyClauses(text);
    expect(clauses.length).toBeGreaterThan(0);
    expect(clauses[0]).toHaveProperty("id");
    expect(clauses[0]).toHaveProperty("type");
  });
});

// ── Severity scorer ───────────────────────────────────────────────────────────
describe("scoreSeverity", () => {
  it("escalates LOW to HIGH on keyword match", () => {
    const clauses = [{ severity: "LOW", text: "Client waives all rights to any claims." }];
    const result = scoreSeverity(clauses);
    expect(result[0].severity).toBe("HIGH");
  });

  it("never downgrades AI severity", () => {
    const clauses = [{ severity: "HIGH", text: "reasonable notice of 30 days required" }];
    const result = scoreSeverity(clauses);
    expect(result[0].severity).toBe("HIGH");
  });

  it("sorts HIGH first", () => {
    const clauses = [
      { severity: "LOW",    text: "low risk text" },
      { severity: "HIGH",   text: "waives all rights" },
      { severity: "MEDIUM", text: "unilateral change" },
    ];
    const sorted = scoreSeverity(clauses);
    expect(sorted[0].severity).toBe("HIGH");
    expect(sorted[sorted.length - 1].severity).toBe("LOW");
  });
});
