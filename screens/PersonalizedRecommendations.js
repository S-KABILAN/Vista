import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  AntDesign,
} from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { useAuth } from "../context/AuthContext";

const { width, height } = Dimensions.get("window");

const PersonalizedRecommendations = ({ navigation }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recommendations, setRecommendations] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TravelPlanService.getPersonalizedRecommendations();
      console.log("Got personalized recommendations:", response);

      setRecommendations(response.personalizedRecommendations);
      setUserPreferences(response.userPreferences);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching personalized recommendations:", error);
      setError(error.toString());
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecommendations();
    setRefreshing(false);
  };

  const navigateToDestination = (destination) => {
    // Navigate to AI Travel Planner with the selected destination
    navigation.navigate("AITravelPlanner", {
      selectedDestination: {
        name: destination.name,
        country: destination.country,
      },
    });
  };

  const renderDestinationCard = ({ item }) => (
    <TouchableOpacity
      style={styles.destinationCard}
      onPress={() => navigateToDestination(item)}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={["#4c669f", "#3b5998", "#192f6a"]}
        style={styles.gradientBackground}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.destinationName}>{item.name}</Text>
          <Text style={styles.destinationCountry}>{item.country}</Text>
        </View>

        <View style={styles.cardDetails}>
          <View style={styles.reasonSection}>
            <Text style={styles.reasonTitle}>Why we recommended this:</Text>
            <Text style={styles.reasonText}>{item.reason}</Text>
          </View>

          <View style={styles.metaInfoContainer}>
            <View style={styles.metaInfoItem}>
              <MaterialIcons name="date-range" size={16} color="#fff" />
              <Text style={styles.metaInfoText}>{item.bestTimeToVisit}</Text>
            </View>
            <View style={styles.metaInfoItem}>
              <MaterialIcons name="attach-money" size={16} color="#fff" />
              <Text style={styles.metaInfoText}>{item.budgetRange}</Text>
            </View>
          </View>

          <View style={styles.activitiesContainer}>
            <Text style={styles.sectionTitle}>Recommended Activities:</Text>
            {item.recommendedActivities.map((activity, index) => (
              <View key={index} style={styles.activityItem}>
                <FontAwesome5 name="check-circle" size={14} color="#4CAF50" />
                <Text style={styles.activityText}>{activity}</Text>
              </View>
            ))}
          </View>

          <View style={styles.hotelContainer}>
            <Text style={styles.sectionTitle}>Suggested Hotel:</Text>
            <View style={styles.hotelItem}>
              <FontAwesome5 name="hotel" size={14} color="#FFD700" />
              <Text style={styles.hotelText}>{item.suggestedHotel}</Text>
            </View>
          </View>

          <View style={styles.exploreButtonContainer}>
            <TouchableOpacity
              style={styles.exploreButton}
              onPress={() => navigateToDestination(item)}
            >
              <Text style={styles.exploreButtonText}>
                Explore This Destination
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderUserPreferences = () => {
    if (!userPreferences) return null;

    return (
      <View style={styles.preferencesContainer}>
        <Text style={styles.preferencesTitle}>Your Travel Profile</Text>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceItem}>
            <FontAwesome5 name="map-marked-alt" size={18} color="#4c669f" />
            <Text style={styles.preferenceLabel}>Places You've Visited:</Text>
            <Text style={styles.preferenceValue}>
              {userPreferences.visitedDestinations &&
              userPreferences.visitedDestinations.length > 0
                ? userPreferences.visitedDestinations.join(", ")
                : "No trips yet"}
            </Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceItem}>
            <FontAwesome5 name="heart" size={18} color="#4c669f" />
            <Text style={styles.preferenceLabel}>Your Interests:</Text>
            <Text style={styles.preferenceValue}>
              {userPreferences.topActivities &&
              userPreferences.topActivities.length > 0
                ? userPreferences.topActivities.join(", ")
                : "No preferences yet"}
            </Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceItem}>
            <FontAwesome5 name="wallet" size={18} color="#4c669f" />
            <Text style={styles.preferenceLabel}>Average Budget:</Text>
            <Text style={styles.preferenceValue}>
              ${userPreferences.avgBudget || "N/A"}
            </Text>
          </View>
        </View>

        <View style={styles.preferenceRow}>
          <View style={styles.preferenceItem}>
            <FontAwesome5 name="hotel" size={18} color="#4c669f" />
            <Text style={styles.preferenceLabel}>Preferred Hotels:</Text>
            <Text style={styles.preferenceValue}>
              {userPreferences.preferredHotelTypes &&
              userPreferences.preferredHotelTypes.length > 0
                ? userPreferences.preferredHotelTypes.join(", ")
                : "No preferences yet"}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4c669f" />
        <Text style={styles.loadingText}>
          Analyzing your travel history to create personalized
          recommendations...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchRecommendations}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalized For You</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {renderUserPreferences()}

        <Text style={styles.recommendationsTitle}>
          Destinations You Might Love
        </Text>

        {recommendations && recommendations.destinations ? (
          <FlatList
            data={recommendations.destinations}
            renderItem={renderDestinationCard}
            keyExtractor={(item, index) => `destination-${index}`}
            horizontal={false}
            scrollEnabled={false}
            contentContainerStyle={styles.destinationsList}
          />
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="cloud-offline-outline" size={48} color="#ccc" />
            <Text style={styles.noDataText}>
              No recommendations available. Please try again later.
            </Text>
          </View>
        )}
      </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  scrollContent: {
    paddingBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  errorText: {
    textAlign: "center",
    marginTop: 8,
    color: "#555",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#4c669f",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  preferencesContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  preferencesTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  preferenceRow: {
    marginBottom: 12,
  },
  preferenceItem: {
    flexDirection: "column",
  },
  preferenceLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginTop: 4,
    marginBottom: 2,
  },
  preferenceValue: {
    fontSize: 15,
    color: "#333",
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 24,
    marginBottom: 16,
    marginHorizontal: 16,
    color: "#333",
  },
  destinationsList: {
    paddingHorizontal: 16,
  },
  destinationCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientBackground: {
    borderRadius: 12,
    overflow: "hidden",
  },
  cardHeader: {
    padding: 16,
  },
  destinationName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  destinationCountry: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  cardDetails: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
  },
  reasonSection: {
    marginBottom: 16,
  },
  reasonTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 15,
    color: "#fff",
    opacity: 0.9,
  },
  metaInfoContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  metaInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
  },
  metaInfoText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  activitiesContainer: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  activityText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  hotelContainer: {
    marginBottom: 16,
  },
  hotelItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  hotelText: {
    fontSize: 14,
    color: "#fff",
    marginLeft: 8,
  },
  exploreButtonContainer: {
    alignItems: "flex-end",
  },
  exploreButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  exploreButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginRight: 8,
  },
  noDataContainer: {
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  noDataText: {
    marginTop: 16,
    textAlign: "center",
    color: "#777",
  },
});

export default PersonalizedRecommendations;
