require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log('Testing Gemini API key:', apiKey ? `${apiKey.substring(0, 10)}... (Length: ${apiKey.length})` : 'MISSING');

  if (!apiKey) {
    console.error('❌ No GEMINI_API_KEY found in .env');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTest = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];

  for (const modelName of modelsToTest) {
    console.log(`\nTesting model "${modelName}"...`);
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Say "Gemini is working for SportVerse AI" in 1 sentence.');
      const response = await result.response;
      console.log(`✅ SUCCESS with ${modelName}! Response:`);
      console.log(response.text().trim());
      return;
    } catch (err) {
      console.error(`❌ FAILED with ${modelName}:`, err.message);
    }
  }
}

testGemini();
