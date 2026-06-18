const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const PROMPT = `You are a legal document expert. Analyze the following contract and provide:
1. SHORT SUMMARY (2-3 sentences): Plain-English overview.
2. DETAILED SUMMARY (1 paragraph): Key obligations, rights, and notable terms for both parties.
3. RED FLAGS: Any immediately concerning elements in 1-2 sentences.

Contract:
{text}

Respond in this exact JSON format with no extra text:
{
  "short_summary": "...",
  "detailed_summary": "...",
  "red_flags": "..."
}`;

async function summarizeContract(text) {
  const truncated = text.length > 80000 ? text.slice(0, 80000) + "\n\n[truncated]" : text;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: PROMPT.replace("{text}", truncated) }],
  });

  const raw = response.content[0].text.trim();
  try {
    const clean = raw.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    return JSON.parse(clean);
  } catch {
    return { short_summary: raw.slice(0, 300), detailed_summary: raw, red_flags: "" };
  }
}

module.exports = { summarizeContract };
