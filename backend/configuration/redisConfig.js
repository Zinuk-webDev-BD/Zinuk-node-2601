const { createClient } = require("redis");

// Redis jno 5min por ecpire hoy na, tai ei config ta kora hocche
const redisClient = createClient({
  url: process.env.REDIS_URL,
});

// kono prblm hole error console e show korbe
redisClient.on("error", (err) => console.log("Redis error:", err.message));

// Redis er sahte connect er func
const redisConfig = async () => {
  await redisClient.connect();
  console.log("Redis connected");
};

module.exports = { redisClient, redisConfig };