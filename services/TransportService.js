import axios from "axios";
import { BACKEND_URL } from "../config";
import * as FlightService from "./FlightService";
import * as LocationService from "./LocationService";

// Get flight options using Amadeus API
export const getFlightOptions = async (origin, destination) => {
  try {
    // Validate inputs
    if (!origin || !destination) {
      console.error("Missing origin or destination for flight search");
      return getMockFlights("Unknown Origin", "Unknown Destination");
    }

    // First, get the nearest airports to origin and destination
    const originLocation =
      origin.name || (await getLocationName(origin.latitude, origin.longitude));
    const destinationLocation =
      destination.name ||
      (await getLocationName(destination.latitude, destination.longitude));

    console.log(
      `Searching flights from ${originLocation} to ${destinationLocation}`
    );

    // Get city codes
    const [originData, destData] = await Promise.all([
      FlightService.getCityCode(originLocation),
      FlightService.getCityCode(destinationLocation),
    ]);

    if (!originData?.cityCode || !destData?.cityCode) {
      console.log(
        "Could not find airport codes for one of the locations:",
        originLocation,
        destinationLocation
      );
      return getMockFlights(originLocation, destinationLocation);
    }

    // Format dates for API
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 7); // Example: 1 week from now
    const formattedDate = departureDate.toISOString().split("T")[0]; // YYYY-MM-DD format

    console.log(
      `Searching flights with codes: ${originData.cityCode} to ${destData.cityCode} on ${formattedDate}`
    );

    // Search for flights
    const result = await FlightService.searchFlights({
      originCode: originData.cityCode,
      destinationCode: destData.cityCode,
      departureDate: formattedDate,
      adults: 1,
    });

    if (result.flights && result.flights.length > 0) {
      console.log(`Found ${result.flights.length} flights from API`);

      return result.flights.map((flight) => ({
        id: flight.id || `flight-${Math.random().toString(36).substring(2, 9)}`,
        airline: flight.airline,
        airlineName: FlightService.getAirlineName(flight.airline),
        flightNumber:
          flight.segments && flight.segments[0]
            ? flight.segments[0].flightNumber
            : `${flight.airline}123`,
        departureTime: FlightService.formatFlightDate(flight.departureTime),
        arrivalTime: FlightService.formatFlightDate(flight.arrivalTime),
        duration: FlightService.formatFlightDuration(flight.duration),
        price:
          typeof flight.price === "string"
            ? parseFloat(flight.price)
            : flight.price,
        currency: flight.currency || "USD",
        departureCity: originLocation,
        arrivalCity: destinationLocation,
        departureAirport:
          flight.segments && flight.segments[0]
            ? flight.segments[0].departureAirport
            : originData.cityCode,
        arrivalAirport:
          flight.segments && flight.segments.length > 0
            ? flight.segments[flight.segments.length - 1].arrivalAirport
            : destData.cityCode,
        stops: flight.stops || 0,
      }));
    }

    console.log("No flights found from API, using mock data");
    // If no flights found, return mock data
    return getMockFlights(originLocation, destinationLocation);
  } catch (error) {
    console.error("Error fetching flights:", error);
    return getMockFlights(
      origin.name || "Starting Location",
      destination.name || "Destination"
    );
  }
};

// Get train options
export const getTrainOptions = async (origin, destination) => {
  // Implementation would depend on available train APIs
  // This is a placeholder that returns mock data
  return [
    {
      id: "tr1",
      operator: "Rail Express",
      departureTime: "09:30",
      arrivalTime: "13:45",
      duration: "4h 15m",
      price: 75,
      departureStation: origin.name || "Central Station",
      departureCity: origin.name || "Departure City",
      arrivalStation: destination.name || "Main Terminal",
      arrivalCity: destination.name || "Arrival City",
    },
    {
      id: "tr2",
      operator: "Speed Rail",
      departureTime: "14:15",
      arrivalTime: "18:00",
      duration: "3h 45m",
      price: 95,
      departureStation: origin.name || "Union Station",
      departureCity: origin.name || "Departure City",
      arrivalStation: destination.name || "Terminal 2",
      arrivalCity: destination.name || "Arrival City",
    },
  ];
};

// Get bus options
export const getBusOptions = async (origin, destination) => {
  // Implementation would depend on available bus APIs
  // This is a placeholder that returns mock data
  return [
    {
      id: "bus1",
      operator: "Express Lines",
      departureTime: "08:00",
      arrivalTime: "15:30",
      duration: "7h 30m",
      price: 45,
      departureStation: origin.name || "Bus Terminal",
      departureCity: origin.name || "Departure City",
      arrivalStation: destination.name || "Central Bus Station",
      arrivalCity: destination.name || "Arrival City",
    },
    {
      id: "bus2",
      operator: "City Link",
      departureTime: "12:30",
      arrivalTime: "19:45",
      duration: "7h 15m",
      price: 40,
      departureStation: origin.name || "North Terminal",
      departureCity: origin.name || "Departure City",
      arrivalStation: destination.name || "South Terminal",
      arrivalCity: destination.name || "Arrival City",
    },
  ];
};

