const InjuryKnowledge = require('../models/InjuryKnowledge');

/**
 * SportVerse AI - Hybrid PDF RAG Retrieval Engine
 * Retrieves relevant sections from indexed knowledge PDFs, calculates relevance scores,
 * preserves source filenames, and enforces medication query blocking.
 */

// Intent topic map directly targeting curated knowledge PDFs
const TOPIC_PDF_MAP = [
  {
    sourceFile: '02_ankle_injuries.pdf',
    category: 'Ankle Sprains & Ligament Injuries',
    keywords: ['ankle', 'sprain', 'inversion', 'foot sprain', 'ankle roll', 'ankle twist', 'achilles', 'lateral ankle']
  },
  {
    sourceFile: '03_knee_injuries.pdf',
    category: 'Knee & Ligament Injuries (ACL / Meniscus)',
    keywords: ['knee', 'acl', 'pcl', 'mcl', 'lcl', 'meniscus', 'patella', 'pop in knee', 'knee twist', 'runner knee', 'jumper knee']
  },
  {
    sourceFile: '04_muscle_strains.pdf',
    category: 'Muscle Strains & Tears',
    keywords: ['muscle strain', 'pulled muscle', 'hamstring', 'quadricep', 'quad', 'calf strain', 'groin strain', 'muscle tear', 'pulled hamstring', 'thigh strain']
  },
  {
    sourceFile: '05_shoulder_injuries.pdf',
    category: 'Shoulder & Rotator Cuff Injuries',
    keywords: ['shoulder', 'rotator cuff', 'shoulder dislocation', 'impingement', 'overhead stroke', 'arm pain', 'throwing pain', 'shoulder pop']
  },
  {
    sourceFile: '06_sports_concussion.pdf',
    category: 'Sports Concussion & Head Trauma',
    keywords: ['concussion', 'head', 'head blow', 'dizzy', 'dizziness', 'headache', 'brain', 'loss of consciousness', 'memory loss', 'confusion', 'nausea head']
  },
  {
    sourceFile: '07_heat_illness.pdf',
    category: 'Heat Illness & Heat Exhaustion',
    keywords: ['heat', 'heat illness', 'heat exhaustion', 'heat stroke', 'heat cramps', 'high temperature', 'overheating', 'sun stroke']
  },
  {
    sourceFile: '08_dehydration.pdf',
    category: 'Dehydration & Fluid Balance in Sports',
    keywords: ['dehydration', 'dehydrated', 'thirst', 'dry mouth', 'fluid', 'fluids', 'water intake', 'electrolytes', 'cramping dehydration']
  },
  {
    sourceFile: '09_return_to_sport.pdf',
    category: 'Return to Sport & Progressive Rehabilitation',
    keywords: ['return to sport', 'recovery', 'rehabilitation', 'rehab', 'recovery days', 'how many days', 'how long to recover', 'when can i play', 'healing time', 'back to play']
  },
  {
    sourceFile: '10_injury_prevention.pdf',
    category: 'Injury Prevention & Athletic Conditioning',
    keywords: ['prevention', 'prevent', 'warmup', 'warm up', 'stretching', 'cool down', 'conditioning', 'protective gear', 'proper footwear']
  },
  {
    sourceFile: '01_general_sports_injuries.pdf',
    category: 'General Sports Injuries & First Aid',
    keywords: ['sports injury', 'first aid', 'rice protocol', 'acute injury', 'ice therapy', 'compression bandage']
  }
];

/**
 * Retrieve relevant knowledge from MongoDB indexed PDFs
 * @param {object} params - { query, sport, bodyPart, symptoms, isMedicationQuery }
 * @returns {object} { formattedText, sources, noKnowledgeFound, debugInfo }
 */
