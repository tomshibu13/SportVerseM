const jwt = require('jsonwebtoken');
const Ground = require('../models/Ground');
const User = require('../models/User');
const { classifyIntent, extractEntities } = require('../utils/intentRouter');
const { classifyRisk } = require('../utils/safetyEngine');
const { searchKnowledgeBase } = require('../utils/vectorRagService');
const { generateGroundedInjuryResponse, MANDATORY_DISCLAIMER } = require('../utils/ragGenerator');
const { generateGeminiContent, sanitizeOutputText } = require('../utils/geminiClient');
const {
  searchVenues,
  checkAvailability,
  createBookingDirect,
  searchProducts,
  searchTournaments,
  findPlayers,
  getUserProfile,
  getPerformanceData
} = require('../utils/sportverseTools');

/**
 * Helper to extract authenticated user from Authorization Header or Request Body
 */
function extractUserFromRequest(req) {
  try {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sportverse_super_secret_jwt_key_2026_mca_project_security');
      if (decoded) {
        return {
          userId: decoded.id || decoded.userId || decoded._id,
          email: decoded.email,
          role: decoded.role
        };
      }
    }
  } catch (_) {}

  // Fallback to request body if sent from client
  if (req.body && (req.body.userId || req.body.user)) {
    const u = req.body.user || {};
    return {
      userId: req.body.userId || u.id || u._id || u.user_id,
      email: u.email,
      role: u.role
    };
  }

  return null;
}

