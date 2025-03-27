import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FontAwesome5 } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import * as TravelPlanService from "../services/TravelPlanService";

const SavedTravelPlans = ({ navigation }) => {
  const { user, isAuthenticated } = useAuth();
  const [travelPlans, setTravelPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchTravelPlans = async () => {
    if (!isAuthenticated) {
      navigation.navigate("Login");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const plans = await TravelPlanService.getAllTravelPlans();
      console.log("Fetched plans:", plans);
      setTravelPlans(plans);
    } catch (error) {
      console.error("Error fetching travel plans:", error);

      const errorMessage = error.response?.data?.message || error.message;
      setError(errorMessage);

      if (error.response?.status === 401) {
        Alert.alert(
          "Session Expired",
          "Please sign in again to view your travel plans",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Sign In", onPress: () => navigation.navigate("Login") },
          ]
        );
      } else {
        Alert.alert(
          "Error",
          "Failed to load travel plans. Please try again later."
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTravelPlans();

    const unsubscribe = navigation.addListener("focus", fetchTravelPlans);
    return unsubscribe;
  }, [navigation]);

  const renderTravelPlan = ({ item }) => (
    <TouchableOpacity
      style={styles.planCard}
      onPress={() =>
        navigation.navigate("TravelPlanDetail", { planId: item._id })
      }
    >
      <Text style={styles.destinationText}>{item.destination}</Text>
      <View style={styles.planDetails}>
        <Text style={styles.detailText}>{item.tripDuration} days</Text>
        <Text style={styles.detailText}>${item.budget}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading travel plans...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.messageContainer}>
          <FontAwesome5 name="exclamation-circle" size={50} color="#FF3B30" />
          <Text style={styles.errorTitle}>Error Loading Plans</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTravelPlans}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={travelPlans}
        renderItem={renderTravelPlan}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              fetchTravelPlans();
            }}
          />
        }
        ListEmptyComponent={
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
  destinationText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "black",
  },
  planDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  detailText: {
    color: "black",
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF3B30",
    marginTop: 20,
    marginBottom: 10,
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SavedTravelPlans;