exports.retrieveRelevantKnowledge = async ({ query = '', sport = '', bodyPart = '', symptoms = [], isMedicationQuery = false }) => {
  // 1. If Medication Safety Triggered -> Block RAG retrieval completely
  if (isMedicationQuery) {
    return {
      formattedText: '',
      sources: [],
      noKnowledgeFound: false,
      debugInfo: { reason: 'Blocked by medication safety gate' }
    };
  }

  try {
    const searchString = [
      query,
      sport !== 'Sports' && sport !== 'All' ? sport : '',
      bodyPart !== 'Joint/Muscle' && bodyPart !== 'General' ? bodyPart : '',
      ...(Array.isArray(symptoms) ? symptoms : [symptoms])
    ].join(' ').toLowerCase().trim();

    if (!searchString) {
      return {
        formattedText: '',
        sources: [],
        noKnowledgeFound: true,
        debugInfo: { reason: 'Empty search query' }
      };
    }

    // Fetch all indexed PDF documents from MongoDB
    const allDocs = await InjuryKnowledge.find({});

    if (!allDocs || allDocs.length === 0) {
      console.warn('[RAG Warning]: No indexed PDF documents found in MongoDB InjuryKnowledge collection.');
      return {
        formattedText: '',
        sources: [],
        noKnowledgeFound: true,
        debugInfo: { reason: 'Collection empty' }
      };
    }

    // Score each document against the query
    const scoredDocs = allDocs.map(doc => {
      let score = 0;
      const docText = `${doc.category} ${doc.bodyPart} ${doc.tags.join(' ')} ${doc.content}`.toLowerCase();
      const filename = (doc.sourceFile || '').toLowerCase();

      // Check explicit topic map
      const topicMatch = TOPIC_PDF_MAP.find(t => t.sourceFile === doc.sourceFile);
      if (topicMatch) {
        for (const kw of topicMatch.keywords) {
          if (searchString.includes(kw)) {
            score += 0.45;
            break;
          }
        }
      }

      // Check bodyPart exact match
      if (bodyPart && bodyPart !== 'General' && bodyPart !== 'Joint/Muscle') {
        if (doc.bodyPart.toLowerCase().includes(bodyPart.toLowerCase())) {
          score += 0.35;
        }
      }

      // Stopwords to ignore in token overlap matching
      const STOPWORDS = new Set([
        'how', 'why', 'what', 'when', 'where', 'who', 'which', 'can', 'you', 'tell',
        'me', 'the', 'and', 'for', 'with', 'this', 'that', 'from', 'have', 'has',
        'had', 'are', 'were', 'been', 'will', 'would', 'could', 'should', 'about',
        'into', 'more', 'some', 'such', 'than', 'them', 'then', 'there', 'these',
        'they', 'works', 'work', 'does', 'doing', 'done', 'like', 'just', 'make'
      ]);

      // Check query tokens in tags / title / content (ignoring stopwords)
      const queryTokens = searchString
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(t => t.length > 2 && !STOPWORDS.has(t));

      let domainKeywordMatched = false;
      queryTokens.forEach(token => {
        if (doc.tags.some(tag => tag.toLowerCase().includes(token))) {
          score += 0.20;
          domainKeywordMatched = true;
        } else if (doc.category.toLowerCase().includes(token)) {
          score += 0.25;
          domainKeywordMatched = true;
        } else if (docText.includes(token)) {
          score += 0.05;
        }
      });

      // If no explicit topic or domain keyword matched, cap the score at 0.10
      if (!domainKeywordMatched && score < 0.40) {
        score = 0;
      }

      // Normalize score between 0 and 1.00
      const normalizedScore = Math.min(Math.round((score) * 100) / 100, 0.99);

      return {
        doc,
        sourceFile: doc.sourceFile,
        category: doc.category,
        bodyPart: doc.bodyPart,
        relevanceScore: normalizedScore,
        relevancePercentage: `${Math.round(normalizedScore * 100)}%`
      };
    });

    // Filter by relevance threshold (>= 0.20) and sort descending
    const filtered = scoredDocs
      .filter(s => s.relevanceScore >= 0.20)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, 3);

    // If no document matches with sufficient confidence
    if (filtered.length === 0) {
      console.log(`[RAG Retrieval]: No relevant PDF knowledge matched query="${searchString}"`);
      return {
        formattedText: '',
        sources: [],
        noKnowledgeFound: true,
        debugInfo: {
          query: searchString,
          matchedCount: 0,
          highestScore: scoredDocs.length > 0 ? Math.max(...scoredDocs.map(s => s.relevanceScore)) : 0
        }
      };
    }

    const sources = filtered.map(item => ({
      id: item.doc._id ? item.doc._id.toString() : item.sourceFile,
      title: item.category,
      sourceFile: item.sourceFile,
      bodyPart: item.bodyPart,
      relevanceScore: item.relevanceScore,
      relevancePercentage: item.relevancePercentage
    }));

    const formattedText = filtered.map(item => {
      const d = item.doc;
      return `[SOURCE DOCUMENT: ${item.sourceFile} | Topic: ${d.category} | Body Part: ${d.bodyPart} | Relevance: ${item.relevancePercentage}]\n${d.content}\n${d.guidance && d.guidance.length > 0 ? 'Guidance:\n• ' + d.guidance.join('\n• ') : ''}\n${d.redFlags && d.redFlags.length > 0 ? 'Red Flags:\n• ' + d.redFlags.join('\n• ') : ''}`;
    }).join('\n\n========================================\n\n');

    console.log(`[RAG Retrieval Success]: query="${searchString}" retrievedSources=[${sources.map(s => `${s.sourceFile} (${s.relevancePercentage})`).join(', ')}]`);

    return {
      formattedText,
      sources,
      noKnowledgeFound: false,
      debugInfo: {
        query: searchString,
        matchedCount: sources.length,
        sources: sources.map(s => ({ file: s.sourceFile, score: s.relevancePercentage }))
      }
    };

  } catch (err) {
    console.error('[RAG Retrieval Error]:', err.message);
    return {
      formattedText: '',
      sources: [],
      noKnowledgeFound: true,
      debugInfo: { error: err.message }
    };
  }
};
