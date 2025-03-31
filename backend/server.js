// Load environment variables
require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const bodyParser = require("body-parser");
const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const authRoutes = require("./routes/auth");
// Import the users routes
const userRoutes = require("./routes/users");
const travelPlanRoutes = require("./routes/travelPlans");
const { configurePassport } = require("./config/passport");
const JwtStrategy = require("passport-jwt").Strategy;
const ExtractJwt = require("passport-jwt").ExtractJwt;
const jwt = require("jsonwebtoken");
const Amadeus = require("amadeus");
const hotelRoutes = require("./routes/hotelRoutes");
const flightRoutes = require("./routes/flightRoutes");

// Define API key for Google AI
const API_KEY =
  process.env.GOOGLE_API_KEY || "AIzaSyBnDKVfSfmY4HwxmC_VULTfH4UwyDfKF_g";
const genAI = new GoogleGenerativeAI(API_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Amadeus API client
const amadeus = new Amadeus({
  clientId: process.env.AMADEUS_API_KEY || "YOUR_AMADEUS_API_KEY_HERE",
  clientSecret:
    process.env.AMADEUS_API_SECRET || "YOUR_AMADEUS_API_SECRET_HERE",
});

// Middleware
app.use(
  cors({
    origin: "*", // Be more restrictive in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize Passport BEFORE configuring it
app.use(passport.initialize());

// Configure passport strategies
configurePassport(passport);

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/vista-travel", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes); // Enable users routes
app.use("/api/travel-plans", travelPlanRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/flights", flightRoutes);

// ====== AI FEATURE ROUTES ======

// Personalized Recommendations Endpoint
app.get("/api/personalized-recommendations", async (req, res) => {
  try {
    const { interests, budget, destinationTypes } = req.query;

    console.log("Received preferences:", {
      interests: interests || "not provided",
      budget: budget || "not provided",
      destinationTypes: destinationTypes || "not provided",
    });

    // Parse the query parameters
    const userInterests = interests ? interests.split(",") : [];
    const userBudget = budget || "moderate";
    const userDestTypes = destinationTypes ? destinationTypes.split(",") : [];

    // Simulate user preferences and history
    // In a real app, this would come from a database based on the authenticated user
    const userPreferences = {
      visitedDestinations: ["Paris", "London", "Barcelona"],
      topActivities:
        userInterests.length > 0
          ? userInterests
          : ["Museums", "History", "Food", "Architecture"],
      avgBudget:
        userBudget === "luxury" ? 3000 : userBudget === "moderate" ? 1500 : 800,
      preferredHotelTypes: ["Boutique", "Mid-range"],
      // Add destination types if provided
      preferredDestinationTypes: userDestTypes.length > 0 ? userDestTypes : [],
    };

    // Generate personalized destinations based on user preferences
    const personalizedDestinations =
      generatePersonalizedDestinations(userPreferences);

    // Return both user preferences and recommendations
    res.json({
      userPreferences,
      personalizedRecommendations: {
        destinations: personalizedDestinations,
      },
    });
  } catch (error) {
    console.error("Error generating personalized recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate personalized recommendations",
      error: error.message,
    });
  }
});

// Helper function to generate personalized destination recommendations
const generatePersonalizedDestinations = (userPreferences) => {
  // Collection of possible destinations with their attributes
  const destinationDatabase = [
    {
      name: "Rome",
      country: "Italy",
      categories: ["Culture", "History", "Food", "Architecture"],
      budgetCategory: "moderate",
      destinationType: "city",
      image: "https://images.unsplash.com/photo-1552832230-c0197dd311b5",
      reason: "Matches your interest in history and architecture",
      bestTimeToVisit: "April to June, September to October",
      budgetRange: "$120-180 per day",
      recommendedActivities: [
        "Visit the Colosseum and Roman Forum",
        "Explore Vatican Museums",
        "Food tour in Trastevere",
        "Day trip to Pompeii",
      ],
      suggestedHotel: "Hotel Artemide (boutique, mid-range)",
    },
    {
      name: "Vienna",
      country: "Austria",
      categories: ["Culture", "History", "Museums", "Music", "Architecture"],
      budgetCategory: "moderate",
      destinationType: "city",
      image: "https://images.unsplash.com/photo-1516550893885-985c994c8609",
      reason: "Perfect for your interest in museums and architecture",
      bestTimeToVisit: "April to May, September to October",
      budgetRange: "$130-190 per day",
      recommendedActivities: [
        "Visit Schönbrunn Palace",
        "Explore Belvedere Museum",
        "Vienna Opera House tour",
        "Coffee house culture experience",
      ],
      suggestedHotel: "Hotel Das Tyrol (boutique, mid-range)",
    },
    {
      name: "Prague",
      country: "Czech Republic",
      categories: [
        "History",
        "Architecture",
        "Culture",
        "Beer",
        "Budget-friendly",
      ],
      budgetCategory: "budget",
      destinationType: "city",
      image: "https://images.unsplash.com/photo-1541849546-216549ae216d",
      reason: "Offers historical architecture at an affordable price",
      bestTimeToVisit: "March to May, September to November",
      budgetRange: "$90-150 per day",
      recommendedActivities: [
        "Explore Prague Castle",
        "Walk across Charles Bridge",
        "Visit Old Town Square",
        "Prague food tour",
      ],
      suggestedHotel: "BoHo Prague Hotel (boutique, mid-range)",
    },
    {
      name: "Bali",
      country: "Indonesia",
      categories: ["Beaches", "Nature", "Relaxation", "Wellness", "Adventure"],
      budgetCategory: "budget",
      destinationType: "island",
      image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4",
      reason: "Perfect for relaxation and nature exploration",
      bestTimeToVisit: "April to October",
      budgetRange: "$70-150 per day",
      recommendedActivities: [
        "Visit Ubud temples",
        "Relax on Kuta Beach",
        "Take a yoga class in Ubud",
        "Rice terrace hiking",
      ],
      suggestedHotel: "Ubud Village Hotel (boutique, mid-range)",
    },
    {
      name: "Santorini",
      country: "Greece",
      categories: ["Beaches", "Relaxation", "Views", "Romantic", "Food"],
      budgetCategory: "luxury",
      destinationType: "island",
      image: "https://images.unsplash.com/photo-1507501336603-6e31db2be093",
      reason: "Known for stunning views and romantic atmosphere",
      bestTimeToVisit: "April to May, September to October",
      budgetRange: "$200-300 per day",
      recommendedActivities: [
        "Watch sunset in Oia",
        "Visit black sand beaches",
        "Wine tasting tour",
        "Boat tour to volcanic islands",
      ],
      suggestedHotel: "Andronis Luxury Suites (luxury)",
    },
    {
      name: "New York City",
      country: "United States",
      categories: ["Urban", "Shopping", "Museums", "Food", "Nightlife"],
      budgetCategory: "luxury",
      destinationType: "city",
      image: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9",
      reason: "Matches your urban exploration preferences",
      bestTimeToVisit: "April to June, September to November",
      budgetRange: "$200-350 per day",
      recommendedActivities: [
        "Visit Metropolitan Museum of Art",
        "Walk through Central Park",
        "Broadway show experience",
        "Food tour in different neighborhoods",
      ],
      suggestedHotel: "Archer Hotel (boutique, luxury)",
    },
    {
      name: "Swiss Alps",
      country: "Switzerland",
      categories: [
        "Mountains",
        "Nature",
        "Adventure",
        "Hiking",
        "Winter Sports",
      ],
      budgetCategory: "luxury",
      destinationType: "mountains",
      image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b",
      reason: "Perfect for outdoor adventure enthusiasts",
      bestTimeToVisit:
        "December to March (winter sports), June to September (hiking)",
      budgetRange: "$200-300 per day",
      recommendedActivities: [
        "Ski in world-class resorts",
        "Take the Glacier Express",
        "Hike in the mountains",
        "Visit picturesque alpine villages",
      ],
      suggestedHotel: "Hotel Belvedere Grindelwald (mountain resort)",
    },
    {
      name: "Kyoto",
      country: "Japan",
      categories: ["Culture", "History", "Food", "Temples", "Nature"],
      budgetCategory: "moderate",
      destinationType: "city",
      image: "https://images.unsplash.com/photo-1545569341-9eb8b30979d9",
      reason: "Rich in cultural and historical experiences",
      bestTimeToVisit: "March to May, October to November",
      budgetRange: "$150-220 per day",
      recommendedActivities: [
        "Visit Fushimi Inari Shrine",
        "Explore Arashiyama Bamboo Grove",
        "Traditional tea ceremony",
        "Kimono experience",
      ],
      suggestedHotel: "The Celestine Kyoto Gion (boutique, moderate)",
    },
  ];

  // Scoring system based on preference matches
  const scoredDestinations = destinationDatabase.map((destination) => {
    let score = 0;

    // Check interest matches
    userPreferences.topActivities.forEach((interest) => {
      if (
        destination.categories.some(
          (cat) =>
            cat.toLowerCase() === interest.toLowerCase() ||
            cat.toLowerCase().includes(interest.toLowerCase())
        )
      ) {
        score += 3;
      }
    });

    // Check budget match
    if (
      destination.budgetCategory === userPreferences.avgBudget ||
      (userPreferences.avgBudget === "luxury" &&
        destination.budgetCategory === "moderate") ||
      (userPreferences.avgBudget === "moderate" &&
        destination.budgetCategory === "budget")
    ) {
      score += 2;
    }

    // Check if destination type matches preferences
    if (
      userPreferences.preferredDestinationTypes.length > 0 &&
      userPreferences.preferredDestinationTypes.some((type) =>
        destination.destinationType.toLowerCase().includes(type.toLowerCase())
      )
    ) {
      score += 3;
    }

    // Penalize for already visited destinations
    if (userPreferences.visitedDestinations.includes(destination.name)) {
      score -= 10;
    }

    return {
      ...destination,
      score,
    };
  });

  // Sort by score and return top results
  return scoredDestinations.sort((a, b) => b.score - a.score).slice(0, 3);
};

// Itinerary Optimization Endpoint
app.post("/api/optimize-itinerary", async (req, res) => {
  try {
    const {
      itinerary,
      startingPoint,
      transportationType = "driving",
    } = req.body;

    if (!itinerary || itinerary.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Itinerary must contain at least 2 places to optimize",
      });
    }

    // Log the request for debugging
    console.log(
      "Optimizing itinerary:",
      JSON.stringify({
        places: itinerary.length,
        transportationType,
        hasStartingPoint: !!startingPoint,
      })
    );

    // In a real app, we would call a routing optimization API
    // For this mock, we'll just simulate an optimized route

    // Create a copy of the itinerary to reorder
    const optimizedItinerary = [...itinerary];

    // Sort the optimized itinerary (for demonstration, we're just doing a simple shuffle)
    // In a real implementation, this would use a proper traveling salesman algorithm
    for (let i = optimizedItinerary.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optimizedItinerary[i], optimizedItinerary[j]] = [
        optimizedItinerary[j],
        optimizedItinerary[i],
      ];
    }

    // Add simulated travel times between places
    for (let i = 1; i < optimizedItinerary.length; i++) {
      // Generate a random travel time between 10 and 45 minutes
      const minutes = Math.floor(Math.random() * 36) + 10;
      optimizedItinerary[i].travelTime = `${minutes} minutes`;
    }

    // Calculate optimization details
    const optimizationDetails = {
      totalDistance: (Math.random() * 15 + 5).toFixed(1) * 1, // 5-20 km
      travelTimes: optimizedItinerary
        .filter((place) => place.travelTime)
        .map((place) => ({
          from: place.name,
          time: place.travelTime,
        })),
      explanation: `This optimized route minimizes travel time for ${transportationType} and considers the most efficient path between attractions. The order has been arranged to reduce backtracking and overall distance traveled.`,
    };

    res.json({
      success: true,
      optimizedItinerary,
      optimizationDetails,
    });
  } catch (error) {
    console.error("Error optimizing itinerary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to optimize itinerary",
      error: error.message,
    });
  }
});

