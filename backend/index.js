const express = require("express");
const axios = require("axios");
const mongoose = require("mongoose");
const cors = require("cors");
const Place = require("./place");
const UserDetails = require("./userdetails");
const Notifications = require("./notifications");
require("dotenv").config();
const OpenAI = require("openai");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authRoutes = require("./routes/auth");
const TravelPlan = require("./models/TravelPlan");
const travelPlanRoutes = require("./routes/travelPlans");

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "vista-travel-secret-key";

const GOOGLE_PLACES_API_KEY = "AIzaSyA0E_xu1VBpJ7gxVvfZ8bMXqmNe3advwes";

// Use your API key
const API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyBnDKVfSfmY4HwxmC_VULTfH4UwyDfKF_g";
const genAI = new GoogleGenerativeAI(API_KEY);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/vista-travel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });

// Enable CORS with proper configuration
app.use(
  cors({
    origin: "*", // Allow all origins for development
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Add these headers explicitly
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Parse JSON requests
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key-here",
});

// Load destinations data
let destinationsData = [];
try {
  const destinationsFilePath = path.join(
    __dirname,
    "data",
    "destinations.json"
  );

  // Check if the file exists
  if (fs.existsSync(destinationsFilePath)) {
    const rawData = fs.readFileSync(destinationsFilePath);
    const data = JSON.parse(rawData);
    destinationsData = data.destinations || [];
    console.log(
      `Loaded ${destinationsData.length} destinations from local database`
    );
  } else {
    console.log("Creating destinations data directory and file");
    // Ensure the directory exists
    if (!fs.existsSync(path.join(__dirname, "data"))) {
      fs.mkdirSync(path.join(__dirname, "data"));
    }

    // Create a basic file with some popular destinations
    const basicDestinations = {
      destinations: [
        { id: "1", name: "Paris", country: "France" },
        { id: "2", name: "New York", country: "United States" },
        { id: "3", name: "Tokyo", country: "Japan" },
        { id: "4", name: "London", country: "United Kingdom" },
        { id: "5", name: "Rome", country: "Italy" },
        { id: "6", name: "Sydney", country: "Australia" },
        { id: "7", name: "Dubai", country: "United Arab Emirates" },
        { id: "8", name: "Bangkok", country: "Thailand" },
        { id: "9", name: "Singapore", country: "Singapore" },
        { id: "10", name: "Barcelona", country: "Spain" },
      ],
    };

    fs.writeFileSync(
      destinationsFilePath,
      JSON.stringify(basicDestinations, null, 2)
    );

    destinationsData = basicDestinations.destinations;
    console.log(
      `Created default destinations database with ${destinationsData.length} entries`
    );
  }
} catch (error) {
  console.error("Error loading destinations data:", error);
  destinationsData = [];
}

// Helper function to generate travel plans
const generateTravelPlan = async (destination, budget, tripDuration) => {
  // Default values
  budget = parseInt(budget) || 1000;
  tripDuration = parseInt(tripDuration) || 5;

  // Generate itinerary days
  const itinerary = [];
  for (let i = 0; i < tripDuration; i++) {
    let dayActivities = "";
    if (i === 0) {
      dayActivities = `Morning: Arrive in ${destination} and check into accommodation, Afternoon: Explore the local area and get oriented, Evening: Enjoy dinner at a local restaurant`;
    } else if (i === tripDuration - 1) {
      dayActivities = `Morning: Final sightseeing or shopping for souvenirs, Afternoon: Pack and prepare for departure, Evening: Farewell dinner`;
    } else if (i % 2 === 0) {
      dayActivities = `Morning: Visit museums or cultural sites, Afternoon: Try local activities or experiences, Evening: Explore nightlife or entertainment`;
    } else {
      dayActivities = `Morning: Natural attractions or outdoor activities, Afternoon: Shopping or relaxation time, Evening: Food tour or specialty restaurant`;
    }

    itinerary.push({
      day: i + 1,
      activities: dayActivities,
    });
  }

  // Calculate budget breakdown
  const accommodationsPerDay = Math.floor((budget * 0.4) / tripDuration);
  const foodPerDay = Math.floor((budget * 0.3) / tripDuration);
  const transportationPerDay = Math.floor((budget * 0.15) / tripDuration);
  const activitiesPerDay = Math.floor((budget * 0.15) / tripDuration);

  const budgetBreakdown = {
    accommodations: accommodationsPerDay * tripDuration,
    food: foodPerDay * tripDuration,
    transportation: transportationPerDay * tripDuration,
    activities: activitiesPerDay * tripDuration,
    total: budget,
  };

  // Generate recommendations
  const recommendations = [
    {
      name: `${destination} City Center`,
      description: `Explore the vibrant heart of ${destination} with its unique architecture, shops, and cultural attractions.`,
      category: "Attraction",
      estimatedCost: 0,
    },
    {
      name: `${destination} Historical Museum`,
      description:
        "Discover the rich history and heritage of the region through fascinating exhibits and artifacts.",
      category: "Cultural",
      estimatedCost: Math.floor(activitiesPerDay * 0.3),
    },
    {
      name: `${destination} Natural Park`,
      description:
        "Experience the natural beauty of the region with walking trails, wildlife, and stunning views.",
      category: "Outdoor",
      estimatedCost: Math.floor(activitiesPerDay * 0.2),
    },
    {
      name: `${destination} Culinary Experience`,
      description:
        "Sample the authentic local cuisine at popular restaurants and food markets.",
      category: "Food",
      estimatedCost: Math.floor(foodPerDay),
    },
    {
      name: `${destination} Cultural Show`,
      description:
        "Enjoy traditional performances that showcase the local culture and traditions.",
      category: "Entertainment",
      estimatedCost: Math.floor(activitiesPerDay * 0.4),
    },
  ];

  return {
    recommendations,
    itinerary,
    budgetBreakdown,
  };
};

// Improved fetchDestinationData function that uses global location data
async function fetchDestinationData(destination, placeId = null) {
  console.log(`Fetching destination data for: ${destination}`);
  try {
    // Attempt to get place ID if not provided
    if (!placeId) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        destination
      )}&key=${GOOGLE_PLACES_API_KEY}`;
      const geocodeResponse = await axios.get(geocodeUrl);

      if (
        geocodeResponse.data.status === "OK" &&
        geocodeResponse.data.results.length > 0
      ) {
        const locationData = geocodeResponse.data.results[0];
        const location = locationData.geometry.location;

        // Attempt to get place details
        const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
          destination
        )}&inputtype=textquery&fields=place_id,name,geometry&key=${GOOGLE_PLACES_API_KEY}`;
        const placesResponse = await axios.get(placesUrl);

        if (
          placesResponse.data.status === "OK" &&
          placesResponse.data.candidates.length > 0
        ) {
          placeId = placesResponse.data.candidates[0].place_id;
        }

        // Fetch place details
        let placeDetails = {};
        if (placeId) {
          const placeDetailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,rating,website,url&key=${GOOGLE_PLACES_API_KEY}`;
          const placeDetailsResponse = await axios.get(placeDetailsUrl);
          if (placeDetailsResponse.data.status === "OK") {
            placeDetails = placeDetailsResponse.data.result;
          }
        }

        // Fetch destination images
        const destinationImages = await fetchLocationImages(destination);

        // Fetch nearby places based on location
        const [attractions, restaurants, hotels] = await Promise.all([
          fetchNearbyPlaces(location, "tourist_attraction", 10),
          fetchNearbyPlaces(location, "restaurant", 10),
          fetchNearbyPlaces(location, "lodging", 10),
        ]);

        // Check if we have enough data
        let finalAttractions, finalRestaurants, finalHotels;

        if (
          attractions.length < 3 ||
          restaurants.length < 3 ||
          hotels.length < 3
        ) {
          console.log(
            "Not enough nearby places found, searching with larger radius..."
          );

          const [moreAttractions, moreRestaurants, moreHotels] =
            await Promise.all([
              attractions.length < 3
                ? fetchNearbyPlaces(location, "tourist_attraction", 25, 10000)
                : [],
              restaurants.length < 3
                ? fetchNearbyPlaces(location, "restaurant", 25, 10000)
                : [],
              hotels.length < 3
                ? fetchNearbyPlaces(location, "lodging", 25, 10000)
                : [],
            ]);

          // Merge and deduplicate results
          finalAttractions = mergeAndDeduplicateArrays(
            attractions,
            moreAttractions,
            "place_id"
          );
          finalRestaurants = mergeAndDeduplicateArrays(
            restaurants,
            moreRestaurants,
            "place_id"
          );
          finalHotels = mergeAndDeduplicateArrays(
            hotels,
            moreHotels,
            "place_id"
          );
        } else {
          finalAttractions = attractions;
          finalRestaurants = restaurants;
          finalHotels = hotels;
        }

        // Add images to attractions
        const attractionsWithImages = await Promise.all(
          finalAttractions.map(async (attraction) => {
            try {
              // Always try to fetch high-quality images for each attraction
              const attractionImages = await fetchLocationImages(
                attraction.name,
                5
              );

              // Add the images to the attraction object
              if (attractionImages && attractionImages.length > 0) {
                attraction.images = attractionImages;
                attraction.imageUrl = attractionImages[0]; // For backward compatibility
              }

              // If the attraction has photos from Google but no photo property, set it
              if (
                attraction.photos &&
                attraction.photos.length > 0 &&
                !attraction.photo
              ) {
                attraction.photo = attraction.photos[0].photo_reference;
              }

              // Add Unsplash images as fallback if needed
              if (!attraction.images || attraction.images.length === 0) {
                // Extract place types or deduce from name for better image matching
                const types = attraction.types || [];
                const keywords = extractKeywordsFromName(attraction.name);

                if (keywords.length > 0) {
                  types.push(...keywords);
                }

                // Get contextually relevant images from Unsplash
                const unsplashImages = getUnsplashImagesFromTypes(
                  attraction.name,
                  types.length > 0 ? types : ["tourist_attraction"],
                  3
                );

                attraction.images = unsplashImages;
                attraction.imageUrl = unsplashImages[0];
              }

              // If attraction has unsplashImages from the enrichment process, add them
              if (
                attraction.unsplashImages &&
                attraction.unsplashImages.length > 0
              ) {
                if (!attraction.images) {
                  attraction.images = [];
                }

                // Add unsplash images that aren't already in the images array
                attraction.unsplashImages.forEach((img) => {
                  if (!attraction.images.includes(img)) {
                    attraction.images.push(img);
                  }
                });

                if (!attraction.imageUrl) {
                  attraction.imageUrl = attraction.unsplashImages[0];
                }
              }
            } catch (error) {
              console.error(
                `Error adding images to attraction ${attraction.name}:`,
                error
              );
            }
            return attraction;
          })
        );

        return {
          destinationDetails: {
            name: destination,
            placeId: placeId,
            address: placeDetails.formatted_address,
            rating: placeDetails.rating,
            website: placeDetails.website,
            googleMapsUrl: placeDetails.url,
            coordinates: location,
          },
          images: destinationImages, // Add destination images
          attractions: formatPlaces(attractionsWithImages),
          restaurants: formatPlaces(finalRestaurants),
          hotels: formatPlaces(finalHotels),
        };
      }
    }

    // Fallback to mock data if everything else failed
    console.log(
      "Could not geocode location or fetch real data, using mock data"
    );
    return generateMockDestinationData(destination);
  } catch (error) {
    console.error("Error fetching destination data:", error);
    // Fallback to mock data in case of any errors
    return generateMockDestinationData(destination);
  }
}

// Helper function to fetch nearby places
async function fetchNearbyPlaces(location, type, limit = 5, radius = 5000) {
  try {
    const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=${radius}&type=${type}&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await axios.get(nearbyUrl);

    if (response.data.status === "REQUEST_DENIED") {
      console.warn(
        `API request denied for ${type}:`,
        response.data.error_message
      );
      return [];
    }

    const places = response.data.results?.slice(0, limit) || [];

    // For tourist attractions, enrich each place with additional images and details
    if (type === "tourist_attraction") {
      const enrichedPlaces = await Promise.all(
        places.map(async (place) => {
          try {
            // Get additional details for this place using the Place Details API
            if (place.place_id) {
              const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,rating,photos,geometry,types&key=${GOOGLE_PLACES_API_KEY}`;
              const detailsResponse = await axios.get(detailsUrl);

              if (
                detailsResponse.data.status === "OK" &&
                detailsResponse.data.result
              ) {
                const details = detailsResponse.data.result;

                // Merge any new information
                if (details.photos && details.photos.length > 0) {
                  place.photos = details.photos;
                }

                if (details.formatted_address) {
                  place.vicinity = details.formatted_address;
                }

                if (details.types && details.types.length > 0) {
                  place.types = details.types;
                }

                // Add Unsplash fallback images using the landmark type
                if (!place.photos || place.photos.length === 0) {
                  const unsplashImages = getUnsplashImagesFromTypes(
                    place.name,
                    place.types || ["tourist_attraction"],
                    3
                  );
                  place.unsplashImages = unsplashImages;
                }
              }
            }
            return place;
          } catch (error) {
            console.error(`Error enriching place ${place.name}:`, error);
            return place;
          }
        })
      );
      return enrichedPlaces;
    }

    return places;
  } catch (error) {
    console.error(`Error fetching nearby ${type}:`, error);
    return [];
  }
}

