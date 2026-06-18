const fs = require("fs");
const Contract = require("../models/Contract");
const { extractText } = require("../services/ingestion/extractor");
const { cleanText } = require("../services/ingestion/textCleaner");

exports.uploadContract = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded." });
  }

  const { originalname, path: filePath, size, mimetype } = req.file;

  // Extract text from the file
  let rawText;
  try {
    rawText = await extractText(filePath, mimetype);
  } catch (err) {
    fs.unlinkSync(filePath); // cleanup
    return res.status(422).json({ error: `Could not extract text: ${err.message}` });
  }

  const cleaned = cleanText(rawText);

  if (!cleaned || cleaned.length < 50) {
    fs.unlinkSync(filePath);
    return res.status(422).json({ error: "Could not extract readable text from this file." });
  }

  const contract = await Contract.create({
    filename:   originalname,
    filePath,
    rawText:    cleaned,
    fileSizeKb: Math.round(size / 1024),
    mimeType:   mimetype,
  });

  res.status(201).json({
    contractId: contract._id,
    filename:   contract.filename,
    sizeKb:     contract.fileSizeKb,
    charCount:  cleaned.length,
    status:     "uploaded",
  });
};
