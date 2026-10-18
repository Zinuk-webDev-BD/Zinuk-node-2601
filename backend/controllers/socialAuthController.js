const generateToken = require("../helpers/generateToken");

// runs after google login succeeds (passport puts the user in req.user)
const googleCallback = (req, res) => {
  const token = generateToken(req.user._id);

  res.status(200).json({
    message: "google login successful",
    token,
    user: {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
    },
  });
};

// runs if google login fails or the user cancels
const googleFailure = (req, res) => {
  res.status(401).json({ message: "google login failed" });
};

module.exports = { googleCallback, googleFailure };