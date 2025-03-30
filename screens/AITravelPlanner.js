import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  Image,
  FlatList,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { BACKEND_URL } from "../config";
import DestinationAutocomplete from "../components/DestinationAutocomplete";
import {
  AntDesign,
  Ionicons,
  FontAwesome5,
  MaterialIcons,
  Feather,
} from "@expo/vector-icons";
import { useRoute } from "@react-navigation/native";
import { googleapis } from "../constants/constant";
import AttractionCard from "../components/AttractionCard";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import * as TravelPlanService from "../services/TravelPlanService";
import HotelCard from "../components/HotelCard";
import * as LocationService from "../services/LocationService";
import * as FlightService from "../services/FlightService";

const { width, height } = Dimensions.get("window");

// Create a wrapper component for AITravelPlanner that handles route params
const AITravelPlannerWrapper = ({ route, navigation }) => {
  return <AITravelPlanner route={route} navigation={navigation} />;
};

const AITravelPlanner = ({ navigation, route }) => {
  const { user } = useAuth();
  const [destination, setDestination] = useState("");
  const [budget, setBudget] = useState("1000");
  const [tripDuration, setTripDuration] = useState("5");
  const [preferences, setPreferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [error, setError] = useState(null);
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [formStep, setFormStep] = useState(1); // 1: Destination, 2: Details, 3: Preferences
  const [savedPlanId, setSavedPlanId] = useState(null);

  // For fullscreen image viewer
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  const [userLocation, setUserLocation] = useState(null);
  const [transportSelected, setTransportSelected] = useState(false);
  const [transportType, setTransportType] = useState(null);
  const [transportDetails, setTransportDetails] = useState(null);

  useEffect(() => {
    // Check connection status silently (no alert)
    checkConnectionSilent();

    // Check if we have a selected destination from navigation parameters
    if (route?.params?.selectedDestination) {
      const place = route.params.selectedDestination;
      console.log("Received destination from navigation:", place);
      setDestination(place.name);
      setSelectedDestination(place);
    }

    // Handle incoming location data
    if (route?.params?.selectedLocation) {
      const location = route.params.selectedLocation;
      console.log("Received location:", location);
      setDestination(location.city);
      setSelectedLocation(location);
    }

    // Handle transport selection from TransportOptions screen
    if (route?.params?.transportSelected) {
      console.log("Transport selected:", route.params);
      setTransportSelected(true);
      setTransportType(route.params.transportType);
      setTransportDetails(route.params.transportDetails);

      // Show success message
      Alert.alert(
        "Transportation Selected",
        `Your ${
          route.params.transportType === "flight" ? "flight" : "driving route"
        } has been added to your travel plan.`
      );
    }
  }, [route?.params]);

  useEffect(() => {
    // Get user's current location
    const getUserLocation = async () => {
      try {
        const location = await LocationService.getCurrentLocation();
        setUserLocation(location);
      } catch (error) {
        console.error("Error getting user location:", error);
        // Fallback to a default location (New York)
        setUserLocation({
          latitude: 40.7128,
          longitude: -74.006,
        });
      }
    };

    getUserLocation();
  }, []);

  // Function to check connection silently (no alert)
  const checkConnectionSilent = async () => {
    try {
      setConnectionStatus("checking");
      console.log(`Testing connection to: ${BACKEND_URL}/ping`);
      const response = await axios.get(`${BACKEND_URL}/ping`, {
        timeout: 5000,
      });
      console.log("Connection check response:", response.data);
      setConnectionStatus("connected");
      return true;
    } catch (error) {
      console.error("Connection check failed:", error);
      setConnectionStatus("disconnected");
      return false;
    }
  };

  // Full connection test with alert
  const testConnection = async () => {
    try {
      setConnectionStatus("checking");
      console.log(`Testing connection to: ${BACKEND_URL}/ping`);
      const response = await axios.get(`${BACKEND_URL}/ping`, {
        timeout: 5000,
      });
      console.log("Connection test response:", response.data);
      setConnectionStatus("connected");
      Alert.alert("Connection Successful", "Backend server is reachable.");
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("disconnected");

      let errorMessage = `Failed to connect to server at ${BACKEND_URL}`;

      if (error.response) {
        errorMessage += `\nStatus: ${error.response.status}`;
      } else if (error.code === "ECONNABORTED") {
        errorMessage += "\nTimeout: Server took too long to respond";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage +=
          "\nNetwork Error: Check if server is running and on the same network";
      }

      Alert.alert("Connection Failed", errorMessage);
      return false;
    }
  };

  // Test autocomplete functionality
  const testAutocomplete = async () => {
    try {
      console.log(
        `Testing autocomplete endpoint: ${BACKEND_URL}/api/destinations/test`
      );
      const response = await axios.get(`${BACKEND_URL}/api/destinations/test`, {
        timeout: 5000,
      });
      console.log("Autocomplete test response:", response.data);
      Alert.alert(
        "Autocomplete Test Successful",
        "Autocomplete endpoint is reachable."
      );
      return true;
    } catch (error) {
      console.error("Autocomplete test failed:", error);
      let errorMessage = `Failed to connect to autocomplete endpoint at ${BACKEND_URL}/api/destinations/test`;

      if (error.response) {
        errorMessage += `\nStatus: ${error.response.status}`;
      } else if (error.code === "ECONNABORTED") {
        errorMessage += "\nTimeout: Server took too long to respond";
      } else if (error.code === "ERR_NETWORK") {
        errorMessage +=
          "\nNetwork Error: Check if server is running and on the same network";
      }

      Alert.alert("Autocomplete Test Failed", errorMessage);
      return false;
    }
  };

  // Handle destination selection
  const handleDestinationSelect = (place) => {
    console.log("Selected destination:", place);
    setDestination(place.name);
    setSelectedDestination(place);

    // Move to next step
    if (formStep === 1) {
      setFormStep(2);
    }
  };

  // Function to generate plan
  const generatePlan = async () => {
    if (!destination && !selectedDestination) {
      Alert.alert("Error", "Please select a destination");
      return;
    }

    setLoading(true);
    setError(null);
    setPlan(null);

    try {
      console.log(
        "Generating plan for:",
        selectedDestination ? selectedDestination.description : destination
      );
      console.log("With parameters:", {
        budget,
        tripDuration,
        preferences,
      });

      // Prepare request parameters
      const params = {
        destination: selectedDestination
          ? selectedDestination.mainText || selectedDestination.name
          : destination,
        budget,
        tripDuration,
        preferences,
      };

      // If we have a selected place with placeId, use it
      if (
        selectedDestination &&
        (selectedDestination.placeId || selectedDestination.id)
      ) {
        params.placeId = selectedDestination.placeId || selectedDestination.id;
      }

      // Use the TravelPlanService to get recommendations
      const response = await TravelPlanService.getAIRecommendations(params);

      console.log("Got response from AI", response ? "✓" : "✗");

      if (response) {
        setPlan(response);
        setSavedPlanId(response.savedPlanId);

        // Save the plan information to our state
        if (response.itinerary) {
          console.log(
            `Received itinerary with ${response.itinerary.length} days`
          );
        }

        // Navigate to the result view
        setFormStep(4); // Move to the results view
      } else {
        setError("No data returned from AI service");
      }
    } catch (error) {
      console.error("Error generating travel plan:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to generate travel plan"
      );

      // Try to use mock plan as fallback
      if (!plan) {
        console.log("Using mock plan as fallback");
        const mockPlan = generateMockPlan();
        setPlan(mockPlan);
        setFormStep(4);
      }
    } finally {
      setLoading(false);
    }
  };

  // Save the travel plan
  const saveTravelPlan = async () => {
    if (!user) {
      Alert.alert(
        "Sign In Required",
        "Please sign in to save this travel plan",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => navigation.navigate("Login") },
        ]
      );
      return;
    }

    if (!plan) return;

    try {
      setLoading(true);

      // If we already have a saved plan ID, the plan is already saved
      if (savedPlanId) {
        Alert.alert("Success", "This plan is already saved to your account");
        setLoading(false);
        return;
      }

      // Prepare the plan data
      const planData = {
        destination: plan.destination,
        budget: parseInt(plan.budget) || 1000,
        tripDuration: parseInt(plan.tripDuration || tripDuration) || 5,
        itinerary: plan.itinerary || [],
        recommendations: plan.recommendations || [],
        budgetBreakdown: plan.budgetBreakdown || {},
      };

      // Save the plan
      const savedPlan = await TravelPlanService.createTravelPlan(planData);
      setSavedPlanId(savedPlan._id);

      Alert.alert("Success", "Travel plan saved to your account");
    } catch (error) {
      console.error("Error saving travel plan:", error);
      Alert.alert("Error", "Failed to save travel plan");
    } finally {
      setLoading(false);
    }
  };

  // Generate a mock plan for offline/testing mode
  const generateMockPlan = () => {
    return {
      destination: destination || "Paris",
      budget: parseInt(budget),
      tripDuration: parseInt(tripDuration),
      destinationData: {
        images: [
          "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=1000&auto=format&fit=crop",
        ],
        details: {
          address: "Paris, France",
          rating: 4.8,
          website: "https://en.parisinfo.com/",
        },
        topAttractions: [
          {
            name: "Eiffel Tower",
            rating: 4.7,
            address: "Champ de Mars, 5 Avenue Anatole France, 75007 Paris",
            photos: [
              "https://images.unsplash.com/photo-1543349689-9a4d426bee8e?q=80&w=1000&auto=format&fit=crop",
            ],
          },
          {
            name: "Louvre Museum",
            rating: 4.9,
            address: "Rue de Rivoli, 75001 Paris",
            photos: [
              "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?q=80&w=1000&auto=format&fit=crop",
            ],
          },
        ],
      },
      itinerary: [
        {
          day: 1,
          activities:
            "Arrive in Paris. Check in to your hotel. Visit Eiffel Tower in the evening for spectacular views of the city.",
        },
        {
          day: 2,
          activities:
            "Visit the Louvre Museum to see the Mona Lisa and thousands of other masterpieces. Afternoon at Tuileries Garden and shopping on Champs-Élysées.",
        },
        {
          day: 3,
          activities:
            "Explore Montmartre and visit Sacré-Cœur Basilica. Enjoy local cafes and artists in this bohemian neighborhood.",
        },
      ],
      recommendations: [
        {
          name: "Le Jules Verne",
          category: "Restaurant",
          description:
            "Upscale dining experience in the Eiffel Tower with panoramic views of Paris.",
          estimatedCost: 150,
        },
        {
          name: "Seine River Cruise",
          category: "Activity",
          description:
            "See Paris from the water with a scenic cruise along the Seine River.",
          estimatedCost: 40,
        },
        {
          name: "Musée d'Orsay",
          category: "Museum",
          description:
            "Impressive collection of impressionist masterpieces in a former railway station.",
          estimatedCost: 15,
        },
      ],
      budgetBreakdown: {
        accommodations: 600,
        food: 300,
        transportation: 150,
        activities: 200,
        total: 1250,
      },
    };
  };

  // Function to open the fullscreen image viewer
  const openFullscreenImage = (imageUri) => {
    // If it's a photo reference, construct the full URL
    if (typeof imageUri === "object" && imageUri.photo_reference) {
      setFullscreenImage(
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${imageUri.photo_reference}&key=${googleapis}`
      );
    }
    // If it's an object with url property
    else if (typeof imageUri === "object" && imageUri.url) {
      setFullscreenImage(imageUri.url);
    }
    // If it's already a string
    else {
      setFullscreenImage(imageUri);
    }
  };

  // Function to close the fullscreen image viewer
  const closeFullscreenImage = () => {
    setFullscreenImage(null);
  };

  // Reset form fields and state
  const resetForm = () => {
    setDestination("");
    setBudget("1000");
    setTripDuration("5");
    setPreferences("");
    setPlan(null);
    setError(null);
    setFormStep(1);
  };

  // Render connection status indicator
  const renderConnectionStatus = () => {
    let icon, color, text;

    switch (connectionStatus) {
      case "connected":
        icon = "wifi";
        color = "#4CAF50";
        text = "Connected";
        break;
      case "checking":
        icon = "sync";
        color = "#FFC107";
        text = "Checking...";
        break;
      case "disconnected":
        icon = "wifi-off";
        color = "#F44336";
        text = "Offline Mode";
        break;
      default:
        icon = "help-circle";
        color = "#9E9E9E";
        text = "Unknown";
    }

    return (
      <TouchableOpacity
        style={[styles.connectionStatusContainer, { borderColor: color }]}
        onPress={testConnection}
      >
        <Feather name={icon} size={14} color={color} />
        <Text style={[styles.connectionStatusText, { color }]}>{text}</Text>
      </TouchableOpacity>
    );
  };

  // Render step indicators
  const renderStepIndicators = () => {
    return (
      <View style={styles.stepIndicatorContainer}>
        <View
          style={[
            styles.stepIndicator,
            formStep >= 1 ? styles.activeStepIndicator : {},
          ]}
        />
        <View style={styles.stepConnector} />
        <View
          style={[
            styles.stepIndicator,
            formStep >= 2 ? styles.activeStepIndicator : {},
          ]}
        />
        <View style={styles.stepConnector} />
        <View
          style={[
            styles.stepIndicator,
            formStep >= 3 ? styles.activeStepIndicator : {},
          ]}
        />
      </View>
    );
  };

  // Render destination step
  const renderDestinationStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Where would you like to go?</Text>
        <Text style={styles.stepDescription}>
          Enter your destination or search for a location
        </Text>

        <View style={styles.inputGroupDestination}>
          <View style={styles.destinationInputContainer}>
            <Ionicons
              name="location-outline"
              size={24}
              color="#3498db"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.destinationInput}
              placeholder="Enter destination city or country"
              value={destination}
              onChangeText={setDestination}
              placeholderTextColor="#999"
            />
            {destination ? (
              <TouchableOpacity onPress={() => setDestination("")}>
                <Ionicons name="close-circle" size={22} color="#999" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={styles.locationSearchButton}
            onPress={() => {
              navigation.navigate("ChangeLocation", {
                returnScreen: "AITravelPlanner",
              });
            }}
          >
            <Text style={styles.locationSearchButtonText}>Search</Text>
            <AntDesign
              name="search1"
              size={16}
              color="#FFFFFF"
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.nextButton, !destination ? styles.disabledButton : {}]}
          disabled={!destination}
          onPress={() => setFormStep(2)}
        >
          <Text style={styles.nextButtonText}>Continue</Text>
          <AntDesign
            name="arrowright"
            size={18}
            color="#FFFFFF"
            style={{ marginLeft: 5 }}
          />
        </TouchableOpacity>
      </View>
    );
  };

  // Render trip details step
  const renderDetailsStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Trip Details</Text>
        <Text style={styles.stepDescription}>
          Tell us more about your travel plans
        </Text>

        <View style={styles.detailsContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Budget (USD)</Text>
            <View style={styles.inputContainer}>
              <FontAwesome5
                name="dollar-sign"
                size={20}
                color="#3498db"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={budget}
                onChangeText={setBudget}
                keyboardType="numeric"
                placeholder="Your budget in USD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Trip Duration (days)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar-outline"
                size={22}
                color="#3498db"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={tripDuration}
                onChangeText={setTripDuration}
                keyboardType="numeric"
                placeholder="Number of days"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Check-in Date (optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar"
                size={22}
                color="#3498db"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={checkInDate}
                onChangeText={setCheckInDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Check-out Date (optional)</Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="calendar"
                size={22}
                color="#3498db"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={checkOutDate}
                onChangeText={setCheckOutDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setFormStep(1)}
          >
            <AntDesign
              name="arrowleft"
              size={18}
              color="#3498db"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => setFormStep(3)}
          >
            <Text style={styles.nextButtonText}>Continue</Text>
            <AntDesign
              name="arrowright"
              size={18}
              color="#FFFFFF"
              style={{ marginLeft: 5 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render preferences step
  const renderPreferencesStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Travel Preferences</Text>
        <Text style={styles.stepDescription}>
          Help us customize your perfect trip
        </Text>

        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Preferences (optional)</Text>
          <View style={styles.inputContainerTextArea}>
            <MaterialIcons
              name="favorite-outline"
              size={22}
              color="#3498db"
              style={[
                styles.inputIcon,
                { alignSelf: "flex-start", marginTop: 12 },
              ]}
            />
            <TextInput
              style={styles.textArea}
              placeholder="What do you like? (e.g. museums, outdoor activities, local cuisine)"
              value={preferences}
              onChangeText={setPreferences}
              multiline
              numberOfLines={4}
              placeholderTextColor="#999"
            />
          </View>
        </View>

        {/* Suggestion chips */}
        <View style={styles.chipContainer}>
          <Text style={styles.chipLabel}>Suggested preferences:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipScroll}
          >
            {[
              "Museums",
              "Beaches",
              "Hiking",
              "Food",
              "Shopping",
              "Nightlife",
              "Family-friendly",
              "Adventure",
            ].map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.chip}
                onPress={() => {
                  const newPref = preferences
                    ? `${preferences}, ${item}`
                    : item;
                  setPreferences(newPref);
                }}
              >
                <Text style={styles.chipText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={22} color="#e74c3c" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setFormStep(2)}
          >
            <AntDesign
              name="arrowleft"
              size={18}
              color="#3498db"
              style={{ marginRight: 5 }}
            />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.generateButton,
              loading ? styles.disabledButton : {},
            ]}
            onPress={generatePlan}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <FontAwesome5
                  name="magic"
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.generateButtonText}>Generate Plan</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Render plan results
  const renderPlanResults = () => {
    if (!plan) return null;

    return (
      <ScrollView
        style={styles.resultContainer}
        contentContainerStyle={styles.resultContentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.planHeader}>
          <View style={styles.planHeaderContent}>
            <Text style={styles.planTitle}>
              Your Trip to {plan.destination}
            </Text>
            <Text style={styles.planSubtitle}>
              {plan.tripDuration || tripDuration} days · $
              {plan.budget || budget} budget
            </Text>
          </View>

          {/* Save button */}
          <TouchableOpacity
            style={styles.saveButton}
            onPress={saveTravelPlan}
            disabled={loading}
          >
            <Ionicons
              name={savedPlanId ? "bookmark" : "bookmark-outline"}
              size={24}
              color={savedPlanId ? "#4A80F0" : "#555"}
            />
          </TouchableOpacity>
        </View>

        {/* Plan header with destination image */}
        <View style={styles.planHeaderContainer}>
          {plan.destinationData &&
          plan.destinationData.images &&
          plan.destinationData.images.length > 0 ? (
            <Image
              source={{ uri: plan.destinationData.images[0] }}
              style={styles.destinationCoverImage}
            />
          ) : (
            <View style={styles.placeholderCover} />
          )}

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.planHeaderGradient}
          >
            <Text style={styles.planDestinationName}>{plan.destination}</Text>
            <View style={styles.planMetaContainer}>
              <View style={styles.planMetaItem}>
                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                <Text style={styles.planMetaText}>
                  {plan.tripDuration} days
                </Text>
              </View>
              <View style={styles.planMetaItem}>
                <FontAwesome5 name="dollar-sign" size={14} color="#FFFFFF" />
                <Text style={styles.planMetaText}>${plan.budget}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Budget summary card */}
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Budget Summary</Text>
          <View style={styles.budgetProgressBarContainer}>
            <View style={styles.budgetProgressBar}>
              <View
                style={[
                  styles.budgetProgressFill,
                  {
                    width: `${
                      (plan.budgetBreakdown.total / plan.budget) * 100
                    }%`,
                  },
                ]}
              />
            </View>
            <View style={styles.budgetSummaryRow}>
              <Text style={styles.budgetSummaryText}>
                Estimated: ${plan.budgetBreakdown.total}
              </Text>
              <Text style={styles.budgetSummaryText}>
                Budget: ${plan.budget}
              </Text>
            </View>
          </View>

          <View style={styles.budgetBreakdownContainer}>
            {Object.entries(plan.budgetBreakdown).map(([key, value], index) => {
              if (key === "total") return null;

              // Calculate percentage for each category
              const percentage = Math.round(
                (value / plan.budgetBreakdown.total) * 100
              );

              return (
                <View key={index} style={styles.budgetBreakdownItem}>
                  <View style={styles.budgetBreakdownHeader}>
                    <Text style={styles.budgetBreakdownCategory}>
                      {key.charAt(0).toUpperCase() + key.slice(1)}
                    </Text>
                    <Text style={styles.budgetBreakdownValue}>${value}</Text>
                  </View>
                  <View style={styles.budgetPercentageBarContainer}>
                    <View
                      style={[
                        styles.budgetPercentageBar,
                        { width: `${percentage}%` },
                      ]}
                    />
                    <Text style={styles.budgetPercentageText}>
                      {percentage}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Itinerary card */}
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Your Itinerary</Text>
          {plan.itinerary.map((day, index) => (
            <View key={index} style={styles.itineraryDayContainer}>
              <View style={styles.itineraryDayHeader}>
                <View style={styles.itineraryDayBadge}>
                  <Text style={styles.itineraryDayBadgeText}>
                    Day {day.day}
                  </Text>
                </View>
              </View>
              <Text style={styles.itineraryDayContent}>{day.activities}</Text>
            </View>
          ))}
        </View>

        {/* Top attractions */}
        {plan.destinationData && plan.destinationData.topAttractions && (
          <View style={styles.planCard}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.planCardTitle}>Top Attractions</Text>
              <TouchableOpacity
                style={styles.viewAllButton}
                onPress={() => {
                  // Format coordinates properly
                  let coords;

                  if (plan.destinationData?.details?.coordinates) {
                    coords = {
                      lat:
                        plan.destinationData.details.coordinates.lat ||
                        plan.destinationData.details.coordinates.latitude,
                      lng:
                        plan.destinationData.details.coordinates.lng ||
                        plan.destinationData.details.coordinates.longitude,
                    };
                  } else if (selectedDestination?.coordinates) {
                    coords = {
                      lat:
                        selectedDestination.coordinates.lat ||
                        selectedDestination.coordinates.latitude,
                      lng:
                        selectedDestination.coordinates.lng ||
                        selectedDestination.coordinates.longitude,
                    };
                  }

                  console.log(
                    "Navigating to AllAttractions with coordinates:",
                    coords
                  );

                  // Limit to 3 attractions in preview
                  const previewCount = 3;
                  navigation.navigate("AllAttractions", {
                    destination: plan.destination || "Unknown destination",
                    attractions: plan.destinationData.topAttractions || [],
                    coordinates: coords,
                  });
                }}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <AntDesign name="arrowright" size={16} color="#3498db" />
              </TouchableOpacity>
            </View>

            {plan.destinationData.topAttractions
              .slice(0, 3)
              .map((attraction, index) => (
                <View key={index} style={styles.attractionItemContainer}>
                  {attraction.photos && attraction.photos.length > 0 ? (
                    <TouchableOpacity
                      onPress={() =>
                        openFullscreenImage(
                          attraction.photos[0].photo_reference
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${attraction.photos[0].photo_reference}&key=${googleapis}`
                            : attraction.photos[0]
                        )
                      }
                      style={styles.attractionImageContainer}
                    >
                      <Image
                        source={{
                          uri: attraction.photos[0].photo_reference
                            ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${attraction.photos[0].photo_reference}&key=${googleapis}`
                            : attraction.photos[0],
                        }}
                        style={styles.attractionImage}
                      />
                    </TouchableOpacity>
                  ) : null}

                  <View style={styles.attractionDetails}>
                    <Text style={styles.attractionName}>{attraction.name}</Text>
                    {attraction.rating ? (
                      <View style={styles.attractionRatingContainer}>
                        <AntDesign name="star" size={14} color="#FFD700" />
                        <Text style={styles.attractionRatingText}>
                          {attraction.rating}
                        </Text>
                      </View>
                    ) : null}
                    {attraction.address ? (
                      <Text style={styles.attractionAddress} numberOfLines={2}>
                        {attraction.address}
                      </Text>
                    ) : null}

                    <TouchableOpacity
                      style={styles.attractionAiButton}
                      onPress={() => {
                        // Navigate to AITravelPlanner with the selected attraction as destination
                        navigation.navigate("MainTabs", {
                          screen: "AITravelPlanner",
                          params: {
                            selectedDestination: {
                              name: attraction.name,
                              coordinates: {
                                latitude:
                                  attraction.geometry?.location?.lat ||
                                  attraction.latitude ||
                                  (attraction.coordinates
                                    ? attraction.coordinates.latitude
                                    : null),
                                longitude:
                                  attraction.geometry?.location?.lng ||
                                  attraction.longitude ||
                                  (attraction.coordinates
                                    ? attraction.coordinates.longitude
                                    : null),
                              },
                              description:
                                attraction.address || attraction.vicinity || "",
                              place_details: attraction,
                            },
                          },
                        });
                      }}
                    >
                      <AntDesign name="rocket1" size={14} color="#FFF" />
                      <Text style={styles.attractionAiButtonText}>
                        Plan with AI
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Hotels Section */}
        {renderHotelsSection()}

        {/* Recommendations */}
        <View style={styles.planCard}>
          <Text style={styles.planCardTitle}>Recommended for You</Text>
          {plan.recommendations.map((rec, index) => (
            <View key={index} style={styles.recommendationItem}>
              <View style={styles.recommendationHeader}>
                <Text style={styles.recommendationName}>{rec.name}</Text>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: getCategoryColor(rec.category) },
                  ]}
                >
                  <Text style={styles.categoryText}>{rec.category}</Text>
                </View>
              </View>
              <Text style={styles.recommendationDescription}>
                {rec.description}
              </Text>
              {rec.estimatedCost && (
                <Text style={styles.recommendationCost}>
                  Estimated cost:{" "}
                  <Text style={{ fontWeight: "bold", color: "#3498db" }}>
                    ${rec.estimatedCost}
                  </Text>
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* Action buttons */}
        <View style={styles.planActionsContainer}>
          <TouchableOpacity
            style={styles.planActionButton}
            onPress={() => {
              // Navigate to budget manager with plan data
              navigation.navigate("AIBudgetManager", { plan });
            }}
          >
            <FontAwesome5 name="money-bill-wave" size={18} color="#FFFFFF" />
            <Text style={styles.planActionButtonText}>Manage Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planActionButton, styles.planActionButtonSecondary]}
            onPress={() => {
              setPlan(null);
              setFormStep(1);
            }}
          >
            <Ionicons name="create-outline" size={20} color="#3498db" />
            <Text style={styles.planActionButtonTextSecondary}>New Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Transport section */}
        {renderTransportSection()}

        {/* New AI features buttons */}
        <View style={styles.aiToolsContainer}>
          <Text style={styles.aiToolsTitle}>AI Travel Tools</Text>
          <View style={styles.aiToolsButtonsRow}>
            <TouchableOpacity
              style={styles.aiToolButton}
              onPress={() =>
                navigation.navigate("CulturalInsights", {
                  destination: plan.destination,
                })
              }
            >
              <FontAwesome5 name="globe-americas" size={20} color="#fff" />
              <Text style={styles.aiToolButtonText}>Cultural Insights</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiToolButton}
              onPress={() =>
                navigation.navigate("WeatherInsights", {
                  destination: plan.destination,
                  startDate: checkInDate,
                  endDate: checkOutDate,
                })
              }
            >
              <FontAwesome5 name="cloud-sun" size={20} color="#fff" />
              <Text style={styles.aiToolButtonText}>Weather</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.aiToolsButtonsRow}>
            <TouchableOpacity
              style={styles.aiToolButton}
              onPress={() => navigation.navigate("PersonalizedRecommendations")}
            >
              <FontAwesome5 name="user-check" size={20} color="#fff" />
              <Text style={styles.aiToolButtonText}>For You</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.aiToolButton}
              onPress={() => {
                if (plan.attractions && plan.attractions.length >= 2) {
                  navigation.navigate("ItineraryOptimizer", {
                    itinerary: plan.attractions,
                    destination: plan.destination,
                  });
                } else {
                  Alert.alert(
                    "Not Enough Places",
                    "You need at least 2 attractions to optimize an itinerary."
                  );
                }
              }}
            >
              <FontAwesome5 name="route" size={20} color="#fff" />
              <Text style={styles.aiToolButtonText}>Optimize Route</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Welcome message */}
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeHeadline}>
            Welcome to {plan.destination}!
          </Text>
          <Text style={styles.welcomeText}>{plan.summary}</Text>
        </View>
      </ScrollView>
    );
  };

  // Helper function to get color for category badge
  const getCategoryColor = (category) => {
    const categoryColors = {
      Restaurant: "#e74c3c",
      Activity: "#3498db",
      Museum: "#9b59b6",
      Landmark: "#f39c12",
      Shopping: "#27ae60",
      Beach: "#1abc9c",
      Nightlife: "#8e44ad",
    };

    return categoryColors[category] || "#3498db";
  };

  // Update your getRecommendations function
  const getRecommendations = async () => {
    if (!destination) {
      Alert.alert("Error", "Please enter a destination");
      return;
    }

    setLoading(true);
    try {
      // Calculate default dates if not set
      const today = new Date();
      const defaultCheckIn = today.toISOString().split("T")[0];

      const defaultCheckOut = new Date(today);
      defaultCheckOut.setDate(
        defaultCheckOut.getDate() + (parseInt(tripDuration) || 5)
      );
      const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

      const result = await TravelPlanService.getAIRecommendations({
        destination,
        placeId: selectedDestination?.place_id || selectedDestination?.id,
        coordinates: selectedDestination?.coordinates,
        budget,
        preferences: preferences.split(",").filter(Boolean).join(","),
        tripDuration,
        checkInDate: checkInDate || defaultCheckIn,
        checkOutDate: checkOutDate || defaultCheckOutStr,
      });

      setPlan(result);
      setSavedPlanId(result.savedPlanId);

      // Save the plan information to our state
      if (result.itinerary) {
        console.log(`Received itinerary with ${result.itinerary.length} days`);
      }

      // Navigate to the result view
      setFormStep(4); // Move to the results view
    } catch (error) {
      console.error("Error generating travel plan:", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to generate travel plan"
      );

      // Try to use mock plan as fallback
      if (!plan) {
        console.log("Using mock plan as fallback");
        const mockPlan = generateMockPlan();
        setPlan(mockPlan);
        setFormStep(4);
      }
    } finally {
      setLoading(false);
    }
  };

  // Update the renderHotelsSection function to properly handle undefined data
  const renderHotelsSection = () => {
    if (
      !plan ||
      (!plan.destinationData?.recommendedHotels?.length &&
        !plan.destinationData?.amadeusHotels?.length)
    ) {
      return null;
    }

    // Determine how many hotels to initially display (preview mode)
    const previewCount = 2;

    return (
      <View style={styles.planCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.planCardTitle}>Recommended Hotels</Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => {
              // Format coordinates properly
              let coords;

              if (plan.destinationData?.details?.coordinates) {
                coords = {
                  lat:
                    plan.destinationData.details.coordinates.lat ||
                    plan.destinationData.details.coordinates.latitude,
                  lng:
                    plan.destinationData.details.coordinates.lng ||
                    plan.destinationData.details.coordinates.longitude,
                };
              } else if (selectedDestination?.coordinates) {
                coords = {
                  lat:
                    selectedDestination.coordinates.lat ||
                    selectedDestination.coordinates.latitude,
                  lng:
                    selectedDestination.coordinates.lng ||
                    selectedDestination.coordinates.longitude,
                };
              }

              console.log("Navigating to AllHotels with coordinates:", coords);

              navigation.navigate("AllHotels", {
                destination: plan.destination || "Unknown destination",
                amadeusHotels: plan.destinationData?.amadeusHotels || [],
                recommendedHotels:
                  plan.destinationData?.recommendedHotels || [],
                coordinates: coords,
                checkInDate,
                checkOutDate,
              });
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
            <AntDesign name="arrowright" size={16} color="#3498db" />
          </TouchableOpacity>
        </View>

        {/* Display Amadeus hotels first if available */}
        {plan.destinationData?.amadeusHotels?.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>
              Hotels with Real-Time Pricing
            </Text>
            {plan.destinationData.amadeusHotels
              .slice(0, previewCount)
              .map((hotel, index) => (
                <HotelCard
                  key={`amadeus-${index}`}
                  hotel={hotel}
                  showPricing={true}
                />
              ))}
          </>
        )}

        {/* Then display Google hotels if available */}
        {plan.destinationData?.recommendedHotels?.length > 0 && (
          <>
            <Text style={styles.subSectionTitle}>Other Hotel Options</Text>
            {plan.destinationData.recommendedHotels
              .slice(0, previewCount)
              .map((hotel, index) => {
                const item = {
                  name: hotel?.name || "Unknown Hotel",
                  rating: hotel?.rating || "N/A",
                  address: hotel?.address || "Address not available",
                  category: "Hotel",
                  photo:
                    hotel?.photos && hotel?.photos.length > 0
                      ? hotel.photos[0].photo_reference
                        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${hotel.photos[0].photo_reference}&key=${googleapis}`
                        : hotel.photos[0].url || hotel.photos[0]
                      : null,
                  price: hotel?.price_level
                    ? "$".repeat(hotel.price_level)
                    : "Price unavailable",
                };

                return (
                  <AttractionCard
                    key={`google-${index}`}
                    item={item}
                    showPricing={true}
                  />
                );
              })}
          </>
        )}
      </View>
    );
  };

  // Helper function to estimate flight time based on destination
  const getEstimatedFlightTime = (destination) => {
    // Define common destinations with approximate flight times (in hours)
    const flightTimeMap = {
      Paris: 8,
      London: 7.5,
      Rome: 9,
      Tokyo: 13,
      "New York": 5,
      "Los Angeles": 5.5,
      Sydney: 20,
      Dubai: 14,
      Bangkok: 18,
      Singapore: 19,
      "Hong Kong": 16,
      Berlin: 9,
      Barcelona: 9.5,
      Amsterdam: 8,
      "Las Vegas": 5,
      Miami: 3.5,
      "San Francisco": 5.5,
      Chicago: 4,
      Orlando: 3,
      Toronto: 2.5,
      "Mexico City": 4,
      Cairo: 12,
      Istanbul: 11,
    };

    // Check if we have a predefined flight time for this destination
    if (flightTimeMap[destination]) {
      return flightTimeMap[destination];
    }

    // Default estimate based on destination name length (this is just for demo purposes)
    // In a real app, you would use a distance calculation API or geolocation
    return Math.max(3, Math.min(20, Math.floor(destination.length * 1.2)));
  };

  // Helper function to estimate train travel time
  const getEstimatedTrainTime = (destination) => {
    // Define common destinations with approximate train times (in hours)
    const trainTimeMap = {
      Paris: 12,
      London: 11,
      Rome: 14,
      Berlin: 13,
      Barcelona: 15,
      Amsterdam: 10,
      Chicago: 6,
      Toronto: 4,
    };

    // Check if we have a predefined train time for this destination
    if (trainTimeMap[destination]) {
      return trainTimeMap[destination];
    }

    // Default train travel time is 1.5x flight time
    return Math.round(getEstimatedFlightTime(destination) * 1.5);
  };

  // Helper function to estimate driving time
  const getEstimatedDriveTime = (destination) => {
    // Define common destinations with approximate driving times (in hours)
    const driveTimeMap = {
      "New York": 4,
      "Los Angeles": 6,
      "Las Vegas": 5,
      Miami: 3,
      "San Francisco": 8,
      Chicago: 5,
      Orlando: 3,
      Toronto: 5,
      "Mexico City": 22,
    };

    // Check if we have a predefined drive time for this destination
    if (driveTimeMap[destination]) {
      return driveTimeMap[destination];
    }

    // Default drive time is roughly 10x flight time (for demo purposes)
    return Math.round(getEstimatedFlightTime(destination) * 10);
  };

  // Helper function to check if train travel is possible
  const isTrainTravelPossible = (destination) => {
    // List of destinations where train travel is possible
    const trainPossibleDestinations = [
      "Paris",
      "London",
      "Rome",
      "Berlin",
      "Barcelona",
      "Amsterdam",
      "Chicago",
      "Toronto",
      "Madrid",
      "Vienna",
      "Prague",
      "Brussels",
      "Venice",
      "Milan",
    ];

    return trainPossibleDestinations.includes(destination);
  };

  // Helper function to check if driving is possible
  const isDrivingPossible = (destination) => {
    // List of destinations where driving is not possible (overseas)
    const nonDrivableDestinations = [
      "Paris",
      "London",
      "Rome",
      "Tokyo",
      "Sydney",
      "Dubai",
      "Bangkok",
      "Singapore",
      "Hong Kong",
      "Berlin",
      "Barcelona",
      "Amsterdam",
      "Cairo",
      "Istanbul",
    ];

    return !nonDrivableDestinations.includes(destination);
  };

  // Helper function to estimate transportation cost
  const getEstimatedTransportCost = (destination, transportType) => {
    // Base costs for different transportation types
    const baseCosts = {
      flight: 250,
      train: 80,
      car: 30,
    };

    // Destination cost factors (higher means more expensive)
    const destinationFactors = {
      Paris: 1.2,
      London: 1.3,
      Rome: 1.1,
      Tokyo: 1.5,
      "New York": 1.0,
      "Los Angeles": 1.1,
      Sydney: 1.8,
      Dubai: 1.4,
      Bangkok: 1.6,
      Singapore: 1.7,
      "Hong Kong": 1.5,
      Berlin: 1.1,
      Barcelona: 1.0,
      Amsterdam: 1.2,
    };

    // Calculate cost based on transportation type and destination
    const factor = destinationFactors[destination] || 1.0;
    let baseCost = baseCosts[transportType] || baseCosts.flight;

    // Adjust cost based on transportation type
    switch (transportType) {
      case "flight":
        // Flight cost is based on flight time
        return Math.round(
          baseCost * factor * (getEstimatedFlightTime(destination) / 5)
        );
      case "train":
        // Train cost is less affected by distance
        return Math.round(
          baseCost * factor * (getEstimatedTrainTime(destination) / 10)
        );
      case "car":
        // Car cost is roughly based on gas price per mile
        return Math.round(
          baseCost * factor * (getEstimatedDriveTime(destination) / 3)
        );
      default:
        return Math.round(baseCost * factor);
    }
  };

  const handleSelectTransport = () => {
    if (!plan || !userLocation) {
      Alert.alert(
        "Information Required",
        "Please generate a travel plan first and ensure your location is available."
      );
      return;
    }

    // Get destination coordinates from the plan or selectedDestination
    let destinationCoords;
    if (selectedDestination && selectedDestination.coordinates) {
      destinationCoords = selectedDestination.coordinates;
    } else if (plan?.destination) {
      // Try to get coordinates for the destination name
      LocationService.getCoordinatesFromAddress(plan.destination)
        .then((coords) => {
          if (coords) {
            navigateToTransportOptions(coords);
          } else {
            Alert.alert(
              "Destination Error",
              "Could not find coordinates for this destination. Please try again."
            );
          }
        })
        .catch((error) => {
          console.error("Error getting destination coordinates:", error);
          Alert.alert(
            "Location Error",
            "Could not get coordinates for the destination. Please try again."
          );
        });
      return;
    } else {
      Alert.alert(
        "Destination Required",
        "Please select a valid destination first."
      );
      return;
    }

    if (destinationCoords) {
      navigateToTransportOptions(destinationCoords);
    }
  };

  const navigateToTransportOptions = (destinationCoords) => {
    navigation.navigate("TransportOptions", {
      origin: userLocation,
      destination: destinationCoords,
      destinationName: plan?.destination || selectedDestination?.name,
      departureDate: plan?.startDate || new Date(),
    });
  };

  // Inside the render method, add the transport selection button
  const renderTransportSection = () => {
    if (!plan) return null;

    return (
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <FontAwesome5 name="route" size={18} color="#333" />
          <Text style={styles.sectionTitle}>Transportation</Text>

          {!transportSelected && (
            <TouchableOpacity
              style={styles.selectButton}
              onPress={handleSelectTransport}
            >
              <Text style={styles.selectButtonText}>Select</Text>
            </TouchableOpacity>
          )}
        </View>

        {transportSelected ? (
          <View style={styles.selectedTransportContainer}>
            <View style={styles.transportHeader}>
              <FontAwesome5
                name={transportType === "flight" ? "plane" : "car"}
                size={18}
                color="#4285F4"
              />
              <Text style={styles.transportTypeText}>
                {transportType === "flight" ? "Flight" : "Driving Route"}
              </Text>
            </View>

            {transportType === "flight" ? (
              <View style={styles.flightDetailsContainer}>
                <View style={styles.flightRow}>
                  <Text style={styles.flightLabel}>Airline:</Text>
                  <Text style={styles.flightValue}>
                    {FlightService.getAirlineName(transportDetails.airline)}
                  </Text>
                </View>

                <View style={styles.flightRow}>
                  <Text style={styles.flightLabel}>Departure:</Text>
                  <Text style={styles.flightValue}>
                    {FlightService.formatFlightDate(
                      transportDetails.departureTime
                    )}
                  </Text>
                </View>

                <View style={styles.flightRow}>
                  <Text style={styles.flightLabel}>Arrival:</Text>
                  <Text style={styles.flightValue}>
                    {FlightService.formatFlightDate(
                      transportDetails.arrivalTime
                    )}
                  </Text>
                </View>

                <View style={styles.flightRow}>
                  <Text style={styles.flightLabel}>Duration:</Text>
                  <Text style={styles.flightValue}>
                    {FlightService.formatFlightDuration(
                      transportDetails.duration
                    )}
                  </Text>
                </View>

                <View style={styles.flightRow}>
                  <Text style={styles.flightLabel}>Price:</Text>
                  <Text style={styles.flightValue}>
                    {transportDetails.currency}{" "}
                    {parseFloat(transportDetails.price).toFixed(2)}
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.drivingDetailsContainer}>
                <View style={styles.drivingRow}>
                  <FontAwesome5 name="road" size={16} color="#757575" />
                  <Text style={styles.drivingText}>
                    Distance: {transportDetails.distance} km
                  </Text>
                </View>

                <View style={styles.drivingRow}>
                  <FontAwesome5 name="clock" size={16} color="#757575" />
                  <Text style={styles.drivingText}>
                    Duration: ~{Math.floor(transportDetails.duration / 60)}h{" "}
                    {transportDetails.duration % 60}m
                  </Text>
                </View>

                <View style={styles.drivingRow}>
                  <FontAwesome5 name="gas-pump" size={16} color="#757575" />
                  <Text style={styles.drivingText}>
                    Estimated Cost: ${transportDetails.cost.toFixed(2)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.viewRouteButton}
                  onPress={() => {
                    // Debug output before navigation
                    console.log("Navigating to Globe with params:", {
                      userLocation,
                      destination: selectedDestination?.coordinates,
                      destinationName:
                        plan?.destination || selectedDestination?.name,
                    });

                    // Ensure we have valid coordinates
                    if (!userLocation) {
                      Alert.alert(
                        "Missing Location",
                        "Your current location is not available. Please try again."
                      );
                      return;
                    }

                    if (!selectedDestination?.coordinates) {
                      Alert.alert(
                        "Missing Destination",
                        "Destination coordinates are not available."
                      );
                      return;
                    }

                    // Navigate using the proper nested navigator approach
                    navigation.navigate("MainTabs", {
                      screen: "Globe",
                      params: {
                        showRoute: true,
                        origin: userLocation,
                        destination: {
                          latitude: selectedDestination?.coordinates?.latitude,
                          longitude:
                            selectedDestination?.coordinates?.longitude,
                        },
                        destinationName:
                          plan?.destination || selectedDestination?.name,
                      },
                    });
                  }}
                >
                  <Text style={styles.viewRouteButtonText}>View on Map</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.transportPlaceholder}>
            <MaterialIcons name="flight-takeoff" size={24} color="#BDBDBD" />
            <Text style={styles.transportPlaceholderText}>
              Select your transportation method
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 25}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.headerBackButton}
            >
              <AntDesign name="arrowleft" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>AI Travel Planner</Text>
            {!plan && (
              <TouchableOpacity
                onPress={resetForm}
                style={styles.headerResetButton}
              >
                <Ionicons name="refresh" size={24} color="#3498db" />
              </TouchableOpacity>
            )}
          </View>

          {/* Connection status indicator */}
          {renderConnectionStatus()}

          {/* Hero section for form */}
          {!plan && (
            <View style={styles.heroContainer}>
              <LinearGradient
                colors={["#3498db", "#2980b9"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <FontAwesome5
                    name="robot"
                    size={34}
                    color="#FFFFFF"
                    style={styles.heroIcon}
                  />
                  <Text style={styles.heroTitle}>AI Travel Planning</Text>
                  <Text style={styles.heroSubtitle}>
                    Let our AI create your perfect personalized travel itinerary
                  </Text>
                </View>
              </LinearGradient>
            </View>
          )}

          {/* Form or Results */}
          {!plan ? (
            <View style={styles.formContainer}>
              {/* Step indicators */}
              {renderStepIndicators()}

              {/* Step Content */}
              {formStep === 1 && renderDestinationStep()}
              {formStep === 2 && renderDetailsStep()}
              {formStep === 3 && renderPreferencesStep()}
            </View>
          ) : (
            renderPlanResults()
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Fullscreen Image Viewer */}
      {fullscreenImage && (
        <View style={styles.fullScreenImageContainer}>
          <Image
            source={{ uri: fullscreenImage }}
            style={styles.fullScreenImage}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.closeButtonContainer}
            onPress={closeFullscreenImage}
          >
            <AntDesign name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>
              Generating your perfect travel plan...
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
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  headerResetButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  connectionStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 15,
  },
  connectionStatusText: {
    fontSize: 12,
    marginLeft: 5,
    fontWeight: "500",
  },
  heroContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  heroGradient: {
    padding: 25,
  },
  heroContent: {
    alignItems: "center",
  },
  heroIcon: {
    marginBottom: 15,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 10,
    textAlign: "center",
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
  },
  formContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  stepIndicatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 25,
  },
  stepIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E0E0E0",
  },
  activeStepIndicator: {
    backgroundColor: "#3498db",
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: "#E0E0E0",
    marginHorizontal: 5,
    maxWidth: 50,
  },
  stepContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
  },
  inputGroupDestination: {
    marginBottom: 20,
  },
  destinationInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 10,
  },
  destinationInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  locationSearchButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  locationSearchButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  nextButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  disabledButton: {
    backgroundColor: "#E0E0E0",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 10,
  },
  loadingText: {
    color: "#333",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 10,
  },
  resultContainer: {
    flex: 1,
  },
  resultContentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  planHeaderContent: {
    flexDirection: "column",
  },
  planTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 10,
  },
  planSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  saveButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  planHeaderContainer: {
    position: "relative",
    marginBottom: 20,
  },
  destinationCoverImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  placeholderCover: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  planHeaderGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  planDestinationName: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  planMetaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  planMetaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  planMetaText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginLeft: 5,
  },
  planCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  planCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 8,
  },
  budgetProgressBarContainer: {
    marginBottom: 20,
  },
  budgetProgressBar: {
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  budgetProgressFill: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 10,
  },
  budgetSummaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
  },
  budgetSummaryText: {
    fontSize: 14,
    fontWeight: "bold",
  },
  budgetBreakdownContainer: {
    marginTop: 20,
  },
  budgetBreakdownItem: {
    marginBottom: 10,
  },
  budgetBreakdownHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  budgetBreakdownCategory: {
    fontSize: 14,
  },
  budgetBreakdownValue: {
    fontSize: 14,
    fontWeight: "bold",
  },
  budgetPercentageBarContainer: {
    height: 20,
    backgroundColor: "#E0E0E0",
    borderRadius: 10,
    overflow: "hidden",
  },
  budgetPercentageBar: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 10,
  },
  budgetPercentageText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  itineraryDayContainer: {
    marginBottom: 15,
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 15,
  },
  itineraryDayHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  itineraryDayBadge: {
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  itineraryDayBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  itineraryDayContent: {
    fontSize: 14,
    lineHeight: 20,
  },
  attractionItemContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  attractionImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
    marginRight: 10,
  },
  attractionImage: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
  },
  attractionDetails: {
    flex: 1,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  attractionRatingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  attractionRatingText: {
    color: "#FFD700",
    marginLeft: 5,
  },
  attractionAddress: {
    color: "#666",
  },
  recommendationItem: {
    marginBottom: 15,
  },
  recommendationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  recommendationName: {
    fontSize: 16,
    fontWeight: "bold",
  },
  categoryBadge: {
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  recommendationDescription: {
    fontSize: 14,
  },
  recommendationCost: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#3498db",
  },
  planActionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  planActionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  planActionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  planActionButtonSecondary: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3498db",
  },
  planActionButtonTextSecondary: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
  },
  fullScreenImageContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  fullScreenImage: {
    width: width,
    height: width * 0.8,
  },
  closeButtonContainer: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  errorText: {
    color: "#FF3B30",
    marginLeft: 5,
  },
  chipContainer: {
    marginBottom: 20,
  },
  chipLabel: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chipScroll: {
    maxHeight: 100,
  },
  chip: {
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 10,
  },
  chipText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
  },
  generateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  sectionContainer: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
    flex: 1,
  },
  selectButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  selectButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  transportPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
  },
  transportPlaceholderText: {
    marginTop: 10,
    color: "#757575",
    fontSize: 16,
  },
  selectedTransportContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: 15,
  },
  transportHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  transportTypeText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
    color: "#333",
  },
  flightDetailsContainer: {
    marginTop: 5,
  },
  flightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  flightLabel: {
    fontSize: 14,
    color: "#757575",
  },
  flightValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  drivingDetailsContainer: {
    marginTop: 5,
  },
  drivingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  drivingText: {
    fontSize: 14,
    marginLeft: 10,
    color: "#333",
  },
  viewRouteButton: {
    backgroundColor: "#4285F4",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  viewRouteButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
  aiToolsContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  aiToolsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  aiToolsButtonsRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  aiToolButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4c669f",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  aiToolButtonText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  welcomeCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  welcomeHeadline: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#333",
  },
  welcomeText: {
    fontSize: 14,
    color: "#666",
  },
  destinationImageContainer: {
    position: "relative",
    marginBottom: 16,
  },
  destinationImage: {
    width: "100%",
    height: 200,
    borderRadius: 10,
  },
  destinationImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  destinationImageText: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
  },
  attractionAiButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    alignSelf: "flex-start",
  },
  attractionAiButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 5,
  },
});

export default AITravelPlannerWrapper;
