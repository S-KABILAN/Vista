# Vista Travel App Backend

This is the backend server for the Vista Travel App. It provides APIs for travel planning, AI recommendations, and more.

## Setup Instructions

1. Install dependencies:

   ```
   npm install
   ```

2. Create a `.env` file with the following variables:

   ```
   JWT_SECRET=your_jwt_secret
   GOOGLE_PLACES_API_KEY=your_google_places_api_key
   AMADEUS_API_KEY=your_amadeus_api_key
   AMADEUS_API_SECRET=your_amadeus_api_secret
   MONGODB_URI=mongodb://localhost:27017/vista-travel
   PORT=5000
   ```

3. Start the server:
   ```
   node server.js
   ```

## API Endpoints

### AI Travel Recommendations

Get AI-powered travel recommendations for a destination.

**Endpoint**: `GET /api/ai-recommendations`

**Query Parameters**:

- `destination` (required): The name of the destination (e.g., "Paris")
- `budget` (optional): The total budget for the trip (default: 1000)
- `tripDuration` (optional): The number of days for the trip (default: 5)
- `coordinates` (optional): The latitude,longitude of the destination (e.g., "48.8566,2.3522")
- `placeId` (optional): The Google Place ID of the destination
- `preferences` (optional): Comma-separated list of travel preferences (e.g., "food,history,art")
- `checkInDate` (optional): The check-in date in YYYY-MM-DD format
- `checkOutDate` (optional): The check-out date in YYYY-MM-DD format

**Response**:

```json
{
  "destination": "Paris",
  "budget": 2000,
  "aiSuggestion": "Detailed AI-generated travel plan in text format",
  "itinerary": [
    {
      "day": 1,
      "activities": "Morning: Arrive in Paris and check into accommodation, Afternoon: Explore the local area and get oriented, Evening: Enjoy dinner at a local restaurant"
    }
    // More days...
  ],
  "recommendations": [
    {
      "name": "Eiffel Tower",
      "description": "Visit the iconic Eiffel Tower",
      "category": "Attraction",
      "estimatedCost": 25,
      "rating": 4.7,
      "address": "Champ de Mars, 5 Avenue Anatole France, 75007 Paris"
    }
    // More recommendations...
  ],
  "budgetBreakdown": {
    "accommodations": 800,
    "food": 600,
    "transportation": 300,
    "activities": 300,
    "total": 2000
  },
  "destinationData": {
    "details": {
      "name": "Paris",
      "formatted_address": "Paris, France",
      "rating": 4.7
    },
    "topAttractions": [
      // Top 5 attractions
    ],
    "topRestaurants": [
      // Top 5 restaurants
    ],
    "recommendedHotels": [
      // Top 3 hotels
    ]
  }
}
```

## Testing

You can test the AI recommendations endpoint using the provided test script:

```
node testEndpoint.js
```

This will make a request to the endpoint with a sample destination and display the response.
