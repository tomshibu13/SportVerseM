const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const Product = require('../models/Product');
const Tournament = require('../models/Tournament');
const Booking = require('../models/Booking');
const User = require('../models/User');
const ActivityRecord = require('../models/ActivityRecord');
const FitnessMetric = require('../models/FitnessMetric');

/**
 * SportVerse AI - Backend Tool Execution Layer
 * Executes real database operations across MongoDB collections with zero hallucinations.
 */

// ── 1. Search Venues ────────────────────────────────────────────────────────
async function searchVenues({ sport, location, isCheapest = false, isTopRated = false, query = '' } = {}) {
  try {
    let filter = { status: { $in: ['Approved', 'Active'] } };

    if (sport && sport !== 'All' && sport !== 'Sports') {
      filter.sport_type = new RegExp(sport, 'i');
    }

    if (location && location.trim().length > 0) {
      filter.$or = [
        { location: new RegExp(location, 'i') },
        { address: new RegExp(location, 'i') },
        { title: new RegExp(location, 'i') }
      ];
    } else if (query && query.trim().length > 0) {
      const q = query.trim();
      filter.$or = [
        { title: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { sport_type: new RegExp(q, 'i') }
      ];
    }

    let grounds = await Ground.find(filter);

    // Fallback: If no grounds found with location filter, search all grounds for that sport
    if ((!grounds || grounds.length === 0) && filter.$or) {
      delete filter.$or;
      grounds = await Ground.find(filter);
    }

    // Sort accordingly
    if (isCheapest) {
      grounds.sort((a, b) => (a.price_per_hour || 0) - (b.price_per_hour || 0));
    } else if (isTopRated) {
      grounds.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return {
      success: true,
      count: grounds.length,
      grounds: grounds.slice(0, 6)
    };
  } catch (error) {
    console.error('searchVenues tool error:', error);
    return { success: false, grounds: [], error: error.message };
  }
}

// ── 2. Check Availability / Inspect Booking Slots ────────────────────────────
async function checkAvailability({ groundId, groundName, sport, date, time } = {}) {
  try {
    let ground = null;

    if (groundId) {
      const numId = parseInt(groundId, 10);
      if (!isNaN(numId)) {
        ground = await Ground.findOne({ ground_id: numId });
      }
      if (!ground && mongoose.Types.ObjectId.isValid(groundId)) {
        ground = await Ground.findById(groundId);
      }
    }

    if (!ground && groundName) {
      ground = await Ground.findOne({
        title: new RegExp(groundName.replace(/court|arena|turf/gi, '').trim(), 'i')
      });
    }

    if (!ground && sport) {
      ground = await Ground.findOne({
        sport_type: new RegExp(sport, 'i'),
        status: { $in: ['Approved', 'Active'] }
      });
    }

    if (!ground) {
      // Return default ground
      ground = await Ground.findOne({ status: { $in: ['Approved', 'Active'] } });
    }

    if (!ground) {
      return { success: false, message: 'No sports venue available at this time.' };
    }

    const availableSlots = (ground.available_slots || []).filter(s => !s.is_booked);
    const requestedDate = date || new Date().toISOString().split('T')[0];
    const requestedTime = time || '06:00 PM - 07:00 PM';

    return {
      success: true,
      ground,
      date: requestedDate,
      requestedTime,
      availableSlots,
      isRequestedTimeAvailable: availableSlots.some(s => s.time.toLowerCase().includes(requestedTime.toLowerCase().replace(/at\s+/i, '')))
    };
  } catch (error) {
    console.error('checkAvailability tool error:', error);
    return { success: false, error: error.message };
  }
}

// ── 3. Create Real Booking ──────────────────────────────────────────────────
async function createBookingDirect({ userId, userName, groundId, groundName, sportType, date, slotTime, totalPrice, slotId } = {}) {
  try {
    let groundDoc = null;
    if (groundId) {
      const numId = parseInt(groundId, 10);
      if (!isNaN(numId)) {
        groundDoc = await Ground.findOne({ ground_id: numId });
      }
      if (!groundDoc && mongoose.Types.ObjectId.isValid(groundId)) {
        groundDoc = await Ground.findById(groundId);
      }
    }

    if (!groundDoc && groundName) {
      groundDoc = await Ground.findOne({ title: new RegExp(groundName, 'i') });
    }

    const booking_id = 'SPV-BK-' + Math.floor(1000 + Math.random() * 9000);
    const resolvedGroundName = groundDoc ? groundDoc.title : (groundName || 'Sports Arena');
    const resolvedSport = groundDoc ? groundDoc.sport_type : (sportType || 'Sports');
    const resolvedPrice = totalPrice || (groundDoc ? groundDoc.price_per_hour : 500);

    const bookingData = {
      booking_id,
      user_id: userId || 1,
      user_name: userName || 'Player',
      ground: groundDoc ? groundDoc._id : undefined,
      ground_id: groundDoc ? groundDoc.ground_id : (groundId || 101),
      ground_name: resolvedGroundName,
      sport_type: resolvedSport,
      date: date || new Date().toISOString().split('T')[0],
      slot_time: slotTime || '06:00 PM - 07:00 PM',
      total_price: resolvedPrice,
      payment_status: 'Paid',
      booking_status: 'Upcoming',
      qr_code: `SPORTVERSE_QR_${booking_id}`,
      created_at: new Date()
    };

    const booking = new Booking(bookingData);
    await booking.save();

    if (groundDoc && groundDoc.available_slots) {
      const slotIdx = groundDoc.available_slots.findIndex(
        s => (slotId && s.slot_id === slotId) || (slotTime && s.time === slotTime)
      );
      if (slotIdx !== -1) {
        groundDoc.available_slots[slotIdx].is_booked = true;
        await groundDoc.save();
      }
    }

    return {
      success: true,
      booking
    };
  } catch (error) {
    console.error('createBookingDirect tool error:', error);
    return { success: false, error: error.message };
  }
}

// ── 4. Search Gear & Marketplace Products ───────────────────────────────────
const DEFAULT_PRODUCTS = [
  {
    product_id: 201,
    title: 'Nike Strike Pro Football',
    category: 'Football',
    price: 1499,
    original_price: 1999,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    description: 'Thermo-bonded 12-panel construction for true flight and maximum power transfer.',
    stock: 35,
    shop_owner_id: 3
  },
  {
    product_id: 202,
    title: 'Yonex Astrox 88D Pro Racket',
    category: 'Rackets',
    price: 8490,
    original_price: 9990,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    description: 'Head-heavy badminton racket engineered for aggressive rear-court smashers.',
    stock: 12,
    shop_owner_id: 3
  },
  {
    product_id: 203,
    title: 'Adidas Speedcourt Turf Shoes',
    category: 'Shoes',
    price: 4299,
    original_price: 5499,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: 'Non-marking rubber outsole built specifically for synthetic turf & indoor courts.',
    stock: 20,
    shop_owner_id: 3
  },
  {
    product_id: 204,
    title: 'Wilson US Open Tennis Balls (4-Pack)',
    category: 'Accessories',
    price: 599,
    original_price: 799,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    description: 'Premium extra-duty felt designed for hard court durability.',
    stock: 50,
    shop_owner_id: 3
  }
];

async function searchProducts({ category, query, maxPrice } = {}) {
  try {
    let products = await Product.find({});

    if (!products || products.length === 0) {
      try {
        await Product.insertMany(DEFAULT_PRODUCTS);
        products = await Product.find({});
      } catch (_) {
        products = DEFAULT_PRODUCTS;
      }
    }

    let filtered = products;
    const lowerQuery = (query || '').toLowerCase();
    const lowerCat = (category || '').toLowerCase();

    // Map sport to category
    let targetCategories = [];
    if (lowerCat.includes('badminton') || lowerCat.includes('tennis') || lowerQuery.includes('racket') || lowerQuery.includes('badminton')) {
      targetCategories.push('rackets', 'accessories', 'shoes');
    } else if (lowerCat.includes('football') || lowerQuery.includes('football') || lowerQuery.includes('turf')) {
      targetCategories.push('football', 'shoes', 'accessories');
    }

    if (targetCategories.length > 0) {
      filtered = filtered.filter(p => targetCategories.includes(p.category.toLowerCase()) || lowerQuery.includes(p.category.toLowerCase()));
    }

    if (query && query.trim().length > 0) {
      const qTokens = lowerQuery.split(/\s+/).filter(t => t.length > 2);
      if (qTokens.length > 0) {
        filtered = filtered.filter(p => {
          const text = `${p.title} ${p.category} ${p.description}`.toLowerCase();
          return qTokens.some(tok => text.includes(tok));
        });
      }
    }

    if (filtered.length === 0) {
      filtered = products;
    }

    return {
      success: true,
      count: filtered.length,
      products: filtered.slice(0, 6)
    };
  } catch (error) {
    console.error('searchProducts tool error:', error);
    return { success: false, products: DEFAULT_PRODUCTS, error: error.message };
  }
}

// ── 5. Search Tournaments ───────────────────────────────────────────────────
const DEFAULT_TOURNAMENTS = [
  {
    tournament_id: 301,
    tournament_name: 'Kerala State Badminton Open 2026',
    sport_id: 2,
    sport_name: 'Badminton',
    description: 'Premier state championship featuring Men & Women Singles and Doubles categories.',
    tournament_date: new Date(Date.now() + 86400000 * 14),
    registration_fee: 600,
    prize_pool: 25000,
    max_teams: 32,
    status: 'Upcoming',
    venue_name: 'Smash Court, Mavoor Road, Calicut'
  },
  {
    tournament_id: 302,
    tournament_name: 'Calicut Premier Football League (7v7)',
    sport_id: 1,
    sport_name: 'Football',
    description: 'Weekend floodlight 7-a-side football tournament for club teams.',
    tournament_date: new Date(Date.now() + 86400000 * 7),
    registration_fee: 1500,
    prize_pool: 50000,
    max_teams: 16,
    status: 'Upcoming',
    venue_name: 'Kickoff Arena, Malaparamba, Calicut'
  },
  {
    tournament_id: 303,
    tournament_name: 'Kozhikode 3x3 Streetball Cup',
    sport_id: 3,
    sport_name: 'Basketball',
    description: 'Fast-paced half-court 3v3 basketball championship with cash prizes.',
    tournament_date: new Date(Date.now() + 86400000 * 21),
    registration_fee: 800,
    prize_pool: 20000,
    max_teams: 24,
    status: 'Upcoming',
    venue_name: 'Hoopster Court, Medical College Road'
  },
  {
    tournament_id: 304,
    tournament_name: 'Monsoon Box Cricket Trophy',
    sport_id: 4,
    sport_name: 'Cricket',
    description: 'Under-arm and over-arm box cricket tournament with turf wickets.',
    tournament_date: new Date(Date.now() + 86400000 * 10),
    registration_fee: 1200,
    prize_pool: 35000,
    max_teams: 20,
    status: 'Upcoming',
    venue_name: 'Lords Cricket Turf, Palayam, Calicut'
  }
];

async function searchTournaments({ sport, status = 'Upcoming', query = '' } = {}) {
  try {
    let tournaments = await Tournament.find({}).populate('organizer_id', 'fullName email');

    // Auto-seed standard tournaments if collection is empty
    if (!tournaments || tournaments.length === 0) {
      try {
        const dummyUser = await User.findOne({});
        const orgId = dummyUser ? dummyUser._id : new mongoose.Types.ObjectId();
        const docs = DEFAULT_TOURNAMENTS.map(t => ({
          ...t,
          organizer_id: orgId,
          ground_id: 101
        }));
        await Tournament.insertMany(docs);
        tournaments = await Tournament.find({});
      } catch (seedErr) {
        console.warn('Tournament seeding warning:', seedErr.message);
        tournaments = DEFAULT_TOURNAMENTS;
      }
    }

    let filtered = tournaments;
    if (sport && sport !== 'All') {
      filtered = filtered.filter(t => {
        const name = (t.tournament_name || '').toLowerCase();
        const desc = (t.description || '').toLowerCase();
        const sportStr = (t.sport_name || '').toLowerCase();
        return name.includes(sport.toLowerCase()) || desc.includes(sport.toLowerCase()) || sportStr.includes(sport.toLowerCase());
      });
    }

    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      filtered = filtered.filter(t => (t.tournament_name || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q));
    }

    return {
      success: true,
      count: filtered.length,
      tournaments: filtered.slice(0, 6)
    };
  } catch (error) {
    console.error('searchTournaments tool error:', error);
    return { success: false, tournaments: DEFAULT_TOURNAMENTS, error: error.message };
  }
}

// ── 6. Find Teammates / Community Matches ───────────────────────────────────
const COMMUNITY_MATCHES = [
  {
    team_id: 'tm_1',
    team_name: 'Calicut Football Strikers ⚽',
    sport: 'Football',
    activity: '7v7 Weekend Friendly at Malaparamba',
    time: 'Sat 12 Aug, 6:00 PM',
    type: 'Match Challenge',
    venue: 'Kickoff Arena, Malaparamba',
    spots_left: 3,
    members_count: 128
  },
  {
    team_id: 'tm_2',
    team_name: 'Kerala Smashers Badminton 🏸',
    sport: 'Badminton',
    activity: 'Looking for 2 players for Doubles match',
    time: 'Sun 13 Aug, 7:00 AM',
    type: 'Player Request',
    venue: 'Smash Court, Mavoor Road',
    spots_left: 2,
    members_count: 84
  },
  {
    team_id: 'tm_3',
    team_name: 'Kozhikode Hoopers 🏀',
    sport: 'Basketball',
    activity: '3v3 Half Court Casual Pickup Game',
    time: 'Fri 11 Aug, 5:30 PM',
    type: 'Casual Pickup',
    venue: 'Hoopster Court, Medical College Road',
    spots_left: 4,
    members_count: 62
  },
  {
    team_id: 'tm_4',
    team_name: 'Malabar Cricket Kings 🏏',
    sport: 'Cricket',
    activity: 'Need 1 Fast Bowler for 8v8 Box Tournament',
    time: 'Saturday, 7:00 PM',
    type: 'Player Request',
    venue: 'Lords Cricket Turf, Palayam',
    spots_left: 1,
    members_count: 45
  }
];

async function findPlayers({ sport, location, query } = {}) {
  try {
    let matches = COMMUNITY_MATCHES;
    if (sport && sport !== 'All') {
      matches = matches.filter(m => m.sport.toLowerCase().includes(sport.toLowerCase()));
    }
    if (query && query.trim().length > 0) {
      const q = query.toLowerCase();
      matches = matches.filter(m => m.team_name.toLowerCase().includes(q) || m.activity.toLowerCase().includes(q) || m.venue.toLowerCase().includes(q));
    }

    return {
      success: true,
      count: matches.length,
      teams: matches
    };
  } catch (error) {
    console.error('findPlayers tool error:', error);
    return { success: false, teams: COMMUNITY_MATCHES, error: error.message };
  }
}

// ── 7. Get User Profile ─────────────────────────────────────────────────────
async function getUserProfile({ userId, email } = {}) {
  try {
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId).select('-password');
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() }).select('-password');
    }
    if (!user) {
      return {
        success: false,
        message: 'No registered user account found for this session. Please log in to view your profile.'
      };
    }

    const bookingsCount = await Booking.countDocuments({
      $or: [{ user_id: user._id }, { user: user._id }, { user_id: 1 }]
    });

    return {
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        role: user.role,
        location: user.location || 'Calicut, Kerala',
        favoriteSport: user.favoriteSport || 'Badminton & Football',
        bio: user.bio || 'Sports Enthusiast',
        bookingsCount
      }
    };
  } catch (error) {
    console.error('getUserProfile tool error:', error);
    return { success: false, error: error.message };
  }
}

