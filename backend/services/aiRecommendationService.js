const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const TravelPlan = require("../models/TravelPlan");
const jwt = require("jsonwebtoken");

// Get environment variables
const JWT_SECRET = process.env.JWT_SECRET || "vista-travel-secret-key";
const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
const API_KEY = process.env.GOOGLE_PLACES_API_KEY; // Use the same key for both APIs

if (!GOOGLE_PLACES_API_KEY) {
  console.error("GOOGLE_PLACES_API_KEY is not set in environment variables");
  throw new Error("Google Places API key is required");
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

  if (types.includes("restaurant") || types.includes("food")) {
    return "Food";
  } else if (types.includes("museum") || types.includes("art_gallery")) {
    return "Cultural";
  } else if (types.includes("park") || types.includes("natural_feature")) {
    return "Outdoor";
  } else if (types.includes("lodging") || types.includes("hotel")) {
    return "Accommodation";
  } else if (types.includes("shopping_mall") || types.includes("store")) {
    return "Shopping";
  } else if (types.includes("amusement_park") || types.includes("zoo")) {
    return "Entertainment";
  } else {
    return "Attraction";
  }
}

// Improved fetchDestinationData function that uses global location data
async function fetchDestinationData(destination, placeId = null) {
  console.log(`Fetching destination data for: ${destination}`);
  try {
    // Attempt to get place ID if not provided
    if (!placeId) {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        destination
      )}&key=${GOOGLE_PLACES_API_KEY}`;

      console.log(`Making geocode API request for ${destination}`);
      const geocodeResponse = await axios.get(geocodeUrl);
      console.log(`Geocode API status: ${geocodeResponse.data.status}`);

      if (geocodeResponse.data.status !== "OK") {
        console.error(
          `Geocode API error: ${geocodeResponse.data.status}, error_message: ${
            geocodeResponse.data.error_message || "No error message provided"
          }`
        );
        throw new Error(
          `Google Geocode API error: ${geocodeResponse.data.status}`
        );
      }

      if (geocodeResponse.data.results.length === 0) {
        console.error("Geocode API returned no results");
        throw new Error("No results found for this destination");
      }

      const locationData = geocodeResponse.data.results[0];
      const location = locationData.geometry.location;
      console.log(`Found location coords: ${location.lat}, ${location.lng}`);

      // Attempt to get place details
      const placesUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
        destination
      )}&inputtype=textquery&fields=place_id,name,geometry&key=${GOOGLE_PLACES_API_KEY}`;

      console.log(`Making Places API request for ${destination}`);
      const placesResponse = await axios.get(placesUrl);
      console.log(`Places API status: ${placesResponse.data.status}`);

      if (placesResponse.data.status !== "OK") {
        console.error(
          `Places API error: ${placesResponse.data.status}, error_message: ${
            placesResponse.data.error_message || "No error message provided"
          }`
        );

        // If places API failed, we can still use geocode results to get nearby POIs
        console.log("Falling back to geocode location data only");
        const placeDetails = {
          name: destination,
          formatted_address: locationData.formatted_address || destination,
          geometry: { location },
        };

        return await getNearbyPointsOfInterest(location, placeDetails);
      }

      if (placesResponse.data.candidates.length === 0) {
        console.error("Places API returned no candidates");

        // Use geocode data instead
        const placeDetails = {
          name: destination,
          formatted_address: locationData.formatted_address || destination,
          geometry: { location },
        };

        return await getNearbyPointsOfInterest(location, placeDetails);
      }

      placeId = placesResponse.data.candidates[0].place_id;
      console.log(`Found place ID: ${placeId}`);

      // Fetch place details
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,formatted_address,geometry,international_phone_number,website,price_level,opening_hours,photo,review&key=${GOOGLE_PLACES_API_KEY}`;

      console.log(`Making Place Details API request for ${placeId}`);
      const detailsResponse = await axios.get(detailsUrl);
      console.log(`Place Details API status: ${detailsResponse.data.status}`);

      if (
        detailsResponse.data.status !== "OK" ||
        !detailsResponse.data.result
      ) {
        console.error(
          `Place Details API error: ${
            detailsResponse.data.status
          }, error_message: ${
            detailsResponse.data.error_message || "No result found"
          }`
        );

        // Fall back to geocode data
        const placeDetails = {
          name: destination,
          formatted_address: locationData.formatted_address || destination,
          geometry: { location },
        };

        return await getNearbyPointsOfInterest(location, placeDetails);
      }

      const placeDetails = detailsResponse.data.result;

      // Get nearby attractions, restaurants, and hotels
      const pointsOfInterest = await getNearbyPointsOfInterest(
        location,
        placeDetails
      );

      if (
        pointsOfInterest.attractions.length === 0 &&
        pointsOfInterest.restaurants.length === 0
      ) {
        console.log(
          "No attractions or restaurants found, using mock data as a supplement"
        );
        const mockData = generateMockDestinationData(destination);

        // Merge real data with mock data
        return {
          destinationDetails: placeDetails,
          attractions:
            pointsOfInterest.attractions.length > 0
              ? pointsOfInterest.attractions
              : mockData.attractions,
          restaurants:
            pointsOfInterest.restaurants.length > 0
              ? pointsOfInterest.restaurants
              : mockData.restaurants,
          hotels:
            pointsOfInterest.hotels.length > 0
              ? pointsOfInterest.hotels
              : mockData.hotels,
        };
      }

      return pointsOfInterest;
    } else {
      // If we have a place ID, use it directly
      const placeData = await fetchDestinationDataByPlaceId(placeId);
      if (placeData) {
        return placeData;
      }
    }

    // Fallback to mock data if all else fails
    console.log("All API methods failed, using mock data as last resort");
    return generateMockDestinationData(destination);
  } catch (error) {
    console.error("Error fetching destination data:", error);
    console.log("API error, using mock data as fallback");
    return generateMockDestinationData(destination);
  }
}

// Function to fetch destination data by place ID
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

// Function to fetch destination data by coordinates
async function fetchDestinationDataByCoordinates(lat, lng, destination) {
  try {
    // Create a location object
    const location = { lat, lng };

    // Create a basic place details object
    const placeDetails = {
      name: destination,
      formatted_address: `${destination}`,
      geometry: { location },
    };

    // Get nearby attractions, restaurants, and hotels
    return await getNearbyPointsOfInterest(location, placeDetails);
  } catch (error) {
    console.error("Error fetching destination data by coordinates:", error);
    return null;
  }
}

// Function to get nearby points of interest
async function getNearbyPointsOfInterest(location, placeDetails) {
  try {
    // Make sure we have valid location data
    if (
      !location ||
      (!location.lat && !location.latitude) ||
      (!location.lng && !location.longitude)
    ) {
      console.error("Invalid location data:", location);
      throw new Error(
        "Invalid location data for fetching nearby points of interest"
      );
    }

    // Normalize the location format
    const lat = location.lat || location.latitude;
    const lng = location.lng || location.longitude;

    // Get nearby attractions
    const attractionsUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=tourist_attraction&key=${GOOGLE_PLACES_API_KEY}`;
    console.log(`Making attractions request near ${lat},${lng}`);
    const attractionsResponse = await axios.get(attractionsUrl);
    console.log(
      `Attractions API status: ${attractionsResponse.data.status}, found ${
        attractionsResponse.data.results?.length || 0
      } attractions`
    );

    // Get nearby restaurants
    const restaurantsUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=restaurant&key=${GOOGLE_PLACES_API_KEY}`;
    console.log(`Making restaurants request near ${lat},${lng}`);
    const restaurantsResponse = await axios.get(restaurantsUrl);
    console.log(
      `Restaurants API status: ${restaurantsResponse.data.status}, found ${
        restaurantsResponse.data.results?.length || 0
      } restaurants`
    );

    // Get nearby hotels
    const hotelsUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=10000&type=lodging&key=${GOOGLE_PLACES_API_KEY}`;
    console.log(`Making hotels request near ${lat},${lng}`);
    const hotelsResponse = await axios.get(hotelsUrl);
    console.log(
      `Hotels API status: ${hotelsResponse.data.status}, found ${
        hotelsResponse.data.results?.length || 0
      } hotels`
    );

    // Process the responses
    let attractions = [];
    if (attractionsResponse.data.status === "OK") {
      attractions = attractionsResponse.data.results || [];
    } else {
      console.error(
        `Attractions API error: ${attractionsResponse.data.status}`,
        attractionsResponse.data.error_message || "No error message"
      );
    }

    let restaurants = [];
    if (restaurantsResponse.data.status === "OK") {
      restaurants = restaurantsResponse.data.results || [];
    } else {
      console.error(
        `Restaurants API error: ${restaurantsResponse.data.status}`,
        restaurantsResponse.data.error_message || "No error message"
      );
    }

    let hotels = [];
    if (hotelsResponse.data.status === "OK") {
      hotels = hotelsResponse.data.results || [];
    } else {
      console.error(
        `Hotels API error: ${hotelsResponse.data.status}`,
        hotelsResponse.data.error_message || "No error message"
      );
    }

    // Add formatted addresses and missing details
    const processedAttractions = attractions.map((attraction) => ({
      ...attraction,
      address: attraction.vicinity || attraction.formatted_address || "",
    }));

    const processedRestaurants = restaurants.map((restaurant) => ({
      ...restaurant,
      address: restaurant.vicinity || restaurant.formatted_address || "",
    }));

    const processedHotels = hotels.map((hotel) => ({
      ...hotel,
      address: hotel.vicinity || hotel.formatted_address || "",
    }));

    // Check if we have no data at all
    if (
      processedAttractions.length === 0 &&
      processedRestaurants.length === 0 &&
      processedHotels.length === 0
    ) {
      console.log(
        "No points of interest found near this location, returning mock data"
      );
      const mockData = generateMockDestinationData(placeDetails.name);
      return {
        destinationDetails: placeDetails,
        attractions: mockData.attractions,
        restaurants: mockData.restaurants,
        hotels: mockData.hotels,
      };
    }

    console.log(
      `Successfully processed ${processedAttractions.length} attractions, ${processedRestaurants.length} restaurants, and ${processedHotels.length} hotels`
    );

    return {
      destinationDetails: placeDetails,
      attractions: processedAttractions,
      restaurants: processedRestaurants,
      hotels: processedHotels,
    };
  } catch (error) {
    console.error("Error getting nearby points of interest:", error);
    console.log("Returning mock data for attractions, restaurants, and hotels");
    const mockData = generateMockDestinationData(placeDetails.name);
    return {
      destinationDetails: placeDetails,
      attractions: mockData.attractions,
      restaurants: mockData.restaurants,
      hotels: mockData.hotels,
    };
  }
}

