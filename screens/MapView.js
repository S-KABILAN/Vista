import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Animated,
  Image,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
  Callout,
} from "react-native-maps";
import {
  AntDesign,
  MaterialIcons,
  FontAwesome5,
  Ionicons,
} from "@expo/vector-icons";
import * as Location from "expo-location";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.01;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapViewScreen = ({ navigation, route }) => {
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  });
  const [marker, setMarker] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mapType, setMapType] = useState("standard");
  const [showTraffic, setShowTraffic] = useState(false);
  const [routeCoordinates, setRouteCoordinates] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);

  const mapRef = useRef(null);
  const calloutOpacity = useRef(new Animated.Value(0)).current;
  const panelY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    initialize();
  }, []);

  const initialize = async () => {
    const location = route?.params?.location || null;

    if (location) {
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      setMarker({
        coordinate: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
        title: location.name || "Destination",
        description: location.address || "",
      });

      // Get weather data for the destination
      fetchWeatherData(location.latitude, location.longitude);

      // Get nearby places
      fetchNearbyPlaces(location.latitude, location.longitude);

      setLoading(false);

      // Animate panel
      Animated.timing(panelY, {
        toValue: height - 200,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } else {
      getUserLocation();
    }
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setError("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Get address from coordinates
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      let address = "Current Location";
      if (addresses[0]) {
        const { street, city, region: regionName, country } = addresses[0];
        address = `${street ? street + ", " : ""}${city ? city + ", " : ""}${
          regionName ? regionName : ""
        }${country ? ", " + country : ""}`;
      }

      setRegion({
        latitude,
        longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      });

      setMarker({
        coordinate: {
          latitude,
          longitude,
        },
        title: "Your Location",
        description: address,
      });

      // Get weather data for current location
      fetchWeatherData(latitude, longitude);

      // Get nearby places
      fetchNearbyPlaces(latitude, longitude);

      setLoading(false);

      // Animate panel
      Animated.timing(panelY, {
        toValue: height - 200,
        duration: 500,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Error getting location:", error);
      setError("Could not get your location");
      setLoading(false);
    }
  };

  const fetchWeatherData = async (latitude, longitude) => {
    try {
      // Replace with your actual weather API key
      const apiKey = "YOUR_WEATHER_API_KEY";
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`
      );
      const data = await response.json();
      setWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const fetchNearbyPlaces = async (latitude, longitude) => {
    try {
      // Replace with your actual Google Places API key
      const apiKey = "YOUR_GOOGLE_API_KEY";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=1500&type=tourist_attraction&key=${apiKey}`
      );
      const data = await response.json();

      if (data.results) {
        const places = data.results.slice(0, 5).map((place) => ({
          id: place.place_id,
          name: place.name,
          coordinates: {
            latitude: place.geometry.location.lat,
            longitude: place.geometry.location.lng,
          },
          vicinity: place.vicinity,
          rating: place.rating,
          type: place.types[0],
        }));

        setNearbyPlaces(places);
      }
    } catch (error) {
      console.error("Error fetching nearby places:", error);
    }
  };

  const toggleMapType = () => {
    setMapType((prevType) =>
      prevType === "standard" ? "satellite" : "standard"
    );
  };

  const getDirections = async () => {
    if (!marker || !mapRef.current) return;

    try {
      // Get user's current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      // Replace with your actual Google Directions API key
      const apiKey = "YOUR_GOOGLE_API_KEY";
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${latitude},${longitude}&destination=${marker.coordinate.latitude},${marker.coordinate.longitude}&mode=driving&key=${apiKey}`
      );

      const data = await response.json();

      if (data.routes.length > 0) {
        const route = data.routes[0];
        const points = decodePolyline(route.overview_polyline.points);
        setRouteCoordinates(points);

        // Get route information
        const distance = route.legs[0].distance.text;
        const duration = route.legs[0].duration.text;
        setRouteInfo({ distance, duration });

        // Fit map to route
        const coordinates = [
          { latitude, longitude },
          {
            latitude: marker.coordinate.latitude,
            longitude: marker.coordinate.longitude,
          },
        ];

        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 100, bottom: 100, left: 100 },
          animated: true,
        });
      }
    } catch (error) {
      console.error("Error getting directions:", error);
    }
  };

  const decodePolyline = (encoded) => {
    let index = 0,
      lat = 0,
      lng = 0,
      coordinates = [];
    const len = encoded.length;

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

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }
    return coordinates;
  };

  const clearRoute = () => {
    setRouteCoordinates(null);
    setRouteInfo(null);
  };

  const showMarkerCallout = () => {
    Animated.timing(calloutOpacity, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const renderNearbyPlaces = () => {
    return nearbyPlaces.map((place) => (
      <Marker
        key={place.id}
        coordinate={place.coordinates}
        title={place.name}
        description={place.vicinity}
      >
        <View style={styles.placeMarker}>
          <FontAwesome5 name="map-marker-alt" size={22} color="#FF5722" />
        </View>
      </Marker>
    ));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <AntDesign name="exclamationcircleo" size={48} color="#E53935" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={region}
        region={region}
        mapType={mapType}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={true}
        showsTraffic={showTraffic}
        onRegionChangeComplete={setRegion}
      >
        {marker && (
          <Marker
            coordinate={marker.coordinate}
            title={marker.title}
            description={marker.description}
            onPress={showMarkerCallout}
          >
            <View style={styles.markerContainer}>
              <View style={styles.markerIconContainer}>
                <FontAwesome5 name="map-pin" size={26} color="#4285F4" />
              </View>
              <View style={styles.markerDot} />
            </View>
            <Callout tooltip>
              <Animated.View
                style={[styles.calloutContainer, { opacity: calloutOpacity }]}
              >
                <Text style={styles.calloutTitle}>{marker.title}</Text>
                <Text style={styles.calloutDescription}>
                  {marker.description}
                </Text>
              </Animated.View>
            </Callout>
          </Marker>
        )}

        {renderNearbyPlaces()}

        {routeCoordinates && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#4285F4"
            lineDashPattern={[0]}
          />
        )}
      </MapView>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{marker?.title || "Map View"}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setShowTraffic(!showTraffic)}
          >
            <MaterialIcons
              name="traffic"
              size={24}
              color={showTraffic ? "#4285F4" : "#333"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={() => getUserLocation()}
        >
          <MaterialIcons name="my-location" size={24} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapControlButton}
          onPress={toggleMapType}
        >
          <MaterialIcons
            name={mapType === "standard" ? "satellite" : "map"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Route Info Bar */}
      {routeInfo && (
        <View style={styles.routeInfoBar}>
          <View style={styles.routeInfoContent}>
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="timeline" size={20} color="#4285F4" />
              <Text style={styles.routeInfoText}>{routeInfo.distance}</Text>
            </View>
            <View style={styles.routeInfoItem}>
              <MaterialIcons name="access-time" size={20} color="#4285F4" />
              <Text style={styles.routeInfoText}>{routeInfo.duration}</Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.clearRouteButton}
            onPress={clearRoute}
          >
            <MaterialIcons name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Info Panel */}
      <Animated.View
        style={[styles.infoPanel, { transform: [{ translateY: panelY }] }]}
      >
        <View style={styles.panelHandle} />

        <View style={styles.panelContent}>
          <Text style={styles.panelTitle}>{marker?.title}</Text>
          <Text style={styles.panelSubtitle}>{marker?.description}</Text>

          {weatherData && (
            <View style={styles.weatherContainer}>
              <View style={styles.weatherInfo}>
                <Image
                  source={{
                    uri: `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`,
                  }}
                  style={styles.weatherIcon}
                />
                <Text style={styles.weatherText}>
                  {Math.round(weatherData.main.temp)}°C,{" "}
                  {weatherData.weather[0].main}
                </Text>
              </View>
              <View style={styles.weatherInfo}>
                <FontAwesome5 name="wind" size={16} color="#666" />
                <Text style={styles.weatherText}>
                  {Math.round(weatherData.wind.speed)} m/s
                </Text>
              </View>
              <View style={styles.weatherInfo}>
                <Ionicons name="water-outline" size={16} color="#666" />
                <Text style={styles.weatherText}>
                  {weatherData.main.humidity}%
                </Text>
              </View>
            </View>
          )}

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={getDirections}
            >
              <LinearGradient
                colors={["#4285F4", "#34A853"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="directions" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Directions</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton} onPress={() => {}}>
              <LinearGradient
                colors={["#FBBC05", "#EA4335"]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <MaterialIcons name="share" size={20} color="#FFF" />
                <Text style={styles.buttonText}>Share</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {nearbyPlaces.length > 0 && (
            <View style={styles.nearbySection}>
              <Text style={styles.nearbySectionTitle}>Nearby Places</Text>
              {nearbyPlaces.slice(0, 3).map((place) => (
                <TouchableOpacity
                  key={place.id}
                  style={styles.nearbyPlace}
                  onPress={() => {
                    setMarker({
                      coordinate: place.coordinates,
                      title: place.name,
                      description: place.vicinity,
                    });

                    // Animate to the selected place
                    mapRef.current.animateToRegion(
                      {
                        latitude: place.coordinates.latitude,
                        longitude: place.coordinates.longitude,
                        latitudeDelta: LATITUDE_DELTA,
                        longitudeDelta: LONGITUDE_DELTA,
                      },
                      1000
                    );
                  }}
                >
                  <FontAwesome5
                    name="map-marker-alt"
                    size={16}
                    color="#FF5722"
                  />
                  <View style={styles.nearbyPlaceInfo}>
                    <Text style={styles.nearbyPlaceName}>{place.name}</Text>
                    <Text style={styles.nearbyPlaceVicinity}>
                      {place.vicinity}
                    </Text>
                  </View>
                  {place.rating && (
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FBBC05" />
                      <Text style={styles.ratingText}>{place.rating}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    zIndex: 10,
    position: "absolute",
    top: StatusBar.currentHeight || 0,
    left: 0,
    right: 0,
    height: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    textAlign: "center",
  },
  headerRight: {
    flexDirection: "row",
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F7FA",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: (StatusBar.currentHeight || 0) + 70,
    backgroundColor: "transparent",
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeInfoBar: {
    position: "absolute",
    top: (StatusBar.currentHeight || 0) + 70,
    left: 16,
    right: 70,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    flexDirection: "row",
    overflow: "hidden",
  },
  routeInfoContent: {
    flex: 1,
    flexDirection: "row",
    padding: 12,
  },
  routeInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
  },
  routeInfoText: {
    marginLeft: 5,
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },
  clearRouteButton: {
    backgroundColor: "#4285F4",
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  infoPanel: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
    height: 400,
  },
  panelHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
  },
  panelContent: {
    padding: 20,
  },
  panelTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  panelSubtitle: {
    fontSize: 16,
    color: "#757575",
    marginBottom: 15,
  },
  weatherContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  weatherInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  weatherIcon: {
    width: 30,
    height: 30,
    marginRight: 5,
  },
  weatherText: {
    fontSize: 14,
    color: "#666",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  buttonText: {
    color: "#FFF",
    fontWeight: "600",
    fontSize: 16,
    marginLeft: 8,
  },
  nearbySection: {
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  nearbySectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 15,
  },
  nearbyPlace: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  nearbyPlaceInfo: {
    flex: 1,
    marginLeft: 10,
  },
  nearbyPlaceName: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
  },
  nearbyPlaceVicinity: {
    fontSize: 13,
    color: "#757575",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF9E6",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    color: "#333",
    marginLeft: 3,
    fontWeight: "600",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(66, 133, 244, 0.3)",
    borderWidth: 2,
    borderColor: "#4285F4",
    position: "absolute",
    bottom: -6,
  },
  calloutContainer: {
    width: 200,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#333",
  },
  calloutDescription: {
    fontSize: 12,
    color: "#757575",
  },
  placeMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
    marginBottom: 20,
  },
  backButtonText: {
    color: "#4285F4",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default MapViewScreen;
