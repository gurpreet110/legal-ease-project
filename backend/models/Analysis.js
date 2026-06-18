const mongoose = require("mongoose");

const clauseSchema = new mongoose.Schema({
  id:          Number,
  type:        { type: String, enum: ["Payment","IP","Termination","Liability","Confidentiality","Governing Law","Amendment","Services","Privacy","Force Majeure","General","Other"], default: "General" },
  severity:    { type: String, enum: ["HIGH","MEDIUM","LOW"], default: "LOW" },
  title:       String,
  text:        String,
  explanation: String,
  suggestion:  String,
}, { _id: false });

const analysisSchema = new mongoose.Schema(
  {
    contractId:  { type: mongoose.Schema.Types.ObjectId, ref: "Contract", required: true },
    summary:     { type: mongoose.Schema.Types.Mixed },  // string or {short, detailed, red_flags}
    healthScore: { type: Number, min: 0, max: 100, default: 0 },
    language:    { type: String, default: "en" },
    clauses:     [clauseSchema],
    stats: {
      total:  { type: Number, default: 0 },
      high:   { type: Number, default: 0 },
      medium: { type: Number, default: 0 },
      low:    { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

analysisSchema.index({ contractId: 1 });
analysisSchema.index({ createdAt: -1 });

module.exports = mongoose.model("Analysis", analysisSchema);
