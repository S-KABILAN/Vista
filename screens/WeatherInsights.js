import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  FlatList,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const WeatherInsights = ({ route, navigation }) => {
  const { destination, startDate, endDate } = route.params || {
    destination: "Paris",
    startDate: null,
    endDate: null,
  };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);

  useEffect(() => {
    fetchWeatherRecommendations();
  }, [destination, startDate, endDate]);

  const fetchWeatherRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TravelPlanService.getWeatherRecommendations(
        destination,
        {
          startDate,
          endDate,
        }
      );

      console.log("Weather recommendations:", response);
      setWeatherData(response.weatherData);
      setRecommendations(response.recommendations);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching weather recommendations:", error);
      setError(error.toString());
      setLoading(false);
    }
  };

  const toggleSection = (sectionIndex) => {
    if (expandedSection === sectionIndex) {
      setExpandedSection(null);
    } else {
      setExpandedSection(sectionIndex);
    }
  };

  const getWeatherIcon = (condition) => {
    if (!condition) return "cloud-question";

    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes("rain")) return "weather-rainy";
    if (conditionLower.includes("snow")) return "weather-snowy";
    if (conditionLower.includes("thunder")) return "weather-lightning";
    if (conditionLower.includes("fog")) return "weather-fog";
    if (conditionLower.includes("clear")) return "weather-sunny";
    if (conditionLower.includes("sunny")) return "weather-sunny";
    if (conditionLower.includes("cloud")) return "weather-cloudy";
    if (conditionLower.includes("partly")) return "weather-partly-cloudy";

    return "cloud-question";
  };

  const renderForecastItem = ({ item }) => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const dayMonth = date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

    return (
      <View style={styles.forecastItem}>
        <View style={styles.forecastDay}>
          <Text style={styles.dayName}>{dayName}</Text>
          <Text style={styles.dayDate}>{dayMonth}</Text>
        </View>

        <View style={styles.forecastWeather}>
          <MaterialCommunityIcons
            name={`weather-${getWeatherIcon(item.condition)}`}
            size={24}
            color="#4c669f"
          />
          <Text style={styles.forecastCondition}>{item.condition}</Text>
        </View>

        <View style={styles.forecastTemps}>
          <Text style={styles.tempHigh}>{item.highTemp}°</Text>
          <Text style={styles.tempLow}>{item.lowTemp}°</Text>
        </View>
      </View>
    );
  };

  const getSectionIcon = (title) => {
    switch (title.toLowerCase()) {
      case "weather summary":
        return "cloud";
      case "packing recommendations":
        return "suitcase";
      case "activity recommendations":
        return "calendar";
      case "weather-related travel tips":
        return "umbrella";
      default:
        return "information-circle";
    }
  };

  const renderRecommendationSection = (section, index) => {
    const isExpanded = expandedSection === index;
    const icon = getSectionIcon(section.title);

    return (
      <View key={index} style={styles.sectionCard}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection(index)}
        >
          <View style={styles.sectionTitleContainer}>
            <Ionicons name={icon} size={20} color="#4c669f" />
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color="#777"
          />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.sectionContent}>
            <Text style={styles.sectionContentText}>{section.content}</Text>
          </View>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#4c669f" />
        <Text style={styles.loadingText}>
          Analyzing weather patterns for {destination}...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchWeatherRecommendations}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Weather in {destination}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchWeatherRecommendations}
        >
          <Ionicons name="refresh" size={24} color="#4c669f" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Weather forecast section */}
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastTitle}>Weather Forecast</Text>
          {weatherData && (
            <FlatList
              data={weatherData}
              renderItem={renderForecastItem}
              keyExtractor={(item) => item.date}
              horizontal={false}
              scrollEnabled={false}
              contentContainerStyle={styles.forecastList}
            />
          )}
        </View>

        {/* Recommendations sections */}
        <View style={styles.recommendationsContainer}>
          <Text style={styles.recommendationsTitle}>
            AI Weather Recommendations
          </Text>

          {recommendations &&
            recommendations.map((section, index) =>
              renderRecommendationSection(section, index)
            )}
        </View>
      </ScrollView>
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
    justifyContent: "space-between",
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
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  errorText: {
    textAlign: "center",
    marginTop: 8,
    color: "#555",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#4c669f",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  forecastContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  forecastTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  forecastList: {
    paddingTop: 4,
  },
  forecastItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  forecastDay: {
    width: 70,
  },
  dayName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  dayDate: {
    fontSize: 12,
    color: "#777",
  },
  forecastWeather: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  forecastCondition: {
    marginLeft: 8,
    fontSize: 14,
    color: "#555",
  },
  forecastTemps: {
    width: 70,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  tempHigh: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#ff6b6b",
  },
  tempLow: {
    fontSize: 14,
    color: "#4c669f",
    marginLeft: 8,
  },
  recommendationsContainer: {
    marginTop: 24,
    marginHorizontal: 16,
  },
  recommendationsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 12,
    color: "#333",
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  sectionContentText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
  },
});

export default WeatherInsights;
