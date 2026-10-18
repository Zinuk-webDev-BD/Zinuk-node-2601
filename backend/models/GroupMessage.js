const mongoose = require("mongoose");

// group er message, ekta document = ekta message
const groupMessageSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

// group wise message druto khujar jonno
groupMessageSchema.index({ group: 1, createdAt: 1 });

module.exports = mongoose.model("GroupMessage", groupMessageSchema);