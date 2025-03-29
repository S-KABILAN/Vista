import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Callout,
  Polyline,
  AnimatedRegion,
} from "react-native-maps";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
  Entypo,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList as RNFlatList } from "react-native";
import * as Location from "expo-location";
const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = height * 0.25;

// Replace DESTINATIONS constant with an empty array, since we'll fetch data from API
const DESTINATIONS = [];

const GOOGLE_MAPS_API_KEY = "AIzaSyA0E_xu1VBpJ7gxVvfZ8bMXqmNe3advwes";

const Globe = ({ navigation, route }) => {
  // State variables
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [filteredDestinations, setFilteredDestinations] =
    useState(DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapType, setMapType] = useState("standard");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const [isRouteFetching, setIsRouteFetching] = useState(false);
  const [routeSteps, setRouteSteps] = useState([]);
  const [travelTime, setTravelTime] = useState(null);
  const [travelDistance, setTravelDistance] = useState(null);
  const [showTraffic, setShowTraffic] = useState(false);
  const [showTransit, setShowTransit] = useState(false);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [placesCategory, setPlacesCategory] = useState("restaurant");
  const [showPlacesMenu, setShowPlacesMenu] = useState(false);
  const [isRoutePlanningMode, setIsRoutePlanningMode] = useState(false);
  const [routePlanningStep, setRoutePlanningStep] = useState(0);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeMode, setRouteMode] = useState("driving");
  const [originAddress, setOriginAddress] = useState("Starting point");
  const [destinationAddress, setDestinationAddress] = useState("Destination");
  // Add the missing state variables here
  const [dynamicDestinations, setDynamicDestinations] = useState([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState("tourist_attraction");
  const [currentPage, setCurrentPage] = useState(0);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isExploring, setIsExploring] = useState(false);
  const [exploreRegion, setExploreRegion] = useState(null);

  // Refs
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const scrollViewRef = useRef(null);

  // Animation values
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimation = useRef(new Animated.Value(height)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Replace sample filter options with Google Places supported types
  const filterOptions = [
    { id: "all", label: "All", icon: "globe" },
    { id: "tourist_attraction", label: "Attractions", icon: "monument" },
    { id: "restaurant", label: "Restaurants", icon: "utensils" },
    { id: "lodging", label: "Hotels", icon: "hotel" },
    { id: "museum", label: "Museums", icon: "university" },
    { id: "amusement_park", label: "Parks", icon: "tree" },
    { id: "shopping_mall", label: "Shopping", icon: "shopping-bag" },
    { id: "bar", label: "Nightlife", icon: "glass-martini-alt" },
  ];

  // New mapType options
  const mapTypes = [
    { id: "standard", label: "Standard", icon: "map" },
    { id: "satellite", label: "Satellite", icon: "globe" },
    { id: "terrain", label: "Terrain", icon: "mountain" },
    { id: "hybrid", label: "Hybrid", icon: "layers" },
  ];

  // Add place categories
  const placeCategories = [
    { id: "restaurant", label: "Restaurants", icon: "utensils" },
    { id: "lodging", label: "Hotels", icon: "hotel" },
    { id: "tourist_attraction", label: "Attractions", icon: "camera" },
    { id: "shopping_mall", label: "Shopping", icon: "shopping-bag" },
    { id: "gas_station", label: "Gas Stations", icon: "gas-pump" },
    { id: "parking", label: "Parking", icon: "parking" },
  ];

  // Effects
  useEffect(() => {
    // Get user's current location (in a real app, request permissions first)
    const getCurrentLocation = async () => {
      setLoading(true);
      try {
        // Simulated location for demo
        setTimeout(() => {
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.006,
          });
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.log("Error getting location:", error);
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Add detailed debugging for route params
    console.log("Globe screen - route:", route);
    console.log("Globe screen - route.params:", route?.params);

    // Get route parameters if navigated from AITravelPlanner
    if (route?.params?.showRoute) {
      try {
        console.log("Route params received:", route.params);
        const {
          origin,
          destination,
          destinationName,
          mode = "driving",
        } = route.params;

        if (!origin || !destination) {
          console.error("Missing origin or destination coordinates");
          return;
        }

        setShowRoute(true);

        // Use the enhanced route creation function with specified mode
        createRouteWithDirections(origin, destination, mode);

        // Set user location
        setUserLocation(origin);

        // Set route details
        setRouteDetails({
          distance: travelDistance || "Calculating...",
          duration: travelTime || "Calculating...",
          destination: destinationName || "Destination",
          mode: mode || "driving",
        });

        // Add destination marker
        const destinationObj = {
          id: "destination",
          name: destinationName || "Destination",
          coordinates: destination,
          type: "custom",
        };

        // Add to filtered destinations if not already there
        setFilteredDestinations((prev) => {
          const exists = prev.some((item) => item.id === "destination");
          return exists ? prev : [...prev, destinationObj];
        });
      } catch (error) {
        console.error("Error setting up route display:", error);
      }
    }
  }, [route?.params]);

  useEffect(() => {
    // Filter destinations based on search query and active filter
    const filtered = DESTINATIONS.filter((destination) => {
      const matchesSearch =
        searchQuery === "" ||
        destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        destination.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "popular"
          ? destination.popular
          : destination.type === activeFilter);

      return matchesSearch && matchesFilter;
    });

    setFilteredDestinations(filtered);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    // Animate card when a destination is selected
    if (selectedDestination) {
      Animated.spring(cardAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(cardAnimation, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedDestination]);

  // Calculate distance between two coordinates in km (haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  // Handlers
  const handleMarkerPress = (destination) => {
    setSelectedDestination(destination);

    // Center map on selected destination with animation
    mapRef.current?.animateToRegion(
      {
        latitude: destination.coordinates.latitude,
        longitude: destination.coordinates.longitude,
        latitudeDelta: 10,
        longitudeDelta: 10,
      },
      1000
    );

    // Scroll carousel to the selected destination
    const index = filteredDestinations.findIndex(
      (item) => item.id === destination.id
    );
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollToIndex({ index, animated: true });
    }
  };

  // Replace with enhanced version that fetches additional details
  const handleCardPress = async (destination) => {
    try {
      setLoading(true);

      // Only fetch additional details if we have a place_id
      if (destination.place_id) {
        const details = await fetchPlaceDetails(destination.place_id);

        if (details) {
          // Merge the details with the destination
          const enhancedDestination = {
            ...destination,
            phone: details.formatted_phone_number,
            website: details.website,
            address: details.formatted_address,
            opening_hours: details.opening_hours,
            photos: details.photos,
            reviews: details.reviews,
            price_level: details.price_level,
            editorial_summary: details.editorial_summary,
          };

          // Navigate with enhanced destination
          navigation.navigate("PlaceDetails", {
            destination: enhancedDestination,
          });
          setLoading(false);
          return;
        }
      }

      // Fallback to basic navigation if no details available
      navigation.navigate("PlaceDetails", { destination });
    } catch (error) {
      console.error("Error fetching place details:", error);
      // Navigate with original destination if there's an error
      navigation.navigate("PlaceDetails", { destination });
    } finally {
      setLoading(false);
    }
  };

  const toggleSearchBar = () => {
    const toValue = showSearch ? 0 : 1;

    Animated.timing(searchBarAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setShowSearch(!showSearch);

    if (showSearch) {
      setSearchQuery("");
    }
  };

  const toggleMapType = () => {
    const currentIndex = mapTypes.findIndex((type) => type.id === mapType);
    const nextIndex = (currentIndex + 1) % mapTypes.length;
    setMapType(mapTypes[nextIndex].id);
  };

  const goToUserLocation = async () => {
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please allow location access to use this feature."
        );
        return;
      }

      setLoading(true);

      let location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        maximumAge: 10000,
      });

      const { latitude, longitude } = location.coords;

      // Set user location
      setUserLocation({
        latitude,
        longitude,
      });

      // Animate map to user location
      if (mapRef.current) {
        mapRef.current.animateToRegion(
          {
            latitude,
            longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Could not get your location. Please try again.");
      setLoading(false);
    }
  };

  const handleFilterPress = (filterId) => {
    setActiveFilter(filterId);

    if (exploreRegion) {
      // If we're already exploring a region, refresh with the new filter
      fetchPlacesWithNewFilter(filterId);
    } else if (filterId === "all") {
      // If no specific region is being explored, and "all" is selected,
      // just show the popular destinations again
      setFilteredDestinations(dynamicDestinations);
    } else {
      // Filter the existing destinations
      const filtered = dynamicDestinations.filter(
        (place) =>
          place.type === filterId ||
          (place.type && place.type.includes(filterId))
      );
      setFilteredDestinations(
        filtered.length > 0 ? filtered : dynamicDestinations
      );
    }
  };

  const planTrip = () => {
    if (selectedDestination) {
      navigation.navigate("AITravelPlanner", {
        prefilledDestination: selectedDestination.name,
        selectedDestination: selectedDestination,
      });
    }
  };

  // Add function to search for places near the route
  const searchNearbyPlaces = async (
    latitude,
    longitude,
    type = "restaurant"
  ) => {
    try {
      console.log(`Searching for ${type} near ${latitude},${longitude}`);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=5000&type=${type}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const result = await response.json();
      if (result.status === "OK" && result.results) {
        console.log(`Found ${result.results.length} places nearby`);
        // Format places to match our destination format
        const formattedPlaces = result.results
          .slice(0, 10)
          .map((place, index) => ({
            id: `place-${index}-${place.place_id.substring(0, 5)}`,
            name: place.name,
            coordinates: {
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
            },
            rating: place.rating || 0,
            vicinity: place.vicinity,
            type: placesCategory,
            photo:
              place.photos && place.photos.length > 0
                ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                : null,
            place_id: place.place_id,
          }));

        setNearbyPlaces(formattedPlaces);
      } else {
        console.log("Failed to find nearby places", result.status);
        setNearbyPlaces([]);
      }
    } catch (error) {
      console.error("Error searching for nearby places:", error);
      setNearbyPlaces([]);
    }
  };

  // Update the createRouteWithDirections function to add transit mode option
  const createRouteWithDirections = async (
    origin,
    destination,
    mode = "driving"
  ) => {
    try {
      setIsRouteFetching(true);

      // Fallback to direct line if the directions API fails
      const directLine = [
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ];

      // Get directions from Google Maps Directions API
      console.log(
        `Getting ${mode} directions from ${origin.latitude},${origin.longitude} to ${destination.latitude},${destination.longitude}`
      );

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const result = await response.json();
      console.log("Directions API response status:", result.status);

      if (result.status === "OK" && result.routes.length > 0) {
        // Get the route
        const route = result.routes[0];

        // Get duration and distance
        const leg = route.legs[0];
        setTravelTime(leg.duration.text);
        setTravelDistance(leg.distance.text);

        // Get steps with instructions
        setRouteSteps(
          leg.steps.map((step) => ({
            instructions: step.html_instructions,
            distance: step.distance.text,
            duration: step.duration.text,
            travel_mode: step.travel_mode,
            transit_details: step.transit_details,
          }))
        );

        // Decode the polyline
        const points = route.overview_polyline.points;
        const decodedPoints = decodePolyline(points);

        // Set the route coordinates
        setRouteCoordinates(decodedPoints);

        // Adjust map to show the entire route
        const coordinates = decodedPoints;
        let minLat = coordinates[0].latitude;
        let maxLat = coordinates[0].latitude;
        let minLng = coordinates[0].longitude;
        let maxLng = coordinates[0].longitude;

        coordinates.forEach((coord) => {
          minLat = Math.min(minLat, coord.latitude);
          maxLat = Math.max(maxLat, coord.latitude);
          minLng = Math.min(minLng, coord.longitude);
          maxLng = Math.max(maxLng, coord.longitude);
        });

        // Set region to include all points with some padding
        const padding = 0.4; // Adjust as needed
        setRegion({
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: maxLat - minLat + padding,
          longitudeDelta: maxLng - minLng + padding,
        });

        // Search for places near the middle of the route
        const midPoint = Math.floor(coordinates.length / 2);
        if (midPoint > 0 && coordinates[midPoint]) {
          searchNearbyPlaces(
            coordinates[midPoint].latitude,
            coordinates[midPoint].longitude,
            placesCategory
          );
        }
      } else {
        // Fallback to direct line if directions fail
        console.log("Directions API failed, using direct line");
        setRouteCoordinates(directLine);

        // Calculate distance and time using haversine formula
        const distance = calculateDistance(
          origin.latitude,
          origin.longitude,
          destination.latitude,
          destination.longitude
        );

        setTravelDistance(`${Math.round(distance)} km`);
        setTravelTime(
          `${Math.floor(distance / 80)} hours ${Math.round(
            ((distance / 80) % 1) * 60
          )} mins`
        );

        // Try to search for places near the destination
        searchNearbyPlaces(
          destination.latitude,
          destination.longitude,
          placesCategory
        );
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      // Fallback to direct line
      setRouteCoordinates([
        { latitude: origin.latitude, longitude: origin.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ]);
    } finally {
      setIsRouteFetching(false);
    }
  };

  // Helper function to decode Google's encoded polyline
  const decodePolyline = (encoded) => {
    let index = 0,
      lat = 0,
      lng = 0;
    const len = encoded.length;
    const decoded = [];

    while (index < len) {
      let b,
        shift = 0,
        result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      decoded.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return decoded;
  };

  // UI Renderers
  const renderMarker = (destination) => {
    // Special styling for the route destination marker
    const isRouteDestination = destination.id === "destination";

    return (
      <Marker
        key={destination.id}
        coordinate={destination.coordinates}
        title={destination.name}
        description={destination.country}
        ref={(ref) => (markerRefs.current[destination.id] = ref)}
        pinColor={isRouteDestination ? "#FF5722" : undefined}
      >
        {isRouteDestination ? (
          <View style={styles.destinationMarker}>
            <FontAwesome5 name="map-marker-alt" size={24} color="#FF5722" />
          </View>
        ) : (
          <View style={styles.markerContainer}>
            <View style={styles.marker} />
          </View>
        )}
        <Callout
          tooltip
          onPress={() => navigation.navigate("PlaceDetails", { destination })}
        >
          <View style={styles.calloutContainer}>
            <Text style={styles.calloutTitle}>{destination.name}</Text>
            {destination.country && (
              <Text style={styles.calloutSubtitle}>{destination.country}</Text>
            )}
            <Text style={styles.calloutAction}>Tap to view details</Text>
          </View>
        </Callout>
      </Marker>
    );
  };

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        activeFilter === item.id && styles.activeFilterItem,
      ]}
      onPress={() => handleFilterPress(item.id)}
    >
      <FontAwesome5
        name={item.icon}
        size={16}
        color={activeFilter === item.id ? "#fff" : "#3498db"}
      />
      <Text
        style={[
          styles.filterText,
          activeFilter === item.id && styles.activeFilterText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDestinationCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handleCardPress(item)}
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
      </View>
    </TouchableOpacity>
  );

  const renderRoute = () => {
    if (!routeCoordinates || !showRoute) return null;

    return (
      <>
        <Polyline
          coordinates={routeCoordinates}
          strokeColor="#4285F4"
          strokeWidth={5}
          geodesic={true}
        />

        {isRouteFetching ? (
          <View style={styles.loadingRouteOverlay}>
            <ActivityIndicator size="large" color="#4285F4" />
            <Text style={styles.loadingRouteText}>
              Calculating optimal route...
            </Text>
          </View>
        ) : (
          routeDetails && (
            <View style={styles.routeInfoCard}>
              <LinearGradient
                colors={["#4285F4", "#0F9D58"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.routeInfoGradient}
              >
                <Text style={styles.routeInfoTitle}>Driving Route</Text>
                <Text style={styles.routeInfoDestination}>
                  To: {routeDetails.destination}
                </Text>

                <View style={styles.routeDetailRow}>
                  <View style={styles.routeInfoRow}>
                    <FontAwesome5 name="road" size={16} color="#FFF" />
                    <Text style={styles.routeInfoText}>
                      {travelDistance || routeDetails.distance}
                    </Text>
                  </View>

                  <View style={styles.routeInfoRow}>
                    <FontAwesome5 name="clock" size={16} color="#FFF" />
                    <Text style={styles.routeInfoText}>
                      {travelTime ||
                        `${Math.floor(routeDetails.duration / 60)}h ${
                          routeDetails.duration % 60
                        }m`}
                    </Text>
                  </View>
                </View>

                {routeSteps.length > 0 && (
                  <TouchableOpacity
                    style={styles.viewStepsButton}
                    onPress={() => {
                      Alert.alert(
                        "Driving Directions",
                        routeSteps
                          .map(
                            (step, index) =>
                              `${index + 1}. ${step.instructions.replace(
                                /<[^>]*>/g,
                                ""
                              )} (${step.distance})`
                          )
                          .join("\n\n"),
                        [{ text: "OK" }]
                      );
                    }}
                  >
                    <Text style={styles.viewStepsButtonText}>
                      View Turn-by-Turn Directions
                    </Text>
                    <MaterialIcons name="directions" size={18} color="#FFF" />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.closeRouteButton}
                  onPress={() => {
                    setShowRoute(false);
                    setRouteCoordinates(null);
                    setRouteDetails(null);
                    setRouteSteps([]);
                    setTravelTime(null);
                    setTravelDistance(null);

                    // Remove the destination marker
                    setFilteredDestinations((prev) =>
                      prev.filter((item) => item.id !== "destination")
                    );

                    // Reset map view
                    if (userLocation) {
                      setRegion({
                        latitude: userLocation.latitude,
                        longitude: userLocation.longitude,
                        latitudeDelta: 0.1,
                        longitudeDelta: 0.1,
                      });
                    } else {
                      setRegion({
                        latitude: 20,
                        longitude: 0,
                        latitudeDelta: 50,
                        longitudeDelta: 50,
                      });
                    }
                  }}
                >
                  <Text style={styles.closeRouteButtonText}>Close Route</Text>
                  <FontAwesome5
                    name="times"
                    size={14}
                    color="#FFF"
                    style={{ marginLeft: 8 }}
                  />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )
        )}
      </>
    );
  };

  // Add renderPlaceMarker for nearby places
  const renderPlaceMarker = (place) => {
    return (
      <Marker
        key={place.id}
        coordinate={place.coordinates}
        title={place.name}
        description={place.vicinity || ""}
      >
        <View style={styles.placeMarkerContainer}>
          <FontAwesome5
            name={
              place.type === "restaurant"
                ? "utensils"
                : place.type === "lodging"
                ? "hotel"
                : place.type === "tourist_attraction"
                ? "camera"
                : place.type === "shopping_mall"
                ? "shopping-bag"
                : place.type === "gas_station"
                ? "gas-pump"
                : place.type === "parking"
                ? "parking"
                : "map-marker"
            }
            size={18}
            color="#FF5722"
          />
        </View>
        <Callout tooltip>
          <View style={styles.placeCalloutContainer}>
            <Text style={styles.placeCalloutTitle}>{place.name}</Text>
            {place.vicinity && (
              <Text style={styles.placeCalloutSubtitle}>{place.vicinity}</Text>
            )}
            {place.rating > 0 && (
              <View style={styles.placeCalloutRatingContainer}>
                <AntDesign name="star" size={12} color="#FFD700" />
                <Text style={styles.placeCalloutRating}>
                  {place.rating.toFixed(1)}
                </Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.placeCalloutButton}
              onPress={() => {
                Alert.alert(
                  "Feature Coming Soon",
                  "Viewing place details will be available soon!"
                );
              }}
            >
              <Text style={styles.placeCalloutButtonText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </Callout>
      </Marker>
    );
  };

  // Add effect to update map when traffic or transit settings change
  useEffect(() => {
    if (mapRef.current) {
      // This forces the map to re-render with new traffic/transit settings
      const currentRegion = mapRef.current.__lastRegion || region;
      mapRef.current.animateToRegion(currentRegion, 100);
    }
  }, [showTraffic, showTransit]);

  // Add function to handle map press for route planning
  const handleMapPress = (event) => {
    if (!isRoutePlanningMode) return;

    const { coordinate } = event.nativeEvent;

    if (routePlanningStep === 1) {
      // Set origin
      setRouteOrigin(coordinate);
      setRoutePlanningStep(2);
      Alert.alert("Origin Set", "Now tap on the map to set your destination", [
        { text: "OK" },
      ]);
    } else if (routePlanningStep === 2) {
      // Set destination
      setRouteDestination(coordinate);

      // Start route planning
      createRouteWithDirections(routeOrigin, coordinate, routeMode);

      // Exit route planning mode
      setIsRoutePlanningMode(false);
      setRoutePlanningStep(0);
      setShowRoute(true);
    }
  };

  // Add function to cancel route planning
  const cancelRoutePlanning = () => {
    setIsRoutePlanningMode(false);
    setRoutePlanningStep(0);
    setRouteOrigin(null);
    setRouteDestination(null);
  };

  // Add function to start route planning
  const startRoutePlanning = () => {
    setIsRoutePlanningMode(true);
    setRoutePlanningStep(1);
    setShowPlacesMenu(false);

    Alert.alert(
      "Plan Your Route",
      "Tap on the map to set your starting point",
      [
        {
          text: "Cancel",
          onPress: cancelRoutePlanning,
          style: "cancel",
        },
        { text: "OK" },
      ]
    );
  };

  // Add function to get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
      );

      const result = await response.json();
      if (result.status === "OK" && result.results.length > 0) {
        return result.results[0].formatted_address;
      }
      return "Unknown location";
    } catch (error) {
      console.error("Error getting address:", error);
      return "Unknown location";
    }
  };

  // Add effect to fetch addresses when origin/destination change
  useEffect(() => {
    const fetchAddresses = async () => {
      if (routeOrigin) {
        const address = await getAddressFromCoordinates(
          routeOrigin.latitude,
          routeOrigin.longitude
        );
        setOriginAddress(address);
      }

      if (routeDestination) {
        const address = await getAddressFromCoordinates(
          routeDestination.latitude,
          routeDestination.longitude
        );
        setDestinationAddress(address);
      }
    };

    fetchAddresses();
  }, [routeOrigin, routeDestination]);

  // Add a function to fetch popular destinations from Google Places API
  const fetchPopularDestinations = async () => {
    try {
      setIsLoadingDestinations(true);

      // Initial set of destinations for different regions around the world
      const popularRegions = [
        { name: "Paris", latitude: 48.8566, longitude: 2.3522 },
        { name: "New York", latitude: 40.7128, longitude: -74.006 },
        { name: "Tokyo", latitude: 35.6762, longitude: 139.6503 },
        { name: "Sydney", latitude: -33.8688, longitude: 151.2093 },
        { name: "Cape Town", latitude: -33.9249, longitude: 18.4241 },
        { name: "Rio de Janeiro", latitude: -22.9068, longitude: -43.1729 },
      ];

      const results = [];

      // For each region, fetch nearby tourist attractions
      for (const region of popularRegions) {
        const data = await fetchPlacesNearLocation(
          region.latitude,
          region.longitude,
          10000, // 10km radius
          "tourist_attraction",
          null,
          true // This is for popular destinations
        );

        if (data && data.results) {
          results.push(...data.results);
        }
      }

      // Process and set the destinations
      const destinations = processPlacesResults(results, true);
      setDynamicDestinations(destinations);
      setFilteredDestinations(destinations);

      setIsLoadingDestinations(false);
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
      setIsLoadingDestinations(false);
      Alert.alert(
        "Error",
        "Failed to load popular destinations. Please try again later."
      );
    }
  };

  // Function to fetch places near a location
  const fetchPlacesNearLocation = async (
    latitude,
    longitude,
    radius = 5000,
    type = null,
    pageToken = null,
    rankByImportance = false
  ) => {
    try {
      let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`;

      if (rankByImportance) {
        url += `&rankby=prominence&radius=${radius}`;
      } else {
        url += `&radius=${radius}`;
      }

      if (type && type !== "all") {
        url += `&type=${type}`;
      }

      if (pageToken) {
        url += `&pagetoken=${pageToken}`;
      }

      console.log("Fetching places:", url);

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK" || data.status === "ZERO_RESULTS") {
        // Store the next page token if available
        if (data.next_page_token) {
          setNextPageToken(data.next_page_token);
        } else {
          setNextPageToken(null);
        }

        return data;
      } else {
        console.error("Places API error:", data.status, data.error_message);
        throw new Error(data.error_message || "Failed to fetch places");
      }
    } catch (error) {
      console.error("Error in fetchPlacesNearLocation:", error);
      throw error;
    }
  };

  // Function to fetch place details with photo
  const fetchPlaceDetails = async (placeId) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,photo,editorial_summary,geometry,type,opening_hours,price_level,user_ratings_total,website,formatted_phone_number&key=${GOOGLE_MAPS_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === "OK") {
        return data.result;
      } else {
        console.error("Place Details API error:", data.status);
        return null;
      }
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  // Process places results into our app's format
  const processPlacesResults = (results, isPopular = false) => {
    return results.map((place, index) => {
      // Use first photo if available, otherwise use a placeholder
      const photoReference =
        place.photos && place.photos.length > 0
          ? place.photos[0].photo_reference
          : null;

      const photoUrl = photoReference
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`
        : "https://maps.gstatic.com/mapfiles/place_api/icons/v1/png_71/generic_business-71.png";

      // Extract country from vicinity or formatted_address, if available
      let country = "";
      const address = place.vicinity || place.formatted_address || "";
      const addressParts = address.split(", ");
      if (addressParts.length > 1) {
        country = addressParts[addressParts.length - 1];
      }

      return {
        id: place.place_id || `place-${index}`,
        name: place.name || "Unnamed Place",
        country: country,
        description:
          place.editorial_summary?.overview ||
          `Explore this interesting ${
            place.types ? place.types[0].replace(/_/g, " ") : "place"
          } with a rating of ${place.rating || "N/A"}.`,
        image: photoUrl,
        coordinates: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
        },
        rating: place.rating || 0,
        type: place.types ? place.types[0] : "other",
        popular: isPopular,
        place_id: place.place_id,
        // Store additional details for later use
        vicinity: place.vicinity || place.formatted_address,
        user_ratings_total: place.user_ratings_total,
        price_level: place.price_level,
      };
    });
  };

  // Function to explore places in the current map region
  const exploreCurrentRegion = async () => {
    if (!region) return;

    try {
      setIsExploring(true);
      setCurrentPage(0);
      setNextPageToken(null);

      // Store the region we're exploring
      setExploreRegion({
        latitude: region.latitude,
        longitude: region.longitude,
      });

      const data = await fetchPlacesNearLocation(
        region.latitude,
        region.longitude,
        5000, // 5km radius from center of current map view
        activeFilter === "all" ? null : activeFilter
      );

      if (data && data.results) {
        const places = processPlacesResults(data.results);
        setDynamicDestinations(places);
        setFilteredDestinations(places);
      } else {
        setDynamicDestinations([]);
        setFilteredDestinations([]);
        Alert.alert(
          "No Results",
          "No places found in this area. Try zooming out or changing filters."
        );
      }
    } catch (error) {
      console.error("Error exploring region:", error);
      Alert.alert("Error", "Failed to load places. Please try again.");
    } finally {
      setIsExploring(false);
    }
  };

  // Load more places when scrolling to the end of the carousel
  const loadMorePlaces = async () => {
    if (!nextPageToken || isLoadingDestinations || !exploreRegion) return;

    try {
      setIsLoadingDestinations(true);

      // Wait a short delay as the nextPageToken isn't immediately available
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const data = await fetchPlacesNearLocation(
        exploreRegion.latitude,
        exploreRegion.longitude,
        5000,
        activeFilter === "all" ? null : activeFilter,
        nextPageToken
      );

      if (data && data.results && data.results.length > 0) {
        const newPlaces = processPlacesResults(data.results);

        // Combine with existing places, ensuring no duplicates
        const updatedPlaces = [...dynamicDestinations];
        newPlaces.forEach((place) => {
          if (!updatedPlaces.some((p) => p.id === place.id)) {
            updatedPlaces.push(place);
          }
        });

        setDynamicDestinations(updatedPlaces);

        // Update filtered destinations if we're not filtering by search query
        if (!searchQuery) {
          setFilteredDestinations(updatedPlaces);
        } else {
          // Apply current search filter
          const filtered = updatedPlaces.filter(
            (place) =>
              place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (place.country &&
                place.country.toLowerCase().includes(searchQuery.toLowerCase()))
          );
          setFilteredDestinations(filtered);
        }

        setCurrentPage(currentPage + 1);
      }
    } catch (error) {
      console.error("Error loading more places:", error);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  // Update the useEffect to fetch popular destinations on mount
  useEffect(() => {
    // Get user's current location
    const getCurrentLocation = async () => {
      setLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          console.log("Location permission denied");
          // Fallback to New York coordinates
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.006,
          });
        } else {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });

          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });

          // Update the map region to user's location
          setRegion({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
      } catch (error) {
        console.log("Error getting location:", error);
        // Fallback to New York coordinates
        setUserLocation({
          latitude: 40.7128,
          longitude: -74.006,
        });
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
    fetchPopularDestinations();
  }, []);

  // Function to fetch places with a new filter
  const fetchPlacesWithNewFilter = async (filterId) => {
    if (!exploreRegion) return;

    try {
      setIsLoadingDestinations(true);

      const data = await fetchPlacesNearLocation(
        exploreRegion.latitude,
        exploreRegion.longitude,
        5000,
        filterId === "all" ? null : filterId
      );

      if (data && data.results) {
        const places = processPlacesResults(data.results);
        setDynamicDestinations(places);
        setFilteredDestinations(places);
      }
    } catch (error) {
      console.error("Error fetching places with new filter:", error);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Explore the World</Text>

        <TouchableOpacity style={styles.headerButton} onPress={toggleSearchBar}>
          <Ionicons
            name={showSearch ? "close" : "search"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            maxHeight: searchBarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchBarAnimation,
            marginTop: searchBarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10],
            }),
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />

        <View style={styles.filtersExplanation}>
          <Text style={styles.filtersExplanationText}>
            {activeFilter === "all"
              ? "Showing popular destinations around the world"
              : `Showing ${
                  filterOptions.find((f) => f.id === activeFilter)?.label ||
                  activeFilter
                }`}
          </Text>
        </View>
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            mapType={mapType}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            showsTraffic={showTraffic}
            showsIndoors={true}
            showsBuildings={mapType === "hybrid" || mapType === "satellite"}
            showsMyLocationButton={false}
            showsPointsOfInterest={true}
            toolbarEnabled={true}
            loadingEnabled={true}
            loadingIndicatorColor="#4285F4"
            loadingBackgroundColor="#FFFFFF"
            onRegionChangeComplete={setRegion}
            onPress={handleMapPress}
          >
            {/* User Location Marker */}
            {userLocation && (
              <Marker
                coordinate={userLocation}
                pinColor="#4285F4"
                title="You are here"
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </Marker>
            )}

            {/* Origin Marker for Route Planning */}
            {routeOrigin && (
              <Marker
                coordinate={routeOrigin}
                pinColor="#4CAF50"
                title="Starting Point"
              >
                <View style={styles.routeMarkerContainer}>
                  <FontAwesome5 name="flag" size={16} color="#4CAF50" />
                </View>
              </Marker>
            )}

            {/* Destination Marker for Route Planning */}
            {routeDestination && (
              <Marker
                coordinate={routeDestination}
                pinColor="#F44336"
                title="Destination"
              >
                <View style={styles.routeMarkerContainer}>
                  <FontAwesome5
                    name="flag-checkered"
                    size={16}
                    color="#F44336"
                  />
                </View>
              </Marker>
            )}

            {/* Destination Markers */}
            {filteredDestinations.map((destination) =>
              renderMarker(destination)
            )}

            {/* Nearby Places Markers */}
            {nearbyPlaces.map((place) => renderPlaceMarker(place))}

            {/* Route Line */}
            {showRoute && renderRoute()}
          </MapView>
        )}

        {/* Map Controls */}
        <View style={styles.mapControlsContainer}>
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={toggleMapType}
            >
              <Feather
                name={
                  mapType === "standard"
                    ? "map"
                    : mapType === "satellite"
                    ? "globe"
                    : mapType === "terrain"
                    ? "mountain"
                    : "layers"
                }
                size={20}
                color="#333"
              />
              <Text style={styles.mapControlLabel}>
                {mapType.charAt(0).toUpperCase() + mapType.slice(1)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.mapControlButton,
                showTraffic && styles.mapControlButtonActive,
              ]}
              onPress={() => setShowTraffic(!showTraffic)}
            >
              <MaterialIcons
                name="traffic"
                size={20}
                color={showTraffic ? "#4285F4" : "#333"}
              />
              <Text
                style={[
                  styles.mapControlLabel,
                  showTraffic && styles.mapControlLabelActive,
                ]}
              >
                Traffic
              </Text>
            </TouchableOpacity>

            {showRoute && (
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={() => {
                  // Show travel mode options
                  Alert.alert("Travel Mode", "Choose your travel mode", [
                    {
                      text: "Driving",
                      onPress: () => {
                        if (routeDetails && userLocation) {
                          createRouteWithDirections(
                            userLocation,
                            {
                              latitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.latitude,
                              longitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.longitude,
                            },
                            "driving"
                          );
                        }
                      },
                    },
                    {
                      text: "Walking",
                      onPress: () => {
                        if (routeDetails && userLocation) {
                          createRouteWithDirections(
                            userLocation,
                            {
                              latitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.latitude,
                              longitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.longitude,
                            },
                            "walking"
                          );
                        }
                      },
                    },
                    {
                      text: "Transit",
                      onPress: () => {
                        if (routeDetails && userLocation) {
                          createRouteWithDirections(
                            userLocation,
                            {
                              latitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.latitude,
                              longitude: filteredDestinations.find(
                                (d) => d.id === "destination"
                              )?.coordinates.longitude,
                            },
                            "transit"
                          );
                        }
                      },
                    },
                    {
                      text: "Cancel",
                      style: "cancel",
                    },
                  ]);
                }}
              >
                <FontAwesome5
                  name={
                    routeDetails?.mode === "driving"
                      ? "car"
                      : routeDetails?.mode === "walking"
                      ? "walking"
                      : routeDetails?.mode === "transit"
                      ? "bus"
                      : "route"
                  }
                  size={20}
                  color="#333"
                />
                <Text style={styles.mapControlLabel}>Mode</Text>
              </TouchableOpacity>
            )}

            {showRoute && (
              <TouchableOpacity
                style={styles.mapControlButton}
                onPress={() => setShowPlacesMenu(!showPlacesMenu)}
              >
                <MaterialIcons name="place" size={20} color="#333" />
                <Text style={styles.mapControlLabel}>Places</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={goToUserLocation}
            >
              <MaterialIcons name="my-location" size={20} color="#333" />
              <Text style={styles.mapControlLabel}>Find Me</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mapControlButton}
              onPress={exploreCurrentRegion}
              disabled={isExploring}
            >
              <MaterialIcons
                name="explore"
                size={20}
                color={isExploring ? "#999" : "#333"}
              />
              <Text style={styles.mapControlLabel}>
                {isExploring ? "Loading..." : "Explore Here"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Places category menu */}
          {showPlacesMenu && (
            <View style={styles.placesMenu}>
              <Text style={styles.placesMenuTitle}>Find Nearby:</Text>
              <FlatList
                data={placeCategories}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.placeCategoryButton,
                      placesCategory === item.id &&
                        styles.placeCategoryButtonActive,
                    ]}
                    onPress={() => {
                      setPlacesCategory(item.id);
                      // Find midpoint of route to search around
                      if (routeCoordinates && routeCoordinates.length > 0) {
                        const midIdx = Math.floor(routeCoordinates.length / 2);
                        searchNearbyPlaces(
                          routeCoordinates[midIdx].latitude,
                          routeCoordinates[midIdx].longitude,
                          item.id
                        );
                      }
                    }}
                  >
                    <FontAwesome5
                      name={item.icon}
                      size={16}
                      color={placesCategory === item.id ? "#fff" : "#333"}
                    />
                    <Text
                      style={[
                        styles.placeCategoryText,
                        placesCategory === item.id &&
                          styles.placeCategoryTextActive,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.placeCategoriesList}
              />
            </View>
          )}
        </View>
      </View>

      {/* Destination Cards Carousel */}
      <View style={styles.carouselContainer}>
        <AnimatedFlatList
          ref={scrollViewRef}
          data={filteredDestinations}
          renderItem={renderDestinationCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 20}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.carousel}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.floor(
              event.nativeEvent.contentOffset.x / (CARD_WIDTH + 20)
            );

            if (filteredDestinations[index]) {
              setSelectedDestination(filteredDestinations[index]);

              // Center map on the selected destination
              mapRef.current?.animateToRegion(
                {
                  latitude: filteredDestinations[index].coordinates.latitude,
                  longitude: filteredDestinations[index].coordinates.longitude,
                  latitudeDelta: 0.1,
                  longitudeDelta: 0.1,
                },
                1000
              );

              // Show the marker's callout
              if (markerRefs.current[filteredDestinations[index].id]) {
                markerRefs.current[
                  filteredDestinations[index].id
                ].showCallout();
              }
            }

            // Check if we're near the end and should load more places
            if (
              index >= filteredDestinations.length - 2 &&
              nextPageToken &&
              !isLoadingDestinations
            ) {
              loadMorePlaces();
            }
          }}
          ListFooterComponent={() =>
            isLoadingDestinations && nextPageToken ? (
              <View style={styles.carouselFooterLoading}>
                <ActivityIndicator size="large" color="#3498db" />
                <Text style={styles.carouselFooterText}>
                  Loading more places...
                </Text>
              </View>
            ) : null
          }
        />
      </View>

      {/* Selected Destination Details Card */}
      <Animated.View
        style={[
          styles.destinationCard,
          { transform: [{ translateY: cardAnimation }] },
        ]}
      >
        {selectedDestination && (
          <>
            <View style={styles.destinationCardHandle} />

            <View style={styles.destinationCardHeader}>
              <View>
                <Text style={styles.destinationCardTitle}>
                  {selectedDestination.name}
                </Text>
                <Text style={styles.destinationCardSubtitle}>
                  {selectedDestination.country}
                </Text>
              </View>
              <View style={styles.destinationCardRating}>
                <AntDesign name="star" size={16} color="#FFD700" />
                <Text style={styles.destinationCardRatingText}>
                  {selectedDestination.rating}
                </Text>
              </View>
            </View>

            <Text style={styles.destinationCardDescription}>
              {selectedDestination.description}
            </Text>

            <View style={styles.destinationCardActions}>
              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => handleCardPress(selectedDestination)}
              >
                <MaterialIcons name="info-outline" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => {
                  // Open in Maps app with coordinates
                  alert("Would open in Maps app");
                }}
              >
                <MaterialIcons name="directions" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => {
                  // Save to favorites
                  alert("Added to favorites");
                }}
              >
                <Ionicons name="heart-outline" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Favorite</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.planTripButton} onPress={planTrip}>
              <FontAwesome5
                name="robot"
                size={18}
                color="#fff"
                style={styles.planTripIcon}
              />
              <Text style={styles.planTripButtonText}>Plan Trip with AI</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>

      {/* Route Planning Floating Button */}
      {!isRoutePlanningMode && !showRoute && (
        <TouchableOpacity
          style={styles.routePlanningButton}
          onPress={startRoutePlanning}
        >
          <LinearGradient
            colors={["#4285F4", "#34A853"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.routePlanningButtonGradient}
          >
            <FontAwesome5 name="route" size={18} color="#FFF" />
            <Text style={styles.routePlanningButtonText}>Plan Route</Text>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* Route Planning Mode Indicator */}
      {isRoutePlanningMode && (
        <View style={styles.routePlanningIndicator}>
          <LinearGradient
            colors={["#4285F4", "#34A853"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.routePlanningIndicatorGradient}
          >
            <Text style={styles.routePlanningIndicatorText}>
              {routePlanningStep === 1
                ? "Tap to set starting point"
                : "Tap to set destination"}
            </Text>
            <TouchableOpacity
              style={styles.routePlanningIndicatorButton}
              onPress={cancelRoutePlanning}
            >
              <Entypo name="cross" size={20} color="#FFF" />
            </TouchableOpacity>
          </LinearGradient>
        </View>
      )}

      {/* Travel Mode Selector */}
      {showRoute && (
        <View style={styles.travelModeSelector}>
          <TouchableOpacity
            style={[
              styles.travelModeButton,
              routeMode === "driving" && styles.travelModeButtonActive,
            ]}
            onPress={() => {
              setRouteMode("driving");
              if (routeOrigin && routeDestination) {
                createRouteWithDirections(
                  routeOrigin,
                  routeDestination,
                  "driving"
                );
              }
            }}
          >
            <FontAwesome5
              name="car"
              size={16}
              color={routeMode === "driving" ? "#4285F4" : "#666"}
            />
            <Text
              style={[
                styles.travelModeText,
                routeMode === "driving" && styles.travelModeTextActive,
              ]}
            >
              Drive
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.travelModeButton,
              routeMode === "walking" && styles.travelModeButtonActive,
            ]}
            onPress={() => {
              setRouteMode("walking");
              if (routeOrigin && routeDestination) {
                createRouteWithDirections(
                  routeOrigin,
                  routeDestination,
                  "walking"
                );
              }
            }}
          >
            <FontAwesome5
              name="walking"
              size={16}
              color={routeMode === "walking" ? "#4285F4" : "#666"}
            />
            <Text
              style={[
                styles.travelModeText,
                routeMode === "walking" && styles.travelModeTextActive,
              ]}
            >
              Walk
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.travelModeButton,
              routeMode === "transit" && styles.travelModeButtonActive,
            ]}
            onPress={() => {
              setRouteMode("transit");
              if (routeOrigin && routeDestination) {
                createRouteWithDirections(
                  routeOrigin,
                  routeDestination,
                  "transit"
                );
              }
            }}
          >
            <FontAwesome5
              name="bus"
              size={16}
              color={routeMode === "transit" ? "#4285F4" : "#666"}
            />
            <Text
              style={[
                styles.travelModeText,
                routeMode === "transit" && styles.travelModeTextActive,
              ]}
            >
              Transit
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.travelModeButton,
              routeMode === "bicycling" && styles.travelModeButtonActive,
            ]}
            onPress={() => {
              setRouteMode("bicycling");
              if (routeOrigin && routeDestination) {
                createRouteWithDirections(
                  routeOrigin,
                  routeDestination,
                  "bicycling"
                );
              }
            }}
          >
            <FontAwesome5
              name="bicycle"
              size={16}
              color={routeMode === "bicycling" ? "#4285F4" : "#666"}
            />
            <Text
              style={[
                styles.travelModeText,
                routeMode === "bicycling" && styles.travelModeTextActive,
              ]}
            >
              Bike
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Route Info from Origin/Destination to routeInfoCard */}
      {showRoute && (
        <View style={styles.routeAddressesContainer}>
          <View style={styles.routeAddressRow}>
            <View style={[styles.routeAddressDot, styles.originDot]} />
            <Text style={styles.routeAddressText} numberOfLines={1}>
              {originAddress}
            </Text>
          </View>
          <View style={styles.routeAddressDivider} />
          <View style={styles.routeAddressRow}>
            <View style={[styles.routeAddressDot, styles.destinationDot]} />
            <Text style={styles.routeAddressText} numberOfLines={1}>
              {destinationAddress}
            </Text>
          </View>
        </View>
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
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButton: {
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
  searchBarContainer: {
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
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
  filtersContainer: {
    paddingVertical: 15,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeFilterItem: {
    backgroundColor: "#3498db",
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    margin: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControlsContainer: {
    position: "absolute",
    right: 15,
    top: 15,
  },
  mapControls: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    padding: 8,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  mapControlButton: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    marginVertical: 6,
    padding: 10,
    width: 70,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  mapControlButtonActive: {
    backgroundColor: "#E8F0FE",
  },
  mapControlLabel: {
    fontSize: 11,
    marginTop: 4,
    color: "#333",
  },
  mapControlLabelActive: {
    color: "#4285F4",
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3498db",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMarker: {
    backgroundColor: "#e74c3c",
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popularDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
  },
  calloutContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  userLocationMarker: {
    height: 24,
    width: 24,
    borderRadius: 12,
    backgroundColor: "rgba(66, 133, 244, 0.2)",
    borderWidth: 2,
    borderColor: "#4285F4",
    justifyContent: "center",
    alignItems: "center",
  },
  userLocationDot: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: "#4285F4",
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
  carouselContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
  },
  carousel: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 15,
    marginHorizontal: 10,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 22,
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
  },
  destinationCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  destinationCardHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  destinationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  destinationCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  destinationCardSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  destinationCardRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  destinationCardRatingText: {
    marginLeft: 5,
    fontWeight: "bold",
    color: "#333",
  },
  destinationCardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  destinationCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  destinationCardAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  destinationCardActionText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
  },
  planTripButton: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  planTripIcon: {
    marginRight: 8,
  },
  planTripButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
  routeInfoCard: {
    position: "absolute",
    bottom: 100,
    left: width * 0.05,
    right: width * 0.05,
    borderRadius: 12,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  routeInfoGradient: {
    padding: 18,
    borderRadius: 12,
  },
  routeInfoTitle: {
    color: "#FFF",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  routeInfoDestination: {
    color: "#FFF",
    fontSize: 16,
    marginBottom: 15,
  },
  routeDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  routeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeInfoText: {
    color: "#FFF",
    fontSize: 14,
    marginLeft: 10,
    fontWeight: "500",
  },
  viewStepsButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  viewStepsButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
    marginRight: 8,
  },
  closeRouteButton: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  closeRouteButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  destinationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingRouteOverlay: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 15,
    alignItems: "center",
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingRouteText: {
    marginLeft: 10,
    fontSize: 16,
    color: "#333",
  },
  originDestinationContainer: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 12,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  originDot: {
    backgroundColor: "#4285F4",
  },
  destinationDot: {
    backgroundColor: "#FF5722",
  },
  locationText: {
    fontSize: 14,
    color: "#333",
  },
  placeMarkerContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FF5722",
  },
  placeCalloutContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 12,
    width: 180,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  placeCalloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
    color: "#333",
  },
  placeCalloutSubtitle: {
    fontSize: 12,
    color: "#666",
    marginBottom: 6,
  },
  placeCalloutRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  placeCalloutRating: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 4,
    color: "#333",
  },
  placeCalloutButton: {
    backgroundColor: "#4285F4",
    borderRadius: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  placeCalloutButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  placesMenu: {
    backgroundColor: "white",
    borderRadius: 12,
    marginTop: 8,
    padding: 12,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    width: 300,
  },
  placesMenuTitle: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  placeCategoriesList: {
    paddingVertical: 4,
  },
  placeCategoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  placeCategoryButtonActive: {
    backgroundColor: "#4285F4",
  },
  placeCategoryText: {
    fontSize: 12,
    marginLeft: 6,
    color: "#333",
  },
  placeCategoryTextActive: {
    color: "white",
  },
  routeInfoTravelMode: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  routeInfoTravelModeText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "500",
  },
  routePlanningButton: {
    position: "absolute",
    bottom: CARD_HEIGHT + 50,
    right: 20,
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  routePlanningButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  routePlanningButtonText: {
    color: "#FFF",
    fontWeight: "bold",
    marginLeft: 8,
  },
  routePlanningIndicator: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 10,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  routePlanningIndicatorGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  routePlanningIndicatorText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  routePlanningIndicatorButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  routeMarkerContainer: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
  },
  travelModeSelector: {
    position: "absolute",
    top: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 10,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  travelModeButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  travelModeButtonActive: {
    backgroundColor: "#E8F0FE",
  },
  travelModeText: {
    fontSize: 12,
    marginTop: 4,
    color: "#666",
  },
  travelModeTextActive: {
    color: "#4285F4",
    fontWeight: "bold",
  },
  routeAddressesContainer: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  routeAddressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  routeAddressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  routeAddressText: {
    color: "#FFF",
    fontSize: 14,
    flex: 1,
  },
  routeAddressDivider: {
    height: 20,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginLeft: 6,
    marginVertical: 4,
  },
  carouselFooterLoading: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 10,
  },
  carouselFooterText: {
    marginTop: 10,
    color: "#3498db",
    fontWeight: "bold",
  },
  exploreButton: {
    position: "absolute",
    top: 85,
    right: 20,
    backgroundColor: "#3498db",
    borderRadius: 25,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  filtersExplanation: {
    alignItems: "center",
    marginTop: -10,
    marginBottom: 5,
  },
  filtersExplanationText: {
    color: "#666",
    fontSize: 12,
    fontStyle: "italic",
  },
});

export default Globe;
