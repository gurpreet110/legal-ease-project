/**
 * Clean and normalise raw text extracted from a contract.
 */
function cleanText(text) {
  if (!text) return "";

  return text
    // Remove null bytes
    .replace(/\x00/g, "")
    // Normalise unicode spaces
    .replace(/\xa0/g, " ")
    .replace(/\u200b/g, "")
    // Normalise line endings
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    // Remove repeated page numbers  e.g. "Page 3" or "- 3 -"
    .replace(/(?m)^[\s\-]*[Pp]age\s+\d+[\s\-]*$/gm, "")
    .replace(/(?m)^\s*\d+\s*$/gm, "")
    // Collapse multiple spaces
    .replace(/[ \t]{2,}/g, " ")
    // Collapse 3+ blank lines → 2
    .replace(/\n{3,}/g, "\n\n")
    // Strip each line
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();
}

module.exports = { cleanText };
