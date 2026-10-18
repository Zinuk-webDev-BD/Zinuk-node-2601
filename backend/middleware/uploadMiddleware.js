const multer = require("multer");

// keep the file in memory (no file is saved on our server), then send it to cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // max 2MB
  fileFilter: (req, file, cb) => {
    // only allow these image types
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("only jpg, png or webp images are allowed"));
    }
  },
});

// accepts one file from the form field named "image"
const uploadProfileImage = (req, res, next) => {
  upload.single("image")(req, res, (error) => {
    if (error) {
      // file is bigger than 2MB
      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "image must be 2MB or smaller" });
      }
      return res.status(400).json({ message: error.message });
    }
    next();
  });
};

module.exports = uploadProfileImage;