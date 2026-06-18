const Contract = require("../models/Contract");
const Analysis = require("../models/Analysis");
const { summarizeContract } = require("../services/nlp/summarizer");
const { classifyClauses } = require("../services/nlp/clauseClassifier");
const { detectRisks } = require("../services/risk/riskDetector");
const { scoreSeverity } = require("../services/risk/severityScorer");
const { explainClause } = require("../services/nlp/explainer");
const { computeHealthScore } = require("../services/analytics/healthScore");
const { translateText } = require("../services/nlp/translator");

exports.analyzeContract = async (req, res) => {
  const { contractId } = req.params;
  const { language = "en", includeSuggestions = true } = req.body;

  const contract = await Contract.findById(contractId);
  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const text = contract.rawText;

  // 1. Summarize
  const summary = await summarizeContract(text);

  // 2. Classify clauses
  const clauses = classifyClauses(text);

  // 3. Detect risks via AI
  const riskyClauses = await detectRisks(clauses, text);

  // 4. Score severity (rule-based escalation)
  const scored = scoreSeverity(riskyClauses);

  // 5. Explain each clause (AI)
  for (const clause of scored) {
    if (!clause.explanation || clause.explanation.length < 40) {
      clause.explanation = await explainClause(clause);
    }
  }

  // 6. Health score
  const healthScore = computeHealthScore(scored);

  // 7. Translate if needed
  let finalSummary = summary;
  if (language !== "en") {
    finalSummary = await translateText(
      typeof summary === "object" ? summary.detailed_summary || summary.short_summary : summary,
      language
    );
  }

  // 8. Stats
  const stats = {
    total:  scored.length,
    high:   scored.filter((c) => c.severity === "HIGH").length,
    medium: scored.filter((c) => c.severity === "MEDIUM").length,
    low:    scored.filter((c) => c.severity === "LOW").length,
  };

  // 9. Persist
  const analysis = await Analysis.create({
    contractId: contract._id,
    summary:    finalSummary,
    healthScore,
    language,
    clauses:    scored,
    stats,
  });

  res.status(201).json({
    analysisId:  analysis._id,
    contractId:  contract._id,
    summary:     finalSummary,
    healthScore,
    language,
    clauses:     scored,
    stats,
  });
};

exports.getAnalysis = async (req, res) => {
  const analysis = await Analysis.findById(req.params.analysisId).populate("contractId", "filename");
  if (!analysis) return res.status(404).json({ error: "Analysis not found" });
  res.json(analysis);
};