// Helper function to fetch images for a location
async function fetchLocationImages(locationName, maxImages = 3) {
  try {
    // Use Google Places API to search for the location
    const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
      locationName
    )}&inputtype=textquery&fields=photos,place_id,types&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await axios.get(searchUrl);

    // If a place was found and it has photos
    if (
      searchResponse.data.candidates &&
      searchResponse.data.candidates[0] &&
      searchResponse.data.candidates[0].photos
    ) {
      // Extract photo references
      const photoReferences = searchResponse.data.candidates[0].photos.map(
        (photo) => photo.photo_reference
      );

      // Convert to actual image URLs
      const imageUrls = photoReferences
        .slice(0, maxImages)
        .map(
          (ref) =>
            `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_PLACES_API_KEY}`
        );

      return imageUrls;
    }

    // If no images found with Places API, try to get them using the text search API
    return await fetchBackupLocationImages(locationName, maxImages);
  } catch (error) {
    console.error("Error fetching location images:", error);
    // Try backup method if primary fails
    return await fetchBackupLocationImages(locationName, maxImages);
  }
}

// Backup function to fetch images using more relevant Unsplash images based on location type
async function fetchBackupLocationImages(locationName, maxImages = 3) {
  try {
    // Use text search which might return more results and include types
    const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
      locationName
    )}&fields=photos,types&key=${GOOGLE_PLACES_API_KEY}`;

    const searchResponse = await axios.get(textSearchUrl);

    // Collect photos from all results
    let allPhotos = [];

    if (searchResponse.data.results && searchResponse.data.results.length > 0) {
      // Extract place types for better Unsplash targeting
      const firstResult = searchResponse.data.results[0];
      let placeTypes = firstResult.types || [];

      searchResponse.data.results.forEach((place) => {
        if (place.photos) {
          place.photos.forEach((photo) => {
            allPhotos.push(photo.photo_reference);
          });
        }
      });

      // If we found photos
      if (allPhotos.length > 0) {
        // Convert to actual image URLs
        const imageUrls = allPhotos
          .slice(0, maxImages)
          .map(
            (ref) =>
              `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${ref}&key=${GOOGLE_PLACES_API_KEY}`
          );

        return imageUrls;
      }

      // If no photos found but we have types, use Unsplash with targeted keywords
      if (placeTypes.length > 0) {
        return getUnsplashImagesFromTypes(locationName, placeTypes, maxImages);
      }
    }

    // If we still don't have images, return a placeholder image array with the location name
    return [
      `https://source.unsplash.com/800x600/?${encodeURIComponent(
        locationName
      )},landmark`,
    ];
  } catch (error) {
    console.error("Error fetching backup location images:", error);
    // Return unsplash image as last resort
    return [
      `https://source.unsplash.com/800x600/?${encodeURIComponent(
        locationName
      )},landmark`,
    ];
  }
}

// Helper function to generate Unsplash image URLs based on location types
function getUnsplashImagesFromTypes(locationName, types, count = 3) {
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

  // Find the most specific type to use for the image search
  let searchType = "landmark";
  for (const type of types) {
    if (typeMapping[type]) {
      searchType = typeMapping[type];
      break;
    }
  }

  // Generate multiple unique Unsplash URLs by adding random parameters
  const urls = [];
  for (let i = 0; i < count; i++) {
    // Add a random number to ensure unique URLs
    urls.push(
      `https://source.unsplash.com/800x600/?${encodeURIComponent(
        locationName
      )},${searchType}&random=${Math.random()}`
    );
  }

  return urls;
}

// Helper function to merge and deduplicate arrays
function mergeAndDeduplicateArrays(array1, array2, idProperty) {
  const merged = [...array1];
  const ids = new Set(array1.map((item) => item[idProperty]));

  array2.forEach((item) => {
    if (!ids.has(item[idProperty])) {
      merged.push(item);
      ids.add(item[idProperty]);
    }
  });

  return merged;
}

// Helper function to format places data
function formatPlaces(places) {
  return places.map((place) => ({
    name: place.name,
    rating: place.rating,
    address: place.vicinity,
    placeId: place.place_id,
    photos: place.photos
      ? place.photos.map((photo) => photo.photo_reference)
      : [],
    types: place.types || [],
  }));
}

// Generate mock destination data when API fails
function generateMockDestinationData(destination) {
  console.log("Generating mock data for destination:", destination);

  return {
    destinationDetails: {
      name: destination,
      address: `${destination}, Country`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      website: `https://en.wikipedia.org/wiki/${destination.replace(
        / /g,
        "_"
      )}`,
      phone: "+1 555-123-4567",
    },
    attractions: generateMockAttractions(destination, 5),
    restaurants: generateMockRestaurants(destination, 5),
    hotels: generateMockHotels(destination, 5),
  };
}

// Helper functions for generating mock data
function generateMockAttractions(destName, count) {
  const types = [
    "Museum",
    "Park",
    "Monument",
    "Cathedral",
    "Castle",
    "Beach",
    "Mountain",
    "Garden",
  ];
  const attractions = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    attractions.push({
      name: `${destName} ${type}`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      address: `123 Tourism Ave, ${destName}`,
      placeId: `mock-attraction-${i}`,
      photos: [],
    });
  }

  return attractions;
}

function generateMockRestaurants(destName, count) {
  const cuisines = [
    "Traditional",
    "Italian",
    "French",
    "Asian",
    "Mexican",
    "Seafood",
    "Vegetarian",
    "Steakhouse",
  ];
  const restaurants = [];

  for (let i = 0; i < count; i++) {
    const cuisine = cuisines[Math.floor(Math.random() * cuisines.length)];
    restaurants.push({
      name: `${cuisine} Restaurant ${i + 1}`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      price_level: Math.floor(Math.random() * 4) + 1,
      address: `456 Dining St, ${destName}`,
      placeId: `mock-restaurant-${i}`,
    });
  }

  return restaurants;
}

function generateMockHotels(destName, count) {
  const types = ["Hotel", "Resort", "Inn", "Suites", "Grand Hotel", "Plaza"];
  const hotels = [];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    hotels.push({
      name: `${destName} ${type}`,
      rating: (3.5 + Math.random() * 1.5).toFixed(1),
      address: `789 Lodging Blvd, ${destName}`,
      placeId: `mock-hotel-${i}`,
    });
  }

  return hotels;
}

// Enhanced function to create better travel plans with real global location data
function enhancePlanWithRealData(planData, destinationData) {
  // Copy the original plan data
  const enhancedPlan = JSON.parse(JSON.stringify(planData));

  // Create a more diverse set of recommendations based on real data
  const attractions = destinationData.attractions || [];
  const restaurants = destinationData.restaurants || [];
  const hotels = destinationData.hotels || [];

  // Build an improved set of recommendations
  const newRecommendations = [];

  // Add top attractions
  attractions.forEach((attraction, index) => {
    if (index < 5) {
      // Limit to top 5
      newRecommendations.push({
        name: attraction.name,
        description: `Visit ${attraction.name} - a popular attraction in ${destinationData.destinationDetails.name}.`,
        category: getCategoryFromTypes(attraction.types) || "Attraction",
        estimatedCost: Math.floor(
          planData.budgetBreakdown.activities / (attractions.length || 5)
        ),
        rating: attraction.rating,
        address: attraction.address,
      });
    }
  });

  // Add top restaurants
  restaurants.forEach((restaurant, index) => {
    if (index < 3) {
      // Limit to top 3
      newRecommendations.push({
        name: restaurant.name,
        description: `Enjoy a meal at ${restaurant.name}, a recommended restaurant in ${destinationData.destinationDetails.name}.`,
        category: "Food",
        estimatedCost: Math.floor(planData.budgetBreakdown.food / 6), // Assume 2 meals per day for 3 days
        rating: restaurant.rating,
        address: restaurant.address,
        price_level: restaurant.price_level,
      });
    }
  });

  // Add accommodation
  if (hotels.length > 0) {
    const bestHotel = hotels.sort(
      (a, b) => (b.rating || 0) - (a.rating || 0)
    )[0];
    newRecommendations.push({
      name: bestHotel.name,
      description: `Stay at ${bestHotel.name}, a well-rated accommodation option in ${destinationData.destinationDetails.name}.`,
      category: "Accommodation",
      estimatedCost: Math.floor(
        planData.budgetBreakdown.accommodations / planData.itinerary.length
      ),
      rating: bestHotel.rating,
      address: bestHotel.address,
    });
  }

  // Create more personalized daily itinerary
  const enhancedItinerary = planData.itinerary.map((day, index) => {
    // Pick attractions and restaurants for this day
    const dayAttractions = attractions.slice(
      (index * 2) % attractions.length,
      (index * 2 + 2) % attractions.length
    );

    const dayRestaurants = restaurants.slice(
      (index * 2) % restaurants.length,
      (index * 2 + 2) % restaurants.length
    );

    let activities = "";

    if (index === 0) {
      // First day
      activities = `Morning: Arrive in ${
        destinationData.destinationDetails.name
      } and check into ${hotels[0]?.name || "your accommodation"}. `;
      activities += `Afternoon: ${
        dayAttractions[0]?.name
          ? `Visit ${dayAttractions[0].name}`
          : `Explore the local area and get oriented`
      }. `;
      activities += `Evening: ${
        dayRestaurants[0]?.name
          ? `Enjoy dinner at ${dayRestaurants[0].name}`
          : `Try local cuisine at a nearby restaurant`
      }.`;
    } else if (index === planData.itinerary.length - 1) {
      // Last day
      activities = `Morning: ${
        dayAttractions[0]?.name
          ? `Visit ${dayAttractions[0].name}`
          : `Final sightseeing or shopping for souvenirs`
      }. `;
      activities += `Afternoon: Pack and prepare for departure. `;
      activities += `Evening: ${
        dayRestaurants[0]?.name
          ? `Farewell dinner at ${dayRestaurants[0].name}`
          : `Farewell dinner at a local restaurant`
      }.`;
    } else {
      // Middle days
      const morningAttraction =
        dayAttractions[0]?.name ||
        `Explore ${destinationData.destinationDetails.name}`;
      const afternoonAttraction =
        dayAttractions[1]?.name || `Try local activities or experiences`;
      const lunch = dayRestaurants[0]?.name || `lunch at a local café`;
      const dinner =
        dayRestaurants[1]?.name || `dinner at a popular restaurant`;

      activities = `Morning: Visit ${morningAttraction}. `;
      activities += `Afternoon: Enjoy ${lunch} followed by a visit to ${afternoonAttraction}. `;
      activities += `Evening: Experience ${dinner} and explore the nightlife.`;
    }

    return {
      ...day,
      activities,
    };
  });

  // If we have enough real recommendations, replace the generated ones
  if (newRecommendations.length >= 5) {
    enhancedPlan.recommendations = newRecommendations;
  } else {
    // Otherwise, enhance the existing recommendations with real data
    enhancedPlan.recommendations = enhancedPlan.recommendations.map(
      (rec, index) => {
        if (
          rec.category === "Attraction" &&
          attractions[index % attractions.length]
        ) {
          const realAttraction = attractions[index % attractions.length];
          return {
            ...rec,
            name: realAttraction.name,
            description: `Visit ${realAttraction.name} - a popular attraction in ${destinationData.destinationDetails.name}.`,
            rating: realAttraction.rating,
            address: realAttraction.address,
          };
        } else if (
          rec.category === "Food" &&
          restaurants[index % restaurants.length]
        ) {
          const realRestaurant = restaurants[index % restaurants.length];
          return {
            ...rec,
            name: realRestaurant.name,
            description: `Enjoy a meal at ${realRestaurant.name}, a recommended restaurant in ${destinationData.destinationDetails.name}.`,
            rating: realRestaurant.rating,
            address: realRestaurant.address,
            price_level: realRestaurant.price_level,
          };
        }
        return rec;
      }
    );

    // Add a real hotel if available
    if (hotels.length > 0) {
      enhancedPlan.recommendations.push({
        name: hotels[0].name,
        description: `Stay at ${hotels[0].name}, a well-rated accommodation option.`,
        category: "Accommodation",
        estimatedCost: Math.floor(
          planData.budgetBreakdown.accommodations / planData.itinerary.length
        ),
        rating: hotels[0].rating,
        address: hotels[0].address,
      });
    }
  }

  // Update the itinerary with our enhanced version
  enhancedPlan.itinerary = enhancedItinerary;

  return enhancedPlan;
}

// Helper function to determine category from place types
function getCategoryFromTypes(types = []) {
  if (!types || types.length === 0) return "Attraction";

  const typeMap = {
    museum: "Cultural",
    art_gallery: "Cultural",
    tourist_attraction: "Attraction",
    amusement_park: "Entertainment",
    park: "Outdoor",
    natural_feature: "Outdoor",
    restaurant: "Food",
    cafe: "Food",
    bar: "Entertainment",
    casino: "Entertainment",
    spa: "Relaxation",
    shopping_mall: "Shopping",
    point_of_interest: "Attraction",
    establishment: "Attraction",
    lodging: "Accommodation",
    hotel: "Accommodation",
  };

  for (const type of types) {
    if (typeMap[type]) return typeMap[type];
  }

  return "Attraction";
}

// Helper function to generate JWT token
function generateToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "30d" }
  );
}

// ROUTES

// Basic test endpoints
app.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

app.get("/", (req, res) => {
  res.json({
    message: "Backend server is running",
    status: "online",
  });
});

app.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Test endpoint is working!",
    timestamp: new Date().toISOString(),
  });
});

// Simple test endpoint without AI
app.get("/test-ai-simple", (req, res) => {
  res.json({
    success: true,
    message: "This is a simple test response",
    timestamp: new Date().toISOString(),
  });
});

// Simple test endpoint for Gemini API
app.get("/test-ai", async (req, res) => {
  try {
    // Initialize the API
    console.log("Initializing Gemini API");
    const genAIClient = new GoogleGenerativeAI(API_KEY);
    const model = genAIClient.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Simple prompt
    console.log("Sending simple test prompt");
    const result = await model.generateContent(
      "Tell me about Paris in one paragraph."
    );

    // Get the response
    console.log("Processing response");
    const response = await result.response;
    const text = response.text();

    // Send successful response
    console.log("Sending response to client");
    res.json({
      success: true,
      message: "AI test successful",
      response: text,
    });
  } catch (error) {
    console.error("Test AI endpoint error:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Display places
app.get("/api/places", async (req, res) => {
  try {
    const places = await Place.find({});
    res.json(places);
    console.log(places);
  } catch (error) {
    console.error("Error fetching places:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Recommend Places
app.get("/places/recommendations", async (req, res) => {
  try {
    const { destination, budget } = req.query;
    const tripType = req.query.tripType?.trim();
    if (!destination || !budget || !tripType) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      destination
    )}&key=${GOOGLE_PLACES_API_KEY}`;
    const geocodeResponse = await axios.get(geocodeUrl);
    const location = geocodeResponse.data.results[0]?.geometry.location;

    if (!location) {
      return res.status(404).json({ error: "Invalid destination" });
    }

    const placesUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=${tripType}&key=${GOOGLE_PLACES_API_KEY}`;
    const placesResponse = await axios.get(placesUrl);

    const recommendedPlaces = placesResponse.data.results
      .filter(
        (place) =>
          place.price_level === undefined ||
          place.price_level <= Math.max(1, Math.ceil(budget / 1000))
      )
      .map((place) => ({
        name: place.name,
        category: tripType,
        rating: place.rating || "No rating available",
        address: place.vicinity || "Address not available",
        location: place.geometry?.location,
      }));

    console.log("Filtered Places:", recommendedPlaces);

    res.json({ destination, tripType, recommendedPlaces });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// AI recommendations endpoint
app.get("/api/ai-recommendations", async (req, res) => {
  try {
    const {
      destination,
      placeId,
      coordinates,
      budget,
      preferences,
      tripDuration,
      season,
      travelStyle,
    } = req.query;

    // Get user ID if authenticated
    let userId = null;
    if (req.headers.authorization) {
      const token = req.headers.authorization.split(" ")[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        userId = decoded.id;
      } catch (tokenError) {
        console.log("Invalid token, proceeding without user ID");
      }
    }

    console.log("AI recommendation request received:", {
      destination,
      placeId,
      coordinates,
      budget,
      tripDuration,
      preferences,
      season,
      travelStyle,
    });

    if (!destination) {
      return res.status(400).json({ error: "Missing destination parameter" });
    }

    // Fetch real data about the destination
    let destinationData;

    if (placeId) {
      // If we have a place ID, use it directly with the Place Details API
      destinationData = await fetchDestinationDataByPlaceId(placeId);
    } else if (coordinates) {
      // If we have coordinates, use them to get nearby points of interest
      const [lat, lng] = coordinates
        .split(",")
        .map((coord) => parseFloat(coord));
      destinationData = await fetchDestinationDataByCoordinates(
        lat,
        lng,
        destination
      );
    } else {
      // Fall back to text search
      destinationData = await fetchDestinationData(destination);
    }

    if (!destinationData) {
      return res
        .status(404)
        .json({ error: "Could not find data for this destination" });
    }

    console.log("Fetched real destination data for:", destination);

    // Try with Gemini API first
    try {
      console.log("Attempting to use Gemini API...");
      const genAIClient = new GoogleGenerativeAI(API_KEY);

      // Use gemini-1.5-flash for free tier
      let model = genAIClient.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      // Create a detailed prompt with full global location context
      let promptText = `Generate a detailed ${
        tripDuration || 5
      }-day travel plan for ${destination} with a budget of $${budget || 1000}.
      
