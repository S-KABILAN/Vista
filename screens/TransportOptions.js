import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  AntDesign,
  FontAwesome5,
  MaterialIcons,
  Ionicons,
} from "@expo/vector-icons";
import * as FlightService from "../services/FlightService";
import * as LocationService from "../services/LocationService";
import FlightCard from "../components/FlightCard";
import { format } from "date-fns";
import * as TransportService from "../services/TransportService";

const TransportOptions = ({ route, navigation }) => {
  const { origin, destination, departureDate: userDate } = route.params;
  const [loading, setLoading] = useState(true);
  const [flights, setFlights] = useState([]);
  const [originAddress, setOriginAddress] = useState(null);
  const [destinationAddress, setDestinationAddress] = useState(null);
  const [selectedTransport, setSelectedTransport] = useState("flight");
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [drivingInfo, setDrivingInfo] = useState(null);
  const [error, setError] = useState(null);
  const [flightOptions, setFlightOptions] = useState([]);
  const [trainOptions, setTrainOptions] = useState([]);
  const [busOptions, setBusOptions] = useState([]);
  const [drivingOption, setDrivingOption] = useState(null);
  const [activeTransportType, setActiveTransportType] = useState("flights"); // Default tab

  // Format departure date for API
  const departureDate = userDate
    ? format(new Date(userDate), "yyyy-MM-dd")
    : format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    const loadTransportOptions = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get addresses from coordinates
        if (origin) {
          const address = await LocationService.getAddressFromCoordinates(
            origin.latitude,
            origin.longitude
          );
          setOriginAddress(address);
        }

        if (destination) {
          const address = await LocationService.getAddressFromCoordinates(
            destination.latitude,
            destination.longitude
          );
          setDestinationAddress(address);

          // Calculate driving info
          const distance = calculateDistance(
            origin.latitude,
            origin.longitude,
            destination.latitude,
            destination.longitude
          );

          setDrivingInfo({
            distance: Math.round(distance),
            duration: Math.round((distance / 80) * 60), // Rough estimate: 80 km/h average speed
            cost: Math.round(distance * 0.15 * 100) / 100, // $0.15 per km
          });
        }

        // Get the city code for origin and destination
        const originCity = originAddress?.city || "New York";
        const destCity =
          destinationAddress?.city || destination?.name || "Los Angeles";

        const [originData, destData] = await Promise.all([
          FlightService.getCityCode(originCity),
          FlightService.getCityCode(destCity),
        ]);

        if (originData?.cityCode && destData?.cityCode) {
          // Search for flights
          const flightResults = await FlightService.searchFlights({
            originCode: originData.cityCode,
            destinationCode: destData.cityCode,
            departureDate,
            adults: 1,
          });

          setFlights(flightResults.flights || []);
        } else {
          setError("Could not find airport codes for the selected cities.");

          // Generate mock flights for demo if API call fails
          generateMockFlights(originCity, destCity);
        }

        // Fetch all transportation options
        fetchTransportationOptions();
      } catch (err) {
        console.error("Error loading transport options:", err);
        setError(err.message || "Error fetching transportation options");

        // Generate mock flights for demo if API call fails
        generateMockFlights(
          originAddress?.city || "New York",
          destinationAddress?.city || destination?.name || "Los Angeles"
        );
      } finally {
        setLoading(false);
      }
    };

    loadTransportOptions();
  }, [origin, destination]);

  const fetchTransportationOptions = async () => {
    setLoading(true);
    try {
      // Fetch flights using Amadeus API
      const flights = await TransportService.getFlightOptions(
        origin,
        destination
      );
      setFlightOptions(flights);

      // Fetch train options if available in your API
      const trains = await TransportService.getTrainOptions(
        origin,
        destination
      );
      setTrainOptions(trains);

      // Fetch bus options if available
      const buses = await TransportService.getBusOptions(origin, destination);
      setBusOptions(buses);

      // Calculate driving route
      const driving = await TransportService.getDrivingRoute(
        origin,
        destination
      );
      setDrivingOption(driving);
    } catch (error) {
      console.error("Error fetching transportation options:", error);
      Alert.alert(
        "Error",
        "Failed to load some transportation options. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // Generate mock flights for demo purposes if the API fails
  const generateMockFlights = (originCity, destCity) => {
    const mockFlights = [
      {
        id: "1",
        airline: "AA",
        price: "450.00",
        currency: "USD",
        departureTime: new Date(departureDate + "T08:30:00").toISOString(),
        arrivalTime: new Date(departureDate + "T11:45:00").toISOString(),
        duration: "PT3H15M",
        stops: 0,
        segments: [
          {
            departureAirport: originCity.substring(0, 3).toUpperCase(),
            departureTime: new Date(departureDate + "T08:30:00").toISOString(),
            arrivalAirport: destCity.substring(0, 3).toUpperCase(),
            arrivalTime: new Date(departureDate + "T11:45:00").toISOString(),
            flightNumber: "AA 123",
            duration: "PT3H15M",
          },
        ],
      },
      {
        id: "2",
        airline: "DL",
        price: "390.00",
        currency: "USD",
        departureTime: new Date(departureDate + "T10:15:00").toISOString(),
        arrivalTime: new Date(departureDate + "T14:20:00").toISOString(),
        duration: "PT4H5M",
        stops: 1,
        segments: [
          {
            departureAirport: originCity.substring(0, 3).toUpperCase(),
            departureTime: new Date(departureDate + "T10:15:00").toISOString(),
            arrivalAirport: "ATL",
            arrivalTime: new Date(departureDate + "T12:30:00").toISOString(),
            flightNumber: "DL 456",
            duration: "PT2H15M",
          },
          {
            departureAirport: "ATL",
            departureTime: new Date(departureDate + "T13:00:00").toISOString(),
            arrivalAirport: destCity.substring(0, 3).toUpperCase(),
            arrivalTime: new Date(departureDate + "T14:20:00").toISOString(),
            flightNumber: "DL 789",
            duration: "PT1H20M",
          },
        ],
      },
    ];

    setFlights(mockFlights);
  };

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

  const handleSelectFlight = (flight) => {
    setSelectedFlight(flight);
  };

  const handleGoToGlobe = () => {
    // Navigate to MapView instead of Globe tab
    if (!destination || !destination.latitude || !destination.longitude) {
      Alert.alert(
        "Navigation Error",
        "Could not get directions to this location. Please try again."
      );
      return;
    }

    // Navigate to the MapView screen
    navigation.navigate("MapView", {
      location: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        name: destinationAddress?.city || destination?.name || "Destination",
        address: destinationAddress?.fullAddress,
      },
    });
  };

  const handleContinue = () => {
    let transportDetails;

    // Determine which transport is selected and get the corresponding details
    if (activeTransportType === "flights") {
      if (!selectedFlight) {
        Alert.alert("Select a Flight", "Please select a flight to continue.");
        return;
      }
      transportDetails = selectedFlight;
    } else if (activeTransportType === "trains") {
      // For train, we would need a selected train
      // This is a simplified example
      transportDetails = trainOptions[0];
    } else if (activeTransportType === "buses") {
      // For bus, we would need a selected bus
      // This is a simplified example
      transportDetails = busOptions[0];
    } else if (activeTransportType === "driving") {
      transportDetails = drivingOption || drivingInfo;
    } else {
      Alert.alert("Select Transport", "Please select a transportation option.");
      return;
    }

    // Return to AITravelPlanner with selected transportation info
    navigation.navigate("MainTabs", {
      screen: "AITravelPlanner",
      params: {
        transportSelected: true,
        transportType:
          activeTransportType === "flights" ? "flight" : activeTransportType,
        transportDetails: transportDetails,
      },
    });
  };

  const renderTransportTabs = () => (
    <View style={styles.tabContainer}>
      <TouchableOpacity
        style={[
          styles.tab,
          activeTransportType === "flights" && styles.activeTab,
        ]}
        onPress={() => setActiveTransportType("flights")}
      >
        <Ionicons
          name="airplane"
          size={20}
          color={activeTransportType === "flights" ? "#3498db" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTransportType === "flights" && styles.activeTabText,
          ]}
        >
          Flights
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTransportType === "trains" && styles.activeTab,
        ]}
        onPress={() => setActiveTransportType("trains")}
      >
        <Ionicons
          name="train"
          size={20}
          color={activeTransportType === "trains" ? "#3498db" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTransportType === "trains" && styles.activeTabText,
          ]}
        >
          Trains
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTransportType === "buses" && styles.activeTab,
        ]}
        onPress={() => setActiveTransportType("buses")}
      >
        <Ionicons
          name="bus"
          size={20}
          color={activeTransportType === "buses" ? "#3498db" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTransportType === "buses" && styles.activeTabText,
          ]}
        >
          Buses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.tab,
          activeTransportType === "driving" && styles.activeTab,
        ]}
        onPress={() => setActiveTransportType("driving")}
      >
        <Ionicons
          name="car"
          size={20}
          color={activeTransportType === "driving" ? "#3498db" : "#666"}
        />
        <Text
          style={[
            styles.tabText,
            activeTransportType === "driving" && styles.activeTabText,
          ]}
        >
          Driving
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderFlightOptions = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Loading flight options...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color="#FF5722" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      );
    }

    if (flights.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="flight-takeoff" size={48} color="#BDBDBD" />
          <Text style={styles.emptyText}>No flights found for this route</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={flights}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <FlightCard
            flight={item}
            onSelect={handleSelectFlight}
            isSelected={selectedFlight?.id === item.id}
          />
        )}
        contentContainerStyle={styles.flightList}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderDrivingOption = () => {
    if (!drivingInfo) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4285F4" />
          <Text style={styles.loadingText}>Calculating route...</Text>
        </View>
      );
    }

    return (
      <View style={styles.drivingContainer}>
        <View style={styles.drivingCard}>
          <View style={styles.drivingHeader}>
            <FontAwesome5 name="car" size={24} color="#4285F4" />
            <Text style={styles.drivingTitle}>Driving Route</Text>
          </View>

          <View style={styles.drivingDetails}>
            <View style={styles.drivingDetail}>
              <FontAwesome5 name="road" size={18} color="#757575" />
              <Text style={styles.drivingDetailText}>
                Distance: {drivingInfo.distance} km
              </Text>
            </View>

            <View style={styles.drivingDetail}>
              <FontAwesome5 name="clock" size={18} color="#757575" />
              <Text style={styles.drivingDetailText}>
                Duration: ~{Math.floor(drivingInfo.duration / 60)}h{" "}
                {drivingInfo.duration % 60}m
              </Text>
            </View>

            <View style={styles.drivingDetail}>
              <FontAwesome5 name="gas-pump" size={18} color="#757575" />
              <Text style={styles.drivingDetailText}>
                Estimated Cost: ${drivingInfo.cost.toFixed(2)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.viewRouteButton}
            onPress={handleGoToGlobe}
          >
            <Text style={styles.viewRouteButtonText}>View on Map</Text>
            <MaterialIcons name="map" size={18} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.drivingInfoCard}>
          <MaterialIcons name="info-outline" size={20} color="#4285F4" />
          <Text style={styles.drivingInfoText}>
            This is an estimated route. Actual driving conditions may vary.
          </Text>
        </View>
      </View>
    );
  };

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
        <Text style={styles.headerTitle}>Transportation Options</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Journey Info */}
      <View style={styles.journeyInfoContainer}>
        <LinearGradient
          colors={["#4285F4", "#34A853"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.gradient}
        >
          <View style={styles.journeyInfo}>
            <View style={styles.locationContainer}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                {origin?.name || originAddress?.city || "Current Location"}
              </Text>
            </View>

            <View style={styles.journeyLine}>
              <View style={styles.line} />
              <FontAwesome5
                name={selectedTransport === "flight" ? "plane" : "car"}
                size={16}
                color="#FFF"
                style={styles.transportIcon}
              />
            </View>

            <View style={styles.locationContainer}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                {destinationAddress?.city || destination?.name || "Destination"}
              </Text>
            </View>
          </View>

          <Text style={styles.dateText}>
            {format(new Date(departureDate), "MMMM d, yyyy")}
          </Text>
        </LinearGradient>
      </View>

      {/* Transport Type Tabs */}
      {renderTransportTabs()}

      {/* Transport Options */}
      <View style={styles.optionsContainer}>
        {activeTransportType === "flights" &&
          (flightOptions.length > 0 ? (
            renderFlightOptions()
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="flight-takeoff" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                No flights found for this route
              </Text>
            </View>
          ))}

        {activeTransportType === "trains" &&
          (trainOptions.length > 0 ? (
            <FlatList
              data={trainOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.transportCard}>
                  <View style={styles.transportCardHeader}>
                    <View>
                      <Text style={styles.transportOperator}>
                        {item.operator}
                      </Text>
                      <Text style={styles.transportRoute}>
                        {item.departureCity} to {item.arrivalCity}
                      </Text>
                    </View>
                    <Text style={styles.transportPrice}>${item.price}</Text>
                  </View>

                  <View style={styles.transportTimes}>
                    <View style={styles.transportTimeColumn}>
                      <Text style={styles.transportTime}>
                        {item.departureTime}
                      </Text>
                      <Text style={styles.transportStation}>
                        {item.departureStation}
                      </Text>
                    </View>

                    <View style={styles.transportDurationContainer}>
                      <View style={styles.transportDurationLine} />
                      <Text style={styles.transportDuration}>
                        {item.duration}
                      </Text>
                    </View>

                    <View style={styles.transportTimeColumn}>
                      <Text style={styles.transportTime}>
                        {item.arrivalTime}
                      </Text>
                      <Text style={styles.transportStation}>
                        {item.arrivalStation}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.selectTransportButton}
                    onPress={() => setSelectedTransport("train")}
                  >
                    <Text style={styles.selectTransportText}>Select</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.transportList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="train" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                No trains available for this route
              </Text>
            </View>
          ))}

        {activeTransportType === "buses" &&
          (busOptions.length > 0 ? (
            <FlatList
              data={busOptions}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.transportCard}>
                  <View style={styles.transportCardHeader}>
                    <View>
                      <Text style={styles.transportOperator}>
                        {item.operator}
                      </Text>
                      <Text style={styles.transportRoute}>
                        {item.departureCity} to {item.arrivalCity}
                      </Text>
                    </View>
                    <Text style={styles.transportPrice}>${item.price}</Text>
                  </View>

                  <View style={styles.transportTimes}>
                    <View style={styles.transportTimeColumn}>
                      <Text style={styles.transportTime}>
                        {item.departureTime}
                      </Text>
                      <Text style={styles.transportStation}>
                        {item.departureStation}
                      </Text>
                    </View>

                    <View style={styles.transportDurationContainer}>
                      <View style={styles.transportDurationLine} />
                      <Text style={styles.transportDuration}>
                        {item.duration}
                      </Text>
                    </View>

                    <View style={styles.transportTimeColumn}>
                      <Text style={styles.transportTime}>
                        {item.arrivalTime}
                      </Text>
                      <Text style={styles.transportStation}>
                        {item.arrivalStation}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.selectTransportButton}
                    onPress={() => setSelectedTransport("bus")}
                  >
                    <Text style={styles.selectTransportText}>Select</Text>
                  </TouchableOpacity>
                </View>
              )}
              contentContainerStyle={styles.transportList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="directions-bus" size={48} color="#BDBDBD" />
              <Text style={styles.emptyText}>
                No buses available for this route
              </Text>
            </View>
          ))}

        {activeTransportType === "driving" && renderDrivingOption()}
      </View>

      {/* Bottom Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <Text style={styles.continueButtonText}>Continue with Selection</Text>
          <AntDesign name="arrowright" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
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
  },
  placeholder: {
    width: 40,
  },
  journeyInfoContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  gradient: {
    borderRadius: 10,
    padding: 15,
  },
  journeyInfo: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  locationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FFF",
    marginRight: 8,
  },
  locationText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  journeyLine: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 10,
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  transportIcon: {
    marginHorizontal: 8,
  },
  dateText: {
    color: "#FFF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#FFF",
    borderRadius: 10,
    margin: 20,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#F0F8FF",
  },
  tabText: {
    fontSize: 16,
    marginLeft: 8,
    color: "#757575",
  },
  activeTabText: {
    color: "#4285F4",
    fontWeight: "bold",
  },
  optionsContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
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
    paddingHorizontal: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
    textAlign: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: "#757575",
  },
  flightList: {
    paddingVertical: 10,
  },
  drivingContainer: {
    flex: 1,
    paddingVertical: 10,
  },
  drivingCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  drivingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  drivingTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    color: "#333",
  },
  drivingDetails: {
    marginBottom: 15,
  },
  drivingDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  drivingDetailText: {
    fontSize: 16,
    marginLeft: 10,
    color: "#333",
  },
  viewRouteButton: {
    flexDirection: "row",
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  viewRouteButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  drivingInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    padding: 12,
  },
  drivingInfoText: {
    marginLeft: 8,
    color: "#757575",
    fontSize: 14,
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: "#FFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  continueButton: {
    flexDirection: "row",
    backgroundColor: "#4CAF50",
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  transportCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  transportCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  transportOperator: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  transportRoute: {
    fontSize: 16,
    color: "#757575",
  },
  transportPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4285F4",
  },
  transportTimes: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  transportTimeColumn: {
    flexDirection: "column",
    alignItems: "center",
  },
  transportTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  transportStation: {
    fontSize: 14,
    color: "#757575",
  },
  transportDurationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 10,
  },
  transportDurationLine: {
    height: 1,
    width: "100%",
    backgroundColor: "#e0e0e0",
    position: "absolute",
  },
  transportDuration: {
    fontSize: 14,
    color: "#757575",
    backgroundColor: "#fff",
    paddingHorizontal: 8,
  },
  selectTransportButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  selectTransportText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  transportList: {
    paddingVertical: 10,
  },
});

export default TransportOptions;
