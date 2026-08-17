require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function testGeminiSuccess() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  try {
    const result = await model.generateContent('Say "Gemini 2.5 Flash is active and fully functional for SportVerse AI!" in one sentence.');
    console.log('✅ LIVE GEMINI RESPONSE:');
    console.log(result.response.text().trim());
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testGeminiSuccess();
