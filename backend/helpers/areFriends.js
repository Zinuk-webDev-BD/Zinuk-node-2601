const FriendRequest = require("../models/FriendRequest");

// duijon bondhu kina check kore (accepted request thakle bondhu)
const areFriends = async (userA, userB) => {
  const found = await FriendRequest.exists({
    status: "accepted",
    $or: [
      { sender: userA, receiver: userB },
      { sender: userB, receiver: userA },
    ],
  });
  return !!found;
};

module.exports = areFriends;