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
import { googleapis } from "../constants/constant";

const HotelCard = ({ hotel, showPricing = false }) => {
  const openBookingLink = () => {
    if (hotel.bookingLink) {
      Linking.openURL(hotel.bookingLink);
    }
  };

  // Get image URL from various possible sources
  const getImageUrl = () => {
    // Case 1: Amadeus format with images array
    if (hotel.images && hotel.images.length > 0) {
      return hotel.images[0];
    }

    // Case 2: Google Places format with photo_reference
    if (hotel.photos && hotel.photos.length > 0) {
      if (hotel.photos[0].photo_reference) {
        return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${hotel.photos[0].photo_reference}&key=${googleapis}`;
      }

      // Case 3: Format with URL property
      if (hotel.photos[0].url) {
        return hotel.photos[0].url;
      }

      // Case 4: Direct string in photos array
      if (typeof hotel.photos[0] === "string") {
        return hotel.photos[0];
      }
    }

    // Case 5: Single media_url property
    if (hotel.media_url) {
      return hotel.media_url;
    }

    return null;
  };

  const imageUrl = getImageUrl();

  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
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
            {hotel.address.cityName ||
              (typeof hotel.address === "string" ? hotel.address : "")}
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
