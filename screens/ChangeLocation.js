import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import axios from "axios";
import * as Location from "expo-location";
import { googleapis } from "../constants/constant";

const ChangeLocation = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const returnScreen = route.params?.returnScreen || "MainTabs";

  const getCurrentLocation = async () => {
    try {
      setLoading(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Please enable location services to use this feature"
        );
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${googleapis}`
      );

      if (response.data.results.length > 0) {
        const addressComponents = response.data.results[0].address_components;
        const cityComponent = addressComponents.find(
          (component) =>
            component.types.includes("locality") ||
            component.types.includes("administrative_area_level_1")
        );

        const city = cityComponent
          ? cityComponent.long_name
          : "Unknown Location";
        const locationData = {
          city,
          lat: location.coords.latitude,
          lng: location.coords.longitude,
          current: true,
        };

        navigation.navigate("MainTabs", {
          screen: "Home",
          params: { selectedLocation: locationData },
        });
      }
    } catch (error) {
      console.error("Error getting current location:", error);
      Alert.alert("Error", "Failed to get current location");
    } finally {
      setLoading(false);
    }
  };

  const searchLocations = async (text) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: text,
            key: googleapis,
            types: "(cities)",
          },
        }
      );

      setSuggestions(response.data.predictions);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      Alert.alert("Error", "Failed to fetch location suggestions");
    }
  };

  const handleLocationSelect = async (prediction) => {
    try {
      setLoading(true);

      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: prediction.place_id,
            key: googleapis,
            fields: "geometry,formatted_address,name",
          },
        }
      );

      if (response.data.result) {
        const locationData = {
          city: prediction.structured_formatting.main_text,
          lat: response.data.result.geometry.location.lat,
          lng: response.data.result.geometry.location.lng,
          formatted_address: response.data.result.formatted_address,
        };

        navigation.navigate("MainTabs", {
          screen: "Home",
          params: { selectedLocation: locationData },
        });
      }
    } catch (error) {
      console.error("Error selecting location:", error);
      Alert.alert("Error", "Failed to get location details");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Change Location</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for a city..."
            value={searchQuery}
            onChangeText={searchLocations}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={styles.currentLocationButton}
          onPress={getCurrentLocation}
          disabled={loading}
        >
          <Ionicons name="location" size={20} color="#007AFF" />
          <Text style={styles.currentLocationText}>Current Location</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleLocationSelect(item)}
            >
              <Ionicons name="location-outline" size={20} color="#666" />
              <View style={styles.suggestionText}>
                <Text style={styles.mainText}>
                  {item.structured_formatting.main_text}
                </Text>
                <Text style={styles.secondaryText}>
                  {item.structured_formatting.secondary_text}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  currentLocationButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  currentLocationText: {
    marginLeft: 8,
    color: "#007AFF",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  suggestionText: {
    marginLeft: 12,
    flex: 1,
  },
  mainText: {
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryText: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
});

export default ChangeLocation;
