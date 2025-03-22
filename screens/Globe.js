import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
  Image,
  FlatList,
  ActivityIndicator,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from "react-native-maps";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { FlatList as RNFlatList } from "react-native";
const AnimatedFlatList = Animated.createAnimatedComponent(RNFlatList);

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.8;
const CARD_HEIGHT = height * 0.25;

// Sample destination data
const DESTINATIONS = [
  {
    id: "1",
    name: "Paris",
    country: "France",
    description:
      "The City of Light, known for the Eiffel Tower, Louvre Museum, and exquisite cuisine.",
    image:
      "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: 48.8566, longitude: 2.3522 },
    rating: 4.7,
    type: "city",
    popular: true,
  },
  {
    id: "2",
    name: "Santorini",
    country: "Greece",
    description:
      "Stunning island with white-washed buildings, blue domes, and breathtaking sunset views.",
    image:
      "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: 36.3932, longitude: 25.4615 },
    rating: 4.8,
    type: "beach",
    popular: true,
  },
  {
    id: "3",
    name: "Kyoto",
    country: "Japan",
    description:
      "Ancient capital with rich cultural heritage, traditional temples, and beautiful gardens.",
    image:
      "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: 35.0116, longitude: 135.7681 },
    rating: 4.6,
    type: "historical",
    popular: true,
  },
  {
    id: "4",
    name: "Machu Picchu",
    country: "Peru",
    description:
      "An iconic 15th-century Inca citadel set high in the Andes Mountains.",
    image:
      "https://images.unsplash.com/photo-1526392060635-9d6019884377?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: -13.1631, longitude: -72.545 },
    rating: 4.9,
    type: "historical",
    popular: true,
  },
  {
    id: "5",
    name: "Bali",
    country: "Indonesia",
    description:
      "Tropical paradise with beautiful beaches, lush rice terraces, and vibrant culture.",
    image:
      "https://images.unsplash.com/photo-1537996194471-e657df975ab4?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: -8.4095, longitude: 115.1889 },
    rating: 4.5,
    type: "beach",
    popular: false,
  },
  {
    id: "6",
    name: "New York",
    country: "United States",
    description:
      "The Big Apple with iconic skyscrapers, cultural diversity, and non-stop energy.",
    image:
      "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: 40.7128, longitude: -74.006 },
    rating: 4.5,
    type: "city",
    popular: false,
  },
  {
    id: "7",
    name: "Cape Town",
    country: "South Africa",
    description:
      "Stunning coastal city with Table Mountain, diverse culture, and beautiful landscapes.",
    image:
      "https://images.unsplash.com/photo-1580060839134-75a5edca2e99?q=80&w=800&auto=format&fit=crop",
    coordinates: { latitude: -33.9249, longitude: 18.4241 },
    rating: 4.6,
    type: "coastal",
    popular: false,
  },
];

