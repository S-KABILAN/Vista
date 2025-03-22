const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  "http://localhost:5000/api/auth/google/callback";

const configurePassport = (passport) => {
  // JWT Strategy for token authentication
  const jwtOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  };

  console.log("Configuring passport JWT strategy with options:", {
    ...jwtOptions,
    secretOrKey: JWT_SECRET ? "SECRET_SET" : "DEFAULT_SECRET_USED",
  });

  passport.use(
    new JwtStrategy(jwtOptions, async (payload, done) => {
      try {
        console.log("JWT payload received:", JSON.stringify(payload));
        // Check both payload.id and payload._id to handle different token formats
        const userId = payload.id || payload._id;

        if (!userId) {
          console.log("No user ID in JWT payload");
          return done(null, false);
        }

        console.log("Looking for user with ID:", userId);
        const user = await User.findById(userId);

        if (user) {
          console.log("User found:", user.email);
          return done(null, user);
        }

        console.log("No user found with ID:", userId);
        return done(null, false);
      } catch (error) {
        console.error("JWT strategy error:", error);
        return done(error, false);
      }
    })
  );

  // Google OAuth Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: GOOGLE_CLIENT_ID,
        clientSecret: GOOGLE_CLIENT_SECRET,
        callbackURL: GOOGLE_CALLBACK_URL,
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // Check if user already exists
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            return done(null, user);
          }

          // Create new user if doesn't exist
          user = new User({
            googleId: profile.id,
            fullName: profile.displayName,
            email: profile.emails[0].value,
            profileImage: profile.photos[0].value,
          });

          await user.save();
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};

module.exports = { configurePassport };
