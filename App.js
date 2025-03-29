// REMOVE THIS LINE FOR NOW - we'll add it back after fixing dependencies
// import "react-native-gesture-handler";

import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Auth Context Provider
import { AuthProvider, useAuth } from "./context/AuthContext";

// Screens
import Login from "./screens/Login";
import Register from "./screens/Register";
import NamePage from "./screens/NamePage";
import Home from "./screens/Home";
import Explore from "./screens/Explore";
import Notifications from "./screens/Notifications";
import Globe from "./screens/Globe";
import Profile from "./screens/Profile";
import OnboardingScreen1 from "./screens/OnboardingScreen1";
import OnboardingScreen2 from "./screens/OnboardingScreen2";
import OnboardingScreen3 from "./screens/OnboardingScreen3";
import Forgot from "./screens/forgot";
import PlaceDetails from "./screens/PlaceDetails";
import ChangeLocation from "./screens/ChangeLocation";
import PlaceGo from "./screens/PlaceGo";
import AITravelPlanner from "./screens/AITravelPlanner";
import AIBudgetManager from "./screens/AIBudgetManager";
import AllHotels from './screens/AllHotels';

// Import navigation
import AppNavigation from "./navigation/AppNavigation";

// REMOVE THIS LINE - we'll implement navigation directly in this file
// import AppNavigation from "./navigation/AppNavigation";

const Stack = createNativeStackNavigator();

// Main app component with conditional navigation
const MainApp = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      {user ? (
        // User is signed in - use the main app navigation
        <AppNavigation />
      ) : (
        // No user is signed in - show auth screens
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="OnboardingScreen1"
              component={OnboardingScreen1}
            />
            <Stack.Screen
              name="OnboardingScreen2"
              component={OnboardingScreen2}
            />
            <Stack.Screen
              name="OnboardingScreen3"
              component={OnboardingScreen3}
            />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="Register" component={Register} />
            <Stack.Screen name="NamePage" component={NamePage} />
            <Stack.Screen name="Forgot" component={Forgot} />
            <Stack.Screen name="AllHotels" component={AllHotels} options={{ headerShown: false }} />
          </Stack.Navigator>
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
};

// Wrap the app with AuthProvider
export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

// Helper function to check user registration status
const checkUserRegistrationStatus = async (uid) => {
  try {
    // For simplicity, assume user is registered.
    return true;
  } catch (error) {
    console.error("Error checking registration status:", error);
    return false;
  }
};
