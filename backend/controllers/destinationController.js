// Search hotels by city code
async function fetchHotelsByCity(cityCode) {
  try {
    const accessToken = await getAmadeusAccessToken();

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-city?cityCode=${cityCode}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    if (data.errors) {
      console.error("Hotel search error:", data.errors);
      return [];
    }

    console.log(`Found ${data.data?.length || 0} hotels in ${cityCode}`);
    return data.data || [];
  } catch (error) {
    console.error(`Error fetching hotels in ${cityCode}:`, error);
    return [];
  }
}

// Search hotels by geographical coordinates
async function fetchHotelsByCoordinates(
  latitude,
  longitude,
  checkInDate,
  checkOutDate
) {
  try {
    const accessToken = await getAmadeusAccessToken();

    // Format dates if they're not already in YYYY-MM-DD format
    const today = new Date();
    const defaultCheckIn = today.toISOString().split("T")[0];
    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);
    const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

    // Use provided dates or defaults
    const checkIn = checkInDate || defaultCheckIn;
    const checkOut = checkOutDate || defaultCheckOutStr;

    console.log(
      `Searching for hotels at coordinates (${latitude}, ${longitude}) from ${checkIn} to ${checkOut}`
    );

    const response = await fetch(
      `https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          latitude: latitude,
          longitude: longitude,
          radius: 50,
          radiusUnit: "KM",
          hotelSource: "ALL",
        },
      }
    );

    const data = await response.json();
    if (data.errors) {
      console.error("Hotel search error:", data.errors);
      return [];
    }

    // Transform data into a more usable format for your frontend
    const hotels = data.data || [];
    console.log(`Found ${hotels.length} hotels at the specified coordinates`);

    return hotels.map((hotel) => ({
      id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      rating: hotel.hotel.rating,
      address: hotel.hotel.address || {},
      price: hotel.offers?.[0]?.price?.total || "Price unavailable",
      currency: hotel.offers?.[0]?.price?.currency || "USD",
      description: hotel.hotel.description?.text || `${hotel.hotel.name}`,
      amenities: hotel.hotel.amenities || [],
      images: hotel.hotel.media?.map((item) => item.uri) || [],
      bookingLink: hotel.offers?.[0]?.self || null,
    }));
  } catch (error) {
    console.error("Error fetching hotels by coordinates:", error);
    return [];
  }
}

// Get detailed information for a specific hotel
async function getHotelDetails(hotelId, checkInDate, checkOutDate) {
  try {
    const accessToken = await getAmadeusAccessToken();

    // Format dates if needed
    const today = new Date();
    const defaultCheckIn = today.toISOString().split("T")[0];
    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);
    const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

    // Use provided dates or defaults
    const checkIn = checkInDate || defaultCheckIn;
    const checkOut = checkOutDate || defaultCheckOutStr;

    const response = await fetch(
      `https://test.api.amadeus.com/v3/shopping/hotel-offers?hotelIds=${hotelId}&adults=1&checkInDate=${checkIn}&checkOutDate=${checkOut}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    const data = await response.json();
    if (data.errors) {
      console.error(
        `Error fetching details for hotel ${hotelId}:`,
        data.errors
      );
      return null;
    }

    if (!data.data || data.data.length === 0) {
      console.log(`No offers found for hotel ${hotelId}`);
      return null;
    }

    const hotel = data.data[0];
    console.log(
      `Found ${hotel.offers?.length || 0} offers for hotel ${hotelId}`
    );

    return {
      id: hotel.hotel.hotelId,
      name: hotel.hotel.name,
      rating: hotel.hotel.rating,
      address: hotel.hotel.address,
      offers:
        hotel.offers?.map((offer) => ({
          id: offer.id,
          roomType: offer.room?.typeEstimated?.category || "Standard Room",
          boardType: offer.boardType || "ROOM_ONLY",
          price: offer.price?.total || "Price unavailable",
          currency: offer.price?.currency || "USD",
          cancellationPolicy:
            offer.policies?.cancellations?.[0]?.description ||
            "No information available",
          bedType: offer.room?.typeEstimated?.bedType || "Standard",
          bookingLink: offer.self || null,
        })) || [],
      amenities: hotel.hotel.amenities || [],
      images: hotel.hotel.media?.map((item) => item.uri) || [],
      description: hotel.hotel.description?.text || `${hotel.hotel.name}`,
    };
  } catch (error) {
    console.error(`Error fetching details for hotel ${hotelId}:`, error);
    return null;
  }
}

