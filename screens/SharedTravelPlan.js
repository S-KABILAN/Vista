import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as CollaborationService from "../services/CollaborationService";
import { useAuth } from "../context/AuthContext";

const SharedTravelPlan = ({ route, navigation }) => {
  const { shareLink } = route.params;
  const { isAuthenticated } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedPlan();
  }, [shareLink]);

  const fetchSharedPlan = async () => {
    try {
      setLoading(true);
      const data = await CollaborationService.getSharedTravelPlan(shareLink);
      setPlan(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching shared plan:", error);
      if (error.response && error.response.status === 410) {
        setError("This share link has expired");
      } else {
        setError("Unable to load the shared travel plan");
      }
      setLoading(false);
    }
  };

  const handleCopyPlan = async () => {
    if (!isAuthenticated) {
      Alert.alert(
        "Login Required",
        "You need to be logged in to save this travel plan.",
        [
          {
            text: "Login",
            onPress: () =>
              navigation.navigate("Login", {
                returnScreen: "SharedTravelPlan",
                shareLink,
              }),
          },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    Alert.alert(
      "Copy Travel Plan",
      "Would you like to save a copy of this travel plan to your account?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Save Copy",
          onPress: async () => {
            try {
              setLoading(true);
              const result = await CollaborationService.copySharedTravelPlan(
                shareLink
              );
              setLoading(false);

              Alert.alert(
                "Success",
                "Travel plan has been saved to your account",
                [
                  {
                    text: "View Plan",
                    onPress: () =>
                      navigation.navigate("TripDetails", {
                        tripId: result.planId,
                      }),
                  },
                  {
                    text: "OK",
                    onPress: () => navigation.navigate("AllTrips"),
                  },
                ]
              );
            } catch (error) {
              setLoading(false);
              Alert.alert(
                "Error",
                "Failed to copy travel plan. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading shared travel plan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={60} color="#e74c3c" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#3498db", "#2980b9"]} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Shared Travel Plan</Text>
          <View style={{ width: 24 }} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.planHeader}>
          <Image
            source={{
              uri: `https://source.unsplash.com/featured/?${encodeURIComponent(
                plan.destination || "travel"
              )}`,
            }}
            style={styles.destinationImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.imageOverlay}
          />
          <View style={styles.destinationInfo}>
            <Text style={styles.destinationName}>{plan.destination}</Text>
            <Text style={styles.tripDuration}>{plan.tripDuration} days</Text>
          </View>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleCopyPlan}
          >
            <Ionicons name="copy-outline" size={22} color="white" />
            <Text style={styles.actionButtonText}>Save a Copy</Text>
          </TouchableOpacity>
        </View>

        {/* Itinerary Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itinerary</Text>
          {plan.itinerary && plan.itinerary.length > 0 ? (
            plan.itinerary.map((day, index) => (
              <View key={index} style={styles.itineraryDay}>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayNumber}>Day {day.day}</Text>
                </View>
                <View style={styles.dayContent}>
                  <Text style={styles.dayActivities}>{day.activities}</Text>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.emptyMessage}>
              No itinerary details available
            </Text>
          )}
        </View>

        {/* Recommendations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recommendations</Text>
          {plan.recommendations && plan.recommendations.length > 0 ? (
            plan.recommendations.map((item, index) => (
              <View key={index} style={styles.recommendationItem}>
                <View style={styles.recommendationHeader}>
                  <Text style={styles.recommendationName}>{item.name}</Text>
                  <Text style={styles.recommendationCategory}>
                    {item.category}
                  </Text>
                </View>
                {item.description && (
                  <Text style={styles.recommendationDescription}>
                    {item.description}
                  </Text>
                )}
                {item.estimatedCost && (
                  <Text style={styles.recommendationCost}>
                    Est. Cost: ${item.estimatedCost}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyMessage}>
              No recommendations available
            </Text>
          )}
        </View>

        {/* Attractions Section */}
        {plan.destinationData && plan.destinationData.topAttractions && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Attractions</Text>
            {plan.destinationData.topAttractions.length > 0 ? (
              plan.destinationData.topAttractions.map((item, index) => (
                <View key={index} style={styles.attractionItem}>
                  <Text style={styles.attractionName}>{item.name}</Text>
                  {item.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={16} color="#f1c40f" />
                      <Text style={styles.ratingText}>
                        {item.rating.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.emptyMessage}>No attractions available</Text>
            )}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            This is a shared travel plan. Login or register to create your own!
          </Text>
          {!isAuthenticated && (
            <TouchableOpacity
              style={styles.registerButton}
              onPress={() => navigation.navigate("Register")}
            >
              <Text style={styles.registerButtonText}>Sign Up</Text>
            </TouchableOpacity>
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 10,
    color: "#333",
  },
  errorMessage: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 10,
  },
  backButton: {
    marginTop: 20,
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
  },
  header: {
    height: 60,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: "100%",
    paddingHorizontal: 15,
  },
  backBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  content: {
    flex: 1,
  },
  planHeader: {
    height: 200,
    position: "relative",
    marginBottom: 15,
  },
  destinationImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  destinationInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
  },
  destinationName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  tripDuration: {
    fontSize: 16,
    color: "white",
    opacity: 0.9,
  },
  actionContainer: {
    padding: 15,
  },
  actionButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 5,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "bold",
    marginLeft: 8,
  },
  section: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  itineraryDay: {
    flexDirection: "row",
    marginBottom: 15,
  },
  dayBadge: {
    backgroundColor: "#3498db",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignSelf: "flex-start",
    marginRight: 10,
  },
  dayNumber: {
    color: "white",
    fontWeight: "bold",
  },
  dayContent: {
    flex: 1,
  },
  dayActivities: {
    color: "#555",
    lineHeight: 20,
  },
  recommendationItem: {
    backgroundColor: "#f9f9f9",
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recommendationCategory: {
    fontSize: 12,
    color: "#3498db",
    backgroundColor: "#e8f4fd",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  recommendationDescription: {
    color: "#666",
    marginBottom: 5,
  },
  recommendationCost: {
    fontSize: 14,
    color: "#27ae60",
    fontWeight: "bold",
    textAlign: "right",
  },
  attractionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  attractionName: {
    fontSize: 15,
    color: "#333",
    flex: 1,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  ratingText: {
    marginLeft: 5,
    color: "#555",
  },
  emptyMessage: {
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 15,
  },
  footer: {
    padding: 20,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
    color: "#666",
    marginBottom: 15,
  },
  registerButton: {
    backgroundColor: "#27ae60",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 5,
  },
  registerButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});

export default SharedTravelPlan;
