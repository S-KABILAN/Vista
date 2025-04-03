import React, { createContext, useState, useEffect, useContext } from "react";
import axios from "axios";
import { BACKEND_URL, SOCKET_URL } from "../config";
import { useAuth } from "./AuthContext";
import { useAdmin } from "./AdminContext";
import io from "socket.io-client";
import { Platform } from "react-native";

// Create the Notification Context
const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  fetchNotifications: () => {},
  fetchUnreadCount: () => {},
  markAsRead: () => Promise.resolve(),
  markAllAsRead: () => Promise.resolve(),
  deleteNotification: () => Promise.resolve(),
  deleteAllNotifications: () => Promise.resolve(),
  setNotifications: () => {},
  setUnreadCount: () => {},
  // Admin notification functions
  sendAdminNotification: () => Promise.resolve(),
  fetchSentAdminNotifications: () => Promise.resolve(),
});

// Sample mock notifications for when API is unavailable
const mockNotifications = [
  {
    _id: "1",
    title: "Welcome to Vista Travel",
    message: "Thank you for joining our community of travelers!",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    _id: "2",
    title: "New Destinations Added",
    message: "Check out our newly added travel destinations for 2024!",
    type: "info",
    read: false,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    _id: "3",
    title: "Special Discount",
    message: "20% off on all hotel bookings for the next 48 hours!",
    type: "promotion",
    read: true,
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
  },
  {
    _id: "4",
    title: "Travel Tip",
    message:
      "Remember to check travel advisories before booking your next trip.",
    type: "warning",
    read: false,
    createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
  },
  {
    _id: "5",
    title: "Your Account",
    message: "Your profile has been successfully updated.",
    type: "success",
    read: true,
    createdAt: new Date(Date.now() - 345600000).toISOString(), // 4 days ago
  },
  {
    _id: "6",
    title: "Trip Update",
    message: "Your upcoming trip to Paris has been confirmed.",
    type: "trip",
    read: false,
    data: { tripId: "123456" },
    createdAt: new Date(Date.now() - 432000000).toISOString(), // 5 days ago
  },
];

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
  const [error, setError] = useState(null);
  const [adminSentNotifications, setAdminSentNotifications] = useState([]);
  const [socket, setSocket] = useState(null);
  const { authToken, user } = useAuth();
  const { adminToken } = useAdmin();

  // Connect to Socket.IO when auth state changes
  useEffect(() => {
    // Don't connect if there's no auth token
    if (!authToken && !adminToken) return;

    // Create socket connection
    console.log("Attempting to connect to socket.io at:", SOCKET_URL);
    const newSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
      query: {
        clientType: adminToken ? "admin" : "user",
        timestamp: Date.now(),
      },
    });

    newSocket.on("connect", () => {
      console.log("Socket.IO connected:", newSocket.id);

      // Authenticate with the appropriate token
      if (authToken) {
        console.log("Authenticating user socket with token");
        // Remove Bearer prefix if present
        const token = authToken.replace("Bearer ", "");
        newSocket.emit("authenticate", token);
      }

      if (adminToken) {
        console.log("Authenticating admin socket with token");
        // Remove Bearer prefix if present
        const token = adminToken.replace("Bearer ", "");
        newSocket.emit("adminAuthenticate", token);
      }
    });

    // Add authentication response handlers
    newSocket.on("authenticated", (response) => {
      console.log("Socket authentication response:", response);
      if (response.status === "success") {
        console.log("Socket authenticated as user successfully");
      }
    });

    newSocket.on("adminAuthenticated", (response) => {
      console.log("Admin socket authentication response:", response);
      if (response.status === "success") {
        console.log("Socket authenticated as admin successfully");
      }
    });

    // Handle new notifications
    newSocket.on("newNotification", (data) => {
      console.log("New notification received:", data);
      // Add to notifications list
      setNotifications((prev) => [data.notification, ...prev]);
      // Update unread count
      setUnreadCount(data.count);
    });

    // Handle unread count updates
    newSocket.on("unreadCountUpdated", (data) => {
      console.log("Unread count updated:", data);
      setUnreadCount(data.count);
    });

    // Handle broadcast notifications (sent to all users)
    newSocket.on("broadcastNotification", (data) => {
      console.log("Broadcast notification received:", data);
      fetchNotifications(); // Refresh notifications
      fetchUnreadCount(); // Refresh unread count
    });

    // Handle admin notifications (for admin users)
    newSocket.on("adminNotificationSent", (data) => {
      console.log("Admin sent a notification:", data);
      // Update admin sent notifications list
      if (adminToken) {
        setAdminSentNotifications((prev) => [data.notification, ...prev]);
      }
    });

    // Socket error handling
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });

    newSocket.on("disconnect", (reason) => {
      console.log("Socket disconnected:", reason);
    });

    // Save socket instance
    setSocket(newSocket);

    // Clean up on unmount
    return () => {
      console.log("Cleaning up socket connection");
      newSocket.disconnect();
    };
  }, [authToken, adminToken]); // Re-connect when auth tokens change

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

      setError(null);
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

      // Use mock data in case of API errors
      if (error.response?.status === 404 || !error.response) {
        // API endpoint doesn't exist, use fallback mock data
        setUnreadCount(mockNotifications.filter((n) => !n.read).length);
        setError("API endpoint not available");
        setNotifications(mockNotifications);
      }
    }
  };

  // Function to fetch all notifications
  const fetchNotifications = async () => {
    try {
      if (!authToken) return;

      // If we already know the API is unavailable, use mock data
      if (error && error.includes("API endpoint not available")) {
        setNotifications(mockNotifications);
        return;
      }

      setLoading(true);
      setError(null);

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

      // Use mock data in case of API errors
      if (error.response?.status === 404 || !error.response) {
        // API endpoint doesn't exist, use fallback mock data
        setNotifications(mockNotifications);
        setError("API endpoint not available");
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      if (!authToken) return;

      // Always handle locally if API is unavailable
      if (error && error.includes("API endpoint not available")) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        return { success: true };
      }

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

      // Handle locally if API error occurs
      if (error.response?.status === 404 || !error.response) {
        setNotifications((prev) =>
          prev.map((notification) =>
            notification._id === notificationId
              ? { ...notification, read: true }
              : notification
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setError("API endpoint not available");
        return { success: true };
      }

      setError("Failed to mark as read");
      throw error;
    }
  };

  // Function to mark all notifications as read
  const markAllAsRead = async () => {
    try {
      if (!authToken) return;

      // Always handle locally if API is unavailable
      if (error && error.includes("API endpoint not available")) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        return { success: true };
      }

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

      // Handle locally if API error occurs
      if (error.response?.status === 404 || !error.response) {
        setNotifications((prev) =>
          prev.map((notification) => ({ ...notification, read: true }))
        );
        setUnreadCount(0);
        setError("API endpoint not available");
        return { success: true };
      }

      setError("Failed to mark all as read");
      throw error;
    }
  };

  // Function to delete a notification
  const deleteNotification = async (notificationId) => {
    try {
      if (!authToken) return;

      setError(null);
      // For mock data, handle locally
      if (error && error.includes("API endpoint not available")) {
        const notificationToDelete = notifications.find(
          (n) => n._id === notificationId
        );
        setNotifications((prev) =>
          prev.filter((notification) => notification._id !== notificationId)
        );
        if (notificationToDelete && !notificationToDelete.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
        return { success: true };
      }

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
      setError("Failed to delete notification");
      throw error;
    }
  };

  // Function to delete all notifications
  const deleteAllNotifications = async () => {
    try {
      if (!authToken) return;

      setError(null);
      // For mock data, handle locally
      if (error && error.includes("API endpoint not available")) {
        setNotifications([]);
        setUnreadCount(0);
        return { success: true };
      }

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
      setError("Failed to delete all notifications");
      throw error;
    }
  };

  // Admin Functions

  // Function for admin to send a notification
  const sendAdminNotification = async (notificationData) => {
    try {
      // Use adminToken instead of authToken for admin operations
      console.log(
        "AdminToken availability for sending notification:",
        !!adminToken
      );

      // Check if we're using demo users (simple numeric IDs)
      const usingDemoUsers =
        !notificationData.sendToAll &&
        notificationData.userIds &&
        notificationData.userIds.length > 0 &&
        notificationData.userIds.some(
          (id) => typeof id === "string" && /^[1-9]\d*$/.test(id)
        );

      if (usingDemoUsers) {
        console.log(
          "Using demo users for notification targets - forcing demo mode"
        );
        return useMockSendNotification(
          notificationData,
          "You've selected demo users that don't exist in the database"
        );
      }

      if (!adminToken) {
        console.log(
          "No admin token available for sending admin notification - using mock mode"
        );
        return useMockSendNotification(
          notificationData,
          "No admin authentication"
        );
      }

      // Try to use the real API first
      try {
        console.log(
          "Attempting to send notification via API to real users:",
          notificationData
        );
        const response = await axios.post(
          `${BACKEND_URL}/api/admin/notifications/send`,
          notificationData,
          {
            headers: {
              Authorization: `Bearer ${adminToken.replace("Bearer ", "")}`,
            },
            timeout: 8000, // Increase timeout for sending to potentially many users
          }
        );

        console.log("API notification response:", response.data);

        if (response.data && response.data.success) {
          // If successful, add the notification to our local state
          const notificationId =
            response.data.notificationId || `api_${Date.now()}`;
          const newNotification = {
            _id: notificationId,
            title: notificationData.title,
            message: notificationData.message,
            type: notificationData.type,
            sentAt: new Date().toISOString(),
            sentTo: notificationData.sendToAll
              ? `All Users (${response.data.count || 0})`
              : `${notificationData.userIds?.length || 0} selected users`,
          };

          setAdminSentNotifications((prev) => [newNotification, ...prev]);

          return {
            success: true,
            message: `Notification sent to ${
              notificationData.sendToAll ? "all" : "selected"
            } users successfully`,
            notification: newNotification,
            isRealUsers: true,
          };
        } else {
          console.log("API returned unsuccessful response:", response.data);
          throw new Error(
            response.data?.message || "API returned unsuccessful response"
          );
        }
      } catch (error) {
        // Log detailed error information
        console.error("Error sending notification via API:", error);
        console.error("Error details:", error.response?.data || error.message);

        // If API fails, throw the error to be handled in catch block
        throw error;
      }
    } catch (error) {
      console.error("Error in sendAdminNotification:", error);

      // Fallback to mock notifications with clear indication this is mock data
      const mockData = useMockSendNotification(
        notificationData,
        error.message || "Unknown error"
      );
      return {
        ...mockData,
        message:
          "Using Demo mode: " +
          mockData.message +
          " (API error: " +
          (error.message || "Unknown error") +
          ")",
        isRealUsers: false,
      };
    }
  };

  // Helper function for mock notification sending
  const useMockSendNotification = (notificationData, reason = "Demo mode") => {
    const mockNotificationId = `mock_${Date.now()}`;

    // Create and add mock notification
    const newNotification = {
      _id: mockNotificationId,
      title: notificationData.title,
      message: notificationData.message,
      type: notificationData.type,
      sentAt: new Date().toISOString(),
      sentTo: notificationData.sendToAll
        ? "All Users (MOCK)"
        : `${notificationData.userIds?.length || 0} selected users (MOCK)`,
    };

    setAdminSentNotifications((prev) => [newNotification, ...prev]);

    return {
      success: true,
      message: `Notification sent in DEMO mode - no real users received this notification (Reason: ${reason})`,
      notificationId: mockNotificationId,
      notification: newNotification,
      isRealUsers: false,
    };
  };

  // Function to fetch sent admin notifications
  const fetchSentAdminNotifications = async () => {
    try {
      // Use adminToken instead of authToken for admin operations
      if (!adminToken) {
        console.log(
          "No admin token available for fetching admin notifications"
        );
        return getMockSentNotifications();
      }

      try {
        // Try to fetch from API endpoint
        const response = await axios.get(
          `${BACKEND_URL}/api/admin/notifications/sent`,
          {
            headers: {
              Authorization: `Bearer ${adminToken.replace("Bearer ", "")}`,
            },
            timeout: 5000, // Add timeout to prevent long waits
          }
        );

        if (response.data && response.data.success) {
          setAdminSentNotifications(response.data.notifications);
          return response.data.notifications;
        } else {
          console.log("API returned unsuccessful response, using mock data");
          return getMockSentNotifications();
        }
      } catch (error) {
        // If endpoint doesn't exist (404) or other API error, use mock data
        console.log(
          "Error fetching sent admin notifications, using mock data:",
          error.message
        );
        return getMockSentNotifications();
      }
    } catch (error) {
      console.error("Unexpected error in fetchSentAdminNotifications:", error);
      return getMockSentNotifications();
    }
  };

  // Helper function to get mock sent notifications
  const getMockSentNotifications = () => {
    // If we already have mock notifications in state, return those first to preserve
    // any that were recently added via the sendAdminNotification function
    if (adminSentNotifications && adminSentNotifications.length > 0) {
      console.log(
        `Returning ${adminSentNotifications.length} existing mock sent notifications`
      );
      return adminSentNotifications;
    }

    console.log("Generating new mock sent notifications");
    // Otherwise, generate default mock notifications
    const mockSentNotifications = [
      {
        _id: "1",
        title: "Welcome to Vista Travel",
        message: "Thank you for joining our community of travelers!",
        type: "info",
        sentAt: new Date(Date.now() - 3600000).toISOString(),
        sentTo: "All Users",
      },
      {
        _id: "2",
        title: "Special Summer Discount",
        message: "Get 20% off on all bookings this summer!",
        type: "promotion",
        sentAt: new Date(Date.now() - 86400000).toISOString(),
        sentTo: "5 selected users",
      },
    ];

    setAdminSentNotifications(mockSentNotifications);
    return mockSentNotifications;
  };

  // Context value
  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications,
    setNotifications,
    setUnreadCount,
    // Admin functions
    sendAdminNotification,
    fetchSentAdminNotifications,
    adminSentNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;
