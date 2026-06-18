const CLAUSE_KEYWORDS = {
  Payment:         ["payment", "invoice", "fee", "price", "cost", "interest", "compensation", "remuneration"],
  IP:              ["intellectual property", "copyright", "patent", "trademark", "work product", "invention", "license", "ownership"],
  Termination:     ["terminat", "cancel", "expir", "end of agreement", "notice period", "exit"],
  Liability:       ["liability", "indemnif", "damages", "limitation", "warrant", "guarantee", "indemnity"],
  Confidentiality: ["confidential", "nda", "non-disclosure", "proprietary", "trade secret", "disclose"],
  "Governing Law": ["governing law", "jurisdiction", "arbitration", "dispute", "venue", "forum", "mediation"],
  Amendment:       ["amend", "modif", "chang", "update", "revision", "alter", "waive"],
  Services:        ["services", "deliverable", "scope", "work", "perform", "obligation", "milestone"],
  Privacy:         ["privacy", "personal data", "gdpr", "data protection", "processing", "data subject"],
  "Force Majeure": ["force majeure", "act of god", "unforeseeable", "beyond control", "natural disaster"],
};

/**
 * Segment contract text into clauses and classify each by type.
 */
function classifyClauses(text) {
  const segments = splitSegments(text);
  return segments
    .filter((s) => s.trim().length >= 30)
    .map((segment, i) => ({
      id:        i + 1,
      type:      detectType(segment),
      text:      segment.trim(),
      charCount: segment.length,
    }));
}

function splitSegments(text) {
  // Try numbered sections first: "1. PAYMENT TERMS"
  const numbered = text.split(/(?=\n\d+\.\s+[A-Z])/);
  if (numbered.length > 2) return numbered;
  // Fallback: double newline
  return text.split(/\n\n+/).filter(Boolean);
}

function detectType(text) {
  const lower = text.toLowerCase();
  const scores = {};
  for (const [type, keywords] of Object.entries(CLAUSE_KEYWORDS)) {
    const score = keywords.reduce((n, kw) => n + (lower.includes(kw) ? 1 : 0), 0);
    if (score > 0) scores[type] = score;
  }
  if (!Object.keys(scores).length) return "General";
  return Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
}

module.exports = { classifyClauses, detectType };
