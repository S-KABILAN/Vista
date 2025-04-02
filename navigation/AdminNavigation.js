import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Import admin screens
import AdminLogin from "../screens/AdminLogin";
import AdminDashboard from "../screens/AdminDashboard";
import AdminUserList from "../screens/AdminUserList";
import AdminContentManager from "../screens/AdminContentManager";
import AdminTravelPlanList from "../screens/AdminTravelPlanList";
import AdminSettings from "../screens/AdminSettings";

// Create stack navigator
const Stack = createNativeStackNavigator();

const AdminNavigation = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="AdminLogin" component={AdminLogin} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
        <Stack.Screen name="AdminUserList" component={AdminUserList} />
        <Stack.Screen
          name="AdminContentManager"
          component={AdminContentManager}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen
          name="AdminTravelPlanList"
          component={AdminTravelPlanList}
        />
        <Stack.Screen name="AdminSettings" component={AdminSettings} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AdminNavigation;
