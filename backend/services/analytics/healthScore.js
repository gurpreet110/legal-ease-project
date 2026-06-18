const WEIGHTS  = { HIGH: 20, MEDIUM: 8, LOW: 3 };
const MAX_CAPS = { HIGH: 5,  MEDIUM: 5, LOW: 10 };

/**
 * Compute a 0-100 contract health score.
 * Starts at 100, deducts points per risky clause (capped per severity tier).
 */
function computeHealthScore(clauses) {
  if (!clauses || clauses.length === 0) return 95;

  const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
  for (const c of clauses) {
    if (counts[c.severity] !== undefined) counts[c.severity]++;
  }

  const deduction = Object.entries(counts).reduce((total, [sev, count]) => {
    return total + Math.min(count, MAX_CAPS[sev]) * WEIGHTS[sev];
  }, 0);

  return Math.max(0, Math.min(100, 100 - deduction));
}

function getScoreLabel(score) {
  if (score >= 80) return { label: "Safe",         color: "#4CAF78", advice: "This contract appears generally fair." };
  if (score >= 60) return { label: "Moderate Risk", color: "#E8A835", advice: "Review highlighted clauses before signing." };
  if (score >= 40) return { label: "High Risk",     color: "#E8823A", advice: "Several concerning clauses — seek legal advice." };
  return              { label: "Dangerous",     color: "#E05252", advice: "Do not sign without a legal review." };
}

module.exports = { computeHealthScore, getScoreLabel };
