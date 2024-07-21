const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userSchema');
require('dotenv').config();

passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: `http://localhost:${process.env.APP_PORT}/auth/google/callback`
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Find a user by googleId
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        // User found with googleId, proceed with login
        return done(null, user);
      } 
      
      // If no user is found with googleId, find by email
      user = await User.findOne({ email: profile.emails[0].value });

      if (user) {
        // User found with email, link googleId to this user
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      // If no user is found by both googleId and email, create a new user
      const newUser = new User({
        googleId: profile.id,
        firstname: profile.name.givenName,
        lastname: profile.name.familyName,
        email: profile.emails[0].value,
        isVerified: true,
        isBlocked: false,
        isAdmin: false,
      });

      user = await newUser.save();
      return done(null, user);

    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
