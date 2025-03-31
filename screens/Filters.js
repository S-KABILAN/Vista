import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  TextInput,
  StatusBar,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons, MaterialIcons, FontAwesome } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";

const Filters = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Get initial filter values from route params or set defaults
  const initialFilters = route.params?.filters || {};

  // Budget Range
  const [minBudget, setMinBudget] = useState(initialFilters.minBudget || 0);
  const [maxBudget, setMaxBudget] = useState(initialFilters.maxBudget || 10000);

  // Duration Range
  const [minDuration, setMinDuration] = useState(
    initialFilters.minDuration || 1
  );
  const [maxDuration, setMaxDuration] = useState(
    initialFilters.maxDuration || 30
  );

  // Date Range
  const [startDate, setStartDate] = useState(initialFilters.startDate || "");
  const [endDate, setEndDate] = useState(initialFilters.endDate || "");

  // Trip Types
  const [tripTypes, setTripTypes] = useState(
    initialFilters.tripTypes || {
      beach: false,
      mountain: false,
      city: false,
      countryside: false,
      cultural: false,
      adventure: false,
    }
  );

  // Accommodation Types
  const [accommodationTypes, setAccommodationTypes] = useState(
    initialFilters.accommodationTypes || {
      hotel: false,
      hostel: false,
      apartment: false,
      resort: false,
      villa: false,
      camping: false,
    }
  );

  // Additional Filters
  const [familyFriendly, setFamilyFriendly] = useState(
    initialFilters.familyFriendly || false
  );
  const [petFriendly, setPetFriendly] = useState(
    initialFilters.petFriendly || false
  );
  const [accessibilityOptions, setAccessibilityOptions] = useState(
    initialFilters.accessibilityOptions || false
  );
  const [sustainableTravel, setSustainableTravel] = useState(
    initialFilters.sustainableTravel || false
  );

  // Apply filters and return to previous screen
  const applyFilters = () => {
    const filters = {
      minBudget,
      maxBudget,
      minDuration,
      maxDuration,
      startDate,
      endDate,
      tripTypes,
      accommodationTypes,
      familyFriendly,
      petFriendly,
      accessibilityOptions,
      sustainableTravel,
    };

    // Navigate back with the filter data, preserving any passed parameters
    const returnScreen = route.params?.returnScreen || "AllTrips";
    const params = { filters };

    // If we're returning to TripDetails, make sure to keep the tripId
    if (returnScreen === "TripDetails" && route.params?.tripId) {
      params.tripId = route.params.tripId;
    }

    navigation.navigate({
      name: returnScreen,
      params,
      merge: true,
    });
  };

  // Reset all filters to default values
  const resetFilters = () => {
    setMinBudget(0);
    setMaxBudget(10000);
    setMinDuration(1);
    setMaxDuration(30);
    setStartDate("");
    setEndDate("");
    setTripTypes({
      beach: false,
      mountain: false,
      city: false,
      countryside: false,
      cultural: false,
      adventure: false,
    });
    setAccommodationTypes({
      hotel: false,
      hostel: false,
      apartment: false,
      resort: false,
      villa: false,
      camping: false,
    });
    setFamilyFriendly(false);
    setPetFriendly(false);
    setAccessibilityOptions(false);
    setSustainableTravel(false);
  };

  // Toggle a trip type filter
  const toggleTripType = (type) => {
    setTripTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
  };

  // Toggle an accommodation type filter
  const toggleAccommodationType = (type) => {
    setAccommodationTypes((prev) => ({
      ...prev,
      [type]: !prev[type],
    }));
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
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filters</Text>
        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Budget Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Range (USD)</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeInputContainer}>
              <TextInput
                style={styles.rangeInput}
                value={minBudget.toString()}
                onChangeText={(text) => setMinBudget(parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="Min"
              />
              <Text style={styles.rangeText}>to</Text>
              <TextInput
                style={styles.rangeInput}
                value={maxBudget.toString()}
                onChangeText={(text) => setMaxBudget(parseInt(text) || 0)}
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={10000}
                step={100}
                value={minBudget}
                onValueChange={setMinBudget}
                minimumTrackTintColor="#4A80F0"
                maximumTrackTintColor="#D1D1D6"
                thumbTintColor="#4A80F0"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>$0</Text>
                <Text style={styles.sliderLabel}>$10,000+</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Duration Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Duration (days)</Text>
          <View style={styles.rangeContainer}>
            <View style={styles.rangeInputContainer}>
              <TextInput
                style={styles.rangeInput}
                value={minDuration.toString()}
                onChangeText={(text) => setMinDuration(parseInt(text) || 1)}
                keyboardType="numeric"
                placeholder="Min"
              />
              <Text style={styles.rangeText}>to</Text>
              <TextInput
                style={styles.rangeInput}
                value={maxDuration.toString()}
                onChangeText={(text) => setMaxDuration(parseInt(text) || 1)}
                keyboardType="numeric"
                placeholder="Max"
              />
            </View>
            <View style={styles.sliderContainer}>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={30}
                step={1}
                value={minDuration}
                onValueChange={setMinDuration}
                minimumTrackTintColor="#4A80F0"
                maximumTrackTintColor="#D1D1D6"
                thumbTintColor="#4A80F0"
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>1 day</Text>
                <Text style={styles.sliderLabel}>30+ days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Date Range Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date Range</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateInputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#999" />
              <TextInput
                style={styles.dateInput}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="Start Date (MM/DD/YYYY)"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.dateInputContainer}>
              <Ionicons name="calendar-outline" size={20} color="#999" />
              <TextInput
                style={styles.dateInput}
                value={endDate}
                onChangeText={setEndDate}
                placeholder="End Date (MM/DD/YYYY)"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        {/* Trip Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Types</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[styles.chip, tripTypes.beach && styles.chipSelected]}
              onPress={() => toggleTripType("beach")}
            >
              <FontAwesome
                name="umbrella-beach"
                size={16}
                color={tripTypes.beach ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.beach && styles.chipTextSelected,
                ]}
              >
                Beach
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, tripTypes.mountain && styles.chipSelected]}
              onPress={() => toggleTripType("mountain")}
            >
              <MaterialIcons
                name="terrain"
                size={16}
                color={tripTypes.mountain ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.mountain && styles.chipTextSelected,
                ]}
              >
                Mountain
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, tripTypes.city && styles.chipSelected]}
              onPress={() => toggleTripType("city")}
            >
              <MaterialIcons
                name="location-city"
                size={16}
                color={tripTypes.city ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.city && styles.chipTextSelected,
                ]}
              >
                City
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                tripTypes.countryside && styles.chipSelected,
              ]}
              onPress={() => toggleTripType("countryside")}
            >
              <FontAwesome
                name="tree"
                size={16}
                color={tripTypes.countryside ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.countryside && styles.chipTextSelected,
                ]}
              >
                Countryside
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, tripTypes.cultural && styles.chipSelected]}
              onPress={() => toggleTripType("cultural")}
            >
              <Ionicons
                name="museum-outline"
                size={16}
                color={tripTypes.cultural ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.cultural && styles.chipTextSelected,
                ]}
              >
                Cultural
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.chip, tripTypes.adventure && styles.chipSelected]}
              onPress={() => toggleTripType("adventure")}
            >
              <MaterialIcons
                name="hiking"
                size={16}
                color={tripTypes.adventure ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  tripTypes.adventure && styles.chipTextSelected,
                ]}
              >
                Adventure
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Accommodation Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Accommodation Types</Text>
          <View style={styles.chipContainer}>
            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.hotel && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("hotel")}
            >
              <Ionicons
                name="bed-outline"
                size={16}
                color={accommodationTypes.hotel ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.hotel && styles.chipTextSelected,
                ]}
              >
                Hotel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.hostel && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("hostel")}
            >
              <MaterialIcons
                name="groups"
                size={16}
                color={accommodationTypes.hostel ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.hostel && styles.chipTextSelected,
                ]}
              >
                Hostel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.apartment && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("apartment")}
            >
              <MaterialIcons
                name="apartment"
                size={16}
                color={accommodationTypes.apartment ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.apartment && styles.chipTextSelected,
                ]}
              >
                Apartment
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.resort && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("resort")}
            >
              <Ionicons
                name="sunny-outline"
                size={16}
                color={accommodationTypes.resort ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.resort && styles.chipTextSelected,
                ]}
              >
                Resort
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.villa && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("villa")}
            >
              <Ionicons
                name="home-outline"
                size={16}
                color={accommodationTypes.villa ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.villa && styles.chipTextSelected,
                ]}
              >
                Villa
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.chip,
                accommodationTypes.camping && styles.chipSelected,
              ]}
              onPress={() => toggleAccommodationType("camping")}
            >
              <FontAwesome
                name="campground"
                size={16}
                color={accommodationTypes.camping ? "#FFF" : "#666"}
                style={styles.chipIcon}
              />
              <Text
                style={[
                  styles.chipText,
                  accommodationTypes.camping && styles.chipTextSelected,
                ]}
              >
                Camping
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Filters Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Filters</Text>

          <View style={styles.switchContainer}>
            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Family Friendly</Text>
              <Switch
                value={familyFriendly}
                onValueChange={setFamilyFriendly}
                trackColor={{ false: "#D1D1D6", true: "#4A80F0" }}
                thumbColor={"#FFF"}
                ios_backgroundColor="#D1D1D6"
              />
            </View>

            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Pet Friendly</Text>
              <Switch
                value={petFriendly}
                onValueChange={setPetFriendly}
                trackColor={{ false: "#D1D1D6", true: "#4A80F0" }}
                thumbColor={"#FFF"}
                ios_backgroundColor="#D1D1D6"
              />
            </View>

            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Accessibility Options</Text>
              <Switch
                value={accessibilityOptions}
                onValueChange={setAccessibilityOptions}
                trackColor={{ false: "#D1D1D6", true: "#4A80F0" }}
                thumbColor={"#FFF"}
                ios_backgroundColor="#D1D1D6"
              />
            </View>

            <View style={styles.switchItem}>
              <Text style={styles.switchLabel}>Sustainable Travel</Text>
              <Switch
                value={sustainableTravel}
                onValueChange={setSustainableTravel}
                trackColor={{ false: "#D1D1D6", true: "#4A80F0" }}
                thumbColor={"#FFF"}
                ios_backgroundColor="#D1D1D6"
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Apply Button */}
      <View style={styles.applyButtonContainer}>
        <TouchableOpacity style={styles.applyButton} onPress={applyFilters}>
          <Text style={styles.applyButtonText}>Apply Filters</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  resetButton: {
    padding: 8,
  },
  resetText: {
    fontSize: 14,
    color: "#4A80F0",
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 12,
    color: "#333",
  },
  rangeContainer: {
    marginVertical: 8,
  },
  rangeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rangeInput: {
    width: "45%",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  rangeText: {
    color: "#666",
  },
  sliderContainer: {
    paddingHorizontal: 10,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  sliderLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -8,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666",
  },
  dateContainer: {
    marginVertical: 8,
  },
  dateInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  dateInput: {
    flex: 1,
    fontSize: 14,
    marginLeft: 8,
    color: "#333",
  },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  chipSelected: {
    backgroundColor: "#4A80F0",
  },
  chipIcon: {
    marginRight: 4,
  },
  chipText: {
    fontSize: 12,
    color: "#666",
  },
  chipTextSelected: {
    color: "#FFF",
  },
  switchContainer: {
    marginVertical: 8,
  },
  switchItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  switchLabel: {
    fontSize: 14,
    color: "#333",
  },
  applyButtonContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#EFEFEF",
  },
  applyButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default Filters;
