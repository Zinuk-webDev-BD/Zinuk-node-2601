const mongoose = require("mongoose");

// mongodb r sathe connect korte function
const dbConfig = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log("MongoDB error:", err.message));
};

module.exports = dbConfig;