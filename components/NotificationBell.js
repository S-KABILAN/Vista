import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  TouchableWithoutFeedback,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { format } from "date-fns";
import { useNotification } from "../context/NotificationContext";

const NotificationBell = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const navigation = useNavigation();
  const {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotification();

  // Handle notification press based on notification type and data
  const handleNotificationPress = (notification) => {
    // Mark the notification as read
    markAsRead(notification._id);

    // Close the notifications modal
    setShowNotifications(false);

    // Navigate based on notification type and data
    switch (notification.type) {
      case "trip":
        if (notification.data?.tripId) {
          navigation.navigate("TripDetails", {
            tripId: notification.data.tripId,
          });
        }
        break;
      case "promotion":
        if (notification.data?.promoId) {
          // Navigate to promo screen (implement this)
          // navigation.navigate('PromoDetails', { promoId: notification.data.promoId });
        }
        break;
      default:
        // For general notifications, just mark as read
        break;
    }
  };

  // Get icon based on notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "info":
        return "information-circle";
      case "success":
        return "checkmark-circle";
      case "warning":
        return "warning";
      case "error":
        return "alert-circle";
      case "trip":
        return "airplane";
      case "promotion":
        return "gift";
      case "system":
        return "settings";
      default:
        return "notifications";
    }
  };

  // Get color based on notification type
  const getNotificationColor = (type) => {
    switch (type) {
      case "info":
        return "#3498db";
      case "success":
        return "#2ecc71";
      case "warning":
        return "#f39c12";
      case "error":
        return "#e74c3c";
      case "trip":
        return "#9b59b6";
      case "promotion":
        return "#e67e22";
      case "system":
        return "#34495e";
      default:
        return "#7f8c8d";
    }
  };

  // Format date to relative time
  const formatNotificationDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.abs(now - date) / 36e5; // 36e5 is the number of milliseconds in an hour

    if (diffInHours < 24) {
      // Today - show time
      return format(date, "h:mm a");
    } else if (diffInHours < 48) {
      // Yesterday
      return "Yesterday";
    } else {
      // More than 2 days ago - show date
      return format(date, "MMM d");
    }
  };

  // Render notification item
  const renderNotificationItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.notificationItem, !item.read && styles.unreadNotification]}
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.notificationIconContainer}>
        <Ionicons
          name={getNotificationIcon(item.type)}
          size={24}
          color={getNotificationColor(item.type)}
        />
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationMessage}>{item.message}</Text>
        <Text style={styles.notificationTime}>
          {formatNotificationDate(item.createdAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Show notifications modal and fetch notifications
  const openNotificationsModal = () => {
    setShowNotifications(true);
    fetchNotifications();
  };

  return (
    <View>
      <TouchableOpacity
        style={styles.bellContainer}
        onPress={openNotificationsModal}
      >
        <Ionicons name="notifications" size={24} color="#333" />
        {unreadCount > 0 && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={showNotifications}
        onRequestClose={() => setShowNotifications(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowNotifications(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderText}>Notifications</Text>
                  <TouchableOpacity onPress={() => setShowNotifications(false)}>
                    <Ionicons name="close" size={24} color="#333" />
                  </TouchableOpacity>
                </View>

                {unreadCount > 0 && (
                  <TouchableOpacity
                    style={styles.markAllButton}
                    onPress={markAllAsRead}
                  >
                    <Text style={styles.markAllText}>Mark all as read</Text>
                  </TouchableOpacity>
                )}

                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#3498db" />
                  </View>
                ) : notifications.length > 0 ? (
                  <FlatList
                    data={notifications}
                    renderItem={renderNotificationItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.notificationsList}
                    showsVerticalScrollIndicator={false}
                  />
                ) : (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="notifications-off" size={48} color="#ccc" />
                    <Text style={styles.emptyText}>No notifications yet</Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: "relative",
    padding: 8,
  },
  badgeContainer: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#e74c3c",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  badgeText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingHorizontal: 16,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalHeaderText: {
    fontSize: 18,
    fontWeight: "bold",
  },
  markAllButton: {
    alignSelf: "flex-end",
    marginBottom: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  markAllText: {
    color: "#3498db",
    fontWeight: "600",
  },
  loadingContainer: {
    padding: 30,
    alignItems: "center",
  },
  notificationsList: {
    paddingBottom: 30,
  },
  notificationItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  unreadNotification: {
    backgroundColor: "rgba(52, 152, 219, 0.05)",
  },
  notificationIconContainer: {
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 6,
  },
  notificationTime: {
    fontSize: 12,
    color: "#999",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 50,
  },
  emptyText: {
    color: "#999",
    marginTop: 10,
    fontSize: 16,
  },
});

export default NotificationBell;
