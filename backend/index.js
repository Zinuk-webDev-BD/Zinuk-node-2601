const dns = require("dns");
// DNS server set kora hocche, jate DNS resolve er somoy kono problem na hoy
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configuration/swaggerConfig");
const dbConfig = require("./configuration/dbConfig");
const { redisConfig } = require("./configuration/redisConfig");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const groupRoutes = require("./routes/groupRoutes");
const setupSocket = require("./socket/socket");

const PORT = process.env.PORT || 8000;
const BASE_URL = process.env.BASE_URL || "/api/v1";

const app = express();

app.use(cors());
app.use(express.json());
// sslcommerz success/fail e form data pathay, tai eta lagbe (Step 19 e kaje lagbe)
app.use(express.urlencoded({ extended: true }));

// server er root route e ekta simple message pathano hocche, jate bujha jay server run korche
app.get("/", (req, res) => {
  res.json({ message: "Auth system is running" });
});

// swagger docs page, browser e /api-docs khulle API list dekha jabe
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// auth route er jonno middleware set kora hocche
app.use(BASE_URL + "/auth", authRoutes);

// user profile route
app.use(BASE_URL + "/users", userRoutes);

// friend suggestion, request and friend list route
app.use(BASE_URL + "/friends", friendRoutes);

// chat message history route
app.use(BASE_URL + "/chats", chatRoutes);

// premium payment route
app.use(BASE_URL + "/payments", paymentRoutes);
// group route
app.use(BASE_URL + "/groups", groupRoutes);
// server start er jonno function, jekhane database and redis connect kora hocche
const startServer = async () => {
  dbConfig();
  await redisConfig();

  // socket.io chalate http server lagbe
  const server = http.createServer(app);
  setupSocket(server);

  server.listen(PORT, () => {
    console.log("Server is running on: " + PORT);
  });
};

startServer();