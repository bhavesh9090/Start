const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const fs = require('fs');

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // There isn't a direct listModels in the SDK for some versions, but we can try fetching models directly or guessing common ones.
    // Actually, let's use node-fetch to hit the API endpoint directly as that's more reliable for discovery.
    const fetch = require('node-fetch') || global.fetch;
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
    console.log("Models list saved to available_models.json");
  } catch (error) {
    console.error("Error listing models:", error);
    fs.writeFileSync('available_models.json', JSON.stringify({error: error.message}, null, 2));
  }
}

listModels();
