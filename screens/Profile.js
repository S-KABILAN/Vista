import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { firebase_auth } from "../FirebaseAuth";
import { signOut } from "firebase/auth";
import { useAuth } from "../context/AuthContext";

const { width } = Dimensions.get("window");

const Profile = ({ navigation }) => {
  const { user: authUser, logout } = useAuth();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState({ past: 0, upcoming: 0 });
  const [preferences, setPreferences] = useState({
    notifications: true,
    darkMode: false,
    locationServices: true,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Check if user is logged in via our context
        if (authUser) {
          setUser({
            displayName: authUser.fullName || "Traveler",
            email: authUser.email,
            photoURL:
              authUser.profileImage || "https://via.placeholder.com/150",
            joinDate: new Date().toLocaleDateString(),
            role: "Explorer",
          });
        } else {
          // Fallback to Firebase auth if needed
          const currentUser = firebase_auth.currentUser;

          if (currentUser) {
            setUser({
              displayName: currentUser.displayName || "Traveler",
              email: currentUser.email,
              photoURL:
                currentUser.photoURL || "https://via.placeholder.com/150",
              joinDate: new Date(
                currentUser.metadata?.creationTime || Date.now()
              ).toLocaleDateString(),
              role: "Explorer",
            });
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    // Load saved preferences
    const loadPreferences = async () => {
      try {
        const savedPrefs = await AsyncStorage.getItem("userPreferences");
        if (savedPrefs) {
          setPreferences(JSON.parse(savedPrefs));
        }
      } catch (error) {
        console.error("Error loading preferences:", error);
      }
    };

    fetchUserData();
    loadPreferences();
  }, [authUser]);

  const handleSignOut = async () => {
    try {
      setLoading(true);

      // Sign out using our auth context
      if (logout) {
        await logout();
      } else {
        // Fallback to Firebase signout
        await signOut(firebase_auth);
      }

      // Clear AsyncStorage
      await AsyncStorage.clear();
      setUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePreference = async (key) => {
    const newPreferences = { ...preferences, [key]: !preferences[key] };
    setPreferences(newPreferences);

    try {
      await AsyncStorage.setItem(
        "userPreferences",
        JSON.stringify(newPreferences)
      );
    } catch (error) {
      console.error("Error saving preferences:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Feather name="edit-2" size={20} color="#3498db" />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <LinearGradient
          colors={["#3498db", "#2980b9"]}
          style={styles.profileCard}
        >
          <Image source={{ uri: user?.photoURL }} style={styles.profileImage} />
          <Text style={styles.profileName}>{user?.displayName}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.memberSince}>
            Member since {user?.joinDate ? user.joinDate : ""}
          </Text>

          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trips.past}</Text>
              <Text style={styles.statLabel}>Past Trips</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{trips.upcoming}</Text>
              <Text style={styles.statLabel}>Upcoming</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Travel Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Travel Preferences</Text>
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("AllTrips")}
          >
            <MaterialIcons name="flight" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>My Trips</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("TravelTips")}
          >
            <MaterialIcons name="lightbulb" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Travel Tips</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("SavedTravelPlans")}
          >
            <MaterialIcons name="bookmark" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Saved Travel Plans</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              navigation.navigate("Filters", { returnScreen: "Profile" })
            }
          >
            <MaterialIcons name="filter-list" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Trip Filters</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* App Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>

          <View style={styles.menuItem}>
            <Ionicons name="notifications" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Notifications</Text>
            <Switch
              value={preferences.notifications}
              onValueChange={() => handleTogglePreference("notifications")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={preferences.notifications ? "#3498db" : "#f4f3f4"}
            />
          </View>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("NotificationsTest")}
          >
            <Ionicons name="notifications-circle" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Test Notifications</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <View style={styles.menuItem}>
            <Ionicons name="moon" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Dark Mode</Text>
            <Switch
              value={preferences.darkMode}
              onValueChange={() => handleTogglePreference("darkMode")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={preferences.darkMode ? "#3498db" : "#f4f3f4"}
            />
          </View>

          <View style={styles.menuItem}>
            <Ionicons name="location" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Location Services</Text>
            <Switch
              value={preferences.locationServices}
              onValueChange={() => handleTogglePreference("locationServices")}
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={preferences.locationServices ? "#3498db" : "#f4f3f4"}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("ChangePassword")}
          >
            <MaterialIcons name="lock" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Change Password</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("Support")}
          >
            <MaterialIcons name="headset-mic" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>Help & Support</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navigation.navigate("About")}
          >
            <AntDesign name="infocirlceo" size={24} color="#3498db" />
            <Text style={styles.menuItemText}>About Vista Travel</Text>
            <AntDesign name="right" size={18} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.versionText}>Vista Travel v1.0.0</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  profileCard: {
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "white",
    marginBottom: 15,
  },
  profileName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  profileEmail: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 5,
  },
  memberSince: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
    marginTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 15,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  statLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  statDivider: {
    width: 1,
    height: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 15,
    padding: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    paddingLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  menuItemText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  signOutButton: {
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#f44336",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
  },
  signOutText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    marginTop: 30,
    marginBottom: 20,
    alignItems: "center",
  },
  versionText: {
    fontSize: 14,
    color: "#999",
  },
});

export default Profile;
