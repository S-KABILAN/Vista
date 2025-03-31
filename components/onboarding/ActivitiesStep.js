import React from "react";
import { View, Text, StyleSheet } from "react-native";

const ActivitiesStep = ({ selectedActivities, onSelectionChange }) => {
  // Simple stub version
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Activities preferences coming soon!</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ActivitiesStep;
