import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Alert,
  ActivityIndicator,
  Share,
  Clipboard,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome,
} from "@expo/vector-icons";
import { BACKEND_URL } from "../config";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { LinearGradient } from "expo-linear-gradient";
import {
  addCollaborator as addCollaboratorService,
  removeCollaborator as removeCollaboratorService,
  updateCollaboratorAccess as updateCollaboratorAccessService,
  getCollaborators as getCollaboratorsService,
  createShareLink as createShareLinkService,
  removeShareLink as removeShareLinkService,
  getActivityLog as getActivityLogService,
} from "../services/CollaborationService";
import { getAndVerifyAuthToken } from "../utils/AuthUtils";

const TripCollaboration = ({ route, navigation }) => {
  const { planId, planName } = route.params;
  const { user, token: contextToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [collaborators, setCollaborators] = useState([]);
  const [ownerInfo, setOwnerInfo] = useState(null);
  const [email, setEmail] = useState("");
  const [shareLink, setShareLink] = useState("");
  const [expireDays, setExpireDays] = useState("7");
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isShareModalVisible, setIsShareModalVisible] = useState(false);
  const [accessLevel, setAccessLevel] = useState("view");
  const [activityLog, setActivityLog] = useState([]);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [token, setToken] = useState(contextToken);

  useEffect(() => {
    const initializeToken = async () => {
      console.log(
        "[AUTH] Context token in TripCollaboration:",
        contextToken ? `Length: ${contextToken.length}` : "No context token"
      );

      let authToken = contextToken;

      // If no context token, try to get it directly from storage
      if (!authToken) {
        console.log("[AUTH] No context token, getting from storage");
        authToken = await getAndVerifyAuthToken();
        if (authToken) {
          console.log(
            "[AUTH] Retrieved token from storage:",
            authToken ? `Length: ${authToken.length}` : "Failed to get token"
          );
          setToken(authToken);
        }
      }

      console.log(debugTokenFormat(authToken));

      if (authToken) {
        console.log(
          "[AUTH] Token available in TripCollaboration:",
          `Token length: ${authToken.length}`
        );
        console.log(
          "[AUTH] User context:",
          user ? `ID: ${user._id || user.id}` : "No user data"
        );

        // Set default authorization header
        axios.defaults.headers.common["Authorization"] = `Bearer ${authToken}`;

        fetchCollaborators(authToken);
        checkShareLink(authToken);
      } else {
        console.log("[AUTH] No token available in TripCollaboration");
        Alert.alert(
          "Authentication Error",
          "Please log in to access collaboration features",
          [{ text: "OK", onPress: () => navigation.goBack() }]
        );
      }
    };

    initializeToken();
  }, [planId, contextToken]);

  const fetchCollaborators = async (authToken = token) => {
    try {
      setLoading(true);
      console.log(`[API] Fetching collaborators for plan: ${planId}`);
      const response = await getCollaboratorsService(planId, authToken);
      console.log(
        `[API] Got ${response.collaborators?.length || 0} collaborators`
      );
      setCollaborators(response.collaborators || []);
      setOwnerInfo(response.owner);
      setLoading(false);
    } catch (error) {
      console.error("[ERROR] Fetching collaborators:", error.message);
      if (error.response) {
        console.error("[ERROR] Status:", error.response.status);
        console.error("[ERROR] Data:", JSON.stringify(error.response.data));
      }
      Alert.alert("Error", "Failed to fetch collaborators");
      setLoading(false);
    }
  };

  const checkShareLink = async (authToken = token) => {
    if (!authToken) return;

    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/travel-plans/${planId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      if (response.data && response.data.shareLink) {
        setShareLink(response.data.shareLink);
      }
    } catch (error) {
      console.error("Error checking share link:", error);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const response = await getActivityLogService(planId, token);
      setActivityLog(response.activityLog || []);
    } catch (error) {
      console.error("Error fetching activity log:", error);
      Alert.alert("Error", "Failed to fetch activity log");
    }
  };

  const addCollaborator = async () => {
    if (!email) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    try {
      setLoading(true);
      console.log(
        `Adding collaborator: ${email} with access level: ${accessLevel}`
      );

      // Use the CollaborationService instead of direct axios call for better abstraction
      const response = await addCollaboratorService(
        planId,
        email,
        accessLevel,
        token
      );

      Alert.alert("Success", "Collaborator added successfully");
      setEmail("");
      setIsAddModalVisible(false);
      fetchCollaborators();
    } catch (error) {
      console.error("Error adding collaborator:", error);
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Failed to add collaborator. Please check the email and try again.";

      Alert.alert("Error", errorMsg, [
        {
          text: "OK",
          onPress: () => setIsAddModalVisible(false),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const removeCollaborator = async (userId) => {
    try {
      setLoading(true);
      await removeCollaboratorService(planId, userId, token);
      Alert.alert("Success", "Collaborator removed successfully");
      fetchCollaborators();
    } catch (error) {
      console.error("Error removing collaborator:", error);
      Alert.alert("Error", "Failed to remove collaborator");
    } finally {
      setLoading(false);
    }
  };

  const updateCollaboratorAccess = async (userId, newAccessLevel) => {
    try {
      setLoading(true);
      await updateCollaboratorAccessService(
        planId,
        userId,
        newAccessLevel,
        token
      );
      Alert.alert("Success", "Access level updated successfully");
      fetchCollaborators();
    } catch (error) {
      console.error("Error updating collaborator access:", error);
      Alert.alert("Error", "Failed to update access level");
    } finally {
      setLoading(false);
    }
  };

  const createShareLink = async () => {
    try {
      setLoading(true);
      const response = await createShareLinkService(planId, expireDays, token);
      setShareLink(response.shareLink);
      setIsShareModalVisible(false);
      Alert.alert("Success", "Share link created successfully");
    } catch (error) {
      console.error("Error creating share link:", error);
      Alert.alert("Error", "Failed to create share link");
    } finally {
      setLoading(false);
    }
  };

  const removeShareLink = async () => {
    try {
      setLoading(true);
      await removeShareLinkService(planId, token);
      setShareLink("");
      Alert.alert("Success", "Share link removed");
    } catch (error) {
      console.error("Error removing share link:", error);
      Alert.alert("Error", "Failed to remove share link");
    } finally {
      setLoading(false);
    }
  };

  const onShare = async () => {
    if (!shareLink) return;

    const shareUrl = `${BACKEND_URL}/shared/${shareLink}`;
    try {
      const result = await Share.share({
        message: `Check out my travel plan to ${planName}: ${shareUrl}`,
        url: shareUrl,
        title: `${planName} Travel Plan`,
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share link");
    }
  };

  const copyToClipboard = () => {
    if (!shareLink) return;

    const shareUrl = `${BACKEND_URL}/shared/${shareLink}`;
    Clipboard.setString(shareUrl);
    Alert.alert("Success", "Link copied to clipboard");
  };

  const renderCollaboratorItem = ({ item }) => {
    const isCurrentUser = item.userId?._id === user?._id;

    return (
      <View style={styles.collaboratorItem}>
        <View style={styles.userInfo}>
          <FontAwesome name="user-circle" size={32} color="#3498db" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>
              {item.userId?.fullName || "Unknown User"}
            </Text>
            <Text style={styles.userEmail}>{item.userId?.email || ""}</Text>
            <Text style={styles.accessLevel}>
              Access: {item.accessLevel === "edit" ? "Editor" : "Viewer"}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {!isCurrentUser && (
            <>
              <TouchableOpacity
                onPress={() =>
                  updateCollaboratorAccess(
                    item.userId?._id,
                    item.accessLevel === "edit" ? "view" : "edit"
                  )
                }
                style={styles.actionButton}
              >
                <MaterialIcons
                  name={item.accessLevel === "edit" ? "visibility" : "edit"}
                  size={20}
                  color="#3498db"
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    "Remove Collaborator",
                    `Are you sure you want to remove ${
                      item.userId?.fullName || "this collaborator"
                    }?`,
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Remove",
                        onPress: () => removeCollaborator(item.userId?._id),
                      },
                    ]
                  );
                }}
                style={styles.actionButton}
              >
                <MaterialIcons name="delete" size={20} color="#e74c3c" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  };

  const renderActivityItem = ({ item }) => {
    const getActionText = (action) => {
      switch (action) {
        case "added_collaborator":
          return "added a collaborator";
        case "removed_collaborator":
          return "removed a collaborator";
        case "updated_collaborator":
          return `changed access to ${item.details?.newAccessLevel}`;
        case "created_share_link":
          return "created a share link";
        case "removed_share_link":
          return "removed sharing";
        default:
          return action.replace(/_/g, " ");
      }
    };

    return (
      <View style={styles.activityItem}>
        <View style={styles.activityContent}>
          <Text style={styles.activityUser}>
            {item.userId?.fullName || "Unknown User"}
          </Text>
          <Text style={styles.activityAction}>
            {getActionText(item.action)}
          </Text>
          <Text style={styles.activityTime}>
            {new Date(item.timestamp).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  // For direct token debug - temporary debug function to detect token format issues
  const debugTokenFormat = (tokenValue) => {
    try {
      if (!tokenValue) return "[DEBUG] Token is null or undefined";

      if (typeof tokenValue !== "string")
        return `[DEBUG] Token type is not string: ${typeof tokenValue}`;

      if (tokenValue.startsWith("{") && tokenValue.endsWith("}")) {
        try {
          const parsed = JSON.parse(tokenValue);
          return `[DEBUG] Token seems to be a JSON object: ${Object.keys(
            parsed
          ).join(",")}`;
        } catch (e) {
          return "[DEBUG] Token starts/ends with {} but is not valid JSON";
        }
      }

      if (tokenValue.length < 20)
        return `[DEBUG] Token seems too short: ${tokenValue.length} chars`;

      return `[DEBUG] Token looks valid: ${tokenValue.substring(0, 10)}...`;
    } catch (e) {
      return `[DEBUG] Error analyzing token: ${e.message}`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#3498db", "#2980b9"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Collaboration</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>{planName}</Text>
        </View>

        <View style={styles.shareSection}>
          <Text style={styles.sectionTitle}>Share Options</Text>

          <View style={styles.shareOptions}>
            {shareLink ? (
              <>
                <View style={styles.shareLinkContainer}>
                  <Text numberOfLines={1} style={styles.shareLink}>
                    /shared/{shareLink}
                  </Text>
                </View>

                <View style={styles.shareButtons}>
                  <TouchableOpacity
                    onPress={onShare}
                    style={[styles.actionButton, styles.shareButton]}
                  >
                    <Ionicons name="share-social" size={20} color="#3498db" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={copyToClipboard}
                    style={[styles.actionButton, styles.shareButton]}
                  >
                    <Ionicons name="copy" size={20} color="#3498db" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Alert.alert(
                        "Remove Share Link",
                        "Are you sure you want to remove the share link? Anyone with this link will no longer be able to access your trip.",
                        [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", onPress: removeShareLink },
                        ]
                      );
                    }}
                    style={[styles.actionButton, styles.shareButton]}
                  >
                    <MaterialIcons name="link-off" size={20} color="#e74c3c" />
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <TouchableOpacity
                onPress={() => setIsShareModalVisible(true)}
                style={styles.createShareButton}
              >
                <Ionicons name="link" size={20} color="white" />
                <Text style={styles.createShareText}>Create Share Link</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.collaboratorsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Collaborators</Text>
            <TouchableOpacity
              onPress={() => setIsAddModalVisible(true)}
              style={styles.addButton}
            >
              <AntDesign name="adduser" size={20} color="white" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <FlatList
              data={collaborators}
              renderItem={renderCollaboratorItem}
              keyExtractor={(item, index) => `${item.userId?._id || index}`}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No collaborators yet</Text>
              }
              style={styles.list}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.activityButton}
          onPress={() => {
            setShowActivityLog(!showActivityLog);
            if (!showActivityLog) {
              fetchActivityLog();
            }
          }}
        >
          <Text style={styles.activityButtonText}>
            {showActivityLog ? "Hide Activity Log" : "Show Activity Log"}
          </Text>
          <Ionicons
            name={showActivityLog ? "chevron-up" : "chevron-down"}
            size={20}
            color="#3498db"
          />
        </TouchableOpacity>

        {showActivityLog && (
          <View style={styles.activitySection}>
            <Text style={styles.sectionTitle}>Activity Log</Text>
            {activityLog.length > 0 ? (
              <FlatList
                data={activityLog}
                renderItem={renderActivityItem}
                keyExtractor={(item, index) => `${item._id || index}`}
                style={styles.activityList}
              />
            ) : (
              <Text style={styles.emptyText}>No activity recorded yet</Text>
            )}
          </View>
        )}
      </View>

      {/* Add Collaborator Modal */}
      <Modal
        visible={isAddModalVisible}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Collaborator</Text>

            <TextInput
              style={styles.input}
              placeholder="Email address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <View style={styles.accessOptions}>
              <Text style={styles.accessTitle}>Access Level:</Text>
              <View style={styles.accessButtons}>
                <TouchableOpacity
                  style={[
                    styles.accessButton,
                    accessLevel === "view" && styles.accessButtonActive,
                  ]}
                  onPress={() => setAccessLevel("view")}
                >
                  <Text
                    style={[
                      styles.accessButtonText,
                      accessLevel === "view" && styles.accessButtonTextActive,
                    ]}
                  >
                    View only
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.accessButton,
                    accessLevel === "edit" && styles.accessButtonActive,
                  ]}
                  onPress={() => setAccessLevel("edit")}
                >
                  <Text
                    style={[
                      styles.accessButtonText,
                      accessLevel === "edit" && styles.accessButtonTextActive,
                    ]}
                  >
                    Can edit
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setIsAddModalVisible(false);
                  setEmail("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={addCollaborator}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Share Link Modal */}
      <Modal
        visible={isShareModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create Share Link</Text>

            <View style={styles.expireDaysContainer}>
              <Text style={styles.expireDaysLabel}>
                Link expires after (days):
              </Text>
              <TextInput
                style={styles.expireDaysInput}
                value={expireDays}
                onChangeText={setExpireDays}
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsShareModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={createShareLink}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.confirmButtonText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    height: 60,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 15,
    height: "100%",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  placeholder: {
    width: 30,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  planInfo: {
    marginBottom: 20,
  },
  planTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  shareSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#3498db",
    padding: 8,
    borderRadius: 20,
  },
  shareOptions: {
    marginTop: 10,
  },
  shareLinkContainer: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 5,
    marginBottom: 10,
  },
  shareLink: {
    fontSize: 16,
    color: "#333",
  },
  shareButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  createShareButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 5,
  },
  createShareText: {
    color: "white",
    marginLeft: 5,
    fontWeight: "bold",
  },
  collaboratorsSection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activitySection: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  list: {
    maxHeight: 300,
  },
  activityList: {
    maxHeight: 200,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    padding: 20,
  },
  collaboratorItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userDetails: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
  accessLevel: {
    fontSize: 12,
    color: "#3498db",
    marginTop: 3,
  },
  actions: {
    flexDirection: "row",
  },
  actionButton: {
    marginLeft: 10,
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
  },
  shareButton: {
    backgroundColor: "#f0f0f0",
  },
  activityButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    borderRadius: 5,
    backgroundColor: "white",
    marginBottom: 15,
  },
  activityButtonText: {
    color: "#3498db",
    fontWeight: "bold",
    marginRight: 5,
  },
  activityItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityContent: {
    flexDirection: "column",
  },
  activityUser: {
    fontWeight: "bold",
  },
  activityAction: {
    color: "#555",
  },
  activityTime: {
    fontSize: 12,
    color: "#888",
    marginTop: 3,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    marginBottom: 15,
  },
  accessOptions: {
    marginBottom: 15,
  },
  accessTitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  accessButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  accessButton: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginHorizontal: 5,
    borderRadius: 5,
  },
  accessButtonActive: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  accessButtonText: {
    color: "#333",
  },
  accessButtonTextActive: {
    color: "white",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 5,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  confirmButton: {
    backgroundColor: "#3498db",
  },
  cancelButtonText: {
    color: "#333",
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  expireDaysContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  expireDaysLabel: {
    flex: 3,
    fontSize: 16,
  },
  expireDaysInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 5,
    padding: 10,
    textAlign: "center",
  },
});

export default TripCollaboration;
