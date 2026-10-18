const dns = require("dns");
// DNS সবার আগে সেট করছি, যাতে Atlas কানেক্ট হতে সমস্যা না হয়
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

// সার্ভার চলছে কিনা দেখার জন্য টেস্ট রুট
app.get("/", (req, res) => {
  res.json({ message: "Auth system is running" });
});

// আগে ডাটাবেস ও Redis কানেক্ট হবে, তারপর সার্ভার চালু হবে
const startServer = async () => {
  dbConfig();
  await redisConfig();

  app.listen(PORT, () => {
    console.log("Server is running on: " + PORT);
  });
};

startServer();

