const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-4-20250514";

const LANGUAGE_NAMES = {
  hi: "Hindi",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  mr: "Marathi",
  gu: "Gujarati",
};

async function translateText(text, targetLang) {
  if (targetLang === "en" || !text) return text;

  const langName = LANGUAGE_NAMES[targetLang] || targetLang;
  const prompt = `Translate the following text to ${langName}. Keep it clear and accessible. Return ONLY the translation:\n\n${text}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content[0].text.trim();
}

module.exports = { translateText, LANGUAGE_NAMES };
