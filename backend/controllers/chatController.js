const mongoose = require("mongoose");
const Message = require("../models/Message");
const areFriends = require("../helpers/areFriends");

// bondhur sathe purono message gulo ana
const getMessages = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "invalid user id" });
    }
    if (!(await areFriends(myId, userId))) {
      return res.status(403).json({ message: "this user is not your friend" });
    }

    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const messages = await Message.find({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    // purono theke notun er moto sajiye pathano
    messages.reverse();

    res.json({ count: messages.length, messages });
  } catch (error) {
    res.status(500).json({ message: "something went wrong" });
  }
};

module.exports = { getMessages };