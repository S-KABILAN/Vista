// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const bodyParser = require("body-parser");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const travelPlanRoutes = require("./routes/travelPlans");
const { configurePassport } = require("./config/passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const Amadeus = require("amadeus");
const hotelRoutes = require('./routes/hotelRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Amadeus API client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "YOUR_AMADEUS_API_KEY_HERE",
  clientSecret:
    process.env.AMADEUS_API_SECRET || "YOUR_AMADEUS_API_SECRET_HERE",
});

// Middleware
app.use(
  cors({
    origin: "*", // Be more restrictive in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport BEFORE configuring it
app.use(passport.initialize());

// Configure passport strategies
configurePassport(passport);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/vista-travel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/travel-plans", travelPlanRoutes);
app.use('/api/hotels', hotelRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("Vista Travel API is running");
});

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  console.log(
    `For device access: Use your machine's IP address and port ${PORT}`
  );
});
