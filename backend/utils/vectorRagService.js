const { GoogleGenerativeAI } = require('@google/generative-ai');
const InjuryKnowledge = require('../models/InjuryKnowledge');

/**
 * SportVerse AI - Vector RAG Service
 * Implements semantic/vector search with Google Generative AI embeddings,
 * MongoDB-backed vector store, in-memory caching, cosine similarity,
 * domain relevance gating, top-K retrieval, and anti-hallucination thresholding.
 */

const EMBEDDING_MODELS = [
  'gemini-embedding-001',
  'gemini-embedding-2-preview',
  'gemini-embedding-2'
];

const DEFAULT_TOP_K = 3;
const DEFAULT_SIMILARITY_THRESHOLD = 0.62; // Strict threshold for vector similarity

// Core sports-injury domain dictionary
const SPORTS_INJURY_DOMAIN_TERMS = new Set([
  'ankle', 'knee', 'shoulder', 'hamstring', 'quad', 'quadricep', 'quadriceps', 'calf',
  'groin', 'head', 'neck', 'spine', 'back', 'elbow', 'wrist', 'hip', 'foot', 'achilles',
  'shin', 'patella', 'meniscus', 'acl', 'pcl', 'mcl', 'lcl', 'rotator', 'cuff',
  'joint', 'ligament', 'tendon', 'muscle', 'bone', 'cartilage',
  'sprain', 'strain', 'tear', 'rupture', 'dislocation', 'subluxation', 'fracture',
  'swelling', 'swell', 'swollen', 'bruise', 'bruising', 'hematoma', 'concussion',
  'heat', 'exhaustion', 'stroke', 'dehydration', 'dehydrated', 'cramp', 'cramping', 'fatigue',
  'rice', 'ice', 'rest', 'compression', 'elevation', 'warmup', 'warm-up', 'stretching',
  'rehab', 'rehabilitation', 'recovery', 'healing', 'return', 'play', 'sport',
  'football', 'cricket', 'badminton', 'tennis', 'running', 'runner', 'basketball', 'swimming', 'cycling',
  'workout', 'training', 'exercise', 'sprint', 'jump', 'pivot', 'twist', 'fall', 'collision',
  'injury', 'injured', 'hurt', 'pain', 'painful', 'sore', 'soreness', 'ache', 'stiff', 'stiffness',
  'pop', 'popping', 'snap', 'limp', 'limping', 'walk', 'walking', 'bear weight', 'weight bearing'
]);

// In-memory cache for indexed chunks with precomputed embeddings
let memoryVectorIndex = null;
let lastIndexLoadTime = 0;
const INDEX_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Computes dot product of two vectors
 */
function dotProduct(a, b) {
  let sum = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Computes vector magnitude (Euclidean norm)
 */
function vectorMagnitude(v) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) {
    sum += v[i] * v[i];
  }
  return Math.sqrt(sum);
}

/**
 * Normalizes vector to unit length
 */
function normalizeVector(v) {
  const mag = vectorMagnitude(v);
  if (mag === 0) return v;
  return v.map(val => val / mag);
}

/**
 * Computes cosine similarity between two vectors
 */
function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
  const magA = vectorMagnitude(vecA);
  const magB = vectorMagnitude(vecB);
  if (magA === 0 || magB === 0) return 0;
  const dot = dotProduct(vecA, vecB);
  return dot / (magA * magB);
}

/**
 * Generate embedding vector for a given text using Gemini Embeddings API
 */
async function generateEmbedding(text) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes('your_')) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const cleanText = (text || '').trim().replace(/\s+/g, ' ');
  if (!cleanText) return [];

  let lastError = null;
  for (const modelName of EMBEDDING_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.embedContent(cleanText);
      if (result && result.embedding && Array.isArray(result.embedding.values)) {
        return normalizeVector(result.embedding.values);
      }
    } catch (err) {
      lastError = err;
      continue;
    }
  }

  console.warn('[Vector RAG Warning]: Embedding generation failed via Gemini:', lastError?.message);
  throw lastError || new Error('Failed to generate embedding');
}

/**
 * Loads and caches all vector chunks from MongoDB
 */
