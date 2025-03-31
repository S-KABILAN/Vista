import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import { BACKEND_URL } from "../config";

// Travel tips categories
const categories = [
  {
    id: "packing",
    name: "Packing Tips",
    icon: "suitcase",
    iconFamily: "FontAwesome5",
  },
  {
    id: "safety",
    name: "Travel Safety",
    icon: "shield-check",
    iconFamily: "MaterialIcons",
  },
  {
    id: "budget",
    name: "Budget Travel",
    icon: "wallet",
    iconFamily: "FontAwesome5",
  },
  {
    id: "photography",
    name: "Photography",
    icon: "camera",
    iconFamily: "Ionicons",
  },
  {
    id: "eco",
    name: "Eco-Friendly",
    icon: "leaf",
    iconFamily: "FontAwesome5",
  },
  {
    id: "language",
    name: "Language Tips",
    icon: "language",
    iconFamily: "FontAwesome5",
  },
  {
    id: "food",
    name: "Food & Dining",
    icon: "restaurant",
    iconFamily: "Ionicons",
  },
  {
    id: "tech",
    name: "Tech Tips",
    icon: "devices",
    iconFamily: "MaterialIcons",
  },
];

// Placeholder tips in case the API fails
const placeholderTips = {
  packing: [
    {
      id: "p1",
      title: "Roll, Don't Fold",
      content:
        "Rolling your clothes instead of folding them saves space and reduces wrinkles. Use packing cubes for better organization.",
      imageUrl: "https://source.unsplash.com/random/?packing",
    },
    {
      id: "p2",
      title: "Pack Versatile Clothing",
      content:
        "Choose items that can be mixed and matched to create different outfits, and stick to a similar color palette.",
      imageUrl: "https://source.unsplash.com/random/?clothing",
    },
  ],
  safety: [
    {
      id: "s1",
      title: "Digital Copies of Documents",
      content:
        "Always keep digital copies of your passport, ID, and important documents in your email or cloud storage.",
      imageUrl: "https://source.unsplash.com/random/?passport",
    },
    {
      id: "s2",
      title: "Emergency Contacts",
      content:
        "Save local emergency numbers and your country's embassy contact information before traveling.",
      imageUrl: "https://source.unsplash.com/random/?emergency",
    },
  ],
  budget: [
    {
      id: "b1",
      title: "Travel During Off-Season",
      content:
        "Prices for accommodations and flights are significantly lower during off-peak seasons. You'll also encounter fewer tourists.",
      imageUrl: "https://source.unsplash.com/random/?offseason",
    },
    {
      id: "b2",
      title: "Use Public Transportation",
      content:
        "Local buses, metros, and trains are much more affordable than taxis or rental cars, and they provide a more authentic experience.",
      imageUrl: "https://source.unsplash.com/random/?publictransport",
    },
  ],
  photography: [
    {
      id: "ph1",
      title: "Golden Hour Magic",
      content:
        "Take photos during the 'golden hour' (shortly after sunrise or before sunset) for warm, soft lighting that enhances landscapes and portraits.",
      imageUrl: "https://source.unsplash.com/random/?goldenhour",
    },
    {
      id: "ph2",
      title: "Rule of Thirds",
      content:
        "Align your subject with the guidelines or intersection points of your camera's grid to create more balanced and interesting compositions.",
      imageUrl: "https://source.unsplash.com/random/?composition",
    },
  ],
  eco: [
    {
      id: "e1",
      title: "Bring Reusable Items",
      content:
        "Pack a reusable water bottle, shopping bag, and utensils to reduce single-use plastic waste during your travels.",
      imageUrl: "https://source.unsplash.com/random/?reusable",
    },
    {
      id: "e2",
      title: "Support Local Businesses",
      content:
        "Eat at locally-owned restaurants and stay in family-run accommodations to support the local economy and reduce environmental impact.",
      imageUrl: "https://source.unsplash.com/random/?localbusiness",
    },
  ],
  language: [
    {
      id: "l1",
      title: "Learn Essential Phrases",
      content:
        "Memorize 10-15 key phrases in the local language, such as greetings, thank you, please, and how to ask for help or directions.",
      imageUrl: "https://source.unsplash.com/random/?language",
    },
    {
      id: "l2",
      title: "Download Offline Dictionaries",
      content:
        "Make sure your translation apps have offline capabilities so you can use them without data or Wi-Fi.",
      imageUrl: "https://source.unsplash.com/random/?dictionary",
    },
  ],
  food: [
    {
      id: "f1",
      title: "Follow the Locals",
      content:
        "Restaurants filled with locals usually offer the most authentic and best-value food. Avoid eateries with tourist menus in multiple languages.",
      imageUrl: "https://source.unsplash.com/random/?localrestaurant",
    },
    {
      id: "f2",
      title: "Try Street Food (Safely)",
      content:
        "Street food can be some of the best cuisine! Look for busy stalls with high turnover and where food is cooked fresh in front of you.",
      imageUrl: "https://source.unsplash.com/random/?streetfood",
    },
  ],
  tech: [
    {
      id: "t1",
      title: "Universal Power Adapter",
      content:
        "A quality universal power adapter is essential for international travel. Consider one with multiple USB ports to charge several devices at once.",
      imageUrl: "https://source.unsplash.com/random/?adapter",
    },
    {
      id: "t2",
      title: "Download Offline Maps",
      content:
        "Download maps of your destination on Google Maps or Maps.me for offline use to navigate without using data or when reception is poor.",
      imageUrl: "https://source.unsplash.com/random/?maps",
    },
  ],
};

