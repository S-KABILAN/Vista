// Test script for AI recommendations endpoint
const axios = require("axios");

async function testAIRecommendations() {
  try {
    console.log("Testing AI recommendations endpoint...");

    const response = await axios.get(
      "http://localhost:5000/api/ai-recommendations",
      {
        params: {
          destination: "Paris",
          budget: 2000,
          tripDuration: 5,
        },
      }
    );

    console.log("Response received:", response.status);
    console.log("Response data sample:");
    console.log("- Destination:", response.data.destination);
    console.log("- Budget:", response.data.budget);
    console.log(
      "- AI Suggestion:",
      response.data.aiSuggestion ? "Present" : "Not present"
    );
    console.log(
      "- Number of recommendations:",
      response.data.recommendations?.length || 0
    );
    console.log(
      "- Number of itinerary days:",
      response.data.itinerary?.length || 0
    );

    if (response.data.error) {
      console.log("ERROR:", response.data.error);
      console.log("Message:", response.data.message);
    }

    if (response.data.destinationData) {
      console.log("\nDestination Data:");
      console.log(
        "- Details:",
        response.data.destinationData.details ? "Present" : "Not present"
      );
      console.log(
        "- Attractions:",
        (response.data.destinationData.topAttractions?.length || 0) + " items"
      );
      console.log(
        "- Restaurants:",
        (response.data.destinationData.topRestaurants?.length || 0) + " items"
      );
      console.log(
        "- Hotels:",
        (response.data.destinationData.recommendedHotels?.length || 0) +
          " items"
      );
    }

    console.log("\nTest completed successfully");
  } catch (error) {
    console.error("Error testing endpoint:");
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response received from server");
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error("Request error:", error.message);
    }
  }
}

// Run the test
testAIRecommendations();
