import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import {
  Ionicons,
  AntDesign,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";
import HotelCard from "../components/HotelCard";
import AttractionCard from "../components/AttractionCard";
import axios from "axios";
import { BACKEND_URL } from "../config";

const AllHotels = ({ route, navigation }) => {
  const {
    destination,
    amadeusHotels = [],
    recommendedHotels = [],
    coordinates,
    checkInDate,
    checkOutDate,
  } = route.params || {};

  const [hotels, setHotels] = useState([...amadeusHotels]);
  const [googleHotels, setGoogleHotels] = useState([...recommendedHotels]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [priceFilter, setPriceFilter] = useState("all"); // 'all', 'low', 'medium', 'high'
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = no filter, 1-5 = minimum rating

  // Fetch more hotels if we have coordinates
  useEffect(() => {
    const fetchMoreHotels = async () => {
      if (!coordinates) {
        console.log("No coordinates available, skipping hotel fetch");
        return;
      }

      setLoading(true);
      try {
        // Ensure coordinates are in the correct format
        const lat = coordinates.lat || coordinates.latitude;
        const lng = coordinates.lng || coordinates.longitude;

        if (!lat || !lng) {
          console.error("Invalid coordinates format:", coordinates);
          setLoading(false);
          return;
        }

        console.log(
          `Fetching hotels for coordinates: ${lat}, ${lng} from ${BACKEND_URL}/api/hotels`
        );

        const response = await axios.get(`${BACKEND_URL}/api/hotels`, {
          params: {
            lat,
            lng,
            destination,
            checkInDate,
            checkOutDate,
          },
          timeout: 15000, // 15 second timeout
        });

        console.log("API response received:", response.status);

        if (response.data?.amadeusHotels?.length) {
          console.log(
            `Got ${response.data.amadeusHotels.length} Amadeus hotels`
          );
          setHotels((prevHotels) => {
            // Combine and remove duplicates by id
            const allHotels = [...prevHotels, ...response.data.amadeusHotels];
            const uniqueHotels = Array.from(
              new Map(allHotels.map((h) => [h.id, h])).values()
            );
            return uniqueHotels;
          });
        } else {
          console.log("No Amadeus hotels returned from API");
        }

        if (response.data?.googleHotels?.length) {
          console.log(`Got ${response.data.googleHotels.length} Google hotels`);
          setGoogleHotels((prevHotels) => {
            // Combine and remove duplicates by place_id
            const allHotels = [...prevHotels, ...response.data.googleHotels];
            const uniqueHotels = Array.from(
              new Map(allHotels.map((h) => [h.place_id, h])).values()
            );
            return uniqueHotels;
          });
        } else {
          console.log("No Google hotels returned from API");
        }
      } catch (error) {
        console.error(
          "Error fetching more hotels:",
          error.response?.data || error.message
        );
        // Display error to user
        Alert.alert(
          "Error Loading Hotels",
          "Could not load additional hotels. Please try again later.",
          [{ text: "OK" }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMoreHotels();
  }, [coordinates, destination]);

  // Filter hotels based on search text and filters
  const filteredHotels = [
    ...hotels,
    ...googleHotels.map((hotel) => ({
      id: hotel.place_id || `google-${Math.random()}`,
      name: hotel.name,
      rating: hotel.rating,
      address: {
        cityName: destination,
        countryCode: "",
      },
      price: hotel.price_level
        ? "$".repeat(hotel.price_level)
        : "Price unavailable",
      currency: "USD",
      isGoogle: true,
      photos: hotel.photos ? [{ url: hotel.photos[0]?.url }] : [],
    })),
  ]
    .filter((hotel) => {
      // Text filter
      const matchesText =
        filterText === "" ||
        hotel.name.toLowerCase().includes(filterText.toLowerCase());

      // Rating filter
      const matchesRating =
        ratingFilter === 0 ||
        (hotel.rating && parseFloat(hotel.rating) >= ratingFilter);

      // Price filter
      let matchesPrice = true;
      if (priceFilter !== "all") {
        const priceValue = hotel.isGoogle
          ? hotel.price_level
            ? hotel.price_level
            : 0
          : typeof hotel.price === "string"
          ? hotel.price.startsWith("$")
            ? hotel.price.length
            : 2
          : parseFloat(hotel.price) < 100
          ? 1
          : parseFloat(hotel.price) < 200
          ? 2
          : 3;

        matchesPrice =
          (priceFilter === "low" && priceValue <= 1) ||
          (priceFilter === "medium" && priceValue > 1 && priceValue <= 3) ||
          (priceFilter === "high" && priceValue > 3);
      }

      return matchesText && matchesRating && matchesPrice;
    })
    .sort((a, b) => {
      // Sort by rating (highest first)
      return (b.rating || 0) - (a.rating || 0);
    });

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <View style={styles.priceButtons}>
        <Text style={styles.filterLabel}>Price:</Text>
        <TouchableOpacity
          style={[
            styles.filterButton,
            priceFilter === "all" && styles.activeFilter,
          ]}
          onPress={() => setPriceFilter("all")}
        >
          <Text style={styles.filterButtonText}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            priceFilter === "low" && styles.activeFilter,
          ]}
          onPress={() => setPriceFilter("low")}
        >
          <Text style={styles.filterButtonText}>$</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            priceFilter === "medium" && styles.activeFilter,
          ]}
          onPress={() => setPriceFilter("medium")}
        >
          <Text style={styles.filterButtonText}>$$</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            priceFilter === "high" && styles.activeFilter,
          ]}
          onPress={() => setPriceFilter("high")}
        >
          <Text style={styles.filterButtonText}>$$$+</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.ratingButtons}>
        <Text style={styles.filterLabel}>Rating:</Text>
        {[0, 3, 4, 5].map((rating) => (
          <TouchableOpacity
            key={`rating-${rating}`}
            style={[
              styles.filterButton,
              ratingFilter === rating && styles.activeFilter,
            ]}
            onPress={() => setRatingFilter(rating)}
          >
            <Text
              style={[
                styles.filterButtonText,
                ratingFilter === rating && styles.activeFilterText,
              ]}
            >
              {rating === 0 ? "All" : `${rating}+`}
              {rating > 0 && (
                <FontAwesome
                  name="star"
                  size={12}
                  color={ratingFilter === rating ? "#fff" : "gold"}
                />
              )}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderHeader = () => (
    <View>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search hotels..."
          value={filterText}
          onChangeText={setFilterText}
          placeholderTextColor="#999"
        />
        {filterText !== "" && (
          <TouchableOpacity onPress={() => setFilterText("")}>
            <Ionicons name="close-circle" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      {renderFilterButtons()}

      <Text style={styles.resultsText}>
        {filteredHotels.length}{" "}
        {filteredHotels.length === 1 ? "hotel" : "hotels"} found
      </Text>
    </View>
  );

  const renderHotelItem = ({ item }) => {
    if (item.isGoogle) {
      return (
        <AttractionCard
          item={{
            name: item.name,
            rating: item.rating,
            address: item.address.cityName || item.address,
            category: "Hotel",
            photo: item.photos?.[0]?.url,
            price: item.price,
          }}
          showPricing={true}
        />
      );
    }

    return <HotelCard hotel={item} showPricing={true} />;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Hotels in {destination}</Text>
      </View>

      <FlatList
        data={filteredHotels}
        renderItem={renderHotelItem}
        keyExtractor={(item) => item.id || Math.random().toString()}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={
          loading ? (
            <ActivityIndicator
              style={styles.loader}
              size="large"
              color="#3498db"
            />
          ) : null
        }
      />
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eaeaea",
    backgroundColor: "#fff",
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    margin: 16,
    borderWidth: 1,
    borderColor: "#eaeaea",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 14,
    color: "#666",
    marginRight: 8,
  },
  priceButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    marginRight: 8,
  },
  activeFilter: {
    backgroundColor: "#3498db",
  },
  filterButtonText: {
    color: "#333",
    fontSize: 14,
  },
  activeFilterText: {
    color: "#fff",
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
});

export default AllHotels;
