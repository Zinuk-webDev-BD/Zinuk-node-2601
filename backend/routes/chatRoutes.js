const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { getMessages } = require("../controllers/chatController");

const router = express.Router();

router.get("/:userId", authMiddleware, getMessages);

module.exports = router;