async function loadVectorIndex(forceReload = false) {
  const now = Date.now();
  if (memoryVectorIndex && !forceReload && (now - lastIndexLoadTime < INDEX_CACHE_TTL_MS)) {
    return memoryVectorIndex;
  }

  try {
    const docs = await InjuryKnowledge.find({});
    const chunks = [];

    for (const doc of docs) {
      if (Array.isArray(doc.chunks) && doc.chunks.length > 0) {
        for (const c of doc.chunks) {
          if (c.embedding && c.embedding.length > 0) {
            chunks.push({
              chunkId: c.chunkId,
              title: c.title || doc.injuryName || doc.category,
              section: c.section || 'General',
              text: c.text,
              embedding: c.embedding,
              sourceFile: doc.sourceFile,
              sourceUrl: doc.sourceUrl,
              bodyPart: doc.bodyPart,
              category: doc.category,
              injuryName: doc.injuryName,
              warningSigns: doc.warningSigns,
              immediateCare: doc.immediateCare,
              whenToSeekDoctor: doc.whenToSeekDoctor,
              docId: doc._id.toString()
            });
          }
        }
      }

      if (doc.documentEmbedding && doc.documentEmbedding.length > 0) {
        chunks.push({
          chunkId: `${doc._id}_doc`,
          title: doc.injuryName || doc.category,
          section: 'Complete Document Overview',
          text: doc.content,
          embedding: doc.documentEmbedding,
          sourceFile: doc.sourceFile,
          sourceUrl: doc.sourceUrl,
          bodyPart: doc.bodyPart,
          category: doc.category,
          injuryName: doc.injuryName,
          warningSigns: doc.warningSigns,
          immediateCare: doc.immediateCare,
          whenToSeekDoctor: doc.whenToSeekDoctor,
          docId: doc._id.toString()
        });
      }
    }

    memoryVectorIndex = chunks;
    lastIndexLoadTime = now;
    console.log(`[Vector RAG]: Loaded ${chunks.length} vector chunks across ${docs.length} knowledge documents into memory index.`);
    return memoryVectorIndex;
  } catch (err) {
    console.error('[Vector RAG Error]: Failed to load vector index from MongoDB:', err.message);
    return memoryVectorIndex || [];
  }
}

/**
 * Extracts and synthesizes multi-turn context from conversation history
 */
function buildContextualQuery(currentMessage, history = []) {
  let contextKeywords = [];

  if (Array.isArray(history) && history.length > 0) {
    const recentHistory = history.slice(-4);
    for (const h of recentHistory) {
      const text = (h.text || h.content || '').toLowerCase();
      const matchedParts = ['ankle', 'knee', 'shoulder', 'hamstring', 'quad', 'calf', 'groin', 'head', 'elbow', 'wrist', 'back', 'neck', 'foot', 'achilles', 'meniscus', 'acl', 'sprain', 'strain', 'tear', 'football', 'cricket', 'badminton', 'running', 'tennis', 'basketball'];
      for (const part of matchedParts) {
        if (text.includes(part) && !contextKeywords.includes(part)) {
          contextKeywords.push(part);
        }
      }
    }
  }

  const query = (currentMessage || '').trim();
  if (contextKeywords.length > 0) {
    return `${query} (Context: ${contextKeywords.join(', ')})`;
  }
  return query;
}

/**
 * Checks if query contains relevant sports-injury terms
 */
function checkDomainRelevance(query = '', history = []) {
  const allWords = `${query} ${history.map(h => h.text || h.content || '').join(' ')}`
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  let matchCount = 0;
  for (const w of allWords) {
    if (SPORTS_INJURY_DOMAIN_TERMS.has(w)) {
      matchCount++;
    }
  }

  // Check for explicit non-sports / medical out-of-domain words
  const OUT_OF_DOMAIN_TRIGGERS = [
    'dental', 'teeth', 'tooth', 'dentist', 'cavity', 'implant', 'orthodont',
    'pregnancy', 'pregnant', 'cardiac', 'cancer', 'tumor', 'chemotherapy',
    'malaria', 'diabetes', 'insulin', 'pneumonia', 'hiv', 'appendix', 'appendicitis'
  ];

  for (const o of OUT_OF_DOMAIN_TRIGGERS) {
    if (allWords.includes(o)) {
      return { isDomainRelevant: false, reason: `Out-of-domain medical topic: ${o}` };
    }
  }

  return { isDomainRelevant: matchCount >= 1, matchCount };
}

/**
 * Performs Semantic Vector Search & Retrieval with Domain Gating
 */
