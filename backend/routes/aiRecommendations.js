const express = require("express");
const router = express.Router();
const {
  generateAIRecommendations,
  getEmergencyFallbackPlan,
} = require("../services/aiRecommendationService");

// AI recommendations endpoint
router.get("/", async (req, res) => {
  try {
    console.log("Received AI recommendation request:", {
      destination: req.query.destination,
      budget: req.query.budget,
      tripDuration: req.query.tripDuration,
    });

    if (!req.query.destination) {
      return res.status(400).json({
        error: "Missing required parameter",
        message: "Destination is required",
      });
    }

    const result = await generateAIRecommendations(req);
    return res.json(result);
  } catch (error) {
    console.error("Server error in AI recommendations endpoint:", error);

    // Use the emergency fallback without real data
    try {
      console.log("Attempting to generate fallback plan...");
      const fallbackResult = await getEmergencyFallbackPlan(
        req.query.destination,
        req.query.budget,
        req.query.tripDuration
      );
      return res.json({
        ...fallbackResult,
        warning: "Using fallback plan due to error: " + error.message,
      });
    } catch (finalError) {
      console.error("Failed to generate fallback plan:", finalError);
      return res.status(500).json({
        error: "Failed to generate AI recommendations",
        message: error.message,
        details: "Both primary and fallback methods failed",
      });
    }
  }
});

module.exports = router;
