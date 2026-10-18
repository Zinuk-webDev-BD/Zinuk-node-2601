const bcrypt = require("bcrypt");
const User = require("../models/User");
const { redisClient } = require("../configuration/redisConfig");
const generateOtp = require("../helpers/generateOtp");
const sendEmail = require("../helpers/sendEmail");

// OTP expire time 5min set kora hocche, jate user OTP verify korte pare
const OTP_EXPIRE_SECONDS = 300;

// new user register er jonno function, jekhane name, email and password check kora hocche, then user create kora hocche, OTP generate kora hocche, Redis e save kora hocche and user er email e pathano hocche
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "name, email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "password must be at least 6 characters" });
    }

    // email already exist kore kina check kora hocche, jodi thake tahole 409 status code pathano hocche
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

    // OTP generate kora hocche, Redis e save kora hocche, and user er email e pathano hocche
    const otp = generateOtp();
    await redisClient.set(`otp:${user.email}`, otp, { EX: OTP_EXPIRE_SECONDS });

    // user er email e OTP pathano hocche
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

// OTP verification er jonno function, jekhane user er email and otp check kora hocche
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

    // Redis theke OTP check kora hocche, jodi expire hoye jai ba na thake, tahole error pathano hocche
    const savedOtp = await redisClient.get(`otp:${user.email}`);
    if (!savedOtp) {
      return res.status(400).json({ message: "otp expired or not found" });
    }

    if (savedOtp !== otp.toString()) {
      return res.status(400).json({ message: "invalid otp" });
    }

    // user.isVerified true kore save kora hocche, and Redis theke OTP delete kora hocche
    user.isVerified = true;
    await user.save();
    await redisClient.del(`otp:${user.email}`);

    res.status(200).json({ message: "email verified successfully" });
  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message });
  }
};

module.exports = { register, verifyOtp };