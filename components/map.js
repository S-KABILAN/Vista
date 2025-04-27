import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import MapView, {
  Marker,
  PROVIDER_GOOGLE,
  Callout,
  Polyline,
} from "react-native-maps";
import { MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as Location from "expo-location";

export default function Map() {
  const [places, setPlaces] = useState([]);
  const [region, setRegion] = useState({
    latitude: 10.8505, // Default latitude
    longitude: 106.8283, // Default longitude
    latitudeDelta: 40,
    longitudeDelta: 40,
  });
  const [userLocation, setUserLocation] = useState(null);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [mapType, setMapType] = useState("standard");
  const [showTraffic, setShowTraffic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [route, setRoute] = useState(null);

  const mapRef = useRef(null);

  useEffect(() => {
    fetchPlaces();
    getUserLocation();
  }, []);

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.error("Permission to access location was denied");
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;

      setUserLocation({
        latitude,
        longitude,
      });

      // Center map on user location
      setRegion({
        latitude,
        longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      });

      setLoading(false);
    } catch (error) {
      console.error("Error getting location:", error);
      setLoading(false);
    }
  };

  const fetchPlaces = async () => {
    try {
      setLoading(true);
      // Updated to use environment variable or fallback
      const apiUrl = process.env.API_URL || "http://192.168.1.53:3001";
      const response = await fetch(`${apiUrl}/api/places`);
      const data = await response.json();
      setPlaces(data);

      // Adjust region based on fetched places' coordinates if no user location
      if (data.length > 0 && !userLocation) {
        const latitudes = data.map((place) => parseFloat(place.latitude));
        const longitudes = data.map((place) => parseFloat(place.longitude));

        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLon = Math.min(...longitudes);
        const maxLon = Math.max(...longitudes);

        const latitudeDelta = Math.max(0.1, maxLat - minLat);
        const longitudeDelta = Math.max(0.1, maxLon - minLon);

        setRegion({
          latitude: (maxLat + minLat) / 2,
          longitude: (maxLon + minLon) / 2,
          latitudeDelta: latitudeDelta + 0.1,
          longitudeDelta: longitudeDelta + 0.1,
        });
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching places:", error);
      setLoading(false);
    }
  };

  const toggleMapType = () => {
    setMapType((prevType) =>
      prevType === "standard" ? "satellite" : "standard"
    );
  };

  const goToUserLocation = () => {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  };

  const handleMarkerPress = (place) => {
    setSelectedPlace(place);

    // Animate to the selected place
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: parseFloat(place.latitude),
          longitude: parseFloat(place.longitude),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        },
        1000
      );
    }
  };

  const getRouteBetweenPoints = async (startLat, startLng, endLat, endLng) => {
    try {
      const apiKey = "YOUR_GOOGLE_API_KEY"; // Replace with actual API key or use environment variable
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${startLat},${startLng}&destination=${endLat},${endLng}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.routes.length > 0) {
        const points = decodePolyline(data.routes[0].overview_polyline.points);
        setRoute(points);
      }
    } catch (error) {
      console.error("Error getting route:", error);
    }
  };

  const decodePolyline = (encoded) => {
    // This is a common algorithm to decode Google's polyline format
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

  const getDirectionsToPlace = () => {
    if (userLocation && selectedPlace) {
      getRouteBetweenPoints(
        userLocation.latitude,
        userLocation.longitude,
        parseFloat(selectedPlace.latitude),
        parseFloat(selectedPlace.longitude)
      );
    }
  };

  const clearRoute = () => {
    setRoute(null);
    setSelectedPlace(null);
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading map...</Text>
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            region={region}
            onRegionChangeComplete={setRegion}
            mapType={mapType}
            showsUserLocation={true}
            showsMyLocationButton={false}
            showsCompass={true}
            showsTraffic={showTraffic}
            customMapStyle={customMapStyle}
          >
            {places.map((place) => (
              <Marker
                key={place._id}
                coordinate={{
                  latitude: parseFloat(place.latitude),
                  longitude: parseFloat(place.longitude),
                }}
                title={place.place}
                description={place.description || "A beautiful destination"}
                onPress={() => handleMarkerPress(place)}
              >
                <View style={styles.markerContainer}>
                  <View style={styles.markerIcon}>
                    <FontAwesome5
                      name="map-marker-alt"
                      size={24}
                      color="#FF385C"
                    />
                  </View>
                  {selectedPlace && selectedPlace._id === place._id && (
                    <View style={styles.selectedMarker} />
                  )}
                </View>
                <Callout tooltip>
                  <View style={styles.calloutContainer}>
                    <Text style={styles.calloutTitle}>{place.place}</Text>
                    <Text style={styles.calloutDescription}>
                      {place.description || "A beautiful destination"}
                    </Text>
                  </View>
                </Callout>
              </Marker>
            ))}

            {route && (
              <Polyline
                coordinates={route}
                strokeWidth={4}
                strokeColor="#4285F4"
                lineDashPattern={[0]}
              />
            )}
          </MapView>

          {/* Map controls */}
          <View style={styles.mapControls}>
            <TouchableOpacity
              style={styles.controlButton}
              onPress={goToUserLocation}
            >
              <MaterialIcons name="my-location" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={toggleMapType}
            >
              <MaterialIcons name="layers" size={24} color="#FFF" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.controlButton}
              onPress={() => setShowTraffic(!showTraffic)}
            >
              <MaterialIcons
                name="traffic"
                size={24}
                color={showTraffic ? "#34A853" : "#FFF"}
              />
            </TouchableOpacity>
          </View>

          {/* Place information */}
          {selectedPlace && (
            <View style={styles.placeInfoContainer}>
              <View style={styles.placeInfo}>
                <Text style={styles.placeTitle}>{selectedPlace.place}</Text>
                <Text style={styles.placeDescription}>
                  {selectedPlace.description || "A beautiful destination"}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={getDirectionsToPlace}
                  >
                    <MaterialIcons name="directions" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#34A853" },
                    ]}
                    onPress={() => {}}
                  >
                    <MaterialIcons name="bookmark" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Save</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionButton,
                      { backgroundColor: "#FBBC05" },
                    ]}
                    onPress={() => setSelectedPlace(null)}
                  >
                    <MaterialIcons name="close" size={20} color="#FFF" />
                    <Text style={styles.actionButtonText}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Route information */}
          {route && (
            <View style={styles.routeInfoContainer}>
              <View style={styles.routeInfo}>
                <Text style={styles.routeTitle}>
                  Route to {selectedPlace?.place}
                </Text>

                <TouchableOpacity
                  style={styles.clearRouteButton}
                  onPress={clearRoute}
                >
                  <MaterialIcons name="close" size={20} color="#FFF" />
                  <Text style={styles.clearRouteText}>Clear Route</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// Create our styling code:
const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    right: 16,
    top: Platform.OS === "ios" ? 60 : 40,
    backgroundColor: "transparent",
  },
  controlButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
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
  markerContainer: {
    alignItems: "center",
  },
  markerIcon: {
    padding: 5,
  },
  selectedMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(66, 133, 244, 0.3)",
    borderWidth: 2,
    borderColor: "#4285F4",
    position: "absolute",
    bottom: -8,
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
  placeInfoContainer: {
    position: "absolute",
    bottom: 20,
    left: 10,
    right: 10,
    backgroundColor: "transparent",
  },
  placeInfo: {
    backgroundColor: "#FFF",
    borderRadius: 15,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  placeTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  placeDescription: {
    fontSize: 14,
    color: "#757575",
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    flex: 1,
    marginHorizontal: 5,
    justifyContent: "center",
  },
  actionButtonText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 5,
  },
  routeInfoContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 60 : 40,
    left: 10,
    right: 80,
    backgroundColor: "transparent",
  },
  routeInfo: {
    backgroundColor: "#4285F4",
    borderRadius: 10,
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFF",
    flex: 1,
  },
  clearRouteButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 15,
  },
  clearRouteText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 3,
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
});

const customMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "on" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#f5f5f5" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#bdbdbd" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels.text.fill",
    stylers: [{ color: "#757575" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#dadada" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#616161" }],
  },
  {
    featureType: "road.local",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#e5e5e5" }],
  },
  {
    featureType: "transit.station",
    elementType: "geometry",
    stylers: [{ color: "#eeeeee" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c9c9c9" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
];
