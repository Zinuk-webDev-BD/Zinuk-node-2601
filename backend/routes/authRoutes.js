const express = require("express");
const { register, verifyOtp } = require("../controllers/authController");

const router = express.Router();

// POST /api/v1/auth/register
router.post("/register", register);

// POST /api/v1/auth/verify-otp
router.post("/verify-otp", verifyOtp);

module.exports = router;