// Cultural Insights Endpoint
app.get("/api/cultural-insights", async (req, res) => {
  const { destination } = req.query;

  if (!destination) {
    return res.status(400).json({
      success: false,
      message: "Destination parameter is required",
    });
  }

  try {
    // In a real implementation, this would call the Google Generative AI API
    // Here we're returning mock data for demonstration

    // Simulate cultural insights based on destination
    const culturalInsights = {
      destination,
      sections: [
        {
          title: "Local Customs & Etiquette",
          content: `In ${destination}, greeting people respectfully is important. If visiting religious sites, dress modestly with shoulders and knees covered. Tipping practices vary - in restaurants, 10-15% is typical if service charge isn't included. Remove shoes when entering homes or certain religious buildings. Learn a few basic phrases in the local language - even simple greetings are appreciated by locals.`,
        },
        {
          title: "Cultural Context",
          content: `${destination} has a rich cultural heritage influenced by centuries of history. The local population values tradition while embracing modernity. Family structures are important, and many cultural events center around community gatherings. The arts scene includes traditional and contemporary expressions, with distinctive architecture, music, and visual arts that reflect the region's unique identity.`,
        },
        {
          title: "Communication Tips",
          content: `When communicating in ${destination}, be aware that directness varies by context. Using respectful titles when addressing older people or those in positions of authority is advisable. Non-verbal communication is important - notice body language and personal space norms. In business settings, relationships may be built before discussing specifics. Being patient and observing local conversation patterns will help you navigate social situations effectively.`,
        },
        {
          title: "Practical Tips",
          content: `For a culturally respectful visit to ${destination}, research specific holidays that might affect your travel plans. Photography rules vary at religious sites and some public buildings - always ask permission before taking photos of people. Public displays of affection may be frowned upon in conservative areas. When dining, wait for hosts to begin eating and follow their lead on dining etiquette. Consider bringing small gifts when invited to someone's home.`,
        },
      ],
    };

    res.json(culturalInsights);
  } catch (error) {
    console.error("Error generating cultural insights:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate cultural insights",
      error: error.message,
    });
  }
});

