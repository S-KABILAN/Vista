import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AntDesign, Ionicons, MaterialIcons, FontAwesome5, Entypo } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { BACKEND_URL } from '../config';

const { width, height } = Dimensions.get('window');

const PlaceDetails = ({ route, navigation }) => {
  const { destination } = route.params;
  const [loading, setLoading] = useState(true);
  const [placeData, setPlaceData] = useState(null);
  const [attractions, setAttractions] = useState([]);
  const [weather, setWeather] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [mapError, setMapError] = useState(false);

  // Ensure we have coordinates for this destination
  // Either from the passed destination object or set default ones to prevent errors
  const coordinates = {
    latitude: destination.latitude || 37.78825,  // Default to San Francisco if not provided
    longitude: destination.longitude || -122.4324,
  };

    useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        setLoading(true);
        
        // Check if we have valid coordinates
        if (!destination.latitude || !destination.longitude) {
          console.log("Using default coordinates for", destination.name);
          // You could make an API call to your backend to get coordinates based on the place name
          // For this implementation we'll use the default coordinates defined above
        }
        
        // In a real app, fetch place details from your backend API
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mocked data for demonstration
        setPlaceData({
          id: destination.id,
          name: destination.name,
          country: destination.country,
          description: destination.description || 
            `${destination.name} is a beautiful destination located in ${destination.country}. It offers incredible experiences for travelers seeking adventure, culture, and relaxation.`,
          rating: destination.rating || 4.5,
          reviews: 827,
          image: destination.image,
          priceRange: destination.priceRange || '$$$',
          bestTimeToVisit: 'April to October',
          language: 'Local and English',
          currency: 'Local Currency',
          coordinates: coordinates,
          photos: [
            destination.image,
            'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=800&auto=format&fit=crop',
            'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?q=80&w=800&auto=format&fit=crop',
          ],
        });
        
        // Mocked attractions data
        setAttractions([
          {
            id: '1',
            name: 'Famous Landmark',
            rating: 4.7,
            reviews: 1243,
            image: 'https://images.unsplash.com/photo-1531572753322-ad063cecc140?q=80&w=800&auto=format&fit=crop',
            description: 'A must-visit landmark with stunning architecture and historical significance.',
            price: '$$',
            openingHours: '9:00 AM - 5:00 PM',
          },
          {
            id: '2',
            name: 'Local Museum',
            rating: 4.5,
            reviews: 987,
            image: 'https://images.unsplash.com/photo-1503152394-c571994fd383?q=80&w=800&auto=format&fit=crop',
            description: 'Explore the rich cultural heritage and history of the region.',
            price: '$',
            openingHours: '10:00 AM - 6:00 PM',
          },
          {
            id: '3',
            name: 'Famous Beach',
            rating: 4.8,
            reviews: 2156,
            image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800&auto=format&fit=crop',
            description: 'Crystal clear waters and golden sands make this beach a paradise.',
            price: 'Free',
            openingHours: '24 hours',
          },
        ]);
        
        // Mocked weather data
        setWeather({
          current: {
            temp: 26,
            conditions: 'Sunny',
            icon: 'sunny',
          },
          forecast: [
            { day: 'Today', temp: 26, icon: 'sunny' },
            { day: 'Tomorrow', temp: 28, icon: 'partly-sunny' },
            { day: 'Wed', temp: 25, icon: 'rainy' },
            { day: 'Thu', temp: 24, icon: 'cloudy' },
            { day: 'Fri', temp: 27, icon: 'sunny' },
          ],
        });
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching place details:', error);
        setLoading(false);
        Alert.alert(
          'Error',
          'Failed to load place details. Please try again later.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    };

    fetchPlaceDetails();
  }, [destination]);

  const toggleFavorite = () => {
    // In a real app, you would save this to user preferences
    setIsFavorite(!isFavorite);
    
    if (!isFavorite) {
      Alert.alert('Added to Favorites', `${destination.name} has been added to your favorites!`);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this amazing destination: ${destination.name} in ${destination.country}!`,
        title: `Vista Travel - ${destination.name}`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const navigateToAttractionDetails = (attraction) => {
    // Navigate to attraction details screen
    navigation.navigate('AttractionDetails', { attraction, destination });
  };

  const navigateToBooking = () => {
    // Navigate to booking screen
    navigation.navigate('PlaceGo', { destination: placeData });
  };

  const navigateToAIPlanner = () => {
    // Navigate to AI Travel Planner with this destination pre-filled
    navigation.navigate('AITravelPlanner', { 
      prefilledDestination: destination.name,
      destination: placeData
    });
  };

  const renderAttraction = ({ item }) => (
    <TouchableOpacity 
      style={styles.attractionCard}
      onPress={() => navigateToAttractionDetails(item)}
    >
      <Image source={{ uri: item.image }} style={styles.attractionImage} />
      <View style={styles.attractionContent}>
        <Text style={styles.attractionName}>{item.name}</Text>
        <View style={styles.attractionRatingContainer}>
          <AntDesign name="star" size={14} color="#FFD700" />
          <Text style={styles.attractionRating}>{item.rating}</Text>
          <Text style={styles.attractionReviews}>({item.reviews} reviews)</Text>
        </View>
        <Text style={styles.attractionPrice}>{item.price}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderWeatherDay = ({ item }) => (
    <View style={styles.weatherDay}>
      <Text style={styles.weatherDayText}>{item.day}</Text>
      <Ionicons 
        name={`ios-${item.icon}`} 
        size={24} 
        color="#3498db" 
        style={styles.weatherIcon} 
      />
      <Text style={styles.weatherTemp}>{item.temp}°C</Text>
    </View>
  );

  const renderPhotoItem = ({ item }) => (
    <TouchableOpacity style={styles.photoItem}>
      <Image source={{ uri: item }} style={styles.photoImage} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={styles.loadingText}>Loading destination details...</Text>
      </SafeAreaView>
    );
    }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: placeData.image }} 
            style={styles.headerImage} 
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'transparent', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}
          />
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <AntDesign name="arrowleft" size={24} color="#FFF" />
            </TouchableOpacity>
            <View style={styles.rightButtons}>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={toggleFavorite}
              >
                <AntDesign 
                  name={isFavorite ? "heart" : "hearto"} 
                  size={22} 
                  color={isFavorite ? "#FF6B6B" : "#FFF"} 
                />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.iconButton}
                onPress={handleShare}
              >
                <AntDesign name="sharealt" size={22} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Destination Info */}
        <View style={styles.infoContainer}>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.destinationName}>{placeData.name}</Text>
              <Text style={styles.destinationLocation}>
                <Ionicons name="location-sharp" size={16} color="#666" /> {placeData.country}
              </Text>
            </View>
            <View style={styles.ratingContainer}>
              <AntDesign name="star" size={18} color="#FFD700" />
              <Text style={styles.ratingText}>{placeData.rating}</Text>
              <Text style={styles.reviewsText}>({placeData.reviews} reviews)</Text>
            </View>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
              onPress={() => setActiveTab('overview')}
            >
              <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
                Overview
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'attractions' && styles.activeTab]}
              onPress={() => setActiveTab('attractions')}
            >
              <Text style={[styles.tabText, activeTab === 'attractions' && styles.activeTabText]}>
                Attractions
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'photos' && styles.activeTab]}
              onPress={() => setActiveTab('photos')}
            >
              <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>
                Photos
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'map' && styles.activeTab]}
              onPress={() => setActiveTab('map')}
            >
              <Text style={[styles.tabText, activeTab === 'map' && styles.activeTabText]}>
                Map
              </Text>
            </TouchableOpacity>
          </View>

          {/* Overview Tab Content */}
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.descriptionText}>{placeData.description}</Text>
              
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <FontAwesome5 name="calendar-alt" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Best Time to Visit</Text>
                    <Text style={styles.infoValue}>{placeData.bestTimeToVisit}</Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <FontAwesome5 name="language" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Language</Text>
                    <Text style={styles.infoValue}>{placeData.language}</Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <FontAwesome5 name="money-bill-wave" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Currency</Text>
                    <Text style={styles.infoValue}>{placeData.currency}</Text>
                  </View>
                </View>
                
                <View style={styles.infoItem}>
                  <FontAwesome5 name="money-bill" size={20} color="#3498db" />
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoLabel}>Price Range</Text>
                    <Text style={styles.infoValue}>{placeData.priceRange}</Text>
                  </View>
                </View>
              </View>
              
              {/* Weather Section */}
              <Text style={styles.sectionTitle}>Weather</Text>
              <View style={styles.weatherContainer}>
                <View style={styles.currentWeather}>
                  <Ionicons 
                    name={`ios-${weather.current.icon}`} 
                    size={40} 
                    color="#3498db" 
                  />
                  <Text style={styles.currentTemp}>{weather.current.temp}°C</Text>
                  <Text style={styles.currentConditions}>{weather.current.conditions}</Text>
                </View>
                <FlatList
                  data={weather.forecast}
                  renderItem={renderWeatherDay}
                  keyExtractor={(item, index) => `weather-${index}`}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.weatherForecast}
                />
              </View>
              
              {/* Top Attractions Preview */}
              <View style={styles.attractionsPreview}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>Top Attractions</Text>
                  <TouchableOpacity onPress={() => setActiveTab('attractions')}>
                    <Text style={styles.seeAllText}>See All</Text>
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={attractions.slice(0, 2)}
                  renderItem={renderAttraction}
                  keyExtractor={item => item.id}
                  horizontal={false}
                  scrollEnabled={false}
                  contentContainerStyle={styles.previewAttractionsList}
                />
              </View>
            </View>
          )}

          {/* Attractions Tab Content */}
          {activeTab === 'attractions' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Popular Attractions</Text>
              <FlatList
                data={attractions}
                renderItem={renderAttraction}
                keyExtractor={item => item.id}
                horizontal={false}
                scrollEnabled={false}
                contentContainerStyle={styles.attractionsList}
              />
            </View>
          )}

          {/* Photos Tab Content */}
          {activeTab === 'photos' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Photos</Text>
              <FlatList
                data={placeData.photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item, index) => `photo-${index}`}
                numColumns={2}
                scrollEnabled={false}
                contentContainerStyle={styles.photosGrid}
              />
            </View>
          )}

          {/* Map Tab Content */}
          {activeTab === 'map' && (
            <View style={styles.tabContent}>
              <Text style={styles.sectionTitle}>Location</Text>
              {mapError ? (
                <View style={styles.mapErrorContainer}>
                  <MaterialIcons name="location-off" size={40} color="#999" />
                  <Text style={styles.mapErrorText}>
                    Unable to load map. Location coordinates may be missing.
                  </Text>
                </View>
              ) : (
                <View style={styles.mapContainer}>
                  <MapView
                    style={styles.map}
                    initialRegion={{
                      latitude: coordinates.latitude,
                      longitude: coordinates.longitude,
                      latitudeDelta: 0.0922,
                      longitudeDelta: 0.0421,
                    }}
                    onError={() => setMapError(true)}
                  >
                    <Marker
                      coordinate={{
                        latitude: coordinates.latitude,
                        longitude: coordinates.longitude,
                      }}
                      title={placeData.name}
                    />
                  </MapView>
                </View>
              )}
              <View style={styles.addressContainer}>
                <Ionicons name="location-sharp" size={22} color="#3498db" />
                <Text style={styles.addressText}>
                  {placeData.name}, {placeData.country}
                </Text>
            </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.aiPlannerButton}
              onPress={navigateToAIPlanner}
            >
              <AntDesign name="rocket1" size={24} color="#FFF" />
              <Text style={styles.aiPlannerButtonText}>Plan with AI</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.bookButton}
              onPress={navigateToBooking}
            >
              <Text style={styles.bookButtonText}>Book Now</Text>
            </TouchableOpacity>
            </View>
          </View>
    </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  imageContainer: {
    height: height * 0.35,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  headerButtons: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightButtons: {
    flexDirection: 'row',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  infoContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    marginTop: -25,
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 30,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  destinationName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#333',
  },
  destinationLocation: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 5,
  },
  reviewsText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 3,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    marginTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 5,
    minWidth: width / 5,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#3498db',
  },
  tabText: {
    fontSize: 15,
    color: '#999',
  },
  activeTabText: {
    color: '#3498db',
    fontWeight: '600',
  },
  tabContent: {
    paddingBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 15,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    marginBottom: 20,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
  },
  infoTextContainer: {
    marginLeft: 10,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  weatherContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
  },
  currentWeather: {
    alignItems: 'center',
    marginBottom: 15,
  },
  currentTemp: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 5,
  },
  currentConditions: {
    fontSize: 16,
    color: '#666',
  },
  weatherForecast: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  weatherDay: {
    alignItems: 'center',
    marginRight: 30,
  },
  weatherDayText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  weatherIcon: {
    marginBottom: 5,
  },
  weatherTemp: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  attractionsPreview: {
    marginBottom: 10,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  previewAttractionsList: {
    marginBottom: 10,
  },
  attractionsList: {
    marginBottom: 10,
  },
  attractionCard: {
    flexDirection: 'row',
    marginBottom: 15,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  attractionImage: {
    width: 100,
    height: 100,
  },
  attractionContent: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  attractionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  attractionRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  attractionRating: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginLeft: 4,
  },
  attractionReviews: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  attractionPrice: {
    fontSize: 14,
    color: '#3498db',
    fontWeight: '500',
  },
  photosGrid: {
    marginTop: 5,
  },
  photoItem: {
    width: (width - 50) / 2,
    height: (width - 50) / 2,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
  },
  mapContainer: {
    height: 200,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 15,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapErrorContainer: {
    height: 200,
    borderRadius: 15,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  mapErrorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
  },
  addressText: {
    fontSize: 15,
    color: '#333',
    marginLeft: 10,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    marginTop: 25,
  },
  aiPlannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3498db',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginRight: 15,
    flex: 1,
  },
  aiPlannerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginLeft: 8,
  },
  bookButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2ecc71',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flex: 1,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default PlaceDetails;
