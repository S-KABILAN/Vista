import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { useUserPreferences } from "../context/UserPreferencesContext";

// Import step components
import TravelInterestsStep from "../components/onboarding/TravelInterestsStep";
import BudgetStep from "../components/onboarding/BudgetStep";
import VisitedCountriesStep from "../components/onboarding/VisitedCountriesStep";

const { width } = Dimensions.get("window");

const UserPreferencesOnboarding = () => {
  const navigation = useNavigation();
  const { preferences, saveUserPreferences, completeOnboarding } =
    useUserPreferences();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    travelInterests: preferences?.travelInterests || [],
    budgetRange: preferences?.budgetRange || "",
    preferredDestinationTypes: preferences?.preferredDestinationTypes || [],
    preferredAccommodationTypes: preferences?.preferredAccommodationTypes || [],
    preferredActivities: preferences?.preferredActivities || [],
    travelStyle: preferences?.travelStyle || "",
    visitedCountries: preferences?.visitedCountries || [],
  });
  const [savingData, setSavingData] = useState(false);

  // Update form data for a specific field
  const updateFormField = (fieldName, value) => {
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  // Define steps for the onboarding process
  const steps = [
    {
      title: "Travel Interests",
      component: (
        <TravelInterestsStep
          selectedInterests={formData.travelInterests}
          onSelectionChange={(interests) =>
            updateFormField("travelInterests", interests)
          }
        />
      ),
    },
    {
      title: "Budget Preference",
      component: (
        <BudgetStep
          selectedBudget={formData.budgetRange}
          onSelectionChange={(budget) => updateFormField("budgetRange", budget)}
        />
      ),
    },
    {
      title: "Visited Countries",
      component: (
        <VisitedCountriesStep
          selectedCountries={formData.visitedCountries}
          onSelectionChange={(countries) =>
            updateFormField("visitedCountries", countries)
          }
        />
      ),
    },
    // In a full implementation, you'd add more steps here for other preference components
  ];

  // Handle finish button click - save preferences and complete onboarding
  const handleFinish = async () => {
    try {
      setSavingData(true);
      console.log("Saving user preferences:", formData);

      // Save the user preferences
      const saveResult = await saveUserPreferences(formData);

      if (!saveResult.success) {
        console.error("Error saving preferences:", saveResult);

        // If the error was handled (saved to local storage), we can still proceed
        if (saveResult.handled) {
          console.log(
            "Preferences saved to local storage, proceeding with onboarding completion"
          );
        } else {
          Alert.alert(
            "Error",
            "Could not save your preferences. Please try again."
          );
          setSavingData(false);
          return;
        }
      }

      // Mark onboarding as complete
      const result = await completeOnboarding();

      if (result.success) {
        console.log("Onboarding completed successfully");

        // Use navigation.reset to clear navigation history and go to main app
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        console.error("Error completing onboarding:", result);
        Alert.alert(
          "Error",
          "Could not complete onboarding. Please try again."
        );
      }
    } catch (error) {
      console.error("Error during onboarding completion:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setSavingData(false);
    }
  };

  // Navigate to the next step
  const goToNextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFinish();
    }
  };

  // Navigate to the previous step
  const goToPreviousStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Skip onboarding
  const handleSkip = async () => {
    try {
      setSavingData(true);

      // Even when skipping, we should save default preferences
      const defaultPrefs = {
        travelInterests: [],
        budgetRange: "moderate",
        preferredDestinationTypes: [],
        preferredAccommodationTypes: [],
        preferredActivities: [],
        travelStyle: "",
        visitedCountries: [],
      };

      await saveUserPreferences(defaultPrefs);
      const result = await completeOnboarding();

      if (result.success) {
        navigation.reset({
          index: 0,
          routes: [{ name: "MainTabs" }],
        });
      } else {
        Alert.alert("Error", "Could not skip onboarding. Please try again.");
      }
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      Alert.alert("Error", "An unexpected error occurred. Please try again.");
    } finally {
      setSavingData(false);
    }
  };

  if (savingData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Saving your preferences...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={goToPreviousStep}
          style={styles.backButton}
          disabled={currentStep === 0}
        >
          {currentStep > 0 && (
            <Ionicons name="arrow-back" size={24} color="#333" />
          )}
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Personalize Your Experience</Text>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBar,
              { width: `${((currentStep + 1) / steps.length) * 100}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          Step {currentStep + 1} of {steps.length}
        </Text>
      </View>

      {/* Step content */}
      <ScrollView
        style={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepContainer}>
          <Text style={styles.stepTitle}>{steps[currentStep].title}</Text>
          {steps[currentStep].component}
        </View>
      </ScrollView>

      {/* Footer buttons */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={goToNextStep}>
          <Text style={styles.nextButtonText}>
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8f9fa",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#555",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: "#3498db",
    fontWeight: "500",
  },
  progressBarContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#3498db",
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    color: "#666",
    fontSize: 12,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepContainer: {
    paddingVertical: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 16,
    color: "#333",
  },
  footer: {
    padding: 16,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee",
  },
  nextButton: {
    backgroundColor: "#3498db",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 8,
  },
  nextButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    marginRight: 8,
  },
});

export default UserPreferencesOnboarding;
