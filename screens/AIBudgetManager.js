import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Platform,
  Modal,
} from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ExpenseOverview from "../components/ExpenseOverview";
import AIAdvice from "../components/AIAdvice";
import ExpenseInput from "../components/ExpenseInput";
import ExpenseList from "../components/ExpenseList";
import axios from "axios";
import { BACKEND_URL_ACTUAL as BACKEND_URL } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

const BUDGET_TABS = ["Overview", "Expenses", "AI Advice"];

const AIBudgetManager = ({ route, navigation }) => {
  const { plan } = route.params || { plan: null };
  const [activeTab, setActiveTab] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(plan?.budget || 5000);
  const [showExpenseInput, setShowExpenseInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const headerOpacity = new Animated.Value(0);

  // Initial animations
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Load expenses whenever the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadExpenses();
      return () => {
        // Cleanup if needed
      };
    }, [plan?._id])
  );

  const loadExpenses = async () => {
    try {
      setError(null);
      if (!refreshing) setLoading(true);

      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        setError("Authentication required. Please log in again.");
        return;
      }

      if (!plan?._id) {
        setError("No travel plan selected");
        return;
      }

      const response = await axios.get(
        `${BACKEND_URL}/api/expenses/plan/${plan._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data && Array.isArray(response.data)) {
        setExpenses(response.data);
        if (response.data.length === 0) {
          // Don't set this as an error, it's a valid state
          setError(null);
        }
      } else {
        setExpenses([]);
        setError("Invalid response format from server");
      }
    } catch (error) {
      console.error("Error loading expenses:", error);
      let errorMessage = "Could not load expenses. Please try again.";

      if (error.response) {
        // Server responded with an error status code
        if (error.response.status === 401) {
          errorMessage = "Your session has expired. Please log in again.";
        } else if (error.response.status === 404) {
          errorMessage = "Travel plan not found";
        } else {
          errorMessage =
            error.response.data?.message || "Server error occurred";
        }
      } else if (error.request) {
        // Network error
        errorMessage = "Network error. Please check your connection.";
      }

      setError(errorMessage);
      setExpenses([]); // Clear expenses on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExpenses();
  };

  const handleAddExpense = async (expense) => {
    try {
      // Show immediate feedback by adding to local state with a temporary ID
      const tempExpense = {
        ...expense,
        id: `temp-${Date.now()}`,
        timestamp: new Date(),
      };

      setExpenses((prevExpenses) => [...prevExpenses, tempExpense]);
      setShowExpenseInput(false);

      // Get token for authentication
      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert(
          "Authentication Error",
          "Please log in again to add expenses"
        );
        return;
      }

      // Save to server
      const response = await axios.post(
        `${BACKEND_URL}/api/expenses`,
        {
          ...expense,
          travelPlanId: plan._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      // Replace the temporary expense with the saved one
      setExpenses((prevExpenses) =>
        prevExpenses.map((exp) =>
          exp.id === tempExpense.id ? response.data : exp
        )
      );
    } catch (error) {
      console.error("Error adding expense:", error);

      // Remove the temporary expense on error
      setExpenses((prevExpenses) =>
        prevExpenses.filter((exp) => !exp.id?.toString().startsWith("temp-"))
      );

      Alert.alert(
        "Error Adding Expense",
        "There was a problem saving your expense. Please try again."
      );
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      // Optimistic update - remove from UI immediately
      setExpenses((prevExpenses) =>
        prevExpenses.filter((exp) => exp._id !== id && exp.id !== id)
      );

      const token = await AsyncStorage.getItem("userToken");

      if (!token) {
        Alert.alert(
          "Authentication Error",
          "Please log in again to delete expenses"
        );
        return;
      }

      // Delete from server
      await axios.delete(`${BACKEND_URL}/api/expenses/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("Error deleting expense:", error);

      // Reload expenses on error to restore UI state
      loadExpenses();

      Alert.alert(
        "Error Deleting Expense",
        "There was a problem deleting your expense. Please try again."
      );
    }
  };

  const handleEditBudget = () => {
    Alert.prompt(
      "Update Budget",
      "Enter new budget amount",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Update",
          onPress: (value) => {
            const newBudget = parseFloat(value);
            if (!isNaN(newBudget) && newBudget > 0) {
              setTotalBudget(newBudget);
            } else {
              Alert.alert(
                "Invalid Input",
                "Please enter a valid budget amount"
              );
            }
          },
        },
      ],
      "plain-text",
      totalBudget.toString()
    );
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: headerOpacity }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {plan?.destination ? `${plan.destination} Budget` : "Budget Manager"}
      </Text>
      <TouchableOpacity
        onPress={() =>
          Alert.alert(
            "Coming soon!",
            "Additional budget settings will be available in a future update."
          )
        }
      >
        <MaterialIcons name="settings" size={24} color="#333" />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBudgetSummary = () => {
    const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = totalBudget - totalSpent;
    const spentPercentage = (totalSpent / totalBudget) * 100;
    const isOverBudget = remaining < 0;

    let gradientColors = ["#2ecc71", "#27ae60"]; // Default green

    if (spentPercentage > 80) {
      gradientColors = ["#f39c12", "#e67e22"]; // Orange warning
    }

    if (isOverBudget) {
      gradientColors = ["#e74c3c", "#c0392b"]; // Red alert
    }

    return (
      <TouchableOpacity onPress={handleEditBudget} activeOpacity={0.8}>
        <LinearGradient
          colors={gradientColors}
          style={styles.budgetSummaryCard}
        >
          <View style={styles.budgetSummaryContent}>
            <Text style={styles.budgetSummaryTitle}>Total Budget</Text>
            <Text style={styles.budgetSummaryAmount}>
              ${totalBudget.toFixed(2)}
            </Text>

            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(spentPercentage, 100)}%`,
                      backgroundColor: isOverBudget
                        ? "#e74c3c"
                        : spentPercentage > 80
                        ? "#f39c12"
                        : "#2ecc71",
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {spentPercentage.toFixed(0)}% Spent
              </Text>
            </View>

            <View style={styles.budgetSummaryDetails}>
              <View style={styles.budgetSummaryItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome5 name="wallet" size={18} color="white" />
                </View>
                <Text style={styles.budgetSummaryLabel}>Spent</Text>
                <Text style={styles.budgetSummaryValue}>
                  ${totalSpent.toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.budgetSummaryItem}>
                <View style={styles.iconContainer}>
                  <FontAwesome5
                    name="money-bill-wave"
                    size={18}
                    color="white"
                  />
                </View>
                <Text style={styles.budgetSummaryLabel}>Remaining</Text>
                <Text
                  style={[
                    styles.budgetSummaryValue,
                    isOverBudget && styles.overBudgetText,
                  ]}
                >
                  ${remaining.toFixed(2)}
                </Text>
              </View>
            </View>

            <View style={styles.editHintContainer}>
              <MaterialIcons
                name="edit"
                size={12}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={styles.editHintText}>Tap to edit budget</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {BUDGET_TABS.map((tab, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.tab, activeTab === index && styles.activeTab]}
          onPress={() => setActiveTab(index)}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === index && styles.activeTabText,
            ]}
          >
            {tab}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading your expenses...</Text>
        </View>
      );
    }

    // Only show error state if we have an error and no expenses
    if (error && expenses.length === 0) {
      return (
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={50} color="#FF3B30" />
          <Text style={styles.errorTitle}>Oops!</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadExpenses}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // If we have no expenses but no error, show empty state instead of error
    if (expenses.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <FontAwesome5 name="money-bill-wave" size={50} color="#ccc" />
          <Text style={styles.emptyTitle}>No Expenses Yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking your travel spending by adding your first expense
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => setShowExpenseInput(true)}
          >
            <Text style={styles.emptyButtonText}>Add Your First Expense</Text>
          </TouchableOpacity>
        </View>
      );
    }

    switch (activeTab) {
      case 0: // Overview
        return (
          <ExpenseOverview
            expenses={expenses}
            totalBudget={totalBudget}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
      case 1: // Expenses
        return (
          <ExpenseList
            expenses={expenses}
            onDeleteExpense={handleDeleteExpense}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
      case 2: // AI Advice
        return (
          <AIAdvice
            expenses={expenses}
            budget={totalBudget}
            travelPlanId={plan?._id}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f9f9f9" />
      {renderHeader()}
      {renderBudgetSummary()}
      {renderTabBar()}

      <View style={styles.contentContainer}>{renderContent()}</View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowExpenseInput(true)}
      >
        <MaterialIcons name="add" size={28} color="white" />
      </TouchableOpacity>

      <Modal
        visible={showExpenseInput}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowExpenseInput(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <ExpenseInput
              onSubmit={handleAddExpense}
              onClose={() => setShowExpenseInput(false)}
              planId={plan?._id}
              categories={[
                "accommodation",
                "transportation",
                "food",
                "activities",
                "shopping",
              ]}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#ebebeb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  backButton: {
    padding: 4,
  },
  budgetSummaryCard: {
    margin: 16,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  budgetSummaryContent: {
    alignItems: "center",
  },
  budgetSummaryTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "500",
  },
  budgetSummaryAmount: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 8,
  },
  progressContainer: {
    width: "100%",
    marginVertical: 8,
    alignItems: "center",
  },
  progressBar: {
    height: 8,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    color: "white",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  budgetSummaryDetails: {
    flexDirection: "row",
    width: "100%",
    justifyContent: "space-around",
    marginTop: 12,
    alignItems: "center",
  },
  budgetSummaryItem: {
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    marginBottom: 4,
  },
  divider: {
    height: 40,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  budgetSummaryLabel: {
    color: "white",
    opacity: 0.9,
    fontSize: 14,
  },
  budgetSummaryValue: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 2,
  },
  overBudgetText: {
    color: "#ffcdd2",
  },
  editHintContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  editHintText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 12,
    margin: 16,
    marginTop: 0,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#f0f7ff",
  },
  tabText: {
    marginTop: 4,
    fontSize: 12,
    color: "#666",
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
  contentContainer: {
    flex: 1,
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
  emptyButton: {
    marginTop: 20,
    backgroundColor: "#007AFF",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
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
  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 30,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    maxHeight: "90%",
  },
});

export default AIBudgetManager;
