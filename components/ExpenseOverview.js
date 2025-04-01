import React from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { LineChart, PieChart } from "react-native-chart-kit";
import { MaterialIcons } from "@expo/vector-icons";

const getColorForIndex = (index) => {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEEAD",
    "#D4A5A5",
    "#9B59B6",
    "#95A5A6",
  ];
  return colors[index % colors.length];
};

const getCategoryIcon = (category) => {
  switch (category) {
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

const ExpenseOverview = ({ expenses, totalBudget, refreshControl }) => {
  const screenWidth = Dimensions.get("window").width;

  // Calculate category-wise totals
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {});

  // Prepare data for pie chart
  const pieChartData = Object.entries(categoryTotals).map(
    ([category, amount], index) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      amount,
      color: getColorForIndex(index),
      legendFontColor: "#7F7F7F",
    })
  );

  // Calculate total spent and remaining budget
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const remaining = totalBudget - totalSpent;
  const spentPercentage = (totalSpent / totalBudget) * 100;

  // Prepare data for line chart (daily spending)
  const dailySpending = expenses.reduce((acc, expense) => {
    const date = new Date(expense.timestamp).toLocaleDateString();
    acc[date] = (acc[date] || 0) + expense.amount;
    return acc;
  }, {});

  const lineChartData = {
    labels: Object.keys(dailySpending).slice(-7), // Last 7 days
    datasets: [
      {
        data: Object.values(dailySpending).slice(-7),
      },
    ],
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={refreshControl}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Budget Summary</Text>
        <View style={styles.summaryCards}>
          <View style={styles.summaryCard}>
            <MaterialIcons
              name="account-balance-wallet"
              size={24}
              color="#4ECDC4"
            />
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>${totalSpent.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="savings" size={24} color="#45B7D1" />
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text style={styles.summaryValue}>${remaining.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialIcons name="pie-chart" size={24} color="#FF6B6B" />
            <Text style={styles.summaryLabel}>Spent</Text>
            <Text style={styles.summaryValue}>
              {spentPercentage.toFixed(0)}%
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spending Trends</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={lineChartData}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={{
              backgroundColor: "#ffffff",
              backgroundGradientFrom: "#ffffff",
              backgroundGradientTo: "#ffffff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(78, 205, 196, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Distribution</Text>
        <View style={styles.chartContainer}>
          <PieChart
            data={pieChartData}
            width={Dimensions.get("window").width - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Categories</Text>
        {Object.entries(categoryTotals)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([category, amount], index) => (
            <View key={category} style={styles.categoryRow}>
              <View style={styles.categoryIconContainer}>
                <MaterialIcons
                  name={getCategoryIcon(category)}
                  size={24}
                  color={getColorForIndex(index)}
                />
              </View>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryName}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
                <Text style={styles.categoryAmount}>${amount.toFixed(2)}</Text>
              </View>
              <Text style={styles.categoryPercentage}>
                {((amount / totalSpent) * 100).toFixed(0)}%
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
    backgroundColor: "#f8f9fa",
  },
  section: {
    padding: 16,
    backgroundColor: "white",
    marginBottom: 16,
    borderRadius: 16,
    marginHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  summaryCards: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginHorizontal: 4,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  chartContainer: {
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  categoryIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  categoryAmount: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  categoryPercentage: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});

export default ExpenseOverview;
