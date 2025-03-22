import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { googleapis } from "../constants/constant"; // Make sure this file has your API key

const ChangeLocation = ({ route, navigation }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // This can come from route.params if provided by the calling screen
  const returnScreen = route.params?.returnScreen || "Home";
  const onSelectCallback = route.params?.onSelectCallback;

  const handleSearch = async (text) => {
    setQuery(text);
    if (text.length < 3) {
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
      console.error("Error fetching location suggestions:", error);
    }
  };

  const handleSelectLocation = async (placeId) => {
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: googleapis,
          },
        }
      );

      const locationData = response.data.result.geometry.location;
      const city = response.data.result.name;
      const formattedAddress = response.data.result.formatted_address;

      // Create the location object with all necessary data
      const selectedLocation = {
        city,
        lat: locationData.lat,
        lng: locationData.lng,
        formatted_address: formattedAddress,
        place_id: placeId,
      };

      // Check if we have a callback function from the calling screen
      if (onSelectCallback && typeof onSelectCallback === "function") {
        // Execute the callback function with selected location data
        onSelectCallback(selectedLocation);
        navigation.goBack();
      } else {
        // Otherwise use the default behavior - navigate to returnScreen with params
        navigation.navigate(returnScreen, {
          selectedLocation: selectedLocation,
        });
      }
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="black" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Change Location</Text>
        </View>

        <View style={styles.searchbar}>
          <AntDesign name="search1" size={24} color="black" />
          <TextInput
            style={styles.input}
            placeholder="Search for a city..."
            value={query}
            onChangeText={handleSearch}
            onSubmitEditing={() => handleSearch(query)}
          />
        </View>

        <FlatList
          data={suggestions}
          keyExtractor={(item) => item.place_id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.suggestionItem}
              onPress={() => handleSelectLocation(item.place_id)}
            >
              <Text style={styles.suggestionText}>{item.description}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
    paddingTop: StatusBar.currentHeight || 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
  },
  searchbar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 16,
    paddingHorizontal: 10,
    margin: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  suggestionItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginHorizontal: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
});

export default ChangeLocation;
