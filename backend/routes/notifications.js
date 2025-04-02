const express = require("express");
const router = express.Router();
const passport = require("passport");
const Notification = require("../models/Notification");
const ObjectId = require("mongoose").Types.ObjectId;
const notificationService = require("../services/notificationService");

// JWT Auth middleware
const authenticate = passport.authenticate("jwt", { session: false });

/**
 * @route GET /api/notifications
 * @desc Get all notifications for the current user
 * @access Private
 */
router.get("/", authenticate, async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route GET /api/notifications/unread
 * @desc Get unread notifications count for the current user
 * @access Private
 */
router.get("/unread", authenticate, async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      user: req.user.id,
      read: false,
    });

    return res.json({ success: true, count });
  } catch (error) {
    console.error("Error fetching unread notifications count:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route PUT /api/notifications/:id/read
 * @desc Mark a notification as read
 * @access Private
 */
router.put("/:id/read", authenticate, async (req, res) => {
  try {
    // Validate object ID
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route PUT /api/notifications/read-all
 * @desc Mark all notifications as read
 * @access Private
 */
router.put("/read-all", authenticate, async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { user: req.user.id, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: `Marked ${result.modifiedCount} notifications as read`,
    });
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route DELETE /api/notifications/:id
 * @desc Delete a notification
 * @access Private
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    // Validate object ID
    if (!ObjectId.isValid(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid notification ID" });
    }

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    return res.json({ success: true, message: "Notification deleted" });
  } catch (error) {
    console.error("Error deleting notification:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route DELETE /api/notifications
 * @desc Delete all notifications for a user
 * @access Private
 */
router.delete("/", authenticate, async (req, res) => {
  try {
    const result = await Notification.deleteMany({ user: req.user.id });

    return res.json({
      success: true,
      message: `Deleted ${result.deletedCount} notifications`,
    });
  } catch (error) {
    console.error("Error deleting all notifications:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route POST /api/notifications/test
 * @desc Create a test notification for the current user
 * @access Private
 */
router.post("/test", authenticate, async (req, res) => {
  try {
    const { type = "info" } = req.body;

    // Create a test notification
    const notification = new Notification({
      user: req.user.id,
      title: `Test ${
        type.charAt(0).toUpperCase() + type.slice(1)
      } Notification`,
      message: `This is a test notification of type "${type}" created at ${new Date().toLocaleString()}`,
      type,
      data: { test: true, testId: Date.now() },
      read: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "Test notification created",
      notification,
    });
  } catch (error) {
    console.error("Error creating test notification:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route POST /api/notifications/test-trip
 * @desc Create a test trip notification for the current user
 * @access Private
 */
router.post("/test-trip", authenticate, async (req, res) => {
  try {
    // Create a test trip notification
    const notification = new Notification({
      user: req.user.id,
      title: "Your Trip is Coming Up!",
      message:
        "Your trip to Paris is scheduled to begin in 3 days. Start packing!",
      type: "trip",
      data: { tripId: "123456789", destination: "Paris", daysLeft: 3 },
      read: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "Test trip notification created",
      notification,
    });
  } catch (error) {
    console.error("Error creating test trip notification:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @route POST /api/notifications/test-promotion
 * @desc Create a test promotion notification for the current user
 * @access Private
 */
router.post("/test-promotion", authenticate, async (req, res) => {
  try {
    // Create a test promotion notification
    const notification = new Notification({
      user: req.user.id,
      title: "Special Discount!",
      message: "Enjoy 20% off your next hotel booking with code VISTA20",
      type: "promotion",
      data: { promoId: "VISTA20", discount: "20%", expiry: "2024-06-30" },
      read: false,
      createdAt: new Date(),
    });

    await notification.save();

    return res.json({
      success: true,
      message: "Test promotion notification created",
      notification,
    });
  } catch (error) {
    console.error("Error creating test promotion notification:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