Here's real information about ${destination}:
- Address: ${destinationData.destinationDetails.address || "Not available"}
- Rating: ${destinationData.destinationDetails.rating || "Not available"}/5
      
Top attractions include:
${destinationData.attractions
  .map((attr) => `- ${attr.name} (Rating: ${attr.rating || "N/A"}/5)`)
  .join("\n")}

Popular restaurants:
${destinationData.restaurants
  .map(
    (rest) =>
      `- ${rest.name} (Rating: ${rest.rating || "N/A"}/5, Price level: ${
        rest.price_level || "N/A"
      })`
  )
  .join("\n")}

Recommended hotels:
${destinationData.hotels
  .map((hotel) => `- ${hotel.name} (Rating: ${hotel.rating || "N/A"}/5)`)
  .join("\n")}

Season: ${season || "Any"}
Travel style: ${travelStyle || "General"}
Special preferences: ${preferences || "None"}

Please generate a day-by-day itinerary using this real location data, including specific attractions, restaurants, and hotels to visit on each day. For each day include:
1. Morning activities
2. Lunch recommendations 
3. Afternoon activities
4. Dinner recommendations
5. Evening activities if applicable

Also include:
- Estimated costs for each activity
- Travel tips specific to this destination
- Local customs to be aware of
- Best times to visit specific attractions`;

      console.log(
        "Sending request to Gemini API with real destination data..."
      );

      // Add timeout for the API call
      const resultPromise = model.generateContent(promptText);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("API request timed out")), 20000)
      );

      const result = await Promise.race([resultPromise, timeoutPromise]);
      const response = await result.response;
      const text = response.text();

      console.log("Received AI response with real destination data");

      // Generate structured itinerary data
      const planData = await generateTravelPlan(
        destination,
        budget,
        tripDuration
      );

      // Enhance our plan with real data
      const enhancedPlan = enhancePlanWithRealData(planData, destinationData);

      // Store the travel plan if user is authenticated
      let savedPlan = null;
      if (userId) {
        try {
          const newTravelPlan = new TravelPlan({
            userId,
            destination,
            budget: parseInt(budget) || 1000,
            tripDuration: parseInt(tripDuration) || 5,
            itinerary: enhancedPlan.itinerary,
            recommendations: enhancedPlan.recommendations,
            budgetBreakdown: enhancedPlan.budgetBreakdown,
          });

          savedPlan = await newTravelPlan.save();
          console.log("Travel plan saved to database with ID:", savedPlan._id);
        } catch (saveError) {
          console.error("Error saving travel plan:", saveError);
        }
      }

      // Return both the AI text and the enhanced structured data
      return res.json({
        destination,
        budget: parseInt(budget) || 1000,
        aiSuggestion: text,
        savedPlanId: savedPlan ? savedPlan._id : null,
        destinationData: {
          details: destinationData.destinationDetails,
          topAttractions: destinationData.attractions.slice(0, 5),
          topRestaurants: destinationData.restaurants.slice(0, 5),
          recommendedHotels: destinationData.hotels.slice(0, 3),
        },
        ...enhancedPlan,
      });
    } catch (aiError) {
      console.error("AI API error:", aiError);
      console.log("Falling back to generated travel plan with real data...");

      // Use the fallback function enhanced with real data
      const planData = await generateTravelPlan(
        destination,
        budget,
        tripDuration
      );
      const enhancedPlan = enhancePlanWithRealData(planData, destinationData);

      // Store the travel plan if user is authenticated
      let savedPlan = null;
      if (userId) {
        try {
          const newTravelPlan = new TravelPlan({
            userId,
            destination,
            budget: parseInt(budget) || 1000,
            tripDuration: parseInt(tripDuration) || 5,
            itinerary: enhancedPlan.itinerary,
            recommendations: enhancedPlan.recommendations,
            budgetBreakdown: enhancedPlan.budgetBreakdown,
          });

          savedPlan = await newTravelPlan.save();
          console.log(
            "Travel plan saved to database (fallback) with ID:",
            savedPlan._id
          );
        } catch (saveError) {
          console.error("Error saving travel plan:", saveError);
        }
      }

      return res.json({
        destination,
        budget: parseInt(budget) || 1000,
        source: "fallback",
        error: "AI service unavailable, but using real destination data",
        savedPlanId: savedPlan ? savedPlan._id : null,
        destinationData: {
          details: destinationData.destinationDetails,
          topAttractions: destinationData.attractions.slice(0, 5),
          topRestaurants: destinationData.restaurants.slice(0, 5),
          recommendedHotels: destinationData.hotels.slice(0, 3),
        },
        ...enhancedPlan,
      });
    }
  } catch (error) {
    console.error("Server error in AI recommendations endpoint:", error);

    // Use the emergency fallback without real data
    try {
      const planData = await generateTravelPlan(
        req.query.destination,
        req.query.budget,
        req.query.tripDuration
      );
      return res.json({
        destination: req.query.destination,
        budget: parseInt(req.query.budget) || 1000,
        source: "emergency_fallback",
        error: "Could not fetch real destination data",
        ...planData,
      });
    } catch (finalError) {
      return res.status(500).json({
        error: "Failed to generate AI recommendations",
        message: error.message,
      });
    }
  }
});

// New function to fetch destination data by place ID
async function fetchDestinationDataByPlaceId(placeId) {
  try {
    // Get place details
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,geometry,international_phone_number,website,price_level,opening_hours,photo,review&key=${GOOGLE_PLACES_API_KEY}`;
    const detailsResponse = await axios.get(detailsUrl);

    if (detailsResponse.data.status !== "OK" || !detailsResponse.data.result) {
      throw new Error(
        `Failed to get place details: ${detailsResponse.data.status}`
      );
    }

    const placeDetails = detailsResponse.data.result;
    const location = placeDetails.geometry.location;

    // Get nearby attractions, restaurants, and hotels
    return await getNearbyPointsOfInterest(location, placeDetails);
  } catch (error) {
    console.error("Error fetching destination data by place ID:", error);
    return null;
  }
}

