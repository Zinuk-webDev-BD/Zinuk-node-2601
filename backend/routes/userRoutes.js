const express = require("express");
const { getProfile, updateProfile } = require("../controllers/userController");
const { uploadProfilePicture } = require("../controllers/uploadController");
const authMiddleware = require("../middleware/authMiddleware");
const uploadProfileImage = require("../middleware/uploadMiddleware");

const router = express.Router();

// GET /api/v1/users/profile
router.get("/profile", authMiddleware, getProfile);

// PUT /api/v1/users/profile
router.put("/profile", authMiddleware, updateProfile);

// POST /api/v1/users/profile/picture (login first, then check the file, then upload)
router.post(
  "/profile/picture",
  authMiddleware,
  uploadProfileImage,
  uploadProfilePicture
);

module.exports = router;
