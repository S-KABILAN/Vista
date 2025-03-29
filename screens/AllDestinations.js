import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  SafeAreaView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { AntDesign, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

// Sample data - in a real app, you would fetch this from an API
const sampleDestinations = {
  featured: [
    {
      id: "f1",
      name: "Santorini",
      country: "Greece",
      image:
        "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
      rating: 4.8,
      description:
        "Known for its stunning white buildings and blue domes overlooking the sea.",
      latitude: 36.3932,
      longitude: 25.4615,
    },
    {
      id: "f2",
      name: "Bali",
      country: "Indonesia",
      image:
        "https://images.unsplash.com/photo-1537996194471-e657df975ab4?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=738&q=80",
      rating: 4.7,
      description:
        "A tropical paradise known for its beautiful beaches, lush rice fields and spiritual culture.",
      latitude: -8.4095,
      longitude: 115.1889,
    },
    {
      id: "f3",
      name: "Kyoto",
      country: "Japan",
      image:
        "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      rating: 4.6,
      description:
        "Japan's ancient capital, known for its temples, shrines, traditional wooden houses, and gardens.",
      latitude: 35.0116,
      longitude: 135.7681,
    },
    {
      id: "f4",
      name: "Paris",
      country: "France",
      image:
        "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1420&q=80",
      rating: 4.5,
      description:
        "The City of Light, known for its art, fashion, cuisine, and landmarks like the Eiffel Tower.",
      latitude: 48.8566,
      longitude: 2.3522,
    },
    {
      id: "f5",
      name: "New York",
      country: "United States",
      image:
        "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      rating: 4.6,
      description:
        "The city that never sleeps, with its iconic skyline, Central Park, and diverse neighborhoods.",
      latitude: 40.7128,
      longitude: -74.006,
    },
    {
      id: "f6",
      name: "Marrakesh",
      country: "Morocco",
      image:
        "https://images.unsplash.com/photo-1597211684565-dca64d72bdfe?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=735&q=80",
      rating: 4.4,
      description:
        "A vibrant city known for its historic medina, beautiful riads, and colorful markets.",
      latitude: 31.6295,
      longitude: -7.9811,
    },
  ],
  popular: [
    {
      id: "p1",
      name: "Rome",
      country: "Italy",
      image:
        "https://images.unsplash.com/photo-1525874684015-58379d421a52?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      rating: 4.7,
      description:
        "The Eternal City, with ancient ruins, Renaissance art, and delicious cuisine.",
      latitude: 41.9028,
      longitude: 12.4964,
    },
    {
      id: "p2",
      name: "Barcelona",
      country: "Spain",
      image:
        "https://images.unsplash.com/photo-1583422409516-2895a77efded?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      rating: 4.6,
      description:
        "Known for Gaudí's architecture, beaches, and vibrant culture.",
      latitude: 41.3851,
      longitude: 2.1734,
    },
    {
      id: "p3",
      name: "Tokyo",
      country: "Japan",
      image:
        "https://images.unsplash.com/photo-1526481280693-3bfa7568e0f3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1471&q=80",
      rating: 4.8,
      description:
        "A city that blends ultramodern and traditional elements, with great food and shopping.",
      latitude: 35.6762,
      longitude: 139.6503,
    },
    {
      id: "p4",
      name: "London",
      country: "United Kingdom",
      image:
        "https://images.unsplash.com/photo-1534531173927-aeb928d54385?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80",
      rating: 4.5,
      description:
        "A historic city with modern attractions, world-class museums, and diverse neighborhoods.",
      latitude: 51.5074,
      longitude: -0.1278,
    },
    {
      id: "p5",
      name: "Bangkok",
      country: "Thailand",
      image:
        "https://images.unsplash.com/photo-1563492065599-3520f775eeed?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
      rating: 4.4,
      description:
        "A vibrant city with ornate shrines, bustling markets, and exciting street food.",
      latitude: 13.7563,
      longitude: 100.5018,
    },
  ],
  trending: [
    {
      id: "t1",
      name: "Lisbon",
      country: "Portugal",
      image:
        "https://images.unsplash.com/photo-1585208798174-6cedd86ea539?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1473&q=80",
      rating: 4.6,
      description:
        "A coastal city known for its colorful buildings, historic trams, and seafood.",
      latitude: 38.7223,
      longitude: -9.1393,
    },
    {
      id: "t2",
      name: "Seoul",
      country: "South Korea",
      image:
        "https://images.unsplash.com/photo-1538485399081-7c8485c5fbed?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
      rating: 4.7,
      description:
        "A technologically advanced city with a rich cultural heritage and amazing food.",
      latitude: 37.5665,
      longitude: 126.978,
    },
    {
      id: "t3",
      name: "Mexico City",
      country: "Mexico",
      image:
        "https://images.unsplash.com/photo-1518659526054-190340b15979?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
      rating: 4.5,
      description:
        "A vibrant metropolis with ancient ruins, colonial architecture, and world-class museums.",
      latitude: 19.4326,
      longitude: -99.1332,
    },
    {
      id: "t4",
      name: "Medellin",
      country: "Colombia",
      image:
        "https://images.unsplash.com/photo-1562577308-9e66f0c65ce5?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80",
      rating: 4.7,
      description:
        "Known as the City of Eternal Spring, with a pleasant climate, innovative urban planning, and welcoming atmosphere.",
      latitude: 6.2476,
      longitude: -75.5676,
    },
    {
      id: "t5",
      name: "Istanbul",
      country: "Turkey",
      image:
        "https://images.unsplash.com/photo-1527838832700-5059252407fa?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1598&q=80",
      rating: 4.6,
      description:
        "A city straddling two continents, with amazing architecture, bazaars, and cuisine.",
      latitude: 41.0082,
      longitude: 28.9784,
    },
  ],
};

const AllDestinations = ({ route, navigation }) => {
  const [destinations, setDestinations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { type = "featured" } = route.params || {};

  useEffect(() => {
    // In a real app, you would fetch data from an API here
    // For now, we'll use our sample data
    setLoading(true);
    setTimeout(() => {
      setDestinations(sampleDestinations[type] || []);
      setLoading(false);
    }, 500); // Simulate network delay
  }, [type]);

  const getTypeTitle = () => {
    switch (type) {
      case "featured":
        return "Featured Destinations";
      case "popular":
        return "Popular Destinations";
      case "trending":
        return "Trending Destinations";
      default:
        return "All Destinations";
    }
  };

  const handleDestinationPress = (destination) => {
    navigation.navigate("PlaceDetails", { destination });
  };

  const handleGlobePress = (destination) => {
    // Navigate to Globe screen with destination coordinates
    navigation.navigate("Globe", {
      showRoute: false,
      initialRegion: {
        latitude: destination.latitude,
        longitude: destination.longitude,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      },
    });
  };

  const renderDestinationCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleDestinationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.cardGradient}
      />
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{item.name}</Text>
          <View style={styles.ratingContainer}>
            <AntDesign name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        <Text style={styles.cardSubtitle}>{item.country}</Text>
        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleGlobePress(item)}
          >
            <MaterialIcons name="explore" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Explore</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.planButton]}
            onPress={() =>
              navigation.navigate("AITravelPlanner", {
                prefilledDestination: item.name,
                selectedDestination: {
                  name: item.name,
                  coordinates: {
                    latitude: item.latitude,
                    longitude: item.longitude,
                  },
                },
              })
            }
          >
            <Ionicons name="map" size={18} color="#fff" />
            <Text style={styles.actionButtonText}>Plan Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getTypeTitle()}</Text>
        <View style={styles.headerRight} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Loading destinations...</Text>
        </View>
      ) : (
        <FlatList
          data={destinations}
          renderItem={renderDestinationCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  headerRight: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  listContainer: {
    padding: 16,
  },
  card: {
    width: "100%",
    height: 300,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "#fff",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  cardContent: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 14,
    color: "white",
    fontWeight: "bold",
  },
  cardSubtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.9)",
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    marginTop: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.8)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 10,
  },
  planButton: {
    backgroundColor: "rgba(46, 204, 113, 0.8)",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 6,
  },
});

export default AllDestinations;
