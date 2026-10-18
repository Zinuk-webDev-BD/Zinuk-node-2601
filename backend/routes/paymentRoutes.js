const express = require("express");
const {
  initPayment,
  paymentSuccess,
  paymentFail,
  paymentCancel,
} = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/v1/payments/subscribe (only for logged in users)
router.post("/subscribe", authMiddleware, initPayment);

// sslcommerz user ke ei 3 ta route e pathay, tai login token lagbe na
router.post("/success/:transactionId", paymentSuccess);
router.post("/fail/:transactionId", paymentFail);
router.post("/cancel/:transactionId", paymentCancel);

module.exports = router;