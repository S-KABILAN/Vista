import axios from "axios";
import { BACKEND_URL } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper function to set auth token
const setAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem("auth_token");
    if (token) {
      // Only log a safe portion of the token for debugging
      const tokenPreview = token.length > 10 ? token.substring(0, 10) + '...' : '[hidden]';
      console.log(`Setting auth token: ${tokenPreview}`);
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      return true;
    } else {
      console.log("No auth token found in AsyncStorage");
      // Clear any existing token
      delete axios.defaults.headers.common["Authorization"];
      return false;
    }
  } catch (error) {
    console.error("Error setting auth token:", error);
    return false;
  }
};

// Get all travel plans
export const getAllTravelPlans = async () => {
  try {
    const hasToken = await setAuthToken();
    if (!hasToken) {
      throw new Error("Authentication token not found");
    }

    const endpoint = `${BACKEND_URL}/api/travel-plans`;
    console.log(`Fetching travel plans from: ${endpoint}`);
    console.log(
      `Current auth header: ${axios.defaults.headers.common[
        "Authorization"
      ]?.substring(0, 15)}...`
    );

    const response = await axios.get(endpoint);
    console.log(`Successfully fetched ${response.data.length} travel plans`);
    return response.data;
  } catch (error) {
    if (error.response) {
      // The request was made and the server responded with a status code outside the 2xx range
      console.error(
        `Error fetching travel plans: ${error.response.status} - ${error.response.statusText}`
      );
      console.error("Error data:", JSON.stringify(error.response.data));

      // Handle specific status codes
      if (error.response.status === 401) {
        console.log("Authentication failed. Token may be invalid or expired.");
        // Clear the invalid token
        await AsyncStorage.removeItem("auth_token");
        delete axios.defaults.headers.common["Authorization"];
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error("Network error - no response received:", error.request);
    } else {
      // Something else happened while setting up the request
      console.error("Error setting up request:", error.message);
    }

    throw error;
  }
};

// Get a specific travel plan
export const getTravelPlan = async (planId) => {
  try {
    await setAuthToken();
    const response = await axios.get(
      `${BACKEND_URL}/api/travel-plans/${planId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error fetching travel plan ${planId}:`, error);
    throw error;
  }
};

// Create a new travel plan
export const createTravelPlan = async (planData) => {
  try {
    await setAuthToken();
    const response = await axios.post(
      `${BACKEND_URL}/api/travel-plans`,
      planData
    );
    return response.data;
  } catch (error) {
    console.error("Error creating travel plan:", error);
    throw error;
  }
};

// Update a travel plan
export const updateTravelPlan = async (planId, planData) => {
  try {
    await setAuthToken();
    const response = await axios.put(
      `${BACKEND_URL}/api/travel-plans/${planId}`,
      planData
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating travel plan ${planId}:`, error);
    throw error;
  }
};

// Delete a travel plan
export const deleteTravelPlan = async (planId) => {
  try {
    await setAuthToken();
    const response = await axios.delete(
      `${BACKEND_URL}/api/travel-plans/${planId}`
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting travel plan ${planId}:`, error);
    throw error;
  }
};

// Toggle bookmark status
export const toggleBookmark = async (planId) => {
  try {
    await setAuthToken();
    const response = await axios.patch(
      `${BACKEND_URL}/api/travel-plans/${planId}/bookmark`
    );
    return response.data;
  } catch (error) {
    console.error(`Error toggling bookmark for plan ${planId}:`, error);
    throw error;
  }
};

// Get AI travel recommendations
export const getAIRecommendations = async (params) => {
  try {
    await setAuthToken();
    const response = await axios.get(`${BACKEND_URL}/api/ai-recommendations`, {
      params,
    });
    return response.data;
  } catch (error) {
    console.error("Error getting AI recommendations:", error);
    throw error;
  }
};

// Get bookmarked travel plans
export const getBookmarkedPlans = async () => {
  try {
    await setAuthToken();
    const response = await axios.get(
      `${BACKEND_URL}/api/travel-plans/bookmarked`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching bookmarked plans:", error);
    throw error;
  }
};
