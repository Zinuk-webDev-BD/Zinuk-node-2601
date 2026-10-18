const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const FriendRequest = require("../models/FriendRequest");
const Message = require("../models/Message");
const Group = require("../models/Group");
const GroupMessage = require("../models/GroupMessage");
const areFriends = require("../helpers/areFriends");

// kon user er koyta socket (tab) connected ache
const onlineCount = new Map();

// ekjon user er sob bondhur id
const getFriendIds = async (userId) => {
  const list = await FriendRequest.find({
    status: "accepted",
    $or: [{ sender: userId }, { receiver: userId }],
  });
  return list.map((r) =>
    String(r.sender) === String(userId) ? String(r.receiver) : String(r.sender)
  );
};

const setupSocket = (httpServer) => {
  const io = new Server(httpServer, { cors: { origin: "*" } });

  // server restart hole sobai offline dhore neya hocche
  User.updateMany({}, { isOnline: false }).catch(() => {});

  // connect howar age token check
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth && socket.handshake.auth.token;
      if (!token) return next(new Error("token is required"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id name");
      if (!user) return next(new Error("user not found"));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error("invalid or expired token"));
    }
  });

  io.on("connection", async (socket) => {
    const userId = String(socket.user._id);

    // protita user nijer id er room e dhuke, jate tar kache message pathano jay
    socket.join(userId);

    // user je je group er member, sob group er room e dhukiye dichhi
    try {
      const myGroups = await Group.find({ members: userId }).select("_id");
      myGroups.forEach((g) => socket.join("group:" + g._id));
    } catch (error) {
      // group load na hole o baki kaj cholbe
    }

    const count = (onlineCount.get(userId) || 0) + 1;
    onlineCount.set(userId, count);

    // prothom socket connect hole user online hoy, bondhuder jana hoy
    if (count === 1) {
      await User.findByIdAndUpdate(userId, { isOnline: true });
      const friendIds = await getFriendIds(userId);
      friendIds.forEach((id) => io.to(id).emit("friend_online", { userId }));
    }

    // message pathano
    socket.on("send_message", async (data, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const to = data && data.to;
        const text = data && typeof data.text === "string" ? data.text.trim() : "";

        if (!to || !text) return reply({ ok: false, message: "to and text are required" });
        if (!mongoose.isValidObjectId(to)) return reply({ ok: false, message: "invalid user id" });
        if (String(to) === userId) return reply({ ok: false, message: "you cannot message yourself" });
        if (text.length > 1000) return reply({ ok: false, message: "message is too long" });

        // sudhu bondhu hole message jabe
        if (!(await areFriends(userId, to))) {
          return reply({ ok: false, message: "you are not friends" });
        }

        const message = await Message.create({ sender: userId, receiver: to, text });

        // receiver er kache real time e pathano
        io.to(String(to)).emit("new_message", message);
        // sender er onno tab e pathano
        socket.to(userId).emit("new_message", message);

        reply({ ok: true, message });
      } catch (error) {
        reply({ ok: false, message: "could not send message" });
      }
    });

    // notun group banale member der socket ke oi group room e dhokano
    socket.on("join_group", async (data, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const groupId = data && data.groupId;
        if (!mongoose.isValidObjectId(groupId)) {
          return reply({ ok: false, message: "invalid group id" });
        }

        const group = await Group.findById(groupId);
        const isMember =
          group && group.members.some((m) => String(m) === userId);
        if (!isMember) return reply({ ok: false, message: "you are not a member" });

        socket.join("group:" + groupId);
        reply({ ok: true });
      } catch (error) {
        reply({ ok: false, message: "could not join group" });
      }
    });

    // group e message pathano
    socket.on("send_group_message", async (data, ack) => {
      const reply = typeof ack === "function" ? ack : () => {};
      try {
        const groupId = data && data.groupId;
        const text = data && typeof data.text === "string" ? data.text.trim() : "";

        if (!groupId || !text) {
          return reply({ ok: false, message: "groupId and text are required" });
        }
        if (!mongoose.isValidObjectId(groupId)) {
          return reply({ ok: false, message: "invalid group id" });
        }
        if (text.length > 1000) {
          return reply({ ok: false, message: "message is too long" });
        }

        // sudhu group er member message pathate parbe
        const group = await Group.findById(groupId);
        const isMember =
          group && group.members.some((m) => String(m) === userId);
        if (!isMember) {
          return reply({ ok: false, message: "you are not a member of this group" });
        }

        const created = await GroupMessage.create({
          group: groupId,
          sender: userId,
          text,
        });
        const message = await GroupMessage.findById(created._id).populate(
          "sender",
          "name profilePicture"
        );

        // group room er sobar kache (nijer onno tab o) pathachhi
        io.to("group:" + groupId).emit("new_group_message", message);

        reply({ ok: true, message });
      } catch (error) {
        reply({ ok: false, message: "could not send message" });
      }
    });

    // disconnect hole
    socket.on("disconnect", async () => {
      const left = (onlineCount.get(userId) || 1) - 1;

      if (left <= 0) {
        onlineCount.delete(userId);
        const lastSeen = new Date();
        await User.findByIdAndUpdate(userId, { isOnline: false, lastSeen });
        const friendIds = await getFriendIds(userId);
        friendIds.forEach((id) =>
          io.to(id).emit("friend_offline", { userId, lastSeen })
        );
      } else {
        onlineCount.set(userId, left);
      }
    });
  });

  return io;
};

module.exports = setupSocket;