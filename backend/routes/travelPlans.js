const express = require("express");
const router = express.Router();
const TravelPlan = require("../models/TravelPlan");
const auth = require("../middleware/auth");

// Get all travel plans for current user
router.get("/", auth, async (req, res) => {
  try {
    console.log("Fetching travel plans for user:", req.user._id);

    const travelPlans = await TravelPlan.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });

    console.log(`Found ${travelPlans.length} travel plans`);
    res.json(travelPlans);
  } catch (error) {
    console.error("Error in GET /travel-plans:", error);
    res.status(500).json({
      message: "Failed to fetch travel plans",
      error: error.message,
    });
  }
});

// Create new travel plan
router.post("/", auth, async (req, res) => {
  try {
    const {
      destination,
      budget,
      tripDuration,
      itinerary,
      recommendations,
      budgetBreakdown,
    } = req.body;

    const newTravelPlan = new TravelPlan({
      userId: req.user._id,
      destination,
      budget: Number(budget),
      tripDuration: Number(tripDuration),
      itinerary,
      recommendations,
      budgetBreakdown,
    });

    const savedPlan = await newTravelPlan.save();
    res.status(201).json(savedPlan);
  } catch (error) {
    console.error("Error in POST /travel-plans:", error);
    res.status(500).json({
      message: "Failed to create travel plan",
      error: error.message,
    });
  }
});

// Get a specific travel plan
router.get("/:id", auth, async (req, res) => {
  try {
    console.log("Fetching travel plan with ID:", req.params.id);
    console.log("User ID:", req.user._id);

    const travelPlan = await TravelPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!travelPlan) {
      console.log("Travel plan not found");
      return res.status(404).json({
        message: "Travel plan not found",
        details: "No travel plan found with the specified ID for this user",
      });
    }

    console.log("Travel plan found:", travelPlan._id);
    res.json(travelPlan);
  } catch (error) {
    console.error("Error fetching travel plan:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid travel plan ID format",
        details: error.message,
      });
    }

    res.status(500).json({
      message: "Server error while fetching travel plan",
      error: error.message,
    });
  }
});

module.exports = router;
