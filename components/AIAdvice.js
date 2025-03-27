import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { BACKEND_URL } from "../config";

const AIAdvice = ({ expenses, location, budget }) => {
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const generateAdvice = async () => {
    setLoading(true);
    try {
      // For development/testing, use mock data
      const mockAdvice = {
        budgetStatus: {
          status:
            expenses.reduce((sum, exp) => sum + exp.amount, 0) > budget * 0.8
              ? "warning"
              : "good",
          message:
            expenses.reduce((sum, exp) => sum + exp.amount, 0) > budget * 0.8
              ? `You've used ${(
                  (expenses.reduce((sum, exp) => sum + exp.amount, 0) /
                    budget) *
                  100
                ).toFixed(1)}% of your budget. Consider reducing expenses.`
              : "Your spending is on track with your budget.",
        },
        recommendations: [
          {
            type: "saving",
            title: "Accommodation Tips",
            description:
              "Consider booking hostels or using home-sharing services.",
            impact: "Save up to 30% on accommodation",
            category: "accommodation",
          },
          {
            type: "price",
            title: "Local Transportation",
            description: "Use public transport passes instead of taxis.",
            impact: "Reduce transport costs by 50%",
            category: "transportation",
          },
          {
            type: "budget",
            title: "Food & Dining",
            description:
              "Try local markets and street food for authentic experiences.",
            impact: "Save 25% on food expenses",
            category: "food",
          },
        ],
      };

      // Uncomment below for actual API integration
      /*
      const response = await axios.post(`${BACKEND_URL}/api/budget-suggestion`, {
        destination: location,
        tripDuration: 7, // You might want to pass this as a prop
        currentBudget: budget,
        currentExpenses: expenses,
      });
      setAdvice(response.data);
      */

      setAdvice(mockAdvice);
    } catch (error) {
      console.error("Error generating advice:", error);
      // Show a user-friendly error message or fallback content
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateAdvice();
  }, [expenses, location, budget]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Analyzing your expenses...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient colors={["#2ecc71", "#27ae60"]} style={styles.statusCard}>
        <MaterialIcons
          name={
            advice?.budgetStatus?.status === "warning"
              ? "warning"
              : "check-circle"
          }
          size={40}
          color="white"
        />
        <Text style={styles.statusMessage}>
          {advice?.budgetStatus?.message}
        </Text>
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Smart Recommendations</Text>
        {advice?.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <MaterialIcons name="lightbulb" size={24} color="#007AFF" />
              <Text style={styles.recommendationTitle}>{rec.title}</Text>
            </View>
            <Text style={styles.recommendationDescription}>
              {rec.description}
            </Text>
            <View style={styles.impactContainer}>
              <MaterialIcons name="trending-up" size={20} color="#4CAF50" />
              <Text style={styles.impactText}>{rec.impact}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
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
  statusCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 20,
  },
  statusMessage: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
    marginTop: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 12,
  },
  recommendationCard: {
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  recommendationDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
  },
  impactContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    padding: 8,
    borderRadius: 8,
  },
  impactText: {
    marginLeft: 8,
    color: "#4CAF50",
    fontWeight: "500",
  },
});

export default AIAdvice;
