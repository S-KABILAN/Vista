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

// Convert city name to IATA code
router.get("/city-to-code", async (req, res) => {
  try {
    const { cityName } = req.query;

    if (!cityName) {
      return res.status(400).json({ error: "City name is required" });
    }

    const accessToken = await getAmadeusAccessToken();

    // Search for city/airport code
    const response = await axios.get(
      "https://test.api.amadeus.com/v1/reference-data/locations",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params: {
          keyword: cityName,
          subType: "CITY,AIRPORT",
        },
      }
    );

    if (response.data.data.length === 0) {
      return res.status(404).json({ error: "No matching locations found" });
    }

    // Return the best matching location code
    const location = response.data.data[0];
    res.json({
      cityName: location.name,
      cityCode: location.iataCode,
      countryCode: location.address?.countryCode,
      locationType: location.subType,
    });
  } catch (error) {
    console.error("Error converting city to code:", error);
    res.status(500).json({
      error: "Failed to get city code",
      details: error.response?.data?.errors || error.message,
    });
  }
});

module.exports = router;
