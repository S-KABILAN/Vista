import axios from "axios";
import { BACKEND_URL } from "../config";

// Get all travel plans for the current user
export const getAllTravelPlans = async () => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/travel-plans`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get a specific travel plan by ID
export const getTravelPlanById = async (planId) => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/travel-plans/${planId}`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create a new travel plan
export const createTravelPlan = async (planData) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/travel-plans`,
      planData
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get AI recommendations for a travel plan
export const getAIRecommendations = async (params) => {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/ai-recommendations`, {
      params,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Toggle bookmark status for a travel plan
export const toggleBookmark = async (planId) => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/api/travel-plans/${planId}/toggle-bookmark`
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