exports.getRecommendations = async (req, res) => {
  try {
    const { sport } = req.query;
    const filter = sport && sport !== 'All' ? { sport_type: new RegExp(sport, 'i') } : {};
    const grounds = await Ground.find(filter).limit(6);
    return res.json({
      success: true,
      recommendations: grounds,
      total: grounds.length
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.aiSearchGrounds = async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Query is required' });
    }

    const result = await searchVenues({ query });
    return res.json({
      success: true,
      query,
      results: result.grounds,
      count: result.count
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Hardened SportVerse AI Conversational Assistant
 * Specialized Sports Ecosystem Assistant (Venues, Bookings, Gear, Tournaments, Teams, Training, Performance, Injury)
 */
exports.aiAssistantChat = async (req, res) => {
  const startTime = Date.now();
  try {
    const { message, history } = req.body;
    const userMsg = (message || '').trim();

    if (!userMsg) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const authUser = extractUserFromRequest(req);
    const historyText = Array.isArray(history)
      ? history.map(h => (h.text || h.content || '')).join(' ')
      : '';

    console.log(`\n========================================================`);
    console.log(`🤖 [SportVerse AI Chat]: "${userMsg}" | User: ${authUser ? authUser.email || authUser.userId : 'Guest'}`);

    // 1. Classify Intent & Extract Entities
    const { intent, medCheck, extracted, context } = classifyIntent(userMsg, history);
    console.log(`🧭 [Intent Router]: detectedIntent="${intent}" entities=${JSON.stringify(extracted)}`);

    // ─────────────────────────────────────────────────────────────
    // INTENT 1: MEDICATION (Deterministic Safety Intercept)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'MEDICATION') {
      console.log(`🛡️ [Safety Intercept]: Medication request detected -> Deterministic Refusal`);
      return res.json({
        success: true,
        intent: 'MEDICATION',
        reply: medCheck.refusalResponse.reply,
        message: medCheck.refusalResponse.reply,
        action: null,
        data: null,
        riskLevel: null,
        isInjury: false,
        responseType: 'MEDICATION_REFUSAL',
        sources: [],
        disclaimer: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
        requiresConfirmation: false,
        suggested_actions: ['RICE protocol steps', 'When to see a doctor?', 'First aid checklist', '🏥 Injury Assistant']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 2: INJURY_HEALTH (Safety Engine -> PDF RAG -> Gemini)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'INJURY_HEALTH') {
      const userOnlyHistory = Array.isArray(history)
        ? history
            .filter(h => h.sender === 'user' || h.role === 'user')
            .map(h => (h.text || h.content || ''))
            .join(' ')
        : '';
      const userContextText = `${userOnlyHistory} ${userMsg}`.toLowerCase();
      const detectedBodyPart = extracted.bodyPart || (userContextText.includes('ankle') ? 'Ankle' : (userContextText.includes('knee') ? 'Knee' : (userContextText.includes('hamstring') ? 'Hamstring' : 'Joint/Muscle')));
      const detectedSport = extracted.sport || 'Sports';

      // 1. Run Deterministic Red-Flag Safety Engine (Evaluating USER symptoms only)
      const safetyResult = classifyRisk({
        symptoms: [userMsg],
        painLevel: userMsg.toLowerCase().includes('severe') || userMsg.toLowerCase().includes('8') || userMsg.toLowerCase().includes('9') || userMsg.toLowerCase().includes('10') || userMsg.toLowerCase().includes('cannot walk') ? 8 : (userMsg.toLowerCase().includes('mild') || userMsg.toLowerCase().includes('1') || userMsg.toLowerCase().includes('2') || userMsg.toLowerCase().includes('3') ? 3 : 5),
        bodyPart: detectedBodyPart,
        injuryMechanism: userContextText.includes('twist') ? 'Twisting' : (userContextText.includes('fall') ? 'Fall' : 'Direct Impact'),
        hasSwelling: userContextText.includes('swell') || userContextText.includes('swelling'),
        mobilityStatus: userContextText.includes("can't walk") || userContextText.includes("cannot bear weight") || userContextText.includes("can't move") ? 'None' : (userContextText.includes('limp') || userContextText.includes('hard to walk') ? 'Partial' : 'Full'),
        sport: detectedSport,
        text: userMsg
      });

      console.log(`🛡️ [Safety Engine]: riskLevel="${safetyResult.riskLevel}" redFlags=[${safetyResult.redFlags.join(', ')}]`);

      // If URGENT red flags detected -> immediate emergency directive
      if (safetyResult.riskLevel === 'URGENT') {
        const urgentReply = `🚨 **EMERGENCY MEDICAL WARNING**\n\n` +
          `Critical red flag symptoms have been detected:\n` +
          `${safetyResult.redFlags.map(rf => `• ${rf}`).join('\n')}\n\n` +
          `**Immediate Actions Required:**\n` +
          `• **Seek emergency medical care immediately** (call emergency services or visit the nearest Emergency Room).\n` +
          `• Do NOT attempt to move if head, neck, or spine trauma is suspected.\n` +
          `• Do NOT attempt to bear weight or realign any deformed limb or joint.\n` +
          `• Keep the individual calm, warm, and monitored until medical professionals arrive.`;

        return res.json({
          success: true,
          intent: 'INJURY_HEALTH',
          reply: urgentReply,
          message: urgentReply,
          action: null,
          data: null,
          riskLevel: 'URGENT',
          isInjury: true,
          responseType: 'URGENT_SAFETY',
          sources: [],
          disclaimer: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
          requiresConfirmation: false,
          suggested_actions: ['🚨 Call Emergency (112/911)', 'Find nearest hospital', 'Emergency first aid steps']
        });
      }

      // 2. Run Vector RAG over indexed knowledge PDFs
      const ragResult = await searchKnowledgeBase({
        query: userMsg,
        history: history,
        sport: detectedSport,
        bodyPart: detectedBodyPart,
        topK: 3,
        similarityThreshold: 0.45
      });

      // 3. Grounded Response Generation
      const responseResult = await generateGroundedInjuryResponse({
        userMessage: userMsg,
        ragContext: ragResult.formattedText,
        sources: ragResult.sources,
        noKnowledgeFound: ragResult.noKnowledgeFound,
        riskLevel: safetyResult.riskLevel,
        history: history
      });

      return res.json({
        success: true,
        intent: 'INJURY_HEALTH',
        reply: responseResult.answer,
        message: responseResult.answer,
        answer: responseResult.answer,
        action: null,
        data: {
          bodyPart: detectedBodyPart,
          sport: detectedSport,
          riskLevel: safetyResult.riskLevel
        },
        riskLevel: safetyResult.riskLevel,
        isInjury: true,
        responseType: 'NORMAL',
        sources: responseResult.sources,
        disclaimer: responseResult.disclaimer,
        retrieved: responseResult.retrieved,
        requiresConfirmation: false,
        suggested_actions: safetyResult.riskLevel === 'HIGH'
          ? ['How to ice properly?', 'Severe pain (8-10)', 'Cannot bear weight', 'RICE protocol steps']
          : (responseResult.sources.length > 0
            ? ['RICE protocol steps', 'When can I play again?', 'When to see a doctor?', 'Show injury prevention']
            : ['Ask about ankle sprains', 'Ask about knee pain', 'Ask about hamstring strains', '🩺 Take full assessment'])
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 3: VENUE_SEARCH (Real Grounds from MongoDB)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'VENUE_SEARCH') {
      const venueResult = await searchVenues({
        sport: extracted.sport,
        location: extracted.location,
        isCheapest: extracted.isCheapest,
        isTopRated: extracted.isTopRated,
        query: userMsg
      });

      let groundsListStr = venueResult.grounds.map(g =>
        `• **${g.title}** (${g.sport_type}) — ₹${g.price_per_hour}/hr | ⭐ ${g.rating} (${g.review_count} reviews) | 📍 ${g.location}`
      ).join('\n');

      let replyText = '';
      try {
        const systemInstruction = `You are SportVerse AI sports assistant. Summarize the real venue search results concisely with enthusiasm and sports emojis. Highlight prices and locations. Do not invent fake venues.`;
        const prompt = `User search: "${userMsg}"\nReal available venues in SportVerse database:\n${groundsListStr || 'No venues found matching exact criteria.'}\nWrite a helpful, concise recommendation.`;
        replyText = await generateGeminiContent({ systemInstruction, prompt });
      } catch (_) {
        replyText = venueResult.grounds.length > 0
          ? `🏟️ Here are verified **${extracted.sport || 'sports'}** venues available in SportVerse:\n\n${groundsListStr}\n\nTap any venue card below to view available time slots and book!`
          : `I could not find sports venues matching "${userMsg}". Check out popular grounds in Calicut like Kickoff Arena or Smash Court!`;
      }

      return res.json({
        success: true,
        intent: 'VENUE_SEARCH',
        reply: replyText,
        message: replyText,
        action: 'VIEW_VENUES',
        data: {
          grounds: venueResult.grounds,
          count: venueResult.count,
          sport: extracted.sport
        },
        riskLevel: null,
        isInjury: false,
        responseType: 'NORMAL',
        sources: [],
        requiresConfirmation: false,
        suggested_actions: [
          `Book ${venueResult.grounds[0]?.title || 'Court'}`,
          '🏸 Badminton near me',
          '⚽ Football turfs',
          'Which one is cheapest?'
        ]
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 4: BOOKING (Slot Availability & Reservation Flow)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'BOOKING') {
      const availResult = await checkAvailability({
        groundName: extracted.groundName || userMsg,
        sport: extracted.sport,
        date: extracted.date,
        time: extracted.time
      });

      if (!availResult.success || !availResult.ground) {
        return res.json({
          success: true,
          intent: 'BOOKING',
          reply: `I couldn't locate an active venue for booking. Please explore available venues first!`,
          message: `No active venue found for booking.`,
          action: 'VIEW_VENUES',
          data: null,
          riskLevel: null,
          isInjury: false,
          sources: [],
          requiresConfirmation: false,
          suggested_actions: ['🏸 Find Badminton Courts', '⚽ Book Football Turf']
        });
      }

      const ground = availResult.ground;
      const date = availResult.date;
      const slotTime = availResult.requestedTime;
      const price = ground.price_per_hour || 500;

      // Check if user is confirming a pending booking
      if (/\b(confirm|yes\s+confirm|yes\s+book|proceed\s+booking)\b/i.test(userMsg)) {
        const userId = authUser ? authUser.userId : 1;
        const userName = authUser ? authUser.email?.split('@')[0] : 'Player';
        const created = await createBookingDirect({
          userId,
          userName,
          groundId: ground.ground_id || ground._id,
          groundName: ground.title,
          sportType: ground.sport_type,
          date,
          slotTime,
          totalPrice: price
        });

        const confirmReply = `🎉 **Booking Confirmed!**\n\nYour slot at **${ground.title}** on **${date}** (${slotTime}) is secured.\n• Booking ID: \`${created.booking.booking_id}\`\n• Amount: ₹${price}\n• Status: Confirmed (Paid)\n\nShow your digital QR pass at the venue upon arrival!`;

        return res.json({
          success: true,
          intent: 'BOOKING',
          reply: confirmReply,
          message: confirmReply,
          action: 'VIEW_BOOKING',
          data: {
            booking: created.booking,
            ground: ground
          },
          riskLevel: null,
          isInjury: false,
          sources: [],
          requiresConfirmation: false,
          suggested_actions: ['View My Bookings', '🏟️ Find More Venues', '👟 Explore Gear']
        });
      }

      // Booking inquiry / availability check -> prompt user for confirmation
      const bookingReply = `⚡ **Booking Slot Available at ${ground.title}**\n\n` +
        `• **Venue**: ${ground.title} (${ground.sport_type})\n` +
        `• **Date**: ${date}\n` +
        `• **Time Slot**: ${slotTime}\n` +
        `• **Rate**: ₹${price}/hour\n` +
        `• **Location**: ${ground.location}\n\n` +
        `Would you like me to confirm this booking for you?`;

      return res.json({
        success: true,
        intent: 'BOOKING',
        reply: bookingReply,
        message: bookingReply,
        action: 'CONFIRM_BOOKING',
        data: {
          ground: ground,
          date: date,
          slotTime: slotTime,
          totalPrice: price,
          availableSlots: availResult.availableSlots
        },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: true,
        suggested_actions: [
          'Yes, confirm booking',
          'Check other slots',
          '🏟️ Find other courts'
        ]
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 5: SPORTS_GEAR (Marketplace & Equipment Recommendations)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'SPORTS_GEAR') {
      const gearResult = await searchProducts({
        category: extracted.sport || 'All',
        query: userMsg
      });

      const productListStr = gearResult.products.map(p =>
        `• **${p.title}** (${p.category}) — ₹${p.price} (Original: ₹${p.original_price || p.price}) | ⭐ ${p.rating} | Stock: ${p.stock} units`
      ).join('\n');

      let replyText = '';
      try {
        const systemInstruction = `You are SportVerse AI equipment expert. Recommend sports gear strictly using the provided real products. Provide gear selection advice without inventing nonexistent products or fake prices.`;
        const prompt = `User inquiry: "${userMsg}"\nReal available products in SportVerse Store:\n${productListStr}\nProvide a friendly, expert recommendation.`;
        replyText = await generateGeminiContent({ systemInstruction, prompt });
      } catch (_) {
        replyText = `👟 **SportVerse Equipment Recommendations**\n\n${productListStr}\n\nVisit our marketplace to order with instant delivery!`;
      }

      return res.json({
        success: true,
        intent: 'SPORTS_GEAR',
        reply: replyText,
        message: replyText,
        action: 'VIEW_PRODUCTS',
        data: {
          products: gearResult.products,
          count: gearResult.count
        },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['View in Shop', '👟 Turf Shoes', '🏸 Badminton Rackets', '⚽ Footballs']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 6: TOURNAMENT (Discover & Register for Tournaments)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'TOURNAMENT') {
      const tournamentResult = await searchTournaments({
        sport: extracted.sport,
        query: userMsg
      });

      const tourneyListStr = tournamentResult.tournaments.map(t =>
        `• 🏆 **${t.tournament_name}** (${t.sport_name || 'Sports'})\n  📅 Date: ${new Date(t.tournament_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}\n  💰 Entry: ₹${t.registration_fee} | 🎁 Prize Pool: ₹${t.prize_pool}\n  📍 Venue: ${t.venue_name || 'Calicut Sports Hub'}`
      ).join('\n\n');

      let replyText = '';
      try {
        const systemInstruction = `You are SportVerse AI tournament coordinator. Present the real upcoming tournaments and encourage the user to participate. Use sports emojis.`;
        const prompt = `User request: "${userMsg}"\nUpcoming Tournaments in database:\n${tourneyListStr}\nProvide an exciting, helpful summary.`;
        replyText = await generateGeminiContent({ systemInstruction, prompt });
      } catch (_) {
        replyText = `🏆 **Upcoming Tournaments in SportVerse**\n\n${tourneyListStr}\n\nTap below to register your team!`;
      }

      return res.json({
        success: true,
        intent: 'TOURNAMENT',
        reply: replyText,
        message: replyText,
        action: 'VIEW_TOURNAMENTS',
        data: {
          tournaments: tournamentResult.tournaments,
          count: tournamentResult.count
        },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['Register for Tournament', '⚽ Football Tournaments', '🏸 Badminton Open', '🏀 3v3 Basketball']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 7: TEAM_FINDER (Teammates & Community Matches)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'TEAM_FINDER') {
      const playerResult = await findPlayers({
        sport: extracted.sport,
        query: userMsg
      });

      const matchesListStr = playerResult.teams.map(m =>
        `• 👥 **${m.team_name}** (${m.sport})\n  🎯 Activity: ${m.activity}\n  ⏰ Time: ${m.time} | 📍 Venue: ${m.venue}\n  🟢 Spots Left: **${m.spots_left}**`
      ).join('\n\n');

      let replyText = '';
      try {
        const systemInstruction = `You are SportVerse AI community manager. Help players connect with teams and pickup games using the real community match list.`;
        const prompt = `User inquiry: "${userMsg}"\nCommunity Match Listings:\n${matchesListStr}\nProvide a welcoming, engaging reply.`;
        replyText = await generateGeminiContent({ systemInstruction, prompt });
      } catch (_) {
        replyText = `👥 **Active SportVerse Community Matches & Teammates**\n\n${matchesListStr}\n\nConnect with teams directly or post your own match request!`;
      }

      return res.json({
        success: true,
        intent: 'TEAM_FINDER',
        reply: replyText,
        message: replyText,
        action: 'CONNECT_TEAM',
        data: {
          teams: playerResult.teams,
          count: playerResult.count
        },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['Join Community Match', 'Find Badminton Players', 'Find Football Team', 'Post Match Request']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 8: TRAINING (Athletic Coaching Guidance via Gemini)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'TRAINING') {
      const systemInstruction = `You are SportVerse AI, an expert athletic performance coach.
Provide structured sports training plans, drills, warm-up routines, and technique advice.
STRICT SAFETY RULES:
- Never make medical diagnoses or prescribe medical treatment.
- Emphasize proper form, progressive overload, hydration, and adequate rest.
- Format with clear bullet points, drills, sets/reps, and coaching cues.`;

      let replyText = '';
      try {
        replyText = await generateGeminiContent({
          systemInstruction,
          prompt: `User training request: "${userMsg}"\nSport: ${extracted.sport || 'General Sports'}\nProvide a structured, practical athletic training routine.`
        });
      } catch (_) {
        replyText = `🏋️ **SportVerse Training Plan (${extracted.sport || 'Athletic Conditioning'})**\n\n` +
          `1. **Dynamic Warm-Up (10 min)**:\n   • High knees, butt kicks, arm circles, lunges with torso twists\n\n` +
          `2. **Skill & Technique Drills (25 min)**:\n   • Footwork agility ladder, fast-pace directional sprints\n   • Sport-specific stroke or ball control drills\n\n` +
          `3. **Conditioning & Stamina (15 min)**:\n   • 30s sprint intervals x 6 sets\n\n` +
          `4. **Cool-Down & Stretching (5 min)**:\n   • Hamstring, quad, and calf static stretches. Stay well hydrated!`;
      }

      return res.json({
        success: true,
        intent: 'TRAINING',
        reply: replyText,
        message: replyText,
        action: null,
        data: null,
        riskLevel: null,
        isInjury: false,
        responseType: 'NORMAL',
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['🏸 Badminton Drills', '⚽ Shooting Practice', '🏃 Warm-up Routine', '💪 Stamina Workout']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 9: PERFORMANCE (User Activity & Fitness Stats)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'PERFORMANCE') {
      const perfResult = await getPerformanceData({
        userId: authUser?.userId,
        email: authUser?.email
      });

      if (!perfResult.hasData || !perfResult.stats) {
        return res.json({
          success: true,
          intent: 'PERFORMANCE',
          reply: perfResult.message || `No performance data recorded yet. Book a session or log workouts to view your stats!`,
          message: perfResult.message,
          action: null,
          data: { hasData: false, stats: null },
          riskLevel: null,
          isInjury: false,
          sources: [],
          requiresConfirmation: false,
          suggested_actions: ['🏟️ Book a Turf', '🏋️ Start Training', '🏆 View Tournaments']
        });
      }

      const stats = perfResult.stats;
      const perfReply = `📊 **Sports Performance Summary for ${perfResult.user_name}**\n\n` +
        `• **Total Bookings**: ${stats.totalBookings} sessions\n` +
        `• **Total Activities Logged**: ${stats.totalActivitiesLogged} workouts\n` +
        `• **Play Time**: ${stats.totalPlayTimeMinutes} minutes\n` +
        `• **Calories Burned**: ${stats.totalCaloriesBurned} kcal\n` +
        `• **Favorite Sport**: ${stats.favoriteSport}`;

      return res.json({
        success: true,
        intent: 'PERFORMANCE',
        reply: perfReply,
        message: perfReply,
        action: 'VIEW_PERFORMANCE',
        data: {
          hasData: true,
          stats: stats
        },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['View My Bookings', '🏋️ Get Training Plan', '🏟️ Book Next Session']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 10: USER_PROFILE (Account & Registration Details)
    // ─────────────────────────────────────────────────────────────
    if (intent === 'USER_PROFILE') {
      const profileResult = await getUserProfile({
        userId: authUser?.userId,
        email: authUser?.email
      });

      if (!profileResult.success || !profileResult.user) {
        return res.json({
          success: true,
          intent: 'USER_PROFILE',
          reply: "You are currently browsing SportVerse in guest mode. Please log in to view your profile and personal bookings.",
          message: "Guest mode active.",
          action: 'LOGIN',
          data: null,
          riskLevel: null,
          isInjury: false,
          sources: [],
          requiresConfirmation: false,
          suggested_actions: ['Log In', '🏟️ Browse Venues', '👟 Explore Shop']
        });
      }

      const u = profileResult.user;
      const profileReply = `👤 **SportVerse Profile Details**\n\n` +
        `• **Name**: ${u.fullName}\n` +
        `• **Email**: ${u.email}\n` +
        `• **Role**: ${u.role}\n` +
        `• **Phone**: ${u.phone || 'Not set'}\n` +
        `• **Favorite Sport**: ${u.favoriteSport}\n` +
        `• **Location**: ${u.location}\n` +
        `• **Total Bookings**: ${u.bookingsCount}`;

      return res.json({
        success: true,
        intent: 'USER_PROFILE',
        reply: profileReply,
        message: profileReply,
        action: 'VIEW_PROFILE',
        data: { user: u },
        riskLevel: null,
        isInjury: false,
        sources: [],
        requiresConfirmation: false,
        suggested_actions: ['View My Bookings', 'Edit Profile', '🏟️ Book a Court']
      });
    }

    // ─────────────────────────────────────────────────────────────
    // INTENT 11: GENERAL_UNRELATED (AI Injury Assistant Fallback)
    // ─────────────────────────────────────────────────────────────
    const injuryGreeting = "👋 Hello! I am your **SportVerse AI Injury Assistant** 🏥.\n\n" +
      "I can help evaluate athletic injuries, guide you through immediate first-aid protocols (**R.I.C.E**), check recovery timelines, and assess pain levels.\n\n" +
      "How can I help you today? You can tell me:\n" +
      "• **Which body part is affected?** (e.g., Knee, Ankle, Hamstring, Shoulder, Elbow)\n" +
      "• **What happened?** (e.g., Twisting, falling, sudden pull during a sprint)\n" +
      "• **What is your pain level?** (Scale 1–10, mild, moderate, or severe)";

    return res.json({
      success: true,
      intent: 'INJURY_HEALTH',
      reply: injuryGreeting,
      message: injuryGreeting,
      action: null,
      data: null,
      riskLevel: null,
      isInjury: true,
      responseType: 'NORMAL',
      sources: [],
      requiresConfirmation: false,
      suggested_actions: [
        '🦵 Twisted Ankle & Swelling',
        '🩹 Knee Pain & Clicking',
        '🏃 Hamstring Pull / Strain',
        '🧊 Ice vs Heat Guide',
        '🩺 Start Full 1-on-1 Assessment'
      ]
    });

  } catch (error) {
    console.error('aiAssistantChat error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during chat',
      reply: "An internal server error occurred. Please try again in a moment.",
      riskLevel: null,
      sources: []
    });
  }
};
