import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const TravelStyleStep = ({ selectedStyle, onSelectionChange }) => {
  // Travel style options
  const styleOptions = [
    {
      id: "solo",
      label: "Solo Traveler",
      icon: "person-outline",
      description: "I usually travel by myself",
    },
    {
      id: "couple",
      label: "Couples Travel",
      icon: "heart-outline",
      description: "I travel with my partner",
    },
    {
      id: "family",
      label: "Family Travel",
      icon: "people-outline",
      description: "I travel with my family and kids",
    },
    {
      id: "friends",
      label: "Friends Getaways",
      icon: "people-circle-outline",
      description: "I travel with a group of friends",
    },
    {
      id: "business",
      label: "Business Travel",
      icon: "briefcase-outline",
      description: "I primarily travel for work",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        How do you typically travel? This helps us suggest appropriate
        accommodations and activities.
      </Text>

      <View style={styles.optionsContainer}>
        {styleOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.styleOption,
              selectedStyle === option.id && styles.selectedOption,
            ]}
            onPress={() => onSelectionChange(option.id)}
          >
            <View style={styles.optionContent}>
              <View
                style={[
                  styles.iconContainer,
                  selectedStyle === option.id && styles.selectedIconContainer,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={24}
                  color={selectedStyle === option.id ? "#fff" : "#555"}
                />
              </View>
              <View style={styles.optionTextContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    selectedStyle === option.id && styles.selectedText,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    selectedStyle === option.id && styles.selectedDescription,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
            </View>
            {selectedStyle === option.id && (
              <Ionicons
                name="checkmark-circle"
                size={24}
                color="#fff"
                style={styles.checkIcon}
              />
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.helperText}>
        You can always change this setting in your profile
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
  optionsContainer: {
    marginBottom: 16,
  },
  styleOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8f9fa",
    borderWidth: 1,
    borderColor: "#e9ecef",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  selectedOption: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
  },
  optionContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#e9ecef",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  selectedIconContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  optionTextContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: "#777",
  },
  selectedText: {
    color: "#fff",
  },
  selectedDescription: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  checkIcon: {
    marginLeft: 8,
  },
  helperText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginTop: 8,
  },
});

export default TravelStyleStep;
