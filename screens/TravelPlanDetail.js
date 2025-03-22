import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";

const TravelPlanDetail = ({ route, navigation }) => {
  const { planId } = route.params || {};
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPlanDetails();
  }, [planId]);

  const fetchPlanDetails = async () => {
    if (!planId) {
      setError("No plan ID provided");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const planData = await TravelPlanService.getTravelPlan(planId);
      setPlan(planData);
    } catch (error) {
      console.error("Error fetching plan details:", error);
      setError("Failed to load travel plan details");
    } finally {
      setLoading(false);
    }
  };

  const toggleBookmark = async () => {
    try {
      setLoading(true);
      await TravelPlanService.toggleBookmark(planId);
      // Update the local state
      setPlan((prevPlan) => ({
        ...prevPlan,
        isBookmarked: !prevPlan.isBookmarked,
      }));
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      Alert.alert("Error", "Failed to update bookmark status");
    } finally {
      setLoading(false);
    }
  };

  const deletePlan = async () => {
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
              Alert.alert("Success", "Travel plan deleted");
              navigation.goBack();
            } catch (error) {
              console.error("Error deleting travel plan:", error);
              Alert.alert("Error", "Failed to delete travel plan");
              setLoading(false);
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
          <ActivityIndicator size="large" color="#4A80F0" />
          <Text style={styles.loadingText}>Loading plan details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>
            {error || "Failed to load travel plan"}
          </Text>
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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.headerTitle}>{plan.destination}</Text>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={toggleBookmark}
            >
              <Ionicons
                name={plan.isBookmarked ? "bookmark" : "bookmark-outline"}
                size={24}
                color={plan.isBookmarked ? "#4A80F0" : "#333"}
              />
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={deletePlan}>
              <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Destination Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("../assets/destination-placeholder.jpg")}
            style={styles.destinationImage}
          />

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.imageGradient}
          >
            <View style={styles.planInfoOverlay}>
              <Text style={styles.destinationName}>{plan.destination}</Text>
              <View style={styles.planInfoRow}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="calendar-alt" size={14} color="white" />
                  <Text style={styles.infoText}>
                    {plan.tripDuration}{" "}
                    {plan.tripDuration === 1 ? "day" : "days"}
                  </Text>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="dollar-sign" size={14} color="white" />
                  <Text style={styles.infoText}>${plan.budget}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Plan Content */}
        <View style={styles.contentContainer}>
          {/* Trip Overview */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Trip Overview</Text>
            <View style={styles.overviewContainer}>
              <View style={styles.overviewItem}>
                <View style={styles.overviewIcon}>
                  <FontAwesome5 name="calendar" size={20} color="#4A80F0" />
                </View>
                <View>
                  <Text style={styles.overviewLabel}>Duration</Text>
                  <Text style={styles.overviewValue}>
                    {plan.tripDuration} days
                  </Text>
                </View>
              </View>

              <View style={styles.overviewItem}>
                <View style={styles.overviewIcon}>
                  <FontAwesome5 name="dollar-sign" size={20} color="#4A80F0" />
                </View>
                <View>
                  <Text style={styles.overviewLabel}>Budget</Text>
                  <Text style={styles.overviewValue}>${plan.budget}</Text>
                </View>
              </View>

              {plan.startDate && (
                <View style={styles.overviewItem}>
                  <View style={styles.overviewIcon}>
                    <FontAwesome5
                      name="calendar-check"
                      size={20}
                      color="#4A80F0"
                    />
                  </View>
                  <View>
                    <Text style={styles.overviewLabel}>Dates</Text>
                    <Text style={styles.overviewValue}>
                      {new Date(plan.startDate).toLocaleDateString()}
                      {plan.endDate &&
                        ` - ${new Date(plan.endDate).toLocaleDateString()}`}
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Itinerary */}
          {plan.itinerary && plan.itinerary.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Itinerary</Text>
              {plan.itinerary.map((day, index) => (
                <View key={index} style={styles.dayContainer}>
                  <View style={styles.dayHeader}>
                    <View style={styles.dayNumberContainer}>
                      <Text style={styles.dayNumber}>{day.day}</Text>
                    </View>
                    <Text style={styles.dayTitle}>Day {day.day}</Text>
                  </View>
                  <View style={styles.dayContent}>
                    <Text style={styles.dayActivities}>{day.activities}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Budget Breakdown */}
          {plan.budgetBreakdown && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Budget Breakdown</Text>
              <View style={styles.budgetContainer}>
                {Object.entries(plan.budgetBreakdown).map(([key, value]) => {
                  if (key === "total") return null;
                  return (
                    <View key={key} style={styles.budgetItem}>
                      <Text style={styles.budgetCategory}>
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                      </Text>
                      <Text style={styles.budgetValue}>${value}</Text>
                    </View>
                  );
                })}

                <View style={styles.totalBudgetItem}>
                  <Text style={styles.totalBudgetLabel}>Total</Text>
                  <Text style={styles.totalBudgetValue}>
                    ${plan.budgetBreakdown.total || plan.budget}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Recommendations */}
          {plan.recommendations && plan.recommendations.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {plan.recommendations.map((recommendation, index) => (
                <View key={index} style={styles.recommendationCard}>
                  <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationName}>
                      {recommendation.name}
                    </Text>
                    <View style={styles.categoryBadge}>
                      <Text style={styles.categoryText}>
                        {recommendation.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.recommendationDescription}>
                    {recommendation.description}
                  </Text>

                  <View style={styles.recommendationFooter}>
                    {recommendation.address && (
                      <View style={styles.recommendationDetailItem}>
                        <Ionicons
                          name="location-outline"
                          size={14}
                          color="#666"
                        />
                        <Text style={styles.recommendationDetailText}>
                          {recommendation.address}
                        </Text>
                      </View>
                    )}

                    {recommendation.estimatedCost > 0 && (
                      <View style={styles.recommendationDetailItem}>
                        <Ionicons name="cash-outline" size={14} color="#666" />
                        <Text style={styles.recommendationDetailText}>
                          ${recommendation.estimatedCost}
                        </Text>
                      </View>
                    )}

                    {recommendation.rating && (
                      <View style={styles.recommendationDetailItem}>
                        <Ionicons name="star" size={14} color="#FFD700" />
                        <Text style={styles.recommendationDetailText}>
                          {recommendation.rating}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8FA",
  },
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  backButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4A80F0",
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
  },
  backIconButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
  },
  actionButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    position: "relative",
  },
  destinationImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    justifyContent: "flex-end",
    padding: 16,
  },
  planInfoOverlay: {
    width: "100%",
  },
  destinationName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
  },
  planInfoRow: {
    flexDirection: "row",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  infoText: {
    color: "white",
    marginLeft: 8,
    fontSize: 14,
  },
  contentContainer: {
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
  },
  overviewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  overviewItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 16,
  },
  overviewIcon: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(74, 128, 240, 0.1)",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  overviewLabel: {
    fontSize: 12,
    color: "#666",
  },
  overviewValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  dayContainer: {
    marginBottom: 16,
    borderLeftWidth: 2,
    borderLeftColor: "#4A80F0",
    paddingLeft: 16,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    backgroundColor: "#4A80F0",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  dayNumber: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  dayContent: {
    paddingLeft: 36,
  },
  dayActivities: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  budgetContainer: {
    width: "100%",
  },
  budgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  budgetCategory: {
    fontSize: 14,
    color: "#555",
  },
  budgetValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  totalBudgetItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
  },
  totalBudgetLabel: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  totalBudgetValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4A80F0",
  },
  recommendationCard: {
    backgroundColor: "#F7F8FA",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  categoryBadge: {
    backgroundColor: "#4A80F0",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  categoryText: {
    color: "white",
    fontSize: 12,
  },
  recommendationDescription: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationFooter: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recommendationDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 4,
  },
  recommendationDetailText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
  },
});

// Export the component and a function to create it
// This helps with circular dependencies in navigation
export const createTravelPlanDetailScreen = TravelPlanDetail;
export default TravelPlanDetail;
