import { Platform } from "react-native";

// Get current device/emulator IP address
// For development - this should be the same IP where your backend server is running
const DEV_IP = "192.168.66.149"; // Default Android emulator IP to access host machine

// Determine the appropriate backend URL based on platform and environment
const getBackendUrl = () => {
  // For local development
  if (__DEV__) {
    if (Platform.OS === "android") {
      // Android emulator can't access 'localhost' directly
      // You can use 10.0.2.2 for standard Android emulator or your local network IP
      return `http://${DEV_IP}:5000`;
    } else {
      // iOS simulator can use localhost
      return "http://192.168.66.149:5000";
    }
  }

  // For production
  return "https://vista-travel-api.example.com";
};

export const BACKEND_URL = getBackendUrl();

// Log the backend URL for debugging
console.log(`Backend URL: ${BACKEND_URL}`);
