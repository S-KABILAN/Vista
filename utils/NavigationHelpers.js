// Navigation helper functions for consistent navigation across the app

/**
 * Navigate to the trip details screen
 * @param {object} navigation - React Navigation navigation object
 * @param {string} planId - The ID of the travel plan
 * @param {string} planName - The name/destination of the travel plan
 */
export const navigateToTripDetails = (navigation, planId, planName) => {
  navigation.navigate("TripDetails", { planId, planName });
};

/**
 * Navigate to the trip collaboration screen
 * @param {object} navigation - React Navigation navigation object
 * @param {string} planId - The ID of the travel plan
 * @param {string} planName - The name/destination of the travel plan
 */
export const navigateToTripCollaboration = (navigation, planId, planName) => {
  navigation.navigate("TripCollaboration", { planId, planName });
};

/**
 * Navigate to the invite collaborators screen
 * @param {object} navigation - React Navigation navigation object
 * @param {string} planId - The ID of the travel plan
 * @param {string} planName - The name/destination of the travel plan
 */
export const navigateToInviteCollaborators = (navigation, planId, planName) => {
  navigation.navigate("InviteCollaborators", { planId, planName });
};
