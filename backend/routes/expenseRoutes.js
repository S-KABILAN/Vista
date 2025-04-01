const express = require("express");
const router = express.Router();
const passport = require("passport");
const mongoose = require("mongoose");
const Expense = require("../models/Expense");
const TravelPlan = require("../models/TravelPlan");

// Middleware for authentication
const authenticate = passport.authenticate("jwt", { session: false });

// Get all expenses for a user
router.get("/", authenticate, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user._id });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch expenses", error: error.message });
  }
});

// Get expenses for a specific travel plan
router.get("/plan/:planId", authenticate, async (req, res) => {
  try {
    const { planId } = req.params;

    // Ensure planId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(planId)) {
      return res.status(400).json({ message: "Invalid travel plan ID" });
    }

    // Verify the travel plan belongs to the user
    const travelPlan = await TravelPlan.findOne({
      _id: planId,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    const expenses = await Expense.find({ travelPlanId: planId });
    res.json(expenses);
  } catch (error) {
    console.error("Error fetching travel plan expenses:", error);
    res
      .status(500)
      .json({ message: "Failed to fetch expenses", error: error.message });
  }
});

// Create a new expense
router.post("/", authenticate, async (req, res) => {
  try {
    const {
      travelPlanId,
      amount,
      category,
      description,
      timestamp,
      location,
      currency,
      paymentMethod,
    } = req.body;

    // Validate required fields
    if (!travelPlanId || !amount || !category || !description) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Ensure travelPlanId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(travelPlanId)) {
      return res.status(400).json({ message: "Invalid travel plan ID" });
    }

    // Verify the travel plan belongs to the user
    const travelPlan = await TravelPlan.findOne({
      _id: travelPlanId,
      userId: req.user._id,
    });

    if (!travelPlan) {
      return res.status(404).json({ message: "Travel plan not found" });
    }

    // Create new expense
    const newExpense = new Expense({
      userId: req.user._id,
      travelPlanId,
      amount: parseFloat(amount),
      category,
      description,
      timestamp: timestamp || new Date(),
      location,
      currency,
      paymentMethod,
    });

    await newExpense.save();
    res.status(201).json(newExpense);
  } catch (error) {
    console.error("Error creating expense:", error);
    res
      .status(500)
      .json({ message: "Failed to create expense", error: error.message });
  }
});

// Update an expense
router.put("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      amount,
      category,
      description,
      timestamp,
      location,
      currency,
      paymentMethod,
    } = req.body;

    // Ensure ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    // Find the expense
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Verify the expense belongs to the user
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this expense" });
    }

    // Update expense fields
    if (amount) expense.amount = parseFloat(amount);
    if (category) expense.category = category;
    if (description) expense.description = description;
    if (timestamp) expense.timestamp = timestamp;
    if (location) expense.location = location;
    if (currency) expense.currency = currency;
    if (paymentMethod) expense.paymentMethod = paymentMethod;

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error("Error updating expense:", error);
    res
      .status(500)
      .json({ message: "Failed to update expense", error: error.message });
  }
});

// Delete an expense
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Ensure ID is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid expense ID" });
    }

    // Find the expense
    const expense = await Expense.findById(id);

    if (!expense) {
      return res.status(404).json({ message: "Expense not found" });
    }

    // Verify the expense belongs to the user
    if (expense.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this expense" });
    }

    await Expense.findByIdAndDelete(id);
    res.json({ message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res
      .status(500)
      .json({ message: "Failed to delete expense", error: error.message });
  }
});

// Get expense statistics
router.get("/statistics", authenticate, async (req, res) => {
  try {
    // Get all expenses for the user
    const expenses = await Expense.find({ userId: req.user._id });

    // Calculate total spent
    const totalSpent = expenses.reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    // Calculate category breakdown
    const categoryBreakdown = expenses.reduce((acc, expense) => {
      acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
      return acc;
    }, {});

    // Convert category totals to percentages
    const categoryPercentages = Object.entries(categoryBreakdown).map(
      ([category, amount]) => ({
        category,
        amount,
        percentage: ((amount / totalSpent) * 100).toFixed(2),
      })
    );

    // Get expenses by month
    const expensesByMonth = expenses.reduce((acc, expense) => {
      const month = new Date(expense.timestamp).getMonth();
      acc[month] = (acc[month] || 0) + expense.amount;
      return acc;
    }, {});

    res.json({
      totalSpent,
      categoryBreakdown,
      categoryPercentages,
      expensesByMonth,
    });
  } catch (error) {
    console.error("Error fetching expense statistics:", error);
    res
      .status(500)
      .json({
        message: "Failed to fetch expense statistics",
        error: error.message,
      });
  }
});

module.exports = router;
