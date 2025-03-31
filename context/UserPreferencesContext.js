import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";

// Create the UserPreferences Context with default values
const UserPreferencesContext = createContext({
  preferences: {
    travelInterests: [],
    budgetRange: '',
    preferredDestinationTypes: [],
    preferredAccommodationTypes: [],
    preferredActivities: [],
    travelStyle: '',
    visitedCountries: [],
    isOnboardingComplete: false
  },
  loading: true,
  saveUserPreferences: () => Promise.resolve({ success: true }),
  completeOnboarding: () => Promise.resolve({ success: true }),
  resetPreferences: () => Promise.resolve({ success: true }),
});

export const useUserPreferences = () => {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error("useUserPreferences must be used within a UserPreferencesProvider");
  }
  return context;
};

export const UserPreferencesProvider = ({ children }) => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    travelInterests: [],
    budgetRange: '',
    preferredDestinationTypes: [],
    preferredAccommodationTypes: [],
    preferredActivities: [],
    travelStyle: '',
    visitedCountries: [],
    isOnboardingComplete: false
  });
  const [loading, setLoading] = useState(true);

  // Load saved preferences when user changes
  useEffect(() => {
    if (user) {
      loadUserPreferences();
    } else {
      // If no user, use default preferences
      setLoading(false);
    }
  }, [user]);

  // Load preferences from AsyncStorage
  const loadUserPreferences = async () => {
    try {
      setLoading(true);
      
      if (user?.id) {
        try {
          const savedPrefs = await AsyncStorage.getItem(`userPreferences_${user.id}`);
          if (savedPrefs) {
            const parsedPrefs = JSON.parse(savedPrefs);
            console.log("Loaded user preferences:", parsedPrefs);
            setPreferences(parsedPrefs);
          } else {
            console.log("No saved preferences found for user", user.id);
            // Make sure onboarding will be shown by setting isOnboardingComplete to false
            setPreferences({
              travelInterests: [],
              budgetRange: '',
              preferredDestinationTypes: [],
              preferredAccommodationTypes: [],
              preferredActivities: [],
              travelStyle: '',
              visitedCountries: [],
              isOnboardingComplete: false
            });
          }
        } catch (error) {
          console.error("Error loading preferences from storage:", error);
          // Ensure we have default preferences with onboarding not complete
          setPreferences({
            ...preferences,
            isOnboardingComplete: false
          });
        }
      }
    } catch (error) {
      console.error("Failed to load user preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  // Save preferences to AsyncStorage
  const saveUserPreferences = async (newPreferences) => {
    try {
      setLoading(true);
      
      // Merge with existing preferences
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      
      // Save to local storage
      if (user?.id) {
        await AsyncStorage.setItem(
          `userPreferences_${user.id}`, 
          JSON.stringify(updatedPreferences)
        );
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to save user preferences:", error);
      return { 
        success: false,
        message: error.message
      };
    } finally {
      setLoading(false);
    }
  };

  // Mark onboarding as complete
  const completeOnboarding = async () => {
    return await saveUserPreferences({ isOnboardingComplete: true });
  };

  // Reset preferences
  const resetPreferences = async () => {
    try {
      const defaultPreferences = {
        travelInterests: [],
        budgetRange: '',
        preferredDestinationTypes: [],
        preferredAccommodationTypes: [],
        preferredActivities: [],
        travelStyle: '',
        visitedCountries: [],
        isOnboardingComplete: false
      };
      
      setPreferences(defaultPreferences);
      
      // Remove from local storage
      if (user?.id) {
        await AsyncStorage.removeItem(`userPreferences_${user.id}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to reset user preferences:", error);
      return { 
        success: false,
        message: error.message
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
