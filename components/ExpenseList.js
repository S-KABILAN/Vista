import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";

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

const getCategoryColor = (category) => {
  switch (category) {
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

const ExpenseItem = ({ expense, onDelete }) => {
  const handleDelete = () => {
    Alert.alert(
      "Delete Expense",
      "Are you sure you want to delete this expense?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => onDelete(expense._id || expense.id),
        },
      ]
    );
  };

  return (
    <View style={styles.expenseItem}>
      <View style={styles.expenseIconContainer}>
        <MaterialIcons
          name={getCategoryIcon(expense.category)}
          size={24}
          color={getCategoryColor(expense.category)}
        />
      </View>
      <View style={styles.expenseDetails}>
        <Text style={styles.expenseCategory}>
          {expense.category.charAt(0).toUpperCase() + expense.category.slice(1)}
        </Text>
        <Text style={styles.expenseDescription}>{expense.description}</Text>
        <Text style={styles.expenseDate}>
          {format(new Date(expense.timestamp), "MMM d, yyyy")}
        </Text>
      </View>
      <View style={styles.expenseAmountContainer}>
        <Text style={styles.expenseAmount}>${expense.amount.toFixed(2)}</Text>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <MaterialIcons name="delete-outline" size={20} color="#FF3B30" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ExpenseList = ({ expenses, onDeleteExpense, refreshControl }) => {
  const sortedExpenses = [...expenses].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="receipt-long" size={50} color="#ccc" />
      <Text style={styles.emptyTitle}>No Expenses Yet</Text>
      <Text style={styles.emptySubtitle}>
        Start tracking your travel spending by adding your first expense
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>
        {expenses.length} {expenses.length === 1 ? "Expense" : "Expenses"}
      </Text>
    </View>
  );

  return (
    <FlatList
      data={sortedExpenses}
      renderItem={({ item }) => (
        <ExpenseItem expense={item} onDelete={onDeleteExpense} />
      )}
      keyExtractor={(item) => item._id || item.id}
      ListEmptyComponent={renderEmptyState}
      ListHeaderComponent={renderHeader}
      refreshControl={refreshControl}
      contentContainerStyle={styles.listContent}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  expenseItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  expenseIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f8f9fa",
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
    color: "#333",
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
  expenseAmountContainer: {
    alignItems: "flex-end",
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#666",
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
    marginHorizontal: 40,
  },
});

export default ExpenseList;
