const axios = require("axios");
const mongoose = require("mongoose");
const User = require("./models/User");
const TravelPlan = require("./models/TravelPlan");

// Base URL for API requests
const API_URL = "http://localhost:5000";

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

// Variable to store authentication token
let authToken = "";
let userId = "";
let testPlanId = "";

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/vista-travel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected for testing");
    runTests();
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

// Function to run all tests
async function runTests() {
  try {
    // Step 1: Login to get auth token
    await login();

    // Step 2: Get user ID
    await getUserId();

    // Step 3: Create a test travel plan
    await createTestPlan();

    // Step 4: Test the debug endpoint
    await testDebugEndpoint();

    // Step 5: Test adding a collaborator
    await testAddCollaborator();

    console.log("\n✅ All tests completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    process.exit(1);
  }
}

// Login to get auth token
async function login() {
  console.log("\n🔑 Logging in as test user...");
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log("✅ Login successful, token obtained");
  } catch (error) {
    console.error("❌ Login failed:", error.message);
    throw error;
  }
}

// Get user ID from database
async function getUserId() {
  console.log("\n👤 Getting user ID from database...");
  try {
    const user = await User.findOne({ email: TEST_USER.email });
    if (!user) {
      throw new Error("User not found in database");
    }
    userId = user._id.toString();
    console.log(`✅ User ID: ${userId}`);
  } catch (error) {
    console.error("❌ Failed to get user ID:", error.message);
    throw error;
  }
}

// Create a test travel plan
async function createTestPlan() {
  console.log("\n📝 Creating test travel plan...");

  // First check if test plan already exists
  const existingPlan = await TravelPlan.findOne({
    userId: userId,
    destination: "Test Collaboration City",
  });

  if (existingPlan) {
    testPlanId = existingPlan._id.toString();
    console.log(`✅ Using existing test plan with ID: ${testPlanId}`);
    return;
  }

  // Create new plan if doesn't exist
  try {
    const newPlan = new TravelPlan({
      userId: userId,
      destination: "Test Collaboration City",
      budget: 1500,
      tripDuration: 7,
      itinerary: [
        { day: 1, activities: "Arrival and hotel check-in" },
        { day: 2, activities: "City tour and local cuisine" },
      ],
    });

    await newPlan.save();
    testPlanId = newPlan._id.toString();
    console.log(`✅ Created new test plan with ID: ${testPlanId}`);
  } catch (error) {
    console.error("❌ Failed to create test plan:", error.message);
    throw error;
  }
}

// Test the debug endpoint
async function testDebugEndpoint() {
  console.log("\n🔍 Testing collaboration debug endpoint...");
  try {
    const response = await axios.get(`${API_URL}/api/collaboration/debug`);
    console.log("✅ Debug endpoint response:", response.data.message);
  } catch (error) {
    console.error("❌ Debug endpoint failed:", error.message);
    throw error;
  }
}

// Test adding a collaborator
async function testAddCollaborator() {
  console.log("\n👥 Testing add collaborator endpoint...");
  try {
    const collaboratorEmail = "collab1@example.com";
    const response = await axios.post(
      `${API_URL}/api/collaboration/${testPlanId}/collaborators`,
      { email: collaboratorEmail, accessLevel: "view" },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );

    console.log("✅ Collaborator added successfully:", response.data.message);

    // Verify collaborator was added in database
    const updatedPlan = await TravelPlan.findById(testPlanId);
    const collaborators = updatedPlan.collaborators.length;
    console.log(`✅ Plan now has ${collaborators} collaborator(s)`);
  } catch (error) {
    console.error("❌ Add collaborator failed:", error.message);
    throw error;
  }
}
