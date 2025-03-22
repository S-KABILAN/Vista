const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/User");

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRY = "7d";

// Generate JWT token
const generateToken = (user) => {
  const payload = {
    id: user._id.toString(),  // Ensure ID is a string and consistently named
    _id: user._id.toString(), // Include both formats for compatibility
    email: user.email,
  };
  
  console.log("JWT payload created:", { ...payload, id_type: typeof payload.id });
  
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
};

// Register new user
router.post("/register", async (req, res) => {
  try {
    const { fullName, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user
    const newUser = new User({
      fullName,
      email,
      password,
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Login user
router.post("/login", async (req, res) => {
  try {
    console.log("Login attempt for:", req.body.email);
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found: ${email}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Check if password exists (user might have registered with Google)
    if (!user.password) {
      console.log(`User ${email} has no password (Google auth user)`);
      return res.status(400).json({ message: "Please login with Google" });
    }

    // Validate password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Invalid password for user: ${email}`);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log(`User authenticated successfully: ${email} (ID: ${user._id})`);

    // Generate token
    const token = generateToken(user);
    console.log(
      `Token generated for user ${email}, payload includes ID: ${user._id}`
    );

    res.json({
      token,
      user: {
        id: user._id.toString(), // Explicitly convert to string to ensure consistency
        _id: user._id.toString(), // Include both formats for compatibility
        fullName: user.fullName,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Google Auth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    // Redirect to app with token
    res.redirect(`vista-travel://auth?token=${token}&userId=${req.user._id}`);
  }
);

// Get current user
router.get(
  "/current",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      id: req.user._id,
      fullName: req.user.fullName,
      email: req.user.email,
      profileImage: req.user.profileImage,
    });
  }
);

module.exports = router;
