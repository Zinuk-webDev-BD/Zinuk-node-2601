const mongoose = require("mongoose");

// one document = one friend request between two users
const friendRequestSchema = new mongoose.Schema(
  {
    // who sent the request
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // who received the request
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // pending = waiting for an answer, accepted = they are friends now
    status: {
      type: String,
      enum: ["pending", "accepted"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// the same sender cannot send two requests to the same receiver
friendRequestSchema.index({ sender: 1, receiver: 1 }, { unique: true });

module.exports = mongoose.model("FriendRequest", friendRequestSchema);