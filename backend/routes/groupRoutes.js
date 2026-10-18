const express = require("express");
const {
  createGroup,
  getMyGroups,
  getGroupMessages,
} = require("../controllers/groupController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/v1/groups (create a group, premium only)
router.post("/", authMiddleware, createGroup);

// GET /api/v1/groups (my groups)
router.get("/", authMiddleware, getMyGroups);

// GET /api/v1/groups/:groupId/messages (old messages, members only)
router.get("/:groupId/messages", authMiddleware, getGroupMessages);

module.exports = router;