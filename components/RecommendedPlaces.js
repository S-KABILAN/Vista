import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  Image,
  Touchable,
  TouchableOpacity,
  FlatList,
  Dimensions,
} from "react-native";
import { useFonts } from "expo-font";
import { BlurView } from "expo-blur";
import * as SplashScreen from "expo-splash-screen";
import {
  useNavigation,
  useRoute,
  useIsFocused,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const imageMapping = {
  1: require("../assets/Manila1.jpg"),
  2: require("../assets/Bali1.jpg"),
  3: require("../assets/Philippines1.jpg"),
  // Add more mappings as needed
};

const { width } = Dimensions.get("window");
const cardWidth = width * 0.75;

const RecommendedPlaces = ({ places, onPlacePress, userPreferences }) => {
  const [fontsLoaded] = useFonts({
    Candara: require("../assets/Candara.ttf"),
  });
  const navigation = useNavigation();

  const scrollViewRef = useRef(null);

  useEffect(() => {
    async function fetchData() {
      try {
        await SplashScreen.preventAutoHideAsync();
        const response = await fetch("http://192.168.140.149:3001/api/places");
        const data = await response.json();
        setPlaces(data);
        await SplashScreen.hideAsync();
      } catch (error) {
        console.error("Error fetching places:", error);
      }
    }
    fetchData();
  }, []);

  if (!fontsLoaded || places.length === 0) {
    return null;
  }

  const scrollToNext = () => {
    if (scrollViewRef.current) {
      const newX = scrollViewRef.current.contentOffset.x + 100;
      scrollViewRef.current.scrollTo({ x: newX, animated: true });
    }
  };

  const routetoPlace = (place) => {
    navigation.navigate("PlaceGo", {
      placeid: place.id,
      place: place.place,
      locationimage: place.imageUrl,
      latitude: place.latitude,
      longitude: place.longitude,
    });
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPlacePress(item)}
      activeOpacity={0.9}
    >
      <Image source={{ uri: item.image }} style={styles.image} />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      >
        <View style={styles.contentContainer}>
          <View style={styles.locationContainer}>
            <Text style={styles.locationName}>{item.name}</Text>
            <Text style={styles.locationCountry}>{item.country}</Text>
          </View>

          {item.reason && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonText}>{item.reason}</Text>
            </View>
          )}

          <View style={styles.infoContainer}>
            {item.budgetCategory && (
              <View style={styles.infoItem}>
                <Ionicons
                  name="wallet-outline"
                  size={14}
                  color="#fff"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {item.budgetCategory === "luxury"
                    ? "Luxury"
                    : item.budgetCategory === "moderate"
                    ? "Mid-range"
                    : "Budget"}
                </Text>
              </View>
            )}

            {item.destinationType && (
              <View style={styles.infoItem}>
                <Ionicons
                  name={
                    item.destinationType === "city"
                      ? "business-outline"
                      : item.destinationType === "island"
                      ? "water-outline"
                      : item.destinationType === "mountain"
                      ? "triangle-outline"
                      : "earth-outline"
                  }
                  size={14}
                  color="#fff"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {item.destinationType.charAt(0).toUpperCase() +
                    item.destinationType.slice(1)}
                </Text>
              </View>
            )}

            {item.bestTimeToVisit && (
              <View style={styles.infoItem}>
                <Ionicons
                  name="calendar-outline"
                  size={14}
                  color="#fff"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  Best: {item.bestTimeToVisit.split(",")[0]}
                </Text>
              </View>
            )}
          </View>
        </View>
      </LinearGradient>

      <View style={styles.matchIndicator}>
        <Text style={styles.matchText}>
          {item.relevanceScore > 5
            ? "Perfect match"
            : item.relevanceScore > 3
            ? "Great match"
            : "Good match"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Recommended for You</Text>
        <TouchableOpacity>
          <Text style={styles.viewAll}>View All</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={places}
        renderItem={renderItem}
        keyExtractor={(item) => item.name}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        snapToInterval={cardWidth + 20}
        decelerationRate="fast"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 15,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
  },
  viewAll: {
    color: "#3498db",
    fontSize: 14,
  },
  placeholderContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
    marginHorizontal: 20,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#eee",
  },
  placeholderText: {
    color: "#aaa",
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 15,
  },
  card: {
    width: cardWidth,
    height: 250,
    borderRadius: 15,
    marginHorizontal: 10,
    overflow: "hidden",
    backgroundColor: "#f8f9fa",
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "60%",
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    padding: 15,
    justifyContent: "flex-end",
  },
  contentContainer: {
    justifyContent: "flex-end",
  },
  locationContainer: {
    marginBottom: 6,
  },
  locationName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  locationCountry: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
    marginTop: 2,
  },
  reasonContainer: {
    marginBottom: 10,
  },
  reasonText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontStyle: "italic",
  },
  infoContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 5,
  },
  infoIcon: {
    marginRight: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#fff",
  },
  matchIndicator: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(52, 152, 219, 0.9)",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  matchText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
});

export default RecommendedPlaces;