// Weather Recommendations Endpoint
app.get("/api/weather-recommendations", async (req, res) => {
  // Extract query parameters
  const { destination, startDate, endDate } = req.query;

  // Validate required parameters
  if (!destination) {
    return res.status(400).json({
      success: false,
      message: "Destination parameter is required",
    });
  }

  try {
    // Generate simulated weather data
    const weatherData = generateSimulatedWeatherData(
      destination,
      startDate,
      endDate
    );

    // Create AI recommendations based on the weather data
    const recommendations = [
      {
        title: "Weather Summary",
        content: `The weather in ${destination} during your trip will generally be ${getOverallWeatherDescription(
          weatherData
        )}. Temperatures will range from ${getMinTemp(
          weatherData
        )}°C to ${getMaxTemp(weatherData)}°C. ${getRainAdvice(weatherData)}`,
      },
      {
        title: "Packing Recommendations",
        content: getPackingRecommendations(weatherData, destination),
      },
      {
        title: "Activity Recommendations",
        content: getActivityRecommendations(weatherData, destination),
      },
      {
        title: "Weather-Related Travel Tips",
        content: getWeatherTravelTips(weatherData, destination),
      },
    ];

    // Return both weather data and recommendations
    res.json({
      success: true,
      weatherData,
      recommendations,
    });
  } catch (error) {
    console.error("Error generating weather recommendations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate weather recommendations",
      error: error.message,
    });
  }
});

