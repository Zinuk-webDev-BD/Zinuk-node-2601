const mongoose = require("mongoose");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");

// the user fields we show to other people (no email, no password)
const PUBLIC_FIELDS = "name profilePicture bio isOnline lastSeen";

// get people I may know: everyone except me, my friends and people with a request
const getSuggestions = async (req, res) => {
  try {
    const myId = req.user._id;

    // every request where I am the sender or the receiver
    const relations = await FriendRequest.find({
      $or: [{ sender: myId }, { receiver: myId }],
    });

    // collect the ids we must hide: myself and everyone connected with me
    const hiddenIds = [myId];
    relations.forEach((relation) => {
      hiddenIds.push(relation.sender, relation.receiver);
    });

    const users = await User.find({
      _id: { $nin: hiddenIds },
      isVerified: true,
    }).select(PUBLIC_FIELDS);

    res.status(200).json({ count: users.length, users });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// send a friend request to another user
const sendRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "invalid user id" });
    }

    if (userId === myId.toString()) {
      return res
        .status(400)
        .json({ message: "you cannot send a request to yourself" });
    }

    const receiver = await User.findById(userId);
    if (!receiver || !receiver.isVerified) {
      return res.status(404).json({ message: "user not found" });
    }

    // check if there is already a request or friendship in any direction
    const existing = await FriendRequest.findOne({
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });

    if (existing) {
      const message =
        existing.status === "accepted"
          ? "you are already friends"
          : "a friend request already exists";
      return res.status(409).json({ message });
    }

    const request = await FriendRequest.create({
      sender: myId,
      receiver: userId,
    });

    res.status(201).json({ message: "friend request sent", request });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// list of requests I have sent (still waiting for an answer)
const getSentRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      sender: req.user._id,
      status: "pending",
    })
      .populate("receiver", PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// list of requests other people sent to me
const getReceivedRequests = async (req, res) => {
  try {
    const requests = await FriendRequest.find({
      receiver: req.user._id,
      status: "pending",
    })
      .populate("sender", PUBLIC_FIELDS)
      .sort({ createdAt: -1 });

    res.status(200).json({ count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// accept a request that was sent to me
const acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params;

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ message: "invalid request id" });
    }

    // only the receiver can accept
    const request = await FriendRequest.findOne({
      _id: requestId,
      receiver: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "friend request not found" });
    }

    request.status = "accepted";
    await request.save();

    res.status(200).json({ message: "friend request accepted", request });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// cancel a request I sent, or reject a request sent to me (the request is deleted)
const cancelRequest = async (req, res) => {
  try {
    const myId = req.user._id;
    const { requestId } = req.params;

    if (!mongoose.isValidObjectId(requestId)) {
      return res.status(400).json({ message: "invalid request id" });
    }

    // both the sender and the receiver can remove a pending request
    const request = await FriendRequest.findOneAndDelete({
      _id: requestId,
      status: "pending",
      $or: [{ sender: myId }, { receiver: myId }],
    });

    if (!request) {
      return res.status(404).json({ message: "friend request not found" });
    }

    const message = request.sender.equals(myId)
      ? "friend request cancelled"
      : "friend request rejected";

    res.status(200).json({ message });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// list of my friends
const getFriends = async (req, res) => {
  try {
    const myId = req.user._id;

    const relations = await FriendRequest.find({
      status: "accepted",
      $or: [{ sender: myId }, { receiver: myId }],
    })
      .populate("sender", PUBLIC_FIELDS)
      .populate("receiver", PUBLIC_FIELDS);

    // in each document, the friend is the user who is not me
    const friends = relations.map((relation) =>
      relation.sender._id.equals(myId) ? relation.receiver : relation.sender
    );

    res.status(200).json({ count: friends.length, friends });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// view a friend's profile (only friends can see it)
const getFriendProfile = async (req, res) => {
  try {
    const myId = req.user._id;
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "invalid user id" });
    }

    const relation = await FriendRequest.findOne({
      status: "accepted",
      $or: [
        { sender: myId, receiver: userId },
        { sender: userId, receiver: myId },
      ],
    });

    if (!relation) {
      return res
        .status(403)
        .json({ message: "you can only view the profile of your friends" });
    }

    const friend = await User.findById(userId).select(
      "name bio phone address profilePicture isOnline lastSeen"
    );

    res.status(200).json({ user: friend });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = {
  getSuggestions,
  sendRequest,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  cancelRequest,
  getFriends,
  getFriendProfile,
};