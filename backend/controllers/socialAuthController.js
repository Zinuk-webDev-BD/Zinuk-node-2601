const generateToken = require("../helpers/generateToken");

// runs after a social login succeeds (passport puts the user in req.user)
const socialLoginSuccess = (req, res) => {
  const token = generateToken(req.user._id);

  res.status(200).json({
    message: "social login successful",
    token,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};

// runs if the social login fails or the user cancels
const socialLoginFailure = (req, res) => {
  res.status(401).json({ message: "social login failed" });
};

module.exports = { socialLoginSuccess, socialLoginFailure };