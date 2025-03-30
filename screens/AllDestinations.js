import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { googleapis } from "../constants/constant";

// Location coordinates for different types of destinations
const LOCATIONS_BY_TYPE = {
  featured: [
    { name: "Santorini", latitude: 36.3932, longitude: 25.4615 },
    { name: "Kyoto", latitude: 35.0116, longitude: 135.7681 },
    { name: "Bali", latitude: -8.4095, longitude: 115.1889 },
    { name: "Bora Bora", latitude: -16.5004, longitude: -151.7415 },
    { name: "Amalfi Coast", latitude: 40.634, longitude: 14.6027 },
    { name: "Machu Picchu", latitude: -13.1631, longitude: -72.545 },
    { name: "Maldives", latitude: 3.2028, longitude: 73.2207 },
    { name: "Venice", latitude: 45.4408, longitude: 12.3155 },
  ],
  popular: [
    { name: "Paris", latitude: 48.8566, longitude: 2.3522 },
    { name: "Rome", latitude: 41.9028, longitude: 12.4964 },
    { name: "New York", latitude: 40.7128, longitude: -74.006 },
    { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
    { name: "London", latitude: 51.5074, longitude: -0.1278 },
    { name: "Barcelona", latitude: 41.3851, longitude: 2.1734 },
    { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
    { name: "Dubai", latitude: 25.2048, longitude: 55.2708 },
  ],
  trending: [
    { name: "Lisbon", latitude: 38.7223, longitude: -9.1393 },
    { name: "Marrakesh", latitude: 31.6295, longitude: -7.9811 },
    { name: "Seoul", latitude: 37.5665, longitude: 126.978 },
    { name: "Medellin", latitude: 6.2476, longitude: -75.5676 },
    { name: "Porto", latitude: 41.1579, longitude: -8.6291 },
    { name: "Tbilisi", latitude: 41.7151, longitude: 44.8271 },
    { name: "Mexico City", latitude: 19.4326, longitude: -99.1332 },
    { name: "Tallinn", latitude: 59.437, longitude: 24.7536 },
  ],
};

const AllDestinations = ({ route, navigation }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { type = "featured" } = route.params || {};

  // Fetch places from Google Places API based on location coordinates
  const fetchPlacesForLocation = async (
    location,
    type = "tourist_attraction"
  ) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${location.latitude},${location.longitude}`,
            radius: 50000, // 50km radius
            type: type,
            key: googleapis,
            rankby: "prominence",
          },
        }
      );

      if (response.data.status === "OK" && response.data.results.length > 0) {
        // Process and return place data
        return response.data.results.map((place) => ({
          id: place.place_id,
          name: place.name,
          country: extractCountry(place),
          description: place.vicinity || `Explore ${place.name}`,
          rating: place.rating || 4.5,
          image:
            place.photos && place.photos.length > 0
              ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${googleapis}`
              : `https://maps.googleapis.com/maps/api/streetview?size=800x800&location=${place.geometry.location.lat},${place.geometry.location.lng}&key=${googleapis}`,
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          priceRange: place.price_level ? "$".repeat(place.price_level) : "$$",
          trending: calculateTrendingPercentage(),
          place_details: place,
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching places:", error);
      return [];
    }
  };

  // Extract country information from place data
  const extractCountry = (place) => {
    if (place.plus_code && place.plus_code.compound_code) {
      const parts = place.plus_code.compound_code.split(",");
      return parts[parts.length - 1].trim();
    }
    // If we can't extract country, fallback to a region name or placeholder
    return place.vicinity
      ? place.vicinity.split(",").pop().trim()
      : "International";
  };

  // Generate a realistic trending percentage for trending destinations
  const calculateTrendingPercentage = () => {
    return `+${Math.floor(Math.random() * 40) + 20}%`;
  };

  // Fetch all destinations for the specified type
  const fetchDestinations = async () => {
    setLoading(true);
    try {
      const locations = LOCATIONS_BY_TYPE[type] || LOCATIONS_BY_TYPE.featured;

      // Fetch tourist attractions for each location
      const promises = locations.map((location) =>
        fetchPlacesForLocation(location, "tourist_attraction")
      );

      const results = await Promise.all(promises);

      // Flatten the results and remove duplicates based on place_id
      const allPlaces = results.flat();
      const uniquePlaces = Array.from(
        new Map(allPlaces.map((place) => [place.id, place])).values()
      );

      setDestinations(uniquePlaces);
    } catch (error) {
      console.error("Error fetching destinations:", error);
      Alert.alert(
        "Error",
        "Failed to load destinations. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDestinations();
  }, [type]);

  const getTypeTitle = () => {
    switch (type) {
      case "featured":
        return "Featured Destinations";
      case "popular":
        return "Popular Destinations";
      case "trending":
        return "Trending Destinations";
      default:
        return "All Destinations";
    }
  };

  const handleDestinationPress = (destination) => {
    navigation.navigate("PlaceDetails", { destination });
  };

  const handleGlobePress = (destination) => {
    // Navigate to Globe screen with destination coordinates
    navigation.navigate("Globe", {
      showRoute: false,
      initialRegion: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
    });
  };

  const renderDestinationCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.cardGradient}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <AntDesign name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.country}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleGlobePress(item)}
          >
            <MaterialIcons name="explore" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.planButton]}
            onPress={() =>
              navigation.navigate("AITravelPlanner", {
                prefilledDestination: item.name,
                selectedDestination: {
                  name: item.name,
                  coordinates: {
                    latitude: item.latitude,
                    longitude: item.longitude,
                  },
                },
              })
            }
          >
            <Ionicons name="map" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Plan Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
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
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTypeTitle()}</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading destinations...</Text>
        </View>
      ) : destinations.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <MaterialIcons name="location-off" size={64} color="#ccc" />
          <Text style={styles.noResultsText}>No destinations found</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchDestinations}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={destinations}
          renderItem={renderDestinationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    width: 40,
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
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  noResultsText: {
    fontSize: 18,
    color: "#666",
    marginTop: 16,
    textAlign: "center",
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#3498db",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  planButton: {
    backgroundColor: "rgba(46, 204, 113, 0.8)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
});

export default AllDestinations;
