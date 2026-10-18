const str = (example) => ({ type: "string", example });

// group apis for swagger
const groupPaths = {
  "/groups": {
    post: {
      tags: ["Group"],
      summary: "Create a group (premium users only, friends only as members)",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["name", "memberIds"],
              properties: {
                name: str("Study Group"),
                memberIds: {
                  type: "array",
                  items: { type: "string" },
                  example: ["PUT_FRIEND_ID_HERE"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "group created" },
        400: { description: "missing name, no members or invalid id" },
        403: { description: "not a premium user, or a member is not your friend" },
        404: { description: "one or more users not found" },
      },
    },
    get: {
      tags: ["Group"],
      summary: "Get the groups where I am a member",
      security: [{ bearerAuth: [] }],
      responses: { 200: { description: "my groups" } },
    },
  },
  "/groups/{groupId}/messages": {
    get: {
      tags: ["Group"],
      summary: "Get old messages of a group (members only). New messages come in real time through socket.io",
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: "groupId",
          in: "path",
          required: true,
          schema: { type: "string" },
        },
      ],
      responses: {
        200: { description: "group messages" },
        403: { description: "you are not a member" },
        404: { description: "group not found" },
      },
    },
  },
};

module.exports = groupPaths;