// ====== HELPER FUNCTIONS ======

// Generate simulated weather data based on destination and date range
function generateSimulatedWeatherData(destination, startDateStr, endDateStr) {
  // Default to current date if not provided
  const startDate = startDateStr ? new Date(startDateStr) : new Date();

  // Default to 7 days after start date if end date not provided
  let endDate;
  if (endDateStr) {
    endDate = new Date(endDateStr);
  } else {
    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 7);
  }

  // Calculate number of days
  const diffTime = Math.abs(endDate - startDate);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const numDays = Math.min(diffDays + 1, 14); // Limit to 14 days max

  // Determine base temperature and weather patterns based on destination
  let baseHighTemp, baseLowTemp, rainProbability, weatherPatterns;

  // Very simplified weather simulation based on destination
  const destinationLower = destination.toLowerCase();
  if (
    destinationLower.includes("london") ||
    destinationLower.includes("england") ||
    destinationLower.includes("uk") ||
    destinationLower.includes("scotland")
  ) {
    baseHighTemp = 18;
    baseLowTemp = 10;
    rainProbability = 0.6;
    weatherPatterns = ["Cloudy", "Light Rain", "Overcast", "Partly Cloudy"];
  } else if (
    destinationLower.includes("paris") ||
    destinationLower.includes("france") ||
    destinationLower.includes("germany") ||
    destinationLower.includes("europe")
  ) {
    baseHighTemp = 22;
    baseLowTemp = 13;
    rainProbability = 0.4;
    weatherPatterns = ["Sunny", "Partly Cloudy", "Light Rain", "Cloudy"];
  } else if (
    destinationLower.includes("rome") ||
    destinationLower.includes("italy") ||
    destinationLower.includes("spain") ||
    destinationLower.includes("greece")
  ) {
    baseHighTemp = 28;
    baseLowTemp = 18;
    rainProbability = 0.2;
    weatherPatterns = ["Sunny", "Clear", "Partly Cloudy", "Hazy"];
  } else if (
    destinationLower.includes("new york") ||
    destinationLower.includes("usa") ||
    destinationLower.includes("united states") ||
    destinationLower.includes("canada")
  ) {
    baseHighTemp = 24;
    baseLowTemp = 15;
    rainProbability = 0.3;
    weatherPatterns = [
      "Sunny",
      "Partly Cloudy",
      "Cloudy",
      "Light Rain",
      "Clear",
    ];
  } else if (
    destinationLower.includes("tokyo") ||
    destinationLower.includes("japan") ||
    destinationLower.includes("china") ||
    destinationLower.includes("asia")
  ) {
    baseHighTemp = 26;
    baseLowTemp = 18;
    rainProbability = 0.35;
    weatherPatterns = ["Sunny", "Humid", "Light Rain", "Cloudy"];
  } else if (
    destinationLower.includes("sydney") ||
    destinationLower.includes("australia") ||
    destinationLower.includes("new zealand")
  ) {
    baseHighTemp = 25;
    baseLowTemp = 16;
    rainProbability = 0.25;
    weatherPatterns = ["Sunny", "Clear", "Partly Cloudy", "Breezy"];
  } else if (
    destinationLower.includes("dubai") ||
    destinationLower.includes("uae") ||
    destinationLower.includes("egypt") ||
    destinationLower.includes("middle east")
  ) {
    baseHighTemp = 35;
    baseLowTemp = 25;
    rainProbability = 0.05;
    weatherPatterns = ["Sunny", "Clear", "Hot", "Hazy"];
  } else if (
    destinationLower.includes("bangkok") ||
    destinationLower.includes("thailand") ||
    destinationLower.includes("vietnam") ||
    destinationLower.includes("southeast asia")
  ) {
    baseHighTemp = 32;
    baseLowTemp = 24;
    rainProbability = 0.5;
    weatherPatterns = ["Humid", "Thunderstorm", "Sunny", "Light Rain"];
  } else {
    // Default weather if no specific match
    baseHighTemp = 25;
    baseLowTemp = 15;
    rainProbability = 0.3;
    weatherPatterns = ["Sunny", "Partly Cloudy", "Cloudy", "Light Rain"];
  }

  // Generate daily weather
  const weatherData = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < numDays; i++) {
    // Add random variation to temperatures
    const tempVariation = Math.floor(Math.random() * 6) - 3;
    const highTemp = baseHighTemp + tempVariation;
    const lowTemp = baseLowTemp + tempVariation;

    // Determine if it will rain
    const willRain = Math.random() < rainProbability;

    // Pick a weather condition
    let condition;
    if (willRain) {
      condition =
        weatherPatterns.find(
          (pattern) => pattern.includes("Rain") || pattern.includes("Thunder")
        ) || "Light Rain";
    } else {
      // Filter out rain patterns
      const nonRainPatterns = weatherPatterns.filter(
        (pattern) => !pattern.includes("Rain") && !pattern.includes("Thunder")
      );
      const randomIndex = Math.floor(Math.random() * nonRainPatterns.length);
      condition = nonRainPatterns[randomIndex];
    }

    // Format date as ISO string
    const dateStr = currentDate.toISOString().split("T")[0];

    // Add to weather data array
    weatherData.push({
      date: dateStr,
      highTemp,
      lowTemp,
      condition,
    });

    // Move to next day
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return weatherData;
}

