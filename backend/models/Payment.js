const mongoose = require("mongoose");

// prottek payment er record ekhane save thakbe
const paymentSchema = new mongoose.Schema(
  {
    // kon user payment korche
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // SSLCommerz e pathanor jonno unique id, amra nijera banai
    transactionId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // pending: shuru hoyeche, success: payment hoyeche, failed/cancelled: hoy ni
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
    },
    // SSLCommerz theke asha validation id (success hole save hobe)
    valId: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);