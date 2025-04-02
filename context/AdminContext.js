import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKEND_URL } from "../config";

// Create context
const AdminContext = createContext(null);

// Admin Provider component
export const AdminProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load admin data on startup
  useEffect(() => {
    const loadAdminData = async () => {
      try {
        console.log("Loading admin data on startup");
        // Check for stored admin token
        const storedToken = await AsyncStorage.getItem("adminToken");
        if (storedToken) {
          console.log("Found stored admin token");

          // Ensure token has the Bearer prefix
          const formattedToken = storedToken.startsWith("Bearer ")
            ? storedToken
            : `Bearer ${storedToken}`;

          // Set token in state
          setAdminToken(formattedToken);

          // Set token in axios headers
          axios.defaults.headers.common["Authorization"] = formattedToken;
          console.log("Set Authorization header with token");

          // Fetch admin profile with retries
          try {
            console.log(
              `Attempting to fetch admin profile from ${BACKEND_URL}/api/admin/profile`
            );

            const response = await axios.retryRequest(
              {
                url: "/api/admin/profile",
                method: "get",
                timeout: 8000,
              },
              2
            ); // 2 retries

            console.log("Admin profile response:", response.status);
            if (response.data && response.data.success) {
              console.log("Admin profile loaded successfully");
              setAdmin(response.data.admin);
            } else {
              // If token is invalid, clear it
              console.error(
                "Failed to load admin profile:",
                response.data?.message || "Unknown error"
              );
              await AsyncStorage.removeItem("adminToken");
              setAdminToken(null);
              delete axios.defaults.headers.common["Authorization"];
            }
          } catch (profileError) {
            console.error("Error fetching admin profile:", profileError);
            if (profileError.response) {
              console.log(
                "Profile error status:",
                profileError.response.status
              );
              console.log("Profile error data:", profileError.response.data);
            }

            // If unauthorized or other error, clear token
            await AsyncStorage.removeItem("adminToken");
            setAdminToken(null);
            delete axios.defaults.headers.common["Authorization"];
          }
        } else {
          console.log("No admin token found in storage");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading admin data:", error);
        // Clear admin data on error
        await AsyncStorage.removeItem("adminToken");
        setAdminToken(null);
        delete axios.defaults.headers.common["Authorization"];
      } finally {
        setLoading(false);
      }
    };

    loadAdminData();
  }, []);

  // Test backend connectivity
  const testBackendConnection = async () => {
    try {
      console.log(
        `Testing backend connection at ${BACKEND_URL}/api/admin/test`
      );
      const response = await axios.get(`${BACKEND_URL}/api/admin/test`, {
        timeout: 5000,
      });
      console.log("Backend test response:", response.status, response.data);
      return {
        success: true,
        message: "Connected to backend successfully",
        data: response.data,
      };
    } catch (error) {
      console.error("Backend connection test failed:", error);
      let errorMessage = "Could not connect to server";

      if (error.code === "ECONNABORTED") {
        errorMessage =
          "Connection timed out. Server may be down or unreachable.";
      } else if (error.response) {
        errorMessage = `Server responded with error: ${error.response.status}`;
      } else if (error.request) {
        errorMessage =
          "No response received from server. Check network connection.";
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  };

  // Admin login function
  const adminLogin = async (email, password) => {
    try {
      // Test backend connectivity first
      const connectionTest = await testBackendConnection();
      if (!connectionTest.success) {
        return {
          success: false,
          message: `${connectionTest.message}. Please check your network connection or server status.`,
        };
      }

      setLoading(true);
      console.log(
        `Attempting admin login for ${email} at ${BACKEND_URL}/api/admin/login`
      );

      // Clear any existing token first
      delete axios.defaults.headers.common["Authorization"];

      // Try with retries
      const response = await axios.retryRequest(
        {
          url: "/api/admin/login",
          method: "post",
          data: { email, password },
          timeout: 8000,
        },
        2
      ); // 2 retries

      console.log("Login response received:", response.status);

      if (response.data && response.data.success) {
        const { token, admin } = response.data;

        console.log("Login successful, processing token");

        // Ensure token has the Bearer prefix
        const formattedToken = token.startsWith("Bearer ")
          ? token
          : `Bearer ${token}`;

        // Save token and set auth header
        await AsyncStorage.setItem("adminToken", formattedToken);
        axios.defaults.headers.common["Authorization"] = formattedToken;
        console.log("Authorization header set");

        // Update state
        setAdminToken(formattedToken);
        setAdmin(admin);

        return { success: true };
      } else {
        console.log("Login response was not successful:", response.data);
        return {
          success: false,
          message: response.data.message || "Login failed",
        };
      }
    } catch (error) {
      console.error("Admin login error:", error);

      // Get the most appropriate error message
      let errorMessage = "Server error during login";

      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.log("Error response status:", error.response.status);
        console.log("Error response data:", error.response.data);

        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.status === 401) {
          errorMessage = "Invalid credentials";
        } else if (error.response.status === 403) {
          errorMessage = "Access denied";
        } else if (error.response.status === 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (error.request) {
        // The request was made but no response was received
        console.log("No response received from server");
        errorMessage =
          "Could not connect to server. Please check your internet connection.";
      } else {
        // Something happened in setting up the request
        console.log("Error setting up request:", error.message);
        errorMessage = `Request failed: ${error.message}`;
      }

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Test admin token validity
  const checkTokenValidity = async () => {
    try {
      if (!adminToken) {
        console.log("No admin token to check");
        return { success: false, message: "No admin token" };
      }

      console.log("Checking admin token validity");
      const response = await axios.retryRequest(
        {
          url: "/api/admin/check-auth",
          method: "get",
          timeout: 5000,
        },
        1
      ); // 1 retry

      console.log("Token check response:", response.data);
      return {
        success: true,
        message: "Token is valid",
        user: response.data.user,
      };
    } catch (error) {
      console.error("Token validity check failed:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Token validation failed",
      };
    }
  };

  // Admin logout function
  const adminLogout = async () => {
    try {
      setLoading(true);

      // Clear admin data from storage
      await AsyncStorage.removeItem("adminToken");

      // Clear auth header
      delete axios.defaults.headers.common["Authorization"];

      // Reset state
      setAdminToken(null);
      setAdmin(null);

      return { success: true };
    } catch (error) {
      console.error("Admin logout error:", error);
      return { success: false, message: "Error during logout" };
    } finally {
      setLoading(false);
    }
  };

  // Context value
  const contextValue = {
    admin,
    adminToken,
    loading,
    adminLogin,
    adminLogout,
    checkTokenValidity,
    testBackendConnection,
    isAuthenticated: !!admin,
  };

  // Provide context to children
  return (
    <AdminContext.Provider value={contextValue}>
      {children}
    </AdminContext.Provider>
  );
};

// Custom hook for using the admin context
export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin must be used within an AdminProvider");
  }
  return context;
};

export default AdminContext;
