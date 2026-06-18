const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const PROMPT = `You are a legal risk analyst. Analyze the following contract and identify ALL risky, unfair, or one-sided clauses.

For each risky clause provide:
- type: Payment | IP | Termination | Liability | Confidentiality | Governing Law | Amendment | Services | Other
- severity: HIGH | MEDIUM | LOW
- title: Short descriptive title (max 8 words)
- text: Exact problematic text from the contract (verbatim)
- explanation: Plain-English explanation of why this is risky ("What it means for you")
- suggestion: A safer, more balanced alternative wording

Focus on:
- Asymmetric rights between parties
- Unreasonable deadlines or notice periods
- Excessive liability waivers or caps
- One-sided IP ownership
- Unusual termination terms
- Jurisdiction/arbitration clauses favoring one party
- Clauses allowing unilateral modification

Contract:
{text}

Respond ONLY with a valid JSON array, no markdown, no preamble:
[{"type":"...","severity":"...","title":"...","text":"...","explanation":"...","suggestion":"..."}]`;

async function detectRisks(clauses, fullText) {
  const truncated = fullText.length > 60000 ? fullText.slice(0, 60000) : fullText;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 4096,
    messages: [{ role: "user", content: PROMPT.replace("{text}", truncated) }],
  });

  const raw = response.content[0].text.trim();
  try {
    const clean = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    const results = JSON.parse(clean);
    return results.map((c, i) => ({ ...c, id: i + 1 }));
  } catch {
    // Fallback to rule-based detection
    return ruleBasedDetection(fullText);
  }
}

// Rule-based fallback
const HIGH_KEYWORDS = ["waives all rights", "no liability", "at any time", "sole discretion", "irrevocably", "indemnify"];
const MEDIUM_KEYWORDS = ["unilaterally", "modify at any time", "no refund", "as-is", "arbitration only"];

function ruleBasedDetection(text) {
  const lower = text.toLowerCase();
  const results = [];
  let id = 1;

  for (const kw of HIGH_KEYWORDS) {
    if (lower.includes(kw)) {
      results.push({ id: id++, type: "Other", severity: "HIGH", title: `Contains "${kw}"`, text: kw, explanation: `The phrase "${kw}" indicates significant risk.`, suggestion: "Negotiate more balanced terms." });
    }
  }
  for (const kw of MEDIUM_KEYWORDS) {
    if (lower.includes(kw)) {
      results.push({ id: id++, type: "Other", severity: "MEDIUM", title: `Contains "${kw}"`, text: kw, explanation: `The phrase "${kw}" may indicate one-sided terms.`, suggestion: "Review with a legal professional." });
    }
  }
  return results;
}

module.exports = { detectRisks };
