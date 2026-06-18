const Contract = require("../models/Contract");
const { computeDiff } = require("../services/comparison/contractDiff");

exports.compareContracts = async (req, res) => {
  const { contractA, contractB } = req.body;

  if (!contractA || !contractB) {
    return res.status(400).json({ error: "contractA and contractB IDs are required" });
  }

  const [a, b] = await Promise.all([
    Contract.findById(contractA),
    Contract.findById(contractB),
  ]);

  if (!a) return res.status(404).json({ error: "Contract A not found" });
  if (!b) return res.status(404).json({ error: "Contract B not found" });

  const diff = computeDiff(a.rawText, b.rawText);

  res.json({
    contractA: { id: a._id, filename: a.filename },
    contractB: { id: b._id, filename: b.filename },
    ...diff,
  });
};
