const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const PROMPT = `You are a contract lawyer specialising in balanced, fair agreements.

The following clause has been flagged as risky:
Type: {type}
Severity: {severity}
Original: "{text}"
Problem: {explanation}

Rewrite this clause to be fair to both parties:
- Same general purpose/intent
- Balanced and mutual where applicable
- Standard industry norms
- Clear, plain English
- 1-3 sentences only

Respond with ONLY the rewritten clause text, no preamble.`;

async function rewriteClause(clause) {
  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: PROMPT
          .replace("{type}", clause.type || "General")
          .replace("{severity}", clause.severity || "MEDIUM")
          .replace("{text}", (clause.text || "").slice(0, 600))
          .replace("{explanation}", clause.explanation || "This clause is one-sided."),
      },
    ],
  });
  return response.content[0].text.trim();
}

module.exports = { rewriteClause };
