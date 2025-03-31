import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ImageBackground,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  StatusBar,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.9;

const AllTrips = ({ navigation }) => {
  const [trips, setTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("date"); // 'date' or 'budget' or 'duration'
  const [filterActive, setFilterActive] = useState("all"); // 'all', 'upcoming', 'past'

  const fetchAllTrips = async () => {
    try {
      setLoading(true);
      const data = await TravelPlanService.getAllTravelPlans();

      // Add calculated fields for display purposes
      const processedTrips = data.map((trip) => {
        // Calculate days left (dummy data for now)
        const startDate = trip.startDate
          ? new Date(trip.startDate)
          : new Date();
        const today = new Date();
        const daysLeft = Math.floor(
          (startDate - today) / (1000 * 60 * 60 * 24)
        );

        // Determine if the trip is upcoming or past
        const isUpcoming = daysLeft >= 0;

        return {
          ...trip,
          daysLeft: daysLeft >= 0 ? daysLeft : 0,
          isPast: !isUpcoming,
          imageUrl:
            trip.imageUrl ||
            `https://source.unsplash.com/random/?${trip.destination}`,
        };
      });

      setTrips(processedTrips);
      applyFiltersAndSorting(processedTrips, searchQuery, sortBy, filterActive);
    } catch (err) {
      setError("Failed to load trips");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllTrips();
  }, []);

  useEffect(() => {
    applyFiltersAndSorting(trips, searchQuery, sortBy, filterActive);
  }, [searchQuery, sortBy, filterActive]);

  const applyFiltersAndSorting = (tripsData, query, sort, filter) => {
    // First apply filters
    let result = [...tripsData];

    // Apply search query filter
    if (query.trim() !== "") {
      result = result.filter((trip) =>
        trip.destination.toLowerCase().includes(query.toLowerCase())
      );
    }

    // Apply active status filter
    if (filter === "upcoming") {
      result = result.filter((trip) => !trip.isPast);
    } else if (filter === "past") {
      result = result.filter((trip) => trip.isPast);
    }

    // Apply sorting
    result.sort((a, b) => {
      if (sort === "date") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sort === "budget") {
        return b.budget - a.budget;
      } else if (sort === "duration") {
        return b.tripDuration - a.tripDuration;
      }
      return 0;
    });

    setFilteredTrips(result);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  const navigateToTripDetails = (trip) => {
    navigation.navigate("TripDetails", { tripId: trip._id });
  };

  const renderTripCard = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigateToTripDetails(item)}
    >
      <ImageBackground
        source={{ uri: item.imageUrl }}
        style={styles.tripImage}
        imageStyle={{ borderRadius: 15 }}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.tripGradient}
        >
          <View style={styles.tripDateContainer}>
            {item.startDate && item.endDate ? (
              <Text style={styles.tripDate}>
                {formatDate(item.startDate)} - {formatDate(item.endDate)}
              </Text>
            ) : (
              <Text style={styles.tripDate}>{item.tripDuration} days</Text>
            )}
          </View>
          <View style={styles.tripInfo}>
            <View>
              <Text style={styles.tripDestination}>{item.destination}</Text>
              <Text style={styles.tripCountry}>
                {item.country || "Budget: $" + item.budget}
              </Text>
            </View>
            {!item.isPast && (
              <View style={styles.daysLeftContainer}>
                <Text style={styles.daysLeftNumber}>{item.daysLeft}</Text>
                <Text style={styles.daysLeftText}>days left</Text>
              </View>
            )}
            {item.isPast && (
              <View
                style={[styles.daysLeftContainer, styles.completedContainer]}
              >
                <Text style={styles.completedText}>Completed</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Trips</Text>
        <View style={styles.headerRightButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("TravelTips")}
          >
            <Ionicons
              name="information-circle-outline"
              size={22}
              color="#333"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate("Filters")}
          >
            <Ionicons name="options-outline" size={22} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons
            name="search"
            size={20}
            color="#999"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search trips..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterActive === "all" && styles.activeFilterTab,
          ]}
          onPress={() => setFilterActive("all")}
        >
          <Text
            style={[
              styles.filterTabText,
              filterActive === "all" && styles.activeFilterTabText,
            ]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterActive === "upcoming" && styles.activeFilterTab,
          ]}
          onPress={() => setFilterActive("upcoming")}
        >
          <Text
            style={[
              styles.filterTabText,
              filterActive === "upcoming" && styles.activeFilterTabText,
            ]}
          >
            Upcoming
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterTab,
            filterActive === "past" && styles.activeFilterTab,
          ]}
          onPress={() => setFilterActive("past")}
        >
          <Text
            style={[
              styles.filterTabText,
              filterActive === "past" && styles.activeFilterTabText,
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <Text style={styles.sortText}>Sort by:</Text>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === "date" && styles.activeSortOption,
          ]}
          onPress={() => setSortBy("date")}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === "date" && styles.activeSortOptionText,
            ]}
          >
            Date
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === "budget" && styles.activeSortOption,
          ]}
          onPress={() => setSortBy("budget")}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === "budget" && styles.activeSortOptionText,
            ]}
          >
            Budget
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortOption,
            sortBy === "duration" && styles.activeSortOption,
          ]}
          onPress={() => setSortBy("duration")}
        >
          <Text
            style={[
              styles.sortOptionText,
              sortBy === "duration" && styles.activeSortOptionText,
            ]}
          >
            Duration
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading trips...</Text>
        </View>
      )}

      {/* Error State */}
      {error && (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchAllTrips}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty State */}
      {!loading && !error && filteredTrips.length === 0 && (
        <View style={styles.emptyContainer}>
          <Ionicons name="airplane-outline" size={60} color="#DDD" />
          <Text style={styles.emptyTitle}>No Trips Found</Text>
          <Text style={styles.emptyText}>
            {searchQuery
              ? "Try a different search term"
              : "Start planning your first adventure!"}
          </Text>
          <TouchableOpacity
            style={styles.createTripButton}
            onPress={() => navigation.navigate("AITravelPlanner")}
          >
            <Text style={styles.createTripButtonText}>Plan a Trip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Trip List */}
      {!loading && !error && filteredTrips.length > 0 && (
        <FlatList
          data={filteredTrips}
          renderItem={renderTripCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.tripsList}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Add New Trip Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("AITravelPlanner")}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRightButtons: {
    flexDirection: "row",
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterTabs: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
  },
  activeFilterTab: {
    backgroundColor: "#4A80F0",
  },
  filterTabText: {
    fontSize: 14,
    color: "#666",
  },
  activeFilterTabText: {
    color: "#fff",
    fontWeight: "600",
  },
  sortContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sortText: {
    fontSize: 14,
    color: "#666",
    marginRight: 10,
  },
  sortOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },
  activeSortOption: {
    backgroundColor: "#4A80F0",
  },
  sortOptionText: {
    fontSize: 12,
    color: "#666",
  },
  activeSortOptionText: {
    color: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 50,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#007AFF",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 50,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  emptyText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  createTripButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: "#4A80F0",
    borderRadius: 8,
  },
  createTripButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  tripsList: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  tripCard: {
    width: cardWidth,
    height: 180,
    marginBottom: 16,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tripImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  tripGradient: {
    height: "100%",
    justifyContent: "flex-end",
    padding: 15,
  },
  tripDateContainer: {
    position: "absolute",
    top: 15,
    left: 15,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tripDate: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  tripInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  tripDestination: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
  },
  tripCountry: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  daysLeftContainer: {
    alignItems: "center",
    backgroundColor: "rgba(74, 128, 240, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  daysLeftNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  daysLeftText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  completedContainer: {
    backgroundColor: "rgba(39, 174, 96, 0.9)",
  },
  completedText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});

export default AllTrips;
