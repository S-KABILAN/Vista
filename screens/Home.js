import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  ImageBackground,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { firebase_auth } from "../FirebaseAuth";
import Tabbar from "../components/Tabbar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import HomeOptions from "../components/homeoptions";
import LocationCard from "../components/Locationcard";
import Attractions from "../components/Attractions";
import RecommendedPlaces from "../components/RecommendedPlaces";
import SearchBar from "../components/SearchBar";
import Hotel from "../components/hotel";
import Restaurant from "../components/Restaurant";
import WeatherCards from "../components/WeatherCards";
import axios from "axios";
import { BACKEND_URL } from "../config";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  Feather,
  FontAwesome5,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { weatherapi } from "../constants/constant";
import { useUserPreferences } from "../context/UserPreferencesContext";

const { height, width } = Dimensions.get("window");
const cardWidth = width * 0.7;

const Home = ({ route }) => {
  const [location, setLocation] = useState(null);
  const [activeTab, setActiveTab] = useState("Attractions");
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [recentViews, setRecentViews] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [currentWeather, setCurrentWeather] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const { preferences } = useUserPreferences();

  const fetchWeatherData = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://api.weatherapi.com/v1/current.json?key=${weatherapi}&q=${lat},${lng}`
      );

      return {
        temperature: Math.round(response.data.current.temp_c),
        condition: response.data.current.condition.text,
        icon: getWeatherIcon(response.data.current.condition.code),
      };
    } catch (error) {
      console.error("Error fetching weather:", error);
      return null;
    }
  };

  const getWeatherIcon = (code) => {
    const iconMap = {
      1000: "sunny",
      1003: "partly-sunny",
      1006: "cloudy",
      1009: "cloudy",
      1030: "mist",
      1063: "rainy",
      1066: "snow",
      1087: "thunderstorm",
      1114: "snow",
      1117: "snow",
      1135: "mist",
      1183: "rainy",
      1189: "rainy",
      1192: "rainy",
      1195: "rainy",
      1225: "snow",
      1273: "thunderstorm",
      1276: "thunderstorm",
    };
    return iconMap[code] || "partly-sunny";
  };

  const fetchCurrentLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      console.error("Location permission not granted.");
      return;
    }

    try {
      setLoading(true);
      let loc = await Location.getCurrentPositionAsync({});
      let reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const cityName =
          reverseGeocode[0].city ||
          reverseGeocode[0].subregion ||
          reverseGeocode[0].region ||
          "Unknown City";

        const locationData = {
          city: cityName,
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        };

        setLocation(locationData);
        setCurrentLocation(cityName);

        const weather = await fetchWeatherData(
          loc.coords.latitude,
          loc.coords.longitude
        );
        if (weather) {
          setCurrentWeather(weather);
        }
      }
    } catch (error) {
      console.error("Error fetching location:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const userInterests = preferences?.travelInterests || [];
      const userBudget = preferences?.budgetRange || "moderate";
      const visitedCountries = preferences?.visitedCountries || [];
      const preferredDestTypes = preferences?.preferredDestinationTypes || [];

      console.log("Fetching recommendations based on user preferences:", {
        interests: userInterests,
        budget: userBudget,
        visitedCountries: visitedCountries,
        destinationTypes: preferredDestTypes,
      });

      // Use our backend API for generating recommendations
      const response = await axios.get(
        `${BACKEND_URL}/api/personalized-recommendations`,
        {
          params: {
            interests: userInterests.join(","),
            budget: userBudget,
            destinationTypes: preferredDestTypes.join(","),
            visitedCountries: visitedCountries.join(","),
          },
        }
      );

      if (response.data?.personalizedRecommendations?.destinations) {
        setRecommendations(
          response.data.personalizedRecommendations.destinations
        );
      }
    } catch (error) {
      console.error("Error fetching personalized recommendations:", error);
      fetchDefaultRecommendations();
    }
  };

  const fetchDefaultRecommendations = async () => {
    try {
      const defaultDestinations = [
        {
          id: "1",
          name: "Paris",
          country: "France",
          image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34",
          description: "The city of love and light.",
        },
        {
          id: "2",
          name: "Tokyo",
          country: "Japan",
          image: "https://images.unsplash.com/photo-1513171920216-2640b288471b",
          description: "A blend of traditional and ultramodern.",
        },
        {
          id: "3",
          name: "New York",
          country: "USA",
          image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
          description: "The city that never sleeps.",
        },
      ];

      setRecommendations(defaultDestinations);
    } catch (error) {
      console.error("Error fetching default recommendations:", error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCurrentLocation();
      fetchRecommendations();
    }
  }, [user, preferences]);

  useEffect(() => {
    if (route.params?.selectedLocation) {
      const location = route.params.selectedLocation;
      console.log("Home received location:", location);

      setLocation({
        city: location.city,
        lat: location.lat,
        lng: location.lng,
      });
      setCurrentLocation(location.city);

      fetchWeatherData(location.lat, location.lng).then((weather) => {
        if (weather) {
          setCurrentWeather(weather);
        }
      });
    } else {
      fetchCurrentLocation();
    }
  }, [route.params?.selectedLocation]);

  const handleLogout = async () => {
    try {
      await firebase_auth.signOut();
      console.log("Signed Out");
      navigation.navigate("Login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  const renderActiveComponent = () => {
    if (!location) return <Text>Loading location...</Text>;

    return activeTab === "Attractions" ? (
      <Attractions
        latitude={location?.lat}
        longitude={location?.lng}
        city={location.city}
        isCurrentLocation={location.city === "Current Location"}
        loc={location}
      />
    ) : activeTab === "Hotels" ? (
      <Hotel
        latitude={location?.lat}
        longitude={location?.lng}
        city={location}
        isCurrentLocation={location.city === "Current Location"}
        loc={location.city}
      />
    ) : (
      <Restaurant
        latitude={location?.lat}
        longitude={location?.lng}
        city={location}
        isCurrentLocation={location.city === "Current Location"}
        loc={location.city}
      />
    );
  };

  const testBackendConnection = async () => {
    try {
      console.log(`Testing connection to: ${BACKEND_URL}`);
      const response = await axios.get(BACKEND_URL);
      console.log("Connection successful!", response.data);
      alert(`Connected to backend server successfully!`);

      try {
        console.log(
          `Testing AI endpoint: ${BACKEND_URL}/api/ai-recommendations`
        );
        const aiResponse = await axios.get(
          `${BACKEND_URL}/api/ai-recommendations`,
          {
            params: {
              destination: "Paris",
              budget: 1000,
              tripDuration: 3,
            },
          }
        );
        console.log("AI endpoint working!", aiResponse.data);
        alert("AI endpoint is working! Ready to use the app.");
      } catch (aiError) {
        console.error("AI endpoint error:", aiError);
        alert(
          `Base connection works, but AI endpoint returned an error: ${aiError.message}`
        );
      }
    } catch (error) {
      console.error("Connection error:", error);

      if (error.response) {
        console.log("Response status:", error.response.status);
        if (error.response.status === 404) {
          alert(
            `Connection error: Server returned 404 Not Found. Make sure ngrok is running and the URL is correct.`
          );
        } else {
          alert(
            `Connection error: Server returned ${error.response.status}. Check server logs.`
          );
        }
      } else if (error.request) {
        alert(
          `Connection error: No response received. Make sure ngrok is running and the URL is correct.`
        );
      } else {
        alert(`Connection error: ${error.message}`);
      }
    }
  };

  const testAIConnection = async () => {
    try {
      console.log(`Testing simplified AI endpoint: ${BACKEND_URL}/test-ai`);
      const response = await axios.get(`${BACKEND_URL}/test-ai`);
      console.log("Test AI endpoint response:", response.data);
      Alert.alert("AI Test Successful", "The AI endpoint is working.");
    } catch (error) {
      console.error("AI test error:", error);
      Alert.alert("AI Test Failed", `Error: ${error.message}`);
    }
  };

  const formatDate = (dateString) => {
    const options = { month: "short", day: "numeric" };
    return new Date(dateString).toLocaleDateString("en-US", options);
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      navigation.navigate("SearchResults", { query: searchText });
    }
  };

  const navigateToDestination = (destination) => {
    navigation.navigate("PlaceDetails", { destination });
  };

  const navigateToTripDetails = (trip) => {
    navigation.navigate("TripDetails", { tripId: trip._id });
  };

  const renderUpcomingTrip = ({ item }) => (
    <TouchableOpacity
      style={styles.tripCard}
      onPress={() => navigateToTripDetails(item)}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.tripImage}
        imageStyle={{ borderRadius: 15 }}
      >
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)"]}
          style={styles.tripGradient}
        >
          <View style={styles.tripDateContainer}>
            <Text style={styles.tripDate}>
              {formatDate(item.startDate)} - {formatDate(item.endDate)}
            </Text>
          </View>
          <View style={styles.tripInfo}>
            <View>
              <Text style={styles.tripDestination}>{item.destination}</Text>
              <Text style={styles.tripCountry}>{item.country}</Text>
            </View>
            <View style={styles.daysLeftContainer}>
              <Text style={styles.daysLeftNumber}>{item.daysLeft}</Text>
              <Text style={styles.daysLeftText}>days left</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );

  const renderRecentView = ({ item }) => (
    <TouchableOpacity
      style={styles.recentCard}
      onPress={() => navigateToDestination(item)}
    >
      <Image source={{ uri: item.image }} style={styles.recentImage} />
      <View style={styles.recentTextContainer}>
        <Text style={styles.recentName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.recentCountry} numberOfLines={1}>
          {item.country}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderRecommendation = ({ item }) => (
    <TouchableOpacity
      style={styles.recommendationItem}
      onPress={() => navigateToDestination(item)}
    >
      <Image source={{ uri: item.image }} style={styles.recommendationImage} />
      <View style={styles.recommendationContent}>
        <Text style={styles.recommendationName}>{item.name}</Text>
        <Text style={styles.recommendationCountry}>{item.country}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSections = () => (
    <>
      {/* Weather card */}
      {currentWeather && (
        <WeatherCards
          currentLocation={currentLocation}
          currentWeather={currentWeather}
        />
      )}

      {/* Options */}
      <HomeOptions />

      {/* Personalized recommendations based on user preferences */}
      <View style={styles.sectionContainer}>
        <RecommendedPlaces
          places={recommendations}
          onPlacePress={navigateToDestination}
          userPreferences={preferences}
        />
      </View>

      {/* Render active component based on tab */}
      {renderActiveComponent()}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.username}>
              {user?.displayName || "Traveler"}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => navigation.navigate("Profile")}
          >
            <Image
              source={{
                uri: user?.photoURL || "https://via.placeholder.com/150",
              }}
              style={styles.profileImage}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.weatherContainer}
          onPress={() => navigation.navigate("ChangeLocation")}
        >
          <View style={styles.weatherContent}>
            {loading ? (
              <ActivityIndicator size="small" color="#3498db" />
            ) : (
              <>
                <Ionicons
                  name={currentWeather?.icon || "sunny"}
                  size={28}
                  color="#3498db"
                />
                <View style={styles.weatherInfo}>
                  <Text style={styles.temperature}>
                    {currentWeather?.temperature || "--"}°C
                  </Text>
                  <Text style={styles.weatherCondition}>
                    {currentWeather?.condition || "Loading..."}
                  </Text>
                </View>
              </>
            )}
          </View>
          <View style={styles.locationContainer}>
            <Text style={styles.locationText}>
              {currentLocation || "Loading location..."}
            </Text>
            <AntDesign name="right" size={16} color="#888" />
          </View>
        </TouchableOpacity>

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
              placeholder="Where would you like to go?"
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

        <View style={styles.aiToolsContainer}>
          <TouchableOpacity
            style={[styles.aiToolCard, styles.aiPlannerCard]}
            onPress={() => navigation.navigate("AITravelPlanner")}
          >
            <LinearGradient
              colors={["#3498db", "#2980b9"]}
              style={styles.aiToolGradient}
            >
              <View style={styles.aiToolIcon}>
                <AntDesign name="rocket1" size={26} color="#FFF" />
              </View>
              <Text style={styles.aiToolTitle}>AI Travel Planner</Text>
              <Text style={styles.aiToolDescription}>
                Create personalized travel itineraries
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.aiToolCard, styles.aiBudgetCard]}
            onPress={() => navigation.navigate("AIBudgetManager")}
          >
            <LinearGradient
              colors={["#2ecc71", "#27ae60"]}
              style={styles.aiToolGradient}
            >
              <View style={styles.aiToolIcon}>
                <FontAwesome5 name="money-bill-wave" size={20} color="#FFF" />
              </View>
              <Text style={styles.aiToolTitle}>AI Budget Manager</Text>
              <Text style={styles.aiToolDescription}>
                Optimize your travel expenses
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {upcomingTrips.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Trips</Text>
              <TouchableOpacity onPress={() => navigation.navigate("AllTrips")}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={upcomingTrips}
              renderItem={renderUpcomingTrip}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tripsList}
              snapToInterval={cardWidth + 20}
              decelerationRate="fast"
              pagingEnabled
            />
          </View>
        )}

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Explore")}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={recommendations}
            renderItem={renderRecommendation}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.recommendationsList}
          />
        </View>

        {recentViews.length > 0 && (
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recently Viewed</Text>
              <TouchableOpacity onPress={() => setRecentViews([])}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={recentViews}
              renderItem={renderRecentView}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentsList}
            />
          </View>
        )}

        <View style={styles.inspirationContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Travel Inspiration</Text>
          </View>
          <TouchableOpacity
            style={styles.inspirationCard}
            onPress={() => navigation.navigate("TravelTips")}
          >
            <ImageBackground
              source={{
                uri: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?q=80&w=800&auto=format&fit=crop",
              }}
              style={styles.inspirationImage}
              imageStyle={{ borderRadius: 15 }}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.7)"]}
                style={styles.inspirationGradient}
              >
                <Text style={styles.inspirationTitle}>
                  10 Essential Travel Tips for 2024
                </Text>
                <View style={styles.readMoreContainer}>
                  <Text style={styles.readMoreText}>Read More</Text>
                  <AntDesign name="arrowright" size={14} color="#3498db" />
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.exploreButton}
          onPress={() => navigation.navigate("Explore")}
        >
          <Text style={styles.exploreButtonText}>Explore Destinations</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>

      <Tabbar />
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
    paddingVertical: 15,
  },
  greeting: {
    fontSize: 16,
    color: "#666",
  },
  username: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "#3498db",
  },
  profileImage: {
    width: "100%",
    height: "100%",
  },
  weatherContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  weatherContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherInfo: {
    marginLeft: 10,
  },
  temperature: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  weatherCondition: {
    fontSize: 14,
    color: "#666",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationText: {
    fontSize: 14,
    color: "#666",
    marginRight: 5,
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 20,
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
  aiToolsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  aiToolCard: {
    width: "48%",
    height: 140,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  aiPlannerCard: {
    backgroundColor: "#3498db",
  },
  aiBudgetCard: {
    backgroundColor: "#2ecc71",
  },
  aiToolGradient: {
    height: "100%",
    padding: 15,
    justifyContent: "space-between",
  },
  aiToolIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  aiToolTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  aiToolDescription: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
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
  clearAllText: {
    fontSize: 14,
    color: "#e74c3c",
  },
  tripsList: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  tripCard: {
    width: cardWidth,
    height: 180,
    marginRight: 15,
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
    color: "white",
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
    color: "white",
  },
  tripCountry: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
  },
  daysLeftContainer: {
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.9)",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  daysLeftNumber: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  daysLeftText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.9)",
  },
  recommendationsList: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  recommendationItem: {
    width: width * 0.6,
    height: 160,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  recommendationImage: {
    width: "100%",
    height: "100%",
  },
  recommendationContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  recommendationName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  recommendationCountry: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
  },
  recentsList: {
    paddingLeft: 20,
    paddingRight: 5,
  },
  recentCard: {
    width: 120,
    height: 140,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  recentImage: {
    width: "100%",
    height: 90,
  },
  recentTextContainer: {
    padding: 10,
  },
  recentName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  recentCountry: {
    fontSize: 12,
    color: "#666",
  },
  inspirationContainer: {
    marginBottom: 25,
  },
  inspirationCard: {
    marginHorizontal: 20,
    height: 160,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  inspirationImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  inspirationGradient: {
    height: "100%",
    justifyContent: "flex-end",
    padding: 20,
  },
  inspirationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 10,
  },
  readMoreContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignSelf: "flex-start",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  readMoreText: {
    color: "#3498db",
    fontWeight: "600",
    fontSize: 12,
    marginRight: 5,
  },
  exploreButton: {
    backgroundColor: "#3498db",
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  exploreButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Home;
