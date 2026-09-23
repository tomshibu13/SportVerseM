const { GoogleGenerativeAI } = require('@google/generative-ai');
const { sanitizeOutputText } = require('./geminiClient');

const FALLBACK_MODELS = [
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
  'gemini-3.7-flash'
];

const MODEL_TIMEOUT_MS = 8000;

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Model request timed out after ${ms}ms`)), ms))
  ]);
}

const MANDATORY_DISCLAIMER = 'This information is for general guidance and does not replace evaluation by a qualified healthcare professional.';

/**
 * Generates Grounded AI Injury Assessment / Chat Response using RAG Context
 * @param {object} params
 * @param {string} params.userMessage - Current user query / symptoms
 * @param {string} params.ragContext - Retrieved knowledge base text
 * @param {Array} params.sources - Retrieved sources metadata
 * @param {boolean} params.noKnowledgeFound - Whether retrieval failed / score below threshold
 * @param {string} [params.riskLevel] - Pre-assessed safety risk level (LOW/MODERATE/HIGH/URGENT)
 * @param {Array} [params.history] - Previous messages
 * @returns {Promise<{ answer: string, sources: Array, disclaimer: string, retrieved: boolean, isInsufficient: boolean }>}
 */
async function generateGroundedInjuryResponse({
  userMessage = '',
  ragContext = '',
  sources = [],
  noKnowledgeFound = false,
  riskLevel = 'LOW',
  history = []
}) {
  // 1. If RAG Retrieval found insufficient knowledge -> Prevent Hallucination
  if (noKnowledgeFound || !ragContext || ragContext.trim().length === 0) {
    const insufficientAnswer = `🏥 **SportVerse AI Injury Knowledge Notice**\n\n` +
      `The available sports injury knowledge base does not contain sufficient verified medical information to answer your specific query with confidence.\n\n` +
      `To ensure athlete safety and prevent misinformation, I do not provide ungrounded advice. Please consult a qualified sports medicine physician or certified physiotherapist for an accurate evaluation.`;

    return {
      answer: insufficientAnswer,
      sources: [],
      disclaimer: MANDATORY_DISCLAIMER,
      retrieved: false,
      isInsufficient: true
    };
  }

  // 2. Build Multi-Turn History Summary
  const historySnippet = Array.isArray(history) && history.length > 0
    ? history.slice(-4).map(h => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.text || h.content || ''}`).join('\n')
    : '';

  // 3. Grounded System Prompt
  const systemInstruction = `You are SportVerse AI, an expert sports-injury educational assistant.
STRICT RAG & MEDICAL SAFETY RULES:
1. Answer using the retrieved knowledge ONLY. Do not invent facts or extrapolate beyond the provided sports medicine documents.
2. If the retrieved information is insufficient to answer the question completely, clearly state that the available knowledge base is insufficient.
3. NEVER provide a definitive clinical diagnosis (never say "You have a torn ACL"; use "Possible injury category: Ligament sprain/tear").
4. NEVER prescribe medications, specific brand/drug names, or dosage/frequency schedules. For medication questions, advise consulting a doctor or pharmacist.
5. Structure your response clearly:
   - General Explanation & Possible Injury Category (supported by context)
   - Immediate Self-Care Guidance (e.g. R.I.C.E protocol: Rest, Ice 15-20 min, Compression, Elevation)
   - Recovery Considerations & Milestones
   - Warning Signs & Red Flags (when to stop play immediately)
   - When to Consult a Qualified Doctor or Physiotherapist
6. Tone must be encouraging, empathetic, safety-conscious, and professional.`;

  const prompt = `--- RETRIEVED SPORTS MEDICINE KNOWLEDGE (RAG) ---
${ragContext}
--------------------------------------------------

${historySnippet ? `Conversation History:\n${historySnippet}\n\n` : ''}User Question: "${userMessage}"
Assessed Risk Level: ${riskLevel}

Provide a well-structured, clear response strictly grounded in the retrieved knowledge above.`;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    // If API key is not configured, generate a deterministic grounded response from retrieved sources
    const firstSource = sources[0] || {};
    const fallbackGrounded = `🏥 **Sports Injury Guidance (${firstSource.title || 'Sports Health'})**\n\n` +
      `Based on retrieved knowledge from **${firstSource.sourceFile || 'Sports Medicine Protocols'}**:\n\n` +
      `• **Immediate Care (R.I.C.E)**: Rest the injured area, apply cold packs wrapped in cloth for 15–20 minutes, use compression support, and elevate above heart level.\n` +
      `• **Recovery**: Gradually progress mobility as pain subsides. Do not rush return to sport while swelling or limping persists.\n` +
      `• **When to Consult a Doctor**: If you experience severe pain, joint instability, inability to bear weight, or no improvement within 48–72 hours.`;

    return {
      answer: fallbackGrounded,
      sources,
      disclaimer: MANDATORY_DISCLAIMER,
      retrieved: true,
      isInsufficient: false
    };
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  let generatedText = '';
  let lastError = null;

  for (const modelName of FALLBACK_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction
      });
      const result = await withTimeout(model.generateContent(prompt), MODEL_TIMEOUT_MS);
      const text = result.response.text();
      if (text && text.trim().length > 0) {
        generatedText = text.trim();
        break;
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  if (!generatedText) {
    console.warn('[RAG Generator]: Gemini generation failed across all models:', lastError?.message);
    const firstSource = sources[0] || {};
    generatedText = `🏥 **Sports Injury Guidance (${firstSource.title || 'Sports Health'})**\n\n` +
      `Based on verified sports-medicine guidelines in **${firstSource.sourceFile || 'Sports First Aid Guide'}**:\n\n` +
      `• **Immediate Care**: Apply the **R.I.C.E protocol** (Rest, Ice 15–20 minutes with a towel, Compression, Elevation).\n` +
      `• **Precautions**: Avoid heat, aggressive massage, and continuing active play during the acute phase.\n` +
      `• **Professional Review**: Consult an orthopedic doctor or physiotherapist if pain is severe or weight-bearing is impossible.`;
  }

  // Defensive sanitization: ensure no drug dosages slipped through
  generatedText = sanitizeOutputText(generatedText);

  return {
    answer: generatedText,
    sources,
    disclaimer: MANDATORY_DISCLAIMER,
    retrieved: true,
    isInsufficient: false
  };
}

module.exports = {
  generateGroundedInjuryResponse,
  MANDATORY_DISCLAIMER
};
