const express = require("express");
const router = express.Router();
const compareController = require("../controllers/compareController");

// POST /api/compare
router.post("/", compareController.compareContracts);

module.exports = router;
