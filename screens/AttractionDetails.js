import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const AttractionDetails = ({ route, navigation }) => {
  const { attraction, destination } = route.params || {};

  // Default values in case no params are passed
  const attractionData = attraction || {
    name: "Attraction Name",
    rating: 4.5,
    reviews: 250,
    image:
      "https://images.unsplash.com/photo-1503152394-c571994fd383?q=80&w=800&auto=format&fit=crop",
    description: "This is a placeholder description for the attraction.",
    price: "$$",
    openingHours: "9:00 AM - 5:00 PM",
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: attractionData.image }}
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
            <Text style={styles.attractionName}>{attractionData.name}</Text>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{attractionData.rating}</Text>
              <Text style={styles.reviewsText}>({attractionData.reviews})</Text>
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
                Price: {attractionData.price}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="time-outline" size={20} color="#3498db" />
              <Text style={styles.detailText}>
                {attractionData.openingHours}
              </Text>
            </View>
          </View>

          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.descriptionText}>
            {attractionData.description}
          </Text>

          {/* Visit Button */}
          <TouchableOpacity style={styles.visitButton}>
            <Text style={styles.visitButtonText}>Plan a Visit</Text>
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
