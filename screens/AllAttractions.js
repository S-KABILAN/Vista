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
  Image,
} from "react-native";
import {
  Ionicons,
  AntDesign,
  FontAwesome,
  MaterialIcons,
} from "@expo/vector-icons";
import AttractionCard from "../components/AttractionCard";
import { StatusBar } from "expo-status-bar";
import { googleapis } from "../constants/constant";

const AllAttractions = ({ route, navigation }) => {
  const { destination, attractions = [], coordinates } = route.params || {};

  const [allAttractions, setAllAttractions] = useState([...attractions]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState("");
  const [ratingFilter, setRatingFilter] = useState(0); // 0 = no filter, 1-5 = minimum rating

  // Fetch more attractions if we have coordinates
  useEffect(() => {
    // Log initial attraction count
    console.log(
      `Initial attractions received: ${attractions.length} attractions`
    );

    const fetchMoreAttractions = async () => {
      if (!coordinates) {
        console.log("No coordinates available, skipping attractions fetch");
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

        console.log(`Fetching attractions for coordinates: ${lat}, ${lng}`);

        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=tourist_attraction&keyword=landmark|popular attractions|heritage|famous places&key=${googleapis}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
          console.log(
            `Got ${data.results.length} attractions from Google Places API`
          );

          // Format attractions to match the expected structure
          const formattedAttractions = data.results.map((place) => ({
            name: place.name,
            rating: place.rating,
            address: place.vicinity,
            photos: place.photos
              ? [{ photo_reference: place.photos[0].photo_reference }]
              : [],
            place_id: place.place_id,
          }));

          setAllAttractions((prev) => {
            // Combine existing attractions with new ones, removing duplicates
            const combined = [...prev, ...formattedAttractions];
            const unique = Array.from(
              new Map(combined.map((a) => [a.name, a])).values()
            );
            return unique;
          });
        } else {
          console.log("No attractions returned from API");
        }
      } catch (error) {
        console.error("Error fetching attractions:", error);
        Alert.alert(
          "Error Loading Attractions",
          "Could not load attractions. Please try again later.",
          [{ text: "OK" }]
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMoreAttractions();
  }, [coordinates]);

  // Filter attractions based on search text and rating filter
  const filteredAttractions = allAttractions
    .filter((attraction) => {
      // Text filter
      const matchesText =
        filterText === "" ||
        attraction.name.toLowerCase().includes(filterText.toLowerCase());

      // Rating filter
      const matchesRating =
        ratingFilter === 0 ||
        (attraction.rating && parseFloat(attraction.rating) >= ratingFilter);

      return matchesText && matchesRating;
    })
    .sort((a, b) => {
      // Sort by rating (highest first)
      return (b.rating || 0) - (a.rating || 0);
    });

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
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
          placeholder="Search attractions..."
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
        {filteredAttractions.length}{" "}
        {filteredAttractions.length === 1 ? "attraction" : "attractions"} found
      </Text>
    </View>
  );

  const renderAttractionItem = ({ item }) => {
    const attractionItem = {
      name: item.name,
      rating: item.rating,
      address: item.address,
      category: "Attraction",
      photo:
        item.photos && item.photos.length > 0
          ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${item.photos[0].photo_reference}&key=${googleapis}`
          : null,
    };

    return (
      <AttractionCard
        item={attractionItem}
        onPress={() => {
          // You could navigate to a detailed view here
          Alert.alert("Attraction Selected", item.name);
        }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Attractions in {destination}</Text>
      </View>

      <FlatList
        data={filteredAttractions}
        renderItem={renderAttractionItem}
        keyExtractor={(item, index) => `attraction-${item.place_id || index}`}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No attractions found. Try adjusting your filters.
            </Text>
          </View>
        }
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
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 20,
    marginBottom: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});

export default AllAttractions;
