import axios from "axios";
import { BACKEND_URL } from "../config";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Helper function to get the auth token
const getToken = async (providedToken = null) => {
  // If a token is provided, use it directly
  if (providedToken) {
    console.log(
      "Using provided token:",
      providedToken ? "Token exists" : "No token provided"
    );
    return providedToken;
  }

  try {
    const token = await AsyncStorage.getItem("@auth_token");

    // Debug the token format
    if (token) {
      console.log("Retrieved token from storage, length:", token.length);

      // Check if token is valid format (should be a string)
      if (typeof token !== "string") {
        console.error("Token is not a string:", typeof token);
        return null;
      }

      // Check if token might be an object stored as string
      if (token.startsWith("{") && token.endsWith("}")) {
        try {
          const tokenObj = JSON.parse(token);
          if (tokenObj.token) {
            console.log(
              "Token was stored as object, extracting token property"
            );
            return tokenObj.token;
          }
        } catch (e) {
          // Not JSON, just a token that happens to start/end with braces
        }
      }
    } else {
      console.log("No token found in storage");
    }

    return token;
  } catch (error) {
    console.error("Error getting token from storage:", error);
    return null;
  }
};

// Get all collaborators for a travel plan
export const getCollaborators = async (planId, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.get(
      `${BACKEND_URL}/api/collaboration/${planId}/collaborators`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching collaborators:", error);
    throw error;
  }
};

// Add a collaborator to a travel plan
export const addCollaborator = async (
  planId,
  email,
  accessLevel = "view",
  token = null
) => {
  try {
    console.log(
      `Adding collaborator to plan ${planId}, email: ${email}, access: ${accessLevel}`
    );
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const apiUrl = `${BACKEND_URL}/api/collaboration/${planId}/collaborators`;
    console.log(`Making API request to: ${apiUrl}`);

    const response = await axios.post(
      apiUrl,
      { email, accessLevel },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    console.log("Collaborator added successfully:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error adding collaborator:", error);
    console.error("Error details:", error.response?.data || "No response data");
    throw error;
  }
};

// Remove a collaborator from a travel plan
export const removeCollaborator = async (planId, userId, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.delete(
      `${BACKEND_URL}/api/collaboration/${planId}/collaborators/${userId}`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error removing collaborator:", error);
    throw error;
  }
};

// Update collaborator access level
export const updateCollaboratorAccess = async (
  planId,
  userId,
  accessLevel,
  token = null
) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.put(
      `${BACKEND_URL}/api/collaboration/${planId}/collaborators/${userId}`,
      { accessLevel },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating collaborator access:", error);
    throw error;
  }
};

// Create a shareable link for a travel plan
export const createShareLink = async (planId, expiration, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.post(
      `${BACKEND_URL}/api/collaboration/${planId}/share`,
      { expiration },
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error creating share link:", error);
    throw error;
  }
};

// Remove share link from a travel plan
export const removeShareLink = async (planId, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.delete(
      `${BACKEND_URL}/api/collaboration/${planId}/share`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error removing share link:", error);
    throw error;
  }
};

// Get travel plan by share link (no authentication required)
export const getSharedTravelPlan = async (shareLink) => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/api/collaboration/shared/${shareLink}`
    );

    return response.data;
  } catch (error) {
    console.error("Error getting shared travel plan:", error);
    throw error;
  }
};

// Get activity log for a travel plan
export const getActivityLog = async (planId, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.get(
      `${BACKEND_URL}/api/collaboration/${planId}/activity`,
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error fetching activity log:", error);
    throw error;
  }
};

// Copy a shared travel plan to the user's account
export const copySharedTravelPlan = async (shareLink, token = null) => {
  try {
    const authToken = await getToken(token);
    if (!authToken) throw new Error("Authentication required");

    const response = await axios.post(
      `${BACKEND_URL}/api/collaboration/copy/${shareLink}`,
      {},
      {
        headers: { Authorization: `Bearer ${authToken}` },
      }
    );

    return response.data;
  } catch (error) {
    console.error("Error copying shared travel plan:", error);
    throw error;
  }
};
