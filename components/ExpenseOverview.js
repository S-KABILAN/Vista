import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { MaterialIcons } from "@expo/vector-icons";

const ExpenseOverview = ({ expenses, categories, totalBudget }) => {
  const screenWidth = Dimensions.get("window").width;

  // Calculate category-wise totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Prepare data for pie chart
  const pieChartData = Object.entries(categoryTotals).map(
    ([category, amount], index) => ({
      name: category,
      amount,
      color: getColorForIndex(index),
      legendFontColor: "#7F7F7F",
      legendFontSize: 12,
    })
  );

  // Prepare data for line chart
  const last7Days = [...Array(7)]
    .map((_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date;
    })
    .reverse();

  const lineChartData = {
    labels: last7Days.map((date) => date.getDate().toString()),
    datasets: [
      {
        data: last7Days.map((date) => {
          return expenses
            .filter(
              (expense) =>
                new Date(expense.timestamp).getDate() === date.getDate()
            )
            .reduce((sum, expense) => sum + expense.amount, 0);
        }),
      },
    ],
  };

  return (
    <ScrollView style={styles.container}>
      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <MaterialIcons
            name="account-balance-wallet"
            size={24}
            color="#007AFF"
          />
          <Text style={styles.summaryTitle}>Total Spent</Text>
          <Text style={styles.summaryAmount}>
            $
            {expenses
              .reduce((sum, expense) => sum + expense.amount, 0)
              .toFixed(2)}
          </Text>
        </View>

        <View style={styles.summaryCard}>
          <MaterialIcons name="trending-up" size={24} color="#34C759" />
          <Text style={styles.summaryTitle}>Budget Left</Text>
          <Text style={styles.summaryAmount}>
            $
            {(
              totalBudget -
              expenses.reduce((sum, expense) => sum + expense.amount, 0)
            ).toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Spending Trends */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Spending Trends</Text>
        <LineChart
          data={lineChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
            style: {
              borderRadius: 16,
            },
          }}
          bezier
          style={styles.chart}
        />
      </View>

      {/* Category Distribution */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Category Distribution</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth - 40}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
          }}
          accessor="amount"
          backgroundColor="transparent"
          paddingLeft="15"
          style={styles.chart}
        />
      </View>

      {/* Recent Transactions */}
      <View style={styles.transactionsContainer}>
        <Text style={styles.sectionTitle}>Recent Transactions</Text>
        {expenses.slice(0, 5).map((expense, index) => (
          <View key={index} style={styles.transactionItem}>
            <View style={styles.transactionLeft}>
              <MaterialIcons
                name={getCategoryIcon(expense.category)}
                size={24}
                color="#007AFF"
              />
              <View style={styles.transactionDetails}>
                <Text style={styles.transactionCategory}>
                  {expense.category}
                </Text>
                <Text style={styles.transactionDate}>
                  {new Date(expense.timestamp).toLocaleDateString()}
                </Text>
              </View>
            </View>
            <Text style={styles.transactionAmount}>
              ${expense.amount.toFixed(2)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
  },
  summaryAmount: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 5,
  },
  chartContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  transactionsContainer: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
  },
  transactionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  transactionDetails: {
    marginLeft: 10,
  },
  transactionCategory: {
    fontSize: 14,
    fontWeight: "500",
  },
  transactionDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "bold",
  },
});

// Utility functions
const getColorForIndex = (index) => {
  const colors = [
    "#FF6384",
    "#36A2EB",
    "#FFCE56",
    "#4BC0C0",
    "#9966FF",
    "#FF9F40",
  ];
  return colors[index % colors.length];
};

const getCategoryIcon = (category) => {
  const icons = {
    accommodation: "hotel",
    transportation: "directions-car",
    food: "restaurant",
    activities: "local-activity",
    shopping: "shopping-bag",
    emergency: "warning",
    default: "attach-money",
  };
  return icons[category.toLowerCase()] || icons.default;
};

export default ExpenseOverview;
