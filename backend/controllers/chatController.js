const Contract = require("../models/Contract");
const Analysis = require("../models/Analysis");
const { buildContext } = require("../services/chatbot/contextBuilder");
const { answerQuestion } = require("../services/chatbot/qaEngine");

exports.chat = async (req, res) => {
  const { contractId } = req.params;
  const { message, history = [], language = "en" } = req.body;

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const contract = await Contract.findById(contractId);
  if (!contract) return res.status(404).json({ error: "Contract not found" });

  const analysis = await Analysis.findOne({ contractId }).sort({ createdAt: -1 });

  const context = buildContext(contract, analysis);
  const answer = await answerQuestion({ message, context, history, language });

  res.json({ answer, contractId });
};
