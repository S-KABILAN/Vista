const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const passport = require("passport");
const Admin = require("../models/Admin");
const User = require("../models/User");
const TravelPlan = require("../models/TravelPlan");

// Admin authentication middleware - verifies admin JWT token
const authenticateAdmin = passport.authenticate("jwt", { session: false });

// Verify if authenticated user is an admin
const isAdmin = async (req, res, next) => {
  try {
    console.log("isAdmin middleware - user object:", JSON.stringify(req.user));

    if (!req.user) {
      console.log("No user found in request");
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Get user ID from request
    const userId = req.user._id || req.user.id;
    if (!userId) {
      console.log("No user ID found in authenticated user object");
      return res.status(401).json({
        success: false,
        message: "Invalid authentication token",
      });
    }

    // Find the admin in the database to verify
    const admin = await Admin.findById(userId);

    if (!admin) {
      console.log(`User ${userId} is not an admin`);
      return res.status(403).json({
        success: false,
        message: "Access denied: Admin privileges required",
      });
    }

    if (!admin.isActive) {
      console.log(`Admin ${admin.email} account is not active`);
      return res.status(403).json({
        success: false,
        message: "Your admin account has been deactivated",
      });
    }

    console.log(`Admin ${admin.email} authorized successfully`);
    req.admin = admin;
    next();
  } catch (error) {
    console.error("Error in admin authentication:", error);
    res.status(500).json({
      success: false,
      message: "Server error in admin authentication",
      error: error.message,
    });
  }
};

// Admin login
router.post("/login", async (req, res) => {
  try {
    console.log("Admin login attempt:", req.body.email);
    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email });
    if (!admin) {
      console.log(`Admin login failed: No admin found with email ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      console.log(`Admin login failed: Account for ${email} is deactivated`);
      return res.status(403).json({
        success: false,
        message: "Admin account is deactivated",
      });
    }

    // Verify password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      console.log(`Admin login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: "Invalid admin credentials",
      });
    }

    // Create JWT payload
    const payload = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isAdmin: true,
    };

    console.log(`Creating admin token for ${email} with payload:`, payload);

    // Sign token
    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || "vista-travel-secret-key",
      {
        expiresIn: "12h",
      }
    );

    // Update last login time
    admin.lastLogin = new Date();
    await admin.save();

    console.log(`Admin login successful: ${email}`);
    res.json({
      success: true,
      token: `Bearer ${token}`,
      admin: {
        id: admin.id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error("Error in admin login:", error);
    res.status(500).json({
      success: false,
      message: "Server error in admin login",
      error: error.message,
    });
  }
});

// Create initial admin (for setup only)
router.post("/setup", async (req, res) => {
  try {
    // Check if any admin exists
    const adminCount = await Admin.countDocuments();
    if (adminCount > 0) {
      return res.status(403).json({
        success: false,
        message: "Admin setup has already been completed",
      });
    }

    // Create first admin
    const newAdmin = new Admin({
      fullName: "Admin User",
      email: "admin@vistatravel.com",
      password: "admin123", // Will be hashed by pre-save hook
      role: "super_admin",
    });

    await newAdmin.save();

    res.json({
      success: true,
      message: "Admin setup completed successfully",
      adminEmail: newAdmin.email,
    });
  } catch (error) {
    console.error("Error in admin setup:", error);
    res.status(500).json({
      success: false,
      message: "Server error in admin setup",
      error: error.message,
    });
  }
});

// Debug endpoint to check authentication
router.get("/check-auth", authenticateAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Authentication token is valid",
    user: {
      id: req.user._id,
      email: req.user.email,
    },
  });
});

// Debug endpoint to check JWT_SECRET (DEVELOPMENT ONLY)
router.get("/check-jwt-secret", (req, res) => {
  // Only available in development
  if (process.env.NODE_ENV === "production") {
    return res.status(404).json({
      success: false,
      message: "Endpoint not available in production",
    });
  }

  const secretStatus = process.env.JWT_SECRET
    ? "Set with length: " + process.env.JWT_SECRET.length
    : "Not set, using fallback";

  res.json({
    success: true,
    message: "JWT Secret status check",
    secretStatus: secretStatus,
    fallbackUsed: !process.env.JWT_SECRET,
  });
});

// Simple test endpoint to verify the backend is running and accessible
router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Admin API is running",
    timestamp: new Date().toISOString(),
  });
});

// Debug endpoint to verify full admin auth flow
router.get("/debug", authenticateAdmin, isAdmin, (req, res) => {
  res.json({
    success: true,
    message: "Full admin authentication successful",
    admin: {
      id: req.admin._id,
      email: req.admin.email,
      role: req.admin.role,
    },
  });
});

// Get admin dashboard stats
router.get("/dashboard", authenticateAdmin, isAdmin, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const travelPlanCount = await TravelPlan.countDocuments();

    // Get new users in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const newUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get new travel plans in the last 30 days
    const newTravelPlans = await TravelPlan.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    res.json({
      success: true,
      stats: {
        totalUsers: userCount,
        totalTravelPlans: travelPlanCount,
        newUsers,
        newTravelPlans,
      },
    });
  } catch (error) {
    console.error("Error fetching admin dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching dashboard stats",
      error: error.message,
    });
  }
});

