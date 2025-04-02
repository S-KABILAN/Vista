import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Switch,
  Alert,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import {
  AntDesign,
  Ionicons,
  MaterialIcons,
  MaterialCommunityIcons,
  Feather,
} from "@expo/vector-icons";

const AdminContentManager = ({ navigation }) => {
  // Content section states
  const [activeTab, setActiveTab] = useState("featured");

  // Featured destinations state
  const [featuredDestinations, setFeaturedDestinations] = useState([
    {
      id: "1",
      name: "Paris, France",
      description: "The city of lights",
      imageUrl: "https://source.unsplash.com/random/400x200/?paris",
      isActive: true,
    },
    {
      id: "2",
      name: "Tokyo, Japan",
      description: "Modern metropolis",
      imageUrl: "https://source.unsplash.com/random/400x200/?tokyo",
      isActive: true,
    },
    {
      id: "3",
      name: "Rome, Italy",
      description: "Ancient history",
      imageUrl: "https://source.unsplash.com/random/400x200/?rome",
      isActive: false,
    },
  ]);

  // Travel tips state
  const [travelTips, setTravelTips] = useState([
    {
      id: "1",
      title: "Packing Essentials",
      content: "Always pack a travel adapter and power bank.",
      category: "Planning",
      isPublished: true,
    },
    {
      id: "2",
      title: "Safety Tips",
      content: "Keep digital copies of your important documents.",
      category: "Safety",
      isPublished: true,
    },
    {
      id: "3",
      title: "Budget Travel",
      content: "Use local transportation instead of taxis.",
      category: "Budget",
      isPublished: false,
    },
  ]);

  // Promotions state
  const [promotions, setPromotions] = useState([
    {
      id: "1",
      title: "Summer Special",
      description: "20% off on all summer packages",
      startDate: "2023-06-01",
      endDate: "2023-08-31",
      isActive: true,
    },
    {
      id: "2",
      title: "Early Bird",
      description: "15% off when booking 3 months in advance",
      startDate: "2023-01-01",
      endDate: "2023-12-31",
      isActive: true,
    },
  ]);

  // Toggle destination active status
  const toggleDestinationStatus = (id) => {
    const updatedDestinations = featuredDestinations.map((dest) =>
      dest.id === id ? { ...dest, isActive: !dest.isActive } : dest
    );
    setFeaturedDestinations(updatedDestinations);
  };

  // Toggle tip published status
  const toggleTipStatus = (id) => {
    const updatedTips = travelTips.map((tip) =>
      tip.id === id ? { ...tip, isPublished: !tip.isPublished } : tip
    );
    setTravelTips(updatedTips);
  };

  // Toggle promotion active status
  const togglePromotionStatus = (id) => {
    const updatedPromotions = promotions.map((promo) =>
      promo.id === id ? { ...promo, isActive: !promo.isActive } : promo
    );
    setPromotions(updatedPromotions);
  };

  // Delete content functions
  const deleteDestination = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this destination?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedDestinations = featuredDestinations.filter(
              (dest) => dest.id !== id
            );
            setFeaturedDestinations(updatedDestinations);
            Alert.alert("Success", "Destination deleted successfully");
          },
        },
      ]
    );
  };

  const deleteTravelTip = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this travel tip?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedTips = travelTips.filter((tip) => tip.id !== id);
            setTravelTips(updatedTips);
            Alert.alert("Success", "Travel tip deleted successfully");
          },
        },
      ]
    );
  };

  const deletePromotion = (id) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this promotion?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const updatedPromotions = promotions.filter(
              (promo) => promo.id !== id
            );
            setPromotions(updatedPromotions);
            Alert.alert("Success", "Promotion deleted successfully");
          },
        },
      ]
    );
  };

  // Render tab content
  const renderContent = () => {
    switch (activeTab) {
      case "featured":
        return (
          <View style={styles.tabContent}>
            <View style={styles.headerWithButton}>
              <Text style={styles.tabTitle}>Featured Destinations</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  Alert.alert(
                    "Add Destination",
                    "Add destination form would appear here"
                  )
                }
              >
                <AntDesign name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {featuredDestinations.map((destination) => (
              <View key={destination.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <Image
                    source={{ uri: destination.imageUrl }}
                    style={styles.destinationImage}
                  />
                  <View style={styles.contentDetails}>
                    <Text style={styles.contentTitle}>{destination.name}</Text>
                    <Text style={styles.contentDescription}>
                      {destination.description}
                    </Text>
                  </View>
                </View>

                <View style={styles.contentActions}>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>
                      Status:{" "}
                      <Text
                        style={
                          destination.isActive
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        {destination.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Text>
                    <Switch
                      value={destination.isActive}
                      onValueChange={() =>
                        toggleDestinationStatus(destination.id)
                      }
                      trackColor={{ false: "#ccc", true: "#81b0ff" }}
                      thumbColor={destination.isActive ? "#3498db" : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        Alert.alert("Edit", `Edit ${destination.name} details`)
                      }
                    >
                      <Feather name="edit-2" size={18} color="#3498db" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteDestination(destination.id)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#e74c3c"
                      />
                      <Text
                        style={[styles.actionButtonText, { color: "#e74c3c" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );

      case "tips":
        return (
          <View style={styles.tabContent}>
            <View style={styles.headerWithButton}>
              <Text style={styles.tabTitle}>Travel Tips</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  Alert.alert(
                    "Add Travel Tip",
                    "Add travel tip form would appear here"
                  )
                }
              >
                <AntDesign name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {travelTips.map((tip) => (
              <View key={tip.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <View
                    style={[
                      styles.categoryBadge,
                      tip.isPublished
                        ? styles.publishedBadge
                        : styles.draftBadge,
                    ]}
                  >
                    <Text style={styles.categoryText}>{tip.category}</Text>
                  </View>
                  <View style={styles.contentDetails}>
                    <Text style={styles.contentTitle}>{tip.title}</Text>
                    <Text style={styles.contentDescription}>{tip.content}</Text>
                  </View>
                </View>

                <View style={styles.contentActions}>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>
                      Status:{" "}
                      <Text
                        style={
                          tip.isPublished
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        {tip.isPublished ? "Published" : "Draft"}
                      </Text>
                    </Text>
                    <Switch
                      value={tip.isPublished}
                      onValueChange={() => toggleTipStatus(tip.id)}
                      trackColor={{ false: "#ccc", true: "#81b0ff" }}
                      thumbColor={tip.isPublished ? "#3498db" : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        Alert.alert("Edit", `Edit ${tip.title} content`)
                      }
                    >
                      <Feather name="edit-2" size={18} color="#3498db" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deleteTravelTip(tip.id)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#e74c3c"
                      />
                      <Text
                        style={[styles.actionButtonText, { color: "#e74c3c" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );

      case "promotions":
        return (
          <View style={styles.tabContent}>
            <View style={styles.headerWithButton}>
              <Text style={styles.tabTitle}>Promotions</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() =>
                  Alert.alert(
                    "Add Promotion",
                    "Add promotion form would appear here"
                  )
                }
              >
                <AntDesign name="plus" size={20} color="#fff" />
                <Text style={styles.addButtonText}>Add New</Text>
              </TouchableOpacity>
            </View>

            {promotions.map((promo) => (
              <View key={promo.id} style={styles.contentCard}>
                <View style={styles.contentHeader}>
                  <View style={styles.contentDetails}>
                    <Text style={styles.contentTitle}>{promo.title}</Text>
                    <Text style={styles.contentDescription}>
                      {promo.description}
                    </Text>
                    <Text style={styles.dateText}>
                      {`${new Date(
                        promo.startDate
                      ).toLocaleDateString()} - ${new Date(
                        promo.endDate
                      ).toLocaleDateString()}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.contentActions}>
                  <View style={styles.statusContainer}>
                    <Text style={styles.statusLabel}>
                      Status:{" "}
                      <Text
                        style={
                          promo.isActive
                            ? styles.activeStatus
                            : styles.inactiveStatus
                        }
                      >
                        {promo.isActive ? "Active" : "Inactive"}
                      </Text>
                    </Text>
                    <Switch
                      value={promo.isActive}
                      onValueChange={() => togglePromotionStatus(promo.id)}
                      trackColor={{ false: "#ccc", true: "#81b0ff" }}
                      thumbColor={promo.isActive ? "#3498db" : "#f4f3f4"}
                    />
                  </View>

                  <View style={styles.actionButtonsContainer}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        Alert.alert("Edit", `Edit ${promo.title} details`)
                      }
                    >
                      <Feather name="edit-2" size={18} color="#3498db" />
                      <Text style={styles.actionButtonText}>Edit</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => deletePromotion(promo.id)}
                    >
                      <MaterialIcons
                        name="delete-outline"
                        size={18}
                        color="#e74c3c"
                      />
                      <Text
                        style={[styles.actionButtonText, { color: "#e74c3c" }]}
                      >
                        Delete
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="arrowleft" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Content Manager</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Navigation Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "featured" && styles.activeTab]}
          onPress={() => setActiveTab("featured")}
        >
          <MaterialIcons
            name="explore"
            size={22}
            color={activeTab === "featured" ? "#3498db" : "#777"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "featured" && styles.activeTabText,
            ]}
          >
            Featured
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "tips" && styles.activeTab]}
          onPress={() => setActiveTab("tips")}
        >
          <Ionicons
            name="bulb-outline"
            size={22}
            color={activeTab === "tips" ? "#3498db" : "#777"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "tips" && styles.activeTabText,
            ]}
          >
            Tips
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === "promotions" && styles.activeTab]}
          onPress={() => setActiveTab("promotions")}
        >
          <MaterialCommunityIcons
            name="sale"
            size={22}
            color={activeTab === "promotions" ? "#3498db" : "#777"}
          />
          <Text
            style={[
              styles.tabText,
              activeTab === "promotions" && styles.activeTabText,
            ]}
          >
            Promotions
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
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
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: "#ecf5fe",
  },
  tabText: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },
  activeTabText: {
    color: "#3498db",
    fontWeight: "600",
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  headerWithButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  tabTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  addButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contentHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  destinationImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  contentDetails: {
    flex: 1,
    justifyContent: "center",
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contentDescription: {
    fontSize: 14,
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
    marginTop: 6,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginRight: 12,
  },
  publishedBadge: {
    backgroundColor: "#2ecc71",
  },
  draftBadge: {
    backgroundColor: "#f39c12",
  },
  categoryText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  contentActions: {
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 12,
    marginTop: 8,
  },
  statusContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 14,
    color: "#666",
  },
  activeStatus: {
    color: "#2ecc71",
    fontWeight: "600",
  },
  inactiveStatus: {
    color: "#e74c3c",
    fontWeight: "600",
  },
  actionButtonsContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 12,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#3498db",
  },
});

export default AdminContentManager;
