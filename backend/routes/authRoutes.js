const express = require("express");
const { register, verifyOtp, login } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", register);

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", verifyOtp);

// POST /api/v1/auth/login
router.post("/login", login);

// GET /api/v1/auth/me (user er information ber korar jonno route, jekhane authMiddleware use kora hocche, jate user login thakle tar information ber kora jay)
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;