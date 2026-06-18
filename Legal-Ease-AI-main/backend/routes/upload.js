const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const uploadController = require("../controllers/uploadController");

// POST /api/upload
router.post("/", upload.single("file"), uploadController.uploadContract);

module.exports = router;