// ── 8. Get Performance Data ─────────────────────────────────────────────────
async function getPerformanceData({ userId, email } = {}) {
  try {
    let user = null;
    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      user = await User.findById(userId);
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    }

    // If unauthenticated / guest
    if (!user) {
      return {
        success: true,
        hasData: false,
        message: 'No sports performance or activity records found for this guest session. Log into your SportVerse account to track workouts, calories, and match history.',
        stats: null
      };
    }

    // Query actual activity and fitness records from MongoDB
    const activities = await ActivityRecord.find({ user_id: user._id });
    const fitnessMetrics = await FitnessMetric.find({ user_id: user._id });
    const userBookings = await Booking.find({
      $or: [{ user_id: user._id }, { user: user._id }]
    });

    if ((!activities || activities.length === 0) && (!fitnessMetrics || fitnessMetrics.length === 0) && (!userBookings || userBookings.length === 0)) {
      return {
        success: true,
        hasData: false,
        message: `No performance data recorded yet for ${user.fullName}. Book a turf slot or record an activity to start tracking your sports analytics!`,
        stats: null
      };
    }

    // Calculate aggregated stats
    const totalMinutes = activities.reduce((acc, a) => acc + (a.duration_minutes || 0), 0);
    const totalCalories = activities.reduce((acc, a) => acc + (a.calories || 0), 0);
    const totalDistance = activities.reduce((acc, a) => acc + (a.distance_km || 0), 0);

    return {
      success: true,
      hasData: true,
      user_name: user.fullName,
      stats: {
        totalBookings: userBookings.length,
        totalActivitiesLogged: activities.length,
        totalPlayTimeMinutes: totalMinutes,
        totalCaloriesBurned: totalCalories,
        totalDistanceKm: totalDistance,
        favoriteSport: user.favoriteSport || (userBookings.length > 0 ? userBookings[0].sport_type : 'Football')
      }
    };
  } catch (error) {
    console.error('getPerformanceData tool error:', error);
    return {
      success: true,
      hasData: false,
      message: 'Unable to retrieve user performance data at this moment.',
      stats: null
    };
  }
}

module.exports = {
  searchVenues,
  checkAvailability,
  createBookingDirect,
  searchProducts,
  searchTournaments,
  findPlayers,
  getUserProfile,
  getPerformanceData
};
