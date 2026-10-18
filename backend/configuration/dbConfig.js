const mongoose = require("mongoose");

// MongoDB এর সাথে কানেক্ট করার ফাংশন
const dbConfig = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error:", err.message));
};

module.exports = dbConfig;