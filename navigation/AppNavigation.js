import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

// Import screens that definitely exist
import Home from "../screens/Home";
import Explore from "../screens/Explore";
import Globe from "../screens/Globe";
import Profile from "../screens/Profile";
import AITravelPlanner from "../screens/AITravelPlanner";
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

// Import custom bottom navigation
import BottomNavigation from "../components/BottomNavigation";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MainTabs = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomNavigation {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={Home} />
      <Tab.Screen name="Explore" component={Explore} />
      <Tab.Screen name="AITravelPlanner" component={AITravelPlanner} />
      <Tab.Screen name="Globe" component={Globe} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

const AppNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={MainTabs} />
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
        {/* Keep these commented out until they're implemented */}
        {/* <Stack.Screen name="TripDetails" component={TripDetails} /> */}
        {/* <Stack.Screen name="AllTrips" component={AllTrips} /> */}
        {/* <Stack.Screen name="Filters" component={Filters} /> */}
        {/* <Stack.Screen name="TravelTips" component={TravelTips} /> */}
        {/* <Stack.Screen name="AllDestinations" component={AllDestinations} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigation;
