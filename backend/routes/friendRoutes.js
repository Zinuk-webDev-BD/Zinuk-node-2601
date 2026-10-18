const express = require("express");
const {
  getSuggestions,
  sendRequest,
  getSentRequests,
  getReceivedRequests,
  acceptRequest,
  cancelRequest,
  getFriends,
  getFriendProfile,
} = require("../controllers/friendController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// every friend route needs login
router.use(authMiddleware);

// GET /api/v1/friends/suggestions
router.get("/suggestions", getSuggestions);

// GET /api/v1/friends/requests/sent
router.get("/requests/sent", getSentRequests);

// GET /api/v1/friends/requests/received
router.get("/requests/received", getReceivedRequests);

// POST /api/v1/friends/requests/send/:userId
router.post("/requests/send/:userId", sendRequest);

// PUT /api/v1/friends/requests/:requestId/accept
router.put("/requests/:requestId/accept", acceptRequest);

// DELETE /api/v1/friends/requests/:requestId (cancel or reject)
router.delete("/requests/:requestId", cancelRequest);

// GET /api/v1/friends (my friend list)
router.get("/", getFriends);

// GET /api/v1/friends/:userId (a friend's profile, keep this last)
router.get("/:userId", getFriendProfile);

module.exports = router;