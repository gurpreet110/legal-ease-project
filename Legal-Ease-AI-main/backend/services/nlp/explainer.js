const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const PROMPT = `You are a legal expert helping a non-lawyer understand a risky contract clause.

Clause Type: {type}
Severity: {severity}
Clause Text: "{text}"

Write a plain-English explanation in 2 parts:
1. RISK: What makes this clause risky (1-2 sentences, use "you" to address the reader)
2. IMPACT: What could happen to you in the worst case (1 sentence)

Keep it under 80 words total. No legal jargon. Be direct.`;

async function explainClause(clause) {
  if (clause.explanation && clause.explanation.length > 40) return clause.explanation;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: PROMPT
          .replace("{type}", clause.type || "General")
          .replace("{severity}", clause.severity || "MEDIUM")
          .replace("{text}", (clause.text || "").slice(0, 500)),
      },
    ],
  });

  return response.content[0].text.trim();
}

module.exports = { explainClause };
