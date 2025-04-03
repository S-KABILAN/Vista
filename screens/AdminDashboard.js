import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  AntDesign,
} from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useAdmin } from "../context/AdminContext";

const AdminDashboard = ({ navigation }) => {
  const { admin, adminLogout } = useAdmin();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTravelPlans: 0,
    newUsers: 0,
    newTravelPlans: 0,
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log(
        "Fetching dashboard stats from:",
        `${BACKEND_URL}/api/admin/dashboard`
      );

      const response = await axios.retryRequest(
        {
          url: "/api/admin/dashboard",
          method: "get",
          timeout: 8000,
        },
        2
      ); // 2 retries

      console.log("Dashboard stats response:", response.data);

      if (response.data.success) {
        setStats(response.data.stats);
      } else {
        console.error(
          "Failed to fetch dashboard stats:",
          response.data.message
        );
        Alert.alert("Error", "Failed to fetch dashboard statistics");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      console.log(
        "Auth headers:",
        axios.defaults.headers.common["Authorization"] ? "Present" : "Missing"
      );
      Alert.alert(
        "Error",
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch recent activities
  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
      console.log(
        "Fetching activities from:",
        `${BACKEND_URL}/api/admin/recent-activities`
      );

      const response = await axios.retryRequest(
        {
          url: "/api/admin/recent-activities",
          method: "get",
          timeout: 8000,
        },
        2
      ); // 2 retries

      console.log("Activities response:", response.data);

      if (response.data.success) {
        setRecentActivities(response.data.activities);
      } else {
        console.error("Failed to fetch activities:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      console.log(
        "Auth headers:",
        axios.defaults.headers.common["Authorization"] ? "Present" : "Missing"
      );
      // Initialize with empty array on error
      setRecentActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivities();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardStats();
    fetchRecentActivities();
  };

  const handleLogout = async () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to log out of the admin portal?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            const result = await adminLogout();
            if (result.success) {
              navigation.replace("AdminLogin");
            } else {
              Alert.alert("Error", "Failed to log out. Please try again.");
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <Text style={styles.welcomeText}>
            Welcome back, {admin?.fullName || "Admin"}
          </Text>
        </View>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialIcons name="logout" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#3498db"]}
          />
        }
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#3498db" />
          ) : (
            <>
              <View style={styles.statsRow}>
                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#3498db" }]}
                  onPress={() => navigation.navigate("AdminUserList")}
                >
                  <View style={styles.statIconContainer}>
                    <Ionicons name="people" size={28} color="#fff" />
                  </View>
                  <Text style={styles.statValue}>{stats.totalUsers}</Text>
                  <Text style={styles.statLabel}>Total Users</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.statCard, { backgroundColor: "#2ecc71" }]}
                  onPress={() => navigation.navigate("AdminTravelPlanList")}
                >
                  <View style={styles.statIconContainer}>
                    <FontAwesome5 name="route" size={24} color="#fff" />
                  </View>
                  <Text style={styles.statValue}>{stats.totalTravelPlans}</Text>
                  <Text style={styles.statLabel}>Travel Plans</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.statsRow}>
                <View style={[styles.statCard, { backgroundColor: "#9b59b6" }]}>
                  <View style={styles.statIconContainer}>
                    <AntDesign name="adduser" size={28} color="#fff" />
                  </View>
                  <Text style={styles.statValue}>{stats.newUsers}</Text>
                  <Text style={styles.statLabel}>New Users</Text>
                  <Text style={styles.statSubLabel}>Last 30 days</Text>
                </View>

                <View style={[styles.statCard, { backgroundColor: "#f39c12" }]}>
                  <View style={styles.statIconContainer}>
                    <MaterialIcons name="explore" size={28} color="#fff" />
                  </View>
                  <Text style={styles.statValue}>{stats.newTravelPlans}</Text>
                  <Text style={styles.statLabel}>New Plans</Text>
                  <Text style={styles.statSubLabel}>Last 30 days</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>

          <View style={styles.actionCards}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AdminUserList")}
            >
              <MaterialIcons name="people-alt" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Manage Users</Text>
              <Text style={styles.actionDesc}>View and manage app users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AdminTravelPlanList")}
            >
              <FontAwesome5 name="map-marked-alt" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Travel Plans</Text>
              <Text style={styles.actionDesc}>Manage user travel plans</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AdminContentManager")}
            >
              <Ionicons name="newspaper-outline" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Content</Text>
              <Text style={styles.actionDesc}>Manage app content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AdminNotifications")}
            >
              <Ionicons name="notifications" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Notifications</Text>
              <Text style={styles.actionDesc}>Send notifications to users</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate("AdminSettings")}
            >
              <Ionicons name="settings-sharp" size={32} color="#3498db" />
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionDesc}>Configure app settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.activitySection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityList}>
            {activitiesLoading ? (
              <ActivityIndicator
                size="small"
                color="#3498db"
                style={{ marginVertical: 20 }}
              />
            ) : recentActivities.length > 0 ? (
              recentActivities.map((activity, index) => (
                <View key={activity._id || index} style={styles.activityItem}>
                  <View
                    style={[
                      styles.activityDot,
                      { backgroundColor: activity.color || "#3498db" },
                    ]}
                  />
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{activity.message}</Text>
                    <Text style={styles.activityTime}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={{ textAlign: "center", padding: 20, color: "#666" }}>
                No recent activities found
              </Text>
            )}
          </View>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  statsContainer: {
    padding: 16,
    minHeight: 180,
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIconContainer: {
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
  },
  statLabel: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.8,
    marginTop: 2,
  },
  actionsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  actionCards: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  actionCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginTop: 12,
  },
  actionDesc: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
  },
  activitySection: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: "#3498db",
  },
  activityList: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  activityDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: "#333",
  },
  activityTime: {
    fontSize: 12,
    color: "#999",
    marginTop: 4,
  },
});

export default AdminDashboard;
