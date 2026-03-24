const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();
const fs = require('fs');

async function test_flash() {
  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const modelName = "gemini-1.5-flash";
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hi");
    const response = await result.response;
    fs.writeFileSync('flash_test.json', JSON.stringify({success: true, text: response.text()}, null, 2));
    console.log("Success with 1.5-flash");
  } catch (error) {
    console.error("Error with 1.5-flash:", error);
    fs.writeFileSync('flash_test.json', JSON.stringify({success: false, error: error.message}, null, 2));
  }
}

test_flash();
