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
    // New fields for collaboration and sharing
    collaborators: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        accessLevel: {
          type: String,
          enum: ["view", "edit"],
          default: "view",
        },
        dateAdded: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isShared: {
      type: Boolean,
      default: false,
    },
    shareLink: {
      type: String,
      unique: true,
      sparse: true,
    },
    shareExpiration: {
      type: Date,
    },
    // Track activity in the plan
    activityLog: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        action: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: Object,
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add indexes for faster queries
travelPlanSchema.index({ userId: 1 });
travelPlanSchema.index({ destination: 1 });
travelPlanSchema.index({ createdAt: -1 });
travelPlanSchema.index({ "collaborators.userId": 1 });
travelPlanSchema.index({ shareLink: 1 });

const TravelPlan = mongoose.model("TravelPlan", travelPlanSchema);

module.exports = TravelPlan;
