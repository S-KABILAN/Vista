import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TextInput,
  TouchableOpacity,
  FlatList,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { googleapis } from "../constants/constant";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.7;
const smallCardWidth = width * 0.4;

// Popular travel destinations around the world with coordinates
const POPULAR_LOCATIONS = [
  { name: "Paris", latitude: 48.8566, longitude: 2.3522 },
  { name: "Rome", latitude: 41.9028, longitude: 12.4964 },
  { name: "New York", latitude: 40.7128, longitude: -74.006 },
  { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
  { name: "London", latitude: 51.5074, longitude: -0.1278 },
  { name: "Barcelona", latitude: 41.3851, longitude: 2.1734 },
];

// Emerging/trending destinations
const TRENDING_LOCATIONS = [
  { name: "Lisbon", latitude: 38.7223, longitude: -9.1393 },
  { name: "Marrakesh", latitude: 31.6295, longitude: -7.9811 },
  { name: "Seoul", latitude: 37.5665, longitude: 126.978 },
  { name: "Medellin", latitude: 6.2476, longitude: -75.5676 },
  { name: "Porto", latitude: 41.1579, longitude: -8.6291 },
  { name: "Tbilisi", latitude: 41.7151, longitude: 44.8271 },
];

// Featured/top-rated destination locations
const FEATURED_LOCATIONS = [
  { name: "Santorini", latitude: 36.3932, longitude: 25.4615 },
  { name: "Kyoto", latitude: 35.0116, longitude: 135.7681 },
  { name: "Bali", latitude: -8.4095, longitude: 115.1889 },
  { name: "Bora Bora", latitude: -16.5004, longitude: -151.7415 },
  { name: "Amalfi Coast", latitude: 40.634, longitude: 14.6027 },
  { name: "Machu Picchu", latitude: -13.1631, longitude: -72.545 },
];

const Explore = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [trendingDestinations, setTrendingDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  // Fetch places from Google Places API based on location
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

  // Main function to fetch all destination data
  const fetchAllDestinations = async () => {
    setLoading(true);
    try {
      // 1. Fetch featured destinations data
      const featuredPromises = FEATURED_LOCATIONS.map((location) =>
        fetchPlacesForLocation(location, "tourist_attraction")
      );
      const featuredResults = await Promise.all(featuredPromises);
      const allFeaturedPlaces = featuredResults.flat().slice(0, 5);

      // 2. Fetch popular destinations data
      const popularPromises = POPULAR_LOCATIONS.map((location) =>
        fetchPlacesForLocation(location, "tourist_attraction")
      );
      const popularResults = await Promise.all(popularPromises);
      const allPopularPlaces = popularResults.flat().slice(0, 6);

      // 3. Fetch trending destinations data
      const trendingPromises = TRENDING_LOCATIONS.map((location) =>
        fetchPlacesForLocation(location, "tourist_attraction")
      );
      const trendingResults = await Promise.all(trendingPromises);
      const allTrendingPlaces = trendingResults.flat().slice(0, 6);

      // 4. Set categories - these are static but could be dynamic too
      const categoriesData = [
        { id: "1", name: "All", icon: "globe" },
        { id: "2", name: "Beaches", icon: "umbrella-beach" },
        { id: "3", name: "Mountains", icon: "mountain" },
        { id: "4", name: "Cities", icon: "city" },
        { id: "5", name: "Cultural", icon: "landmark" },
        { id: "6", name: "Adventure", icon: "hiking" },
      ];

      // Update state with all fetched data
      setFeaturedDestinations(allFeaturedPlaces);
      setPopularDestinations(allPopularPlaces);
      setTrendingDestinations(allTrendingPlaces);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Error fetching all destinations:", error);
      Alert.alert(
        "Error",
        "Failed to load destinations. Please check your connection and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllDestinations();
  }, []);

  // Update the handleCategoryPress function to fetch relevant places based on the selected category
  const handleCategoryPress = async (category) => {
    setActiveCategory(category.name);
    setLoading(true);

    try {
      // Map category names to appropriate Google Places API types and keywords
      const categoryMappings = {
        All: { type: "tourist_attraction", keyword: "" },
        Beaches: { type: "natural_feature", keyword: "beach" },
        Mountains: { type: "natural_feature", keyword: "mountain" },
        Cities: { type: "locality", keyword: "city" },
        Cultural: { type: "museum", keyword: "cultural" },
        Adventure: { type: "tourist_attraction", keyword: "adventure" },
      };

      // Get the appropriate type and keyword for the selected category
      const { type: placeType, keyword } =
        categoryMappings[category.name] || categoryMappings["All"];

      // Select appropriate locations based on the category
      let locationsToFetch = [];

      if (category.name === "All") {
        // For "All", use the original location sets
        const featuredPromises = FEATURED_LOCATIONS.map((location) =>
          fetchPlacesForLocation(location, "tourist_attraction")
        );
        const popularPromises = POPULAR_LOCATIONS.map((location) =>
          fetchPlacesForLocation(location, "tourist_attraction")
        );
        const trendingPromises = TRENDING_LOCATIONS.map((location) =>
          fetchPlacesForLocation(location, "tourist_attraction")
        );

        const [featuredResults, popularResults, trendingResults] =
          await Promise.all([
            Promise.all(featuredPromises),
            Promise.all(popularPromises),
            Promise.all(trendingPromises),
          ]);

        setFeaturedDestinations(featuredResults.flat().slice(0, 5));
        setPopularDestinations(popularResults.flat().slice(0, 6));
        setTrendingDestinations(trendingResults.flat().slice(0, 6));
      } else {
        // For specific categories, combine all location sets and filter by the category
        locationsToFetch = [
          ...FEATURED_LOCATIONS,
          ...POPULAR_LOCATIONS,
          ...TRENDING_LOCATIONS,
        ];

        // Remove duplicates based on name
        locationsToFetch = Array.from(
          new Map(locationsToFetch.map((loc) => [loc.name, loc])).values()
        );

        // Fetch places for each location with the appropriate type and keyword
        const promises = locationsToFetch.map((location) =>
          fetchPlacesForCategoryAndLocation(location, placeType, keyword)
        );

        const results = await Promise.all(promises);
        const allPlaces = results.flat();

        // Randomize and split the results into the three sections
        const shuffled = allPlaces.sort(() => 0.5 - Math.random());

        if (shuffled.length > 0) {
          const featuredCount = Math.min(5, shuffled.length);
          const popularCount = Math.min(
            6,
            Math.max(0, shuffled.length - featuredCount)
          );
          const trendingCount = Math.min(
            6,
            Math.max(0, shuffled.length - featuredCount - popularCount)
          );

          setFeaturedDestinations(shuffled.slice(0, featuredCount));
          setPopularDestinations(
            shuffled.slice(featuredCount, featuredCount + popularCount)
          );
          setTrendingDestinations(
            shuffled.slice(
              featuredCount + popularCount,
              featuredCount + popularCount + trendingCount
            )
          );
        } else {
          // If no results, show empty states
          setFeaturedDestinations([]);
          setPopularDestinations([]);
          setTrendingDestinations([]);

          // Display a message to the user
          Alert.alert(
            "No Results",
            `No ${category.name.toLowerCase()} destinations found. Try another category.`
          );
        }
      }
    } catch (error) {
      console.error(`Error fetching ${category.name} destinations:`, error);
      Alert.alert(
        "Error",
        `Failed to load ${category.name.toLowerCase()} destinations. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  // New function to fetch places specific to a category and location
  const fetchPlacesForCategoryAndLocation = async (
    location,
    placeType,
    keyword
  ) => {
    try {
      const params = {
        location: `${location.latitude},${location.longitude}`,
        radius: 50000, // 50km radius
        type: placeType,
        key: googleapis,
        rankby: "prominence",
      };

      // Add keyword if provided
      if (keyword) {
        params.keyword = keyword;
      }

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        { params }
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
          category: keyword || placeType, // Add category information to the data
        }));
      }
      return [];
    } catch (error) {
      console.error("Error fetching category places:", error);
      return [];
    }
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate("SearchResults", { query: searchText });
    }
  };

  const handleDestinationPress = (destination) => {
    // Pass the destination data to the PlaceDetails screen
    navigation.navigate("PlaceDetails", {
      destination: destination,
    });
  };

  const renderFeaturedItem = ({ item }) => (
    <TouchableOpacity
      style={styles.featuredCard}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.featuredImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      >
        <View style={styles.featuredContent}>
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={16} color="#FFD700" />
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
          </View>
          <Text style={styles.featuredLocation}>{item.country}</Text>
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{item.priceRange}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderPopularItem = ({ item }) => (
    <TouchableOpacity
      style={styles.popularCard}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.popularImage} />
      <View style={styles.popularContent}>
        <Text style={styles.popularName}>{item.name}</Text>
        <Text style={styles.popularLocation}>{item.country}</Text>
        <View style={styles.popularRating}>
          <AntDesign name="star" size={14} color="#FFD700" />
          <Text style={styles.popularRatingText}>{item.rating}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.trendingImage} />
      <View style={styles.trendingContent}>
        <Text style={styles.trendingName}>{item.name}</Text>
        <Text style={styles.trendingLocation}>{item.country}</Text>
        <View style={styles.trendingBadge}>
          <AntDesign name="arrowup" size={12} color="#fff" />
          <Text style={styles.trendingText}>{item.trending}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryButton,
        activeCategory === item.name && styles.activeCategoryButton,
      ]}
      onPress={() => handleCategoryPress(item)}
    >
      <FontAwesome5
        name={item.icon}
        size={16}
        color={activeCategory === item.name ? "#fff" : "#3498db"}
      />
      <Text
        style={[
          styles.categoryText,
          activeCategory === item.name && styles.activeCategoryText,
        ]}
      >
        {item.name}
      </Text>
      {activeCategory === item.name && (
        <View style={styles.categoryIndicator} />
      )}
    </TouchableOpacity>
  );

  // Add an empty state component for when no destinations are found
  const EmptyStateCard = ({ category, section }) => (
    <View style={styles.emptyStateCard}>
      <MaterialIcons name="search-off" size={36} color="#ccc" />
      <Text style={styles.emptyStateTitle}>
        No {category.toLowerCase()} {section.toLowerCase()} found
      </Text>
      <Text style={styles.emptyStateText}>
        Try another category or check back later
      </Text>
    </View>
  );

  // Update section titles to reflect the selected category
  const getSectionTitle = (baseTitle, category) => {
    if (category === "All" || !category) return baseTitle;
    return `${baseTitle} - ${category}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>
          Discovering amazing destinations...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate("Globe")}
        >
          <Ionicons name="map" size={24} color="#3498db" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations, activities..."
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={handleSearch}
          />
          {searchText ? (
            <TouchableOpacity
              onPress={() => setSearchText("")}
              style={styles.clearButton}
            >
              <AntDesign name="close" size={16} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => navigation.navigate("Filters")}
        >
          <Ionicons name="options" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tipsBannerContainer}>
        <TouchableOpacity
          style={styles.tipsBanner}
          onPress={() => navigation.navigate("TravelTips")}
        >
          <View style={styles.tipsIconContainer}>
            <Ionicons name="bulb-outline" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.tipsBannerContent}>
            <Text style={styles.tipsBannerTitle}>Travel Tips & Advice</Text>
            <Text style={styles.tipsBannerSubtitle}>
              Expert guides for every destination
            </Text>
          </View>
          <AntDesign name="arrowright" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.aiPlannerBanner}>
        <LinearGradient
          colors={["#3498db", "#2980b9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.aiPlannerGradient}
        >
          <View style={styles.aiPlannerContent}>
            <View>
              <Text style={styles.aiPlannerTitle}>AI Travel Planner</Text>
              <Text style={styles.aiPlannerSubtitle}>
                Create a personalized trip in seconds
              </Text>
            </View>
            <TouchableOpacity
              style={styles.aiPlannerButton}
              onPress={() => navigation.navigate("AITravelPlanner")}
            >
              <Text style={styles.aiPlannerButtonText}>Plan Now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>

      {/* Add loading overlay when changing categories */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.categoryLoadingText}>
            Discovering {activeCategory.toLowerCase()} destinations...
          </Text>
        </View>
      )}

      <ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getSectionTitle("Featured Destinations", activeCategory)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", {
                  type: "featured",
                  category: activeCategory !== "All" ? activeCategory : null,
                })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {featuredDestinations.length > 0 ? (
            <FlatList
              data={featuredDestinations}
              renderItem={renderFeaturedItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
              snapToInterval={cardWidth + 20}
              decelerationRate="fast"
              pagingEnabled
            />
          ) : (
            <EmptyStateCard
              category={activeCategory}
              section="featured destinations"
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getSectionTitle("Popular Destinations", activeCategory)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", {
                  type: "popular",
                  category: activeCategory !== "All" ? activeCategory : null,
                })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {popularDestinations.length > 0 ? (
            <FlatList
              data={popularDestinations}
              renderItem={renderPopularItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <EmptyStateCard
              category={activeCategory}
              section="popular destinations"
            />
          )}
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {getSectionTitle("Trending Now", activeCategory)}
            </Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", {
                  type: "trending",
                  category: activeCategory !== "All" ? activeCategory : null,
                })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          {trendingDestinations.length > 0 ? (
            <FlatList
              data={trendingDestinations}
              renderItem={renderTrendingItem}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <EmptyStateCard
              category={activeCategory}
              section="trending destinations"
            />
          )}
        </View>

        <View style={styles.inspirationContainer}>
          <Text style={styles.inspirationTitle}>Travel Inspiration</Text>
          <View style={styles.inspirationCards}>
            <TouchableOpacity
              style={styles.inspirationCard}
              onPress={() =>
                navigation.navigate("TravelInspiration", {
                  category: "Weekend Getaways",
                })
              }
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
                style={styles.inspirationGradient}
              >
                <Text style={styles.inspirationCardText}>Weekend Getaways</Text>
              </LinearGradient>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1498503182468-3b51cbb6cb24?q=80&w=800&auto=format&fit=crop",
                }}
                style={styles.inspirationImage}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.inspirationCard}
              onPress={() =>
                navigation.navigate("TravelInspiration", {
                  category: "Budget Friendly",
                })
              }
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
                style={styles.inspirationGradient}
              >
                <Text style={styles.inspirationCardText}>Budget Friendly</Text>
              </LinearGradient>
              <Image
                source={{
                  uri: "https://images.unsplash.com/photo-1482192505345-5655af888cc4?q=80&w=800&auto=format&fit=crop",
                }}
                style={styles.inspirationImage}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
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
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  clearButton: {
    padding: 5,
  },
  filterButton: {
    width: 50,
    height: 50,
    backgroundColor: "#3498db",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scrollContainer: {
    flex: 1,
  },
  categoriesContainer: {
    marginVertical: 10,
  },
  categoriesList: {
    paddingHorizontal: 15,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: "white",
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeCategoryButton: {
    backgroundColor: "#3498db",
  },
  categoryText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  activeCategoryText: {
    color: "white",
  },
  aiPlannerBanner: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  aiPlannerGradient: {
    padding: 20,
  },
  aiPlannerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  aiPlannerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  aiPlannerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 3,
  },
  aiPlannerButton: {
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  aiPlannerButtonText: {
    color: "#3498db",
    fontWeight: "bold",
  },
  sectionContainer: {
    marginBottom: 25,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    color: "#3498db",
  },
  listContainer: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  featuredCard: {
    width: cardWidth,
    height: 220,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  featuredImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "70%",
    borderRadius: 15,
  },
  featuredContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 15,
  },
  featuredHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  featuredName: {
    fontSize: 20,
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
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  featuredLocation: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 10,
  },
  priceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  priceText: {
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  popularCard: {
    width: smallCardWidth,
    height: 160,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  popularImage: {
    width: "100%",
    height: 110,
  },
  popularContent: {
    padding: 10,
  },
  popularName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  popularLocation: {
    fontSize: 12,
    color: "#666",
  },
  popularRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  popularRatingText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  trendingCard: {
    width: smallCardWidth,
    height: 160,
    marginRight: 15,
    borderRadius: 12,
    backgroundColor: "white",
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: "relative",
  },
  trendingBadge: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "rgba(46, 204, 113, 0.9)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 10,
  },
  trendingText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  trendingImage: {
    width: "100%",
    height: 110,
  },
  trendingContent: {
    padding: 10,
  },
  trendingName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 3,
  },
  trendingLocation: {
    fontSize: 12,
    color: "#666",
  },
  inspirationContainer: {
    paddingHorizontal: 20,
    marginTop: 5,
    marginBottom: 20,
  },
  inspirationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  inspirationCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  inspirationCard: {
    width: (width - 50) / 2,
    height: 120,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  inspirationImage: {
    width: "100%",
    height: "100%",
  },
  inspirationGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  inspirationCardText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  emptyStateCard: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    marginHorizontal: 20,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#666",
    marginTop: 12,
    marginBottom: 4,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  categoryLoadingText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
  },
  categoryIndicator: {
    position: "absolute",
    top: -5,
    right: -5,
    backgroundColor: "#2ecc71",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#fff",
  },
  tipsBannerContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tipsBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A80F0",
    borderRadius: 12,
    padding: 16,
  },
  tipsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  tipsBannerContent: {
    flex: 1,
  },
  tipsBannerTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  tipsBannerSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default Explore;