// Helper to get overall weather description
function getOverallWeatherDescription(weatherData) {
  const conditions = weatherData.map((day) => day.condition.toLowerCase());

  if (conditions.some((c) => c.includes("rain") || c.includes("thunder"))) {
    return "variable with some rainy periods";
  } else if (
    conditions.every((c) => c.includes("sunny") || c.includes("clear"))
  ) {
    return "sunny and clear";
  } else if (conditions.some((c) => c.includes("cloud"))) {
    return "partly cloudy with some clear periods";
  } else {
    return "generally pleasant";
  }
}

// Helper to get min temperature
function getMinTemp(weatherData) {
  return Math.min(...weatherData.map((day) => day.lowTemp));
}

// Helper to get max temperature
function getMaxTemp(weatherData) {
  return Math.max(...weatherData.map((day) => day.highTemp));
}

// Helper to get rain advice
function getRainAdvice(weatherData) {
  const rainyDays = weatherData.filter(
    (day) =>
      day.condition.toLowerCase().includes("rain") ||
      day.condition.toLowerCase().includes("thunder")
  );

  if (rainyDays.length === 0) {
    return "No rain is expected during your visit.";
  } else if (rainyDays.length <= 2) {
    return `There's a chance of rain on ${rainyDays.length} day(s) of your trip.`;
  } else {
    return `Be prepared for rain as it's expected on ${rainyDays.length} days of your trip.`;
  }
}

