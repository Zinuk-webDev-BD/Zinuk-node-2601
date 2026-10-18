// load .env here too, so the oauth values are ready when this file runs
require("dotenv").config();

const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const GitHubStrategy = require("passport-github2").Strategy;
const User = require("../models/User");

// find the user by email, or create a new one (used by both google and github)
const findOrCreateUser = async (email, name, provider) => {
  let user = await User.findOne({ email });

  if (!user) {
    // first time login: create a new user (the provider already verified the email)
    user = await User.create({
      name,
      email,
      isVerified: true,
      provider,
    });
  } else if (!user.isVerified) {
    // old unverified account: the provider verified the email, so mark it verified
    user.isVerified = true;
    await user.save();
  }

  return user;
};

// google login
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // get the email from the google profile
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error("google did not give an email"), null);
        }

        const user = await findOrCreateUser(email, profile.displayName, "google");
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

// github login
passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // github can hide the email, so we asked for the user:email scope above
        const email = profile.emails && profile.emails[0] && profile.emails[0].value;

        if (!email) {
          return done(new Error("github did not give an email"), null);
        }

        // some github users have no display name, so use the username instead
        const name = profile.displayName || profile.username;

        const user = await findOrCreateUser(email, name, "github");
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;