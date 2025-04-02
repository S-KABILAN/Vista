const Notification = require("../models/Notification");
const User = require("../models/User");

/**
 * Service for managing notifications
 */
const notificationService = {
  /**
   * Create a notification for a specific user
   *
   * @param {Object} data - Notification data
   * @param {string} data.userId - User ID to notify
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (info, success, warning, error, trip, promotion, system)
   * @param {Object} data.data - Additional data to store with the notification
   * @returns {Promise<Object>} - The created notification
   */
  createForUser: async (data) => {
    try {
      const {
        userId,
        title,
        message,
        type = "info",
        data: additionalData = {},
      } = data;

      const notification = new Notification({
        user: userId,
        title,
        message,
        type,
        data: additionalData,
        read: false,
        createdAt: new Date(),
      });

      await notification.save();
      return notification;
    } catch (error) {
      console.error("Error creating notification:", error);
      throw error;
    }
  },

  /**
   * Create a notification for multiple users
   *
   * @param {Object} data - Notification data
   * @param {Array<string>} data.userIds - Array of user IDs to notify
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (info, success, warning, error, trip, promotion, system)
   * @param {Object} data.data - Additional data to store with the notification
   * @returns {Promise<Array<Object>>} - Array of created notifications
   */
  createForUsers: async (data) => {
    try {
      const {
        userIds,
        title,
        message,
        type = "info",
        data: additionalData = {},
      } = data;

      const notifications = userIds.map((userId) => ({
        user: userId,
        title,
        message,
        type,
        data: additionalData,
        read: false,
        createdAt: new Date(),
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error("Error creating multiple notifications:", error);
      throw error;
    }
  },

  /**
   * Create a notification for all users
   *
   * @param {Object} data - Notification data
   * @param {string} data.title - Notification title
   * @param {string} data.message - Notification message
   * @param {string} data.type - Notification type (info, success, warning, error, trip, promotion, system)
   * @param {Object} data.data - Additional data to store with the notification
   * @returns {Promise<Array<Object>>} - Array of created notifications
   */
  createForAllUsers: async (data) => {
    try {
      const { title, message, type = "info", data: additionalData = {} } = data;

      // Get all user IDs
      const users = await User.find({}, "_id");
      const userIds = users.map((user) => user._id);

      // Create notifications for all users
      const notifications = userIds.map((userId) => ({
        user: userId,
        title,
        message,
        type,
        data: additionalData,
        read: false,
        createdAt: new Date(),
      }));

      return await Notification.insertMany(notifications);
    } catch (error) {
      console.error("Error creating notifications for all users:", error);
      throw error;
    }
  },

  /**
   * Create trip-related notification
   *
   * @param {string} userId - User ID to notify
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} tripData - Trip-related data
   * @returns {Promise<Object>} - The created notification
   */
  createTripNotification: async (userId, title, message, tripData) => {
    return notificationService.createForUser({
      userId,
      title,
      message,
      type: "trip",
      data: tripData,
    });
  },

  /**
   * Create a promotion notification
   *
   * @param {Array<string>|null} userIds - Array of user IDs to notify or null for all users
   * @param {string} title - Notification title
   * @param {string} message - Notification message
   * @param {Object} promoData - Promotion-related data
   * @returns {Promise<Array<Object>|Object>} - The created notification(s)
   */
  createPromotion: async (userIds, title, message, promoData) => {
    if (userIds && userIds.length > 0) {
      // Send to specific users
      return notificationService.createForUsers({
        userIds,
        title,
        message,
        type: "promotion",
        data: promoData,
      });
    } else {
      // Send to all users
      return notificationService.createForAllUsers({
        title,
        message,
        type: "promotion",
        data: promoData,
      });
    }
  },
};

module.exports = notificationService;