const express = require("express");
const router = express.Router();

// Route to search hotels by coordinates
router.get("/", async (req, res) => {
  try {
    const { lat, lng, destination, checkInDate, checkOutDate } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    console.log(`Received request for hotels at coordinates: ${lat}, ${lng}`);

    // Fetch hotels from Amadeus using coordinates
    const amadeusHotels = await fetchHotelsByCoordinates(
      lat,
      lng,
      checkInDate,
      checkOutDate
    );

    // You can keep your Google Places API integration here if you want
    // [Your existing Google Places API code]

    // Map the Amadeus API response to your frontend's expected format
    const hotelsWithPricing = amadeusHotels.map(hotel => ({
      id: hotel.id,
      name: hotel.name,
      rating: hotel.rating || "N/A",
      address: {
        cityName: hotel.address?.cityName || destination,
        countryCode: hotel.address?.countryCode || "",
      },
      price: hotel.price || "Price unavailable",
      currency: hotel.currency || "USD",
      description: `${hotel.name} in ${hotel.address?.cityName || destination}`,
      images: hotel.images || [],
      bookingLink: hotel.bookingLink,
    }));

    res.json({
      destination,
      amadeusHotels: hotelsWithPricing,
      // googleHotels if you're keeping that functionality
    });
  } catch (error) {
    console.error("Error in hotels endpoint:", error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// Route to search hotels by city code
router.get("/city/:cityCode", async (req, res) => {
  try {
    const { cityCode } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    if (!cityCode) {
      return res.status(400).json({ error: "City code is required" });
    }

    // Get list of hotels in the city
    const cityHotels = await fetchHotelsByCity(cityCode);

    // Step 1: Find hotels by location
    const hotelsList = cityHotels;

    // Step 2: Get pricing for each hotel
    const hotelsWithPricing = [];
    for (let i = 0; i < Math.min(hotelsList.length, 5); i++) {
      try {
        const hotel = hotelsList[i];
        const pricingResponse = await fetch(
          `https://test.api.amadeus.com/v3/shopping/hotel-offers`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${accessToken}` },
            params: {
              hotelIds: hotel.hotelId,
              adults: 1,
              checkInDate: checkInDate,
              checkOutDate: checkOutDate
            },
          }
        );
        
        const pricingData = await pricingResponse.json();
        if (pricingData.errors) {
          console.error("Error fetching pricing for hotel:", pricingData.errors);
        } else if (pricingData.data?.length > 0) {
          // Process hotel with pricing info
          hotelsWithPricing.push({
            id: hotel.hotelId,
            name: hotel.name,
            rating: hotel.rating,
            address: hotel.address,
            price: pricingData.data[0].offers[0].price.total,
            currency: pricingData.data[0].offers[0].price.currency,
            cancellationPolicy: pricingData.data[0].offers[0].policies.cancellations[0].description,
            bedType: pricingData.data[0].offers[0].room.typeEstimated.bedType,
            bookingLink: pricingData.data[0].offers[0].self,
          });
        }
      } catch (pricingError) {
        console.error("Error fetching pricing for hotel:", pricingError.response?.data || pricingError.message);
      }
    }

    res.json({
      cityCode,
      hotels: hotelsWithPricing,
    });
  } catch (error) {
    console.error(`Error fetching hotels for city:`, error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// Route to get detailed information for a specific hotel
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    if (!hotelId) {
      return res.status(400).json({ error: "Hotel ID is required" });
    }

    const hotelDetails = await getHotelDetails(
      hotelId,
      checkInDate,
      checkOutDate
    );

    if (!hotelDetails) {
      return res
        .status(404)
        .json({ error: "Hotel not found or no offers available" });
    }

    res.json(hotelDetails);
  } catch (error) {
    console.error(`Error fetching hotel details:`, error);
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});

module.exports = router;

  } catch (error) {
    console.error(`Error fetching hotel details:`, error);
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});

module.exports = router;
