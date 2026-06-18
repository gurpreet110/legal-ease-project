const express = require("express");
const router = express.Router();
const reportController = require("../controllers/reportController");

// GET /api/report/:analysisId
router.get("/:analysisId", reportController.downloadReport);

module.exports = router;
