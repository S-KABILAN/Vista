import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL_ACTUAL as BACKEND_URL } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AIAdvice = ({ expenses, budget, travelPlanId, refreshControl }) => {
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (expenses.length > 0 && budget > 0) {
      fetchAdvice();
    } else {
      setAdvice(null);
      setLoading(false);
    }
  }, [expenses, budget, travelPlanId]);

  const fetchAdvice = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await AsyncStorage.getItem("userToken");
      if (!token) {
        throw new Error("Authentication required");
      }

      // Calculate category-wise totals
      const categorySummary = expenses.reduce((acc, expense) => {
        acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
        return acc;
      }, {});

      // Calculate total spent
      const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      // Calculate days remaining (assuming 30 days for now)
      const daysRemaining = 30;

      const response = await axios.post(
        `${BACKEND_URL}/api/budget/advice`,
        {
          totalSpent,
          categorySummary,
          daysRemaining,
          totalBudget: budget,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAdvice(response.data);
    } catch (error) {
      console.error("Error fetching advice:", error);
      let errorMessage = "Could not load AI advice. Please try again.";

      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else {
          errorMessage =
            error.response.data?.message || "Server error occurred";
        }
      } else if (error.request) {
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      setAdvice(null);
    } finally {
      setLoading(false);
    }
  };

  const renderAdviceSection = (title, content, icon) => (
    <View style={styles.adviceSection}>
      <View style={styles.adviceHeader}>
        <MaterialIcons name={icon} size={24} color="#007AFF" />
        <Text style={styles.adviceTitle}>{title}</Text>
      </View>
      <Text style={styles.adviceContent}>{content}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your spending...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <MaterialIcons name="error-outline" size={50} color="#FF3B30" />
        <Text style={styles.errorTitle}>Oops!</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchAdvice}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!advice) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialIcons name="psychology" size={50} color="#ccc" />
        <Text style={styles.emptyTitle}>No Advice Available</Text>
        <Text style={styles.emptySubtitle}>
          Add some expenses to get personalized budget advice
        </Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={refreshControl}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>AI Budget Insights</Text>
          <Text style={styles.headerSubtitle}>
            Personalized advice based on your spending patterns
          </Text>
        </View>

        {renderAdviceSection("Overall Summary", advice.summary, "assessment")}

        {renderAdviceSection(
          "Recommendations",
          advice.recommendations,
          "lightbulb"
        )}

        {renderAdviceSection(
          "Potential Savings",
          advice.potentialSavings,
          "savings"
        )}

        {renderAdviceSection(
          "Category Insights",
          advice.categoryInsights,
          "category"
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Advice is based on your current spending patterns and budget
          </Text>
        </View>
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ebebeb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 40,
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  emptySubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 40,
  },
  adviceSection: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  adviceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  adviceTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  adviceContent: {
    fontSize: 16,
    color: "#666",
    lineHeight: 24,
  },
  footer: {
    padding: 16,
    alignItems: "center",
  },
  footerText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
});

export default AIAdvice;
