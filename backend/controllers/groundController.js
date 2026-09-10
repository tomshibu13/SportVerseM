const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const User = require('../models/User');
const Booking = require('../models/Booking');

const isObjectIdString = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(String(val).trim());

const seedGroundsIfEmpty = async () => {
  // Seeding disabled
};

exports.seedGroundsIfEmpty = seedGroundsIfEmpty;

exports.getAllGrounds = async (req, res) => {
  try {
    const { sport, search } = req.query;
    await seedGroundsIfEmpty();
    let grounds = await Ground.find();

    if (sport && sport !== 'All') {
      grounds = grounds.filter(g => (g.sport_type || '').toLowerCase() === sport.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      grounds = grounds.filter(g =>
        (g.title || '').toLowerCase().includes(q) ||
        (g.location || '').toLowerCase().includes(q) ||
        (g.sport_type || '').toLowerCase().includes(q)
      );
    }

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
        user.approvalStatus = 'Pending';
        user.isApproved = false;
        await user.save();
        console.log(`👤 Promoted user ${user.email} to GroundOwner (Pending Approval)`);
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
      status: req.body.status || 'Pending',
      rating: 4.8,
      review_count: 0,
      available_slots: req.body.available_slots || [
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
      const Slot = require('../models/Slot');
      const now = new Date();
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

      const courtCount = parseInt(req.body.court_count || 1, 10) || 1;
      const courts = Array.from({ length: courtCount }, (_, i) => `Court ${i + 1}`);
      const slotsToInsert = [];

      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const d = new Date();
        d.setDate(now.getDate() + dayOffset);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

        for (const court of courts) {
          for (const s of standardSchedule) {
            slotsToInsert.push({
              ground_id: g.ground_id,
              ground: g._id,
              court_id: court,
              date: dateStr,
              start_time: s.start,
              end_time: s.end,
              slot_time: `${s.start} - ${s.end}`,
              price: Math.round(pricePerHour * s.multiplier),
              status: 'Available',
            });
          }
        }
      }

      await Slot.insertMany(slotsToInsert, { ordered: false });
    } catch (slotGenErr) {
      console.warn('⚠️ Slot generation notice on ground creation:', slotGenErr.message);
    }

    return res.status(201).json({ success: true, message: 'Ground registered successfully in MongoDB', ground: g });
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
      return res.status(404).json({ success: false, message: 'Ground not found in MongoDB database' });
    }

    ground.status = normalizedStatus;
    await ground.save();

    // Also update owner approval if ground is approved
    if (ground.owner_id && isObjectIdString(String(ground.owner_id))) {
      const owner = await User.findById(ground.owner_id);
      if (owner && normalizedStatus === 'Approved') {
        owner.approvalStatus = 'Approved';
        owner.isApproved = true;
        await owner.save();
      }
    }

    console.log(`🏟️ Ground ${ground.title} (${ground._id}) status updated to ${normalizedStatus} in MongoDB!`);

    return res.status(200).json({
      success: true,
      message: `Ground status updated to ${normalizedStatus} in MongoDB`,
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
      return res.status(404).json({ success: false, message: 'Ground not found in MongoDB' });
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

    console.log(`🗑️ Ground ${ground.title} deleted from MongoDB database!`);
    return res.status(200).json({ success: true, message: 'Ground deleted successfully from MongoDB' });
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
      return res.status(404).json({ success: false, message: 'Ground not found in MongoDB database' });
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
    if (req.body.available_slots) ground.available_slots = req.body.available_slots;
    if (req.body.images) ground.images = req.body.images;
    if (req.body.status && requesterRole === 'Admin') ground.status = req.body.status;

    await ground.save();
    console.log(`🏟️ Ground ${ground.title} (${ground._id}) updated successfully!`);

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

    // 2. Get today's bookings for these grounds
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const bookings = await Booking.find({
      $or: [
        { ground: { $in: groundIds } },
        { ground_id: { $in: groundNumIds } },
        { ground_name: { $in: grounds.map(g => g.title) } }
      ]
    }).populate('ground', 'title');

    const confirmedBookings = bookings.filter(b => b.booking_status !== 'Cancelled' && b.booking_status !== 'Refunded');
    const todayBookings = confirmedBookings.filter(b => b.date === todayStr);

    const totalRevenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const todaysRevenue = todayBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);
    const activeBookingsCount = todayBookings.length;

    // players today (unique user_ids in todayBookings)
    const playersSet = new Set();
    let checkedInCount = 0;
    confirmedBookings.forEach(b => {
      if (b.user_id) playersSet.add(b.user_id.toString());
      if (b.booking_status === 'Completed' || b.qr_scanned) {
        checkedInCount++;
      }
    });
    const playersTodayCount = playersSet.size;

    // Average rating
    const totalRating = grounds.reduce((sum, g) => sum + (g.rating || 0), 0);
    const avgRating = grounds.length > 0 ? (totalRating / grounds.length).toFixed(1) : '0.0';
    const totalReviews = grounds.reduce((sum, g) => sum + (g.review_count || 0), 0);

    const courtOccupancy = grounds.map(g => {
      const gBookings = todayBookings.filter(b => (b.ground && b.ground._id.toString() === g._id.toString()) || b.ground_name === g.title);
      const totalSlots = g.available_slots ? g.available_slots.length : 10;
      const booked = gBookings.length;
      const percent = totalSlots > 0 ? Math.min(100, Math.round((booked / totalSlots) * 100)) : 0;
      return { label: g.title, percent, totalSlots, booked };
    });

    // Today's Activity Feed
    const recentActivity = [];
    todayBookings.sort((a, b) => new Date(b.created_at || Date.now()) - new Date(a.created_at || Date.now())).slice(0, 6).forEach(b => {
      recentActivity.push({
        time: b.created_at ? new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Today',
        event: `New booking: ${b.slot_time} at ${b.ground ? b.ground.title : b.ground_name}`,
        type: 'booking',
        rawTime: b.created_at ? new Date(b.created_at) : new Date()
      });
      if (b.qr_scanned && b.scanned_at) {
        recentActivity.push({
          time: new Date(b.scanned_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          event: `${b.user_name || 'Player'} checked in — ${b.ground ? b.ground.title : b.ground_name}`,
          type: 'checkin',
          rawTime: new Date(b.scanned_at)
        });
      }
    });
    recentActivity.sort((a, b) => b.rawTime - a.rawTime);

    // Upcoming slots today
    const upcomingSlots = todayBookings
      .filter(b => b.booking_status === 'Upcoming')
      .map(b => ({
        time: b.slot_time,
        player: `Booked – ${b.user_name || 'Player'}`,
        court: b.ground ? b.ground.title : b.ground_name,
        status: 'confirmed'
      }));

    return res.json({
      success: true,
      stats: {
        activeVenuesCount,
        totalRevenue,
        todaysRevenue,
        activeBookingsCount,
        totalReservations: confirmedBookings.length,
        playersTodayCount,
        checkedInCount,
        avgRating,
        totalReviews,
        courtOccupancy,
        recentActivity: recentActivity.slice(0, 6),
        upcomingSlots
      }
    });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
