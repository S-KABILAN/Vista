const axios = require("axios");
const jwt = require("jsonwebtoken");

// Base URL for API requests
const API_URL = "http://localhost:5000";

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

// Tests direct authentication, token structure, and collaboration endpoints
async function testDirectAuth() {
  try {
    console.log("🔍 Testing Authentication Flow");
    console.log("----------------------------");

    // Step 1: Login
    console.log("\n1️⃣ Logging in with test user credentials");
    let response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);

    if (!response.data || !response.data.token) {
      throw new Error("Login failed - No token received");
    }

    const token = response.data.token;
    console.log("✅ Login successful");
    console.log("Token received:", token.substring(0, 15) + "...");

    // Step 2: Decode and examine token
    console.log("\n2️⃣ Examining token structure");
    try {
      const decoded = jwt.decode(token);
      console.log("Token payload:", JSON.stringify(decoded, null, 2));
      console.log(
        "User ID in token:",
        decoded.id || decoded._id || "Not found"
      );
      console.log(
        "Token expiry:",
        new Date(decoded.exp * 1000).toLocaleString()
      );
      console.log("✅ Token structure looks valid");
    } catch (error) {
      console.error("❌ Error decoding token:", error.message);
      throw new Error("Token structure validation failed");
    }

    // Step 3: Test a protected endpoint
    console.log("\n3️⃣ Testing protected user profile endpoint");
    try {
      response = await axios.get(`${API_URL}/api/auth/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("User profile data:", response.data);
      console.log("✅ Protected endpoint access successful");
    } catch (error) {
      console.error("❌ Protected endpoint access failed:", error.message);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
      throw new Error("Protected endpoint test failed");
    }

    // Step 4: Test creating a travel plan
    console.log("\n4️⃣ Creating a test travel plan");
    try {
      response = await axios.post(
        `${API_URL}/api/travel-plans`,
        {
          destination: "Auth Test City",
          budget: 1000,
          tripDuration: 5,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const planId = response.data.travelPlan._id;
      console.log("✅ Travel plan created with ID:", planId);

      // Step 5: Test collaboration endpoint
      console.log("\n5️⃣ Testing collaboration debug endpoint");
      response = await axios.get(`${API_URL}/api/collaboration/debug`);
      console.log("Response:", response.data);
      console.log("✅ Collaboration debug endpoint works");

      // Step 6: Test adding a collaborator
      console.log("\n6️⃣ Testing adding a collaborator");
      try {
        response = await axios.post(
          `${API_URL}/api/collaboration/${planId}/collaborators`,
          { email: "collab1@example.com", accessLevel: "view" },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log("✅ Collaborator added successfully");
        console.log("Response:", response.data);
      } catch (error) {
        console.error("❌ Adding collaborator failed:", error.message);
        if (error.response) {
          console.error("Status:", error.response.status);
          console.error("Data:", error.response.data);
        }
      }
    } catch (error) {
      console.error("❌ Travel plan creation failed:", error.message);
      if (error.response) {
        console.error("Status:", error.response.status);
        console.error("Data:", error.response.data);
      }
    }

    console.log("\n✅ Authentication test completed");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
  }
}

// Run the test
testDirectAuth();
