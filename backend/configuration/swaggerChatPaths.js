// small helper for a simple response
const reply = (description) => ({ description });

// every chat api needs a login token
const secured = [{ bearerAuth: [] }];

// swagger docs of chat apis
// note: real time messages go through socket.io (not swagger), here only the message history api is shown
const chatPaths = {
  "/chats/{userId}": {
    get: {
      tags: ["Chat"],
      summary: "Get old messages with a friend (friends only). New messages come in real time through socket.io",
      security: secured,
      parameters: [
        {
          name: "userId",
          in: "path",
          required: true,
          description: "id of the friend",
          schema: { type: "string" },
        },
        {
          name: "limit",
          in: "query",
          required: false,
          description: "how many latest messages to get (default 50, max 100)",
          schema: { type: "integer", default: 50 },
        },
      ],
      responses: {
        200: reply("list of messages, oldest first"),
        400: reply("invalid user id"),
        401: reply("token missing or invalid"),
        403: reply("this user is not your friend"),
      },
    },
  },
};

module.exports = chatPaths;
