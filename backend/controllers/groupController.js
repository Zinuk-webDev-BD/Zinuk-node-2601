const mongoose = require("mongoose");
const Group = require("../models/Group");
const User = require("../models/User");
const GroupMessage = require("../models/GroupMessage");
const areFriends = require("../helpers/areFriends");

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

    // sudhu bondhuder group e add kora jabe
    for (const id of uniqueIds) {
      if (!(await areFriends(myId, id))) {
        return res
          .status(403)
          .json({ message: "you can add only your friends to a group" });
      }
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

// get old messages of a group (only members can see)
const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!mongoose.isValidObjectId(groupId)) {
      return res.status(400).json({ message: "invalid group id" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "group not found" });
    }

    // member na hole message dekhte dibo na
    const isMember = group.members.some(
      (m) => String(m) === String(req.user._id)
    );
    if (!isMember) {
      return res.status(403).json({ message: "you are not a member of this group" });
    }

    const messages = await GroupMessage.find({ group: groupId })
      .populate("sender", "name profilePicture")
      .sort({ createdAt: 1 });

    res.status(200).json({ messages });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { createGroup, getMyGroups, getGroupMessages };