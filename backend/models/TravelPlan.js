const mongoose = require("mongoose");

const TravelPlanSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
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
  itinerary: [
    {
      day: Number,
      activities: String,
    },
  ],
  recommendations: [
    {
      name: String,
      category: String,
      description: String,
      estimatedCost: Number,
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

TravelPlanSchema.index({ createdAt: -1 });
TravelPlanSchema.index({ isBookmarked: 1 });
module.exports = mongoose.model("TravelPlan", TravelPlanSchema);
