const express = require("express");
const passport = require("../configuration/passportConfig");
const {
  register,
  verifyOtp,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
} = require("../controllers/authController");
const {
  googleCallback,
  googleFailure,
} = require("../controllers/socialAuthController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// start passport for the google routes below
router.use(passport.initialize());

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

// PUT /api/v1/auth/change-password (only for logged in users)
router.put("/change-password", authMiddleware, changePassword);

// GET /api/v1/auth/google (sends the user to the google login page)
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"], session: false })
);

// GET /api/v1/auth/google/callback (google sends the user back here)
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/api/v1/auth/google/failure",
  }),
  googleCallback
);

// GET /api/v1/auth/google/failure
router.get("/google/failure", googleFailure);

// GET /api/v1/auth/me (shows own info if the token is valid)
router.get("/me", authMiddleware, (req, res) => {
  res.status(200).json({ user: req.user });
});

module.exports = router;