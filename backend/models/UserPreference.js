const mongoose = require("mongoose");

const UserPreferenceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  travelInterests: {
    type: [String],
    default: [],
  },
  budgetRange: {
    type: String,
    enum: ["budget", "moderate", "luxury", "flexible"],
    default: "moderate",
  },
  preferredDestinationTypes: {
    type: [String],
    default: [],
  },
  preferredAccommodationTypes: {
    type: [String],
    default: [],
  },
  preferredActivities: {
    type: [String],
    default: [],
  },
  travelStyle: {
    type: String,
    default: "",
  },
  visitedCountries: {
    type: [String],
    default: [],
  },
  isOnboardingComplete: {
    type: Boolean,
    default: false,
  },
  // Tracking for recommendations
  recommendationPreferences: {
    lastRecommendationDate: {
      type: Date,
      default: null,
    },
    previousRecommendations: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Place",
      default: [],
    },
    interactionHistory: {
      type: Object,
      default: {},
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt field on every save
UserPreferenceSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model("UserPreference", UserPreferenceSchema);
