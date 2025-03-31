import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Dimensions,
  Share,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const TripDetails = ({ route, navigation }) => {
  const { tripId } = route.params || {};
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const fetchTripDetails = async () => {
    try {
      setLoading(true);
      // Fetch the trip details using the travel plan service
      const tripData = await TravelPlanService.getTravelPlanById(tripId);
      setTrip(tripData);
    } catch (err) {
      setError("Failed to load trip details");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShareTrip = async () => {
    try {
      const result = await Share.share({
        message: `Check out my trip to ${trip.destination} for ${trip.tripDuration} days!`,
        title: `My Trip to ${trip.destination}`,
      });
    } catch (error) {
      console.error("Error sharing trip:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trip details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchTripDetails}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcons name="not-interested" size={50} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Trip Not Found</Text>
          <Text style={styles.errorText}>
            We couldn't find the trip you're looking for.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header Section with Trip Image */}
        <View style={styles.headerContainer}>
          <Image
            source={{
              uri:
                trip.imageUrl || "https://source.unsplash.com/random/?travel",
            }}
            style={styles.headerImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.8)"]}
            style={styles.headerGradient}
          />
          <View style={styles.headerContent}>
            <View style={styles.backButtonContainer}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
              >
                <Ionicons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.shareButton}
                onPress={handleShareTrip}
              >
                <Ionicons name="share-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={styles.tripTitle}>{trip.destination}</Text>
            <View style={styles.tripMetaInfo}>
              <Text style={styles.tripDuration}>{trip.tripDuration} days</Text>
              <Text style={styles.tripBudget}>${trip.budget}</Text>
            </View>
          </View>
        </View>

        {/* Trip Details Content */}
        <View style={styles.contentContainer}>
          {/* Budget Breakdown Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Budget Breakdown</Text>
            <View style={styles.budgetContainer}>
              {trip.budgetBreakdown && (
                <>
                  <View style={styles.budgetItem}>
                    <View style={styles.budgetIconContainer}>
                      <Ionicons name="bed-outline" size={20} color="#4A80F0" />
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={styles.budgetLabel}>Accommodations</Text>
                      <Text style={styles.budgetValue}>
                        ${trip.budgetBreakdown.accommodations}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetItem}>
                    <View style={styles.budgetIconContainer}>
                      <Ionicons
                        name="restaurant-outline"
                        size={20}
                        color="#4A80F0"
                      />
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={styles.budgetLabel}>Food</Text>
                      <Text style={styles.budgetValue}>
                        ${trip.budgetBreakdown.food}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetItem}>
                    <View style={styles.budgetIconContainer}>
                      <Ionicons name="car-outline" size={20} color="#4A80F0" />
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={styles.budgetLabel}>Transportation</Text>
                      <Text style={styles.budgetValue}>
                        ${trip.budgetBreakdown.transportation}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.budgetItem}>
                    <View style={styles.budgetIconContainer}>
                      <Ionicons
                        name="calendar-outline"
                        size={20}
                        color="#4A80F0"
                      />
                    </View>
                    <View style={styles.budgetDetails}>
                      <Text style={styles.budgetLabel}>Activities</Text>
                      <Text style={styles.budgetValue}>
                        ${trip.budgetBreakdown.activities}
                      </Text>
                    </View>
                  </View>
                </>
              )}

              <View style={styles.totalBudgetContainer}>
                <Text style={styles.totalBudgetLabel}>Total Budget</Text>
                <Text style={styles.totalBudgetValue}>${trip.budget}</Text>
              </View>
            </View>
          </View>

          {/* Itinerary Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Itinerary</Text>
            {trip.itinerary &&
              trip.itinerary.map((day, index) => (
                <View key={index} style={styles.itineraryItem}>
                  <View style={styles.dayContainer}>
                    <Text style={styles.dayNumber}>Day {day.day}</Text>
                  </View>
                  <View style={styles.activitiesContainer}>
                    <Text style={styles.activitiesText}>{day.activities}</Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Recommendations Section */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Recommendations</Text>
            {trip.recommendations &&
              trip.recommendations.map((item, index) => (
                <View key={index} style={styles.recommendationItem}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationName}>{item.name}</Text>
                    <Text style={styles.recommendationCategory}>
                      {item.category}
                    </Text>
                  </View>
                  <Text style={styles.recommendationDescription}>
                    {item.description}
                  </Text>
                  <View style={styles.recommendationFooter}>
                    <Text style={styles.recommendationCost}>
                      Estimated Cost: ${item.estimatedCost}
                    </Text>
                  </View>
                </View>
              ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.primaryButton]}
              onPress={() =>
                navigation.navigate("AIBudgetManager", { tripId: trip._id })
              }
            >
              <Ionicons name="calculator-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Manage Budget</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={() =>
                navigation.navigate("ItineraryOptimizer", { tripId: trip._id })
              }
            >
              <MaterialIcons name="shuffle" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Optimize Itinerary</Text>
            </TouchableOpacity>
          </View>

          {/* Additional Actions */}
          <View style={[styles.actionContainer, { marginTop: 10 }]}>
            <TouchableOpacity
              style={[styles.actionButton, styles.tertiaryButton]}
              onPress={() => navigation.navigate("TravelTips")}
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#fff"
              />
              <Text style={styles.actionButtonText}>Travel Tips</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.tertiaryButton]}
              onPress={() =>
                navigation.navigate("Filters", {
                  returnScreen: "TripDetails",
                  tripId: trip._id,
                })
              }
            >
              <Ionicons name="options-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Similar Trips</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
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
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  headerContainer: {
    height: 300,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  headerGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  headerContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  backButtonContainer: {
    position: "absolute",
    top: -230,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  tripTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  tripMetaInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  tripDuration: {
    color: "#fff",
    fontSize: 16,
    marginRight: 15,
  },
  tripBudget: {
    color: "#fff",
    fontSize: 16,
  },
  contentContainer: {
    padding: 20,
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  budgetContainer: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 15,
  },
  budgetItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  budgetIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E6EEFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  budgetDetails: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetLabel: {
    fontSize: 16,
    color: "#333",
  },
  budgetValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  totalBudgetContainer: {
    marginTop: 10,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#DDD",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  totalBudgetLabel: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  totalBudgetValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4A80F0",
  },
  itineraryItem: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
  },
  dayContainer: {
    marginRight: 15,
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4A80F0",
  },
  activitiesContainer: {
    flex: 1,
  },
  activitiesText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 22,
  },
  recommendationItem: {
    backgroundColor: "#F5F7FA",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  recommendationCategory: {
    fontSize: 14,
    color: "#4A80F0",
  },
  recommendationDescription: {
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
    marginBottom: 10,
  },
  recommendationFooter: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  recommendationCost: {
    fontSize: 14,
    color: "#666",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 0.48,
  },
  primaryButton: {
    backgroundColor: "#4A80F0",
  },
  secondaryButton: {
    backgroundColor: "#FF6B6B",
  },
  tertiaryButton: {
    backgroundColor: "#5dade2",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default TripDetails;
