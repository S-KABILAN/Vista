import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  FlatList,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  FontAwesome5,
  Entypo,
} from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import * as LocationService from "../services/LocationService";
import MapView, { Marker, Polyline } from "react-native-maps";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const ItineraryOptimizer = ({ route, navigation }) => {
  const { itinerary, destination } = route.params || {
    itinerary: [],
    destination: "Paris",
  };

  const [loading, setLoading] = useState(false);
  const [optimizingItinerary, setOptimizingItinerary] = useState(false);
  const [originalItinerary, setOriginalItinerary] = useState(itinerary);
  const [optimizedItinerary, setOptimizedItinerary] = useState(null);
  const [optimizationDetails, setOptimizationDetails] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [transportationType, setTransportationType] = useState("driving");
  const [error, setError] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    getLocationAsync();
  }, []);

  useEffect(() => {
    if (originalItinerary?.length > 0 && !optimizedItinerary) {
      optimizeItinerary();
    }
  }, [originalItinerary, userLocation]);

  const getLocationAsync = async () => {
    try {
      const location = await LocationService.getCurrentLocation();
      setUserLocation(location);
    } catch (error) {
      console.warn("Error getting location:", error);
      setUserLocation({
        latitude: 48.8566,
        longitude: 2.3522,
      });
    }
  };

  const optimizeItinerary = async () => {
    if (originalItinerary.length < 2) {
      Alert.alert(
        "Not Enough Places",
        "You need at least 2 places to optimize an itinerary."
      );
      return;
    }

    try {
      setOptimizingItinerary(true);
      setError(null);

      const response = await TravelPlanService.optimizeItinerary({
        itinerary: originalItinerary,
        startingPoint: userLocation
          ? {
              name: "Your Location",
              location: {
                lat: userLocation.latitude,
                lng: userLocation.longitude,
              },
            }
          : null,
        transportationType: transportationType,
      });

      console.log("Optimization response:", response);
      setOptimizedItinerary(response.optimizedItinerary);
      setOptimizationDetails(response.optimizationDetails);
      setOptimizingItinerary(false);
    } catch (error) {
      console.error("Error optimizing itinerary:", error);
      setError(error.toString());
      setOptimizingItinerary(false);
    }
  };

  const switchTransportationType = (type) => {
    setTransportationType(type);
    setTimeout(() => optimizeItinerary(), 100);
  };

  const getTransportationIcon = () => {
    switch (transportationType) {
      case "walking":
        return "walking";
      case "public":
        return "bus";
      case "driving":
      default:
        return "car";
    }
  };

  const renderOptimizedMap = () => {
    // If no optimized itinerary yet, don't render map
    if (!optimizedItinerary || optimizedItinerary.length === 0) return null;

    // Prepare coordinates for map
    const coordinates = optimizedItinerary.map((place) => ({
      latitude: parseFloat(place.location.lat),
      longitude: parseFloat(place.location.lng),
    }));

    // Include user location if available
    if (userLocation) {
      coordinates.unshift(userLocation);
    }

    // Calculate region to fit all markers
    const minLat = Math.min(...coordinates.map((c) => c.latitude));
    const maxLat = Math.max(...coordinates.map((c) => c.latitude));
    const minLng = Math.min(...coordinates.map((c) => c.longitude));
    const maxLng = Math.max(...coordinates.map((c) => c.longitude));

    const region = {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: (maxLat - minLat) * 1.5 + 0.02,
      longitudeDelta: (maxLng - minLng) * 1.5 + 0.02,
    };

    return (
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={region}
          onMapReady={() => setMapReady(true)}
          mapType="standard"
        >
          {/* User's location */}
          {userLocation && (
            <Marker
              coordinate={userLocation}
              pinColor="#4285F4"
              title="Your Location"
              description="Starting Point"
            >
              <View style={styles.userLocationMarker}>
                <FontAwesome5 name="map-marker-alt" size={24} color="#4285F4" />
              </View>
            </Marker>
          )}

          {/* Destination markers */}
          {optimizedItinerary.map((place, index) => (
            <Marker
              key={`marker-${index}`}
              coordinate={{
                latitude: parseFloat(place.location.lat),
                longitude: parseFloat(place.location.lng),
              }}
              title={`${index + 1}. ${place.name}`}
              description={place.travelTime || ""}
            >
              <View style={styles.markerContainer}>
                <View style={styles.markerBubble}>
                  <Text style={styles.markerNumber}>{index + 1}</Text>
                </View>
              </View>
            </Marker>
          ))}

          {/* Polyline connecting all points */}
          {mapReady && (
            <Polyline
              coordinates={coordinates}
              strokeWidth={3}
              strokeColor="#4c669f"
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      </View>
    );
  };

  const renderTransportationSelector = () => (
    <View style={styles.transportSelector}>
      <TouchableOpacity
        style={[
          styles.transportOption,
          transportationType === "driving" && styles.transportOptionActive,
        ]}
        onPress={() => switchTransportationType("driving")}
      >
        <FontAwesome5
          name="car"
          size={16}
          color={transportationType === "driving" ? "#fff" : "#555"}
        />
        <Text
          style={[
            styles.transportText,
            transportationType === "driving" && styles.transportTextActive,
          ]}
        >
          Driving
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.transportOption,
          transportationType === "walking" && styles.transportOptionActive,
        ]}
        onPress={() => switchTransportationType("walking")}
      >
        <FontAwesome5
          name="walking"
          size={16}
          color={transportationType === "walking" ? "#fff" : "#555"}
        />
        <Text
          style={[
            styles.transportText,
            transportationType === "walking" && styles.transportTextActive,
          ]}
        >
          Walking
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.transportOption,
          transportationType === "public" && styles.transportOptionActive,
        ]}
        onPress={() => switchTransportationType("public")}
      >
        <FontAwesome5
          name="bus"
          size={16}
          color={transportationType === "public" ? "#fff" : "#555"}
        />
        <Text
          style={[
            styles.transportText,
            transportationType === "public" && styles.transportTextActive,
          ]}
        >
          Public
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderOptimizationDetails = () => {
    if (!optimizationDetails) return null;

    return (
      <View style={styles.optimizationDetailsCard}>
        <View style={styles.optimizationHeader}>
          <FontAwesome5 name="route" size={18} color="#4c669f" />
          <Text style={styles.optimizationTitle}>Optimization Details</Text>
        </View>

        <View style={styles.optimizationStats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Total Distance</Text>
            <Text style={styles.statValue}>
              {optimizationDetails.totalDistance.toFixed(1)} km
            </Text>
          </View>

          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Estimated Time</Text>
            <Text style={styles.statValue}>
              {calculateTotalTime(optimizationDetails.travelTimes)}
            </Text>
          </View>
        </View>

        <Text style={styles.optimizationExplanation}>
          {optimizationDetails.explanation}
        </Text>
      </View>
    );
  };

  const calculateTotalTime = (travelTimes) => {
    if (!travelTimes || !travelTimes.length) return "N/A";

    let totalMinutes = 0;
    travelTimes.forEach((item) => {
      const timeStr = item.time;
      const minutes = parseInt(timeStr.match(/\d+/)[0]);
      totalMinutes += minutes;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours > 0) {
      return `${hours} hr ${minutes} min`;
    } else {
      return `${minutes} min`;
    }
  };

  const renderItinerary = () => {
    if (!optimizedItinerary) return null;

    return (
      <View style={styles.itineraryContainer}>
        <Text style={styles.itineraryTitle}>Optimized Itinerary</Text>

        <FlatList
          data={optimizedItinerary}
          keyExtractor={(item, index) => `place-${index}`}
          renderItem={({ item, index }) => (
            <View style={styles.itineraryItem}>
              <View style={styles.itemNumberContainer}>
                <Text style={styles.itemNumber}>{index + 1}</Text>
              </View>

              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                {item.address && (
                  <Text style={styles.itemAddress}>{item.address}</Text>
                )}

                {index > 0 && item.travelTime && (
                  <View style={styles.travelTimeContainer}>
                    <FontAwesome5
                      name={getTransportationIcon()}
                      size={12}
                      color="#777"
                    />
                    <Text style={styles.travelTime}>
                      {item.travelTime} from previous location
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.itineraryList}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" color="#4c669f" />
        <Text style={styles.loadingText}>Loading itinerary...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Optimize Your Route</Text>
      </View>

      {optimizingItinerary ? (
        <View style={styles.optimizingContainer}>
          <ActivityIndicator size="large" color="#4c669f" />
          <Text style={styles.optimizingText}>
            Optimizing your itinerary...
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {renderTransportationSelector()}
          {renderOptimizedMap()}
          {renderOptimizationDetails()}
          {renderItinerary()}

          <TouchableOpacity
            style={styles.saveButton}
            onPress={() =>
              navigation.navigate("AITravelPlanner", {
                optimizedItinerary: optimizedItinerary,
              })
            }
          >
            <Text style={styles.saveButtonText}>Use This Optimized Plan</Text>
          </TouchableOpacity>
        </ScrollView>
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
  },
  optimizingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  optimizingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  transportSelector: {
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  transportOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },
  transportOptionActive: {
    backgroundColor: "#4c669f",
  },
  transportText: {
    marginLeft: 8,
    color: "#555",
  },
  transportTextActive: {
    color: "#fff",
  },
  mapContainer: {
    height: 250,
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
  },
  userLocationMarker: {
    alignItems: "center",
  },
  markerContainer: {
    alignItems: "center",
  },
  markerBubble: {
    backgroundColor: "#4c669f",
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  markerNumber: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  optimizationDetailsCard: {
    margin: 16,
    padding: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  optimizationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  optimizationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  optimizationStats: {
    flexDirection: "row",
    marginBottom: 12,
    padding: 12,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#777",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginTop: 4,
  },
  optimizationExplanation: {
    color: "#555",
    lineHeight: 20,
  },
  itineraryContainer: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itineraryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  itineraryList: {
    paddingBottom: 8,
  },
  itineraryItem: {
    flexDirection: "row",
    marginBottom: 16,
  },
  itemNumberContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#4c669f",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemNumber: {
    color: "#fff",
    fontWeight: "bold",
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  itemAddress: {
    fontSize: 14,
    color: "#777",
    marginTop: 2,
  },
  travelTimeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  travelTime: {
    marginLeft: 6,
    fontSize: 12,
    color: "#777",
  },
  saveButton: {
    margin: 16,
    padding: 16,
    backgroundColor: "#4c669f",
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});

export default ItineraryOptimizer;
