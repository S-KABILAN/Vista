import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  FlatList,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import MapView, { Marker } from "react-native-maps";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { googleapis, weatherapi } from "../constants/constant";

const { width, height } = Dimensions.get("window");

const PlaceDetails = ({ route, navigation }) => {
  const { destination } = route.params;
  const [loading, setLoading] = useState(true);
  const [placeData, setPlaceData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [placePhotos, setPlacePhotos] = useState([]);
  const [weather, setWeather] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mapError, setMapError] = useState(false);

  // Ensure we have coordinates for this destination
  // Either from the passed destination object or set default ones to prevent errors
  const coordinates = {
    latitude: destination.latitude || 37.78825, // Default to San Francisco if not provided
    longitude: destination.longitude || -122.4324,
  };

  // Fetch place details and photos from Google Places API
  const fetchPlaceDetails = async () => {
    try {
      setLoading(true);

      // Check if we have valid coordinates
      if (!destination.latitude || !destination.longitude) {
        console.log("Using default coordinates for", destination.name);
      }

      // If we have a place_id, use it to fetch place details
      if (destination.id && destination.id.startsWith("place_")) {
        try {
          const placeDetailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: destination.id,
                key: googleapis,
                fields:
                  "name,formatted_address,rating,user_ratings_total,photo,editorial_summary,opening_hours,price_level,url",
              },
            }
          );

          if (placeDetailsResponse.data.status === "OK") {
            const details = placeDetailsResponse.data.result;

            // Fetch photos if available
            const photos = [];
            if (details.photos && details.photos.length > 0) {
              // Get up to 5 photos
              const photoReferences = details.photos
                .slice(0, 5)
                .map((photo) => photo.photo_reference);

              for (const reference of photoReferences) {
                photos.push(
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${reference}&key=${googleapis}`
                );
              }
            }

            // Set photos
            setPlacePhotos(photos.length > 0 ? photos : [destination.image]);

            // Extract and set place data
            setPlaceData({
              id: destination.id,
              name: details.name || destination.name,
              country: destination.country,
              description:
                details.editorial_summary?.overview ||
                destination.description ||
                `${destination.name} is a beautiful destination located in ${destination.country}. It offers incredible experiences for travelers seeking adventure, culture, and relaxation.`,
              rating: details.rating || destination.rating || 4.5,
              reviews: details.user_ratings_total || 0,
              image: photos[0] || destination.image,
              priceRange: details.price_level
                ? "$".repeat(details.price_level)
                : destination.priceRange || "$$$",
              bestTimeToVisit: "April to October", // Weather API could be used for this
              language: "Local and English",
              currency: "Local Currency",
              coordinates: coordinates,
              photos: photos.length > 0 ? photos : [destination.image],
              url: details.url || "",
            });
          } else {
            throw new Error("Failed to fetch place details");
          }
        } catch (error) {
          console.error("Error fetching place details:", error);
          // Fallback to basic data
          setPlaceData({
            id: destination.id,
            name: destination.name,
            country: destination.country,
            description:
              destination.description ||
              `${destination.name} is a beautiful destination located in ${destination.country}. It offers incredible experiences for travelers seeking adventure, culture, and relaxation.`,
            rating: destination.rating || 4.5,
            reviews: 0,
            image: destination.image,
            priceRange: destination.priceRange || "$$$",
            bestTimeToVisit: "April to October",
            language: "Local and English",
            currency: "Local Currency",
            coordinates: coordinates,
            photos: [destination.image],
          });
          setPlacePhotos([destination.image]);
        }
      } else {
        // Fallback for destinations without place_id
        setPlaceData({
          id: destination.id,
          name: destination.name,
          country: destination.country,
          description:
            destination.description ||
            `${destination.name} is a beautiful destination located in ${destination.country}. It offers incredible experiences for travelers seeking adventure, culture, and relaxation.`,
          rating: destination.rating || 4.5,
          reviews: 0,
          image: destination.image,
          priceRange: destination.priceRange || "$$$",
          bestTimeToVisit: "April to October",
          language: "Local and English",
          currency: "Local Currency",
          coordinates: coordinates,
          photos: [destination.image],
        });
        setPlacePhotos([destination.image]);
      }

      // Fetch nearby attractions
      await fetchNearbyAttractions();

      // Fetch weather data for the destination
      await fetchWeatherData();

      setLoading(false);
    } catch (error) {
      console.error("Error in place details flow:", error);
      setLoading(false);
      Alert.alert(
        "Error",
        "Failed to load place details. Please try again later.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  };

  // Fetch nearby attractions
  const fetchNearbyAttractions = async () => {
    try {
      const attractionsResponse = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${coordinates.latitude},${coordinates.longitude}`,
            radius: 5000, // 5km radius
            type: "tourist_attraction",
            rankby: "prominence",
            key: googleapis,
          },
        }
      );

      if (
        attractionsResponse.data.status === "OK" &&
        attractionsResponse.data.results.length > 0
      ) {
        const attractionsData = await Promise.all(
          attractionsResponse.data.results.slice(0, 5).map(async (place) => {
            let photoUrl = null;

            // Get photo if available
            if (place.photos && place.photos.length > 0) {
              photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${place.photos[0].photo_reference}&key=${googleapis}`;
            } else {
              // Fallback to StreetView
              photoUrl = `https://maps.googleapis.com/maps/api/streetview?size=800x400&location=${place.geometry.location.lat},${place.geometry.location.lng}&key=${googleapis}`;
            }

            // Determine price level
            const priceLevel = place.price_level
              ? "$".repeat(place.price_level)
              : "Free";

            return {
              id: place.place_id,
              name: place.name,
              rating: place.rating || 4.5,
              reviews: place.user_ratings_total || 0,
              image: photoUrl,
              description:
                place.vicinity ||
                `Explore this popular attraction near ${destination.name}.`,
              price: priceLevel,
              openingHours: place.opening_hours?.open_now
                ? "Open Now"
                : "Hours Vary",
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            };
          })
        );

        setAttractions(attractionsData);
      } else {
        // If no attractions found, use generic ones or show empty state
        console.log("No nearby attractions found");
        setAttractions([]);
      }
    } catch (error) {
      console.error("Error fetching nearby attractions:", error);
      setAttractions([]);
    }
  };

  // Fetch weather data for the destination
  const fetchWeatherData = async () => {
    try {
      // Use the WeatherAPI service with the API key from constants
      const response = await axios.get(
        `https://api.weatherapi.com/v1/forecast.json`,
        {
          params: {
            key: weatherapi,
            q: `${coordinates.latitude},${coordinates.longitude}`,
            days: 3,
            aqi: "yes",
            alerts: "no",
          },
        }
      );

      if (response.data) {
        const current = response.data.current;
        const forecast = response.data.forecast.forecastday;

        // Format the weather data
        setWeather({
          current: {
            temperature: current.temp_c,
            condition: current.condition.text,
            icon: current.condition.icon,
            humidity: current.humidity,
            wind: current.wind_kph,
            precipitation: current.precip_mm,
            uv: current.uv,
            feelsLike: current.feelslike_c,
            airQuality: current.air_quality
              ? current.air_quality["us-epa-index"] <= 2
                ? "Good"
                : current.air_quality["us-epa-index"] <= 4
                ? "Moderate"
                : "Poor"
              : "Unknown",
          },
          forecast: forecast.map((day) => ({
            date: new Date(day.date).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
            maxTemp: day.day.maxtemp_c,
            minTemp: day.day.mintemp_c,
            condition: day.day.condition.text,
            icon: day.day.condition.icon,
            sunrise: day.astro.sunrise,
            sunset: day.astro.sunset,
            chanceOfRain: day.day.daily_chance_of_rain,
          })),
        });
      } else {
        throw new Error("Failed to fetch weather data");
      }
    } catch (error) {
      console.error("Error fetching weather data:", error);
      // Fallback to generic weather data
      setWeather({
        current: {
          temperature: 22,
          condition: "Partly cloudy",
          icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
          humidity: 65,
          wind: 12,
          precipitation: 0,
          uv: 5,
          feelsLike: 23,
          airQuality: "Good",
        },
        forecast: [
          {
            date: "Today",
            maxTemp: 24,
            minTemp: 18,
            condition: "Partly cloudy",
            icon: "//cdn.weatherapi.com/weather/64x64/day/116.png",
            sunrise: "06:45 AM",
            sunset: "07:30 PM",
            chanceOfRain: 10,
          },
          {
            date: "Tomorrow",
            maxTemp: 26,
            minTemp: 19,
            condition: "Sunny",
            icon: "//cdn.weatherapi.com/weather/64x64/day/113.png",
            sunrise: "06:46 AM",
            sunset: "07:29 PM",
            chanceOfRain: 0,
          },
          {
            date: "Day after",
            maxTemp: 25,
            minTemp: 20,
            condition: "Light rain",
            icon: "//cdn.weatherapi.com/weather/64x64/day/296.png",
            sunrise: "06:47 AM",
            sunset: "07:28 PM",
            chanceOfRain: 40,
          },
        ],
      });
    }
  };

  useEffect(() => {
    fetchPlaceDetails();
  }, [destination]);

  const toggleFavorite = () => {
    // In a real app, you would save this to user preferences
    setIsFavorite(!isFavorite);

    if (!isFavorite) {
      Alert.alert(
        "Added to Favorites",
        `${destination.name} has been added to your favorites!`
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing destination: ${destination.name} in ${destination.country}!`,
        title: `Vista Travel - ${destination.name}`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const navigateToAttractionDetails = (attraction) => {
    // Navigate to attraction details screen
    navigation.navigate("AttractionDetails", { attraction, destination });
  };

  const navigateToBooking = () => {
    // Navigate to booking screen
    navigation.navigate("PlaceGo", { destination: placeData });
  };

  const navigateToAIPlanner = () => {
    // Navigate to AI Travel Planner with this destination pre-filled
    navigation.navigate("AITravelPlanner", {
      prefilledDestination: destination.name,
      destination: placeData,
    });
  };

  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity style={styles.photoItem}>
      <Image
        source={{ uri: item }}
        style={styles.photoImage}
        resizeMode="cover"
      />
    </TouchableOpacity>
  );

  const renderAttraction = ({ item }) => (
    <TouchableOpacity
      style={styles.attractionCard}
      onPress={() => navigateToAttractionDetails(item)}
    >
      <Image source={{ uri: item.image }} style={styles.attractionImage} />
      <View style={styles.attractionContent}>
        <Text style={styles.attractionName}>{item.name}</Text>
        <View style={styles.attractionRatingContainer}>
          <AntDesign name="star" size={14} color="#FFD700" />
          <Text style={styles.attractionRating}>{item.rating}</Text>
          <Text style={styles.attractionReviews}>({item.reviews} reviews)</Text>
        </View>
        <Text style={styles.attractionPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWeatherTab = () => {
    if (!weather) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
        </View>
      );
    }

    return (
      <View style={styles.weatherContainer}>
        {/* Current Weather */}
        <View style={styles.currentWeatherCard}>
          <View style={styles.currentWeatherHeader}>
            <Text style={styles.currentWeatherTitle}>Current Weather</Text>
            <Text style={styles.currentWeatherLocation}>
              {placeData.name}, {placeData.country}
            </Text>
          </View>

          <View style={styles.currentWeatherContent}>
            <View style={styles.currentWeatherMain}>
              <Image
                source={{ uri: `https:${weather.current.icon}` }}
                style={styles.weatherIcon}
              />
              <View>
                <Text style={styles.currentTemp}>
                  {Math.round(weather.current.temperature)}°C
                </Text>
                <Text style={styles.currentCondition}>
                  {weather.current.condition}
                </Text>
              </View>
            </View>

            <View style={styles.weatherDetailsGrid}>
              <View style={styles.weatherDetailItem}>
                <FontAwesome5
                  name="temperature-high"
                  size={16}
                  color="#3498db"
                />
                <Text style={styles.weatherDetailLabel}>Feels Like</Text>
                <Text style={styles.weatherDetailValue}>
                  {Math.round(weather.current.feelsLike)}°C
                </Text>
              </View>

              <View style={styles.weatherDetailItem}>
                <FontAwesome5 name="wind" size={16} color="#3498db" />
                <Text style={styles.weatherDetailLabel}>Wind</Text>
                <Text style={styles.weatherDetailValue}>
                  {weather.current.wind} km/h
                </Text>
              </View>

              <View style={styles.weatherDetailItem}>
                <Ionicons name="water-outline" size={18} color="#3498db" />
                <Text style={styles.weatherDetailLabel}>Humidity</Text>
                <Text style={styles.weatherDetailValue}>
                  {weather.current.humidity}%
                </Text>
              </View>

              <View style={styles.weatherDetailItem}>
                <Ionicons name="rainy-outline" size={18} color="#3498db" />
                <Text style={styles.weatherDetailLabel}>Precipitation</Text>
                <Text style={styles.weatherDetailValue}>
                  {weather.current.precipitation} mm
                </Text>
              </View>

              <View style={styles.weatherDetailItem}>
                <Ionicons name="sunny-outline" size={18} color="#3498db" />
                <Text style={styles.weatherDetailLabel}>UV Index</Text>
                <Text style={styles.weatherDetailValue}>
                  {weather.current.uv}
                </Text>
              </View>

              <View style={styles.weatherDetailItem}>
                <FontAwesome5 name="lungs" size={16} color="#3498db" />
                <Text style={styles.weatherDetailLabel}>Air Quality</Text>
                <Text style={styles.weatherDetailValue}>
                  {weather.current.airQuality}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Forecast */}
        <Text style={styles.forecastTitle}>3-Day Forecast</Text>
        <View>
          {weather.forecast.map((item, index) => (
            <View key={`forecast-${index}`} style={styles.forecastItem}>
              <View style={styles.forecastDay}>
                <Text style={styles.forecastDate}>{item.date}</Text>
                <View style={styles.forecastCondition}>
                  <Image
                    source={{ uri: `https:${item.icon}` }}
                    style={styles.forecastIcon}
                  />
                  <Text style={styles.forecastConditionText}>
                    {item.condition}
                  </Text>
                </View>
              </View>

              <View style={styles.forecastDetails}>
                <View style={styles.forecastTemp}>
                  <FontAwesome5
                    name="temperature-high"
                    size={14}
                    color="#FF5733"
                  />
                  <Text style={styles.maxTemp}>
                    {Math.round(item.maxTemp)}°
                  </Text>
                  <FontAwesome5
                    name="temperature-low"
                    size={14}
                    color="#3498db"
                    style={{ marginLeft: 10 }}
                  />
                  <Text style={styles.minTemp}>
                    {Math.round(item.minTemp)}°
                  </Text>
                </View>

                <View style={styles.forecastExtra}>
                  <View style={styles.forecastExtraItem}>
                    <Ionicons name="rainy-outline" size={14} color="#3498db" />
                    <Text style={styles.forecastExtraValue}>
                      {item.chanceOfRain}%
                    </Text>
                  </View>

                  <View style={styles.forecastExtraItem}>
                    <Ionicons name="sunny-outline" size={14} color="#FF9500" />
                    <Text style={styles.forecastExtraValue}>
                      {item.sunrise}
                    </Text>
                  </View>

                  <View style={styles.forecastExtraItem}>
                    <Ionicons name="moon-outline" size={14} color="#8A2BE2" />
                    <Text style={styles.forecastExtraValue}>{item.sunset}</Text>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Best Time to Visit */}
        <View style={styles.bestTimeContainer}>
          <Text style={styles.bestTimeTitle}>Best Time to Visit</Text>
          <Text style={styles.bestTimeText}>
            The best time to visit {placeData.name} is generally{" "}
            {placeData.bestTimeToVisit}. During this period, the weather is
            typically pleasant with moderate temperatures and lower chances of
            precipitation.
          </Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading destination details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: placeData.image }} style={styles.headerImage} />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent", "rgba(0,0,0,0.6)"]}
            style={styles.gradient}
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <AntDesign name="arrowleft" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={toggleFavorite}
              >
                <AntDesign
                  name={isFavorite ? "heart" : "hearto"}
                  size={22}
                  color={isFavorite ? "#FF6B6B" : "#FFF"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton} onPress={handleShare}>
                <AntDesign name="sharealt" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Destination Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.destinationName}>{placeData.name}</Text>
              <Text style={styles.destinationLocation}>
                <Ionicons name="location-sharp" size={16} color="#666" />{" "}
                {placeData.country}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{placeData.rating}</Text>
              <Text style={styles.reviewsText}>
                ({placeData.reviews} reviews)
              </Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === "overview" && styles.activeTab]}
              onPress={() => setActiveTab("overview")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "overview" && styles.activeTabText,
                ]}
              >
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === "attractions" && styles.activeTab,
              ]}
              onPress={() => setActiveTab("attractions")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "attractions" && styles.activeTabText,
                ]}
              >
                Attractions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "photos" && styles.activeTab]}
              onPress={() => setActiveTab("photos")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "photos" && styles.activeTabText,
                ]}
              >
                Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "map" && styles.activeTab]}
              onPress={() => setActiveTab("map")}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === "map" && styles.activeTabText,
                ]}
              >
                Map
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview Tab Content */}
          {activeTab === "overview" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>
                {placeData.description}
              </Text>

              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="calendar-alt" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Best Time to Visit</Text>
                    <Text style={styles.infoValue}>
                      {placeData.bestTimeToVisit}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="language" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Language</Text>
                    <Text style={styles.infoValue}>{placeData.language}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5
                    name="money-bill-wave"
                    size={20}
                    color="#3498db"
                  />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Currency</Text>
                    <Text style={styles.infoValue}>{placeData.currency}</Text>
                  </View>
                </View>

                <View style={styles.infoItem}>
                  <FontAwesome5 name="money-bill" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Price Range</Text>
                    <Text style={styles.infoValue}>{placeData.priceRange}</Text>
                  </View>
                </View>
              </View>

              {/* Weather Section */}
              <Text style={styles.sectionTitle}>Weather</Text>
              {renderWeatherTab()}

              {/* Top Attractions Preview */}
              <View style={styles.attractionsPreview}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Top Attractions</Text>
                  <TouchableOpacity onPress={() => setActiveTab("attractions")}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                {attractions.slice(0, 2).map((item, index) => (
                  <View key={`attraction-${index}`}>
                    {renderAttraction({ item })}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Attractions Tab Content */}
          {activeTab === "attractions" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Popular Attractions</Text>
              {attractions.length > 0 ? (
                <View>
                  {attractions.map((item, index) => (
                    <View key={`attraction-${index}`}>
                      {renderAttraction({ item })}
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.noAttractionsText}>
                  No attractions found for this location.
                </Text>
              )}
            </View>
          )}

          {/* Photos Tab Content */}
          {activeTab === "photos" && (
            <View style={styles.tabContent}>
              <View style={styles.photosHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.photoCount}>
                  {placePhotos.length} photos
                </Text>
              </View>
              <View style={styles.photosGrid}>
                {placePhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={`photo-${index}`}
                    style={styles.photoItem}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Map Tab Content */}
          {activeTab === "map" && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Location</Text>
              {mapError ? (
                <View style={styles.mapErrorContainer}>
                  <MaterialIcons name="location-off" size={40} color="#999" />
                  <Text style={styles.mapErrorText}>
                    Unable to load map. Location coordinates may be missing.
                  </Text>
                </View>
              ) : (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    onError={() => setMapError(true)}
                  >
                    <Marker
                      coordinate={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                      }}
                      title={placeData.name}
                    />
                  </MapView>
                </View>
              )}
              <View style={styles.addressContainer}>
                <Ionicons name="location-sharp" size={22} color="#3498db" />
                <Text style={styles.addressText}>
                  {placeData.name}, {placeData.country}
                </Text>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity
              style={styles.aiPlannerButton}
              onPress={navigateToAIPlanner}
            >
              <AntDesign name="rocket1" size={24} color="#FFF" />
              <Text style={styles.aiPlannerButtonText}>Plan with AI</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={navigateToBooking}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
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
  imageContainer: {
    height: height * 0.35,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerButtons: {
    position: "absolute",
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  rightButtons: {
    flexDirection: "row",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  destinationName: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
  },
  destinationLocation: {
    fontSize: 16,
    color: "#666",
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 5,
  },
  reviewsText: {
    fontSize: 12,
    color: "#666",
    marginLeft: 3,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 5,
    minWidth: width / 5,
    alignItems: "center",
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabText: {
    fontSize: 15,
    color: "#999",
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "600",
  },
  tabContent: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "48%",
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
  },
  infoTextContainer: {
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  weatherContainer: {
    padding: 15,
  },
  currentWeatherCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentWeatherHeader: {
    marginBottom: 15,
  },
  currentWeatherTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  currentWeatherLocation: {
    fontSize: 14,
    color: "#666",
  },
  currentWeatherContent: {
    gap: 20,
  },
  currentWeatherMain: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: {
    width: 80,
    height: 80,
  },
  currentTemp: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#333",
  },
  currentCondition: {
    fontSize: 16,
    color: "#666",
  },
  weatherDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  weatherDetailItem: {
    width: "30%",
    alignItems: "center",
    marginBottom: 15,
  },
  weatherDetailLabel: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  weatherDetailValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginTop: 2,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
  },
  forecastItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  forecastDay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  forecastDate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  forecastCondition: {
    flexDirection: "row",
    alignItems: "center",
  },
  forecastIcon: {
    width: 30,
    height: 30,
  },
  forecastConditionText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 5,
  },
  forecastDetails: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  forecastTemp: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  maxTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF5733",
    marginLeft: 5,
  },
  minTemp: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#3498db",
    marginLeft: 5,
  },
  forecastExtra: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  forecastExtraItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  forecastExtraValue: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  bestTimeContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bestTimeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  bestTimeText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  attractionsPreview: {
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "500",
  },
  previewAttractionsList: {
    marginBottom: 10,
  },
  attractionsList: {
    marginBottom: 10,
  },
  attractionCard: {
    flexDirection: "row",
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attractionImage: {
    width: 100,
    height: 100,
  },
  attractionContent: {
    flex: 1,
    padding: 12,
    justifyContent: "center",
  },
  attractionName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  attractionRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },
  attractionRating: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginLeft: 4,
  },
  attractionReviews: {
    fontSize: 12,
    color: "#666",
    marginLeft: 5,
  },
  attractionPrice: {
    fontSize: 14,
    color: "#3498db",
    fontWeight: "500",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 5,
  },
  photoItem: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    margin: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 15,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  mapErrorContainer: {
    height: 200,
    borderRadius: 15,
    backgroundColor: "#f8f8f8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  mapErrorText: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 20,
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
  },
  addressText: {
    fontSize: 15,
    color: "#333",
    marginLeft: 10,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    marginTop: 25,
  },
  aiPlannerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 15,
    flex: 1,
  },
  aiPlannerButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
    marginLeft: 8,
  },
  bookButton: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2ecc71",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  photosHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 14,
    color: "#666",
  },
  noAttractionsText: {
    fontSize: 15,
    color: "#666",
    fontStyle: "italic",
    textAlign: "center",
    padding: 20,
  },
});

export default PlaceDetails;
