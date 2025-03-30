// Get flight options using Amadeus API
export const getFlightOptions = async (origin, destination) => {
  try {
    // First, get the nearest airports to origin and destination
    const originAirport = await getNearestAirport(
      origin.latitude,
      origin.longitude
    );
    const destAirport = await getNearestAirport(
      destination.latitude,
      destination.longitude
    );

    if (!originAirport || !destAirport) {
      throw new Error("Could not find airports near your locations");
    }

    // Format dates
    const departureDate = new Date();
    departureDate.setDate(departureDate.getDate() + 7); // Example: 1 week from now
    const formattedDate = departureDate.toISOString().split("T")[0]; // YYYY-MM-DD

    // Call Amadeus API for flight offers
    const response = await axios.get(`${BACKEND_URL}/api/flights/search`, {
      params: {
        originCode: originAirport.iataCode,
        destinationCode: destAirport.iataCode,
        departureDate: formattedDate,
        adults: 1,
        max: 10,
      },
    });

    return response.data.map((flight) => ({
      id: flight.id,
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      duration: flight.duration,
      price: flight.price,
      currency: flight.currency,
      departureCity: origin.name || originAirport.city,
      arrivalCity: destination.name || destAirport.city,
      departureAirport: originAirport.iataCode,
      arrivalAirport: destAirport.iataCode,
    }));
  } catch (error) {
    console.error("Error fetching flights:", error);
    return [];
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
