require('dotenv').config({ path: __dirname + '/../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const models = [
  'gemini-flash-latest',
  'gemini-pro-latest',
  'gemini-2.5-flash-lite',
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
  'gemini-3.1-flash-lite'
];

async function findWorkingModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);

  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const res = await model.generateContent('Say hello in 3 words');
      console.log(`✅ SUCCESS with model: "${m}" -> "${res.response.text().trim()}"`);
      return m;
    } catch (e) {
      console.log(`❌ "${m}" failed: ${e.message.split('\n')[0]}`);
    }
  }
}

findWorkingModel();
