const str = (example) => ({ type: "string", example });

// group apis for swagger
const groupPaths = {
  "/groups": {
    post: {
      tags: ["Group"],
      summary: "Create a group (premium users only)",
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
                  example: ["PUT_USER_ID_HERE"],
                },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "group created" },
        400: { description: "missing name, no members or invalid id" },
        403: { description: "not a premium user" },
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
};

module.exports = groupPaths;