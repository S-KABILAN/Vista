const axios = require("axios");

// API URL
const API_URL = "http://localhost:5000";

// Test user credentials
const TEST_USER = {
  email: "test@example.com",
  password: "password123",
};

async function testLogin() {
  try {
    console.log("Attempting to login with:", TEST_USER.email);

    const response = await axios.post(`${API_URL}/api/auth/login`, TEST_USER);

    console.log("Login successful!");
    console.log(
      "Token:",
      response.data.token ? "Token received" : "No token in response"
    );
    console.log(
      "User:",
      response.data.user ? response.data.user.fullName : "No user in response"
    );

    return response.data;
  } catch (error) {
    console.error("Login failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

// Run the test
testLogin();
