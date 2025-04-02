const mongoose = require("mongoose");

const travelPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    budget: {
      type: Number,
      required: true,
      default: 1000,
    },
    tripDuration: {
      type: Number,
      required: true,
      default: 5,
    },
    itinerary: [
      {
        day: Number,
        activities: String,
      },
    ],
    recommendations: [
      {
        name: String,
        description: String,
        category: String,
        estimatedCost: Number,
        rating: Number,
        address: String,
        price_level: Number,
      },
    ],
    budgetBreakdown: {
      accommodations: Number,
      food: Number,
      transportation: Number,
      activities: Number,
      total: Number,
    },
    aiSuggestion: String,
    destinationData: {
      details: {
        name: String,
        formatted_address: String,
        rating: Number,
        geometry: {
          location: {
            lat: Number,
            lng: Number,
          },
        },
      },
      topAttractions: [
        {
          name: String,
          rating: Number,
          types: [String],
        },
      ],
      topRestaurants: [
        {
          name: String,
          rating: Number,
          price_level: Number,
          types: [String],
        },
      ],
      recommendedHotels: [
        {
          name: String,
          rating: Number,
          types: [String],
        },
      ],
      amadeusHotels: [
        {
          name: String,
          rating: Number,
          price: {
            total: Number,
          },
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
travelPlanSchema.index({ userId: 1 });
travelPlanSchema.index({ destination: 1 });
travelPlanSchema.index({ createdAt: -1 });

const TravelPlan = mongoose.model("TravelPlan", travelPlanSchema);

module.exports = TravelPlan;
