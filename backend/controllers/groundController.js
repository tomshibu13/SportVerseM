const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Slot = require('../models/Slot');

const isObjectIdString = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(String(val).trim());

// Helper: Standard time slots generator for a single day & court
const generateDailyDefaultSlots = (groundDoc, dateStr, courtName) => {
  const basePrice = groundDoc.price_per_hour > 0 ? groundDoc.price_per_hour : 500;
  const court = courtName || 'Court 1';
  const groundId = groundDoc.ground_id || groundDoc._id;
  const groundObjId = groundDoc._id;

  const standardSchedule = [
    { start: '06:00 AM', end: '07:00 AM', multiplier: 1.0 },
    { start: '07:00 AM', end: '08:00 AM', multiplier: 1.0 },
    { start: '08:00 AM', end: '09:00 AM', multiplier: 1.0 },
    { start: '09:00 AM', end: '10:00 AM', multiplier: 1.0 },
    { start: '10:00 AM', end: '11:00 AM', multiplier: 1.0 },
    { start: '11:00 AM', end: '12:00 PM', multiplier: 1.0 },
    { start: '12:00 PM', end: '01:00 PM', multiplier: 1.0 },
    { start: '03:00 PM', end: '04:00 PM', multiplier: 1.0 },
    { start: '04:00 PM', end: '05:00 PM', multiplier: 1.0 },
    { start: '05:00 PM', end: '06:00 PM', multiplier: 1.15 },
    { start: '06:00 PM', end: '07:00 PM', multiplier: 1.25 },
    { start: '07:00 PM', end: '08:00 PM', multiplier: 1.25 },
    { start: '08:00 PM', end: '09:00 PM', multiplier: 1.25 },
    { start: '09:00 PM', end: '10:00 PM', multiplier: 1.15 },
    { start: '10:00 PM', end: '11:00 PM', multiplier: 1.0 },
  ];

  return standardSchedule.map((s) => ({
    ground_id: groundId,
    ground: groundObjId,
    court_id: court,
    date: dateStr,
    start_time: s.start,
    end_time: s.end,
    slot_time: `${s.start} - ${s.end}`,
    price: Math.round(basePrice * s.multiplier),
    status: 'Available',
  }));
};

