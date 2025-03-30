import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Animated,
  Dimensions,
  FlatList,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Ionicons,
  MaterialIcons,
  FontAwesome5,
  Feather,
} from "@expo/vector-icons";
import * as TravelPlanService from "../services/TravelPlanService";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

const CulturalInsights = ({ route, navigation }) => {
  const { destination } = route.params || { destination: "Paris" };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [insights, setInsights] = useState(null);
  const [activeSection, setActiveSection] = useState(0);
  const scrollX = new Animated.Value(0);

  useEffect(() => {
    fetchCulturalInsights();
  }, [destination]);

  const fetchCulturalInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await TravelPlanService.getCulturalInsights(destination);
      console.log("Cultural insights:", response);
      setInsights(response);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching cultural insights:", error);
      setError(error.toString());
      setLoading(false);
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const getIconForSection = (title) => {
    switch (title.toLowerCase()) {
      case "local customs & etiquette":
        return "hands-helping";
      case "cultural context":
        return "history";
      case "communication tips":
        return "comments";
      case "practical tips":
        return "lightbulb";
      default:
        return "info-circle";
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <ActivityIndicator size="large" color="#4c669f" />
        <Text style={styles.loadingText}>
          Generating cultural insights for {destination}...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <StatusBar barStyle="dark-content" />
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Ionicons name="warning-outline" size={48} color="#ff6b6b" />
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={fetchCulturalInsights}
        >
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Culture of {destination}</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchCulturalInsights}
        >
          <Ionicons name="refresh" size={24} color="#4c669f" />
        </TouchableOpacity>
      </View>

      {/* Card showing the main cover */}
      <View style={styles.heroCard}>
        <LinearGradient
          colors={["#4c669f", "#3b5998", "#192f6a"]}
          style={styles.gradientBackground}
        >
          <View style={styles.heroContent}>
            <FontAwesome5 name="globe-americas" size={40} color="#fff" />
            <Text style={styles.heroTitle}>Cultural Guide to</Text>
            <Text style={styles.heroDestination}>{destination}</Text>
            <Text style={styles.heroSubtitle}>
              Essential insights for respectful travel
            </Text>
          </View>
        </LinearGradient>
      </View>

      {/* Section navigator */}
      <View style={styles.sectionNav}>
        <FlatList
          data={insights?.sections || []}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `section-${index}`}
          contentContainerStyle={styles.sectionNavContent}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.sectionTab,
                activeSection === index && styles.activeTab,
              ]}
              onPress={() => {
                setActiveSection(index);
                if (sectionListRef.current) {
                  sectionListRef.current.scrollToOffset({
                    offset: index * width,
                    animated: true,
                  });
                }
              }}
            >
              <FontAwesome5
                name={getIconForSection(item.title)}
                size={16}
                color={activeSection === index ? "#4c669f" : "#777"}
              />
              <Text
                style={[
                  styles.sectionTabText,
                  activeSection === index && styles.activeTabText,
                ]}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Section content */}
      <Animated.FlatList
        ref={sectionListRef}
        data={insights?.sections || []}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `content-${index}`}
        onScroll={handleScroll}
        onMomentumScrollEnd={(event) => {
          const newIndex = Math.round(
            event.nativeEvent.contentOffset.x / width
          );
          setActiveSection(newIndex);
        }}
        renderItem={({ item }) => (
          <ScrollView
            style={styles.sectionContent}
            contentContainerStyle={styles.sectionContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sectionHeader}>
              <FontAwesome5
                name={getIconForSection(item.title)}
                size={24}
                color="#4c669f"
              />
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>

            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{item.content}</Text>
            </View>
          </ScrollView>
        )}
      />
    </SafeAreaView>
  );
};

// Create a reference for the FlatList
const sectionListRef = React.createRef();

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    textAlign: "center",
    color: "#555",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 16,
    color: "#333",
  },
  errorText: {
    textAlign: "center",
    marginTop: 8,
    color: "#555",
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 10,
    paddingHorizontal: 24,
    backgroundColor: "#4c669f",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    backgroundColor: "#fff",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  refreshButton: {
    padding: 8,
  },
  heroCard: {
    margin: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  gradientBackground: {
    borderRadius: 12,
    overflow: "hidden",
  },
  heroContent: {
    padding: 24,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    opacity: 0.9,
  },
  heroDestination: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginVertical: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.8,
    textAlign: "center",
  },
  sectionNav: {
    backgroundColor: "#fff",
    paddingVertical: 8,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  sectionNavContent: {
    paddingHorizontal: 16,
  },
  sectionTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: "#f1f1f1",
  },
  activeTab: {
    backgroundColor: "#e6e9f0",
    borderColor: "#4c669f",
    borderWidth: 1,
  },
  sectionTabText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#777",
  },
  activeTabText: {
    color: "#4c669f",
    fontWeight: "bold",
  },
  sectionContent: {
    width,
  },
  sectionContentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 12,
  },
  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
});

export default CulturalInsights;