const TravelTips = ({ navigation }) => {
  const [selectedCategory, setSelectedCategory] = useState("packing");
  const [tips, setTips] = useState(placeholderTips);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch travel tips from the backend
  useEffect(() => {
    const fetchTravelTips = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${BACKEND_URL}/api/travel-tips`);
        // If there's data, use it; otherwise, use the placeholder tips
        if (response.data && Object.keys(response.data).length > 0) {
          setTips(response.data);
        }
      } catch (err) {
        console.error("Failed to fetch travel tips:", err);
        // No need to set error, we'll just use placeholder tips
      } finally {
        setLoading(false);
      }
    };

    fetchTravelTips();
  }, []);

  // Render icon based on icon family
  const renderCategoryIcon = (category) => {
    if (category.iconFamily === "FontAwesome5") {
      return (
        <FontAwesome5
          name={category.icon}
          size={22}
          color={selectedCategory === category.id ? "#fff" : "#666"}
        />
      );
    } else if (category.iconFamily === "MaterialIcons") {
      return (
        <MaterialIcons
          name={category.icon}
          size={24}
          color={selectedCategory === category.id ? "#fff" : "#666"}
        />
      );
    } else {
      return (
        <Ionicons
          name={category.icon}
          size={24}
          color={selectedCategory === category.id ? "#fff" : "#666"}
        />
      );
    }
  };

  // Render a tip card
  const renderTipCard = ({ item }) => (
    <View style={styles.tipCard}>
      <Image source={{ uri: item.imageUrl }} style={styles.tipImage} />
      <View style={styles.tipContent}>
        <Text style={styles.tipTitle}>{item.title}</Text>
        <Text style={styles.tipText}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Travel Tips</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Categories Horizontal Scroll */}
      <View style={styles.categoriesContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScrollView}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id &&
                  styles.selectedCategoryButton,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              {renderCategoryIcon(category)}
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id &&
                    styles.selectedCategoryText,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Tips Content */}
      <View style={styles.tipsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A80F0" />
            <Text style={styles.loadingText}>Loading travel tips...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={50} color="#FF6B6B" />
            <Text style={styles.errorTitle}>Oops!</Text>
            <Text style={styles.errorText}>
              We couldn't load the travel tips. Please try again later.
            </Text>
          </View>
        ) : (
          <FlatList
            data={tips[selectedCategory] || []}
            renderItem={renderTipCard}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.tipsList}
          />
        )}
      </View>

      {/* Contribute Button */}
      <TouchableOpacity style={styles.contributeButton}>
        <Ionicons name="add-circle-outline" size={20} color="#FFF" />
        <Text style={styles.contributeButtonText}>Share a Tip</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  categoriesContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
  },
  categoriesScrollView: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 10,
  },
  selectedCategoryButton: {
    backgroundColor: "#4A80F0",
  },
  categoryText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666",
    marginLeft: 6,
  },
  selectedCategoryText: {
    color: "#FFF",
  },
  tipsContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#999",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  errorTitle: {
    marginTop: 16,
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  errorText: {
    marginTop: 8,
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  tipsList: {
    padding: 16,
    paddingBottom: 80, // Space for the contribute button
  },
  tipCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipImage: {
    height: 180,
    width: "100%",
  },
  tipContent: {
    padding: 16,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#555",
  },
  contributeButton: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A80F0",
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  contributeButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default TravelTips;
