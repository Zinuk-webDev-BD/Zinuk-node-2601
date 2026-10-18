const mongoose = require("mongoose");
const Group = require("../models/Group");
const User = require("../models/User");

// create a new group (only premium users)
const createGroup = async (req, res) => {
  try {
    // premium na hole group banano jabe na
    if (!req.user.isPremium) {
      return res
        .status(403)
        .json({ message: "this is a premium feature, please subscribe first" });
    }

    const { name, memberIds } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: "group name is required" });
    }

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
      return res.status(400).json({ message: "select at least one member" });
    }

    // duplicate id ar nijer id bad diye unique list banachhi
    const myId = req.user._id.toString();
    const uniqueIds = [...new Set(memberIds.map(String))].filter((id) => id !== myId);

    if (uniqueIds.length === 0) {
      return res.status(400).json({ message: "select at least one member" });
    }

    // sob id valid mongodb id kina dekhchi
    if (!uniqueIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
      return res.status(400).json({ message: "invalid member id" });
    }

    // sob member database e ache kina dekhchi
    const foundCount = await User.countDocuments({ _id: { $in: uniqueIds } });
    if (foundCount !== uniqueIds.length) {
      return res.status(404).json({ message: "one or more users not found" });
    }

    const group = await Group.create({
      name: name.trim(),
      admin: req.user._id,
      members: [req.user._id, ...uniqueIds],
    });

    const fullGroup = await Group.findById(group._id)
      .populate("admin", "name profilePicture")
      .populate("members", "name profilePicture");

    res.status(201).json({ message: "group created successfully", group: fullGroup });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// get all the groups where I am a member
const getMyGroups = async (req, res) => {
  try {
    const groups = await Group.find({ members: req.user._id })
      .populate("admin", "name profilePicture")
      .populate("members", "name profilePicture")
      .sort({ updatedAt: -1 });

    res.status(200).json({ groups });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { createGroup, getMyGroups };