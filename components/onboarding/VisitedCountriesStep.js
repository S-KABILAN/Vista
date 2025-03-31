import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Sample list of popular countries
const popularCountries = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "France",
  "Italy",
  "Spain",
  "Germany",
  "Japan",
  "China",
  "Australia",
  "Brazil",
  "India",
  "Thailand",
  "Greece",
];

const VisitedCountriesStep = ({ selectedCountries, onSelectionChange }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredCountries, setFilteredCountries] = useState(popularCountries);

  // Handle search input change
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === "") {
      setFilteredCountries(popularCountries);
    } else {
      const filtered = popularCountries.filter((country) =>
        country.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredCountries(filtered);
    }
  };

  // Toggle country selection
  const toggleCountrySelection = (country) => {
    if (selectedCountries.includes(country)) {
      onSelectionChange(selectedCountries.filter((c) => c !== country));
    } else {
      onSelectionChange([...selectedCountries, country]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Select countries you've already visited. This helps us suggest new
        destinations that match your travel style.
      </Text>

      {/* Search input */}
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={18}
          color="#888"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search countries..."
          value={searchQuery}
          onChangeText={handleSearch}
          placeholderTextColor="#999"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => handleSearch("")}>
            <Ionicons name="close-circle" size={18} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {/* Selected countries */}
      {selectedCountries.length > 0 && (
        <View style={styles.selectedCountriesContainer}>
          <Text style={styles.sectionTitle}>Your visited countries</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedCountriesScroll}
          >
            {selectedCountries.map((country) => (
              <TouchableOpacity
                key={country}
                style={styles.selectedCountryChip}
                onPress={() => toggleCountrySelection(country)}
              >
                <Text style={styles.selectedCountryText}>{country}</Text>
                <Ionicons
                  name="close-circle"
                  size={16}
                  color="#fff"
                  style={styles.removeIcon}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Country list */}
      <View style={styles.countriesListContainer}>
        <Text style={styles.sectionTitle}>
          {searchQuery ? "Search results" : "Popular countries"}
        </Text>
        <FlatList
          data={filteredCountries}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.countryItem,
                selectedCountries.includes(item) && styles.selectedCountryItem,
              ]}
              onPress={() => toggleCountrySelection(item)}
            >
              <Text
                style={[
                  styles.countryName,
                  selectedCountries.includes(item) &&
                    styles.selectedCountryName,
                ]}
              >
                {item}
              </Text>
              {selectedCountries.includes(item) && (
                <Ionicons name="checkmark-circle" size={20} color="#3498db" />
              )}
            </TouchableOpacity>
          )}
          style={styles.countryList}
        />
      </View>

      <Text style={styles.helperText}>
        Don't worry if a country isn't listed - you can always update your
        profile later
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  description: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
    lineHeight: 22,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  selectedCountriesContainer: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  selectedCountriesScroll: {
    flexDirection: "row",
  },
  selectedCountryChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  selectedCountryText: {
    color: "#fff",
    fontSize: 14,
    marginRight: 4,
  },
  removeIcon: {
    marginLeft: 2,
  },
  countriesListContainer: {
    flex: 1,
  },
  countryList: {
    height: 300,
  },
  countryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  selectedCountryItem: {
    backgroundColor: "#f1f9fe",
  },
  countryName: {
    fontSize: 16,
    color: "#333",
  },
  selectedCountryName: {
    color: "#3498db",
    fontWeight: "500",
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 16,
  },
});

export default VisitedCountriesStep;
