const express = require("express");
const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", register);

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", verifyOtp);

// POST /api/v1/auth/login
router.post("/login", login);

// POST /api/v1/auth/forgot-password
router.post("/forgot-password", forgotPassword);

// POST /api/v1/auth/reset-password
router.post("/reset-password", resetPassword);

// GET /api/v1/auth/me (shows own info if the token is valid)
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;

