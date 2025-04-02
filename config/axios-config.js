import axios from "axios";
import { BACKEND_URL } from "./index";

// Configure default base URL
axios.defaults.baseURL = BACKEND_URL;

// Configure timeout
axios.defaults.timeout = 10000; // 10 seconds

// Configure axios interceptors for debugging
axios.interceptors.request.use(
  (config) => {
    // Log request details
    console.log(
      `🚀 [${new Date().toISOString()}] Request: ${config.method?.toUpperCase()} ${
        config.url
      }`,
      config.data ? `\nPayload: ${JSON.stringify(config.data)}` : ""
    );

    // Log headers (safely without entire token)
    if (config.headers?.Authorization) {
      const authHeader = config.headers.Authorization;
      console.log(
        `Auth: ${authHeader.substring(0, 15)}...${authHeader.substring(
          authHeader.length - 5
        )}`
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error.message);
    return Promise.reject(error);
  }
);

axios.interceptors.response.use(
  (response) => {
    console.log(
      `✅ [${new Date().toISOString()}] Response from ${response.config.url}: ${
        response.status
      }`,
      response.data
        ? `\nData: ${JSON.stringify(response.data).substring(0, 200)}${
            response.data.length > 200 ? "..." : ""
          }`
        : ""
    );
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error(
        `❌ Response Error [${error.config.url}]: ${error.response.status}`
      );
      console.error("Error data:", JSON.stringify(error.response.data));
    } else if (error.request) {
      // No response received
      console.error(
        `❌ No response received [${error.config?.url}]: ${error.message}`
      );
    } else {
      // Request setup error
      console.error("❌ Request setup error:", error.message);
    }

    // Improve error object with better information
    if (error.response && error.response.status === 401) {
      error.authError = true;
      // Could trigger authentication refresh or logout here
    }

    return Promise.reject(error);
  }
);

// Utility function for easy retries
axios.retryRequest = async (config, retries = 3, delay = 1000) => {
  try {
    return await axios(config);
  } catch (error) {
    if (retries === 0) throw error;

    // Wait for delay
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Retry with one less retry and increased delay
    console.log(
      `🔄 Retrying request to ${config.url}, ${retries} retries left`
    );
    return axios.retryRequest(config, retries - 1, delay * 1.5);
  }
};

export default axios;
