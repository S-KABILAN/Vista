import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import {
  formatFlightDuration,
  formatFlightDate,
  getAirlineName,
} from "../services/FlightService";

const FlightCard = ({ flight, onSelect, isSelected }) => {
  const {
    airline,
    price,
    currency,
    departureTime,
    arrivalTime,
    duration,
    stops,
    segments,
  } = flight;

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={() => onSelect(flight)}
      activeOpacity={0.7}
    >
      {/* Airline and Price */}
      <View style={styles.header}>
        <View style={styles.airlineContainer}>
          <FontAwesome5 name="plane" size={16} color="#4285F4" />
          <Text style={styles.airlineName}>{getAirlineName(airline)}</Text>
        </View>
        <Text style={styles.price}>
          {currency} {parseFloat(price).toFixed(2)}
        </Text>
      </View>

      {/* Flight Times */}
      <View style={styles.timesContainer}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Departure</Text>
          <Text style={styles.time}>{formatFlightDate(departureTime)}</Text>
          <Text style={styles.airport}>{firstSegment.departureAirport}</Text>
        </View>

        <View style={styles.durationContainer}>
          <Text style={styles.duration}>{formatFlightDuration(duration)}</Text>
          <View style={styles.flightPath}>
            <View style={styles.dot} />
            <View style={styles.line} />
            {stops > 0 && <View style={styles.stopDot} />}
            <View style={styles.dot} />
          </View>
          <Text style={styles.stops}>
            {stops === 0 ? "Direct" : `${stops} stop${stops > 1 ? "s" : ""}`}
          </Text>
        </View>

        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Arrival</Text>
          <Text style={styles.time}>{formatFlightDate(arrivalTime)}</Text>
          <Text style={styles.airport}>{lastSegment.arrivalAirport}</Text>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.footer}>
        {isSelected ? (
          <View style={styles.selectedBadge}>
            <MaterialIcons name="check-circle" size={16} color="#fff" />
            <Text style={styles.selectedText}>Selected</Text>
          </View>
        ) : (
          <Text style={styles.selectText}>Tap to select</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectedContainer: {
    borderWidth: 2,
    borderColor: "#4285F4",
    backgroundColor: "#F0F8FF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  airlineContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  airlineName: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  price: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  timesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  timeColumn: {
    alignItems: "center",
    width: "30%",
  },
  timeLabel: {
    fontSize: 12,
    color: "#757575",
    marginBottom: 4,
  },
  time: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  airport: {
    fontSize: 14,
    color: "#333",
  },
  durationContainer: {
    alignItems: "center",
    width: "40%",
  },
  duration: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
    marginBottom: 8,
  },
  flightPath: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4285F4",
  },
  stopDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF5722",
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#BDBDBD",
  },
  stops: {
    fontSize: 12,
    color: "#757575",
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    paddingTop: 12,
    alignItems: "center",
  },
  selectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4285F4",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  selectedText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 4,
  },
  selectText: {
    color: "#757575",
    fontSize: 12,
  },
});

export default FlightCard;
