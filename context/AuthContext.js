import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { BACKEND_URL } from "../config";

// Initialize WebBrowser for Expo auth sessions
WebBrowser.maybeCompleteAuthSession();

// Create the Auth Context
const AuthContext = createContext();

// Custom hook for using the Auth Context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  // State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [authError, setAuthError] = useState(null);

  // Google Auth Request Setup
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "YOUR_EXPO_CLIENT_ID",
    iosClientId: "YOUR_IOS_CLIENT_ID",
    androidClientId: "YOUR_ANDROID_CLIENT_ID",
    webClientId: "YOUR_WEB_CLIENT_ID",
  });

  // Set up authorization header for all requests when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  }, [token]);

  // Load stored token on app start
  useEffect(() => {
    loadStoredToken();
  }, []);

  // Handle Google Auth response
  useEffect(() => {
    if (response?.type === "success") {
      const { authentication } = response;
      handleGoogleAuthentication(authentication);
    }
  }, [response]);

  // Load stored token from AsyncStorage
  const loadStoredToken = async () => {
    try {
      setLoading(true);
      const storedToken = await AsyncStorage.getItem("auth_token");

      if (storedToken) {
        setToken(storedToken);
        const userLoaded = await fetchCurrentUser(storedToken);
        if (!userLoaded) {
          // Token is invalid or expired
          await AsyncStorage.removeItem("auth_token");
          setToken(null);
        }
      }
    } catch (error) {
      console.error("Failed to load auth token:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch current user data using token
  const fetchCurrentUser = async (authToken) => {
    try {
      console.log(
        "Fetching current user from:",
        `${BACKEND_URL}/api/auth/current`
      );
      const res = await axios.get(`${BACKEND_URL}/api/auth/current`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      if (res.data) {
        setUser(res.data);
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        "Failed to fetch current user:",
        error.response?.data || error.message
      );
      return false;
    }
  };

  // Register new user
  const register = async (fullName, email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      const url = `${BACKEND_URL}/api/auth/register`;
      console.log("Attempting registration at:", url);
      console.log("Request data:", { fullName, email });

      const res = await axios.post(url, {
        fullName,
        email,
        password,
      });

      // Save token and user data
      const token = res.data.token;
      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        setToken(token);
        setUser(res.data.user);
        return { success: true };
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("Registration error details:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
      });
      const errorMessage =
        error.response?.data?.message || error.message || "Registration failed";

      console.error("Registration failed:", errorMessage);
      setAuthError(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);

      console.log("Logging in user at:", `${BACKEND_URL}/api/auth/login`);

      const res = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email,
        password,
      });

      // Save token and user data
      const token = res.data.token;
      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        setToken(token);

        // Ensure user has the correct ID field
        const userData = {
          ...res.data.user,
          // Make sure we have both id and _id fields for compatibility
          id: res.data.user.id || res.data.user._id,
          _id: res.data.user._id || res.data.user.id,
        };

        console.log("User data set in context:", {
          id: userData.id,
          email: userData.email,
        });

        setUser(userData);

        // Important: Reset onboarding status in AsyncStorage to ensure the check happens
        await AsyncStorage.removeItem(`userPreferences_${userData.id}`);

        return { success: true };
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";

      console.error("Login failed:", errorMessage);
      setAuthError(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Authentication
  const handleGoogleAuthentication = async (authentication) => {
    try {
      setLoading(true);
      setAuthError(null);

      // Exchange Google token for our JWT
      const res = await axios.post(`${BACKEND_URL}/api/auth/google-token`, {
        token: authentication.accessToken,
      });

      const token = res.data.token;
      if (token) {
        await AsyncStorage.setItem("auth_token", token);
        setToken(token);
        setUser(res.data.user);
        return { success: true };
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Google authentication failed";

      console.error("Google authentication failed:", errorMessage);
      setAuthError(errorMessage);

      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Trigger Google Sign-In
  const googleSignIn = () => {
    promptAsync();
  };

  // Logout user
  const logout = async () => {
    try {
      await AsyncStorage.removeItem("auth_token");
      setToken(null);
      setUser(null);
      setAuthError(null);
      return { success: true };
    } catch (error) {
      console.error("Logout failed:", error);
      return {
        success: false,
        message: "Failed to logout",
      };
    }
  };

  // Provide auth context values
  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        isAuthenticated: !!user,
        register,
        login,
        googleSignIn,
        logout,
        refreshUser: loadStoredToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
