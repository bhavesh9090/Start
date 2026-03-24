require('dotenv').config();
const fs = require('fs');

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    fs.writeFileSync('available_models.json', JSON.stringify(data, null, 2));
    if (data.models) {
        console.log("Found " + data.models.length + " models.");
        data.models.forEach(m => console.log("- " + m.name));
    } else {
        console.log("No models field in response:", data);
    }
  } catch (err) {
    console.error(err);
    fs.writeFileSync('available_models.json', JSON.stringify({error: err.message}, null, 2));
  }
}

listModels();