// Helper to get packing recommendations
function getPackingRecommendations(weatherData, destination) {
  const minTemp = getMinTemp(weatherData);
  const maxTemp = getMaxTemp(weatherData);
  const hasRain = weatherData.some(
    (day) =>
      day.condition.toLowerCase().includes("rain") ||
      day.condition.toLowerCase().includes("thunder")
  );

  let recommendations = `For your trip to ${destination} with temperatures ranging from ${minTemp}°C to ${maxTemp}°C, pack `;

  if (maxTemp > 30) {
    recommendations +=
      "lightweight, breathable clothing, sun protection including sunscreen, sunglasses, and a hat. ";
  } else if (maxTemp > 25) {
    recommendations +=
      "light summer clothing, a light jacket for evenings, and sun protection. ";
  } else if (maxTemp > 20) {
    recommendations +=
      "a mix of short and long-sleeved items, light layers for temperature changes, and a light jacket. ";
  } else if (maxTemp > 15) {
    recommendations +=
      "long-sleeved shirts, light sweaters, and a medium jacket for cooler evenings. ";
  } else {
    recommendations +=
      "warm layers, a heavier jacket, scarf, and gloves for colder periods. ";
  }

  if (hasRain) {
    recommendations +=
      "Don't forget to bring a waterproof jacket or umbrella, and waterproof shoes would be advisable. ";
  }

  recommendations +=
    "Comfortable walking shoes are essential for exploring. Don't forget your essential toiletries, electronics, and any necessary travel documents.";

  return recommendations;
}