// New function to fetch destination data by coordinates
async function fetchDestinationDataByCoordinates(lat, lng, destinationName) {
  try {
    const location = { lat, lng };

    // Try to get place details for this location
    const reverseGeocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_PLACES_API_KEY}`;
    const geocodingResponse = await axios.get(reverseGeocodingUrl);

    let placeDetails = {
      name: destinationName,
      formatted_address:
        geocodingResponse.data.results[0]?.formatted_address || destinationName,
      geometry: { location },
    };

    // Get nearby attractions, restaurants, and hotels
    return await getNearbyPointsOfInterest(location, placeDetails);
  } catch (error) {
    console.error("Error fetching destination data by coordinates:", error);
    return null;
  }
}

// Helper function to get nearby points of interest
async function getNearbyPointsOfInterest(location, placeDetails) {
  try {
    // Use Promise.all for parallel requests
    const [attractionsResponse, restaurantsResponse, hotelsResponse] =
      await Promise.all([
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`
        ),
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
        ),
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${location.lat},${location.lng}&radius=5000&type=lodging&key=${GOOGLE_PLACES_API_KEY}`
        ),
      ]);

    const attractions = attractionsResponse.data.results || [];
    const restaurants = restaurantsResponse.data.results || [];
    const hotels = hotelsResponse.data.results || [];

    return {
      destinationDetails: {
        name: placeDetails.name,
        address: placeDetails.formatted_address,
        rating: placeDetails.rating,
        website: placeDetails.website,
        phone: placeDetails.international_phone_number,
        coordinates: location,
      },
      attractions: attractions.slice(0, 10).map((attraction) => ({
        name: attraction.name,
        rating: attraction.rating,
        address: attraction.vicinity,
        placeId: attraction.place_id,
        photos: attraction.photos
          ? attraction.photos.map((photo) => photo.photo_reference)
          : [],
        types: attraction.types,
      })),
      restaurants: restaurants.slice(0, 10).map((restaurant) => ({
        name: restaurant.name,
        rating: restaurant.rating,
        price_level: restaurant.price_level,
        address: restaurant.vicinity,
        placeId: restaurant.place_id,
        types: restaurant.types,
      })),
      hotels: hotels.slice(0, 10).map((hotel) => ({
        name: hotel.name,
        rating: hotel.rating,
        address: hotel.vicinity,
        placeId: hotel.place_id,
        types: hotel.types,
      })),
    };
  } catch (error) {
    console.error("Error getting nearby points of interest:", error);
    throw error;
  }
}

// Budget suggestions endpoint
app.post("/api/budget-suggestion", async (req, res) => {
  try {
    const { destination, tripDuration, currentBudget, currentExpenses } =
      req.body;

    if (!destination) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Calculate total expenses and remaining budget
    const totalExpenses =
      currentExpenses?.reduce((sum, item) => sum + item.amount, 0) || 0;
    const remainingBudget = currentBudget - totalExpenses;

    // Format expenses by category for better prompt context
    const expensesByCategory = {};
    if (currentExpenses && currentExpenses.length > 0) {
      currentExpenses.forEach((expense) => {
        if (!expensesByCategory[expense.category]) {
          expensesByCategory[expense.category] = 0;
        }
        expensesByCategory[expense.category] += expense.amount;
      });
    }

    // Get the model from genAI
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    });

    // Create the prompt
    const prompt = `I'm planning a trip to ${destination} for ${
      tripDuration || 5
    } days.
                   My total budget is $${currentBudget || 1000}.
                   I've already spent $${totalExpenses} ${
      Object.keys(expensesByCategory).length > 0
        ? `in these categories: ${JSON.stringify(expensesByCategory)}`
        : ""
    }.
                   My remaining budget is $${remainingBudget}.
                   
                   Please provide:
                   1. Budget optimization suggestions
                   2. Tips on how to manage my remaining budget effectively
                   3. Assessment if my current spending is on track or if I need to adjust
                   4. Specific recommendations for saving money in ${destination}
                   
                   Keep your response concise, practical, and actionable. Limit to 3-4 paragraphs.`;

    // Generate content
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const suggestion = response.text();

    res.json({ suggestion });
  } catch (error) {
    console.error("AI budget suggestion error:", error.message);
    if (error.response) {
      console.error("API error details:", error.response.data);
    }
    res.status(500).json({ error: "Failed to generate budget suggestions" });
  }
});

// AI Travel Assistant endpoint
app.post("/api/travel-assistant", async (req, res) => {
  try {
    const { query, destination, tripDetails } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful travel assistant AI that answers questions about travel destinations, provides tips, and offers guidance for travelers.",
        },
        {
          role: "user",
          content: `Destination: ${destination || "Not specified"}
                   Trip Details: ${
                     JSON.stringify(tripDetails) || "Not provided"
                   }
                   
                   My question is: ${query}`,
        },
      ],
    });

    res.json({
      response: completion.choices[0].message.content,
      isAI: true,
    });
  } catch (error) {
    console.error("AI travel assistant error:", error);
    res.status(500).json({ error: "Failed to process your query" });
  }
});

// User details endpoints
app.post("/api/userdetails", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Log all steps
    console.log("Creating new user in MongoDB:", email);

    // Check if user already exists
    const userExists = await UserDetails.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with hashed password
    const newUser = new UserDetails({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    console.log("User saved to MongoDB successfully");

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Error saving user:", error);
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/userdetails/:email", async (req, res) => {
  try {
    const { phone_number, profile_picture, nationality } = req.body;
    const email = req.params.email;

    const updatedUser = await UserDetails.findOneAndUpdate(
      { email },
      { $set: { phone_number, profile_picture, nationality } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }

    res
      .status(200)
      .json({ message: "User details updated", user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Notifications endpoints
app.get("/api/userdetails/:email/notifications", async (req, res) => {
  try {
    const email = req.params.email;
    const notifications = await Notifications.find({ email });
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.delete("/api/userdetails/:email/notifications", async (req, res) => {
  try {
    const email = req.params.email;
    await Notifications.deleteMany({ email });
    res.json({ message: "Notifications cleared" });
  } catch (error) {
    console.error("Error clearing notifications:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.put("/api/userdetails/:email/notifications/read", async (req, res) => {
  try {
    const email = req.params.email;
    await Notifications.updateMany({ email }, { $set: { is_read: true } });
    res.json({ message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// List available models endpoint
app.get("/available-models", async (req, res) => {
  try {
    console.log("Attempting to list available models...");

    res.json({
      success: true,
      message:
        "To list models, you need to use the official Google API directly",
      suggestedModels: [
        "gemini-1.5-flash",
        "gemini-1.0-pro",
        "gemini-1.5-flash-latest",
        "text-bison",
      ],
    });
  } catch (error) {
    console.error("Error listing models:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Autocomplete endpoint for destinations using global location data
app.get("/api/destinations/autocomplete", async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({ error: "Missing query parameter" });
    }

    console.log("Received autocomplete request for:", query);

    // Use Google Places Autocomplete API with a more global scope
    const autoCompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(
      query
    )}&types=(cities)&language=en&key=${GOOGLE_PLACES_API_KEY}`;

    console.log("Requesting from Google API");

    try {
      const response = await axios.get(autoCompleteUrl);

      // Check if the request was denied
      if (response.data.status === "REQUEST_DENIED") {
        console.warn("Google API request denied:", response.data.error_message);
        return res.status(500).json({
          error: "API request denied",
          message: response.data.error_message,
        });
      }

      // Make sure predictions exist before trying to map them
      if (
        !response.data.predictions ||
        !Array.isArray(response.data.predictions) ||
        response.data.predictions.length === 0
      ) {
        console.warn("No predictions returned from Google API");
        return res.json({ suggestions: [] });
      }

      console.log(
        "Google API returned predictions:",
        response.data.predictions.length
      );

      const suggestions = response.data.predictions.map((prediction) => ({
        placeId: prediction.place_id || "",
        description: prediction.description || "",
        mainText:
          prediction.structured_formatting?.main_text ||
          prediction.description ||
          "",
        secondaryText: prediction.structured_formatting?.secondary_text || "",
      }));

      console.log("Sending suggestions to client:", suggestions.length);
      res.json({ suggestions });
    } catch (apiError) {
      console.error("Google API error:", apiError);
      return res.status(500).json({
        error: "Failed to get suggestions from Google API",
        message: apiError.message,
      });
    }
  } catch (error) {
    console.error("Error in autocomplete endpoint:", error);
    res.status(500).json({
      error: "Failed to get destination suggestions",
      details: error.message,
    });
  }
});

