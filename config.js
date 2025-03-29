// Store your backend URL in one place for easy updates
import { Platform } from "react-native";

// Get local IP based on platform
export const SERVER_IP = "192.168.167.149"; // Use your actual IP address here
export const SERVER_PORT = 5000;

// For development with Expo - choose correct localhost for the platform
export const BACKEND_URL = `http://${SERVER_IP}:${SERVER_PORT}`;

// This should point to your actual backend URL
export const BACKEND_URL_ACTUAL = "http://192.168.167.149:5000";
