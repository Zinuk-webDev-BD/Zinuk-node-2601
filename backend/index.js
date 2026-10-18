const dns = require("dns");
// DNS server set kora hocche, jate DNS resolve er somoy kono problem na hoy
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./configuration/swaggerConfig");
const dbConfig = require("./configuration/dbConfig");
const { redisConfig } = require("./configuration/redisConfig");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");

const PORT = process.env.PORT || 8000;
const BASE_URL = process.env.BASE_URL || "/api/v1";

const app = express();

app.use(cors());
app.use(express.json());

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

// server start er jonno function, jekhane database and redis connect kora hocche
const startServer = async () => {
  dbConfig();
  await redisConfig();

  app.listen(PORT, () => {
    console.log("Server is running on: " + PORT);
  });
};

startServer();