const express = require("express");
const router = express.Router();
const axios = require("axios");

// Get hotels from both Google Places API and Amadeus
router.get("/", async (req, res) => {
  try {
    const { lat, lng, destination, checkInDate, checkOutDate } = req.query;

    if (!lat || !lng) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    console.log(`Received request for hotels at coordinates: ${lat}, ${lng}`);

    // Process dates
    const today = new Date();
    const defaultCheckIn = today.toISOString().split("T")[0];
    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);
    const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

    const finalCheckInDate = checkInDate || defaultCheckIn;
    const finalCheckOutDate = checkOutDate || defaultCheckOutStr;

    // Fetch hotels from Amadeus
    let amadeusHotels = [];
    try {
      // First get the token - this is the standard OAuth2 flow for Amadeus API
      const tokenResponse = await axios.post(
        "https://test.api.amadeus.com/v1/security/oauth2/token",
        "grant_type=client_credentials&client_id=ZOPxorDCXAzZsttW6n4X1wo4pxA8g6A3&client_secret=tGy0WpfRP5D0clDh",
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      console.log("Received Amadeus token");
      const token = tokenResponse.data.access_token;

      // IMPORTANT: The API endpoint was wrong. For the test environment, use:
      // https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode
      const hotelResponse = await axios.get(
        "https://test.api.amadeus.com/v1/reference-data/locations/hotels/by-geocode",
        {
          params: {
            latitude: lat,
            longitude: lng,
            radius: 50,
            radiusUnit: "KM",
            hotelSource: "ALL",
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (hotelResponse.data && hotelResponse.data.data) {
        console.log(
          `Found ${hotelResponse.data.data.length} hotels from Amadeus API`
        );

        // Process the hotels from the geocode search
        const hotelsList = hotelResponse.data.data;

        // Now fetch pricing for the first 5 hotels (to avoid too many API calls)
        // This is a separate step with Amadeus API
        const hotelsWithPricing = [];

        for (let i = 0; i < Math.min(hotelsList.length, 5); i++) {
          try {
            const hotel = hotelsList[i];
            const pricingResponse = await axios.get(
              "https://test.api.amadeus.com/v3/shopping/hotel-offers",
              {
                params: {
                  hotelIds: hotel.hotelId,
                  adults: 1,
                  checkInDate: finalCheckInDate,
                  checkOutDate: finalCheckOutDate,
                },
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (
              pricingResponse.data &&
              pricingResponse.data.data &&
              pricingResponse.data.data.length > 0
            ) {
              const hotelWithPricing = pricingResponse.data.data[0];
              hotelsWithPricing.push({
                id: hotel.hotelId,
                name: hotel.name,
                rating: hotelWithPricing.hotel?.rating || "N/A",
                address: {
                  cityName: hotel.address?.cityName || destination,
                  countryCode: hotel.address?.countryCode || "",
                  line1: hotel.address?.line1 || "",
                },
                price:
                  hotelWithPricing.offers?.[0]?.price?.total ||
                  "Price unavailable",
                currency:
                  hotelWithPricing.offers?.[0]?.price?.currency || "USD",
                description: `${hotel.name} in ${
                  hotel.address?.cityName || destination
                }`,
                amenities: hotelWithPricing.hotel?.amenities || [],
                images:
                  hotelWithPricing.hotel?.media?.map((item) => item.uri) || [],
                bookingLink: hotelWithPricing.offers?.[0]?.self || null,
                availability:
                  hotelWithPricing.offers?.[0]?.availability || "available",
              });
            }
          } catch (pricingError) {
            console.error(
              "Error fetching pricing for hotel:",
              pricingError.response?.data || pricingError.message
            );
            // Continue with next hotel
          }
        }

        amadeusHotels = hotelsWithPricing;
        console.log(
          `Retrieved ${amadeusHotels.length} hotels with pricing from Amadeus API`
        );
      } else {
        console.log("No data returned from Amadeus API");
      }
    } catch (error) {
      console.error(
        "Error fetching from Amadeus:",
        error.response?.data || error.message
      );
      // Continue with Google Hotels anyway
    }

    // Fetch hotels from Google Places API
    let googleHotels = [];
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
        {
          params: {
            location: `${lat},${lng}`,
            radius: 50000,
            type: "lodging",
            key: "AIzaSyC13TqunjIQQtwI3EE8lREDRu4B45Ndx74",
          },
        }
      );

      // Get additional details for each hotel
      const placesPromises = response.data.results.map(async (place) => {
        try {
          const detailsResponse = await axios.get(
            `https://maps.googleapis.com/maps/api/place/details/json`,
            {
              params: {
                place_id: place.place_id,
                fields:
                  "name,rating,formatted_address,price_level,photo,website,international_phone_number",
                key: "AIzaSyC13TqunjIQQtwI3EE8lREDRu4B45Ndx74",
              },
            }
          );

          return {
            ...place,
            details: detailsResponse.data.result,
          };
        } catch (error) {
          console.error(
            `Error fetching details for place ${place.place_id}:`,
            error
          );
          return place;
        }
      });

      const placesWithDetails = await Promise.all(placesPromises);

      googleHotels = placesWithDetails.map((place) => ({
        place_id: place.place_id,
        name: place.name,
        rating: place.rating,
        address: place.vicinity,
        price_level: place.price_level,
        photos: place.photos?.map((photo) => ({
          url: `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=AIzaSyC13TqunjIQQtwI3EE8lREDRu4B45Ndx74`,
        })),
        website: place.details?.website,
        phone: place.details?.international_phone_number,
      }));

      console.log(
        `Retrieved ${googleHotels.length} hotels from Google Places API`
      );
    } catch (error) {
      console.error("Error fetching from Google Places:", error);
    }

    res.json({
      destination,
      amadeusHotels,
      googleHotels,
    });
  } catch (error) {
    console.error("Error in hotels endpoint:", error);
    res.status(500).json({ error: "Failed to fetch hotels" });
  }
});

// Add a route to get hotel details
router.get("/hotel/:hotelId", async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;

    if (!hotelId) {
      return res.status(400).json({ error: "Hotel ID is required" });
    }

    // Process dates
    const today = new Date();
    const defaultCheckIn = today.toISOString().split("T")[0];
    const defaultCheckOut = new Date(today);
    defaultCheckOut.setDate(defaultCheckOut.getDate() + 3);
    const defaultCheckOutStr = defaultCheckOut.toISOString().split("T")[0];

    const finalCheckInDate = checkInDate || defaultCheckIn;
    const finalCheckOutDate = checkOutDate || defaultCheckOutStr;

    // Get token
    const tokenResponse = await axios.post(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      "grant_type=client_credentials&client_id=ZOPxorDCXAzZsttW6n4X1wo4pxA8g6A3&client_secret=tGy0WpfRP5D0clDh",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const token = tokenResponse.data.access_token;

    // Get hotel details
    const hotelResponse = await axios.get(
      "https://test.api.amadeus.com/v3/shopping/hotel-offers",
      {
        params: {
          hotelIds: hotelId,
          adults: 1,
          checkInDate: finalCheckInDate,
          checkOutDate: finalCheckOutDate,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (
      !hotelResponse.data ||
      !hotelResponse.data.data ||
      hotelResponse.data.data.length === 0
    ) {
      return res
        .status(404)
        .json({ error: "Hotel not found or no offers available" });
    }

    const hotel = hotelResponse.data.data[0];

    const hotelDetails = {
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

    res.json(hotelDetails);
  } catch (error) {
    console.error(
      `Error fetching hotel details:`,
      error.response?.data || error.message
    );
    res.status(500).json({ error: "Failed to fetch hotel details" });
  }
});

module.exports = router;
