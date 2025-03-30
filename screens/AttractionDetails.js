import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  Entypo,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import { googleapis } from "../constants/constant";
import MapView, { Marker } from "react-native-maps";

const { width } = Dimensions.get("window");

const AttractionDetails = ({ route, navigation }) => {
  const { attraction, destination } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [attractionDetails, setAttractionDetails] = useState(null);
  const [attractionPhotos, setAttractionPhotos] = useState([]);

  // Fetch detailed information about the attraction using its place_id
  const fetchAttractionDetails = async () => {
    try {
      setLoading(true);

      // Default values in case no params are passed or API call fails
      const defaultData = {
        name: attraction?.name || "Attraction Name",
        rating: attraction?.rating || 4.5,
        reviews: attraction?.reviews || 250,
        image:
          attraction?.image ||
          "https://images.unsplash.com/photo-1503152394-c571994fd383?q=80&w=800&auto=format&fit=crop",
        description:
          attraction?.description ||
          "This is a placeholder description for the attraction.",
        price: attraction?.price || "$$",
        openingHours: attraction?.openingHours || "Hours Vary",
        photos: attraction?.image ? [attraction.image] : [],
        latitude: attraction?.latitude || destination?.latitude || 37.7749,
        longitude: attraction?.longitude || destination?.longitude || -122.4194,
      };

      // If we have a place_id, fetch detailed information
      if (attraction?.id) {
        try {
          const response = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: attraction.id,
                key: googleapis,
                fields:
                  "name,rating,user_ratings_total,photos,editorial_summary,formatted_address,opening_hours,price_level,url,website,formatted_phone_number,geometry,reviews",
              },
            }
          );

          if (response.data.status === "OK") {
            const details = response.data.result;

            // Process photos
            const photos = [];
            if (details.photos && details.photos.length > 0) {
              // Get up to 5 photos
              const photoReferences = details.photos
                .slice(0, 5)
                .map((photo) => photo.photo_reference);

              for (const reference of photoReferences) {
                photos.push(
                  `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${reference}&key=${googleapis}`
                );
              }
            }

            // Set photos (use original image as fallback)
            if (photos.length > 0) {
              setAttractionPhotos(photos);
            } else if (attraction.image) {
              setAttractionPhotos([attraction.image]);
            }

            // Get opening hours formatted nicely
            let formattedHours = "Hours not available";
            if (details.opening_hours) {
              if (details.opening_hours.weekday_text) {
                formattedHours = details.opening_hours.weekday_text.join("\n");
              } else if (details.opening_hours.open_now !== undefined) {
                formattedHours = details.opening_hours.open_now
                  ? "Open Now"
                  : "Closed";
              }
            }

            // Get enhanced data
            const enhancedData = {
              name: details.name || defaultData.name,
              rating: details.rating || defaultData.rating,
              reviews: details.user_ratings_total || defaultData.reviews,
              image: photos.length > 0 ? photos[0] : defaultData.image,
              description:
                details.editorial_summary?.overview || defaultData.description,
              price: details.price_level
                ? "$".repeat(details.price_level)
                : defaultData.price,
              openingHours: formattedHours,
              address: details.formatted_address || "Address not available",
              phoneNumber:
                details.formatted_phone_number || "Phone not available",
              website: details.website || details.url || null,
              latitude: details.geometry?.location.lat || defaultData.latitude,
              longitude:
                details.geometry?.location.lng || defaultData.longitude,
              // Add reviews if available
              reviewsList: details.reviews
                ? details.reviews.map((review) => ({
                    author: review.author_name,
                    rating: review.rating,
                    text: review.text,
                    time: new Date(review.time * 1000).toLocaleDateString(),
                  }))
                : [],
            };

            setAttractionDetails(enhancedData);
          } else {
            throw new Error("Failed to fetch attraction details");
          }
        } catch (error) {
          console.error("Error fetching attraction details:", error);
          // Fallback to basic data
          setAttractionDetails(defaultData);
          if (attraction.image) {
            setAttractionPhotos([attraction.image]);
          }
        }
      } else {
        // No place_id, use default data
        setAttractionDetails(defaultData);
        if (attraction.image) {
          setAttractionPhotos([attraction.image]);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error("Error in attraction details flow:", error);
      setLoading(false);
      Alert.alert(
        "Error",
        "Failed to load attraction details. Please try again later.",
        [{ text: "OK", onPress: () => navigation.goBack() }]
      );
    }
  };

  useEffect(() => {
    fetchAttractionDetails();
  }, [attraction]);

  // Handle opening website if available
  const handleOpenWebsite = () => {
    if (attractionDetails?.website) {
      Linking.openURL(attractionDetails.website).catch((err) =>
        console.error("Error opening website:", err)
      );
    } else {
      Alert.alert(
        "No Website",
        "This attraction does not have a website listed."
      );
    }
  };

  // Handle phone call if available
  const handlePhoneCall = () => {
    if (
      attractionDetails?.phoneNumber &&
      attractionDetails.phoneNumber !== "Phone not available"
    ) {
      Linking.openURL(
        `tel:${attractionDetails.phoneNumber.replace(/\s/g, "")}`
      ).catch((err) => console.error("Error making phone call:", err));
    } else {
      Alert.alert(
        "No Phone Number",
        "This attraction does not have a phone number listed."
      );
    }
  };

  // Render a review item
  const renderReviewItem = ({ item }) => (
    <View style={styles.reviewItem}>
      <View style={styles.reviewHeader}>
        <Text style={styles.reviewAuthor}>{item.author}</Text>
        <View style={styles.reviewRating}>
          <AntDesign name="star" size={14} color="#FFD700" />
          <Text style={styles.reviewRatingText}>{item.rating}</Text>
        </View>
      </View>
      <Text style={styles.reviewDate}>{item.time}</Text>
      <Text style={styles.reviewText} numberOfLines={3}>
        {item.text}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading attraction details...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: attractionDetails.image }}
            style={styles.headerImage}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.6)", "transparent", "transparent"]}
            style={styles.gradient}
          />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <AntDesign name="arrowleft" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {/* Attraction Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <Text style={styles.attractionName}>{attractionDetails.name}</Text>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{attractionDetails.rating}</Text>
              <Text style={styles.reviewsText}>
                ({attractionDetails.reviews})
              </Text>
            </View>
          </View>

          {destination && (
            <Text style={styles.destinationText}>
              <Ionicons name="location-sharp" size={16} color="#666" />{" "}
              {destination.name}, {destination.country}
            </Text>
          )}

          <View style={styles.detailsRow}>
            <View style={styles.detailItem}>
              <MaterialIcons name="attach-money" size={20} color="#3498db" />
              <Text style={styles.detailText}>
                Price: {attractionDetails.price}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#3498db" />
              <Text style={styles.detailText}>
                {attractionDetails.openingHours.split("\n")[0]}
              </Text>
            </View>
          </View>

          {/* Additional Photos */}
          {attractionPhotos.length > 1 && (
            <View style={styles.photosSection}>
              <View style={styles.photosSectionHeader}>
                <Text style={styles.sectionTitle}>Photos</Text>
                <Text style={styles.photoCount}>
                  {attractionPhotos.length} photos
                </Text>
              </View>
              <View style={styles.photosGrid}>
                {attractionPhotos.map((photo, index) => (
                  <TouchableOpacity
                    key={`photo-${index}`}
                    style={styles.photoItem}
                  >
                    <Image
                      source={{ uri: photo }}
                      style={styles.photoImage}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* About Section */}
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>
            {attractionDetails.description}
          </Text>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <Text style={styles.sectionTitle}>Contact Information</Text>

            <View style={styles.contactItem}>
              <Ionicons name="location-outline" size={20} color="#3498db" />
              <Text style={styles.contactText}>
                {attractionDetails.address}
              </Text>
            </View>

            {attractionDetails.phoneNumber !== "Phone not available" && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={handlePhoneCall}
              >
                <Ionicons name="call-outline" size={20} color="#3498db" />
                <Text style={[styles.contactText, styles.contactLink]}>
                  {attractionDetails.phoneNumber}
                </Text>
              </TouchableOpacity>
            )}

            {attractionDetails.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={handleOpenWebsite}
              >
                <Ionicons name="globe-outline" size={20} color="#3498db" />
                <Text
                  style={[styles.contactText, styles.contactLink]}
                  numberOfLines={1}
                >
                  {attractionDetails.website.replace(/^https?:\/\//, "")}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Opening Hours if available */}
          {attractionDetails.openingHours &&
            attractionDetails.openingHours.includes("\n") && (
              <View style={styles.hoursSection}>
                <Text style={styles.sectionTitle}>Opening Hours</Text>
                {attractionDetails.openingHours
                  .split("\n")
                  .map((day, index) => (
                    <Text key={`day-${index}`} style={styles.hourText}>
                      {day}
                    </Text>
                  ))}
              </View>
            )}

          {/* Map Section */}
          <View style={styles.mapSection}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: attractionDetails.latitude,
                  longitude: attractionDetails.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: attractionDetails.latitude,
                    longitude: attractionDetails.longitude,
                  }}
                  title={attractionDetails.name}
                />
              </MapView>
            </View>
          </View>

          {/* Reviews Section if available */}
          {attractionDetails.reviewsList &&
            attractionDetails.reviewsList.length > 0 && (
              <View style={styles.reviewsSection}>
                <View style={styles.reviewsSectionHeader}>
                  <Text style={styles.sectionTitle}>Reviews</Text>
                  <Text style={styles.reviewCount}>
                    {attractionDetails.reviewsList.length} reviews
                  </Text>
                </View>
                {attractionDetails.reviewsList
                  .slice(0, 3)
                  .map((review, index) => renderReviewItem({ item: review }))}
              </View>
            )}

          {/* Plan a Visit Button */}
          <TouchableOpacity
            style={styles.visitButton}
            onPress={() =>
              navigation.navigate("Globe", {
                showRoute: true,
                destination: {
                  latitude: attractionDetails.latitude,
                  longitude: attractionDetails.longitude,
                  name: attractionDetails.name,
                },
              })
            }
          >
            <Text style={styles.visitButtonText}>Navigate to Attraction</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  imageContainer: {
    height: 250,
    position: "relative",
  },
  headerImage: {
    width: "100%",
    height: "100%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backButton: {
    position: "absolute",
    top: 15,
    left: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  attractionName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 4,
  },
  reviewsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 3,
  },
  destinationText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 15,
  },
  detailsRow: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: "#555",
    marginBottom: 20,
  },
  photosSection: {
    marginBottom: 20,
  },
  photosSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  photoCount: {
    fontSize: 14,
    color: "#666",
  },
  photosGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  photoItem: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    borderRadius: 10,
    margin: 5,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  contactSection: {
    marginBottom: 20,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: "#555",
    marginLeft: 10,
    flex: 1,
  },
  contactLink: {
    color: "#3498db",
    textDecorationLine: "underline",
  },
  hoursSection: {
    marginBottom: 20,
  },
  hourText: {
    fontSize: 14,
    color: "#555",
    marginBottom: 6,
  },
  mapSection: {
    marginBottom: 20,
  },
  mapContainer: {
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  reviewsSection: {
    marginBottom: 20,
  },
  reviewsSectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  reviewCount: {
    fontSize: 14,
    color: "#666",
  },
  reviewItem: {
    marginBottom: 15,
    padding: 12,
    backgroundColor: "#f8f8f8",
    borderRadius: 10,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  reviewAuthor: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewRatingText: {
    fontSize: 12,
    marginLeft: 4,
    color: "#666",
  },
  reviewDate: {
    fontSize: 12,
    color: "#888",
    marginBottom: 5,
  },
  reviewText: {
    fontSize: 13,
    color: "#555",
  },
  visitButton: {
    backgroundColor: "#3498db",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  visitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default AttractionDetails;