// Get driving directions
export const getDrivingRoute = async (origin, destination) => {
  try {
    // Format coordinates for the API call
    const originCoords = `${origin.latitude},${origin.longitude}`;
    const destCoords = `${destination.latitude},${destination.longitude}`;

    // Call routing API (e.g., Google Maps Directions API)
    const response = await axios.get(`${BACKEND_URL}/api/directions`, {
      params: {
        origin: originCoords,
        destination: destCoords,
        mode: "driving",
      },
    });

    // Extract useful information
    const route = response.data.routes[0];
    const distance = route.legs[0].distance.text;
    const duration = route.legs[0].duration.text;

    // Estimate cost (very rough estimate based on distance)
    const distanceInKm = parseFloat(distance.replace(" km", ""));
    const fuelCost = (distanceInKm * 0.1).toFixed(2); // Assuming $0.10 per km for fuel

    return {
      distance,
      duration,
      cost: fuelCost,
      route: route.overview_polyline.points, // Encoded polyline for map display
      originName: origin.name || "Starting Location",
      destinationName: destination.name || "Destination",
    };
  } catch (error) {
    console.error("Error fetching driving directions:", error);

    // Return rough estimates if API fails
    return {
      distance: "Unknown",
      duration: "Unknown",
      cost: "0",
      route: null,
      originName: origin.name || "Starting Location",
      destinationName: destination.name || "Destination",
    };
  }
};

// Helper function to find nearest airport to coordinates
const getNearestAirport = async (latitude, longitude) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/airports/nearest`, {
      params: { latitude, longitude },
    });

    return response.data;
  } catch (error) {
    console.error("Error finding nearest airport:", error);
    return null;
  }
};

// Helper function to get address for coordinates
const getLocationName = async (latitude, longitude) => {
  if (!latitude || !longitude) {
    console.warn("Invalid coordinates provided to getLocationName");
    return "Unknown Location";
  }

  try {
    const address = await LocationService.getAddressFromCoordinates(
      latitude,
      longitude
    );

    if (!address) {
      console.warn("No address found for coordinates:", latitude, longitude);
      return "Unknown Location";
    }

    return address?.city || address?.formattedAddress || "Unknown Location";
  } catch (error) {
    console.error("Error getting location name:", error);
    return "Unknown Location";
  }
};

// Generate mock flights for testing/fallback
const getMockFlights = (originCity, destinationCity) => {
  console.log(
    "Generating mock flights from",
    originCity,
    "to",
    destinationCity
  );

  const getRandomPrice = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  const getRandomTime = () => {
    const hours = Math.floor(Math.random() * 24)
      .toString()
      .padStart(2, "0");
    const minutes = (Math.floor(Math.random() * 4) * 15)
      .toString()
      .padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const generateFlightDuration = () => {
    const hours = 1 + Math.floor(Math.random() * 5);
    const minutes = Math.floor(Math.random() * 4) * 15;
    return `${hours}h ${minutes}m`;
  };

  const airlines = [
    { code: "AA", name: "American Airlines" },
    { code: "DL", name: "Delta Air Lines" },
    { code: "UA", name: "United Airlines" },
    { code: "LH", name: "Lufthansa" },
    { code: "BA", name: "British Airways" },
  ];

  // Sanitize city names for airport code generation
  const safeOriginCity = (originCity || "Origin").replace(/[^A-Za-z]/g, "");
  const safeDestCity = (destinationCity || "Destination").replace(
    /[^A-Za-z]/g,
    ""
  );

  const originCode = safeOriginCity.substring(0, 3).toUpperCase();
  const destCode = safeDestCity.substring(0, 3).toUpperCase();

  return Array.from({ length: 3 }, (_, i) => {
    const airline = airlines[i % airlines.length];
    const departureTime = getRandomTime();
    const duration = generateFlightDuration();

    // Generate a more realistic price based on mock flight distance
    const basePrice = getRandomPrice(150, 400);
    const price = basePrice + (i === 0 ? 50 : i === 1 ? -30 : 0);

    return {
      id: `mock-${i + 1}`,
      airline: airline.code,
      airlineName: airline.name,
      flightNumber: `${airline.code}${100 + getRandomPrice(1, 899)}`,
      departureTime: departureTime,
      arrivalTime: getRandomTime(),
      duration: duration,
      price: price,
      currency: "USD",
      departureCity: originCity || "Origin City",
      arrivalCity: destinationCity || "Destination City",
      departureAirport: originCode,
      arrivalAirport: destCode,
      stops: i === 2 ? 1 : 0, // Make one of the flights have a stop
    };
  });
};
