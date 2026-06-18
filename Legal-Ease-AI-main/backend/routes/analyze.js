const express = require("express");
const router = express.Router();
const analyzeController = require("../controllers/analyzeController");

// POST /api/analyze/:contractId
router.post("/:contractId", analyzeController.analyzeContract);

// GET /api/analyze/:analysisId
router.get("/:analysisId", analyzeController.getAnalysis);

module.exports = router;
