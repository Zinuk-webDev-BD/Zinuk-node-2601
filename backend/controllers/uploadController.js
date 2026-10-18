const cloudinary = require("../configuration/cloudinaryConfig");
const User = require("../models/User");

// send the image data to cloudinary and get back the image url
const uploadToCloudinary = (buffer, userId) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "auth-system/profile-pictures",
        // same name for every upload of this user, so a new picture replaces the old one
        public_id: `user_${userId}`,
        overwrite: true,
        invalidate: true,
        // make the picture a 400x400 square and focus on the face
        transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

// upload or replace the logged in user's profile picture
const uploadProfilePicture = async (req, res) => {
  try {
    // multer puts the file in req.file
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "image file is required (field name: image)" });
    }

    const result = await uploadToCloudinary(req.file.buffer, req.user._id);

    // save the image url in the user's profilePicture field
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { profilePicture: result.secure_url },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "profile picture updated successfully",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { uploadProfilePicture };