const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ExpenseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  travelPlanId: {
    type: Schema.Types.ObjectId,
    ref: "TravelPlan",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "accommodation",
      "transportation",
      "food",
      "activities",
      "shopping",
      "other",
    ],
  },
  description: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  location: {
    type: String,
  },
  currency: {
    type: String,
    default: "USD",
  },
  paymentMethod: {
    type: String,
    enum: ["cash", "credit", "debit", "mobile", "other"],
    default: "cash",
  },
  isRecurring: {
    type: Boolean,
    default: false,
  },
  receipt: {
    type: String, // URL to receipt image
  },
});

module.exports = mongoose.model("Expense", ExpenseSchema);
