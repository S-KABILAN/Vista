// Store your backend URL in one place for easy updates
import { Platform } from "react-native";

// Get local IP based on platform
export const SERVER_IP = "192.168.66.149"; // Use your actual IP address here
export const SERVER_PORT = 5000;

// Define the backend URL - used throughout the app
export const BACKEND_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

// Socket.IO connection URL - use the same as BACKEND_URL
export const SOCKET_URL = BACKEND_URL;

// This should point to your actual backend URL
export const BACKEND_URL_ACTUAL = "http://192.168.66.149:5000";

// App Configuration

// Define the backend URL based on the environment
// This should point to your actual backend URL
export const BACKEND_URL_APP =
  process.env.NODE_ENV === "production"
    ? "https://vista-travel-backend.example.com"
    : "http://192.168.66.149:5000";

// Other configuration variables
export const DEFAULT_CURRENCY = "USD";
export const DEFAULT_LANGUAGE = "en";

// API keys - should be moved to environment variables in production
export const GOOGLE_MAPS_API_KEY = "AIzaSyA0E_xu1VBpJ7gxVvfZ8bMXqmNe3advwes";

// App settings
export const APP_VERSION = "1.0.0";
export const APP_NAME = "Vista Travel";

// Feature Flags
export const FEATURES = {
  ENABLE_NOTIFICATIONS: true,
  ENABLE_OFFLINE_MODE: true,
  ENABLE_SOCIAL_SHARING: true,
  ENABLE_AI_FEATURES: true,
  ENABLE_COLLABORATION: true,
};