// Helper to get activity recommendations
function getActivityRecommendations(weatherData, destination) {
  const rainyDays = weatherData.filter(
    (day) =>
      day.condition.toLowerCase().includes("rain") ||
      day.condition.toLowerCase().includes("thunder")
  );

  const sunnyDays = weatherData.filter(
    (day) =>
      day.condition.toLowerCase().includes("sunny") ||
      day.condition.toLowerCase().includes("clear")
  );

  let recommendations = `For your trip to ${destination}, `;

  if (sunnyDays.length > 0) {
    recommendations += `take advantage of the ${sunnyDays.length} sunny days for outdoor activities like sightseeing, parks, and outdoor dining. `;
  }

  if (rainyDays.length > 0) {
    recommendations += `On the ${rainyDays.length} potentially rainy days, consider indoor activities like museums, galleries, shopping centers, and restaurants. `;

    if (destination.toLowerCase().includes("paris")) {
      recommendations +=
        "The Louvre and Musée d'Orsay are perfect for rainy days. ";
    } else if (destination.toLowerCase().includes("london")) {
      recommendations +=
        "The British Museum and National Gallery offer world-class indoor experiences. ";
    } else if (destination.toLowerCase().includes("new york")) {
      recommendations +=
        "MoMA and the Metropolitan Museum of Art are excellent rainy day options. ";
    } else if (destination.toLowerCase().includes("tokyo")) {
      recommendations +=
        "Explore the TeamLab Borderless digital art museum or Tokyo National Museum. ";
    } else {
      recommendations += "Local museums and cultural centers are recommended. ";
    }
  }

  recommendations +=
    "Adjust your daily itinerary based on that day's specific forecast for the best experience.";

  return recommendations;
}

// Helper to get weather travel tips
function getWeatherTravelTips(weatherData, destination) {
  const maxTemp = getMaxTemp(weatherData);
  const minTemp = getMinTemp(weatherData);
  const hasRain = weatherData.some(
    (day) =>
      day.condition.toLowerCase().includes("rain") ||
      day.condition.toLowerCase().includes("thunder")
  );

  let tips = `For your visit to ${destination}: `;

  if (maxTemp > 30) {
    tips +=
      "Stay hydrated and avoid extended outdoor activities during peak sun hours (11am-3pm). Public transportation may feel hot, so plan accordingly. ";
  } else if (minTemp < 10) {
    tips +=
      "Layer your clothing as indoor heating can be strong compared to outdoor temperatures. Early mornings and evenings will be significantly cooler. ";
  }

  if (hasRain) {
    tips +=
      "Check daily forecasts each morning and plan indoor activities for potential rainy periods. Many attractions have covered areas or indoor sections. ";
  }

  tips +=
    "Local weather patterns can change quickly, so a weather app with hourly forecasts is recommended. ";

  // Add destination-specific advice
  if (
    destination.toLowerCase().includes("london") ||
    destination.toLowerCase().includes("seattle")
  ) {
    tips +=
      "Weather can change rapidly here, so it's wise to always have a small umbrella or rain jacket with you, even on seemingly clear days.";
  } else if (
    destination.toLowerCase().includes("dubai") ||
    destination.toLowerCase().includes("desert")
  ) {
    tips +=
      "The temperature difference between day and night can be significant in desert climates, so be prepared for cooler evenings.";
  } else if (
    destination.toLowerCase().includes("tokyo") ||
    destination.toLowerCase().includes("hong kong")
  ) {
    tips +=
      "Humidity can make temperatures feel higher than they are. Lightweight, moisture-wicking clothing is recommended.";
  } else if (
    destination.toLowerCase().includes("paris") ||
    destination.toLowerCase().includes("rome")
  ) {
    tips +=
      "Many European cities have excellent covered arcades and cafés where you can take shelter during brief rain showers while still enjoying the atmosphere.";
  }

  return tips;
}

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "Backend server is running",
    status: "online",
  });
});

// Health check endpoint
app.get("/ping", (req, res) => {
  res.json({
    success: true,
    message: "Server is running!",
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`For local access: http://localhost:${PORT}`);
  console.log(
    `For device access: Use your machine's IP address and port ${PORT}`
  );
});
