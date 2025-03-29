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

const { width, height } = Dimensions.get("window");

const AITravelPlanner = ({ navigation }) => {
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
  const route = useRoute();

  // For fullscreen image viewer
  const [fullscreenImage, setFullscreenImage] = useState(null);

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");

  useEffect(() => {
    // Check connection status silently (no alert)
    checkConnectionSilent();

    // Check if we have a selected destination from navigation parameters
    if (route.params?.selectedDestination) {
      const place = route.params.selectedDestination;
      console.log("Received destination from navigation:", place);
      setDestination(place.name);
      setSelectedDestination(place);
    }

    // Handle incoming location data
    if (route.params?.selectedLocation) {
      const location = route.params.selectedLocation;
      console.log("Received location:", location);
      setDestination(location.city);
      setSelectedLocation(location);
    }
  }, [route.params]);

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
          ? selectedDestination.mainText
          : destination,
        budget,
        tripDuration,
        preferences,
      };

      // If we have a selected place with placeId, use it
      if (selectedDestination && selectedDestination.placeId) {
        params.placeId = selectedDestination.placeId;
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
    setFullscreenImage(imageUri);
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
            <Text style={styles.planCardTitle}>Top Attractions</Text>
            {plan.destinationData.topAttractions.map((attraction, index) => (
              <View key={index} style={styles.attractionItemContainer}>
                {attraction.photos && attraction.photos.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => openFullscreenImage(attraction.photos[0])}
                    style={styles.attractionImageContainer}
                  >
                    <Image
                      source={{ uri: attraction.photos[0] }}
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
        placeId: selectedDestination?.place_id,
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
                      ? hotel.photos[0].url
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
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 10,
    marginBottom: 5,
    color: "#555",
  },
  recommendationsContainer: {
    padding: 20,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    color: "#3498db",
    fontWeight: "500",
    marginRight: 4,
  },
});

export default AITravelPlanner;
