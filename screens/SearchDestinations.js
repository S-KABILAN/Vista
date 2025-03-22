import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  TextInput,
  FlatList,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import axios from "axios";
import { googleapis } from "../constants/constant"; // Make sure this file exists

const SearchDestinations = ({ navigation }) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState(null);

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

      // Set the selected destination
      setSelectedDestination({
        name: city,
        placeId: placeId,
        coordinates: locationData,
        formattedAddress: response.data.result.formatted_address
      });
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  const handleProceed = () => {
    if (selectedDestination) {
      // Navigate back to AITravelPlanner with the selected destination
      navigation.navigate("AITravelPlanner", { selectedDestination });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <AntDesign name="arrowleft" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Find Your Destination</Text>
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

      {selectedDestination && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedTitle}>Selected Destination:</Text>
          <Text style={styles.selectedText}>{selectedDestination.name}</Text>
          <Text style={styles.selectedAddress}>{selectedDestination.formattedAddress}</Text>
          
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedButtonText}>Use This Destination</Text>
          </TouchableOpacity>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
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
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  suggestionItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginHorizontal: 16,
  },
  suggestionText: {
    fontSize: 16,
    color: "#333",
  },
  selectedContainer: {
    margin: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  selectedTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  selectedText: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  selectedAddress: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  proceedButton: {
    backgroundColor: "#4466EE",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  proceedButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SearchDestinations;