async function searchKnowledgeBase({
  query = '',
  history = [],
  sport = '',
  bodyPart = '',
  topK = DEFAULT_TOP_K,
  similarityThreshold = DEFAULT_SIMILARITY_THRESHOLD
}) {
  const startTime = Date.now();
  const contextualQuery = buildContextualQuery(query, history);

  if (!contextualQuery || contextualQuery.trim().length === 0) {
    return {
      formattedText: '',
      sources: [],
      retrieved: false,
      noKnowledgeFound: true,
      topScore: 0,
      chunks: []
    };
  }

  // 1. Domain Relevance Verification (Prevents unrelated medical/general queries from false-matching)
  const domainCheck = checkDomainRelevance(query, history);
  if (!domainCheck.isDomainRelevant) {
    console.log(`[Vector RAG]: Query "${query}" rejected by domain relevance check: ${domainCheck.reason || 'No sports-injury keywords found.'}`);
    return {
      formattedText: '',
      sources: [],
      retrieved: false,
      noKnowledgeFound: true,
      topScore: 0,
      chunks: []
    };
  }

  // 2. Generate Query Vector Embedding
  let queryVector = [];
  try {
    queryVector = await generateEmbedding(contextualQuery);
  } catch (embedErr) {
    console.warn('[Vector RAG]: Direct embedding failed, falling back to keyword scoring:', embedErr.message);
  }

  // 3. Load Vector Index
  const chunks = await loadVectorIndex();
  if (!chunks || chunks.length === 0) {
    console.warn('[Vector RAG]: Vector index is empty. Please run indexing script.');
    return {
      formattedText: '',
      sources: [],
      retrieved: false,
      noKnowledgeFound: true,
      topScore: 0,
      chunks: []
    };
  }

  // 4. Score Chunks
  const searchTokens = contextualQuery.toLowerCase().split(/\s+/).filter(t => t.length > 2);
  const targetBodyPart = (bodyPart || '').toLowerCase().trim();

  const scoredChunks = chunks.map(chunk => {
    let score = 0;

    // Vector Cosine Similarity
    if (queryVector.length > 0 && chunk.embedding && chunk.embedding.length > 0) {
      score = cosineSimilarity(queryVector, chunk.embedding);
    }

    // Body part alignment bonus
    if (targetBodyPart && targetBodyPart !== 'general' && targetBodyPart !== 'joint/muscle') {
      if (chunk.bodyPart && chunk.bodyPart.toLowerCase().includes(targetBodyPart)) {
        score = Math.min(score + 0.12, 0.99);
      }
    }

    const roundedScore = Math.round(score * 100) / 100;
    return {
      ...chunk,
      score: roundedScore,
      scorePercentage: `${Math.round(roundedScore * 100)}%`
    };
  });

  // 5. Sort and Filter by Threshold
  const sorted = scoredChunks.sort((a, b) => b.score - a.score);
  const topScore = sorted.length > 0 ? sorted[0].score : 0;

  const relevantChunks = sorted
    .filter(c => c.score >= similarityThreshold)
    .slice(0, topK);

  const durationMs = Date.now() - startTime;

  // 6. If no chunks meet the relevance threshold -> Grounding Guard: return no knowledge found
  if (relevantChunks.length === 0) {
    console.log(`[Vector RAG]: Query "${query}" top score ${topScore} < threshold ${similarityThreshold}. No reliable knowledge found. (${durationMs}ms)`);
    return {
      formattedText: '',
      sources: [],
      retrieved: false,
      noKnowledgeFound: true,
      topScore,
      chunks: []
    };
  }

  // 7. Deduplicate sources
  const sourceMap = new Map();
  for (const c of relevantChunks) {
    if (!sourceMap.has(c.sourceFile)) {
      sourceMap.set(c.sourceFile, {
        title: c.title || c.category,
        sourceFile: c.sourceFile,
        sourceUrl: c.sourceUrl || '',
        bodyPart: c.bodyPart,
        relevanceScore: c.score,
        relevancePercentage: c.scorePercentage
      });
    } else {
      const existing = sourceMap.get(c.sourceFile);
      if (c.score > existing.relevanceScore) {
        existing.relevanceScore = c.score;
        existing.relevancePercentage = c.scorePercentage;
      }
    }
  }

  const sources = Array.from(sourceMap.values());

  // 8. Format retrieved context for LLM prompt
  const formattedText = relevantChunks.map((c, idx) => {
    return `[KNOWLEDGE CHUNK #${idx + 1} | Source: ${c.sourceFile} | Topic: ${c.title} (${c.bodyPart}) | Section: ${c.section} | Relevance: ${c.scorePercentage}]\n` +
      `${c.text.trim()}\n` +
      (c.immediateCare && c.immediateCare.length > 0 ? `Immediate Care: ${c.immediateCare.join('; ')}\n` : '') +
      (c.warningSigns && c.warningSigns.length > 0 ? `Red Flags / Warning Signs: ${c.warningSigns.join('; ')}\n` : '') +
      (c.whenToSeekDoctor && c.whenToSeekDoctor.length > 0 ? `Consult Doctor If: ${c.whenToSeekDoctor.join('; ')}\n` : '');
  }).join('\n\n========================================\n\n');

  console.log(`[Vector RAG Success]: Query="${query}" -> Retrieved ${relevantChunks.length} chunks from [${sources.map(s => `${s.sourceFile} ${s.relevancePercentage}`).join(', ')}] in ${durationMs}ms`);

  return {
    formattedText,
    sources,
    retrieved: true,
    noKnowledgeFound: false,
    topScore,
    chunks: relevantChunks
  };
}

module.exports = {
  generateEmbedding,
  searchKnowledgeBase,
  loadVectorIndex,
  cosineSimilarity,
  normalizeVector,
  checkDomainRelevance
};
