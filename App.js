// REMOVE THIS LINE FOR NOW - we'll add it back after fixing dependencies
// import "react-native-gesture-handler";

// Import global axios configuration
import "./config/axios-config";

import React, { useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";

// Auth Context Provider
import { AuthProvider, useAuth } from "./context/AuthContext";
// User Preferences Provider
import {
  UserPreferencesProvider,
  useUserPreferences,
} from "./context/UserPreferencesContext";
// Admin Context Provider
import { AdminProvider, useAdmin } from "./context/AdminContext";
// Notification Context Provider
import { NotificationProvider } from "./context/NotificationContext";

// Screens
import Login from "./screens/Login";
import Register from "./screens/Register";
import NamePage from "./screens/NamePage";
import Home from "./screens/Home";
import Explore from "./screens/Explore";
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
import AllHotels from "./screens/AllHotels";
// User Preferences Onboarding
import UserPreferencesOnboarding from "./screens/UserPreferencesOnboarding";

// Admin Screens
import AdminLogin from "./screens/AdminLogin";
import AdminNavigation from "./navigation/AdminNavigation";

// Import navigation
import AppNavigation from "./navigation/AppNavigation";

// REMOVE THIS LINE - we'll implement navigation directly in this file
// import AppNavigation from "./navigation/AppNavigation";

const Stack = createNativeStackNavigator();

// Simple Error Boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
            Something went wrong
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: "#3498db",
              padding: 12,
              borderRadius: 8,
            }}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={{ color: "white", fontWeight: "bold" }}>
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

// Check for admin login
const AdminCheckWrapper = () => {
  const { isAuthenticated: isAdminAuthenticated, loading: adminLoading } =
    useAdmin();

  if (adminLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10 }}>Loading admin...</Text>
      </View>
    );
  }

  // If admin is authenticated, show admin navigation
  if (isAdminAuthenticated) {
    return <AdminNavigation />;
  }

  // Otherwise, proceed with regular user login flow
  return <MainApp />;
};

// Main app component with conditional navigation
const MainApp = () => {
  const { user, loading } = useAuth();
  const { preferences, loading: preferencesLoading } = useUserPreferences();

  console.log("MainApp rendering with:", {
    userExists: !!user,
    prefsExists: !!preferences,
    isOnboardingComplete: preferences?.isOnboardingComplete,
    authLoading: loading,
    prefsLoading: preferencesLoading,
  });

  // Show loading state
  if (loading || preferencesLoading) {
    return (
      <SafeAreaProvider>
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={{ marginTop: 10 }}>Loading...</Text>
        </View>
      </SafeAreaProvider>
    );
  }

  // Check user and preferences state
  if (user) {
    // IMPORTANT: Check explicitly for isOnboardingComplete === true
    if (!preferences || preferences.isOnboardingComplete !== true) {
      console.log(
        "User logged in but onboarding not complete, showing onboarding"
      );
      return (
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen
              name="UserPreferencesOnboarding"
              component={UserPreferencesOnboarding}
            />
          </Stack.Navigator>
        </NavigationContainer>
      );
    } else {
      console.log("User logged in and onboarding complete, showing main app");
      // User is signed in and completed onboarding
      return (
        <SafeAreaProvider>
          <AppNavigation />
        </SafeAreaProvider>
      );
    }
  } else {
    // No user signed in - show auth screens
    return (
      <SafeAreaProvider>
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
            <Stack.Screen name="AdminLogin" component={AdminLogin} />
            <Stack.Screen
              name="AllHotels"
              component={AllHotels}
              options={{ headerShown: false }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }
};

// Wrap the app with providers
export default function App() {
  return (
    <ErrorBoundary>
      <AdminProvider>
        <AuthProvider>
          <UserPreferencesProvider>
            <NotificationProvider>
              <AdminCheckWrapper />
            </NotificationProvider>
          </UserPreferencesProvider>
        </AuthProvider>
      </AdminProvider>
    </ErrorBoundary>
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
