const User = require("../models/User");

// get the logged in user's own profile
const getProfile = async (req, res) => {
  try {
    // req.user is already set by authMiddleware (password is not included)
    res.status(200).json({ user: req.user });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// update profile, only the fields sent in the body will change
const updateProfile = async (req, res) => {
  try {
    // only these fields are allowed to be changed from here
    const allowedFields = ["name", "phone", "bio", "address"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "send at least one field to update" });
    }

    if (updates.name !== undefined && !updates.name.trim()) {
      return res.status(400).json({ message: "name cannot be empty" });
    }

    // phone must be digits only (optional + at the start), 7 to 15 digits
    if (updates.phone && !/^\+?[0-9]{7,15}$/.test(updates.phone)) {
      return res.status(400).json({ message: "invalid phone number" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({ message: "profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { getProfile, updateProfile };