import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Switch,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAdmin } from "../context/AdminContext";
import { useNotification } from "../context/NotificationContext";
import { Picker } from "@react-native-picker/picker";

const AdminNotifications = ({ navigation }) => {
  const { admin, adminToken } = useAdmin();
  const {
    sendAdminNotification,
    fetchSentAdminNotifications,
    adminSentNotifications,
  } = useNotification();

  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [notificationTitle, setNotificationTitle] = useState("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notificationType, setNotificationType] = useState("info");
  const [targetAllUsers, setTargetAllUsers] = useState(true);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [sentNotifications, setSentNotifications] = useState([]);
  const [loadingSent, setLoadingSent] = useState(false);

  // Notification types with colors and icons
  const notificationTypes = [
    {
      id: "info",
      label: "Information",
      color: "#3498db",
      icon: "information-circle",
    },
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

  useEffect(() => {
    fetchUsers();
    fetchAdminSentNotifications();
  }, []);

  // Also update our local state when adminSentNotifications changes in the context
  useEffect(() => {
    if (
      Array.isArray(adminSentNotifications) &&
      adminSentNotifications.length > 0
    ) {
      console.log(
        `Updating sent notifications from context: ${adminSentNotifications.length} items`
      );
      setSentNotifications(adminSentNotifications);
    }
  }, [adminSentNotifications]);

  // Effect to check admin token and log it for debugging
  useEffect(() => {
    console.log("Admin token available:", !!adminToken);
  }, [adminToken]);

  // Fetch previously sent notifications
  const fetchAdminSentNotifications = async () => {
    try {
      setLoadingSent(true);
      console.log("Fetching admin sent notifications...");
      const notifications = await fetchSentAdminNotifications();
      console.log(`Received ${notifications?.length || 0} sent notifications`);

      // Make sure we have a valid array of notifications
      if (Array.isArray(notifications)) {
        setSentNotifications(notifications);
      } else {
        console.log(
          "Received invalid sent notifications format:",
          notifications
        );
        // Use existing admin sent notifications from context as fallback
        if (Array.isArray(adminSentNotifications)) {
          setSentNotifications(adminSentNotifications);
        } else {
          setSentNotifications([]);
        }
      }
    } catch (error) {
      console.error("Error in fetchAdminSentNotifications:", error);
      // Use existing admin sent notifications from context as fallback
      if (Array.isArray(adminSentNotifications)) {
        setSentNotifications(adminSentNotifications);
      } else {
        setSentNotifications([]);
      }
    } finally {
      setLoadingSent(false);
    }
  };

  // Fetch users for targeted notifications
  const fetchUsers = async () => {
    try {
      setLoadingUsers(true);
      // Define mock users for when API is not available
      const mockUsers = [
        { _id: "1", email: "john@example.com", displayName: "John Doe" },
        { _id: "2", email: "jane@example.com", displayName: "Jane Smith" },
        { _id: "3", email: "bob@example.com", displayName: "Bob Johnson" },
        { _id: "4", email: "sarah@example.com", displayName: "Sarah Williams" },
        { _id: "5", email: "mike@example.com", displayName: "Mike Brown" },
      ];

      try {
        // Try to fetch from API with a timeout
        const response = await axios.get(`${BACKEND_URL}/api/admin/users`, {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
          timeout: 5000,
        });

        if (response.data && response.data.success) {
          const apiUsers = response.data.users || [];
          console.log(`Fetched ${apiUsers.length} users from API`);

          // Map API users to ensure they have the expected format
          const formattedUsers = apiUsers.map((user) => ({
            _id: user._id,
            email: user.email,
            displayName:
              user.fullName || user.displayName || user.email.split("@")[0],
          }));

          setUsers(formattedUsers);
        } else {
          console.log("API returned unsuccessful response, using mock users");
          setUsers(mockUsers);
        }
      } catch (error) {
        console.log(
          "Error fetching users from API, using mock users:",
          error.message
        );
        setUsers(mockUsers);
      }
    } catch (error) {
      console.error("Unexpected error in fetchUsers:", error);
      // Ensure we still have users even on error
      setUsers([
        { _id: "1", email: "john@example.com", displayName: "John Doe" },
        { _id: "2", email: "jane@example.com", displayName: "Jane Smith" },
      ]);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers((prevSelectedUsers) => {
      if (prevSelectedUsers.includes(userId)) {
        return prevSelectedUsers.filter((id) => id !== userId);
      } else {
        return [...prevSelectedUsers, userId];
      }
    });
  };

  // Send notification
  const handleSendNotification = async () => {
    if (!notificationTitle.trim()) {
      Alert.alert("Error", "Please enter a notification title");
      return;
    }

    if (!notificationMessage.trim()) {
      Alert.alert("Error", "Please enter a notification message");
      return;
    }

    if (!targetAllUsers && selectedUsers.length === 0) {
      Alert.alert("Error", "Please select at least one user");
      return;
    }

    try {
      setSending(true);

      // Prepare notification data
      const notificationData = {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        sendToAll: targetAllUsers,
        userIds: targetAllUsers ? [] : selectedUsers,
      };

      console.log("Sending notification:", notificationData);
      const result = await sendAdminNotification(notificationData);
      console.log("Notification result:", result);

      if (result.success) {
        // Show different messages based on whether real users received the notification
        const isRealUsers = result.isRealUsers === true;

        Alert.alert(
          isRealUsers ? "Success" : "Demo Mode",
          `${result.message}${
            isRealUsers
              ? ""
              : "\n\nNote: This is running in demo mode. No actual users received this notification."
          }`
        );

        // Clear form
        setNotificationTitle("");
        setNotificationMessage("");
        setNotificationType("info");
        setSelectedUsers([]);

        // Use the notification returned in the result to immediately update the UI
        if (result.notification) {
          setSentNotifications((prev) => [result.notification, ...prev]);
        }

        // Add short delay before refreshing to ensure the new notification
        // is included in the context's adminSentNotifications state
        setTimeout(() => {
          fetchAdminSentNotifications();
        }, 500);
      } else {
        Alert.alert("Error", result.message || "Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const renderUserItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.userItem,
        selectedUsers.includes(item._id) && styles.selectedUserItem,
      ]}
      onPress={() => toggleUserSelection(item._id)}
    >
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.displayName || "User"}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
      </View>
      <Ionicons
        name={selectedUsers.includes(item._id) ? "checkbox" : "square-outline"}
        size={24}
        color={selectedUsers.includes(item._id) ? "#3498db" : "#999"}
      />
    </TouchableOpacity>
  );

  const renderSentNotificationItem = ({ item }) => (
    <View style={styles.sentNotificationItem}>
      <View style={styles.sentNotificationHeader}>
        <View style={styles.sentNotificationTypeContainer}>
          <Ionicons
            name={
              notificationTypes.find((type) => type.id === item.type)?.icon ||
              "notifications"
            }
            size={16}
            color={
              notificationTypes.find((type) => type.id === item.type)?.color ||
              "#999"
            }
          />
          <Text
            style={[
              styles.sentNotificationType,
              {
                color:
                  notificationTypes.find((type) => type.id === item.type)
                    ?.color || "#999",
              },
            ]}
          >
            {notificationTypes.find((type) => type.id === item.type)?.label ||
              "Notification"}
          </Text>
        </View>
        <Text style={styles.sentNotificationDate}>
          {new Date(item.sentAt).toLocaleDateString()}
        </Text>
      </View>
      <Text style={styles.sentNotificationTitle}>{item.title}</Text>
      <Text style={styles.sentNotificationMessage}>{item.message}</Text>
      <Text style={styles.sentNotificationRecipients}>
        Sent to: {item.sentTo}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Send Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Create Notification</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Notification Type</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={notificationType}
                onValueChange={(itemValue) => setNotificationType(itemValue)}
                style={styles.picker}
              >
                {notificationTypes.map((type) => (
                  <Picker.Item
                    key={type.id}
                    label={type.label}
                    value={type.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              value={notificationTitle}
              onChangeText={setNotificationTitle}
              placeholder="Enter notification title"
              maxLength={50}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Message</Text>
            <TextInput
              style={styles.textArea}
              value={notificationMessage}
              onChangeText={setNotificationMessage}
              placeholder="Enter notification message"
              multiline
              numberOfLines={4}
              maxLength={200}
            />
            <Text style={styles.charCount}>
              {notificationMessage.length}/200 characters
            </Text>
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.targetContainer}>
              <Text style={styles.label}>Send to all users</Text>
              <Switch
                value={targetAllUsers}
                onValueChange={setTargetAllUsers}
                trackColor={{ false: "#767577", true: "#3498db" }}
                thumbColor={targetAllUsers ? "#fff" : "#f4f3f4"}
              />
            </View>
          </View>

          {!targetAllUsers && (
            <View style={styles.usersContainer}>
              <Text style={styles.label}>Select users</Text>
              {loadingUsers ? (
                <ActivityIndicator size="small" color="#3498db" />
              ) : (
                <FlatList
                  data={users}
                  renderItem={renderUserItem}
                  keyExtractor={(item) => item._id}
                  style={styles.usersList}
                  scrollEnabled={false}
                  ListEmptyComponent={
                    <Text style={styles.emptyText}>No users found</Text>
                  }
                />
              )}
            </View>
          )}

          <TouchableOpacity
            style={styles.sendButton}
            onPress={handleSendNotification}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons
                  name="send"
                  size={20}
                  color="#fff"
                  style={styles.sendIcon}
                />
                <Text style={styles.sendButtonText}>Send Notification</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Previously Sent</Text>
          <View style={styles.refreshContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={fetchAdminSentNotifications}
            >
              <Ionicons name="refresh" size={18} color="#3498db" />
              <Text style={styles.refreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {/* Demo mode indicator */}
          {sentNotifications.length > 0 &&
            (sentNotifications[0]._id.toString().includes("mock") ||
              sentNotifications[0].sentTo.includes("MOCK")) && (
              <View style={styles.demoModeContainer}>
                <Ionicons
                  name="information-circle-outline"
                  size={16}
                  color="#e74c3c"
                />
                <Text style={styles.demoModeText}>
                  <Text style={{ fontWeight: "bold", color: "#e74c3c" }}>
                    DEMO MODE ACTIVE:
                  </Text>{" "}
                  Notifications are not being sent to real users. Backend API
                  endpoints are unavailable or not configured properly.
                </Text>
              </View>
            )}

          {loadingSent ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <FlatList
              data={sentNotifications}
              renderItem={renderSentNotificationItem}
              keyExtractor={(item) =>
                item._id || `notification-${Math.random()}`
              }
              style={styles.sentNotificationsList}
              nestedScrollEnabled={true}
              scrollEnabled={true}
              maxToRenderPerBatch={10}
              initialNumToRender={5}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No sent notifications</Text>
              }
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  refreshContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 10,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 5,
  },
  refreshText: {
    color: "#3498db",
    marginLeft: 5,
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 100,
    textAlignVertical: "top",
    backgroundColor: "#f9f9f9",
  },
  charCount: {
    fontSize: 12,
    color: "#999",
    textAlign: "right",
    marginTop: 4,
  },
  targetContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
  },
  usersContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  usersList: {
    maxHeight: 300,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginTop: 8,
  },
  userItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  selectedUserItem: {
    backgroundColor: "rgba(52, 152, 219, 0.1)",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  sendButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  sendIcon: {
    marginRight: 8,
  },
  sendButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  sentNotificationsList: {
    marginTop: 8,
  },
  sentNotificationItem: {
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#fafafa",
  },
  sentNotificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sentNotificationTypeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sentNotificationType: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 4,
  },
  sentNotificationDate: {
    fontSize: 12,
    color: "#999",
  },
  sentNotificationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  sentNotificationMessage: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  sentNotificationRecipients: {
    fontSize: 12,
    color: "#888",
    fontStyle: "italic",
  },
  emptyText: {
    textAlign: "center",
    padding: 16,
    color: "#999",
    fontStyle: "italic",
  },
  demoModeContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ffebee",
    borderWidth: 1,
    borderColor: "#e74c3c",
    borderRadius: 8,
    marginBottom: 12,
  },
  demoModeText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
    flex: 1,
    flexWrap: "wrap",
  },
});

export default AdminNotifications;
