const axios = require("axios");

// Change this to your server's IP and port
const SERVER_URL = "http://192.168.0.XXX:3001"; // Replace with your actual IP

async function testConnection() {
  try {
    console.log("Testing connection to", SERVER_URL);
    const response = await axios.get(`${SERVER_URL}/ping`);
    console.log("Connection successful:", response.data);
    return true;
  } catch (error) {
    console.error("Connection failed:", error.message);
    return false;
  }
}

async function testAIRecommendations() {
  if (!(await testConnection())) {
    console.log("Skipping AI test because connection test failed");
    return;
  }

  try {
    console.log("Testing AI recommendations endpoint...");
    const response = await axios.get(`${SERVER_URL}/api/ai-recommendations`, {
      params: {
        destination: "Paris",
        budget: 1000,
        tripDuration: 3,
      },
    });
    console.log("AI recommendations test successful!");
    console.log(
      "Sample data:",
      JSON.stringify(response.data, null, 2).substring(0, 200) + "..."
    );
  } catch (error) {
    console.error("AI recommendations test failed:", error.message);
    if (error.response) {
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    }
  }
}

// Run the tests
(async () => {
  await testConnection();
  await testAIRecommendations();
})();
