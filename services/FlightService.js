import axios from "axios";
import { BACKEND_URL } from "../config";

// Get city code (IATA) from city name
export const getCityCode = async (city) => {
  try {
    console.log(`Getting city code for: ${city}`);
    const response = await axios.get(
      `${BACKEND_URL}/api/flights/city-to-code`,
      {
        params: { city },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting city code:", error);
    throw error.response?.data || error.message;
  }
};

// Search flights between origin and destination
export const searchFlights = async (params) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/flights/search`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error searching flights:", error);
    throw error.response?.data || error.message;
  }
};

// Format flight duration for display (PT2H30M -> 2h 30m)
export const formatFlightDuration = (duration) => {
  // Extract hours and minutes from ISO 8601 duration format
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
  const matches = duration.match(regex);

  if (!matches) return duration;

  const hours = matches[1] ? parseInt(matches[1]) : 0;
  const minutes = matches[2] ? parseInt(matches[2]) : 0;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
};

// Format date for display
export const formatFlightDate = (dateString) => {
  const date = new Date(dateString);
  const options = {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  };
  return date.toLocaleString("en-US", options);
};

// Get airline name from code (mock implementation, would need a real database)
export const getAirlineName = (code) => {
  const airlines = {
    AA: "American Airlines",
    DL: "Delta Air Lines",
    UA: "United Airlines",
    LH: "Lufthansa",
    BA: "British Airways",
    AF: "Air France",
    KL: "KLM",
    EK: "Emirates",
    QR: "Qatar Airways",
    SQ: "Singapore Airlines",
  };

  return airlines[code] || code;
};
