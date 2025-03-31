import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

// Import screens that definitely exist
import Home from "../screens/Home";
import Explore from "../screens/Explore";
import Globe from "../screens/Globe";
import Profile from "../screens/Profile";
import { default as AITravelPlannerWrapper } from "../screens/AITravelPlanner";
import PlaceDetails from "../screens/PlaceDetails";
import AttractionDetails from "../screens/AttractionDetails";
import AIBudgetManager from "../screens/AIBudgetManager";
import ChangeLocation from "../screens/ChangeLocation";
import PlaceGo from "../screens/PlaceGo";
import SavedTravelPlans from "../screens/SavedTravelPlans";
import TravelPlanDetail from "../screens/TravelPlanDetail";
import TravelPreferences from "../screens/TravelPreferences";
import SavedDestinations from "../screens/SearchDestinations";
import SearchResults from "../screens/SearchResults";
import AllHotels from "../screens/AllHotels";
import AllAttractions from "../screens/AllAttractions";
import TransportOptions from "../screens/TransportOptions";
import AllDestinations from "../screens/AllDestinations";
// Import User Preferences Onboarding
import UserPreferencesOnboarding from "../screens/UserPreferencesOnboarding";

// Import our new AI feature screens
import PersonalizedRecommendations from "../screens/PersonalizedRecommendations";
import CulturalInsights from "../screens/CulturalInsights";
import ItineraryOptimizer from "../screens/ItineraryOptimizer";
import WeatherInsights from "../screens/WeatherInsights";

// Import newly implemented screens
import TripDetails from "../screens/TripDetails";
import AllTrips from "../screens/AllTrips";
import Filters from "../screens/Filters";
import TravelTips from "../screens/TravelTips";

// Import custom bottom navigation
import BottomNavigation from "../components/BottomNavigation";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

// Container for Globe screen to handle params correctly
const GlobeScreen = ({ route, navigation }) => {
  // This allows params to be passed into the tab screen
  return <Globe route={route} navigation={navigation} />;
};

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarIcon: ({ color, size }) => (
          <Ionicons name="menu" size={size} color={color} />
        ),
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Explore" component={Explore} />
      <Tab.Screen
        name="AITravelPlanner"
        component={AITravelPlannerWrapper}
        options={{
          unmountOnBlur: false, // Keep the state when navigating away
        }}
      />
      <Tab.Screen
        name="Globe"
        component={GlobeScreen}
        options={{
          unmountOnBlur: true, // This ensures the component remounts with fresh props
        }}
      />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="PlaceDetails" component={PlaceDetails} />
        <Stack.Screen name="AttractionDetails" component={AttractionDetails} />
        <Stack.Screen name="AIBudgetManager" component={AIBudgetManager} />
        <Stack.Screen name="ChangeLocation" component={ChangeLocation} />
        <Stack.Screen name="PlaceGo" component={PlaceGo} />
        <Stack.Screen name="SavedTravelPlans" component={SavedTravelPlans} />
        <Stack.Screen name="TravelPlanDetail" component={TravelPlanDetail} />
        <Stack.Screen name="TravelPreferences" component={TravelPreferences} />
        <Stack.Screen name="SavedDestinations" component={SavedDestinations} />
        <Stack.Screen name="SearchResults" component={SearchResults} />
        <Stack.Screen
          name="AllHotels"
          component={AllHotels}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllAttractions"
          component={AllAttractions}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TransportOptions"
          component={TransportOptions}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllDestinations"
          component={AllDestinations}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="UserPreferencesOnboarding"
          component={UserPreferencesOnboarding}
          options={{ headerShown: false }}
        />

        {/* New AI feature screens */}
        <Stack.Screen
          name="PersonalizedRecommendations"
          component={PersonalizedRecommendations}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="CulturalInsights"
          component={CulturalInsights}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ItineraryOptimizer"
          component={ItineraryOptimizer}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="WeatherInsights"
          component={WeatherInsights}
          options={{ headerShown: false }}
        />

        {/* Newly implemented screens */}
        <Stack.Screen
          name="TripDetails"
          component={TripDetails}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AllTrips"
          component={AllTrips}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Filters"
          component={Filters}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="TravelTips"
          component={TravelTips}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
