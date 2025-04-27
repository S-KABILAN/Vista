import axios from "axios";
import { BACKEND_URL } from "../config";

// Testing the collaboration functionality

const testCollaboration = async () => {
  try {
    // Step 1: Login to get auth token
    console.log("1. Attempting to login...");
    const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
      email: "test@example.com",
      password: "password123",
    });

    const token = loginResponse.data.token;
    console.log("✓ Login successful, token obtained");

    // Step 2: Get or create a test travel plan
    console.log("\n2. Creating a test travel plan...");
    const travelPlanResponse = await axios.post(
      `${BACKEND_URL}/api/travel-plans`,
      {
        destination: "Collaboration Test City",
        budget: 1500,
        tripDuration: 5,
        itinerary: [
          { day: 1, activities: "Arrival and check-in" },
          { day: 2, activities: "City tour" },
        ],
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const planId = travelPlanResponse.data.travelPlan._id;
    console.log(`✓ Travel plan created with ID: ${planId}`);

    // Step 3: Add a collaborator
    console.log("\n3. Adding a collaborator to the plan...");
    const addCollabResponse = await axios.post(
      `${BACKEND_URL}/api/collaboration/${planId}/collaborators`,
      {
        email: "collab1@example.com",
        accessLevel: "view",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("✓ Collaborator added:", addCollabResponse.data.message);

    // Step 4: Get collaborators
    console.log("\n4. Getting collaborators for the plan...");
    const collabsResponse = await axios.get(
      `${BACKEND_URL}/api/collaboration/${planId}/collaborators`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log(
      `✓ Plan has ${collabsResponse.data.collaborators.length} collaborator(s)`
    );
    console.log(
      "Collaborators:",
      collabsResponse.data.collaborators.map(
        (c) => `${c.userId.fullName} (${c.userId.email}) - ${c.accessLevel}`
      )
    );

    // Step 5: Create a share link
    console.log("\n5. Creating a share link...");
    const shareLinkResponse = await axios.post(
      `${BACKEND_URL}/api/collaboration/${planId}/share`,
      { expiration: 7 },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    const shareLink = shareLinkResponse.data.shareLink;
    console.log(`✓ Share link created: ${shareLink}`);

    // Success!
    console.log("\n✓ All collaboration tests completed successfully!");
  } catch (error) {
    console.error("\n✗ Test failed:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
};

// Run the test
testCollaboration();
