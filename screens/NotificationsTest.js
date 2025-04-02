import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAuth } from "../context/AuthContext";
import { useNotification } from "../context/NotificationContext";
import AppHeader from "../components/AppHeader";
import { Ionicons } from "@expo/vector-icons";

const NotificationsTest = () => {
  const [loading, setLoading] = useState(false);
  const { authToken } = useAuth();
  const { fetchUnreadCount } = useNotification();

  // Function to create a test notification
  const createTestNotification = async (type) => {
    try {
      setLoading(true);

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
      }
    } catch (error) {
      console.error("Error creating test notification:", error);
      Alert.alert(
        "Error",
        `Failed to create notification: ${
          error.response?.data?.message || error.message
        }`,
        [{ text: "OK" }]
      );
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

        <View style={styles.infoContainer}>
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
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    paddingBottom: 50,
  },
  heading: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    lineHeight: 22,
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  typeButton: {
    width: "48%",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  typeButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
    fontSize: 16,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  infoContainer: {
    backgroundColor: "#f8f9fa",
    padding: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  infoText: {
    fontSize: 15,
    color: "#555",
    marginBottom: 10,
    lineHeight: 22,
  },
});

export default NotificationsTest;
