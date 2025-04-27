import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BACKEND_URL } from "../config";

/**
 * Directly retrieves the auth token from AsyncStorage and verifies it
 * @returns {Promise<string|null>} The authentication token if valid, null otherwise
 */
export const getAndVerifyAuthToken = async () => {
  console.log("[AUTH] Getting and verifying authentication token");
  try {
    // Try AsyncStorage first
    let token = await AsyncStorage.getItem("@auth_token");

    if (!token) {
      // Try alternative storage key
      token = await AsyncStorage.getItem("auth_token");
      console.log(
        "[AUTH] Using alternative storage key:",
        token ? "Token found" : "No token found"
      );
    }

    if (!token) {
      console.log("[AUTH] No token found in storage");
      return null;
    }

    // Check if token is valid format
    if (typeof token !== "string") {
      console.error(
        "[AUTH] Invalid token format (not a string):",
        typeof token
      );
      return null;
    }

    // Some apps store tokens as JSON objects
    if (token.startsWith("{") && token.endsWith("}")) {
      try {
        const tokenObj = JSON.parse(token);
        if (tokenObj.token) {
          token = tokenObj.token;
          console.log("[AUTH] Extracted token from object");
        }
      } catch (e) {
        // Not JSON, just a token that happens to have braces
      }
    }

    // Verify token by making a request to the API
    try {
      const response = await axios.get(`${BACKEND_URL}/api/auth/current`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data) {
        console.log("[AUTH] Token verified successfully");
        return token;
      }
    } catch (error) {
      console.error("[AUTH] Token verification failed:", error.message);
      return null;
    }

    return token;
  } catch (error) {
    console.error("[AUTH] Error getting token:", error);
    return null;
  }
};

/**
 * Gets the current user from the API using the token
 * @param {string} token - The authentication token
 * @returns {Promise<object|null>} - The user object if successful, null otherwise
 */
export const getCurrentUser = async (token) => {
  if (!token) return null;

  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/current`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    return response.data;
  } catch (error) {
    console.error("[AUTH] Error getting current user:", error.message);
    return null;
  }
};

/**
 * Directly authenticates with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<{token: string, user: object}|null>} - Authentication result
 */
export const directAuthenticate = async (email, password) => {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email,
      password,
    });

    if (response.data && response.data.token) {
      return {
        token: response.data.token,
        user: response.data.user,
      };
    }
    return null;
  } catch (error) {
    console.error("[AUTH] Direct authentication failed:", error.message);
    return null;
  }
};

/**
 * Force updates the token in AsyncStorage and context
 * @param {string} token - The token to store
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
export const forceUpdateToken = async (token) => {
  try {
    if (!token) return false;

    // Store token in both possible keys to ensure compatibility
    await AsyncStorage.setItem("@auth_token", token);
    await AsyncStorage.setItem("auth_token", token);

    // Set default authorization header
    axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;

    return true;
  } catch (error) {
    console.error("[AUTH] Force update token failed:", error);
    return false;
  }
};
