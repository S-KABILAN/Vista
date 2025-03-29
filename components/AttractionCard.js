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
import { MaterialIcons } from "@expo/vector-icons";
import { FontAwesome5 } from "@expo/vector-icons";
import { FontAwesome } from "@expo/vector-icons";

const { width } = Dimensions.get("window");

// AttractionCard component with image carousel and intelligent image fallbacks
const AttractionCard = ({ item, onPress, showPricing = false }) => {
  // Make sure item is always defined with default values
  const safeItem = item || { name: 'Unknown', category: 'Unknown', rating: 'N/A' };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {safeItem.photo ? (
          <Image 
            source={{ uri: safeItem.photo }} 
            style={styles.image}
            resizeMode="cover" 
          />
        ) : (
          <View style={[styles.image, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
            <FontAwesome5 name="hotel" size={30} color="#ccc" />
          </View>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{safeItem.name}</Text>
        
        <View style={styles.detailsRow}>
          <Text style={styles.category}>{safeItem.category}</Text>
          
          {safeItem.rating && (
            <View style={styles.ratingContainer}>
              <FontAwesome name="star" size={14} color="#FFD700" />
              <Text style={styles.rating}>{safeItem.rating}</Text>
            </View>
          )}
        </View>
        
        {safeItem.address && (
          <Text style={styles.address} numberOfLines={1}>
            {safeItem.address}
          </Text>
        )}
        
        {showPricing && safeItem.price && (
          <Text style={styles.price}>
            {safeItem.price}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
    height: 110,
  },
  imageContainer: {
    width: 110,
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  category: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 4,
  },
});

export default AttractionCard;
