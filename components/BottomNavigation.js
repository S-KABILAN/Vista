import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, FontAwesome5, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

const BottomNavigation = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomTabHeight = 60 + insets.bottom;

  // Define central AI button position
  const centerButtonPosition = width / 2 - 30;

  return (
    <View
      style={[
        styles.container,
        { height: bottomTabHeight, paddingBottom: insets.bottom },
      ]}
    >
      <View style={styles.background}>
        <LinearGradient
          colors={["rgba(255,255,255,0.9)", "rgba(255,255,255,1)"]}
          style={styles.gradient}
        />
      </View>

      {/* Center AI Button */}
      <View
        style={[styles.centerButtonContainer, { left: centerButtonPosition }]}
      >
        <TouchableOpacity
          style={styles.centerButton}
          onPress={() => navigation.navigate("AITravelPlanner")}
        >
          <LinearGradient
            colors={["#3498db", "#2980b9"]}
            style={styles.centerButtonGradient}
          >
            <AntDesign name="rocket1" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Tab Items */}
      <View style={styles.tabsContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          // Skip rendering the AI Travel Planner tab in the row (we use the center button)
          if (route.name === "AITravelPlanner") {
            return null;
          }

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              try {
                navigation.navigate(route.name);
              } catch (error) {
                console.warn(`Failed to navigate to ${route.name}:`, error);
                // Fallback to Home if navigation fails
                navigation.navigate('Home');
              }
            }
          };

          // Configure icon based on route name
          let iconName;
          let IconComponent = Ionicons;

          if (route.name === "Home") {
            iconName = isFocused ? "home" : "home-outline";
          } else if (route.name === "Explore") {
            iconName = isFocused ? "compass" : "compass-outline";
          } else if (route.name === "Globe") {
            IconComponent = FontAwesome5;
            iconName = "globe-americas";
          } else if (route.name === "Profile") {
            iconName = isFocused ? "person" : "person-outline";
          } else if (route.name === "Trips") {
            iconName = isFocused ? "briefcase" : "briefcase-outline";
          }

          return (
            <TouchableOpacity
              key={index}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabButton}
            >
              <View style={styles.tabButtonContent}>
                {isFocused && <View style={styles.activeIndicator} />}

                <IconComponent
                  name={iconName}
                  size={22}
                  color={isFocused ? "#3498db" : "#888"}
                  style={styles.tabIcon}
                />

                <Text
                  style={[
                    styles.tabLabel,
                    { color: isFocused ? "#3498db" : "#888" },
                  ]}
                >
                  {label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 999,
  },
  background: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 10,
  },
  gradient: {
    flex: 1,
  },
  tabsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    height: 60,
  },
  tabButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    position: "absolute",
    top: -10,
    width: 30,
    height: 3,
    backgroundColor: "#3498db",
    borderRadius: 1,
  },
  tabIcon: {
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  centerButtonContainer: {
    position: "absolute",
    top: -25,
    zIndex: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  centerButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    padding: 3,
  },
  centerButtonGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default BottomNavigation;
