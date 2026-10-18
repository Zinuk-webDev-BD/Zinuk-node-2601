const { createClient } = require("redis");

// Redis ক্লায়েন্ট বানাচ্ছি, OTP এখানে ৫ মিনিটের জন্য থাকবে
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// কোনো সমস্যা হলে টার্মিনালে দেখাবে
redisClient.on("error", (err) => console.log("Redis error:", err.message));

// Redis এর সাথে কানেক্ট করার ফাংশন
const redisConfig = async () => {
  await redisClient.connect();
  console.log("Redis connected");
};

module.exports = { redisClient, redisConfig };