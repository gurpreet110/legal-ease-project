const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");

/**
 * Extract plain text from a file based on its MIME type.
 * Falls back to Tesseract OCR for scanned PDFs.
 */
async function extractText(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  // Plain text
  if (mimeType === "text/plain" || ext === ".txt") {
    return fs.readFileSync(filePath, "utf-8");
  }

  // DOCX
  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  // Legacy DOC — mammoth handles some .doc files
  if (mimeType === "application/msword" || ext === ".doc") {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      return result.value;
    } catch {
      throw new Error(".doc format not fully supported. Please convert to .docx or .pdf");
    }
  }

  // PDF
  if (mimeType === "application/pdf" || ext === ".pdf") {
    const buffer = fs.readFileSync(filePath);
    try {
      const data = await pdfParse(buffer);
      // If pdf-parse extracted meaningful text, use it
      if (data.text && data.text.trim().length > 100) {
        return data.text;
      }
    } catch {
      // fall through to OCR
    }
    // Scanned PDF — OCR fallback
    return ocrImage(filePath);
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

/**
 * Run Tesseract OCR on an image or scanned PDF.
 */
async function ocrImage(filePath) {
  const { data } = await Tesseract.recognize(filePath, "eng+hin+tam", {
    logger: () => {}, // silence progress
  });
  return data.text;
}

module.exports = { extractText, ocrImage };