const Globe = ({ navigation }) => {
  // State variables
  const [region, setRegion] = useState({
    latitude: 20,
    longitude: 0,
    latitudeDelta: 50,
    longitudeDelta: 50,
  });
  const [selectedDestination, setSelectedDestination] = useState(null);
  const [filteredDestinations, setFilteredDestinations] =
    useState(DESTINATIONS);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [mapType, setMapType] = useState("standard");
  const [showSearch, setShowSearch] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Refs
  const mapRef = useRef(null);
  const markerRefs = useRef({});
  const scrollViewRef = useRef(null);

  // Animation values
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  const cardAnimation = useRef(new Animated.Value(height)).current;
  const scrollX = useRef(new Animated.Value(0)).current;

  // Filter options
  const filterOptions = [
    { id: "all", label: "All", icon: "globe" },
    { id: "popular", label: "Popular", icon: "star" },
    { id: "city", label: "Cities", icon: "building" },
    { id: "beach", label: "Beaches", icon: "umbrella-beach" },
    { id: "historical", label: "Historical", icon: "monument" },
    { id: "coastal", label: "Coastal", icon: "water" },
  ];

  // Effects
  useEffect(() => {
    // Get user's current location (in a real app, request permissions first)
    const getCurrentLocation = async () => {
      setLoading(true);
      try {
        // Simulated location for demo
        setTimeout(() => {
          setUserLocation({
            latitude: 40.7128,
            longitude: -74.006,
          });
          setLoading(false);
        }, 1500);
      } catch (error) {
        console.log("Error getting location:", error);
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  useEffect(() => {
    // Filter destinations based on search query and active filter
    const filtered = DESTINATIONS.filter((destination) => {
      const matchesSearch =
        searchQuery === "" ||
        destination.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        destination.country.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesFilter =
        activeFilter === "all" ||
        (activeFilter === "popular"
          ? destination.popular
          : destination.type === activeFilter);

      return matchesSearch && matchesFilter;
    });

    setFilteredDestinations(filtered);
  }, [searchQuery, activeFilter]);

  useEffect(() => {
    // Animate card when a destination is selected
    if (selectedDestination) {
      Animated.spring(cardAnimation, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      Animated.spring(cardAnimation, {
        toValue: height,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedDestination]);

  // Handlers
  const handleMarkerPress = (destination) => {
    setSelectedDestination(destination);

    // Center map on selected destination with animation
    mapRef.current?.animateToRegion(
      {
        latitude: destination.coordinates.latitude,
        longitude: destination.coordinates.longitude,
        latitudeDelta: 10,
        longitudeDelta: 10,
      },
      1000
    );

    // Scroll carousel to the selected destination
    const index = filteredDestinations.findIndex(
      (item) => item.id === destination.id
    );
    if (index !== -1 && scrollViewRef.current) {
      scrollViewRef.current.scrollToIndex({ index, animated: true });
    }
  };

  const handleCardPress = (destination) => {
    // Navigate to destination details
    navigation.navigate("PlaceDetails", { destination });
  };

  const toggleSearchBar = () => {
    const toValue = showSearch ? 0 : 1;

    Animated.timing(searchBarAnimation, {
      toValue,
      duration: 300,
      useNativeDriver: false,
    }).start();

    setShowSearch(!showSearch);

    if (showSearch) {
      setSearchQuery("");
    }
  };

  const toggleMapType = () => {
    setMapType(mapType === "standard" ? "satellite" : "standard");
  };

  const goToUserLocation = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion(
        {
          ...userLocation,
          latitudeDelta: 1,
          longitudeDelta: 1,
        },
        1000
      );
    }
  };

  const handleFilterPress = (filterId) => {
    setActiveFilter(filterId);
  };

  const planTrip = () => {
    if (selectedDestination) {
      navigation.navigate("AITravelPlanner", {
        prefilledDestination: selectedDestination.name,
        selectedDestination: selectedDestination,
      });
    }
  };

  // UI Renderers
  const renderMarker = (destination) => (
    <Marker
      key={destination.id}
      ref={(ref) => (markerRefs.current[destination.id] = ref)}
      coordinate={destination.coordinates}
      title={destination.name}
      onPress={() => handleMarkerPress(destination)}
    >
      <View
        style={[
          styles.markerContainer,
          selectedDestination?.id === destination.id && styles.selectedMarker,
        ]}
      >
        <View style={styles.markerInner}>
          {destination.popular && <View style={styles.popularDot} />}
        </View>
      </View>
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          <Text style={styles.calloutTitle}>{destination.name}</Text>
          <Text style={styles.calloutSubtitle}>{destination.country}</Text>
        </View>
      </Callout>
    </Marker>
  );

  const renderFilterItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterItem,
        activeFilter === item.id && styles.activeFilterItem,
      ]}
      onPress={() => handleFilterPress(item.id)}
    >
      <FontAwesome5
        name={item.icon}
        size={16}
        color={activeFilter === item.id ? "#fff" : "#3498db"}
      />
      <Text
        style={[
          styles.filterText,
          activeFilter === item.id && styles.activeFilterText,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  const renderDestinationCard = ({ item, index }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => handleCardPress(item)}
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
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Explore the World</Text>

        <TouchableOpacity style={styles.headerButton} onPress={toggleSearchBar}>
          <Ionicons
            name={showSearch ? "close" : "search"}
            size={24}
            color="#333"
          />
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <Animated.View
        style={[
          styles.searchBarContainer,
          {
            maxHeight: searchBarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 60],
            }),
            opacity: searchBarAnimation,
            marginTop: searchBarAnimation.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 10],
            }),
          },
        ]}
      >
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          ) : null}
        </View>
      </Animated.View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <FlatList
          data={filterOptions}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersList}
        />
      </View>

      {/* Map */}
      <View style={styles.mapContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3498db" />
            <Text style={styles.loadingText}>Loading map...</Text>
          </View>
        ) : (
          <MapView
            ref={mapRef}
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={region}
            mapType={mapType}
            showsUserLocation={true}
            showsCompass={true}
            showsScale={true}
            onRegionChangeComplete={setRegion}
          >
            {filteredDestinations.map(renderMarker)}

            {/* User Location Marker */}
            {userLocation && (
              <Marker coordinate={userLocation}>
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                </View>
              </Marker>
            )}
          </MapView>
        )}

        {/* Map Controls */}
        <View style={styles.mapControls}>
          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={toggleMapType}
          >
            <Feather
              name={mapType === "standard" ? "map" : "globe"}
              size={20}
              color="#333"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapControlButton}
            onPress={goToUserLocation}
          >
            <MaterialIcons name="my-location" size={20} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Destination Cards Carousel */}
      <View style={styles.carouselContainer}>
        <AnimatedFlatList
          ref={scrollViewRef}
          data={filteredDestinations}
          renderItem={renderDestinationCard}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_WIDTH + 20}
          snapToAlignment="center"
          decelerationRate="fast"
          contentContainerStyle={styles.carousel}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: true }
          )}
          onMomentumScrollEnd={(event) => {
            const index = Math.floor(
              event.nativeEvent.contentOffset.x / (CARD_WIDTH + 20)
            );
            if (filteredDestinations[index]) {
              setSelectedDestination(filteredDestinations[index]);

              // Center map on the selected destination
              mapRef.current?.animateToRegion(
                {
                  latitude: filteredDestinations[index].coordinates.latitude,
                  longitude: filteredDestinations[index].coordinates.longitude,
                  latitudeDelta: 10,
                  longitudeDelta: 10,
                },
                1000
              );

              // Show the marker's callout
              if (markerRefs.current[filteredDestinations[index].id]) {
                markerRefs.current[
                  filteredDestinations[index].id
                ].showCallout();
              }
            }
          }}
        />
      </View>

      {/* Selected Destination Details Card */}
      <Animated.View
        style={[
          styles.destinationCard,
          { transform: [{ translateY: cardAnimation }] },
        ]}
      >
        {selectedDestination && (
          <>
            <View style={styles.destinationCardHandle} />

            <View style={styles.destinationCardHeader}>
              <View>
                <Text style={styles.destinationCardTitle}>
                  {selectedDestination.name}
                </Text>
                <Text style={styles.destinationCardSubtitle}>
                  {selectedDestination.country}
                </Text>
              </View>
              <View style={styles.destinationCardRating}>
                <AntDesign name="star" size={16} color="#FFD700" />
                <Text style={styles.destinationCardRatingText}>
                  {selectedDestination.rating}
                </Text>
              </View>
            </View>

            <Text style={styles.destinationCardDescription}>
              {selectedDestination.description}
            </Text>

            <View style={styles.destinationCardActions}>
              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => handleCardPress(selectedDestination)}
              >
                <MaterialIcons name="info-outline" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Details</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => {
                  // Open in Maps app with coordinates
                  alert("Would open in Maps app");
                }}
              >
                <MaterialIcons name="directions" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.destinationCardAction}
                onPress={() => {
                  // Save to favorites
                  alert("Added to favorites");
                }}
              >
                <Ionicons name="heart-outline" size={22} color="#3498db" />
                <Text style={styles.destinationCardActionText}>Favorite</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.planTripButton} onPress={planTrip}>
              <FontAwesome5
                name="robot"
                size={18}
                color="#fff"
                style={styles.planTripIcon}
              />
              <Text style={styles.planTripButtonText}>Plan Trip with AI</Text>
            </TouchableOpacity>
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerButton: {
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
  searchBarContainer: {
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filtersContainer: {
    paddingVertical: 15,
  },
  filtersList: {
    paddingHorizontal: 20,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeFilterItem: {
    backgroundColor: "#3498db",
  },
  filterText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#333",
  },
  activeFilterText: {
    color: "#fff",
  },
  mapContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    margin: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  mapControls: {
    position: "absolute",
    right: 15,
    top: 15,
    alignItems: "center",
  },
  mapControlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  markerContainer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3498db",
    borderWidth: 2,
    borderColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  selectedMarker: {
    backgroundColor: "#e74c3c",
    transform: [{ scale: 1.2 }],
  },
  markerInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  popularDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFD700",
  },
  calloutContainer: {
    backgroundColor: "white",
    borderRadius: 8,
    padding: 10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 150,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#333",
  },
  calloutSubtitle: {
    fontSize: 12,
    color: "#666",
  },
  userLocationMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(52, 152, 219, 0.3)",
    borderWidth: 1,
    borderColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
  },
  userLocationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3498db",
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
  carouselContainer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
  },
  carousel: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 15,
    marginHorizontal: 10,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
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
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 22,
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
  },
  destinationCard: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 30,
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  destinationCardHandle: {
    width: 40,
    height: 5,
    backgroundColor: "#e0e0e0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 15,
  },
  destinationCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  destinationCardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  destinationCardSubtitle: {
    fontSize: 16,
    color: "#666",
  },
  destinationCardRating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  destinationCardRatingText: {
    marginLeft: 5,
    fontWeight: "bold",
    color: "#333",
  },
  destinationCardDescription: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 15,
  },
  destinationCardActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  destinationCardAction: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
  },
  destinationCardActionText: {
    marginTop: 5,
    fontSize: 12,
    color: "#666",
  },
  planTripButton: {
    flexDirection: "row",
    backgroundColor: "#3498db",
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  planTripIcon: {
    marginRight: 8,
  },
  planTripButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "white",
  },
});

export default Globe;
