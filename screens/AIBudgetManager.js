import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import ExpenseOverview from "../components/ExpenseOverview";
import AIAdvice from "../components/AIAdvice";
import BudgetCard from "../components/BudgetCard";
import ExpenseInput from "../components/ExpenseInput";
import ExpenseList from "../components/ExpenseList";

const AIBudgetManager = ({ route, navigation }) => {
  const { plan } = route.params || { plan: null };
  const [activeTab, setActiveTab] = useState("overview");
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(plan?.budget || 5000);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [loading, setLoading] = useState(false);
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    loadExpenses();
  }, []);

  const loadExpenses = async () => {
    try {
      const mockExpenses = [
        {
          id: 1,
          amount: 1200,
          category: "accommodation",
          description: "Hotel booking",
          timestamp: new Date(),
        },
        {
          id: 2,
          amount: 300,
          category: "transportation",
          description: "Flight tickets",
          timestamp: new Date(),
        },
      ];
      setExpenses(mockExpenses);
    } catch (error) {
      Alert.alert("Error", "Failed to load expenses");
    }
  };

  const handleAddExpense = (expense) => {
    const newExpense = {
      id: Date.now(),
      ...expense,
      timestamp: new Date(),
    };
    setExpenses([...expenses, newExpense]);
    setShowAddExpense(false);
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>
        {plan?.destination ? `${plan.destination} Budget` : "Budget Manager"}
      </Text>
      <TouchableOpacity onPress={() => Alert.alert("Coming soon!")}>
        <MaterialIcons name="settings" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );

  const renderBudgetSummary = () => (
    <LinearGradient
      colors={["#2ecc71", "#27ae60"]}
      style={styles.budgetSummaryCard}
    >
      <View style={styles.budgetSummaryContent}>
        <Text style={styles.budgetSummaryTitle}>Total Budget</Text>
        <Text style={styles.budgetSummaryAmount}>${totalBudget}</Text>
        <View style={styles.budgetSummaryDetails}>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Spent</Text>
            <Text style={styles.budgetSummaryValue}>
              ${expenses.reduce((sum, exp) => sum + exp.amount, 0)}
            </Text>
          </View>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Remaining</Text>
            <Text style={styles.budgetSummaryValue}>
              $
              {totalBudget - expenses.reduce((sum, exp) => sum + exp.amount, 0)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      {["overview", "expenses", "advice"].map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tab, activeTab === tab && styles.activeTab]}
          onPress={() => setActiveTab(tab)}
        >
          <MaterialIcons
            name={
              tab === "overview"
                ? "dashboard"
                : tab === "expenses"
                ? "receipt"
                : "lightbulb"
            }
            size={24}
            color={activeTab === tab ? "#007AFF" : "#666"}
          />
          <Text
            style={[styles.tabText, activeTab === tab && styles.activeTabText]}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <ExpenseOverview expenses={expenses} totalBudget={totalBudget} />
        );
      case "expenses":
        return (
          <View style={styles.expensesContainer}>
            <ExpenseList
              expenses={expenses}
              onDeleteExpense={(id) => {
                setExpenses(expenses.filter((exp) => exp.id !== id));
              }}
            />
            <TouchableOpacity
              style={styles.addExpenseButton}
              onPress={() => setShowAddExpense(true)}
            >
              <MaterialIcons name="add" size={24} color="white" />
              <Text style={styles.addExpenseButtonText}>Add Expense</Text>
            </TouchableOpacity>
          </View>
        );
      case "advice":
        return (
          <AIAdvice
            expenses={expenses}
            location={plan?.destination}
            budget={totalBudget}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      {renderBudgetSummary()}
      {renderTabBar()}

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {renderContent()}
      </Animated.View>

      {showAddExpense && (
        <ExpenseInput
          onSubmit={handleAddExpense}
          onClose={() => setShowAddExpense(false)}
          categories={[
            "accommodation",
            "transportation",
            "food",
            "activities",
            "shopping",
            "other",
          ]}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "white",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  budgetSummaryCard: {
    margin: 16,
    borderRadius: 12,
    padding: 20,
  },
  budgetSummaryContent: {
    alignItems: "center",
  },
  budgetSummaryTitle: {
    color: "white",
    fontSize: 16,
    opacity: 0.9,
  },
  budgetSummaryAmount: {
    color: "white",
    fontSize: 36,
    fontWeight: "bold",
    marginVertical: 8,
  },
  budgetSummaryDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 16,
  },
  budgetSummaryItem: {
    alignItems: "center",
  },
  budgetSummaryLabel: {
    color: "white",
    opacity: 0.9,
    fontSize: 14,
  },
  budgetSummaryValue: {
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    marginTop: 4,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#007AFF",
  },
  tabText: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  activeTabText: {
    color: "#007AFF",
    fontWeight: "500",
  },
  content: {
    flex: 1,
  },
  expensesContainer: {
    flex: 1,
    padding: 16,
  },
  addExpenseButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#007AFF",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  addExpenseButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default AIBudgetManager;
