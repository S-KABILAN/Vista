import axios from "axios";

// Amadeus credentials
const AMADEUS_CLIENT_ID = "ZOPxorDCXAzZsttW6n4X1wo4pxA8g6A3";
const AMADEUS_CLIENT_SECRET = "tGy0WpfRP5D0clDh";
const AMADEUS_API_URL = "https://test.api.amadeus.com";

// Store the token with expiration time
let amadeusToken = null;
let tokenExpiration = null;

// Get Amadeus API token
const getAmadeusToken = async () => {
  // Check if we have a valid token
  if (amadeusToken && tokenExpiration && new Date() < tokenExpiration) {
    return amadeusToken;
  }

  try {
    // Use URL encoded form data approach (more reliable)
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", AMADEUS_CLIENT_ID);
    params.append("client_secret", AMADEUS_CLIENT_SECRET);

    const response = await axios.post(
      `${AMADEUS_API_URL}/v1/security/oauth2/token`,
      params.toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    amadeusToken = response.data.access_token;

    // Set expiration time (token usually valid for 30 minutes)
    const expiresIn = response.data.expires_in || 1800; // Default 30 minutes
    tokenExpiration = new Date(new Date().getTime() + expiresIn * 1000);

    return amadeusToken;
  } catch (error) {
    console.error(
      "Error getting Amadeus token:",
      error.response?.data || error.message || error
    );
    throw error;
  }
};

// Get city code from city name (using Airport & City Search API)
export const getCityCode = async (cityName) => {
  if (!cityName || typeof cityName !== "string") {
    console.warn(`Invalid city name provided: ${cityName}`);
    return null;
  }

  try {
    const token = await getAmadeusToken();

    const response = await axios.get(
      `${AMADEUS_API_URL}/v1/reference-data/locations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          keyword: cityName,
          subType: "CITY",
          "page[limit]": 1,
        },
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      const cityData = response.data.data[0];
      return {
        cityCode: cityData.iataCode,
        cityName: cityData.name,
        countryCode: cityData.address.countryCode,
      };
    }

    // If no city found, try to find an airport
    const airportResponse = await axios.get(
      `${AMADEUS_API_URL}/v1/reference-data/locations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          keyword: cityName,
          subType: "AIRPORT",
          "page[limit]": 1,
        },
      }
    );

    if (
      airportResponse.data &&
      airportResponse.data.data &&
      airportResponse.data.data.length > 0
    ) {
      const airportData = airportResponse.data.data[0];
      return {
        cityCode: airportData.iataCode,
        cityName: airportData.name,
        countryCode: airportData.address.countryCode,
      };
    }

    // If the API calls worked but no results were found, return a mock code for testing
    console.warn(`No city or airport found for: ${cityName}`);
    return {
      cityCode: cityName.substring(0, 3).toUpperCase(),
      cityName: cityName,
      countryCode: "US", // Default country code
    };
  } catch (error) {
    console.error(
      "Error getting city code:",
      error.response?.data || error.message || error
    );

    // Return a mock city code for testing when the API fails
    return {
      cityCode: cityName.substring(0, 3).toUpperCase(),
      cityName: cityName,
      countryCode: "US", // Default country code
    };
  }
};

// Search flights between two locations
export const searchFlights = async ({
  originCode,
  destinationCode,
  departureDate,
  adults = 1,
}) => {
  // Validate inputs to prevent API errors
  if (!originCode || !destinationCode || !departureDate) {
    console.error("Missing required parameters for flight search");
    return { flights: [] };
  }

  try {
    const token = await getAmadeusToken();

    const response = await axios.get(
      `${AMADEUS_API_URL}/v2/shopping/flight-offers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          originLocationCode: originCode,
          destinationLocationCode: destinationCode,
          departureDate: departureDate,
          adults: adults,
          max: 10, // Limit results
          currencyCode: "USD",
        },
      }
    );

    if (response.data && response.data.data) {
      // Process flight data into a simplified format
      const flights = response.data.data.map((flight) => {
        const segments = flight.itineraries[0].segments;
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        return {
          id: flight.id,
          airline: firstSegment.carrierCode,
          price: flight.price.total,
          currency: flight.price.currency,
          departureTime: firstSegment.departure.at,
          arrivalTime: lastSegment.arrival.at,
          duration: flight.itineraries[0].duration,
          stops: segments.length - 1,
          segments: segments.map((segment) => ({
            departureAirport: segment.departure.iataCode,
            departureTime: segment.departure.at,
            arrivalAirport: segment.arrival.iataCode,
            arrivalTime: segment.arrival.at,
            flightNumber: `${segment.carrierCode} ${segment.number}`,
            duration: segment.duration,
          })),
        };
      });

      return { flights };
    }

    console.warn("No flight results from API");
    return { flights: [] };
  } catch (error) {
    console.error(
      "Error searching flights:",
      error.response?.data || error.message || error
    );
    // Return empty result set rather than throwing error
    return { flights: [] };
  }
};

// Helper function to format airline code to full name (mock implementation)
export const getAirlineName = (airlineCode) => {
  const airlines = {
    AA: "American Airlines",
    DL: "Delta Air Lines",
    UA: "United Airlines",
    BA: "British Airways",
    LH: "Lufthansa",
    AF: "Air France",
    EK: "Emirates",
    QR: "Qatar Airways",
    EY: "Etihad Airways",
    SQ: "Singapore Airlines",
    // Add more airlines as needed
  };

  return airlines[airlineCode] || airlineCode;
};

// Helper function to format flight dates
export const formatFlightDate = (dateString) => {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString; // Return as-is if invalid date

    const time = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    return time;
  } catch (error) {
    console.warn("Error formatting flight date:", error);
    return dateString;
  }
};

// Helper function to format flight duration
export const formatFlightDuration = (durationString) => {
  if (!durationString) return "N/A";

  try {
    // Handle both ISO8601 duration format (PT2H30M) and object format
    if (
      typeof durationString === "object" &&
      durationString.hours !== undefined
    ) {
      return `${durationString.hours}h ${durationString.minutes || 0}m`;
    }

    // Convert PT2H30M format to 2h 30m
    const hours = durationString.match(/(\d+)H/);
    const minutes = durationString.match(/(\d+)M/);

    let formattedDuration = "";
    if (hours) formattedDuration += `${hours[1]}h `;
    if (minutes) formattedDuration += `${minutes[1]}m`;

    // If no matches found, try to handle a simple "2:30" format
    if (!formattedDuration && durationString.includes(":")) {
      const [hrs, mins] = durationString.split(":");
      formattedDuration = `${parseInt(hrs)}h ${parseInt(mins)}m`;
    }

    return formattedDuration.trim() || durationString;
  } catch (error) {
    console.warn("Error formatting flight duration:", error);
    return durationString;
  }
};
