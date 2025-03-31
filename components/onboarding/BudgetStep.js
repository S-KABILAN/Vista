import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BudgetStep = ({ selectedBudget, onSelectionChange }) => {
  // Predefined budget ranges
  const budgetRanges = [
    {
      id: "budget",
      label: "Budget",
      description: "$0-$1000",
      icon: "wallet-outline",
    },
    {
      id: "moderate",
      label: "Moderate",
      description: "$1000-$3000",
      icon: "card-outline",
    },
    {
      id: "luxury",
      label: "Luxury",
      description: "$3000+",
      icon: "diamond-outline",
    },
    {
      id: "flexible",
      label: "Flexible",
      description: "Varies by trip",
      icon: "options-outline",
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.description}>
        Select your typical budget range for travel. This helps us suggest
        destinations and accommodations that match your spending preferences.
      </Text>

      <View style={styles.optionsContainer}>
        {budgetRanges.map((budget) => (
          <TouchableOpacity
            key={budget.id}
            style={[
              styles.budgetOption,
              selectedBudget === budget.id && styles.selectedOption,
            ]}
            onPress={() => onSelectionChange(budget.id)}
          >
            <View style={styles.optionContent}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={budget.icon}
                  size={24}
                  color={selectedBudget === budget.id ? "#fff" : "#555"}
                />
              </View>
              <View style={styles.textContainer}>
                <Text
                  style={[
                    styles.optionLabel,
                    selectedBudget === budget.id && styles.selectedLabel,
                  ]}
                >
                  {budget.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    selectedBudget === budget.id && styles.selectedDescription,
                  ]}
                >
                  {budget.description}
                </Text>
              </View>
            </View>
            {selectedBudget === budget.id && (
              <View style={styles.checkmark}>
                <Ionicons name="checkmark" size={16} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.helperText}>
        You can always change this later in your profile settings
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
    marginBottom: 20,
  },
  budgetOption: {
    backgroundColor: "#f1f3f5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e9ecef",
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: "#666",
  },
  selectedLabel: {
    color: "#fff",
  },
  selectedDescription: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  checkmark: {
    width: 22,
    height: 22,
    borderRadius: 11,
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

export default BudgetStep;
