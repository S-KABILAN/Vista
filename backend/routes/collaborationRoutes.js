const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const passport = require("passport");
const TravelPlan = require("../models/TravelPlan");
const User = require("../models/User");
const crypto = require("crypto");

// Authentication middleware
const authenticate = passport.authenticate("jwt", { session: false });

// Debug route to check if collaboration routes are working
router.get("/debug", (req, res) => {
  res.status(200).json({
    message: "Collaboration routes are working correctly",
    timestamp: new Date().toISOString(),
  });
});

// Generate a random share link
const generateShareLink = () => {
  return crypto.randomBytes(10).toString("hex");
};

// Add a collaborator to a travel plan
router.post("/:planId/collaborators", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;
    const { email, accessLevel } = req.body;

    console.log(`Attempting to add collaborator to plan: ${planId}`);
    console.log(`Email: ${email}, Access Level: ${accessLevel || "view"}`);

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Find the user to add as collaborator
    const collaborator = await User.findOne({ email });
    if (!collaborator) {
      console.log(`User with email ${email} not found`);
      return res.status(404).json({ message: "User not found" });
    }
    console.log(
      `Found collaborator: ${collaborator._id} (${collaborator.fullName})`
    );

    // Check if travel plan exists and user is the owner
    const travelPlan = await TravelPlan.findById(planId);
    if (!travelPlan) {
      console.log(`Travel plan with ID ${planId} not found`);
      return res.status(404).json({ message: "Travel plan not found" });
    }
    console.log(`Found travel plan: ${travelPlan.destination}`);

    // Check if user is owner or has edit access
    const isOwner = travelPlan.userId.toString() === req.user.id;
    const hasEditAccess = travelPlan.collaborators.some(
      (c) => c.userId.toString() === req.user.id && c.accessLevel === "edit"
    );

    console.log(`User is owner: ${isOwner}, Has edit access: ${hasEditAccess}`);

    if (!isOwner && !hasEditAccess) {
      return res
        .status(403)
        .json({ message: "You don't have permission to add collaborators" });
    }

    // Check if user is already a collaborator
    if (
      travelPlan.collaborators.some(
        (c) => c.userId.toString() === collaborator._id.toString()
      )
    ) {
      return res
        .status(400)
        .json({ message: "User is already a collaborator" });
    }

    // Add user as a collaborator
    travelPlan.collaborators.push({
      userId: collaborator._id,
      accessLevel: accessLevel || "view",
      dateAdded: new Date(),
    });

    // Log the activity
    travelPlan.activityLog.push({
      userId: req.user._id,
      action: "added_collaborator",
      details: {
        collaboratorId: collaborator._id,
        collaboratorEmail: email,
        accessLevel,
      },
    });

    await travelPlan.save();

    // Notify the collaborator using socket.io
    if (req.io) {
      req.io.to(`user:${collaborator._id}`).emit("collaboration_invite", {
        planId: travelPlan._id,
        planName: travelPlan.destination,
        invitedBy: req.user.fullName,
      });
    }

    return res.status(200).json({
      message: "Collaborator added successfully",
      collaborator: {
        id: collaborator._id,
        email: collaborator.email,
        fullName: collaborator.fullName,
        accessLevel: accessLevel || "view",
      },
    });
  } catch (error) {
    console.error("Error adding collaborator:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Get all collaborators for a travel plan
router.get("/:planId/collaborators", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if travel plan exists
    const travelPlan = await TravelPlan.findById(planId).populate(
      "collaborators.userId",
      "fullName email profileImage"
    );

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Check if user is owner or collaborator
    if (
      travelPlan.userId.toString() !== req.user.id &&
      !travelPlan.collaborators.some(
        (c) => c.userId._id.toString() === req.user.id
      )
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view collaborators" });
    }

    return res.status(200).json({
      owner: {
        id: travelPlan.userId,
        // You would need to populate the owner's details if needed
      },
      collaborators: travelPlan.collaborators,
    });
  } catch (error) {
    console.error("Error getting collaborators:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Update collaborator access level
router.put("/:planId/collaborators/:userId", authenticate, async (req, res) => {
  try {
    const { planId, userId } = req.params;
    const { accessLevel } = req.body;

    if (!accessLevel || !["view", "edit"].includes(accessLevel)) {
      return res
        .status(400)
        .json({ message: "Valid access level (view or edit) is required" });
    }

    // Check if travel plan exists
    const travelPlan = await TravelPlan.findById(planId);
    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Check if user is owner
    if (travelPlan.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can change access levels" });
    }

    // Find and update the collaborator
    const collaborator = travelPlan.collaborators.find(
      (c) => c.userId.toString() === userId
    );

    if (!collaborator) {
      return res.status(404).json({ message: "Collaborator not found" });
    }

    collaborator.accessLevel = accessLevel;

    // Log the activity
    travelPlan.activityLog.push({
      userId: req.user._id,
      action: "updated_collaborator",
      details: {
        collaboratorId: userId,
        newAccessLevel: accessLevel,
      },
    });

    await travelPlan.save();

    return res.status(200).json({
      message: "Collaborator access level updated",
      collaborator,
    });
  } catch (error) {
    console.error("Error updating collaborator:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Remove a collaborator
router.delete(
  "/:planId/collaborators/:userId",
  authenticate,
  async (req, res) => {
    try {
      const { planId, userId } = req.params;

      // Check if travel plan exists
      const travelPlan = await TravelPlan.findById(planId);
      if (!travelPlan) {
        return res.status(404).json({ message: "Travel plan not found" });
      }

      // Check if user is owner or the collaborator being removed
      if (
        travelPlan.userId.toString() !== req.user.id &&
        req.user.id !== userId
      ) {
        return res.status(403).json({
          message: "You don't have permission to remove this collaborator",
        });
      }

      // Find the collaborator index
      const collaboratorIndex = travelPlan.collaborators.findIndex(
        (c) => c.userId.toString() === userId
      );

      if (collaboratorIndex === -1) {
        return res.status(404).json({ message: "Collaborator not found" });
      }

      // Remove the collaborator
      travelPlan.collaborators.splice(collaboratorIndex, 1);

      // Log the activity
      travelPlan.activityLog.push({
        userId: req.user._id,
        action: "removed_collaborator",
        details: {
          collaboratorId: userId,
          removedBy: req.user.id === userId ? "self" : "owner",
        },
      });

      await travelPlan.save();

      return res.status(200).json({
        message: "Collaborator removed successfully",
      });
    } catch (error) {
      console.error("Error removing collaborator:", error);
      return res
        .status(500)
        .json({ message: "Server error", error: error.message });
    }
  }
);

// Create a shareable link for a travel plan
router.post("/:planId/share", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;
    const { expiration } = req.body; // Optional: days until expiration

    // Check if travel plan exists
    const travelPlan = await TravelPlan.findById(planId);
    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Check if user is owner or has edit access
    if (
      travelPlan.userId.toString() !== req.user.id &&
      !travelPlan.collaborators.some(
        (c) => c.userId.toString() === req.user.id && c.accessLevel === "edit"
      )
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to share this plan" });
    }

    // Generate a new share link if one doesn't exist
    if (!travelPlan.shareLink) {
      travelPlan.shareLink = generateShareLink();
    }

    travelPlan.isShared = true;

    // Set expiration date if provided
    if (expiration) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + parseInt(expiration));
      travelPlan.shareExpiration = expirationDate;
    } else {
      // Remove expiration if not provided
      travelPlan.shareExpiration = undefined;
    }

    // Log the activity
    travelPlan.activityLog.push({
      userId: req.user._id,
      action: "created_share_link",
      details: {
        expiration: travelPlan.shareExpiration,
      },
    });

    await travelPlan.save();

    return res.status(200).json({
      message: "Share link generated successfully",
      shareLink: travelPlan.shareLink,
      expiration: travelPlan.shareExpiration,
    });
  } catch (error) {
    console.error("Error creating share link:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Remove share link
router.delete("/:planId/share", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if travel plan exists
    const travelPlan = await TravelPlan.findById(planId);
    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Check if user is owner
    if (travelPlan.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Only the owner can remove sharing" });
    }

    // Remove sharing
    travelPlan.isShared = false;
    travelPlan.shareLink = undefined;
    travelPlan.shareExpiration = undefined;

    // Log the activity
    travelPlan.activityLog.push({
      userId: req.user._id,
      action: "removed_share_link",
    });

    await travelPlan.save();

    return res.status(200).json({
      message: "Sharing disabled successfully",
    });
  } catch (error) {
    console.error("Error removing share link:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Get travel plan by share link (no authentication required)
router.get("/shared/:shareLink", async (req, res) => {
  try {
    const { shareLink } = req.params;

    // Find travel plan by share link
    const travelPlan = await TravelPlan.findOne({
      shareLink,
      isShared: true,
    });

    if (!travelPlan) {
      return res
        .status(404)
        .json({ message: "Travel plan not found or not shared" });
    }

    // Check if share link has expired
    if (travelPlan.shareExpiration && new Date() > travelPlan.shareExpiration) {
      return res.status(410).json({ message: "Share link has expired" });
    }

    // Return travel plan with limited information
    return res.status(200).json({
      id: travelPlan._id,
      destination: travelPlan.destination,
      tripDuration: travelPlan.tripDuration,
      itinerary: travelPlan.itinerary,
      recommendations: travelPlan.recommendations,
      destinationData: travelPlan.destinationData,
    });
  } catch (error) {
    console.error("Error getting shared travel plan:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Get activity log for a travel plan
router.get("/:planId/activity", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;

    // Check if travel plan exists
    const travelPlan = await TravelPlan.findById(planId).populate(
      "activityLog.userId",
      "fullName email"
    );

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Check if user is owner or collaborator
    if (
      travelPlan.userId.toString() !== req.user.id &&
      !travelPlan.collaborators.some((c) => c.userId.toString() === req.user.id)
    ) {
      return res
        .status(403)
        .json({ message: "You don't have permission to view activity" });
    }

    return res.status(200).json({
      activityLog: travelPlan.activityLog,
    });
  } catch (error) {
    console.error("Error getting activity log:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

// Copy a shared travel plan to the user's account
router.post("/copy/:shareLink", authenticate, async (req, res) => {
  try {
    const { shareLink } = req.params;

    // Find the original travel plan by share link
    const originalPlan = await TravelPlan.findOne({
      shareLink,
      isShared: true,
    });

    if (!originalPlan) {
      return res
        .status(404)
        .json({ message: "Travel plan not found or not shared" });
    }

    // Check if share link has expired
    if (
      originalPlan.shareExpiration &&
      new Date() > originalPlan.shareExpiration
    ) {
      return res.status(410).json({ message: "Share link has expired" });
    }

    // Create a new travel plan for the current user
    const newPlan = new TravelPlan({
      userId: req.user.id,
      destination: originalPlan.destination,
      budget: originalPlan.budget,
      tripDuration: originalPlan.tripDuration,
      itinerary: originalPlan.itinerary,
      recommendations: originalPlan.recommendations,
      budgetBreakdown: originalPlan.budgetBreakdown,
      aiSuggestion: originalPlan.aiSuggestion,
      destinationData: originalPlan.destinationData,
      // Don't copy collaboration-specific fields
      collaborators: [],
      isShared: false,
      shareLink: undefined,
      shareExpiration: undefined,
      activityLog: [
        {
          userId: req.user._id,
          action: "copied_from_shared",
          details: {
            originalPlanId: originalPlan._id,
            originalOwner: originalPlan.userId,
          },
        },
      ],
    });

    await newPlan.save();

    // Also add a log entry to the original plan
    originalPlan.activityLog.push({
      userId: req.user._id,
      action: "copied_by_user",
      details: {
        newPlanId: newPlan._id,
        newOwner: req.user._id,
      },
    });

    await originalPlan.save();

    return res.status(201).json({
      message: "Travel plan copied successfully",
      planId: newPlan._id,
    });
  } catch (error) {
    console.error("Error copying travel plan:", error);
    return res
      .status(500)
      .json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
