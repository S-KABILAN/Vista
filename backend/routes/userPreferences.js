const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const UserPreference = require("../models/UserPreference");
const User = require("../models/User");
const mongoose = require("mongoose");

// Get user preferences
// GET /api/preferences
router.get("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Find user preferences
    let userPreferences = await UserPreference.findOne({ userId });

    if (!userPreferences) {
      // If no preferences exist, return default empty preferences
      return res.json({
        travelInterests: [],
        budgetRange: "",
        preferredDestinationTypes: [],
        preferredAccommodationTypes: [],
        preferredActivities: [],
        travelStyle: "",
        visitedCountries: [],
        isOnboardingComplete: false,
      });
    }

    res.json(userPreferences);
  } catch (error) {
    console.error("Error fetching user preferences:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Save user preferences
// POST /api/preferences
router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const preferencesData = req.body;

    console.log(`Received preferences save request:`, {
      userId,
      preferencesData,
      headers: req.headers,
    });

    // Validate the userId before proceeding
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.error("Invalid user ID:", userId);
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    // Find existing preferences or create new one
    let userPreferences = await UserPreference.findOne({ userId });
    console.log("Existing preferences:", userPreferences);

    if (userPreferences) {
      console.log("Updating existing user preferences");
      // Update existing preferences - make sure to sanitize the input data
      const sanitizedData = {
        travelInterests:
          preferencesData.travelInterests || userPreferences.travelInterests,
        budgetRange: preferencesData.budgetRange || userPreferences.budgetRange,
        preferredDestinationTypes:
          preferencesData.preferredDestinationTypes ||
          userPreferences.preferredDestinationTypes,
        preferredAccommodationTypes:
          preferencesData.preferredAccommodationTypes ||
          userPreferences.preferredAccommodationTypes,
        preferredActivities:
          preferencesData.preferredActivities ||
          userPreferences.preferredActivities,
        travelStyle: preferencesData.travelStyle || userPreferences.travelStyle,
        visitedCountries:
          preferencesData.visitedCountries || userPreferences.visitedCountries,
        isOnboardingComplete:
          typeof preferencesData.isOnboardingComplete === "boolean"
            ? preferencesData.isOnboardingComplete
            : userPreferences.isOnboardingComplete,
      };

      console.log("Sanitized data for update:", sanitizedData);

      userPreferences = await UserPreference.findOneAndUpdate(
        { userId },
        sanitizedData,
        { new: true }
      );
      console.log("Updated preferences:", userPreferences);
    } else {
      console.log("Creating new user preferences");
      // Create new preferences
      userPreferences = new UserPreference({
        userId: mongoose.Types.ObjectId(userId),
        travelInterests: preferencesData.travelInterests || [],
        budgetRange: preferencesData.budgetRange || "moderate",
        preferredDestinationTypes:
          preferencesData.preferredDestinationTypes || [],
        preferredAccommodationTypes:
          preferencesData.preferredAccommodationTypes || [],
        preferredActivities: preferencesData.preferredActivities || [],
        travelStyle: preferencesData.travelStyle || "",
        visitedCountries: preferencesData.visitedCountries || [],
        isOnboardingComplete: preferencesData.isOnboardingComplete || false,
      });
      await userPreferences.save();
      console.log("Created new preferences:", userPreferences);
    }

    // Also update the user's preferences field for backward compatibility
    const updatedUser = await User.findByIdAndUpdate(userId, {
      preferences: {
        travelInterests: preferencesData.travelInterests,
        budgetRange: preferencesData.budgetRange,
        preferredDestinationTypes: preferencesData.preferredDestinationTypes,
        preferredAccommodationTypes:
          preferencesData.preferredAccommodationTypes,
        preferredActivities: preferencesData.preferredActivities,
        travelStyle: preferencesData.travelStyle,
        visitedCountries: preferencesData.visitedCountries,
        isOnboardingComplete: preferencesData.isOnboardingComplete,
      },
    });
    console.log("Updated user preferences:", updatedUser);

    res.json({ success: true, preferences: userPreferences });
  } catch (error) {
    console.error("Error saving user preferences:", {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id,
    });
    res.status(500).json({
      message: "Server error while saving preferences",
      error: error.message,
      success: false,
    });
  }
});

// Complete onboarding
// POST /api/preferences/complete-onboarding
router.post("/complete-onboarding", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    console.log(`Completing onboarding for user ID: ${userId}`);

    // Validate the userId before proceeding
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        message: "Invalid user ID",
        success: false,
      });
    }

    // Find existing preferences or create new one
    let userPreferences = await UserPreference.findOne({ userId });

    if (userPreferences) {
      console.log("Updating existing preferences to complete onboarding");
      // Update existing preferences
      userPreferences = await UserPreference.findOneAndUpdate(
        { userId },
        { isOnboardingComplete: true },
        { new: true }
      );
    } else {
      console.log("Creating new preferences with onboarding completed");
      // Create new preferences with onboarding completed
      userPreferences = new UserPreference({
        userId: mongoose.Types.ObjectId(userId),
        isOnboardingComplete: true,
      });
      await userPreferences.save();
    }

    // Update user model too
    await User.findByIdAndUpdate(userId, {
      "preferences.isOnboardingComplete": true,
    });

    res.json({ success: true, isOnboardingComplete: true });
  } catch (error) {
    console.error("Error completing onboarding:", error);
    res.status(500).json({
      message: "Server error while completing onboarding",
      error: error.message,
      success: false,
    });
  }
});

// Reset user preferences
// DELETE /api/preferences
router.delete("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete preferences
    await UserPreference.findOneAndDelete({ userId });

    // Reset user preferences
    await User.findByIdAndUpdate(userId, {
      preferences: {},
    });

    res.json({ success: true, message: "Preferences reset successfully" });
  } catch (error) {
    console.error("Error resetting user preferences:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Track interaction with recommendations
// POST /api/preferences/track-interaction
router.post("/track-interaction", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { placeId, interactionType } = req.body;

    if (!placeId || !interactionType) {
      return res
        .status(400)
        .json({ message: "Place ID and interaction type are required" });
    }

    // Find existing preferences
    let userPreferences = await UserPreference.findOne({ userId });

    if (!userPreferences) {
      return res.status(404).json({ message: "User preferences not found" });
    }

    // Update interaction history
    const key = `${placeId}_${interactionType}`;

    if (!userPreferences.recommendationPreferences.interactionHistory) {
      userPreferences.recommendationPreferences.interactionHistory = {};
    }

    userPreferences.recommendationPreferences.interactionHistory[key] = {
      timestamp: Date.now(),
      type: interactionType,
    };

    await userPreferences.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking interaction:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
