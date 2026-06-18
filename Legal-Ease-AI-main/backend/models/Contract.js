const mongoose = require("mongoose");

const contractSchema = new mongoose.Schema(
  {
    filename:   { type: String, required: true },
    filePath:   { type: String, required: true },
    rawText:    { type: String, required: true },
    fileSizeKb: { type: Number, default: 0 },
    mimeType:   { type: String, default: "text/plain" },
  },
  { timestamps: true }
);

contractSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Contract", contractSchema);
