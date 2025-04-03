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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Callout,
  Polyline,
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
import * as Location from "expo-location";
import debounce from "lodash/debounce";

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList);
const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = height * 0.25;

const GOOGLE_MAPS_API_KEY = "AIzaSyA0E_xu1VBpJ7gxVvfZ8bMXqmNe3advwes"; // Replace with your API key

const Globe = ({ navigation, route }) => {
  // State Variables
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [filteredDestinations, setFilteredDestinations] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPredictions, setSearchPredictions] = useState([]);
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
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [placesCategory, setPlacesCategory] = useState("restaurant");
  const [isRoutePlanningMode, setIsRoutePlanningMode] = useState(false);
  const [routePlanningStep, setRoutePlanningStep] = useState(0);
  const [routeOrigin, setRouteOrigin] = useState(null);
  const [routeDestination, setRouteDestination] = useState(null);
  const [routeMode, setRouteMode] = useState("driving");
  const [originAddress, setOriginAddress] = useState("Starting point");
  const [destinationAddress, setDestinationAddress] = useState("Destination");
  const [dynamicDestinations, setDynamicDestinations] = useState([]);
  const [isLoadingDestinations, setIsLoadingDestinations] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState("tourist_attraction");
  const [nextPageToken, setNextPageToken] = useState(null);
  const [isExploring, setIsExploring] = useState(false);
  const [exploreRegion, setExploreRegion] = useState(null);
  const [savedLocations, setSavedLocations] = useState([]);
  const [is3DView, setIs3DView] = useState(false);
  const [showDestinationCard, setShowDestinationCard] = useState(true);

  // Refs
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const scrollViewRef = useRef(null);
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimation = useRef(new Animated.Value(height)).current;

  // Filter Options
  const filterOptions = [
    { id: "all", label: "All", icon: "globe" },
    { id: "tourist_attraction", label: "Attractions", icon: "camera" },
    { id: "restaurant", label: "Restaurants", icon: "utensils" },
    { id: "lodging", label: "Hotels", icon: "bed" },
    { id: "museum", label: "Museums", icon: "landmark" },
    { id: "shopping_mall", label: "Shopping", icon: "shopping-bag" },
    { id: "cafe", label: "Cafes", icon: "coffee" },
  ];

  const placeCategories = [
    { id: "restaurant", label: "Restaurants", icon: "utensils" },
    { id: "lodging", label: "Hotels", icon: "hotel" },
    { id: "tourist_attraction", label: "Attractions", icon: "camera" },
    { id: "shopping_mall", label: "Shopping", icon: "shopping-bag" },
    { id: "gas_station", label: "Gas Stations", icon: "gas-pump" },
  ];

  // Effects
  useEffect(() => {
    const getCurrentLocation = async () => {
      setLoading(true);
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setUserLocation({ latitude: 40.7128, longitude: -74.006 });
        } else {
          const location = await Location.getCurrentPositionAsync({});
          setUserLocation({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
          setRegion({
            ...region,
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          });
        }
        fetchPopularDestinations();
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (route?.params?.showRoute) {
      const {
        origin,
        destination,
        destinationName,
        mode = "driving",
      } = route.params;
      setShowRoute(true);
      createRouteWithDirections(origin, destination, mode);
      setUserLocation(origin);
      setRouteDetails({
        distance: travelDistance || "Calculating...",
        duration: travelTime || "Calculating...",
        destination: destinationName || "Destination",
        mode: mode,
      });
    }
  }, [route?.params]);

  useEffect(() => {
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

  useEffect(() => {
    // Hide destination card when route panel is shown
    if (showRoute || isRoutePlanningMode) {
      setShowDestinationCard(false);
    } else {
      setShowDestinationCard(true);
    }
  }, [showRoute, isRoutePlanningMode]);

  // Google Places API Functions
  const fetchPlacePredictions = async (input) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${GOOGLE_MAPS_API_KEY}&types=establishment|geocode`
      );
      const data = await response.json();
      if (data.status === "OK") {
        setSearchPredictions(data.predictions);
      }
    } catch (error) {
      console.error("Error fetching predictions:", error);
    }
  };

  const debouncedSearch = useRef(
    debounce((text) => {
      setSearchQuery(text);
      if (text.length > 2) fetchPlacePredictions(text);
    }, 300)
  ).current;

  const fetchPlaceDetails = async (placeId) => {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,photo,geometry,type,opening_hours,price_level,user_ratings_total,website,formatted_phone_number&key=${GOOGLE_MAPS_API_KEY}`
      );
      const data = await response.json();
      return data.status === "OK" ? data.result : null;
    } catch (error) {
      console.error("Error fetching place details:", error);
      return null;
    }
  };

  const fetchPlacesNearLocation = async (
    latitude,
    longitude,
    radius = 5000,
    type
  ) => {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=${radius}&type=${type}&key=${GOOGLE_MAPS_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      return data.status === "OK" ? data : null;
    } catch (error) {
      console.error("Error fetching places:", error);
      return null;
    }
  };

  const processPlacesResults = (results) => {
    return results.map((place) => ({
      id: place.place_id,
      name: place.name,
      coordinates: {
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
      },
      rating: place.rating || 0,
      image: place.photos?.[0]
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${place.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
        : "https://via.placeholder.com/400",
      vicinity: place.vicinity,
      type: place.types[0],
      place_id: place.place_id,
    }));
  };

  const fetchPopularDestinations = async () => {
    try {
      setIsLoadingDestinations(true);
      const data = await fetchPlacesNearLocation(
        region.latitude,
        region.longitude,
        50000,
        "tourist_attraction"
      );
      if (data && data.results) {
        const destinations = processPlacesResults(data.results);
        setDynamicDestinations(destinations);
        setFilteredDestinations(destinations);
      }
    } catch (error) {
      console.error("Error fetching popular destinations:", error);
    } finally {
      setIsLoadingDestinations(false);
    }
  };

  // Route Functions
  const createRouteWithDirections = async (
    origin,
    destination,
    mode = "driving"
  ) => {
    try {
      setIsRouteFetching(true);
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destinationStr}&mode=${mode}&key=${GOOGLE_MAPS_API_KEY}`
      );
      const result = await response.json();

      if (result.routes && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];
        setTravelTime(leg.duration.text);
        setTravelDistance(leg.distance.text);
        setOriginAddress(leg.start_address);
        setDestinationAddress(leg.end_address);
        setRouteDetails({
          distance: leg.distance.text,
          duration: leg.duration.text,
          destination: leg.end_address,
          mode: mode,
        });
        setRouteSteps(leg.steps);
        setRouteCoordinates(decodePolyline(route.overview_polyline.points));
        setRouteOrigin(origin);
        setRouteDestination(destination);

        mapRef.current?.animateToRegion(
          {
            latitude: (origin.latitude + destination.latitude) / 2,
            longitude: (origin.longitude + destination.longitude) / 2,
            latitudeDelta:
              Math.abs(origin.latitude - destination.latitude) * 1.5,
            longitudeDelta:
              Math.abs(origin.longitude - destination.longitude) * 1.5,
          },
          1000
        );
      }
    } catch (error) {
      console.error("Error fetching route:", error);
      Alert.alert("Error", "Failed to get route directions");
    } finally {
      setIsRouteFetching(false);
    }
  };

  const decodePolyline = (encoded) => {
    let points = [];
    let index = 0,
      len = encoded.length;
    let lat = 0,
      lng = 0;
    while (index < len) {
      let b,
        shift = 0,
        result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += dlat;
      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      let dlng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += dlng;
      points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
    }
    return points;
  };

  const searchNearbyPlaces = async (
    latitude,
    longitude,
    type = "restaurant"
  ) => {
    const data = await fetchPlacesNearLocation(latitude, longitude, 5000, type);
    if (data && data.results) {
      const places = processPlacesResults(data.results.slice(0, 10));
      setNearbyPlaces(places);
    }
  };

  // Handlers
  const handleMarkerPress = (destination) => {
    setSelectedDestination(destination);
    mapRef.current?.animateToRegion(
      {
        latitude: destination.coordinates.latitude,
        longitude: destination.coordinates.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
      1000
    );
  };

  const handleCardPress = async (destination) => {
    setLoading(true);
    const details = await fetchPlaceDetails(destination.place_id);
    navigation.navigate("PlaceDetails", {
      destination: { ...destination, ...details },
    });
    setLoading(false);
  };

  const toggleSearchBar = () => {
    // First collapse any predictions
    setSearchPredictions([]);

    // Then toggle the search bar
    Animated.spring(searchBarAnimation, {
      toValue: showSearch ? 0 : 1,
      useNativeDriver: false,
    }).start();

    setShowSearch(!showSearch);
    if (showSearch) setSearchQuery("");
  };

  const goToUserLocation = async () => {
    try {
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      mapRef.current?.animateToRegion(
        {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    } catch (error) {
      Alert.alert("Error", "Could not get your location");
    }
  };

  const handleFilterPress = (filterId) => {
    setActiveFilter(filterId);
    setSearchQuery("");
    setExploreRegion(region);
    setIsLoadingDestinations(true);
    if (filterId !== "all") {
      fetchPlacesNearLocation(region.latitude, region.longitude, 5000, filterId)
        .then((data) => {
          if (data && data.results) {
            const places = processPlacesResults(data.results);
            setDynamicDestinations(places);
            setFilteredDestinations(places);
          }
        })
        .finally(() => setIsLoadingDestinations(false));
    } else {
      fetchPopularDestinations();
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

  const startRoutePlanning = () => {
    setIsRoutePlanningMode(true);
    setRoutePlanningStep(1);
    setShowRoute(false);
    setRouteCoordinates(null);
    Alert.alert("Plan Your Route", "Tap on the map to set your starting point");
  };

  const handleMapPress = (event) => {
    // Dismiss search predictions and destination cards when pressing on map
    if (searchPredictions.length > 0) {
      setSearchPredictions([]);
    }

    if (isRoutePlanningMode) {
      const { coordinate } = event.nativeEvent;
      if (routePlanningStep === 1) {
        setRouteOrigin(coordinate);
        setRoutePlanningStep(2);
      } else {
        setRouteDestination(coordinate);
        createRouteWithDirections(routeOrigin, coordinate);
        setIsRoutePlanningMode(false);
        setShowRoute(true);
      }
    } else {
      // When not in route planning mode, dismiss the selected destination
      setSelectedDestination(null);
    }
  };

  const getAddressFromCoordinates = async (latitude, longitude) => {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_API_KEY}`
    );
    const result = await response.json();
    return result.status === "OK"
      ? result.results[0].formatted_address
      : "Unknown location";
  };

  const toggleFavorite = (destination) => {
    setSavedLocations((prev) => {
      const exists = prev.some((loc) => loc.id === destination.id);
      if (exists) {
        return prev.filter((loc) => loc.id !== destination.id);
      }
      return [...prev, destination];
    });
  };

  const toggle3DView = () => {
    mapRef.current?.animateCamera(
      {
        pitch: is3DView ? 0 : 45,
        heading: is3DView ? 0 : 90,
      },
      1000
    );
    setIs3DView(!is3DView);
  };

  // Render Components
  const Header = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Globe</Text>

      <TouchableOpacity style={styles.headerIcon} onPress={toggleSearchBar}>
        <Ionicons
          name={showSearch ? "close" : "search"}
          size={28}
          color="#fff"
        />
      </TouchableOpacity>
    </View>
  );

  const FilterBar = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {filterOptions.map((filter) => (
          <TouchableOpacity
            key={filter.id}
            style={[
              styles.filterButton,
              activeFilter === filter.id && styles.activeFilterButton,
            ]}
            onPress={() => handleFilterPress(filter.id)}
          >
            <LinearGradient
              colors={
                activeFilter === filter.id
                  ? ["#4285F4", "#34A853"]
                  : ["#ffffff", "#f0f0f0"]
              }
              style={styles.filterGradient}
            >
              <FontAwesome5
                name={filter.icon}
                size={18}
                color={activeFilter === filter.id ? "#fff" : "#666"}
              />
              <Text
                style={[
                  styles.filterText,
                  activeFilter === filter.id && styles.activeFilterText,
                ]}
              >
                {filter.label}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderMarker = (destination) => (
    <Marker
      key={destination.id}
      coordinate={destination.coordinates}
      title={destination.name}
      description={destination.vicinity}
    >
      <View style={styles.customMarker}>
        <FontAwesome5 name="map-marker" size={16} color="#4285F4" />
      </View>
      <Callout onPress={() => handleCardPress(destination)}>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{destination.name}</Text>
          <Text style={styles.calloutSubtitle}>{destination.vicinity}</Text>
        </View>
      </Callout>
    </Marker>
  );

  const renderDestinationCard = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
      <Image
        source={{ uri: item.image }}
        style={styles.cardImage}
        resizeMode="cover"
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.cardOverlay}
      >
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.cardInfo}>
            <Text style={styles.cardSubtitle}>{item.vicinity}</Text>
            {item.rating > 0 && (
              <View style={styles.ratingBadge}>
                <AntDesign name="star" size={14} color="#FFD700" />
                <Text style={styles.ratingText}>{item.rating}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() =>
              createRouteWithDirections(userLocation, item.coordinates)
            }
          >
            <FontAwesome5 name="route" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderRoute = () =>
    routeCoordinates && (
      <>
        <Polyline
          coordinates={routeCoordinates}
          strokeWidth={6}
          strokeColor="#4285F4"
        />
        {routeOrigin && (
          <Marker coordinate={routeOrigin}>
            <View style={styles.originMarker}>
              <FontAwesome5 name="flag" size={16} color="#4CAF50" />
            </View>
          </Marker>
        )}
        {routeDestination && (
          <Marker coordinate={routeDestination}>
            <View style={styles.destinationMarker}>
              <FontAwesome5 name="flag-checkered" size={16} color="#FF5722" />
            </View>
          </Marker>
        )}
      </>
    );

  const RoutePanel = () => {
    if (!showRoute || !routeDetails) return null;

    return (
      <Animated.View style={styles.routePanel}>
        <LinearGradient
          colors={["#4285F4", "#34A853"]}
          style={styles.routeHeader}
        >
          <Text style={styles.routeDuration}>{travelTime}</Text>
          <Text style={styles.routeDistance}>{travelDistance}</Text>
          <TouchableOpacity
            style={styles.closeRouteButton}
            onPress={() => {
              setShowRoute(false);
              setRouteCoordinates(null);
              setRouteOrigin(null);
              setRouteDestination(null);
              setRouteDetails(null);
            }}
          >
            <Entypo name="cross" size={20} color="#fff" />
          </TouchableOpacity>
        </LinearGradient>
        <View style={styles.routeDetails}>
          <View style={styles.routeStep}>
            <FontAwesome5 name="map-marker-alt" size={20} color="#4285F4" />
            <Text style={styles.routeAddress}>{originAddress}</Text>
          </View>
          <View style={styles.routeStep}>
            <FontAwesome5 name="flag-checkered" size={20} color="#FF5722" />
            <Text style={styles.routeAddress}>{destinationAddress}</Text>
          </View>
          <ScrollView horizontal style={styles.modeSelector}>
            {["driving", "walking", "transit", "bicycling"].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeButton,
                  routeMode === mode && styles.activeModeButton,
                ]}
                onPress={() => {
                  setRouteMode(mode);
                  if (routeOrigin && routeDestination) {
                    createRouteWithDirections(
                      routeOrigin,
                      routeDestination,
                      mode
                    );
                  }
                }}
              >
                <FontAwesome5
                  name={
                    mode === "driving"
                      ? "car"
                      : mode === "walking"
                      ? "walking"
                      : mode === "transit"
                      ? "bus"
                      : "bicycle"
                  }
                  size={16}
                  color={routeMode === mode ? "#fff" : "#666"}
                />
                <Text
                  style={[
                    styles.modeText,
                    routeMode === mode && styles.activeModeText,
                  ]}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.startNavigation}
            onPress={() => {
              Alert.alert("Navigation Started", "Your journey is beginning!");
              // Add navigation logic here
            }}
          >
            <Text style={styles.startNavigationText}>Start Navigation</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.safeAreaContainer}>
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Header />

        {/* Search and Filter section with high zIndex */}
        <View style={styles.topControlsContainer}>
          <Animated.View
            style={[
              styles.searchContainer,
              { opacity: searchBarAnimation },
              showSearch && styles.activeSearchContainer,
            ]}
          >
            <TextInput
              style={styles.searchInput}
              placeholder="Search places..."
              onChangeText={debouncedSearch}
              value={searchQuery}
            />
            {searchPredictions.length > 0 && (
              <FlatList
                data={searchPredictions}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={async () => {
                      const details = await fetchPlaceDetails(item.place_id);
                      if (details) {
                        const dest = {
                          id: item.place_id,
                          name: details.name,
                          coordinates: {
                            latitude: details.geometry.location.lat,
                            longitude: details.geometry.location.lng,
                          },
                          vicinity: details.formatted_address,
                          image: details.photos?.[0]
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${details.photos[0].photo_reference}&key=${GOOGLE_MAPS_API_KEY}`
                            : "https://via.placeholder.com/400",
                          rating: details.rating || 0,
                          place_id: item.place_id,
                        };
                        setFilteredDestinations([dest]);
                        setSelectedDestination(dest);
                        mapRef.current?.animateToRegion(
                          {
                            latitude: dest.coordinates.latitude,
                            longitude: dest.coordinates.longitude,
                            latitudeDelta: 0.1,
                            longitudeDelta: 0.1,
                          },
                          1000
                        );
                        setShowSearch(false);
                        setSearchPredictions([]);
                      }
                    }}
                  >
                    <Text style={styles.predictionText}>
                      {item.description}
                    </Text>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.place_id}
                style={styles.predictionsList}
              />
            )}
          </Animated.View>

          <FilterBar />
        </View>

        {/* Map section */}
        <View style={styles.mapContainer}>
          {loading ? (
            <ActivityIndicator size="large" color="#4285F4" />
          ) : (
            <MapView
              ref={mapRef}
              style={styles.map}
              provider={PROVIDER_GOOGLE}
              initialRegion={region}
              mapType={mapType}
              showsUserLocation={true}
              showsTraffic={showTraffic}
              onRegionChangeComplete={setRegion}
              onPress={handleMapPress}
            >
              {userLocation && (
                <Marker coordinate={userLocation} title="You are here">
                  <View style={styles.userLocationMarker}>
                    <View style={styles.userLocationDot} />
                  </View>
                </Marker>
              )}
              {filteredDestinations.map(renderMarker)}
              {nearbyPlaces.map((place) => (
                <Marker
                  key={place.id}
                  coordinate={place.coordinates}
                  title={place.name}
                >
                  <View style={styles.placeMarker}>
                    <FontAwesome5
                      name={
                        placeCategories.find((c) => c.id === place.type)
                          ?.icon || "map-marker"
                      }
                      size={18}
                      color="#FF5722"
                    />
                  </View>
                </Marker>
              ))}
              {renderRoute()}
            </MapView>
          )}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={goToUserLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggle3DView}
            >
              <MaterialIcons name="3d-rotation" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowTraffic(!showTraffic)}
            >
              <MaterialIcons
                name="traffic"
                size={24}
                color={showTraffic ? "#34A853" : "#fff"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom section for cards and controls - only shown when not in route mode */}
        {!isRoutePlanningMode && !showRoute && (
          <View style={styles.bottomContainer}>
            <AnimatedFlatList
              ref={scrollViewRef}
              data={filteredDestinations}
              renderItem={renderDestinationCard}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={CARD_WIDTH + 15}
              contentContainerStyle={styles.carousel}
            />

            {selectedDestination && showDestinationCard && (
              <Animated.View
                style={[
                  styles.destinationCard,
                  { transform: [{ translateY: cardAnimation }] },
                ]}
              >
                <Text style={styles.destinationCardTitle}>
                  {selectedDestination.name}
                </Text>
                <Text style={styles.destinationCardSubtitle}>
                  {selectedDestination.vicinity}
                </Text>
                <View style={styles.destinationCardActions}>
                  <TouchableOpacity
                    onPress={() => toggleFavorite(selectedDestination)}
                  >
                    <Ionicons
                      name={
                        savedLocations.some(
                          (loc) => loc.id === selectedDestination.id
                        )
                          ? "heart"
                          : "heart-outline"
                      }
                      size={24}
                      color="#4285F4"
                    />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={planTrip}>
                    <FontAwesome5 name="robot" size={24} color="#4285F4" />
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}
          </View>
        )}

        {/* Route planning button - only when not in route planning mode and not showing route */}
        {!isRoutePlanningMode && !showRoute && (
          <TouchableOpacity
            style={styles.routePlanningButton}
            onPress={startRoutePlanning}
          >
            <LinearGradient
              colors={["#4285F4", "#34A853"]}
              style={styles.routePlanningGradient}
            >
              <FontAwesome5 name="route" size={18} color="#fff" />
              <Text style={styles.routePlanningText}>Plan Route</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Route planning indicator - with higher z-index */}
        {isRoutePlanningMode && (
          <View style={styles.routePlanningIndicator}>
            <Text style={styles.routePlanningIndicatorText}>
              {routePlanningStep === 1
                ? "Set starting point"
                : "Set destination"}
            </Text>
            <TouchableOpacity onPress={() => setIsRoutePlanningMode(false)}>
              <Entypo name="cross" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Route panel - when route is shown */}
        <RoutePanel />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeAreaContainer: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
    position: "relative",
  },
  header: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    borderRadius: 25,
    alignItems: "center",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  headerIcon: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
  },
  topControlsContainer: {
    zIndex: 20,
  },
  searchContainer: {
    padding: 15,
    backgroundColor: "#fff",
    elevation: 2,
    zIndex: 9,
  },
  activeSearchContainer: {
    zIndex: 20,
  },
  searchInput: {
    backgroundColor: "#f0f0f0",
    padding: 10,
    borderRadius: 10,
    fontSize: 16,
  },
  predictionsList: {
    position: "absolute",
    top: 60,
    left: 15,
    right: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    maxHeight: 200,
    zIndex: 20,
    elevation: 5,
  },
  predictionText: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  filterContainer: {
    paddingVertical: 10,
    backgroundColor: "#fff",
    elevation: 2,
    zIndex: 8,
  },
  filterButton: {
    marginHorizontal: 5,
    borderRadius: 25,
    overflow: "hidden",
  },
  filterGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    paddingHorizontal: 15,
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  activeFilterText: {
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    margin: 15,
    borderRadius: 15,
    overflow: "hidden",
    zIndex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    right: 10,
    top: 10,
    flexDirection: "column",
    zIndex: 5,
  },
  controlButton: {
    backgroundColor: "#4285F4",
    padding: 10,
    borderRadius: 25,
    marginVertical: 5,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 5,
    paddingBottom: 80, // Add padding at bottom for route planning button
  },
  carousel: {
    paddingLeft: 15,
    paddingBottom: 20,
  },
  customMarker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: "#4285F4",
  },
  calloutContainer: {
    padding: 10,
    width: 180,
  },
  calloutTitle: {
    fontWeight: "bold",
    fontSize: 16,
  },
  calloutSubtitle: {
    fontSize: 14,
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
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardOverlay: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 5,
  },
  cardInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardSubtitle: {
    color: "#fff",
    fontSize: 14,
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 5,
    borderRadius: 10,
  },
  ratingText: {
    color: "#fff",
    marginLeft: 5,
  },
  quickAction: {
    position: "absolute",
    right: 15,
    bottom: 15,
    backgroundColor: "#4285F4",
    padding: 10,
    borderRadius: 20,
  },
  destinationCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    margin: 15,
    marginTop: 0,
  },
  destinationCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  destinationCardSubtitle: {
    fontSize: 14,
    color: "#666",
    marginVertical: 5,
  },
  destinationCardActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  routePlanningButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 12,
    overflow: "hidden",
    zIndex: 10,
  },
  routePlanningGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  routePlanningText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 10,
  },
  routePlanningIndicator: {
    position: "absolute",
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 15,
    elevation: 5,
  },
  routePlanningIndicatorText: {
    color: "#fff",
    fontSize: 16,
  },
  routePanel: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 5,
    zIndex: 10,
  },
  routeHeader: {
    padding: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  closeRouteButton: {
    backgroundColor: "rgba(0,0,0,0.2)",
    borderRadius: 20,
    padding: 5,
  },
  routeDuration: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  routeDistance: {
    color: "#fff",
    fontSize: 16,
  },
  originMarker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#4CAF50",
  },
  destinationMarker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FF5722",
  },
  placeMarker: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: "#FF5722",
  },
  routeDetails: {
    padding: 15,
    backgroundColor: "#fff",
  },
  routeStep: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 5,
  },
  routeAddress: {
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  modeSelector: {
    marginTop: 10,
  },
  modeButton: {
    padding: 10,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
    marginRight: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  activeModeButton: {
    backgroundColor: "#4285F4",
  },
  modeText: {
    marginLeft: 5,
    color: "#666",
  },
  activeModeText: {
    color: "#fff",
  },
  startNavigation: {
    backgroundColor: "#34A853",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  startNavigationText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default Globe;
