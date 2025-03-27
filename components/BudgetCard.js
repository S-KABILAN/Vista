import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const BudgetCard = ({ totalBudget, spent, currency = "USD" }) => {
  const remaining = totalBudget - spent;
  const percentageSpent = (spent / totalBudget) * 100;

  return (
    <LinearGradient colors={["#2ecc71", "#27ae60"]} style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons
            name="account-balance-wallet"
            size={24}
            color="white"
          />
          <Text style={styles.title}>Budget Overview</Text>
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.totalAmount}>
            {currency} {totalBudget.toFixed(2)}
          </Text>
          <Text style={styles.totalLabel}>Total Budget</Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${Math.min(percentageSpent, 100)}%` },
              ]}
            />
          </View>
          <Text style={styles.percentageText}>
            {percentageSpent.toFixed(1)}% spent
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Spent</Text>
            <Text style={styles.detailValue}>
              {currency} {spent.toFixed(2)}
            </Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Remaining</Text>
            <Text
              style={[
                styles.detailValue,
                remaining < 0 && styles.negativeAmount,
              ]}
            >
              {currency} {remaining.toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 16,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
  amountContainer: {
    alignItems: "center",
    marginBottom: 16,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  totalLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "white",
    borderRadius: 4,
  },
  percentageText: {
    color: "white",
    fontSize: 12,
    textAlign: "right",
    marginTop: 4,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 16,
  },
  detailLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  negativeAmount: {
    color: "#ff6b6b",
  },
});

export default BudgetCard;
