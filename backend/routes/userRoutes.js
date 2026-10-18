const express = require("express");
const { getProfile, updateProfile } = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/v1/users/profile
router.get("/profile", authMiddleware, getProfile);

// PUT /api/v1/users/profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;