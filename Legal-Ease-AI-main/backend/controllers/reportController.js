const Analysis = require("../models/Analysis");
const Contract = require("../models/Contract");
const { generatePDFReport } = require("../services/export/reportGenerator");

exports.downloadReport = async (req, res) => {
  const analysis = await Analysis.findById(req.params.analysisId);
  if (!analysis) return res.status(404).json({ error: "Analysis not found" });

  const contract = await Contract.findById(analysis.contractId);
  const filename = contract ? contract.filename : "contract";

  const pdfBuffer = await generatePDFReport(analysis.toObject(), filename);

  const reportName = filename.replace(/\.[^/.]+$/, "") + "_legalease_report.pdf";

  res.set({
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${reportName}"`,
    "Content-Length": pdfBuffer.length,
  });

  res.send(pdfBuffer);
};
