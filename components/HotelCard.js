import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
} from "react-native";
import { FontAwesome, MaterialIcons } from "@expo/vector-icons";

const HotelCard = ({ hotel, showPricing = false }) => {
  const openBookingLink = () => {
    if (hotel.bookingLink) {
      Linking.openURL(hotel.bookingLink);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {hotel.images && hotel.images.length > 0 ? (
          <Image
            source={{ uri: hotel.images[0] }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialIcons name="hotel" size={50} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.name} numberOfLines={1}>
          {hotel.name}
        </Text>

        <View style={styles.ratingContainer}>
          {hotel.rating && (
            <>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{hotel.rating}</Text>
            </>
          )}
        </View>

        {hotel.address && (
          <Text style={styles.address} numberOfLines={1}>
            {hotel.address.cityName}
            {hotel.address.countryCode ? `, ${hotel.address.countryCode}` : ""}
          </Text>
        )}

        {showPricing && (
          <View style={styles.priceContainer}>
            <Text style={styles.price}>
              {hotel.price !== "Price unavailable"
                ? `${hotel.price} ${hotel.currency}`
                : "Price unavailable"}
            </Text>
          </View>
        )}

        {hotel.bookingLink && (
          <TouchableOpacity style={styles.bookButton} onPress={openBookingLink}>
            <Text style={styles.bookButtonText}>View Deal</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
    flexDirection: "row",
    height: 130,
  },
  imageContainer: {
    width: 130,
    height: "100%",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  placeholderImage: {
    width: "100%",
    height: "100%",
    backgroundColor: "#f3f3f3",
    alignItems: "center",
    justifyContent: "center",
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  name: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  address: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  priceContainer: {
    marginVertical: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4CAF50",
  },
  bookButton: {
    backgroundColor: "#2196F3",
    padding: 6,
    borderRadius: 4,
    alignItems: "center",
  },
  bookButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default HotelCard;
