import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
} from "react-native";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import AppHeader from "../components/AppHeader";
import { Ionicons } from "@expo/vector-icons";

// Mock notification data for when API is unavailable
const generateMockNotification = (type) => {
  const now = new Date();
  let title, message, icon;

  switch (type) {
    case "info":
      title = "Information Update";
      message = "We have updated our travel policies for your safety.";
      icon = "information-circle";
      break;
    case "success":
      title = "Booking Confirmed";
      message = "Your recent booking has been successfully confirmed.";
      icon = "checkmark-circle";
      break;
    case "warning":
      title = "Travel Advisory";
      message =
        "There are travel advisories for some of your saved destinations.";
      icon = "warning";
      break;
    case "error":
      title = "Payment Failed";
      message = "Your recent payment could not be processed. Please try again.";
      icon = "alert-circle";
      break;
    case "trip":
      title = "Trip Reminder";
      message = "Your trip to Barcelona is coming up in 2 weeks!";
      icon = "airplane";
      break;
    case "promotion":
      title = "Special Offer";
      message = "Get 30% off on selected hotels for the next 24 hours!";
      icon = "gift";
      break;
    case "system":
      title = "System Update";
      message = "Our app has been updated with new features. Check them out!";
      icon = "settings";
      break;
    default:
      title = "New Notification";
      message = "You have a new notification.";
      icon = "notifications";
  }

  return {
    _id: `mock_${now.getTime()}`,
    title,
    message,
    type,
    read: false,
    createdAt: now.toISOString(),
    data: type === "trip" ? { tripId: "12345" } : null,
  };
};

const NotificationsTest = () => {
  const [loading, setLoading] = useState(false);
  const [useMockData, setUseMockData] = useState(false);
  const { authToken } = useAuth();
  const {
    fetchNotifications,
    fetchUnreadCount,
    error,
    notifications,
    setNotifications,
    setUnreadCount,
  } = useNotification();

  // Display a message about API status when the component mounts
  useEffect(() => {
    if (error && error.includes("API endpoint not available")) {
      Alert.alert(
        "API Not Available",
        "The notification API endpoints are not available. Mock data will be used for demonstration.",
        [{ text: "OK" }]
      );
      setUseMockData(true);
    }
  }, [error]);

  // Function to create a test notification
  const createTestNotification = async (type) => {
    try {
      setLoading(true);

      if (
        useMockData ||
        (error && error.includes("API endpoint not available"))
      ) {
        // Create a mock notification
        const mockNotification = generateMockNotification(type);

        // Simulate adding to state
        setTimeout(() => {
          // Add to context state
          setNotifications((prev) => [mockNotification, ...prev]);

          // Update unread count
          setUnreadCount((prev) => prev + 1);

          // Show success message
          Alert.alert(
            "Mock Notification Created",
            `A ${type} notification has been added to your notifications list.`,
            [{ text: "OK" }]
          );

          setLoading(false);
        }, 500);

        return;
      }

      let endpoint = "/api/notifications/test";
      let data = {};

      if (type === "trip") {
        endpoint = "/api/notifications/test-trip";
      } else if (type === "promotion") {
        endpoint = "/api/notifications/test-promotion";
      } else {
        data = { type };
      }

      const response = await axios.post(`${BACKEND_URL}${endpoint}`, data, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        Alert.alert(
          "Success",
          `Test ${type} notification created successfully!`,
          [{ text: "OK" }]
        );

        // Refresh unread count
        fetchUnreadCount();
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error creating test notification:", error);

      // If we get a 404, switch to mock mode automatically
      if (error.response?.status === 404 || !error.response) {
        setUseMockData(true);

        // Create a mock notification instead
        const mockNotification = generateMockNotification(type);

        // Add to context state
        setNotifications((prev) => [mockNotification, ...prev]);

        // Update unread count
        setUnreadCount((prev) => prev + 1);

        Alert.alert(
          "Mock Mode Activated",
          "API is unavailable. A mock notification has been created instead.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert(
          "Error",
          `Failed to create notification: ${
            error.response?.data?.message || error.message
          }`,
          [{ text: "OK" }]
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Notification type buttons
  const notificationTypes = [
    { id: "info", label: "Info", color: "#3498db", icon: "information-circle" },
    {
      id: "success",
      label: "Success",
      color: "#2ecc71",
      icon: "checkmark-circle",
    },
    { id: "warning", label: "Warning", color: "#f39c12", icon: "warning" },
    { id: "error", label: "Error", color: "#e74c3c", icon: "alert-circle" },
    { id: "trip", label: "Trip Update", color: "#9b59b6", icon: "airplane" },
    { id: "promotion", label: "Promotion", color: "#e67e22", icon: "gift" },
    { id: "system", label: "System", color: "#34495e", icon: "settings" },
  ];

  return (
    <View style={styles.container}>
      <AppHeader title="Test Notifications" showBack={true} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.heading}>Create Test Notifications</Text>
        <Text style={styles.description}>
          Generate test notifications to see how they appear in the app. Click
          on any button below to create a notification of that type.
        </Text>

        <View style={styles.mockModeContainer}>
          <Text style={styles.mockModeText}>Use Mock Data</Text>
          <Switch
            value={
              useMockData ||
              (error && error.includes("API endpoint not available"))
            }
            onValueChange={setUseMockData}
            trackColor={{ false: "#767577", true: "#3498db" }}
            thumbColor={useMockData ? "#fff" : "#f4f3f4"}
          />
        </View>

        <View style={styles.buttonGrid}>
          {notificationTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[styles.typeButton, { backgroundColor: type.color }]}
              onPress={() => createTestNotification(type.id)}
              disabled={loading}
            >
              <Ionicons name={type.icon} size={24} color="#FFF" />
              <Text style={styles.typeButtonText}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Creating notification...</Text>
          </View>
        )}

        <View style={styles.infoBox}>
          <Text style={styles.infoTitle}>How to Use</Text>
          <Text style={styles.infoText}>
            1. Click on any notification type above to generate a test
            notification.
          </Text>
          <Text style={styles.infoText}>
            2. The notification will appear in your notification bell in the app
            header.
          </Text>
          <Text style={styles.infoText}>
            3. Click on the notification bell to view and interact with your
            notifications.
          </Text>
        </View>

        {error && error.includes("API endpoint not available") && (
          <View style={styles.apiErrorBox}>
            <Ionicons name="warning" size={24} color="#f39c12" />
            <Text style={styles.apiErrorTitle}>API Not Available</Text>
            <Text style={styles.apiErrorText}>
              The notification API is currently not available. Mock data is
              being used for demonstration purposes.
            </Text>
          </View>
        )}

        {notifications && notifications.length > 0 && (
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() =>
              Alert.alert(
                "Current Notifications",
                `You have ${notifications.length} notifications (${
                  notifications.filter((n) => !n.read).length
                } unread)`
              )
            }
          >
            <Text style={styles.viewAllButtonText}>
              View Current Notification Count
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  content: {
    padding: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  mockModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  mockModeText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  typeButton: {
    width: "48%",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  typeButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
    marginTop: 5,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  infoBox: {
    backgroundColor: "#edf7ff",
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#3498db",
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
    lineHeight: 20,
  },
  apiErrorBox: {
    backgroundColor: "#fffbeb",
    padding: 20,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#f39c12",
    marginTop: 20,
  },
  apiErrorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 10,
    color: "#333",
  },
  apiErrorText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  viewAllButton: {
    backgroundColor: "#3498db",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  viewAllButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default NotificationsTest;
