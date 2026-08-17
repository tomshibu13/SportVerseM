const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * SportVerse AI - Gemini Model Orchestrator & Safe Client
 * Resilient multi-model fallback across Gemini 3.5, 3.7, 3.1-flash-lite, and 2.5.
 */

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.7-flash',
  'gemini-3.1-flash-lite',
  'gemini-2.5-flash'
];

/**
 * Generates text using Gemini with multi-model fallback and error recovery
 */
async function generateGeminiContent({ systemInstruction = '', prompt = '' }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction || undefined
      });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        return text.trim();
      }
    } catch (err) {
      lastError = err;
      // If 404 or 429, try next model in fallback list
      continue;
    }
  }

  throw lastError || new Error('All Gemini models failed to generate content');
}

/**
 * Defensive sanitizer to ensure no drug names or dosage slip through Gemini
 */
function sanitizeOutputText(text = '') {
  if (typeof text !== 'string') return text;
  const drugRegex = /\b(paracetamol|ibuprofen|diclofenac|advil|motrin|aspirin|naproxen|antibiotic|steroid|prednisone|cortisone|tramadol|codeine)\b/gi;
  const dosageRegex = /\b(\d+\s*(mg|milligram|tablets?|pills?|times\s+a\s+day|daily))\b/gi;
  return text.replace(drugRegex, '[medication advice from doctor]').replace(dosageRegex, '[consult doctor for dosage]');
}

module.exports = {
  generateGeminiContent,
  sanitizeOutputText
};
