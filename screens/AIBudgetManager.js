import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
  Easing,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import { Picker } from "@react-native-picker/picker";
import { useFonts } from "expo-font";
import Tabbar from "../components/Tabbar";
import {
  AntDesign,
  FontAwesome5,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");
const BACKEND_URL = "http://192.168.6.149:3001"; // Replace with your actual ngrok URL

const EXPENSE_CATEGORIES = [
  { label: "Accommodation", icon: "bed", color: "#4FC3F7" },
  { label: "Food", icon: "restaurant", color: "#FF8A65" },
  { label: "Transportation", icon: "car", color: "#7986CB" },
  { label: "Activities", icon: "map", color: "#81C784" },
  { label: "Shopping", icon: "shopping-bag", color: "#BA68C8" },
  { label: "Other", icon: "apps", color: "#A1887F" },
];

const AIBudgetManager = ({ route, navigation }) => {
  const [fontsLoaded] = useFonts({
    Candara: require("../assets/Candara.ttf"),
  });

  const { plan } = route.params || { plan: null };
  const destinationName = plan?.destination || "Your Trip";

  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const progressAnim = new Animated.Value(0);

  // State variables
  const [budget, setBudget] = useState(
    plan?.budget ? plan.budget.toString() : "1000"
  );
  const [expenses, setExpenses] = useState([]);
  const [totalBudget, setTotalBudget] = useState(
    plan?.budget ? parseInt(plan.budget) : 1000
  );
  const [remainingBudget, setRemainingBudget] = useState(
    plan?.budget ? parseInt(plan.budget) : 1000
  );
  const [loading, setLoading] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Accommodation");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [activeTab, setActiveTab] = useState("overview"); // overview, expenses, advice
  const [showAddExpense, setShowAddExpense] = useState(false);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    if (expenses.length > 0) {
      const total = expenses.reduce(
        (sum, item) => sum + parseFloat(item.amount),
        0
      );
      setRemainingBudget(totalBudget - total);

      // Animate progress bar
      Animated.timing(progressAnim, {
        toValue: Math.min(1, total / totalBudget),
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(progressAnim, {
        toValue: 0,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [expenses, totalBudget]);

  const setBudgetValue = () => {
    const budgetValue = parseFloat(budget);
    if (!isNaN(budgetValue) && budgetValue > 0) {
      setTotalBudget(budgetValue);
      setRemainingBudget(
        budgetValue -
          expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0)
      );
    } else {
      Alert.alert("Invalid Budget", "Please enter a valid budget amount");
    }
  };

  const addExpense = () => {
    const amount = parseFloat(expenseAmount);
    if (!isNaN(amount) && amount > 0 && expenseDescription) {
      // Get category color
      const categoryObj =
        EXPENSE_CATEGORIES.find((cat) => cat.label === expenseCategory) ||
        EXPENSE_CATEGORIES[5]; // Default to "Other"

      const newExpense = {
        id: Date.now().toString(),
        category: expenseCategory,
        amount: amount,
        description: expenseDescription,
        date: new Date().toISOString(),
        color: categoryObj.color,
        icon: categoryObj.icon,
      };

      setExpenses([...expenses, newExpense]);
      setExpenseAmount("");
      setExpenseDescription("");
      setShowAddExpense(false);
    } else {
      Alert.alert(
        "Invalid Expense",
        "Please enter a valid amount and description"
      );
    }
  };

  const getAIBudgetSuggestion = async () => {
    if (!plan?.destination) {
      Alert.alert("Missing Information", "Please provide a destination first");
      return;
    }

    setLoading(true);

    try {
      // For demo purposes, generate a mock suggestion if backend unavailable
      setTimeout(() => {
        const mockSuggestion = generateMockSuggestion();
        setSuggestion(mockSuggestion);
        setLoading(false);
      }, 2000);

      /* Uncomment for real API usage:
      const response = await axios.post(
        `${BACKEND_URL}/api/budget-suggestion`,
        {
          destination: plan.destination,
          tripDuration: plan.itinerary ? plan.itinerary.length : 5,
          currentBudget: totalBudget,
          currentExpenses: expenses,
        }
      );

      setSuggestion(response.data.suggestion);
      setLoading(false);
      */
    } catch (error) {
      console.error("Error getting budget suggestion:", error);

      // Fallback to mock suggestion for demo
      const mockSuggestion = generateMockSuggestion();
      setSuggestion(mockSuggestion);

      setLoading(false);
    }
  };

  const generateMockSuggestion = () => {
    const remainingPercent = (remainingBudget / totalBudget) * 100;

    if (remainingPercent < 20) {
      return `Based on your current spending for ${destinationName}, you're using your budget quickly. Consider setting aside 20% for unexpected expenses. You might want to look for free attractions or budget-friendly restaurants to extend your budget.`;
    } else if (remainingPercent > 70) {
      return `You have a generous amount of your budget remaining for ${destinationName}. This is a good opportunity to consider upgrading some experiences or adding premium activities to your itinerary that will create memorable moments.`;
    } else {
      return `Your budget allocation for ${destinationName} looks well-balanced. You have about ${remainingPercent.toFixed(
        0
      )}% remaining. Based on typical expenses in this destination, consider allocating more to local transportation which tends to be a hidden cost for travelers.`;
    }
  };

  // Group expenses by category for summary
  const expensesByCategory = expenses.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = 0;
    }
    groups[item.category] += item.amount;
    return groups;
  }, {});

  // Calculate percentages for pie chart
  const categoryPercentages = Object.entries(expensesByCategory).map(
    ([category, amount]) => {
      const percent =
        (amount /
          expenses.reduce((sum, item) => sum + parseFloat(item.amount), 0)) *
        100;

      const categoryObj =
        EXPENSE_CATEGORIES.find((cat) => cat.label === category) ||
        EXPENSE_CATEGORIES[5]; // Default to "Other"

      return {
        category,
        percent: percent,
        amount,
        color: categoryObj.color,
        icon: categoryObj.icon,
      };
    }
  );

  const spentBudget = expenses.reduce(
    (sum, item) => sum + parseFloat(item.amount),
    0
  );
  const spentPercentage = totalBudget ? (spentBudget / totalBudget) * 100 : 0;

  if (!fontsLoaded) {
    return null;
  }

  // UI Components
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="arrowleft" size={24} color="#333" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Budget Manager</Text>
      <View style={styles.headerRight} />
    </View>
  );

  const renderBudgetOverviewCard = () => (
    <Animated.View
      style={[
        styles.card,
        styles.budgetCard,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <LinearGradient
        colors={["#3498db", "#2980b9"]}
        style={styles.gradientHeader}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={styles.destinationTitle}>{destinationName}</Text>
        <View style={styles.budgetSummaryContainer}>
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Total Budget</Text>
            <Text style={styles.budgetSummaryValue}>
              ${totalBudget.toFixed(2)}
            </Text>
          </View>
          <View style={styles.budgetSeparator} />
          <View style={styles.budgetSummaryItem}>
            <Text style={styles.budgetSummaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.budgetSummaryValue,
                remainingBudget < 0 ? styles.negativeAmount : {},
              ]}
            >
              ${remainingBudget.toFixed(2)}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View style={styles.budgetProgressContainer}>
        <View style={styles.progressBarContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
                backgroundColor: progressAnim.interpolate({
                  inputRange: [0, 0.7, 0.9, 1],
                  outputRange: ["#4CAF50", "#FFC107", "#FF9800", "#FF5722"],
                }),
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {spentPercentage.toFixed(0)}% of budget used
        </Text>
      </View>

      <View style={styles.budgetInputContainer}>
        <TextInput
          style={styles.budgetInput}
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          placeholder="Update budget"
          placeholderTextColor="#999"
        />
        <TouchableOpacity style={styles.updateButton} onPress={setBudgetValue}>
          <Text style={styles.updateButtonText}>Update</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "overview" && styles.activeTab]}
        onPress={() => setActiveTab("overview")}
      >
        <Ionicons
          name="pie-chart"
          size={20}
          color={activeTab === "overview" ? "#3498db" : "#999"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "overview" && styles.activeTabText,
          ]}
        >
          Overview
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "expenses" && styles.activeTab]}
        onPress={() => setActiveTab("expenses")}
      >
        <MaterialIcons
          name="receipt-long"
          size={20}
          color={activeTab === "expenses" ? "#3498db" : "#999"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "expenses" && styles.activeTabText,
          ]}
        >
          Expenses
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "advice" && styles.activeTab]}
        onPress={() => setActiveTab("advice")}
      >
        <FontAwesome5
          name="robot"
          size={18}
          color={activeTab === "advice" ? "#3498db" : "#999"}
        />
        <Text
          style={[
            styles.tabText,
            activeTab === "advice" && styles.activeTabText,
          ]}
        >
          AI Advice
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderExpenseSummary = () => (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Expense Breakdown</Text>
      </View>

      {categoryPercentages.length > 0 ? (
        <View style={styles.breakdownContainer}>
          {/* Simple donut chart visualization */}
          <View style={styles.donutChartContainer}>
            <View style={styles.donutChart}>
              {categoryPercentages.map((item, index) => {
                const previousPercents = categoryPercentages
                  .slice(0, index)
                  .reduce((sum, cat) => sum + cat.percent, 0);

                return (
                  <View
                    key={index}
                    style={[
                      styles.donutSegment,
                      {
                        backgroundColor: item.color,
                        transform: [
                          {
                            rotate: `${previousPercents * 3.6}deg`,
                          },
                        ],
                        zIndex: 10 - index,
                        width: item.percent >= 50 ? "100%" : "50%",
                      },
                    ]}
                  />
                );
              })}
              <View style={styles.donutHole}>
                <Text style={styles.donutTotal}>${spentBudget.toFixed(0)}</Text>
                <Text style={styles.donutLabel}>Total Spent</Text>
              </View>
            </View>
          </View>

          {/* Category legend */}
          <View style={styles.legendContainer}>
            {categoryPercentages.map((item, index) => (
              <View key={index} style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: item.color }]}
                />
                <Text style={styles.legendCategory}>{item.category}</Text>
                <Text style={styles.legendPercent}>
                  {item.percent.toFixed(0)}%
                </Text>
                <Text style={styles.legendAmount}>
                  ${item.amount.toFixed(0)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="chart-pie" size={50} color="#ddd" />
          <Text style={styles.emptyStateText}>
            No expenses added yet. Add your first expense to see a breakdown.
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderExpensesList = () => (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>Your Expenses</Text>
        <TouchableOpacity
          style={styles.addExpenseButton}
          onPress={() => setShowAddExpense(true)}
        >
          <AntDesign name="plus" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {expenses.length > 0 ? (
        expenses.map((expense) => (
          <View key={expense.id} style={styles.expenseItem}>
            <View style={styles.expenseIconContainer}>
              <View
                style={[styles.expenseIcon, { backgroundColor: expense.color }]}
              >
                <Ionicons name={expense.icon} size={20} color="#fff" />
              </View>
            </View>
            <View style={styles.expenseDetails}>
              <Text style={styles.expenseDescription}>
                {expense.description}
              </Text>
              <Text style={styles.expenseCategory}>{expense.category}</Text>
              <Text style={styles.expenseDate}>
                {new Date(expense.date).toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.expenseAmountContainer}>
              <Text style={styles.expenseAmount}>
                ${expense.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="receipt" size={50} color="#ddd" />
          <Text style={styles.emptyStateText}>
            No expenses added yet. Tap the + button to add your first expense.
          </Text>
        </View>
      )}
    </Animated.View>
  );

  const renderAIAdvice = () => (
    <Animated.View
      style={[
        styles.card,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>AI Budget Assistant</Text>
      </View>

      <View style={styles.aiCardContent}>
        <View style={styles.aiIconContainer}>
          <LinearGradient
            colors={["#3498db", "#2980b9"]}
            style={styles.aiIconBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <FontAwesome5 name="robot" size={24} color="#fff" />
          </LinearGradient>
        </View>

        <Text style={styles.aiDescription}>
          Get personalized AI recommendations for managing your travel budget
          efficiently.
        </Text>

        {suggestion ? (
          <View style={styles.suggestionContainer}>
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.aiButton}
            onPress={getAIBudgetSuggestion}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.aiButtonText}>Get Budget Advice</Text>
                <AntDesign
                  name="right"
                  size={16}
                  color="#fff"
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {suggestion && (
        <TouchableOpacity
          style={styles.newAdviceButton}
          onPress={getAIBudgetSuggestion}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#3498db" size="small" />
          ) : (
            <Text style={styles.newAdviceButtonText}>Get New Advice</Text>
          )}
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  const renderAddExpenseForm = () => (
    <Animated.View
      style={[
        styles.addExpenseCard,
        showAddExpense ? styles.showAddExpense : {},
      ]}
    >
      <View style={styles.addExpenseHeader}>
        <Text style={styles.addExpenseTitle}>Add New Expense</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => setShowAddExpense(false)}
        >
          <AntDesign name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {EXPENSE_CATEGORIES.map((category, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryButton,
                expenseCategory === category.label &&
                  styles.activeCategoryButton,
              ]}
              onPress={() => setExpenseCategory(category.label)}
            >
              <View
                style={[
                  styles.categoryIcon,
                  { backgroundColor: category.color },
                  expenseCategory === category.label
                    ? styles.activeCategoryIcon
                    : {},
                ]}
              >
                <Ionicons name={category.icon} size={22} color="#fff" />
              </View>
              <Text
                style={[
                  styles.categoryLabel,
                  expenseCategory === category.label &&
                    styles.activeCategoryLabel,
                ]}
              >
                {category.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Amount</Text>
        <View style={styles.currencyInputContainer}>
          <Text style={styles.currencySymbol}>$</Text>
          <TextInput
            style={styles.amountInput}
            value={expenseAmount}
            onChangeText={setExpenseAmount}
            keyboardType="numeric"
            placeholder="0.00"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.formGroup}>
        <Text style={styles.formLabel}>Description</Text>
        <TextInput
          style={styles.descriptionInput}
          value={expenseDescription}
          onChangeText={setExpenseDescription}
          placeholder="What was this expense for?"
          placeholderTextColor="#999"
        />
      </View>

      <TouchableOpacity style={styles.saveExpenseButton} onPress={addExpense}>
        <Text style={styles.saveExpenseButtonText}>Save Expense</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {renderBudgetOverviewCard()}
        {renderTabs()}

        {activeTab === "overview" && renderExpenseSummary()}
        {activeTab === "expenses" && renderExpensesList()}
        {activeTab === "advice" && renderAIAdvice()}
      </ScrollView>

      {/* Add expense form */}
      {renderAddExpenseForm()}

      {/* Add expense floating button */}
      {!showAddExpense && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setShowAddExpense(true)}
        >
          <AntDesign name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      )}

      <Tabbar />
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  budgetCard: {
    marginTop: 20,
  },
  gradientHeader: {
    padding: 20,
  },
  destinationTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  budgetSummaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  budgetSummaryItem: {
    flex: 1,
    alignItems: "center",
  },
  budgetSeparator: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  budgetSummaryLabel: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    marginBottom: 5,
  },
  budgetSummaryValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  negativeAmount: {
    color: "#FF5252",
  },
  budgetProgressContainer: {
    padding: 20,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 8,
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: "#666",
    textAlign: "right",
  },
  budgetInputContainer: {
    flexDirection: "row",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  budgetInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  updateButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#3498db",
  },
  tabText: {
    fontSize: 14,
    color: "#999",
    marginLeft: 6,
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "600",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  breakdownContainer: {
    padding: 16,
  },
  donutChartContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  donutChart: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  donutSegment: {
    width: "50%",
    height: "100%",
    position: "absolute",
    top: 0,
    left: "50%",
    borderTopRightRadius: 75,
    borderBottomRightRadius: 75,
    transformOrigin: "left center",
  },
  donutHole: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  donutTotal: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  donutLabel: {
    fontSize: 12,
    color: "#666",
  },
  legendContainer: {
    marginTop: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendCategory: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  legendPercent: {
    width: 40,
    fontSize: 14,
    color: "#666",
    textAlign: "right",
    marginRight: 8,
  },
  legendAmount: {
    width: 70,
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    textAlign: "right",
  },
  addExpenseButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseItem: {
    flexDirection: "row",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  expenseIconContainer: {
    marginRight: 16,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  expenseDetails: {
    flex: 1,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  expenseCategory: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: "#999",
  },
  expenseAmountContainer: {
    justifyContent: "center",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    padding: 30,
  },
  emptyStateText: {
    marginTop: 10,
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  aiCardContent: {
    padding: 16,
    alignItems: "center",
  },
  aiIconContainer: {
    marginBottom: 16,
  },
  aiIconBackground: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  aiDescription: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    lineHeight: 20,
  },
  suggestionContainer: {
    backgroundColor: "#f9f9f9",
    borderRadius: 12,
    padding: 16,
    width: "100%",
  },
  suggestionText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
  aiButton: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  aiButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  newAdviceButton: {
    alignSelf: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#3498db",
    borderRadius: 20,
  },
  newAdviceButtonText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "500",
  },
  floatingButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  addExpenseCard: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: -500, // Start offscreen
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  showAddExpense: {
    bottom: 0, // Slide in from bottom
  },
  addExpenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  addExpenseTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  categoriesContainer: {
    marginBottom: 20,
  },
  categoryButton: {
    alignItems: "center",
    marginRight: 15,
    width: 70,
  },
  activeCategoryButton: {
    // No special style needed as we'll style the icon and text
  },
  categoryIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
  },
  activeCategoryIcon: {
    transform: [{ scale: 1.1 }],
  },
  categoryLabel: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
  activeCategoryLabel: {
    color: "#3498db",
    fontWeight: "bold",
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  currencyInputContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  descriptionInput: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  saveExpenseButton: {
    backgroundColor: "#3498db",
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: "center",
  },
  saveExpenseButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default AIBudgetManager;