// Get all users (with pagination)
router.get("/users", authenticateAdmin, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await User.countDocuments();

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching users",
      error: error.message,
    });
  }
});

// Get all travel plans (with pagination)
router.get("/travel-plans", authenticateAdmin, isAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const travelPlans = await TravelPlan.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("userId", "fullName email");

    const total = await TravelPlan.countDocuments();

    res.json({
      success: true,
      travelPlans,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching travel plans:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching travel plans",
      error: error.message,
    });
  }
});

// Get recent activities for admin dashboard
router.get(
  "/recent-activities",
  authenticateAdmin,
  isAdmin,
  async (req, res) => {
    try {
      const limit = parseInt(req.query.limit) || 5;

      // Get recent user registrations
      const recentUsers = await User.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .select("fullName createdAt");

      // Get recent travel plans
      const recentTravelPlans = await TravelPlan.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("userId", "fullName")
        .select("destination createdAt userId");

      // Combine and format the activities
      let activities = [
        ...recentUsers.map((user) => ({
          _id: `user_${user._id}`,
          type: "user_registration",
          message: `New user registered: ${user.fullName}`,
          timestamp: user.createdAt,
          color: "#3498db",
        })),
        ...recentTravelPlans.map((plan) => ({
          _id: `plan_${plan._id}`,
          type: "travel_plan_created",
          message: `${
            plan.userId?.fullName || "A user"
          } created a new travel plan to ${plan.destination}`,
          timestamp: plan.createdAt,
          color: "#2ecc71",
        })),
      ];

      // Sort by most recent first
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      // Limit the total number of activities
      activities = activities.slice(0, limit);

      res.json({
        success: true,
        activities,
      });
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      res.status(500).json({
        success: false,
        message: "Server error fetching recent activities",
        error: error.message,
      });
    }
  }
);

// Get admin profile
router.get("/profile", authenticateAdmin, isAdmin, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user._id).select("-password");

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    res.json({
      success: true,
      admin: {
        id: admin._id,
        fullName: admin.fullName,
        email: admin.email,
        role: admin.role,
        lastLogin: admin.lastLogin,
      },
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching admin profile",
      error: error.message,
    });
  }
});

// Update user status (suspend/activate)
router.put(
  "/users/:userId/status",
  authenticateAdmin,
  isAdmin,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { isActive } = req.body;

      if (isActive === undefined) {
        return res.status(400).json({
          success: false,
          message: "isActive status is required",
        });
      }

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // Update user's active status
      user.isActive = isActive;
      await user.save();

      // Log this activity
      console.log(
        `Admin ${req.admin.email} ${
          isActive ? "activated" : "suspended"
        } user: ${user.email}`
      );

      res.json({
        success: true,
        message: `User ${isActive ? "activated" : "suspended"} successfully`,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          isActive: user.isActive,
        },
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating user status",
        error: error.message,
      });
    }
  }
);

// Feature/unfeature a travel plan
router.put(
  "/travel-plans/:planId/feature",
  authenticateAdmin,
  isAdmin,
  async (req, res) => {
    try {
      const { planId } = req.params;
      const { isBookmarked } = req.body;

      if (isBookmarked === undefined) {
        return res.status(400).json({
          success: false,
          message: "isBookmarked status is required",
        });
      }

      const travelPlan = await TravelPlan.findById(planId);

      if (!travelPlan) {
        return res.status(404).json({
          success: false,
          message: "Travel plan not found",
        });
      }

      // Update travel plan's bookmarked status
      travelPlan.isBookmarked = isBookmarked;
      await travelPlan.save();

      // Log this activity
      console.log(
        `Admin ${req.admin.email} ${
          isBookmarked ? "featured" : "unfeatured"
        } travel plan ID: ${travelPlan._id}`
      );

      res.json({
        success: true,
        message: `Travel plan ${
          isBookmarked ? "featured" : "unfeatured"
        } successfully`,
        travelPlan: {
          id: travelPlan._id,
          destination: travelPlan.destination,
          isBookmarked: travelPlan.isBookmarked,
        },
      });
    } catch (error) {
      console.error("Error updating travel plan:", error);
      res.status(500).json({
        success: false,
        message: "Server error updating travel plan",
        error: error.message,
      });
    }
  }
);

// Delete a travel plan
router.delete(
  "/travel-plans/:planId",
  authenticateAdmin,
  isAdmin,
  async (req, res) => {
    try {
      const { planId } = req.params;

      const travelPlan = await TravelPlan.findById(planId);

      if (!travelPlan) {
        return res.status(404).json({
          success: false,
          message: "Travel plan not found",
        });
      }

      // Delete the travel plan
      await travelPlan.deleteOne();

      // Log this activity
      console.log(`Admin ${req.admin.email} deleted travel plan ID: ${planId}`);

      res.json({
        success: true,
        message: "Travel plan deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting travel plan:", error);
      res.status(500).json({
        success: false,
        message: "Server error deleting travel plan",
        error: error.message,
      });
    }
  }
);

module.exports = router;
