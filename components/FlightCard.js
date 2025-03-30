import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import {
  formatFlightDuration,
  formatFlightDate,
  getAirlineName,
} from "../services/FlightService";

const FlightCard = ({ flight, onSelect, isSelected }) => {
  // Handle missing flight data
  if (!flight) {
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Invalid flight data</Text>
      </View>
    );
  }

  // Extract flight details with fallbacks for both API and mock data formats
  const {
    airline,
    price,
    currency = "USD",
    departureTime,
    arrivalTime,
    duration,
    stops = 0,
    segments = [],
  } = flight;

  // Handle case where segments might not be defined or empty
  const firstSegment = segments && segments.length > 0 ? segments[0] : null;
  const lastSegment =
    segments && segments.length > 0 ? segments[segments.length - 1] : null;

  // If segments are missing, try to use the main flight object for basic info
  const departureAirport =
    firstSegment?.departureAirport || flight.departureAirport || "N/A";
  const arrivalAirport =
    lastSegment?.arrivalAirport || flight.arrivalAirport || "N/A";
  const displayDepartureTime = departureTime || flight.departureDate;
  const displayArrivalTime = arrivalTime || flight.arrivalDate;

  // Format the price for display
  const displayPrice = () => {
    try {
      if (typeof price === "number") {
        return price.toFixed(2);
      } else if (typeof price === "string") {
        return parseFloat(price).toFixed(2);
      }
      return "0.00";
    } catch (e) {
      return "0.00";
    }
  };

  // Get airline name with fallback
  const displayAirlineName =
    flight.airlineName ||
    getAirlineName(airline) ||
    airline ||
    "Unknown Airline";

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
          <Text style={styles.airlineName}>{displayAirlineName}</Text>
        </View>
        <Text style={styles.price}>
          {currency} {displayPrice()}
        </Text>
      </View>

      {/* Flight Times */}
      <View style={styles.timesContainer}>
        <View style={styles.timeColumn}>
          <Text style={styles.timeLabel}>Departure</Text>
          <Text style={styles.time}>
            {formatFlightDate(displayDepartureTime)}
          </Text>
          <Text style={styles.airport}>{departureAirport}</Text>
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
          <Text style={styles.time}>
            {formatFlightDate(displayArrivalTime)}
          </Text>
          <Text style={styles.airport}>{arrivalAirport}</Text>
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
  errorContainer: {
    backgroundColor: "#FFDAB9",
    borderWidth: 1,
    borderColor: "#FFA500",
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FFA500",
    textAlign: "center",
  },
});

export default FlightCard;
