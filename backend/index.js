const dns = require("dns");
// DNS 1st ei save kore rakha hocche, jate DNS resolve korte kono problem na hoy.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const dbConfig = require("./configuration/dbConfig");
const { redisConfig } = require("./configuration/redisConfig");

const PORT = process.env.PORT || 8000;

const app = express();

app.use(cors());
app.use(express.json());

// server choltece kina check korte route
app.get("/", (req, res) => {
  res.json({ message: "Auth system is running" });
});

// 1st e MongoDB er sathe connect hobe, tarpor Redis er sathe connect hobe, tarpor server start hobe
const startServer = async () => {
  dbConfig();
  await redisConfig();

  app.listen(PORT, () => {
    console.log("Server is running on: " + PORT);
  });
};

startServer();

