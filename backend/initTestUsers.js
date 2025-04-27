const mongoose = require("mongoose");
const User = require("./models/User");
const bcrypt = require("bcrypt");

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/vista-travel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected for test user initialization");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Test users to create
const testUsers = [
  {
    fullName: "Test User",
    email: "test@example.com",
    password: "password123",
  },
  {
    fullName: "Collaborator One",
    email: "collab1@example.com",
    password: "password123",
  },
  {
    fullName: "Collaborator Two",
    email: "collab2@example.com",
    password: "password123",
  },
];

// Function to create test users
const createTestUsers = async () => {
  try {
    // Clear existing test users first
    await User.deleteMany({
      email: { $in: testUsers.map((user) => user.email) },
    });
    console.log("Cleared existing test users");

    // Create new test users
    for (const userData of testUsers) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);

      const user = new User({
        fullName: userData.fullName,
        email: userData.email,
        password: hashedPassword,
      });

      await user.save();
      console.log(`Created test user: ${userData.email}`);
    }

    console.log("All test users created successfully");

    // List all users in the database
    const allUsers = await User.find({}, "fullName email _id");
    console.log("All users in database:");
    allUsers.forEach((user) => {
      console.log(`- ${user.fullName} (${user.email}), ID: ${user._id}`);
    });

    process.exit(0);
  } catch (error) {
    console.error("Error creating test users:", error);
    process.exit(1);
  }
};

// Run the function
createTestUsers();
