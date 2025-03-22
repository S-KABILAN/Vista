import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  StyleSheet,
  Dimensions,
} from "react-native";

const { width } = Dimensions.get("window");

// AttractionCard component with image carousel and intelligent image fallbacks
const AttractionCard = ({ attraction, apiKey, onImagePress }) => {
  // Prepare image sources for the attraction
  const getImageSources = () => {
    const sources = [];

    // Add photo reference images if available (highest priority)
    if (attraction.photo) {
      sources.push({
        uri: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${attraction.photo}&key=${apiKey}`,
      });
    }

    // Add images array if available
    if (attraction.images && attraction.images.length > 0) {
      attraction.images.forEach((imageUri) => {
        sources.push({ uri: imageUri });
      });
    }

    // Add imageUrl if available and not already added
    if (
      attraction.imageUrl &&
      (!attraction.images || !attraction.images.includes(attraction.imageUrl))
    ) {
      sources.push({ uri: attraction.imageUrl });
    }

    // If no images are available, use Unsplash to get a contextual image
    // based on attraction type and name instead of a map
    if (sources.length === 0) {
      // Extract keywords from the attraction name and type
      const keywords = getRelevantKeywords(attraction);
      sources.push({
        uri: `https://source.unsplash.com/800x600/?${encodeURIComponent(
          keywords
        )}`,
      });
    }

    return sources;
  };

  // Helper function to extract relevant keywords from attraction
  const getRelevantKeywords = (attraction) => {
    let keywords = attraction.name;

    // Add attraction type if available
    if (attraction.types && attraction.types.length > 0) {
      // Map API types to more search-friendly terms
      const typeMapping = {
        tourist_attraction: "landmark",
        museum: "museum",
        art_gallery: "art gallery",
        amusement_park: "amusement park",
        aquarium: "aquarium",
        church: "church",
        hindu_temple: "hindu temple",
        mosque: "mosque",
        synagogue: "synagogue",
        temple: "temple",
        zoo: "zoo",
        park: "park",
        natural_feature: "nature",
        point_of_interest: "landmark",
      };

      // Find the first type that has a mapping
      const matchedType = attraction.types.find((type) => typeMapping[type]);
      if (matchedType) {
        keywords += `,${typeMapping[matchedType]}`;
      }
    }

    // Check for specific keywords in the name
    const commonLandmarks = [
      "temple",
      "church",
      "mosque",
      "cathedral",
      "museum",
      "palace",
      "castle",
      "fort",
      "monument",
      "statue",
      "garden",
      "park",
      "mountain",
      "beach",
      "lake",
      "waterfall",
      "bridge",
      "tower",
      "market",
      "square",
    ];

    // Add the first landmark keyword found in the name
    const landmarkWord = commonLandmarks.find((word) =>
      attraction.name.toLowerCase().includes(word)
    );

    if (landmarkWord && !keywords.toLowerCase().includes(landmarkWord)) {
      keywords += `,${landmarkWord}`;
    }

    // Add "travel" to ensure we get travel-related images
    keywords += ",travel,landmark";

    return keywords;
  };

  const imageSources = getImageSources();

  return (
    <View style={styles.attractionItem}>
      <View style={styles.attractionContent}>
        <Text style={styles.attractionName}>{attraction.name}</Text>
        {attraction.rating && (
          <Text style={styles.attractionRating}>
            Rating: {attraction.rating}/5
          </Text>
        )}
        {attraction.address && (
          <Text style={styles.attractionAddress}>{attraction.address}</Text>
        )}
      </View>

      {imageSources.length > 0 && (
        <View style={styles.imageCarouselContainer}>
          {imageSources.length === 1 ? (
            // Single image
            <TouchableOpacity onPress={() => onImagePress(imageSources[0].uri)}>
              <Image
                source={imageSources[0]}
                style={styles.attractionImage}
                resizeMode="cover"
              />
            </TouchableOpacity>
          ) : (
            // Multiple images - show carousel
            <FlatList
              data={imageSources}
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              keyExtractor={(_, index) => `image-${index}`}
              renderItem={({ item, index }) => (
                <TouchableOpacity onPress={() => onImagePress(item.uri)}>
                  <Image
                    source={item}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              )}
            />
          )}
          {imageSources.length > 1 && (
            <View style={styles.imageCountBadge}>
              <Text style={styles.imageCountText}>
                {imageSources.length} photos
              </Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  attractionItem: {
    backgroundColor: "#F9F9F9",
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  attractionContent: {
    flex: 1,
    marginRight: 10,
  },
  attractionName: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
  },
  attractionRating: {
    fontSize: 14,
    color: "#FF9800",
    marginBottom: 5,
  },
  attractionAddress: {
    fontSize: 14,
    color: "#666",
  },
  imageCarouselContainer: {
    position: "relative",
    width: 120,
    height: 120,
    borderRadius: 10,
    overflow: "hidden",
  },
  attractionImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  carouselImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  imageCountBadge: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  imageCountText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "bold",
  },
});

export default AttractionCard;
