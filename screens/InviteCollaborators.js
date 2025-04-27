import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import {
  addCollaborator,
  getCollaborators,
  removeCollaborator,
  updateCollaboratorAccess,
} from "../services/CollaborationService";

const InviteCollaborators = ({ route, navigation }) => {
  const { planId, planName } = route.params;
  const { token, user } = useAuth();
  const [email, setEmail] = useState("");
  const [collaborators, setCollaborators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [canEdit, setCanEdit] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // DEBUG LOGGING
  useEffect(() => {
    if (token) {
      console.log(
        "[AUTH] Token available in InviteCollaborators:",
        token ? `Token length: ${token.length}` : "No token"
      );
      console.log(
        "[AUTH] User context:",
        user ? `ID: ${user._id || user.id}` : "No user data"
      );
    } else {
      console.log("[AUTH] No token available in InviteCollaborators");
    }
  }, [token, user]);

  const fetchCollaborators = useCallback(async () => {
    if (!token) {
      console.log(
        "[ERROR] Cannot fetch collaborators: No authentication token"
      );
      Alert.alert(
        "Authentication Error",
        "Please log in to manage collaborators",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
      return;
    }

    try {
      setLoading(true);
      console.log(`[API] Fetching collaborators for plan: ${planId}`);
      const response = await getCollaborators(planId, token);
      console.log(
        `[API] Got ${response.collaborators?.length || 0} collaborators`
      );
      setCollaborators(response.collaborators || []);
    } catch (error) {
      console.error("[ERROR] Fetching collaborators:", error.message);
      if (error.response) {
        console.error("[ERROR] Status:", error.response.status);
        console.error("[ERROR] Data:", JSON.stringify(error.response.data));
      }
      Alert.alert("Error", "Could not load collaborators");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId, token, navigation]);

  useEffect(() => {
    fetchCollaborators();
  }, [fetchCollaborators]);

  const handleInvite = async () => {
    if (!token) {
      Alert.alert(
        "Authentication Error",
        "Please log in to invite collaborators"
      );
      return;
    }

    if (!email || email.trim() === "") {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    try {
      setInviting(true);
      console.log(
        `[API] Adding collaborator: ${email}, access: ${
          canEdit ? "edit" : "view"
        }`
      );
      await addCollaborator(
        planId,
        email.trim(),
        canEdit ? "edit" : "view",
        token
      );

      Alert.alert("Success", `Invitation sent to ${email}`);
      setEmail("");
      setCanEdit(false);
      fetchCollaborators();
    } catch (error) {
      console.error("[ERROR] Inviting collaborator:", error.message);
      if (error.response) {
        console.error("[ERROR] Status:", error.response.status);
        console.error("[ERROR] Data:", JSON.stringify(error.response.data));
      }
      const errorMsg =
        error.response?.data?.message ||
        error.message ||
        "Could not send invitation. Please check the email and try again.";
      Alert.alert("Error", errorMsg);
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveCollaborator = (collaboratorId, name) => {
    if (!token) {
      Alert.alert(
        "Authentication Error",
        "Please log in to remove collaborators"
      );
      return;
    }

    Alert.alert(
      "Remove Collaborator",
      `Are you sure you want to remove ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await removeCollaborator(planId, collaboratorId, token);
              fetchCollaborators();
            } catch (error) {
              console.error("Error removing collaborator:", error);
              Alert.alert("Error", "Could not remove collaborator");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const toggleAccessLevel = async (collaboratorId, currentLevel, name) => {
    if (!token) {
      Alert.alert(
        "Authentication Error",
        "Please log in to update access levels"
      );
      return;
    }

    const newLevel = currentLevel === "edit" ? "view" : "edit";
    const action = newLevel === "edit" ? "grant" : "remove";

    Alert.alert(
      "Change Access Level",
      `Are you sure you want to ${action} editing permission for ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Change",
          onPress: async () => {
            try {
              setLoading(true);
              await updateCollaboratorAccess(
                planId,
                collaboratorId,
                newLevel,
                token
              );
              fetchCollaborators();
            } catch (error) {
              console.error("Error updating access level:", error);
              Alert.alert("Error", "Could not update access level");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderCollaboratorItem = ({ item }) => {
    return (
      <View style={styles.collaboratorItem}>
        <View style={styles.collaboratorInfo}>
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {item.userId?.fullName?.charAt(0) || "?"}
            </Text>
          </View>
          <View style={styles.collaboratorDetails}>
            <Text style={styles.collaboratorName}>
              {item.userId?.fullName || "Unknown User"}
            </Text>
            <Text style={styles.collaboratorEmail}>
              {item.userId?.email || ""}
            </Text>
            <View style={styles.accessBadge}>
              <Text style={styles.accessBadgeText}>
                {item.accessLevel === "edit" ? "Editor" : "Viewer"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              toggleAccessLevel(
                item.userId?._id,
                item.accessLevel,
                item.userId?.fullName || "this collaborator"
              )
            }
          >
            <MaterialIcons
              name={item.accessLevel === "edit" ? "visibility" : "edit"}
              size={20}
              color="#3498db"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.removeButton]}
            onPress={() =>
              handleRemoveCollaborator(
                item.userId?._id,
                item.userId?.fullName || "this collaborator"
              )
            }
          >
            <MaterialIcons name="person-remove" size={20} color="#e74c3c" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Collaborators</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.content}
        keyboardVerticalOffset={100}
      >
        <View style={styles.planInfo}>
          <Text style={styles.planTitle}>{planName}</Text>
          <Text style={styles.planSubtitle}>
            Invite others to view or edit this trip
          </Text>
        </View>

        <View style={styles.inviteForm}>
          <TextInput
            style={styles.emailInput}
            placeholder="Enter email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!inviting}
          />

          <View style={styles.permissionRow}>
            <Text style={styles.permissionLabel}>Allow editing:</Text>
            <Switch
              value={canEdit}
              onValueChange={setCanEdit}
              trackColor={{ false: "#ccc", true: "#3498db" }}
              disabled={inviting}
            />
          </View>

          <TouchableOpacity
            style={styles.inviteButton}
            onPress={handleInvite}
            disabled={inviting || !email}
          >
            {inviting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.inviteButtonText}>Send Invitation</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.collaboratorsSection}>
          <Text style={styles.sectionTitle}>Current Collaborators</Text>

          {loading && !refreshing ? (
            <ActivityIndicator
              size="large"
              color="#3498db"
              style={styles.loader}
            />
          ) : (
            <FlatList
              data={collaborators}
              renderItem={renderCollaboratorItem}
              keyExtractor={(item) =>
                item.userId?._id || Math.random().toString()
              }
              contentContainerStyle={styles.collaboratorsList}
              onRefresh={() => {
                setRefreshing(true);
                fetchCollaborators();
              }}
              refreshing={refreshing}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people" size={48} color="#ccc" />
                  <Text style={styles.emptyStateText}>
                    No collaborators yet
                  </Text>
                  <Text style={styles.emptyStateSubtext}>
                    Invite someone by entering their email above
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  headerRight: {
    width: 28,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  planInfo: {
    marginBottom: 24,
  },
  planTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  planSubtitle: {
    fontSize: 14,
    color: "#666",
  },
  inviteForm: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  permissionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  permissionLabel: {
    fontSize: 16,
    color: "#333",
  },
  inviteButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  inviteButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  collaboratorsSection: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#333",
  },
  collaboratorsList: {
    flexGrow: 1,
  },
  collaboratorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  collaboratorInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3498db",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  collaboratorDetails: {
    flex: 1,
  },
  collaboratorName: {
    fontWeight: "600",
    fontSize: 16,
    color: "#333",
  },
  collaboratorEmail: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  accessBadge: {
    backgroundColor: "#edf7ff",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  accessBadgeText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f1f2f3",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  removeButton: {
    backgroundColor: "#fdeaec",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#666",
    marginTop: 12,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 4,
    textAlign: "center",
  },
  loader: {
    marginTop: 24,
  },
});

export default InviteCollaborators;
