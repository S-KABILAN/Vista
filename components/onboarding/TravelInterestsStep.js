import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TravelInterestsStep = ({ selectedInterests, onSelectionChange }) => {
  // Predefined list of travel interests
  const interestOptions = [
    { id: "adventure", label: "Adventure", icon: "compass-outline" },
    { id: "beaches", label: "Beaches", icon: "sunny-outline" },
    { id: "culture", label: "Culture", icon: "library-outline" },
    { id: "food", label: "Food & Cuisine", icon: "restaurant-outline" },
    { id: "history", label: "History", icon: "time-outline" },
    { id: "nature", label: "Nature", icon: "leaf-outline" },
    { id: "nightlife", label: "Nightlife", icon: "wine-outline" },
    { id: "relaxation", label: "Relaxation", icon: "bed-outline" },
    { id: "shopping", label: "Shopping", icon: "bag-outline" },
    { id: "wildlife", label: "Wildlife", icon: "paw-outline" },
    { id: "wellness", label: "Wellness", icon: "fitness-outline" },
    { id: "urban", label: "Urban Exploration", icon: "business-outline" },
  ];

  // Toggle interest selection
  const toggleInterest = (interestId) => {
    if (selectedInterests.includes(interestId)) {
      onSelectionChange(selectedInterests.filter((id) => id !== interestId));
    } else {
      onSelectionChange([...selectedInterests, interestId]);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Select the travel experiences that interest you the most. We'll use this
        to customize your recommendations.
      </Text>

      <View style={styles.optionsGrid}>
        {interestOptions.map((interest) => (
          <TouchableOpacity
            key={interest.id}
            style={[
              styles.interestOption,
              selectedInterests.includes(interest.id) && styles.selectedOption,
            ]}
            onPress={() => toggleInterest(interest.id)}
          >
            <Ionicons
              name={interest.icon}
              size={24}
              color={selectedInterests.includes(interest.id) ? "#fff" : "#555"}
              style={styles.interestIcon}
            />
            <Text
              style={[
                styles.interestLabel,
                selectedInterests.includes(interest.id) && styles.selectedLabel,
              ]}
            >
              {interest.label}
            </Text>
            {selectedInterests.includes(interest.id) && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={14} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.helperText}>
        Select at least 3 interests for better recommendations
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
    marginBottom: 24,
    lineHeight: 22,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  interestOption: {
    width: "48%",
    backgroundColor: "#f1f3f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  selectedOption: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  interestIcon: {
    marginRight: 12,
  },
  interestLabel: {
    fontSize: 15,
    color: "#333",
    fontWeight: "500",
    flex: 1,
  },
  selectedLabel: {
    color: "#fff",
  },
  checkmark: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
});

export default TravelInterestsStep;
