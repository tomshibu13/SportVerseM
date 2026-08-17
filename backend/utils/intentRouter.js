const { checkMedicationSafety } = require('./medicationSafetyService');

/**
 * SportVerse AI - Advanced Deterministic & Context-Aware Intent Router
 * Classifies user chat messages into one of 11 strict intents:
 * 1. MEDICATION
 * 2. INJURY_HEALTH
 * 3. BOOKING
 * 4. VENUE_SEARCH
 * 5. SPORTS_GEAR
 * 6. TOURNAMENT
 * 7. TEAM_FINDER
 * 8. TRAINING
 * 9. PERFORMANCE
 * 10. USER_PROFILE
 * 11. GENERAL_UNRELATED
 */

// 1. Injury & Sports-Health Keyword Patterns
const INJURY_PATTERNS = [
  /\b(injury|injuries|injured|injuring|hurt|hurts|hurting|pain|painful|ache|aching|aches|sore|soreness|wound|damage)\b/i,
  /\b(knee|ankle|wrist|foot|feet|leg|legs|shoulder|elbow|hamstring|calf|calves|groin|back|neck|thigh|shin|hip|quad|muscle|joint|tendon|ligament|bone|heel|toe|finger|spine)\b/i,
  /\b(sprain|sprains|sprained|spraining|strain|strains|strained|straining|tear|tears|torn|twist|twists|twisted|twisting|pull|pulls|pulled|pulling|rupture|ruptured|fracture|fractured|dislocat(ed|ion)?|swelling|swollen|bruis(e|ed|ing)?|cramp|cramps|cramping|popping|clicking|locked)\b/i,
  /\b(acl|mcl|pcl|lcl|meniscus|rotator\s+cuff|achilles|tendonitis|tendinopathy|plantar\s+fasciitis|shin\s+splints|runner'?s\s+knee|tennis\s+elbow|golfer'?s\s+elbow)\b/i,
  /\b(concussion|head\s+(injury|trauma|blow|impact)|dizzy|dizziness|loss\s+of\s+consciousness)\b/i,
  /\b(heat\s+(exhaustion|stroke|illness|cramp)|dehydration|dehydrated|severe\s+thirst)\b/i,
  /\b(cannot\s+(walk|bear\s+weight|move)|can't\s+(walk|bear\s+weight|move)|walk\s+with\s+support|bear\s+weight|limp|limping)\b/i,
  /\b(rice\s+protocol|first\s+aid|injury\s+recovery|healing\s+time|return\s+to\s+sport|when\s+can\s+i\s+play|ice\s+vs\s+heat|cold\s+pack|heating\s+pad|ice\s+or\s+heat)\b/i,
  /\b(pain\s+(is|in|level|scale|\d|severe|mild|moderate)|hurt(s|ing)?\s+(my|in|when))\b/i,
  /\b(sports\s+injury|injury\s+assessment|rehab(ilitation)?\s+exercises?|physio(therapy)?)\b/i
];

// 2. Booking Patterns
const BOOKING_PATTERNS = [
  /\b(book|booking|reserve|reservation|schedule\s+a\s+(slot|court|turf)|confirm\s+booking|reserve\s+(a\s+)?slot)\b/i,
  /\bbook\s+(a\s+)?(badminton|football|cricket|tennis|basketball|turf|court|ground|slot)\b/i,
  /\b(book|reserve)\s+(tomorrow|today|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i,
  /\b(book|reserve)\s+at\s+\d{1,2}(:\d{2})?\s*(am|pm)?\b/i
];

// 3. Venue Search Patterns
const VENUE_PATTERNS = [
  /\b(find|search|show|lookup|list|where|nearby|near\s+me|available|locate)\b.*\b(court|courts|turf|turfs|ground|grounds|stadium|pitch|arena|complex|venue|venues)\b/i,
  /\b(find|search|show|lookup|list)\b.*\b(badminton|football|cricket|tennis|basketball)\b/i,
  /\b(badminton\s+courts?|football\s+turfs?|cricket\s+grounds?|tennis\s+courts?|basketball\s+courts?|sports\s+venues?|sports\s+complex)\b/i,
  /\b(courts?|turfs?|grounds?)\s+(near\s+me|in\s+calicut|in\s+kozhikode|nearby)\b/i
];

// 4. Sports Gear / Marketplace Patterns
const GEAR_PATTERNS = [
  /\b(racket|racquet|rackets|racquets|bat|bats|ball|balls|shoes|boots|jersey|jerseys|gloves|gear|equipment|kit|cleats|shuttlecock|shuttlecocks|grip|apparel)\b/i,
  /\b(which|what|best)\b.*\b(buy|purchase|racket|shoes|boots|ball|gear|equipment)\b/i,
  /\b(marketplace|sports\s+shop|buy\s+(a\s+)?|store|price\s+of\s+(shoes|racket|ball))\b/i
];

// 5. Tournament Patterns
const TOURNAMENT_PATTERNS = [
  /\b(tournament|tournaments|league|leagues|championship|championships|cup|trophy|contest|fixtures?|schedules?|tournament\s+registration|prize\s+pool)\b/i,
  /\b(find|search|upcoming|show)\b.*\b(tournament|tournaments|leagues?|championship)\b/i
];

// 6. Team / Teammate Finder Patterns
const TEAM_FINDER_PATTERNS = [
  /\b(teammate|teammates|partner|partners|find\s+players?|need\s+a\s+player|looking\s+for\s+(players?|striker|keeper|goalkeeper|defender|doubles\s+partner))\b/i,
  /\b(find\s+team|join\s+team|pickup\s+game|pickup\s+match|community\s+match|match\s+challenge|sports\s+community)\b/i,
  /\bfind\s+players?\s+for\s+(badminton|football|cricket|basketball|tennis)\b/i
];

// 7. Training / Drills Patterns
const TRAINING_PATTERNS = [
  /\b(training\s+plan|training\s+routine|drills?|workout\s+plan|workout\s+routine|athletic\s+conditioning|warmup\s+routine|warm\s+up\s+drills?|cool\s+down\s+routine)\b/i,
  /\b(give\s+me\s+a|suggest\s+a|show\s+me\s+a)\b.*\b(training|workout|drill|routine|practice)\b/i,
  /\b(how\s+to\s+improve|technique\s+for|smash\s+technique|footwork\s+drills?|shooting\s+drills?|batting\s+drills?)\b/i
];

// 8. Performance & Activity Stats Patterns
const PERFORMANCE_PATTERNS = [
  /\b(my\s+performance|my\s+stats|my\s+activity|my\s+fitness|my\s+records|my\s+history|calories\s+burned|how\s+many\s+games|my\s+analytics|show\s+my\s+sports\s+performance|fitness\s+metrics|fitness\s+data|workout\s+history)\b/i,
  /\b(show\s+my|how\s+is\s+my)\b.*\b(performance|stats|activity|records|calories)\b/i
];

// 9. User Profile Patterns
const PROFILE_PATTERNS = [
  /\b(my\s+profile|who\s+am\s+i|my\s+account|my\s+user\s+details|my\s+registered\s+details|my\s+bookings|my\s+role|my\s+phone\s+number)\b/i
];

// Sports Entity Keyword List
const SPORTS_ENTITIES = ['football', 'badminton', 'cricket', 'basketball', 'tennis', 'swimming', 'volleyball', 'soccer', 'running'];

/**
 * Classify user intent deterministically with multi-turn context awareness
 * @param {string} userMsg - Current user message
 * @param {Array} history - Conversation history
 * @returns {object} { intent, medCheck, extracted, context }
 */
function classifyIntent(userMsg = '', history = []) {
  const msg = (userMsg || '').trim();
  const lowerMsg = msg.toLowerCase();

  // Extract entities
  const extracted = extractEntities(msg);

  // Analyze active conversation context from history
  const context = analyzeHistoryContext(history);

  // ─────────────────────────────────────────────────────────────
  // 1. Check MEDICATION intent first (Highest priority safety gate)
  // ─────────────────────────────────────────────────────────────
  const medCheck = checkMedicationSafety(msg, history);
  if (medCheck.isMedicationRequest) {
    return {
      intent: 'MEDICATION',
      medCheck,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Check INJURY_HEALTH intent
  // ─────────────────────────────────────────────────────────────
  const isDirectInjuryMatch = INJURY_PATTERNS.some(regex => regex.test(msg));
  const isActiveInjuryContext = context.lastIntent === 'INJURY_HEALTH' && (
    context.isAwaitingTriage ||
    /\b(\d+|mild|moderate|severe|yes|no|can'?t|swollen|swelling|better|worse|ice|rest)\b/i.test(msg)
  );

  if (isDirectInjuryMatch || isActiveInjuryContext) {
    return {
      intent: 'INJURY_HEALTH',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Check PERFORMANCE Stats Intent
  // ─────────────────────────────────────────────────────────────
  if (PERFORMANCE_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'PERFORMANCE',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Check USER PROFILE Intent
  // ─────────────────────────────────────────────────────────────
  if (PROFILE_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'USER_PROFILE',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 5. Check BOOKING Intent
  // ─────────────────────────────────────────────────────────────
  const isDirectBookingMatch = BOOKING_PATTERNS.some(regex => regex.test(msg));
  const isFollowUpBooking = (context.lastIntent === 'VENUE_SEARCH' || context.lastIntent === 'BOOKING') && (
    /\b(book\s+(it|this|that|the|first|second|cheapest)|yes\s+confirm|confirm|book\s+slot|slot\s+\d|at\s+\d{1,2}(:\d{2})?\s*(am|pm)?)\b/i.test(msg)
  );

  if (isDirectBookingMatch || isFollowUpBooking) {
    return {
      intent: 'BOOKING',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 6. Check TRAINING / Drills Intent
  // ─────────────────────────────────────────────────────────────
  if (TRAINING_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'TRAINING',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 7. Check TOURNAMENT Discovery Intent
  // ─────────────────────────────────────────────────────────────
  if (TOURNAMENT_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'TOURNAMENT',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 8. Check TEAM / PLAYER FINDER Intent
  // ─────────────────────────────────────────────────────────────
  if (TEAM_FINDER_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'TEAM_FINDER',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 9. Check SPORTS GEAR / Marketplace Intent
  // ─────────────────────────────────────────────────────────────
  if (GEAR_PATTERNS.some(regex => regex.test(msg))) {
    return {
      intent: 'SPORTS_GEAR',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 10. Check VENUE SEARCH Intent
  // ─────────────────────────────────────────────────────────────
  const isDirectVenueMatch = VENUE_PATTERNS.some(regex => regex.test(msg));
  const isFollowUpVenue = context.lastIntent === 'VENUE_SEARCH' && (
    /\b(which\s+(one\s+)?is\s+(cheapest|best|closest|top\s+rated|near)|cheapest|cheaper|closer|closest|show\s+more|in\s+malaparamba|in\s+mavoor|filter\s+by)\b/i.test(msg)
  );

  if (isDirectVenueMatch || isFollowUpVenue) {
    return {
      intent: 'VENUE_SEARCH',
      medCheck: null,
      extracted,
      context
    };
  }

  // Check generic sports query (e.g. "tell me about football rules" or "badminton scoring")
  if (SPORTS_ENTITIES.some(s => lowerMsg.includes(s)) && /\b(rules?|how\s+to\s+play|scoring|court\s+dimensions|history)\b/i.test(msg)) {
    return {
      intent: 'TRAINING',
      medCheck: null,
      extracted,
      context
    };
  }

  // ─────────────────────────────────────────────────────────────
  // 11. GENERAL UNRELATED
  // ─────────────────────────────────────────────────────────────
  return {
    intent: 'GENERAL_UNRELATED',
    medCheck: null,
    extracted,
    context
  };
}

/**
 * Helper to extract entities from user query
 */
function extractEntities(text = '') {
  const lower = text.toLowerCase();

  // Sport detection
  let detectedSport = null;
  for (const s of SPORTS_ENTITIES) {
    if (lower.includes(s)) {
      detectedSport = s.charAt(0).toUpperCase() + s.slice(1);
      break;
    }
  }

  // Date detection
  let detectedDate = null;
  if (lower.includes('today') || lower.includes('tonight')) {
    detectedDate = new Date().toISOString().split('T')[0];
  } else if (lower.includes('tomorrow')) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    detectedDate = d.toISOString().split('T')[0];
  } else {
    const dateMatch = lower.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) detectedDate = dateMatch[0];
  }

  // Time detection
  let detectedTime = null;
  const timeMatch = lower.match(/\b(\d{1,2}(:\d{2})?)\s*(am|pm)\b/i) || lower.match(/\b(at\s+\d{1,2})\s*(am|pm)?\b/i);
  if (timeMatch) {
    detectedTime = timeMatch[0].replace(/^at\s+/i, '').trim();
    if (!detectedTime.toLowerCase().includes('am') && !detectedTime.toLowerCase().includes('pm')) {
      // Default to PM if time between 1 and 11 and not specified
      const hourNum = parseInt(detectedTime, 10);
      if (hourNum >= 1 && hourNum <= 11) {
        detectedTime = `${hourNum}:00 PM`;
      }
    }
  }

  // Price preferences
  let isCheapest = /\b(cheapest|lowest\s+price|budget|least\s+expensive)\b/i.test(lower);
  let isTopRated = /\b(top\s+rated|best\s+rated|highest\s+rating|best)\b/i.test(lower);

  // Body part detection (for injury triage)
  const bodyParts = ['ankle', 'knee', 'shoulder', 'wrist', 'hamstring', 'head', 'elbow', 'foot', 'thigh', 'back', 'neck', 'groin', 'calf', 'finger', 'shin'];
  const detectedBodyPart = bodyParts.find(b => lower.includes(b));

  return {
    sport: detectedSport,
    date: detectedDate,
    time: detectedTime,
    isCheapest,
    isTopRated,
    bodyPart: detectedBodyPart
  };
}

/**
 * Analyzes conversation history for multi-turn state
 */
function analyzeHistoryContext(history = []) {
  if (!Array.isArray(history) || history.length === 0) {
    return {
      lastIntent: null,
      lastSport: null,
      isAwaitingTriage: false,
      lastGrounds: []
    };
  }

  // Inspect last 3 messages
  const recent = history.slice(-3);
  let lastIntent = null;
  let lastSport = null;
  let isAwaitingTriage = false;

  for (let i = recent.length - 1; i >= 0; i--) {
    const item = recent[i];
    if (item.intent) {
      lastIntent = item.intent;
      break;
    }
  }

  const recentAssistant = recent.find(m => m.role === 'assistant' || m.sender === 'ai');
  if (recentAssistant && recentAssistant.text) {
    const text = recentAssistant.text.toLowerCase();
    if (text.includes('scale of 1–10') || text.includes('bear weight') || text.includes('rice protocol') || text.includes('sports injury guidance')) {
      isAwaitingTriage = true;
    }
  }

  return {
    lastIntent,
    lastSport,
    isAwaitingTriage
  };
}

module.exports = {
  classifyIntent,
  extractEntities
};
