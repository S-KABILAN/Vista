import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ExpenseList = ({ expenses, onDeleteExpense }) => {
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

  const renderExpenseItem = ({ item }) => (
    <View style={styles.expenseItem}>
      <View style={styles.expenseLeft}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: getCategoryColor(item.category) },
          ]}
        >
          <MaterialIcons
            name={getCategoryIcon(item.category)}
            size={24}
            color="white"
          />
        </View>
        <View style={styles.expenseDetails}>
          <Text style={styles.expenseCategory}>
            {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
          </Text>
          <Text style={styles.expenseDescription}>{item.description}</Text>
          <Text style={styles.expenseDate}>
            {new Date(item.timestamp).toLocaleDateString()}
          </Text>
        </View>
      </View>

      <View style={styles.expenseRight}>
        <Text style={styles.expenseAmount}>${item.amount.toFixed(2)}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteExpense(item.id)}
        >
          <MaterialIcons name="delete-outline" size={20} color="#ff3b30" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const getCategoryColor = (category) => {
    const colors = {
      accommodation: "#4A90E2",
      transportation: "#50E3C2",
      food: "#F5A623",
      activities: "#7ED321",
      shopping: "#BD10E0",
      emergency: "#FF3B30",
      default: "#9B9B9B",
    };
    return colors[category.toLowerCase()] || colors.default;
  };

  return (
    <ScrollView style={styles.container}>
      {expenses.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt-long" size={48} color="#ccc" />
          <Text style={styles.emptyText}>No expenses yet</Text>
          <Text style={styles.emptySubtext}>Start adding your expenses</Text>
        </View>
      ) : (
        expenses.map((item) => (
          <View key={item.id}>{renderExpenseItem({ item })}</View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  expenseItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  expenseDetails: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  expenseDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  expenseDate: {
    fontSize: 12,
    color: "#999",
  },
  expenseRight: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 8,
  },
});

export default ExpenseList;
