require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModel(modelName) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say hello in one word");
    const text = result.response.text();
    console.log(`✅ ${modelName} works! Response: ${text.substring(0, 50)}`);
    return true;
  } catch (err) {
    console.log(`❌ ${modelName} failed: ${err.message.substring(0, 100)}`);
    return false;
  }
}

async function main() {
  const models = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-pro",
    "gemini-1.0-pro",
  ];
  
  for (const m of models) {
    await testModel(m);
  }
}

main();