// Function to generate mock destination data
function generateMockDestinationData(destination) {
  return {
    destinationDetails: {
      name: destination,
      formatted_address: `${destination}`,
      rating: 4.5,
    },
    attractions: [
      {
        name: `${destination} City Center`,
        rating: 4.5,
        types: ["point_of_interest"],
      },
      {
        name: `${destination} Historical Museum`,
        rating: 4.3,
        types: ["museum"],
      },
      { name: `${destination} Natural Park`, rating: 4.7, types: ["park"] },
      {
        name: `${destination} Art Gallery`,
        rating: 4.2,
        types: ["art_gallery"],
      },
      {
        name: `${destination} Cultural Center`,
        rating: 4.4,
        types: ["point_of_interest"],
      },
    ],
    restaurants: [
      {
        name: `${destination} Local Restaurant`,
        rating: 4.5,
        price_level: 2,
        types: ["restaurant"],
      },
      {
        name: `${destination} Fine Dining`,
        rating: 4.7,
        price_level: 3,
        types: ["restaurant"],
      },
      {
        name: `${destination} Café`,
        rating: 4.3,
        price_level: 1,
        types: ["cafe"],
      },
    ],
    hotels: [
      { name: `${destination} Hotel`, rating: 4.4, types: ["lodging"] },
      {
        name: `${destination} Boutique Hotel`,
        rating: 4.6,
        types: ["lodging"],
      },
    ],
  };
}

