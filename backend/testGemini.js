const { GoogleGenerativeAI } = require("@google/generative-ai");

// Use the API key directly for testing
const API_KEY = "AIzaSyBnDKVfSfmY4HwxmC_VULTfH4UwyDfKF_g";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testGemini() {
  try {
    console.log("Testing Gemini API...");
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const result = await model.generateContent(
      "Say hello and introduce yourself briefly"
    );
    const response = await result.response;
    const text = response.text();

    console.log("Gemini API Response:", text);
    console.log("API is working correctly!");
  } catch (error) {
    console.error("Gemini API Error:", error);
    console.error("Full error details:", JSON.stringify(error, null, 2));
  }
}

testGemini();
