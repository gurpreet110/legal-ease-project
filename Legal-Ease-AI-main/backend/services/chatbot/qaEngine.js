const Anthropic = require("@anthropic-ai/sdk");
const { LANGUAGE_NAMES } = require("../nlp/translator");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const SYSTEM = `You are LegalEase AI, a specialized legal document assistant.
Your job is to help users understand their contract in plain, simple English.

Guidelines:
- Be concise and direct — avoid legal jargon
- Flag serious risks clearly with ⚠️
- Use "you" to refer to the client/user
- If something is not in the contract, say so clearly
- Never give formal legal advice — recommend consulting a lawyer for critical decisions
- Keep responses under 250 words unless specifically asked for more

{context}`;

async function answerQuestion({ message, context, history = [], language = "en" }) {
  // Keep last 10 turns of history
  const messages = history.slice(-10).map(({ role, content }) => ({ role, content }));

  // Optionally append language instruction
  let userMessage = message;
  if (language !== "en") {
    const lang = LANGUAGE_NAMES[language] || language;
    userMessage = `${message}\n\n[Please respond in ${lang}]`;
  }

  messages.push({ role: "user", content: userMessage });

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 1000,
    system: SYSTEM.replace("{context}", context),
    messages,
  });

  return response.content[0].text.trim();
}

module.exports = { answerQuestion };
