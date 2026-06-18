const HIGH_ESCALATORS = [
  "waive", "waives all rights", "no recourse", "no liability",
  "unlimited", "irrevocable", "perpetual", "immediate termination",
  "without notice", "at any time", "sole discretion",
  "indemnify", "hold harmless", "bear all costs", "forfeit",
];

const MEDIUM_ESCALATORS = [
  "unilateral", "solely", "modify at any time", "no refund",
  "as-is", "without warranty", "not liable", "sole property", "arbitration only",
];

const ORDER = { HIGH: 2, MEDIUM: 1, LOW: 0 };

/**
 * Assign or escalate severity for each clause.
 * Never downgrades AI assessment — only escalates.
 */
function scoreSeverity(clauses) {
  for (const clause of clauses) {
    const lower = (clause.text || "").toLowerCase();
    const current = clause.severity || "LOW";
    let computed = "LOW";

    if (HIGH_ESCALATORS.some((kw) => lower.includes(kw)))   computed = "HIGH";
    else if (MEDIUM_ESCALATORS.some((kw) => lower.includes(kw))) computed = "MEDIUM";

    clause.severity = ORDER[computed] > ORDER[current] ? computed : current;
  }

  // Sort HIGH → MEDIUM → LOW
  return clauses.sort((a, b) => ORDER[b.severity] - ORDER[a.severity]);
}

module.exports = { scoreSeverity };
