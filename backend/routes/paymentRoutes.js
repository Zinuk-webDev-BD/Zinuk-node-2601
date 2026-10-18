const express = require("express");
const { initPayment } = require("../controllers/paymentController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/v1/payments/subscribe (only for logged in users)
router.post("/subscribe", authMiddleware, initPayment);

module.exports = router;