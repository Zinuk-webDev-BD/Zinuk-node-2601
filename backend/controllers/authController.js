const bcrypt = require("bcrypt");
const User = require("../models/User");
const { redisClient } = require("../configuration/redisConfig");
const generateOtp = require("../helpers/generateOtp");
const sendEmail = require("../helpers/sendEmail");
const generateToken = require("../helpers/generateToken");

// OTP কতক্ষণ Redis এ থাকবে (৫ মিনিট = ৩০০ সেকেন্ড)
const OTP_EXPIRE_SECONDS = 300;

// নতুন ইউজার রেজিস্ট্রেশন + OTP পাঠানো
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    // এই ইমেইলে আগে থেকে অ্যাকাউন্ট আছে কিনা দেখছি
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // OTP বানিয়ে Redis এ ৫ মিনিটের জন্য রাখছি (EX = expire, সেকেন্ডে)
    const otp = generateOtp();
    await redisClient.set(`otp:${user.email}`, otp, { EX: OTP_EXPIRE_SECONDS });

    // ইউজারের ইমেইলে OTP পাঠাচ্ছি
    await sendEmail(
      user.email,
      "Verify your email",
      `<h2>Hello ${user.name}</h2>
       <p>Your verification code is:</p>
       <h1>${otp}</h1>
       <p>This code will expire in 5 minutes.</p>`
    );

    res.status(201).json({
      message: "registered successfully, OTP sent to your email",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// OTP মিলিয়ে ইমেইল ভেরিফাই করার ফাংশন
const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "email and otp are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "email is already verified" });
    }

    // Redis থেকে OTP আনছি। ৫ মিনিট পার হলে এটা null আসবে
    const savedOtp = await redisClient.get(`otp:${user.email}`);
    if (!savedOtp) {
      return res.status(400).json({ message: "otp expired or not found" });
    }

    if (savedOtp !== otp.toString()) {
      return res.status(400).json({ message: "invalid otp" });
    }

    // সঠিক হলে ইউজারকে verified করছি, আর Redis থেকে OTP মুছে দিচ্ছি
    user.isVerified = true;
    await user.save();
    await redisClient.del(`otp:${user.email}`);

    res.status(200).json({ message: "email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

// লগইনের ফাংশন
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    // Google/GitHub ইউজারের পাসওয়ার্ড নেই, তাই তাদের এখানে আটকাচ্ছি
    if (!user.password) {
      return res.status(400).json({ message: "this account uses social login" });
    }

    // পাসওয়ার্ড মিলছে কিনা দেখছি
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "invalid email or password" });
    }

    // ইমেইল verified না হলে লগইন করতে দেব না
    if (!user.isVerified) {
      return res.status(403).json({ message: "please verify your email first" });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      message: "login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { register, verifyOtp, login };