// small helper for a simple response
const reply = (description) => ({ description });

// builds a path parameter (like :userId) for swagger
const pathParam = (name, description) => ({
  name,
  in: "path",
  required: true,
  description,
  schema: { type: "string" },
});

// every friend api needs a login token
const secured = [{ bearerAuth: [] }];

// swagger docs of all friend apis
const friendPaths = {
  "/friends/suggestions": {
    get: {
      tags: ["Friends"],
      summary: "People I may know (not friends, no request between us)",
      security: secured,
      responses: { 200: reply("list of suggested users"), 401: reply("token missing or invalid") },
    },
  },
  "/friends/requests/sent": {
    get: {
      tags: ["Friends"],
      summary: "Requests I have sent (waiting for an answer)",
      security: secured,
      responses: { 200: reply("list of sent requests"), 401: reply("token missing or invalid") },
    },
  },
  "/friends/requests/received": {
    get: {
      tags: ["Friends"],
      summary: "Requests other people sent to me",
      security: secured,
      responses: { 200: reply("list of received requests"), 401: reply("token missing or invalid") },
    },
  },
  "/friends/requests/send/{userId}": {
    post: {
      tags: ["Friends"],
      summary: "Send a friend request (add friend button)",
      security: secured,
      parameters: [pathParam("userId", "id of the user who will get the request")],
      responses: {
        201: reply("friend request sent"),
        400: reply("invalid id or request to yourself"),
        404: reply("user not found"),
        409: reply("request already exists or already friends"),
      },
    },
  },
  "/friends/requests/{requestId}/accept": {
    put: {
      tags: ["Friends"],
      summary: "Accept a request that was sent to me",
      security: secured,
      parameters: [pathParam("requestId", "id of the friend request")],
      responses: { 200: reply("friend request accepted"), 404: reply("friend request not found") },
    },
  },
  "/friends/requests/{requestId}": {
    delete: {
      tags: ["Friends"],
      summary: "Cancel a request I sent, or reject a request sent to me",
      security: secured,
      parameters: [pathParam("requestId", "id of the friend request")],
      responses: { 200: reply("request cancelled or rejected"), 404: reply("friend request not found") },
    },
  },
  "/friends": {
    get: {
      tags: ["Friends"],
      summary: "My friend list",
      security: secured,
      responses: { 200: reply("list of friends"), 401: reply("token missing or invalid") },
    },
  },
  "/friends/{userId}": {
    get: {
      tags: ["Friends"],
      summary: "View a friend's profile (friends only)",
      security: secured,
      parameters: [pathParam("userId", "id of the friend")],
      responses: {
        200: reply("friend's profile"),
        403: reply("this user is not your friend"),
      },
    },
  },
};

module.exports = friendPaths;