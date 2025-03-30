const express = require("express");
const router = express.Router();
const axios = require("axios");

// Get Amadeus access token (OAuth 2.0)
const getAmadeusAccessToken = async () => {
  try {
    const response = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: process.env.AMADEUS_API_KEY,
          password: process.env.AMADEUS_API_SECRET,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting Amadeus token:", error);
    throw error;
  }
};

// Search for flights between origin and destination
router.get("/search", async (req, res) => {
  try {
    const { originCode, destinationCode, departureDate, adults, travelClass } =
      req.query;

    if (!originCode || !destinationCode || !departureDate) {
      return res.status(400).json({
        error:
          "Missing required parameters: originCode, destinationCode, and departureDate are required",
      });
    }

    const accessToken = await getAmadeusAccessToken();
    console.log("Successfully retrieved Amadeus access token");

    // Flight offers search API call
    const response = await axios.get(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          originLocationCode: originCode,
          destinationLocationCode: destinationCode,
          departureDate,
          adults: adults || 1,
          travelClass: travelClass || "ECONOMY",
          currencyCode: "USD",
          max: 10,
        },
      }
    );

    // Format flight data for frontend consumption
    const formattedFlights = response.data.data.map((flight) => {
      const itinerary = flight.itineraries[0];
      const firstSegment = itinerary.segments[0];
      const lastSegment = itinerary.segments[itinerary.segments.length - 1];

      return {
        id: flight.id,
        airline: firstSegment.carrierCode,
        price: flight.price.total,
        currency: flight.price.currency,
        departureTime: firstSegment.departure.at,
        arrivalTime: lastSegment.arrival.at,
        duration: itinerary.duration,
        stops: itinerary.segments.length - 1,
        segments: itinerary.segments.map((segment) => ({
          departureAirport: segment.departure.iataCode,
          departureTime: segment.departure.at,
          arrivalAirport: segment.arrival.iataCode,
          arrivalTime: segment.arrival.at,
          flightNumber: `${segment.carrierCode} ${segment.number}`,
          duration: segment.duration,
        })),
        bookingUrl: null, // Amadeus doesn't provide direct booking links
      };
    });

    res.json({
      flights: formattedFlights,
      origin: originCode,
      destination: destinationCode,
      departureDate,
    });
  } catch (error) {
    console.error("Error searching flights:", error.response?.data || error);
    res.status(500).json({
      error: "Failed to search flights",
      details: error.response?.data?.errors || error.message,
    });
  }
});

// Add city code lookup endpoint
router.get("/city-to-code", async (req, res) => {
  try {
    const { city } = req.query;
    
    if (!city) {
      return res.status(400).json({
        success: false,
        message: "City parameter is required"
      });
    }
    
    // Use a simple mapping for common cities
    const cityCodeMap = {
      "paris": "PAR",
      "london": "LON",
      "new york": "NYC",
      "tokyo": "TYO",
      "rome": "ROM",
      "barcelona": "BCN",
      "berlin": "BER",
      "amsterdam": "AMS",
      "madrid": "MAD",
      "dubai": "DXB",
      "singapore": "SIN",
      "hong kong": "HKG",
      "bangkok": "BKK",
      "sydney": "SYD"
    };
    
    const normalizedCity = city.toLowerCase();
    const cityCode = cityCodeMap[normalizedCity];
    
    if (cityCode) {
      return res.json({
        success: true,
        city,
        code: cityCode
      });
    } else {
      // Fallback to Amadeus API if available
      // For now return a 404 with helpful message
      return res.status(404).json({
        success: false,
        message: "City code not found. Please enter a major city.",
        suggestedCities: Object.keys(cityCodeMap)
      });
    }
  } catch (error) {
    console.error("Error in city-to-code lookup:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing city code request",
      error: error.message
    });
  }
});

module.exports = router;