// Function to fetch hotels from Amadeus
async function fetchHotelsFromAmadeus(lat, lng, checkInDate, checkOutDate) {
  try {
    // This is a placeholder for the actual Amadeus API call
    // In a real implementation, you would use the Amadeus API to fetch hotels
    return [
      { name: "Hotel Example 1", rating: 4.5, price: { total: 150 } },
      { name: "Hotel Example 2", rating: 4.3, price: { total: 120 } },
      { name: "Hotel Example 3", rating: 4.7, price: { total: 200 } },
    ];
  } catch (error) {
    console.error("Error fetching hotels from Amadeus:", error);
    return [];
  }
}

// Function to get user ID from token
function getUserIdFromToken(authHeader) {
  if (!authHeader) return null;

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.id;
  } catch (error) {
    console.log("Invalid token, proceeding without user ID");
    return null;
  }
}

// Main function to generate AI recommendations
async function generateAIRecommendations(req) {
  const {
    destination,
    placeId,
    coordinates,
    budget,
    preferences,
    tripDuration,
    season,
    travelStyle,
    checkInDate,
    checkOutDate,
  } = req.query;

  // Get user ID if authenticated
  const userId = getUserIdFromToken(req.headers.authorization);

  console.log("AI recommendation request received:", {
    destination,
    placeId,
    coordinates,
    budget,
    tripDuration,
    preferences,
    season,
    travelStyle,
    checkInDate,
    checkOutDate,
  });

  if (!destination) {
    throw new Error("Missing destination parameter");
  }

  // Fetch real data about the destination
  let destinationData;

  if (placeId) {
    // If we have a place ID, use it directly with the Place Details API
    destinationData = await fetchDestinationDataByPlaceId(placeId);
  } else if (coordinates) {
    // If we have coordinates, use them to get nearby points of interest
    const [lat, lng] = coordinates.split(",").map((coord) => parseFloat(coord));
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
    throw new Error("Could not find data for this destination");
  }

  console.log("Fetched real destination data for:", destination);

  // Parse coordinates
  let lat, lng;
  if (coordinates) {
    [lat, lng] = coordinates.split(",").map(parseFloat);
  } else {
    // Use destination data coords if available
    lat = destinationData?.destinationDetails?.geometry?.location?.lat;
    lng = destinationData?.destinationDetails?.geometry?.location?.lng;
  }

  // Get hotel data from Amadeus if coordinates are available
  let amadeusHotels = [];
  if (lat && lng) {
    // Format dates or use defaults (7 days from today)
    const today = new Date();
    const defaultCheckIn = today.toISOString().split("T")[0];

    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(
      defaultCheckOut.getDate() + parseInt(tripDuration) || 7
    );
    const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

    amadeusHotels = await fetchHotelsFromAmadeus(
      lat,
      lng,
      checkInDate || defaultCheckIn,
      checkOutDate || defaultCheckOutStr
    );
  }

  // Try with Gemini API first
  try {
    console.log("Attempting to use Gemini API...");
    const genAIClient = new GoogleGenerativeAI(API_KEY);

    // Use gemini-pro instead of gemini-1.5-flash which might not be available in current API version
    let model = genAIClient.getGenerativeModel({
      model: "gemini-pro",
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

    console.log("Sending request to Gemini API with real destination data...");

    // Add timeout for the API call with better error handling
    try {
      const result = await model.generateContent(promptText);
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
            aiSuggestion: text,
            destinationData: {
              details: destinationData.destinationDetails,
              topAttractions: destinationData.attractions.slice(0, 5),
              topRestaurants: destinationData.restaurants.slice(0, 5),
              recommendedHotels: destinationData.hotels.slice(0, 3),
              amadeusHotels: amadeusHotels,
            },
          });

          savedPlan = await newTravelPlan.save();
          console.log("Travel plan saved to database with ID:", savedPlan._id);
        } catch (saveError) {
          console.error("Error saving travel plan:", saveError);
        }
      }

      // Return both the AI text and the enhanced structured data
      return {
        destination,
        budget: parseInt(budget) || 1000,
        aiSuggestion: text,
        savedPlanId: savedPlan ? savedPlan._id : null,
        destinationData: {
          details: destinationData.destinationDetails,
          topAttractions: destinationData.attractions.slice(0, 5),
          topRestaurants: destinationData.restaurants.slice(0, 5),
          recommendedHotels: destinationData.hotels.slice(0, 3),
          amadeusHotels: amadeusHotels,
        },
        ...enhancedPlan,
      };
    } catch (geminiError) {
      console.error("Error with Gemini API request:", geminiError);
      throw new Error(`Gemini API Error: ${geminiError.message}`);
    }
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
          destinationData: {
            details: destinationData.destinationDetails,
            topAttractions: destinationData.attractions.slice(0, 5),
            topRestaurants: destinationData.restaurants.slice(0, 5),
            recommendedHotels: destinationData.hotels.slice(0, 3),
            amadeusHotels: amadeusHotels,
          },
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

    return {
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
        amadeusHotels: amadeusHotels,
      },
      ...enhancedPlan,
    };
  }
}

// Function to get emergency fallback plan
async function getEmergencyFallbackPlan(destination, budget, tripDuration) {
  const planData = await generateTravelPlan(destination, budget, tripDuration);

  return {
    destination,
    budget: parseInt(budget) || 1000,
    source: "emergency_fallback",
    error: "Could not fetch real destination data",
    ...planData,
  };
}

module.exports = {
  generateAIRecommendations,
  getEmergencyFallbackPlan,
};
