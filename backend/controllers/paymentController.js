const SSLCommerzPayment = require("sslcommerz-lts");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const User = require("../models/User");

// premium subscription er dam (taka)
const PREMIUM_AMOUNT = 100;

// sslcommerz er config .env theke nichhi
const storeId = process.env.SSLCZ_STORE_ID;
const storePassword = process.env.SSLCZ_STORE_PASSWORD;
const isLive = process.env.SSLCZ_IS_LIVE === "true";

// subscribe button e click korle ei function chalbe, payment shuru korbe
const initPayment = async (req, res) => {
  try {
    const user = req.user;

    // already premium hole abar payment korar dorkar nai
    if (user.isPremium) {
      return res.status(400).json({ message: "you are already a premium user" });
    }

    // unique transaction id banachhi
    const transactionId = "TXN_" + crypto.randomBytes(8).toString("hex");

    // age database e pending payment save kore rakhchi
    await Payment.create({
      user: user._id,
      transactionId,
      amount: PREMIUM_AMOUNT,
      status: "pending",
    });

    // sslcommerz ke ja ja pathate hobe
    const data = {
      total_amount: PREMIUM_AMOUNT,
      currency: "BDT",
      tran_id: transactionId,
      // payment er por sslcommerz ei url gulo te user ke pathabe
      success_url: `${process.env.SERVER_URL}/api/v1/payments/success/${transactionId}`,
      fail_url: `${process.env.SERVER_URL}/api/v1/payments/fail/${transactionId}`,
      cancel_url: `${process.env.SERVER_URL}/api/v1/payments/cancel/${transactionId}`,
      ipn_url: `${process.env.SERVER_URL}/api/v1/payments/ipn`,
      shipping_method: "NO",
      product_name: "Premium Subscription",
      product_category: "Subscription",
      product_profile: "general",
      cus_name: user.name,
      cus_email: user.email,
      cus_add1: user.address || "Dhaka",
      cus_city: "Dhaka",
      cus_country: "Bangladesh",
      cus_phone: user.phone || "01700000000",
    };

    const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
    const apiResponse = await sslcz.init(data);

    // sslcommerz payment page er link dile seta frontend ke pathai
    if (apiResponse && apiResponse.GatewayPageURL) {
      return res.status(200).json({
        message: "payment started",
        url: apiResponse.GatewayPageURL,
      });
    }

    // link na ele payment ta failed mark kore dichhi
    await Payment.findOneAndUpdate({ transactionId }, { status: "failed" });
    res.status(502).json({
      message: "could not start payment",
      reason: apiResponse && apiResponse.failedreason,
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// payment shesh hole user ke frontend er premium page e pathai
const redirectToClient = (res, status) => {
  res.redirect(`${process.env.CLIENT_URL}/premium?status=${status}`);
};

// payment successful hole sslcommerz user ke ekhane pathabe
const paymentSuccess = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { val_id } = req.body;

    const payment = await Payment.findOne({ transactionId });
    if (!payment) {
      return redirectToClient(res, "failed");
    }

    // age e success hoye thakle abar kichu korar dorkar nai
    if (payment.status === "success") {
      return redirectToClient(res, "success");
    }

    // sslcommerz ke jiggesh kore nishchit hocchi je payment sotti hoyeche
    const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
    const validation = await sslcz.validate({ val_id });

    const isPaid =
      validation &&
      (validation.status === "VALID" || validation.status === "VALIDATED") &&
      validation.tran_id === transactionId &&
      Number(validation.amount) === payment.amount;

    if (!isPaid) {
      payment.status = "failed";
      await payment.save();
      return redirectToClient(res, "failed");
    }

    // payment sotti hole record update kore user ke premium kore dichhi
    payment.status = "success";
    payment.valId = val_id;
    await payment.save();
    await User.findByIdAndUpdate(payment.user, { isPremium: true });

    redirectToClient(res, "success");
  } catch (error) {
    redirectToClient(res, "failed");
  }
};

// payment fail hole
const paymentFail = async (req, res) => {
  await Payment.findOneAndUpdate(
    { transactionId: req.params.transactionId, status: "pending" },
    { status: "failed" }
  );
  redirectToClient(res, "failed");
};

// user payment cancel korle
const paymentCancel = async (req, res) => {
  await Payment.findOneAndUpdate(
    { transactionId: req.params.transactionId, status: "pending" },
    { status: "cancelled" }
  );
  redirectToClient(res, "cancelled");
};

module.exports = { initPayment, paymentSuccess, paymentFail, paymentCancel };