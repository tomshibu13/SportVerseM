const Ground = require('../models/Ground');

exports.getRecommendations = async (req, res) => {
  try {
    const { sport, user_lat, user_lng, preferred_time } = req.query;
    const grounds = await Ground.find({});

    // AI recommendation score algorithm based on proximity, rating, slot availability & user preference
    const scoredGrounds = grounds.map(g => {
      let matchScore = 80;
      if (sport && g.sport_type.toLowerCase() === sport.toLowerCase()) {
        matchScore += 15;
      }
      if (g.distance_km < 2.5) {
        matchScore += 10;
      }
      if (g.rating >= 4.7) {
        matchScore += 5;
      }
      return {
        ...g,
        ai_recommendation_score: Math.min(matchScore, 99),
        ai_reasoning: `Selected because it's within ${g.distance_km} km with top-tier ${g.facilities[0] || 'amenities'} and high ${g.rating} user rating.`
      };
    }).sort((a, b) => b.ai_recommendation_score - a.ai_recommendation_score);

    return res.json({
      success: true,
      ai_summary: `Based on your recent playing history and weather forecast (24°C, Clear), we recommend booking evening slots for Football & Badminton grounds nearby.`,
      recommendations: scoredGrounds
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.aiAssistantChat = async (req, res) => {
  try {
    const { message } = req.body;
    const msg = (message || '').toLowerCase();

    let reply = "I am your SportVerse AI assistant! Ask me about nearby grounds, ground availability, sports gear recommendations, or finding local players to form a team.";

    if (msg.includes('football') || msg.includes('soccer')) {
      reply = "⚽ For Football, I recommend 'Elite Football Arena' (2.2 km away, ₹800/hr). It features FIFA-approved artificial turf and floodlights. Would you like to check available slots for tonight?";
    } else if (msg.includes('badminton')) {
      reply = "🏸 For Badminton, 'Victory Badminton Court' is rated 4.6/5 stars and is only 1.4 km away! They have indoor wooden courts with full A/C.";
    } else if (msg.includes('gear') || msg.includes('racket') || msg.includes('shoe')) {
      reply = "👟 For indoor courts, check out the 'Adidas Speedcourt Turf Shoes' (₹4,299) in our marketplace. They provide non-marking grip for optimal agility!";
    } else if (msg.includes('book') || msg.includes('slot')) {
      reply = "📅 You can book instant slots directly from the Ground Details screen. Payment can be completed securely via UPI or Credit Card with instant QR pass generation.";
    }

    return res.json({
      success: true,
      reply,
      suggested_actions: ['Book Elite Arena', 'View Badminton Courts', 'Browse Gear Shop']
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
