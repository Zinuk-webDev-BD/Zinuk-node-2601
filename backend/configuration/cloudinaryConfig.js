// load .env here too, so the cloudinary values are ready when this file runs
require("dotenv").config();

const cloudinary = require("cloudinary").v2;

// connect to our cloudinary account
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

module.exports = cloudinary;