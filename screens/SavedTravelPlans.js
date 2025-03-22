import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";

const SavedTravelPlans = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [travelPlans, setTravelPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Load travel plans on component mount and when coming back to screen
  useEffect(() => {
    fetchTravelPlans();

    // Refresh when screen is focused
    const unsubscribe = navigation.addListener("focus", () => {
      fetchTravelPlans();
    });

    return unsubscribe;
  }, [navigation]);

  // Function to fetch travel plans
  const fetchTravelPlans = async () => {
    if (!isAuthenticated) {
      setError("Please sign in to view your saved travel plans");
      
      // Navigate to Login screen
      navigation.navigate("Login");
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is authenticated
      if (!user || !user.id) {
        console.log("Missing user ID in user object:", user);
        
        // Navigate to Login screen
        navigation.navigate("Login");
        return;
      }
      
      console.log("Fetching travel plans for user:", user.id);
      const plans = await TravelPlanService.getAllTravelPlans();
      
      if (plans && plans.length > 0) {
        console.log(`Travel plans fetched successfully: ${plans.length}`);
        setTravelPlans(plans);
        setError(null);
      } else {
        console.log("No travel plans found");
        setTravelPlans([]);
        setError("No travel plans found. Create a plan to get started!");
      }
    } catch (error) {
      const errorMessage = 
        error.response?.data?.message || error.message || "Unknown error";
      const errorStatus = error.response?.status;
      
      console.error("Error fetching travel plans:", {
        message: errorMessage,
        status: errorStatus,
      });
      
      setError(`Failed to load travel plans: ${errorMessage}`);
      
      // Handle authentication errors
      if (errorMessage === "Authentication expired" || 
          errorMessage === "Authentication required" ||
          errorStatus === 401) {
        
        Alert.alert(
          "Authentication Error",
          "Your session has expired. Please sign in again.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Sign In", 
              onPress: () => {
                // Navigate directly to Login
                navigation.navigate("Login");
              }
            },
          ]
        );
        
        // Use mock data during development
        if (__DEV__) {
          setTravelPlans([
            {
              _id: "mock1",
              destination: "Paris",
              budget: 2000,
              tripDuration: 5,
              isBookmarked: true,
              createdAt: new Date().toISOString(),
            },
            {
              _id: "mock2",
              destination: "Tokyo",
              budget: 3000,
              tripDuration: 7,
              isBookmarked: false,
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull to refresh
  const onRefresh = () => {
    setRefreshing(true);
    fetchTravelPlans();
  };

  // Handle plan press - View plan details
  const handlePlanPress = (plan) => {
    navigation.navigate("TravelPlanDetail", { planId: plan._id });
  };

  // Toggle bookmark status
  const toggleBookmark = async (plan) => {
    try {
      setLoading(true);
      await TravelPlanService.toggleBookmark(plan._id);

      // Update the plans list
      setTravelPlans(
        travelPlans.map((p) =>
          p._id === plan._id ? { ...p, isBookmarked: !p.isBookmarked } : p
        )
      );
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark status");
    } finally {
      setLoading(false);
    }
  };

  // Delete a travel plan
  const deletePlan = async (planId) => {
    Alert.alert(
      "Delete Plan",
      "Are you sure you want to delete this travel plan? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setLoading(true);
              await TravelPlanService.deleteTravelPlan(planId);
              // Remove the plan from the list
              setTravelPlans(travelPlans.filter((plan) => plan._id !== planId));
            } catch (error) {
              console.error("Error deleting travel plan:", error);
              Alert.alert("Error", "Failed to delete travel plan");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render a single travel plan item
  const renderTravelPlanItem = ({ item }) => {
    const startDate = item.startDate
      ? new Date(item.startDate).toLocaleDateString()
      : "No date set";
    const endDate = item.endDate
      ? new Date(item.endDate).toLocaleDateString()
      : "";
    const dateText = startDate + (endDate ? ` - ${endDate}` : "");

    return (
      <TouchableOpacity
        style={styles.planCard}
        onPress={() => handlePlanPress(item)}
      >
        <LinearGradient
          colors={["rgba(73, 127, 240, 0.8)", "rgba(97, 91, 230, 0.9)"]}
          style={styles.cardGradient}
        >
          {/* Placeholder image or destination image */}
          <View style={styles.cardImageContainer}>
            <Image
              source={require("../assets/destination-placeholder.jpg")}
              style={styles.cardImage}
            />
          </View>

          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <Text style={styles.destinationName}>{item.destination}</Text>
              <TouchableOpacity
                style={styles.bookmarkButton}
                onPress={() => toggleBookmark(item)}
              >
                <Ionicons
                  name={item.isBookmarked ? "bookmark" : "bookmark-outline"}
                  size={24}
                  color={item.isBookmarked ? "#FFC107" : "white"}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.cardDetails}>
              <View style={styles.detailItem}>
                <FontAwesome5 name="calendar-alt" size={14} color="white" />
                <Text style={styles.detailText}>
                  {item.tripDuration} {item.tripDuration === 1 ? "day" : "days"}
                </Text>
              </View>

              <View style={styles.detailItem}>
                <FontAwesome5 name="dollar-sign" size={14} color="white" />
                <Text style={styles.detailText}>${item.budget}</Text>
              </View>

              <View style={styles.detailItem}>
                <FontAwesome5 name="clock" size={14} color="white" />
                <Text style={styles.detailText}>{dateText}</Text>
              </View>
            </View>
          </View>

          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deletePlan(item._id)}
          >
            <Ionicons name="trash-outline" size={18} color="white" />
          </TouchableOpacity>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  // Loading view
  if (loading && !refreshing && travelPlans.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Saved Travel Plans</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
          <Text style={styles.loadingText}>Loading your travel plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error or not authenticated view
  if (error && !isAuthenticated) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Saved Travel Plans</Text>
        </View>
        <View style={styles.messageContainer}>
          <FontAwesome5 name="user-lock" size={50} color="#CCCCCC" />
          <Text style={styles.messageTitle}>Sign In Required</Text>
          <Text style={styles.messageText}>
            Please sign in to view your saved travel plans
          </Text>
          <TouchableOpacity
            style={styles.signInButton}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state
  if (travelPlans.length === 0 && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Saved Travel Plans</Text>
        </View>
        <View style={styles.messageContainer}>
          <FontAwesome5 name="route" size={50} color="#CCCCCC" />
          <Text style={styles.messageTitle}>No Travel Plans</Text>
          <Text style={styles.messageText}>
            You haven't saved any travel plans yet
          </Text>
          <TouchableOpacity
            style={styles.createPlanButton}
            onPress={() => navigation.navigate("AITravelPlanner")}
          >
            <Text style={styles.createPlanButtonText}>Create New Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>Saved Travel Plans</Text>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() => navigation.navigate("AITravelPlanner")}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={travelPlans}
        renderItem={renderTravelPlanItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.plansList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#4A80F0"]}
            tintColor="#4A80F0"
          />
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333333",
  },
  createButton: {
    backgroundColor: "#4A80F0",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  plansList: {
    padding: 16,
  },
  planCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardGradient: {
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImageContainer: {
    height: 120,
    width: "100%",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  destinationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  bookmarkButton: {
    padding: 5,
  },
  cardDetails: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 5,
  },
  detailText: {
    color: "white",
    marginLeft: 6,
    fontSize: 14,
  },
  deleteButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  messageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
  },
  messageText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  signInButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  signInButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  createPlanButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  createPlanButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SavedTravelPlans;
