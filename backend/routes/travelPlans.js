const express = require("express");
const router = express.Router();
const passport = require("passport");
const TravelPlan = require("../models/TravelPlan");

// Simplified auth middleware
const auth = passport.authenticate("jwt", { session: false });

// Get all travel plans for current user
router.get("/", auth, async (req, res) => {
  try {
    console.log("GET /api/travel-plans authenticated user:", req.user?._id);

    if (!req.user || !req.user._id) {
      console.error("No valid user found in request object");
      return res
        .status(401)
        .json({ message: "User not authenticated properly" });
    }

    const travelPlans = await TravelPlan.find({ userId: req.user._id });
    console.log(
      `Found ${travelPlans.length} travel plans for user ${req.user._id}`
    );
    res.json(travelPlans);
  } catch (error) {
    console.error("Error fetching travel plans:", error);

    // Handle specific error types
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid user ID format",
        details: error.message,
      });
    }

    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        details: error.message,
      });
    }

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
});

// Get a specific travel plan
router.get("/:id", auth, async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    res.json(travelPlan);
  } catch (error) {
    console.error("Error fetching travel plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a new travel plan
router.post("/", auth, async (req, res) => {
  try {
    const {
      destination,
      budget,
      tripDuration,
      startDate,
      endDate,
      itinerary,
      recommendations,
      budgetBreakdown,
    } = req.body;

    const newTravelPlan = new TravelPlan({
      userId: req.user._id,
      destination,
      budget,
      tripDuration,
      startDate,
      endDate,
      itinerary,
      recommendations,
      budgetBreakdown,
    });

    const savedTravelPlan = await newTravelPlan.save();
    res.status(201).json(savedTravelPlan);
  } catch (error) {
    console.error("Error creating travel plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update a travel plan
router.put("/:id", auth, async (req, res) => {
  try {
    const {
      destination,
      budget,
      tripDuration,
      startDate,
      endDate,
      itinerary,
      recommendations,
      budgetBreakdown,
      isBookmarked,
    } = req.body;

    // Find the travel plan and check ownership
    let travelPlan = await TravelPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Update the fields
    const updateData = {
      destination,
      budget,
      tripDuration,
      startDate,
      endDate,
      itinerary,
      recommendations,
      budgetBreakdown,
      isBookmarked,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach(
      (key) => updateData[key] === undefined && delete updateData[key]
    );

    // Update and return the updated travel plan
    travelPlan = await TravelPlan.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );

    res.json(travelPlan);
  } catch (error) {
    console.error("Error updating travel plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Toggle bookmark status
router.patch("/:id/bookmark", auth, async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    travelPlan.isBookmarked = !travelPlan.isBookmarked;
    await travelPlan.save();

    res.json({ isBookmarked: travelPlan.isBookmarked });
  } catch (error) {
    console.error("Error toggling bookmark:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Delete a travel plan
router.delete("/:id", auth, async (req, res) => {
  try {
    const travelPlan = await TravelPlan.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    await TravelPlan.findByIdAndRemove(req.params.id);
    res.json({ message: "Travel plan removed" });
  } catch (error) {
    console.error("Error deleting travel plan:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get bookmarked travel plans
router.get("/bookmarked", auth, async (req, res) => {
  try {
    const bookmarkedPlans = await TravelPlan.find({
      userId: req.user._id,
      isBookmarked: true,
    });

    res.json(bookmarkedPlans);
  } catch (error) {
    console.error("Error fetching bookmarked plans:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
