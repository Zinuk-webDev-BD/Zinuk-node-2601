const bcrypt = require("bcrypt");
const User = require("../models/User");

// user registration er jonno controller
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // name, email, password sob gula field thakte hobe
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "name, email and password are required" });
    }

    // password minimum 6 character hote hobe
    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "password minimum 6 character" });
    }

    // email already ache kina check korchi
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "email already in use" });
    }

    // pass hash kora hocche, 10 rounds diye
    const hashedPassword = await bcrypt.hash(password, 10);

    // database e user create kora hocche
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    // pass hash kore user create korar por response e user er info pathano hocche, password chara
    res.status(201).json({
      message: "successfully registered",
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

module.exports = { register };