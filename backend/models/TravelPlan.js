const mongoose = require("mongoose");

const TravelPlanSchema = new mongoose.Schema({
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
  },
  tripDuration: {
    type: Number,
    required: true,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
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
    },
  ],
  budgetBreakdown: {
    accommodations: Number,
    food: Number,
    transportation: Number,
    activities: Number,
    total: Number,
  },
  isBookmarked: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("TravelPlan", TravelPlanSchema);
