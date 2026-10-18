const groupPaths = require("./swaggerGroupPaths");
const friendPaths = require("./swaggerFriendPaths");
const chatPaths = require("./swaggerChatPaths");
// small helpers so we do not repeat the same code again and again
const str = (example) => ({ type: "string", example });

// builds a json request body from the given fields
const bodyOf = (properties, required) => ({
  required: true,
  content: {
    "application/json": {
      schema: { type: "object", required, properties },
    },
  },
});

// shows a simple response with a message
const reply = (description) => ({ description });

// the swagger (openapi) document that describes all our apis
const swaggerSpec = {
  openapi: "3.0.0",
  info: {
    title: "Auth System API",
    version: "1.0.0",
    description:
      "Authentication system with email otp (redis), jwt login, forgot/reset/change password, google and github login, user profile and profile picture upload (cloudinary), premium payment (sslcommerz).",
  },
  // every path below starts from this base url
  servers: [{ url: "http://localhost:8000/api/v1" }],
  components: {
    securitySchemes: {
      // protected routes need a jwt token in the Authorization header
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
  },
  paths: {
    // friend apis are written in a separate file
    ...friendPaths,
    // chat apis are written in a separate file
    ...chatPaths,
        // group apis are written in a separate file
    ...groupPaths,
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user and send an otp to the email",
        requestBody: bodyOf(
          { name: str("Zinuk"), email: str("user@example.com"), password: str("123456") },
          ["name", "email", "password"]
        ),
        responses: {
          201: reply("registered, otp sent to the email"),
          400: reply("missing fields or short password"),
          409: reply("email already exists"),
        },
      },
    },
    "/auth/verify-otp": {
      post: {
        tags: ["Auth"],
        summary: "Verify the email with the otp (otp lives 5 minutes in redis)",
        requestBody: bodyOf(
          { email: str("user@example.com"), otp: str("123456") },
          ["email", "otp"]
        ),
        responses: {
          200: reply("email verified successfully"),
          400: reply("invalid otp, expired otp or already verified"),
          404: reply("user not found"),
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login with email and password, returns a jwt token",
        requestBody: bodyOf(
          { email: str("user@example.com"), password: str("123456") },
          ["email", "password"]
        ),
        responses: {
          200: reply("login successful, token returned"),
          400: reply("missing fields or social login account"),
          401: reply("invalid email or password"),
          403: reply("email is not verified"),
        },
      },
    },
    "/auth/forgot-password": {
      post: {
        tags: ["Password"],
        summary: "Send a password reset otp to the email",
        requestBody: bodyOf({ email: str("user@example.com") }, ["email"]),
        responses: {
          200: reply("reset otp sent if the email is registered"),
          400: reply("email is required"),
        },
      },
    },
    "/auth/reset-password": {
      post: {
        tags: ["Password"],
        summary: "Set a new password using the reset otp",
        requestBody: bodyOf(
          { email: str("user@example.com"), otp: str("123456"), newPassword: str("654321") },
          ["email", "otp", "newPassword"]
        ),
        responses: {
          200: reply("password reset successfully"),
          400: reply("invalid or expired otp, or missing fields"),
        },
      },
    },
    "/auth/change-password": {
      put: {
        tags: ["Password"],
        summary: "Change password (login required)",
        security: [{ bearerAuth: [] }],
        requestBody: bodyOf(
          { oldPassword: str("654321"), newPassword: str("123456") },
          ["oldPassword", "newPassword"]
        ),
        responses: {
          200: reply("password changed successfully"),
          400: reply("missing fields or same password"),
          401: reply("token missing or old password is incorrect"),
        },
      },
    },
    "/auth/me": {
      get: {
        tags: ["User"],
        summary: "Get the logged in user's own info (login required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: reply("user info"),
          401: reply("token missing, invalid or expired"),
        },
      },
    },
    "/auth/google": {
      get: {
        tags: ["Social Login"],
        summary: "Login with Google (open this url in the browser, not in swagger)",
        responses: { 302: reply("redirects to the google login page") },
      },
    },
    "/auth/github": {
      get: {
        tags: ["Social Login"],
        summary: "Login with GitHub (open this url in the browser, not in swagger)",
        responses: { 302: reply("redirects to the github login page") },
      },
    },
    "/users/profile": {
      get: {
        tags: ["Profile"],
        summary: "Get my profile (login required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: reply("profile info"),
          401: reply("token missing, invalid or expired"),
        },
      },
      put: {
        tags: ["Profile"],
        summary: "Update my profile, send only the fields you want to change",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  name: str("Zinuk"),
                  phone: str("01712345678"),
                  bio: { type: "string", maxLength: 200, example: "I love coding" },
                  address: str("Dhaka, Bangladesh"),
                },
              },
            },
          },
        },
        responses: {
          200: reply("profile updated successfully"),
          400: reply("nothing to update, empty name or invalid phone number"),
          401: reply("token missing or invalid"),
        },
      },
    },
    "/users/profile/picture": {
      post: {
        tags: ["Profile"],
        summary: "Upload or replace my profile picture (login required, max 2MB)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            // a file upload is sent as multipart/form-data
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["image"],
                properties: {
                  image: {
                    type: "string",
                    format: "binary",
                    description: "jpg, png or webp image, 2MB or smaller",
                  },
                },
              },
            },
          },
        },
        responses: {
          200: reply("profile picture updated, new image url returned"),
          400: reply("no image, image too big or wrong file type"),
          401: reply("token missing or invalid"),
        },
      },
    },
    "/payments/subscribe": {
      post: {
        tags: ["Payment"],
        summary: "Start premium subscription payment (login required)",
        security: [{ bearerAuth: [] }],
        responses: {
          200: reply("payment started, open the returned url in the browser"),
          400: reply("already a premium user"),
          401: reply("token missing or invalid"),
          502: reply("sslcommerz could not start the payment"),
        },
      },
    },
  },
};

module.exports = swaggerSpec;