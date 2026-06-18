const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");

// POST /api/chat/:contractId
router.post("/:contractId", chatController.chat);

module.exports = router;
