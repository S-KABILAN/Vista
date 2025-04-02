import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAuth } from "./AuthContext";

// Create the Notification Context
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  fetchNotifications: () => {},
  fetchUnreadCount: () => {},
  markAsRead: () => Promise.resolve(),
  markAllAsRead: () => Promise.resolve(),
  deleteNotification: () => Promise.resolve(),
  deleteAllNotifications: () => Promise.resolve(),
});

// Custom hook for using the Notification Context
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider"
    );
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const { authToken, user } = useAuth();

  // Fetch unread notification count on mount and when auth state changes
  useEffect(() => {
    if (authToken && user) {
      fetchUnreadCount();

      // Set up polling for unread count (every 60 seconds)
      const intervalId = setInterval(fetchUnreadCount, 60000);

      // Clean up interval on unmount
      return () => clearInterval(intervalId);
    }
  }, [authToken, user]);

  // Function to fetch unread notification count
  const fetchUnreadCount = async () => {
    try {
      if (!authToken) return;

      const response = await axios.get(
        `${BACKEND_URL}/api/notifications/unread`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  // Function to fetch all notifications
  const fetchNotifications = async () => {
    try {
      if (!authToken) return;

      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        setNotifications(response.data.notifications);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      if (!authToken) return;

      const response = await axios.put(
        `${BACKEND_URL}/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );

        // Refresh unread count
        fetchUnreadCount();
      }

      return response.data;
    } catch (error) {
      console.error("Error marking notification as read:", error);
      throw error;
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (!authToken) return;

      const response = await axios.put(
        `${BACKEND_URL}/api/notifications/read-all`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );

        // Reset unread count
        setUnreadCount(0);
      }

      return response.data;
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      throw error;
    }
  };

  // Function to delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      if (!authToken) return;

      const response = await axios.delete(
        `${BACKEND_URL}/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );

        // Refresh unread count
        fetchUnreadCount();
      }

      return response.data;
    } catch (error) {
      console.error("Error deleting notification:", error);
      throw error;
    }
  };

  // Function to delete all notifications
  const deleteAllNotifications = async () => {
    try {
      if (!authToken) return;

      const response = await axios.delete(`${BACKEND_URL}/api/notifications`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (response.data.success) {
        // Clear notifications array
        setNotifications([]);

        // Reset unread count
        setUnreadCount(0);
      }

      return response.data;
    } catch (error) {
      console.error("Error deleting all notifications:", error);
      throw error;
    }
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