exports.getAllGrounds = async (req, res) => {
  try {
    const { sport, search } = req.query;
    let query = {};

    if (sport && sport !== 'All') {
      query.sport_type = new RegExp(`^${sport.trim()}$`, 'i');
    }

    if (search) {
      const q = search.trim();
      query.$or = [
        { title: new RegExp(q, 'i') },
        { location: new RegExp(q, 'i') },
        { sport_type: new RegExp(q, 'i') }
      ];
    }

    const grounds = await Ground.find(query);
    return res.json({ success: true, grounds: grounds || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroundsByOwner = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (requesterRole !== 'Admin' && requesterId !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own grounds',
      });
    }

    const queryOr = [
      { owner_id: ownerId },
      { owner_id: String(ownerId) }
    ];
    if (mongoose.Types.ObjectId.isValid(ownerId)) {
      queryOr.push({ owner_id: new mongoose.Types.ObjectId(ownerId) });
    }
    const numOwnerId = parseInt(ownerId, 10);
    if (!isNaN(numOwnerId)) {
      queryOr.push({ owner_id: numOwnerId });
    }

    const grounds = await Ground.find({ $or: queryOr });
    return res.json({ success: true, grounds: grounds || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroundById = async (req, res) => {
  try {
    const paramId = req.params.id;
    const numId = parseInt(paramId, 10);

    let ground = null;
    if (isObjectIdString(paramId)) {
      ground = await Ground.findById(paramId);
    }
    if (!ground && !isNaN(numId)) {
      ground = await Ground.findOne({ ground_id: numId });
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }
    return res.json({ success: true, ground });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGround = async (req, res) => {
  try {
    const ownerId = req.user?.userId || req.body.owner_id;
    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Authentication required to create a ground' });
    }

    const title = (req.body.title || 'New Sports Complex').trim();
    const location = (req.body.location || 'City Sports Zone').trim();

    // Check duplicate ground registration for this owner
    const existingGround = await Ground.findOne({
      owner_id: ownerId,
      title: new RegExp(`^${title}$`, 'i'),
      location: new RegExp(`^${location}$`, 'i'),
    });

    if (existingGround) {
      return res.status(409).json({
        success: false,
        message: 'A facility with this name and location is already registered under your account.',
      });
    }

    // Promote user role/status in MongoDB if they are currently just a User
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      const user = await User.findById(ownerId);
      if (user && user.role !== 'Admin' && user.role !== 'GroundOwner') {
        user.role = 'GroundOwner';
        user.approvalStatus = 'Approved';
        user.isApproved = true;
        await user.save();
        console.log(`👤 User ${user.email} role updated to GroundOwner`);
      }
    }

    const sportType = req.body.sport_type || (Array.isArray(req.body.sports) ? req.body.sports[0] : req.body.sports) || 'Football';
    const pricePerHour = Number(req.body.price_per_hour || req.body.pricePerHour) || 700;
    const groundImages = req.body.images && req.body.images.length > 0
      ? req.body.images
      : [req.body.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'];

    const newGround = {
      ground_id: Date.now(),
      title,
      sport_type: sportType,
      location,
      address: req.body.address || location || 'Main Road',
      latitude: Number(req.body.latitude || req.body.lat) || 11.2588,
      longitude: Number(req.body.longitude || req.body.lng) || 75.7804,
      price_per_hour: pricePerHour,
      facilities: req.body.facilities || ['Floodlights', 'Parking'],
      images: groundImages,
      owner_id: ownerId,
      status: req.body.status || 'Approved',
      rating: 4.8,
      review_count: 0,
      available_slots: [
        { slot_id: 'n1', time: '06:00 AM - 07:00 AM', is_booked: false, price: pricePerHour },
        { slot_id: 'n2', time: '07:00 AM - 08:00 AM', is_booked: false, price: pricePerHour },
        { slot_id: 'n3', time: '08:00 AM - 09:00 AM', is_booked: false, price: pricePerHour },
        { slot_id: 'n4', time: '05:00 PM - 06:00 PM', is_booked: false, price: Math.round(pricePerHour * 1.2) },
        { slot_id: 'n5', time: '06:00 PM - 07:00 PM', is_booked: false, price: Math.round(pricePerHour * 1.2) },
      ],
    };

    const g = new Ground(newGround);
    await g.save();

    // Auto-generate initial slots in Slot collection for the upcoming 7 days
    try {
      const now = new Date();
      const courtCount = parseInt(req.body.court_count || 1, 10) || 1;
      const courts = Array.from({ length: courtCount }, (_, i) => `Court ${i + 1}`);
      const slotsToInsert = [];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = new Date();
        d.setDate(now.getDate() + dayOffset);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        for (const court of courts) {
          const defaultSlots = generateDailyDefaultSlots(g, dateStr, court);
          slotsToInsert.push(...defaultSlots);
        }
      }

      await Slot.insertMany(slotsToInsert, { ordered: false });
    } catch (slotGenErr) {
      console.warn('⚠️ Slot generation notice on ground creation:', slotGenErr.message);
    }

    return res.status(201).json({ success: true, message: 'Ground registered successfully', ground: g });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin updates ground status (Approved / Pending / Rejected)
// @route   PUT /api/grounds/:id/approve or PUT /api/grounds/:id/status
// @access  Admin
exports.approveGround = async (req, res) => {
  try {
    const groundId = req.params.id;
    const { status = 'Approved', approvalStatus } = req.body;
    const targetStatus = approvalStatus || status;
    const normalizedStatus = targetStatus === 'Active' ? 'Approved' : targetStatus;

    let ground = null;
    if (isObjectIdString(groundId)) {
      ground = await Ground.findById(groundId);
    }
    if (!ground) {
      const numId = parseInt(groundId, 10);
      if (!isNaN(numId)) {
        ground = await Ground.findOne({ ground_id: numId });
      }
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found in database' });
    }

    ground.status = normalizedStatus;
    await ground.save();

    return res.status(200).json({
      success: true,
      message: `Ground status updated to ${normalizedStatus}`,
      ground
    });
  } catch (error) {
    console.error('❌ approveGround error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin or Ground Owner deletes a sports ground from MongoDB
// @route   DELETE /api/grounds/:id
// @access  GroundOwner / Admin
exports.deleteGround = async (req, res) => {
  try {
    const groundId = req.params.id;
    let ground = null;
    if (isObjectIdString(groundId)) {
      ground = await Ground.findById(groundId);
    }
    if (!ground) {
      const numId = parseInt(groundId, 10);
      if (!isNaN(numId)) {
        ground = await Ground.findOne({ ground_id: numId });
      }
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }

    // Verify ownership
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;
    const isOwner = ground.owner_id && ground.owner_id.toString() === requesterId;

    if (requesterRole !== 'Admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to delete this ground',
      });
    }

    await Ground.findByIdAndDelete(ground._id);
    // Delete associated slots
    await Slot.deleteMany({ $or: [{ ground: ground._id }, { ground_id: ground.ground_id }] });

    return res.status(200).json({ success: true, message: 'Ground and its slots deleted successfully' });
  } catch (error) {
    console.error('❌ deleteGround error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Ground Owner updates ground details, slot prices, availability, or facilities
// @route   PUT /api/grounds/:id
// @access  GroundOwner / Admin
exports.updateGround = async (req, res) => {
  try {
    const groundId = req.params.id;
    let ground = null;
    if (isObjectIdString(groundId)) {
      ground = await Ground.findById(groundId);
    }
    if (!ground) {
      const numId = parseInt(groundId, 10);
      if (!isNaN(numId)) {
        ground = await Ground.findOne({ ground_id: numId });
      }
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found in database' });
    }

    // Verify ownership
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;
    const isOwner = ground.owner_id && ground.owner_id.toString() === requesterId;

    if (requesterRole !== 'Admin' && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to update this ground',
      });
    }

    if (req.body.title) ground.title = req.body.title;
    if (req.body.sport_type) ground.sport_type = req.body.sport_type;
    if (req.body.location) ground.location = req.body.location;
    if (req.body.address) ground.address = req.body.address;
    if (req.body.price_per_hour != null) ground.price_per_hour = Number(req.body.price_per_hour);
    if (req.body.facilities) ground.facilities = req.body.facilities;
    if (req.body.images) ground.images = req.body.images;
    if (req.body.status && requesterRole === 'Admin') ground.status = req.body.status;

    await ground.save();

    return res.status(200).json({
      success: true,
      message: 'Ground updated successfully',
      ground
    });
  } catch (error) {
    console.error('❌ updateGround error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Ground Owner Dashboard Metrics & Analytics from MongoDB
// @route   GET /api/owner/dashboard/:ownerId
// @access  GroundOwner / Admin
exports.getOwnerDashboardStats = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (requesterRole !== 'Admin' && requesterId !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access your own dashboard metrics',
      });
    }

    // 1. Get all grounds for this owner
    const queryOr = [
      { owner_id: ownerId },
      { owner_id: String(ownerId) }
    ];
    if (mongoose.Types.ObjectId.isValid(ownerId)) {
      queryOr.push({ owner_id: new mongoose.Types.ObjectId(ownerId) });
    }
    const numOwnerId = parseInt(ownerId, 10);
    if (!isNaN(numOwnerId)) {
      queryOr.push({ owner_id: numOwnerId });
    }

    const grounds = await Ground.find({ $or: queryOr });
    const activeVenuesCount = grounds.length;
    const groundIds = grounds.map(g => g._id);
    const groundNumIds = grounds.map(g => g.ground_id).filter(Boolean);
    const groundTitles = grounds.map(g => g.title).filter(Boolean);

    // 2. Get bookings for these grounds
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const bookings = await Booking.find({
      $or: [
        { ground: { $in: groundIds } },
        { ground_id: { $in: groundNumIds } },
        { ground_name: { $in: groundTitles } }
      ]
    }).populate('ground', 'title location sport_type').sort({ created_at: -1 });

    const confirmedBookings = bookings.filter(b => b.booking_status !== 'Cancelled' && b.booking_status !== 'Refunded');
    const todayBookings = confirmedBookings.filter(b => b.date === todayStr);

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const todaysRevenue = todayBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const activeBookingsCount = confirmedBookings.filter(b => b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed').length;

    // Distinct players count
    const playersSet = new Set();
    let checkedInCount = 0;
    confirmedBookings.forEach(b => {
      if (b.user_id) playersSet.add(b.user_id.toString());
      if (b.booking_status === 'Completed' || b.qr_scanned) {
        checkedInCount++;
      }
    });
    const playersTodayCount = todayBookings.map(b => b.user_id?.toString()).filter(Boolean).length;

    // Average rating
    const totalRating = grounds.reduce((sum, g) => sum + (g.rating || 0), 0);
    const avgRating = grounds.length > 0 ? (totalRating / grounds.length).toFixed(1) : '4.8';
    const totalReviews = grounds.reduce((sum, g) => sum + (g.review_count || 0), 0);

    // Court occupancy calculation
    const courtOccupancy = grounds.map(g => {
      const gBookings = todayBookings.filter(b => (b.ground && b.ground._id.toString() === g._id.toString()) || b.ground_name === g.title);
      const totalSlots = 12;
      const booked = gBookings.length;
      const percent = totalSlots > 0 ? Math.min(100, Math.round((booked / totalSlots) * 100)) : 0;
      return { label: g.title, percent, totalSlots, booked };
    });

    // Peak demand hours calculation from real booking times
    const timeFrequency = {};
    confirmedBookings.forEach(b => {
      if (b.slot_time) {
        b.slot_time.split(',').forEach(t => {
          const clean = t.trim();
          if (clean) timeFrequency[clean] = (timeFrequency[clean] || 0) + 1;
        });
      }
    });

    let peakReservationHours = '05:00 PM - 09:00 PM';
    const sortedHours = Object.entries(timeFrequency).sort((a, b) => b[1] - a[1]);
    if (sortedHours.length > 0) {
      peakReservationHours = sortedHours.slice(0, 2).map(e => e[0]).join(', ');
    }

    // Activity Feed from real bookings & check-ins
    const recentActivities = [];
    bookings.slice(0, 8).forEach(b => {
      if (b.qr_scanned && b.scanned_at) {
        recentActivities.push({
          title: 'Check-In Confirmed',
          description: `${b.user_name || 'Player'} checked in at ${b.ground?.title || b.ground_name} (${b.court_id || 'Court 1'})`,
          time: new Date(b.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          rawTime: new Date(b.scanned_at)
        });
      }
      recentActivities.push({
        title: b.booking_status === 'Completed' ? 'Completed Reservation' : (b.booking_status === 'Cancelled' ? 'Cancelled Booking' : 'New Reservation Confirmed'),
        description: `${b.user_name || 'Player'} reserved ${b.ground?.title || b.ground_name} for ${b.slot_time} (${b.date})`,
        time: b.created_at ? new Date(b.created_at).toLocaleDateString() : 'Recent',
        rawTime: b.created_at ? new Date(b.created_at) : new Date()
      });
    });

    recentActivities.sort((a, b) => b.rawTime - a.rawTime);

    return res.json({
      success: true,
      stats: {
        activeVenuesCount,
        totalRevenue,
        todaysRevenue,
        totalBookings: confirmedBookings.length,
        totalReservations: confirmedBookings.length,
        activeBookingsCount,
        playersTodayCount,
        checkedInCount,
        avgRating,
        totalReviews,
        courtOccupancy: courtOccupancy.length > 0 ? `${Math.round(courtOccupancy.reduce((acc, c) => acc + c.percent, 0) / courtOccupancy.length)}%` : '0%',
        peakReservationHours,
        recentActivities: recentActivities.slice(0, 6)
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