// To get more detailed information after selecting a place
app.get("/api/destinations/details", async (req, res) => {
  try {
    const { placeId } = req.query;

    if (!placeId) {
      return res.status(400).json({ error: "Missing placeId parameter" });
    }

    console.log("Received details request for place ID:", placeId);

    // Get detailed place information using the Places Details API
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,geometry,international_phone_number,website,price_level,opening_hours,photo&key=${GOOGLE_PLACES_API_KEY}`;

    const response = await axios.get(detailsUrl);

    if (response.data.status === "REQUEST_DENIED") {
      console.warn("Google API request denied:", response.data.error_message);
      return res.status(500).json({
        error: "API request denied",
        message: response.data.error_message,
      });
    }

    if (!response.data.result) {
      return res.status(404).json({ error: "Place details not found" });
    }

    const placeDetails = response.data.result;

    // Get additional information about the area
    const { lat, lng } = placeDetails.geometry.location;

    // Promise.all to parallelize the nearby searches
    const [attractionsResponse, restaurantsResponse, hotelsResponse] =
      await Promise.all([
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`
        ),
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`
        ),
        axios.get(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=lodging&key=${GOOGLE_PLACES_API_KEY}`
        ),
      ]);

    // Compile all data
    const placeData = {
      details: {
        name: placeDetails.name,
        formattedAddress: placeDetails.formatted_address,
        coordinates: { lat, lng },
        rating: placeDetails.rating,
        website: placeDetails.website,
        phoneNumber: placeDetails.international_phone_number,
      },
      attractions:
        attractionsResponse.data.results?.slice(0, 5).map((attraction) => ({
          name: attraction.name,
          address: attraction.vicinity,
          rating: attraction.rating,
          placeId: attraction.place_id,
        })) || [],
      restaurants:
        restaurantsResponse.data.results?.slice(0, 5).map((restaurant) => ({
          name: restaurant.name,
          address: restaurant.vicinity,
          rating: restaurant.rating,
          priceLevel: restaurant.price_level,
          placeId: restaurant.place_id,
        })) || [],
      hotels:
        hotelsResponse.data.results?.slice(0, 5).map((hotel) => ({
          name: hotel.name,
          address: hotel.vicinity,
          rating: hotel.rating,
          placeId: hotel.place_id,
        })) || [],
    };

    res.json(placeData);
  } catch (error) {
    console.error("Error getting place details:", error);
    res
      .status(500)
      .json({ error: "Failed to get place details", message: error.message });
  }
});

// Mount the auth routes correctly
app.use("/api/auth", authRoutes);

// Mount travel plans routes
app.use("/api/travel-plans", travelPlanRoutes);

// Start the server
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  console.log(
    `For device access: Use your machine's IP address and port ${PORT}`
  );
});

// Helper function to extract keywords from attraction name
function extractKeywordsFromName(name) {
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

  const keywords = [];
  const nameLower = name.toLowerCase();

  for (const landmark of commonLandmarks) {
    if (nameLower.includes(landmark)) {
      keywords.push(landmark);
      break;
    }
  }

  return keywords;
}
