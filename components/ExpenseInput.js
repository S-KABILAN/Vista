import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const DEFAULT_CATEGORIES = [
  "accommodation",
  "transportation",
  "food",
  "activities",
  "shopping",
  "entertainment",
  "health",
  "other",
];

const ExpenseInput = ({
  onSubmit,
  onClose,
  planId,
  categories = DEFAULT_CATEGORIES,
}) => {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validateInput = () => {
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return false;
    }
    if (!category) {
      setError("Please select a category");
      return false;
    }
    if (!description.trim()) {
      setError("Please enter a description");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateInput()) return;

    setLoading(true);
    setError(null);

    try {
      const expense = {
        amount: parseFloat(amount),
        category,
        description: description.trim(),
        timestamp: new Date(),
        travelPlanId: planId,
      };

      await onSubmit(expense);
    } catch (error) {
      setError("Failed to save expense. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat) => {
    switch (cat) {
      case "accommodation":
        return "hotel";
      case "transportation":
        return "directions-car";
      case "food":
        return "restaurant";
      case "activities":
        return "local-activity";
      case "shopping":
        return "shopping-bag";
      case "entertainment":
        return "movie";
      case "health":
        return "healing";
      default:
        return "category";
    }
  };

  const getCategoryColor = (cat) => {
    switch (cat) {
      case "accommodation":
        return "#FF6B6B";
      case "transportation":
        return "#4ECDC4";
      case "food":
        return "#45B7D1";
      case "activities":
        return "#96CEB4";
      case "shopping":
        return "#FFEEAD";
      case "entertainment":
        return "#D4A5A5";
      case "health":
        return "#9B59B6";
      default:
        return "#95A5A6";
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialIcons name="close" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Add New Expense</Text>
      </View>

      <ScrollView style={styles.content}>
        {error && (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={20} color="#FF3B30" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor="#999"
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryContainer}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.selectedCategory,
                  { backgroundColor: getCategoryColor(cat) },
                ]}
                onPress={() => setCategory(cat)}
              >
                <MaterialIcons
                  name={getCategoryIcon(cat)}
                  size={24}
                  color={category === cat ? "#fff" : "rgba(255,255,255,0.8)"}
                />
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.selectedCategoryText,
                  ]}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter expense description"
            multiline
            numberOfLines={3}
            placeholderTextColor="#999"
          />
        </View>

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <MaterialIcons name="add" size={24} color="#fff" />
              <Text style={styles.submitButtonText}>Add Expense</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
    borderBottomColor: "#ebebeb",
  },
  closeButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFE5E5",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    marginLeft: 8,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 24,
    color: "#666",
    marginRight: 4,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    paddingVertical: 12,
    color: "#333",
  },
  categoryContainer: {
    flexDirection: "row",
    marginHorizontal: -4,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  selectedCategory: {
    opacity: 1,
  },
  categoryText: {
    color: "rgba(255,255,255,0.8)",
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
  },
  selectedCategoryText: {
    color: "#fff",
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: "#333",
    minHeight: 100,
    textAlignVertical: "top",
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default ExpenseInput;
