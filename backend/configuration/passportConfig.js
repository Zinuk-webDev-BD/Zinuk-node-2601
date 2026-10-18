// load .env here too, so the google values are ready when this file runs
require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

// tell passport how to log in users with google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    // this function runs after google confirms the user
    async (accessToken, refreshToken, profile, done) => {
      try {
        // get the email from the google profile
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error("google did not give an email"), null);
        }

        // check if a user with this email already exists
        let user = await User.findOne({ email });

        if (!user) {
          // first time login: create a new user (google already verified the email)
          user = await User.create({
            name: profile.displayName,
            email,
            isVerified: true,
            provider: "google",
          });
        } else if (!user.isVerified) {
          // old unverified account: google verified the email, so mark it verified
          user.isVerified = true;
          await user.save();
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;