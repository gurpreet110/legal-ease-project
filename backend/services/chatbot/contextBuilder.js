/**
 * Build a rich context string from contract + analysis for the chatbot.
 */
function buildContext(contract, analysis) {
  const lines = [];

  lines.push(`CONTRACT FILE: ${contract.filename}`);
  lines.push(`CONTRACT LENGTH: ${contract.rawText.length.toLocaleString()} characters`);

  if (analysis) {
    lines.push(`\nHEALTH SCORE: ${analysis.healthScore}/100`);

    const summary = analysis.summary;
    const summaryText =
      typeof summary === "object"
        ? summary.detailed_summary || summary.short_summary || ""
        : String(summary || "");

    if (summaryText) lines.push(`\nSUMMARY:\n${summaryText}`);

    const clauses = analysis.clauses || [];
    const high   = clauses.filter((c) => c.severity === "HIGH").length;
    const medium = clauses.filter((c) => c.severity === "MEDIUM").length;
    const low    = clauses.filter((c) => c.severity === "LOW").length;

    lines.push(`\nRISKY CLAUSES: ${clauses.length} total (${high} HIGH, ${medium} MEDIUM, ${low} LOW)`);

    for (const c of clauses) {
      lines.push(
        `\n[${c.severity} – ${c.type}] ${c.title}\n` +
        `  Text: ${(c.text || "").slice(0, 200)}\n` +
        `  Risk: ${c.explanation || ""}`
      );
    }
  }

  // Full contract text (truncated for context window)
  const maxChars = 20000;
  const contractText = contract.rawText.slice(0, maxChars);
  const truncated = contract.rawText.length > maxChars ? contractText + "\n[...truncated...]" : contractText;

  lines.push(`\nFULL CONTRACT:\n${truncated}`);

  return lines.join("\n");
}

module.exports = { buildContext };
