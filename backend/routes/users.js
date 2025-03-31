const express = require("express");
const router = express.Router();
const passport = require("passport");
const User = require("../models/User");

// Authentication middleware
const authenticate = passport.authenticate("jwt", { session: false });

// Get user preferences
router.get("/:userId/preferences", authenticate, async (req, res) => {
  try {
    // Check if the user is trying to access their own data
    if (
      req.user.id !== req.params.userId &&
      req.user._id !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to user preferences",
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Return user preferences or empty object if not set
    res.json(user.preferences || {});
  } catch (error) {
    console.error("Error getting user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Server error retrieving user preferences",
      error: error.message,
    });
  }
});

// Update user preferences
router.post("/:userId/preferences", authenticate, async (req, res) => {
  try {
    // Check if the user is trying to update their own data
    if (
      req.user.id !== req.params.userId &&
      req.user._id !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to update user preferences",
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update preferences - merge with existing if any
    user.preferences = { ...user.preferences, ...req.body };
    await user.save();

    res.json({
      success: true,
      message: "User preferences updated successfully",
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("Error updating user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating user preferences",
      error: error.message,
    });
  }
});

// Delete user preferences
router.delete("/:userId/preferences", authenticate, async (req, res) => {
  try {
    // Check if the user is trying to delete their own data
    if (
      req.user.id !== req.params.userId &&
      req.user._id !== req.params.userId
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized access to delete user preferences",
      });
    }

    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Reset preferences to empty object
    user.preferences = {};
    await user.save();

    res.json({
      success: true,
      message: "User preferences reset successfully",
    });
  } catch (error) {
    console.error("Error deleting user preferences:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting user preferences",
      error: error.message,
    });
  }
});

module.exports = router;
