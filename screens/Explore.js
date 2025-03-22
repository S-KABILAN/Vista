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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");
const cardWidth = width * 0.7;
const smallCardWidth = width * 0.4;

const Explore = ({ navigation }) => {
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(true);
  const [featuredDestinations, setFeaturedDestinations] = useState([]);
  const [popularDestinations, setPopularDestinations] = useState([]);
  const [trendingDestinations, setTrendingDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    // Simulating data fetch
    const fetchData = async () => {
      // In a real app, you would fetch this data from your API
      try {
        // Simulated API delay
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setFeaturedDestinations([
          {
            id: "1",
            name: "Santorini",
            country: "Greece",
            description:
              "Famous for its stunning sunsets, white-washed buildings and blue domes",
            rating: 4.8,
            image:
              "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop",
            priceRange: "$$$$",
          },
          {
            id: "2",
            name: "Kyoto",
            country: "Japan",
            description:
              "Ancient temples, traditional gardens and vibrant cherry blossoms",
            rating: 4.7,
            image:
              "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
            priceRange: "$$$",
          },
          {
            id: "3",
            name: "Bali",
            country: "Indonesia",
            description:
              "Tropical paradise with lush rice terraces, temples and beaches",
            rating: 4.6,
            image:
              "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop",
            priceRange: "$$",
          },
        ]);

        setPopularDestinations([
          {
            id: "4",
            name: "Paris",
            country: "France",
            image:
              "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
            rating: 4.6,
          },
          {
            id: "5",
            name: "Rome",
            country: "Italy",
            image:
              "https://images.unsplash.com/photo-1604580864964-0462f5d5b1a8?q=80&w=800&auto=format&fit=crop",
            rating: 4.7,
          },
          {
            id: "6",
            name: "New York",
            country: "USA",
            image:
              "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
            rating: 4.5,
          },
          {
            id: "7",
            name: "Tokyo",
            country: "Japan",
            image:
              "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop",
            rating: 4.8,
          },
        ]);

        setTrendingDestinations([
          {
            id: "8",
            name: "Lisbon",
            country: "Portugal",
            image:
              "https://images.unsplash.com/photo-1580323956606-5e31b55e0d77?q=80&w=800&auto=format&fit=crop",
            trending: "+32%",
          },
          {
            id: "9",
            name: "Marrakesh",
            country: "Morocco",
            image:
              "https://images.unsplash.com/photo-1545041499-9c8ca5a5a775?q=80&w=800&auto=format&fit=crop",
            trending: "+28%",
          },
          {
            id: "10",
            name: "Seoul",
            country: "South Korea",
            image:
              "https://images.unsplash.com/photo-1538485399081-7c9b559c9f9e?q=80&w=800&auto=format&fit=crop",
            trending: "+45%",
          },
          {
            id: "11",
            name: "Medellin",
            country: "Colombia",
            image:
              "https://images.unsplash.com/photo-1534520608702-ba7c86788449?q=80&w=800&auto=format&fit=crop",
            trending: "+52%",
          },
        ]);

        setCategories([
          { id: "1", name: "All", icon: "globe" },
          { id: "2", name: "Beaches", icon: "umbrella-beach" },
          { id: "3", name: "Mountains", icon: "mountain" },
          { id: "4", name: "Cities", icon: "city" },
          { id: "5", name: "Cultural", icon: "landmark" },
          { id: "6", name: "Adventure", icon: "hiking" },
        ]);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate("SearchResults", { query: searchText });
    }
  };

  const handleDestinationPress = (destination) => {
    // For a real app, you would ensure all destinations have coordinates
    // If missing, you could geocode here or use a lookup from your API

    // Create a destination object with default coordinates if they're missing
    const destinationWithCoordinates = {
      ...destination,
      // Default coordinates that will be used if not present in the destination object
      latitude: destination.latitude || getDefaultLatitude(destination.name),
      longitude: destination.longitude || getDefaultLongitude(destination.name),
    };

    navigation.navigate("PlaceDetails", {
      destination: destinationWithCoordinates,
    });
  };

  // Helper function to get default latitude based on destination name
  // In a real app, you would get this from an API or database
  const getDefaultLatitude = (destinationName) => {
    // This is a simplified example - you would implement proper geocoding
    const defaultCoordinates = {
      Santorini: 36.3932,
      Kyoto: 35.0116,
      Bali: -8.4095,
      Paris: 48.8566,
      Rome: 41.9028,
      "New York": 40.7128,
      Tokyo: 35.6762,
      Lisbon: 38.7223,
      Marrakesh: 31.6295,
      Seoul: 37.5665,
      Medellin: 6.2476,
    };

    return defaultCoordinates[destinationName] || 37.7749; // Default to San Francisco
  };

  // Helper function to get default longitude based on destination name
  const getDefaultLongitude = (destinationName) => {
    // This is a simplified example - you would implement proper geocoding
    const defaultCoordinates = {
      Santorini: 25.4615,
      Kyoto: 135.7681,
      Bali: 115.1889,
      Paris: 2.3522,
      Rome: 12.4964,
      "New York": -74.006,
      Tokyo: 139.6503,
      Lisbon: -9.1393,
      Marrakesh: -7.9811,
      Seoul: 126.978,
      Medellin: -75.5676,
    };

    return defaultCoordinates[destinationName] || -122.4194; // Default to San Francisco
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
          <Text style={styles.featuredLocation}>
            <Ionicons name="location-sharp" size={14} color="#FFF" />{" "}
            {item.country}
          </Text>
          <Text style={styles.featuredDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Price Range:</Text>
            <Text style={styles.price}>{item.priceRange}</Text>
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
        <View style={styles.popularSubContent}>
          <Text style={styles.popularLocation}>
            <Ionicons name="location-sharp" size={12} color="#666" />{" "}
            {item.country}
          </Text>
          <View style={styles.popularRating}>
            <AntDesign name="star" size={12} color="#FFD700" />
            <Text style={styles.popularRatingText}>{item.rating}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderTrendingItem = ({ item }) => (
    <TouchableOpacity
      style={styles.trendingCard}
      onPress={() => handleDestinationPress(item)}
    >
      <View style={styles.trendingBadge}>
        <Text style={styles.trendingText}>{item.trending}</Text>
      </View>
      <Image source={{ uri: item.image }} style={styles.trendingImage} />
      <View style={styles.trendingContent}>
        <Text style={styles.trendingName}>{item.name}</Text>
        <Text style={styles.trendingLocation}>
          <Ionicons name="location-sharp" size={12} color="#666" />{" "}
          {item.country}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryItem,
        activeCategory === item.name && styles.activeCategoryItem,
      ]}
      onPress={() => setActiveCategory(item.name)}
    >
      <FontAwesome5
        name={item.icon}
        size={16}
        color={activeCategory === item.name ? "#FFF" : "#3498db"}
      />
      <Text
        style={[
          styles.categoryText,
          activeCategory === item.name && styles.activeCategoryText,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Discovering amazing places...</Text>
      </View>
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
            <Text style={styles.sectionTitle}>Featured Destinations</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", { type: "featured" })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
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
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Destinations</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", { type: "popular" })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={popularDestinations}
            renderItem={renderPopularItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Trending Now</Text>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("AllDestinations", { type: "trending" })
              }
            >
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={trendingDestinations}
            renderItem={renderTrendingItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
          />
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
  categoryItem: {
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
  activeCategoryItem: {
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
  priceLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.7)",
    marginRight: 5,
  },
  price: {
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
  popularSubContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
});

export default Explore;
