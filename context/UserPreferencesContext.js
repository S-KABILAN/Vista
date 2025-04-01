import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import axios from "axios";
import { API_BASE_URL } from "../config/apiConfig";

// Create the UserPreferences Context with default values
const UserPreferencesContext = createContext({
  preferences: {
    travelInterests: [],
    budgetRange: "",
    preferredDestinationTypes: [],
    preferredAccommodationTypes: [],
    preferredActivities: [],
    travelStyle: "",
    visitedCountries: [],
    isOnboardingComplete: false,
  },
  loading: true,
  saveUserPreferences: () => Promise.resolve({ success: true }),
  completeOnboarding: () => Promise.resolve({ success: true }),
  resetPreferences: () => Promise.resolve({ success: true }),
});

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error(
      "useUserPreferences must be used within a UserPreferencesProvider"
    );
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const { user, authToken } = useAuth();
  const [preferences, setPreferences] = useState({
    travelInterests: [],
    budgetRange: "",
    preferredDestinationTypes: [],
    preferredAccommodationTypes: [],
    preferredActivities: [],
    travelStyle: "",
    visitedCountries: [],
    isOnboardingComplete: false,
  });
  const [loading, setLoading] = useState(true);

  // Load saved preferences when user changes
  useEffect(() => {
    console.log("UserPreferencesContext: User or auth token changed", {
      userId: user?.id,
      hasToken: !!authToken,
      tokenLength: authToken?.length,
    });

    if (user && authToken) {
      loadUserPreferences();
    } else {
      // If no user, use default preferences
      setLoading(false);
    }
  }, [user, authToken]);

  // Load preferences from API and fall back to AsyncStorage
  const loadUserPreferences = async () => {
    try {
      setLoading(true);

      if (user?.id && authToken) {
        try {
          // Ensure we're using the correct ID field
          const userId = user._id || user.id;
          console.log("Loading preferences from API with token:", {
            userId,
            tokenLength: authToken.length,
          });

          // First try to load from the API
          const response = await axios.get(`${API_BASE_URL}/api/preferences`, {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          });

          if (response.data) {
            console.log("Loaded user preferences from API:", response.data);
            setPreferences(response.data);

            // Also update local storage
            await AsyncStorage.setItem(
              `userPreferences_${userId}`,
              JSON.stringify(response.data)
            );

            setLoading(false);
            return;
          }
        } catch (apiError) {
          console.error("Error loading preferences from API:", {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message,
            tokenLength: authToken?.length,
          });

          // Fall back to AsyncStorage if API fails
          try {
            const savedPrefs = await AsyncStorage.getItem(
              `userPreferences_${user._id || user.id}`
            );
            if (savedPrefs) {
              const parsedPrefs = JSON.parse(savedPrefs);
              console.log("Loaded user preferences from storage:", parsedPrefs);
              setPreferences(parsedPrefs);
            } else {
              console.log(
                "No saved preferences found for user",
                user._id || user.id
              );
              // Make sure onboarding will be shown by setting isOnboardingComplete to false
              setPreferences({
                travelInterests: [],
                budgetRange: "",
                preferredDestinationTypes: [],
                preferredAccommodationTypes: [],
                preferredActivities: [],
                travelStyle: "",
                visitedCountries: [],
                isOnboardingComplete: false,
              });
            }
          } catch (storageError) {
            console.error(
              "Error loading preferences from storage:",
              storageError
            );
            // Ensure we have default preferences with onboarding not complete
            setPreferences({
              ...preferences,
              isOnboardingComplete: false,
            });
          }
        }
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to API and AsyncStorage
  const saveUserPreferences = async (newPreferences) => {
    try {
      setLoading(true);

      // Merge with existing preferences
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);

      if (user?.id && authToken) {
        try {
          // Ensure we're using the correct ID field
          const userId = user._id || user.id;
          console.log("Attempting to save preferences to API:", {
            url: `${API_BASE_URL}/api/preferences`,
            userId,
            preferences: updatedPreferences,
          });

          // Try to save to API first
          const response = await axios.post(
            `${API_BASE_URL}/api/preferences`,
            updatedPreferences,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("API Response:", response.data);

          // Also save to local storage as backup
          await AsyncStorage.setItem(
            `userPreferences_${userId}`,
            JSON.stringify(updatedPreferences)
          );

          return { success: true, data: response.data };
        } catch (apiError) {
          console.error("Error saving preferences to API:", {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message,
          });

          // Save to local storage as backup even if API call fails
          await AsyncStorage.setItem(
            `userPreferences_${user._id || user.id}`,
            JSON.stringify(updatedPreferences)
          );

          // Return error but mark as handled
          return {
            success: false,
            handled: true,
            message: `API Error: ${
              apiError.response?.data?.message || apiError.message
            }`,
          };
        }
      } else {
        console.warn("Cannot save to API: Missing user ID or auth token", {
          userId: user?._id || user?.id,
          hasToken: !!authToken,
        });

        // If there's a user ID but no token, save to local storage only
        if (user?._id || user?.id) {
          await AsyncStorage.setItem(
            `userPreferences_${user._id || user.id}`,
            JSON.stringify(updatedPreferences)
          );
        }

        return {
          success: false,
          handled: true,
          message: "Missing authentication. Saved to local storage only.",
        };
      }
    } catch (error) {
      console.error("Failed to save user preferences:", error);
      return {
        success: false,
        handled: false,
        message: error.message,
      };
    } finally {
      setLoading(false);
    }
  };

  // Mark onboarding as complete
  const completeOnboarding = async () => {
    try {
      const updatedPreferences = { ...preferences, isOnboardingComplete: true };
      setPreferences(updatedPreferences);

      if (user?.id && authToken) {
        try {
          // Ensure we're using the correct ID field
          const userId = user._id || user.id;
          console.log("Attempting to complete onboarding:", {
            url: `${API_BASE_URL}/api/preferences/complete-onboarding`,
            userId,
          });

          // First make sure preferences are saved
          const saveResult = await saveUserPreferences(updatedPreferences);
          console.log("Save preferences result:", saveResult);

          // Then mark onboarding as complete in API
          const response = await axios.post(
            `${API_BASE_URL}/api/preferences/complete-onboarding`,
            {},
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
              },
            }
          );

          console.log("Complete onboarding API Response:", response.data);

          // Also update local storage
          await AsyncStorage.setItem(
            `userPreferences_${userId}`,
            JSON.stringify(updatedPreferences)
          );

          return { success: true, data: response.data };
        } catch (apiError) {
          console.error("Error marking onboarding complete in API:", {
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            message: apiError.message,
          });

          // Still update local storage
          await AsyncStorage.setItem(
            `userPreferences_${user._id || user.id}`,
            JSON.stringify(updatedPreferences)
          );

          return {
            success: false,
            handled: true,
            message: `API Error: ${
              apiError.response?.data?.message || apiError.message
            }`,
          };
        }
      } else {
        console.warn(
          "Cannot complete onboarding in API: Missing user ID or auth token",
          {
            userId: user?._id || user?.id,
            hasToken: !!authToken,
          }
        );

        return {
          success: false,
          handled: true,
          message: "Missing authentication. Saved to local storage only.",
        };
      }
    } catch (error) {
      console.error("Failed to complete onboarding:", error);
      return {
        success: false,
        handled: false,
        message: error.message,
      };
    }
  };

  // Reset preferences
  const resetPreferences = async () => {
    try {
      const defaultPreferences = {
        travelInterests: [],
        budgetRange: "",
        preferredDestinationTypes: [],
        preferredAccommodationTypes: [],
        preferredActivities: [],
        travelStyle: "",
        visitedCountries: [],
        isOnboardingComplete: false,
      };

      setPreferences(defaultPreferences);

      if (user?.id && authToken) {
        try {
          // Try to delete from API first
          const response = await axios.delete(
            `${API_BASE_URL}/api/preferences`,
            {
              headers: {
                Authorization: `Bearer ${authToken}`,
              },
            }
          );

          console.log("Reset preferences in API:", response.data);
        } catch (apiError) {
          console.error("Error resetting preferences in API:", apiError);
        }

        // Remove from local storage
        await AsyncStorage.removeItem(`userPreferences_${user._id || user.id}`);
      }

      return { success: true };
    } catch (error) {
      console.error("Failed to reset user preferences:", error);
      return {
        success: false,
        message: error.message,
      };
    }
  };

  return (
    <UserPreferencesContext.Provider
      value={{
        preferences,
        loading,
        saveUserPreferences,
        completeOnboarding,
        resetPreferences,
      }}
    >
      {children}
    </UserPreferencesContext.Provider>
  );
};
