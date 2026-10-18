const mongoose = require("mongoose");

// user er schema banano hocche
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true, // same email diye multiple account na khule, unique korte hocche
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      // google/github diye login korle password na thakleo hobe, tai required false kora hocche
    },
    // email verify korar jonno, initially false thakbe, verify hole true hobe
    isVerified: {
      type: Boolean,
      default: false,
    },
    // user kothay theke login korche, local, google, github
    provider: {
      type: String,
      enum: ["local", "google", "github"],
      default: "local",
    },
  },
  { timestamps: true } // createdAt and updatedAt automatically add hobe
);

module.exports = mongoose.model("User", userSchema);