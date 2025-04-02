import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  Alert,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "../config";

const AdminTravelPlanList = ({ navigation }) => {
  const [travelPlans, setTravelPlans] = useState([]);
  const [filteredPlans, setFilteredPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });

  // Fetch travel plans from API
  const fetchTravelPlans = async (page = 1) => {
    try {
      setLoading(true);
      const response = await axios.retryRequest(
        {
          url: "/api/admin/travel-plans",
          method: "get",
          params: { page, limit: pagination.limit },
          timeout: 8000,
        },
        2
      ); // 2 retries

      if (response.data.success) {
        if (page === 1) {
          setTravelPlans(response.data.travelPlans);
          setFilteredPlans(response.data.travelPlans);
        } else {
          setTravelPlans([...travelPlans, ...response.data.travelPlans]);
          setFilteredPlans([...filteredPlans, ...response.data.travelPlans]);
        }
        setPagination(response.data.pagination);
      } else {
        console.error("Failed to fetch travel plans:", response.data.message);
        Alert.alert("Error", "Failed to fetch travel plan data");
      }
    } catch (error) {
      console.error("Error fetching travel plans:", error);
      Alert.alert(
        "Error",
        "Failed to connect to the server. Please try again later."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTravelPlans();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery("");
    fetchTravelPlans(1);
  };

  const handleLoadMore = () => {
    if (pagination.page < pagination.pages && !loading) {
      fetchTravelPlans(pagination.page + 1);
    }
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredPlans(travelPlans);
    } else {
      const filtered = travelPlans.filter(
        (plan) =>
          (plan.destination &&
            plan.destination.toLowerCase().includes(text.toLowerCase())) ||
          (plan.userId &&
            plan.userId.fullName &&
            plan.userId.fullName.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredPlans(filtered);
    }
  };

  const handleViewPlan = (plan) => {
    // In a real app, navigate to plan details screen
    Alert.alert(
      "Travel Plan Details",
      `Destination: ${plan.destination}\nBudget: $${plan.budget}\nDuration: ${plan.tripDuration} days`
    );
  };

  const handleFeaturePlan = (plan) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${
        plan.isBookmarked ? "unfeature" : "feature"
      } this travel plan?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: plan.isBookmarked ? "Unfeature" : "Feature",
          onPress: async () => {
            try {
              // Make API call to update plan featured status
              const response = await axios.retryRequest(
                {
                  url: `/api/admin/travel-plans/${plan._id}/feature`,
                  method: "put",
                  data: { isBookmarked: !plan.isBookmarked },
                  timeout: 8000,
                },
                1
              ); // 1 retry

              if (response.data.success) {
                // Update local state with the updated plan
                const updatedPlans = travelPlans.map((p) =>
                  p._id === plan._id
                    ? { ...p, isBookmarked: !p.isBookmarked }
                    : p
                );
                setTravelPlans(updatedPlans);
                setFilteredPlans(updatedPlans);

                Alert.alert(
                  "Success",
                  `Travel plan ${
                    plan.isBookmarked ? "unfeatured" : "featured"
                  } successfully`
                );
              } else {
                Alert.alert(
                  "Error",
                  response.data.message || "Failed to update travel plan"
                );
              }
            } catch (error) {
              console.error("Error updating plan status:", error);
              Alert.alert("Error", "Failed to update travel plan status");
            }
          },
        },
      ]
    );
  };

  const handleDeletePlan = (plan) => {
    Alert.alert(
      "Confirm Deletion",
      `Are you sure you want to delete this travel plan to ${plan.destination}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              // Make API call to delete the plan
              const response = await axios.retryRequest(
                {
                  url: `/api/admin/travel-plans/${plan._id}`,
                  method: "delete",
                  timeout: 8000,
                },
                1
              ); // 1 retry

              if (response.data.success) {
                // Update local state by removing the deleted plan
                const updatedPlans = travelPlans.filter(
                  (p) => p._id !== plan._id
                );
                setTravelPlans(updatedPlans);
                setFilteredPlans(updatedPlans);

                Alert.alert("Success", "Travel plan deleted successfully");
              } else {
                Alert.alert(
                  "Error",
                  response.data.message || "Failed to delete travel plan"
                );
              }
            } catch (error) {
              console.error("Error deleting plan:", error);
              Alert.alert("Error", "Failed to delete travel plan");
            }
          },
        },
      ]
    );
  };

  const renderPlanItem = ({ item }) => (
    <View style={styles.planCard}>
      <View style={styles.planHeader}>
        <View style={styles.destinationContainer}>
          <FontAwesome5 name="map-marker-alt" size={16} color="#3498db" />
          <Text style={styles.destination}>
            {item.destination || "Unknown Destination"}
          </Text>
        </View>
        {item.isBookmarked && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.planDetails}>
        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <Ionicons name="person-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.userId?.fullName || "Unknown User"}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <MaterialIcons name="date-range" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.createdAt
                ? new Date(item.createdAt).toLocaleDateString()
                : "No date"}
            </Text>
          </View>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailItem}>
            <MaterialIcons name="attach-money" size={16} color="#666" />
            <Text style={styles.detailText}>${item.budget || "0"}</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="time-outline" size={16} color="#666" />
            <Text style={styles.detailText}>
              {item.tripDuration || "0"} days
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleViewPlan(item)}
        >
          <Feather name="eye" size={18} color="#3498db" />
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleFeaturePlan(item)}
        >
          <MaterialIcons
            name={item.isBookmarked ? "star" : "star-outline"}
            size={18}
            color={item.isBookmarked ? "#f39c12" : "#3498db"}
          />
          <Text
            style={[
              styles.actionText,
              { color: item.isBookmarked ? "#f39c12" : "#3498db" },
            ]}
          >
            {item.isBookmarked ? "Unfeature" : "Feature"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleDeletePlan(item)}
        >
          <MaterialIcons name="delete-outline" size={18} color="#e74c3c" />
          <Text style={[styles.actionText, { color: "#e74c3c" }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Plans</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search travel plans..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.filterButton}
          onPress={() =>
            Alert.alert("Filter", "Filter options would appear here")
          }
        >
          <Ionicons name="filter" size={22} color="#3498db" />
        </TouchableOpacity>
      </View>

      {/* Travel Plans List */}
      {loading && !refreshing ? (
        <ActivityIndicator style={styles.loader} size="large" color="#3498db" />
      ) : (
        <FlatList
          data={filteredPlans}
          renderItem={renderPlanItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#3498db"]}
            />
          }
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FontAwesome5 name="route" size={60} color="#ccc" />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? "No plans match your search"
                  : "No travel plans found"}
              </Text>
            </View>
          }
          ListFooterComponent={
            pagination.page < pagination.pages && !loading ? (
              <TouchableOpacity
                style={styles.loadMoreButton}
                onPress={handleLoadMore}
              >
                <Text style={styles.loadMoreText}>Load More</Text>
              </TouchableOpacity>
            ) : null
          }
        />
      )}
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    marginLeft: 12,
    padding: 8,
  },
  listContent: {
    padding: 16,
  },
  planCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  planHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  destinationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  destination: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  featuredBadge: {
    backgroundColor: "#f39c12",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  featuredText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  planDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  detailText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginLeft: 16,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#3498db",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  loadMoreButton: {
    backgroundColor: "#f0f0f0",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 8,
  },
  loadMoreText: {
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
});

export default AdminTravelPlanList;
