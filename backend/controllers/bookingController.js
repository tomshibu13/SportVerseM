const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ground = require('../models/Ground');
const Slot = require('../models/Slot');
const User = require('../models/User');
const { sendBookingApprovalEmail } = require('../utils/emailService');

const isObjectIdString = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

// Helper: Normalize time string for robust matching
const normalizeTimeSlot = (slotTimeStr) => {
  if (!slotTimeStr) return '';
  return slotTimeStr.replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim().toLowerCase();
};

// @desc    Get all bookings (admin dashboard)
// @route   GET /api/bookings
// @access  Admin
exports.getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate('user', 'fullName email phone')
      .populate('ground', 'title sport_type location')
      .sort({ created_at: -1 });
    return res.json({ success: true, bookings: bookings || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for an owner's venues
// @route   GET /api/bookings/owner/:ownerId
// @access  GroundOwner / Admin
exports.getOwnerBookings = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (requesterRole !== 'Admin' && requesterId !== ownerId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only access bookings for your own grounds',
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
    const groundIds = grounds.map(g => g._id);
    const groundNumIds = grounds.map(g => g.ground_id).filter(Boolean);
    const groundTitles = grounds.map(g => g.title).filter(Boolean);

    const bookings = await Booking.find({
      $or: [
        { ground: { $in: groundIds } },
        { ground_id: { $in: groundNumIds } },
        { ground_name: { $in: groundTitles } }
      ]
    })
    .populate('user', 'fullName email phone')
    .populate('ground', 'title sport_type location')
    .sort({ created_at: -1 });

    return res.json({ success: true, bookings: bookings || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new court booking
// @route   POST /api/bookings
// @access  Private
exports.createBooking = async (req, res) => {
  try {
    const requesterUserId = req.user?.userId || req.body.user_id;
    const { user_name, ground_id, ground_name, sport_type, date, slot_time, total_price, slot_id, court_id } = req.body;
    const booking_id = 'SPV-BK-' + Math.floor(1000 + Math.random() * 9000);
    const court = (court_id || 'Court 1').trim();

    // 0. Validate booking date
    const now = new Date();
    const todayLocalStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const bookingDateStr = date || todayLocalStr;

    if (bookingDateStr < todayLocalStr) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book a court slot for a past date. Please select today or a future date.'
      });
    }

    if (bookingDateStr === todayLocalStr && slot_time) {
      try {
        const timePart = slot_time.split('-')[0].trim();
        const match = timePart.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
        if (match) {
          let hour = parseInt(match[1], 10);
          const minute = parseInt(match[2], 10);
          const ampm = match[3] ? match[3].toUpperCase() : null;
          if (ampm === 'PM' && hour < 12) hour += 12;
          if (ampm === 'AM' && hour === 12) hour = 0;

          const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
          if (slotDateTime < now) {
            return res.status(400).json({
              success: false,
              message: 'This time slot has already passed for today. Please select an upcoming slot.'
            });
          }
        }
      } catch (e) {
        console.warn('Slot time validation parse warning:', e);
      }
    }

    // 1. Look up normalized Ground document
    let groundDoc = null;
    if (ground_id) {
      if (isObjectIdString(String(ground_id))) {
        groundDoc = await Ground.findById(ground_id);
      }
      if (!groundDoc) {
        const parsedGroundId = parseInt(ground_id, 10);
        if (!isNaN(parsedGroundId)) {
          groundDoc = await Ground.findOne({ ground_id: parsedGroundId });
        }
      }
    }
    if (!groundDoc && ground_name) {
      groundDoc = await Ground.findOne({ title: new RegExp(`^${ground_name.trim()}$`, 'i') });
    }

    if (!groundDoc) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }

    // 2. Look up normalized User document
    let userDoc = null;
    if (requesterUserId && isObjectIdString(String(requesterUserId))) {
      userDoc = await User.findById(requesterUserId);
    }
    if (!userDoc && req.body.email) {
      userDoc = await User.findOne({ email: req.body.email.trim().toLowerCase() });
    }
    if (!userDoc && user_name && user_name !== 'Player' && user_name !== 'Player One' && user_name !== 'Guest User') {
      userDoc = await User.findOne({ fullName: new RegExp(`^${user_name.trim()}$`, 'i') });
    }

    const resolvedGroundName = groundDoc ? groundDoc.title : (ground_name || 'Sports Ground');
    const resolvedSportType = sport_type || (groundDoc ? groundDoc.sport_type : 'Football');
    const resolvedUserName = user_name || (userDoc ? userDoc.fullName : 'Player');
    const resolvedPrice = Number(total_price) || (groundDoc ? groundDoc.price_per_hour : 800);
    const resolvedUserId = userDoc ? String(userDoc._id) : String(requesterUserId || '1');

    // 3. Prevent double bookings / check slot availability
    const targetDate = bookingDateStr;
    const incomingSlots = (slot_time || '').split(',').map(s => s.trim()).filter(Boolean);

    if (incomingSlots.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one slot time is required' });
    }

    const groundMatchQuery = [
      { ground: groundDoc._id },
      { ground_id: groundDoc.ground_id || groundDoc._id },
      { ground_name: new RegExp(`^${resolvedGroundName.trim()}$`, 'i') }
    ];

    // Check for active existing bookings for this ground, court, date, and slots
    const existingActiveBookings = await Booking.find({
      $or: groundMatchQuery,
      court_id: court,
      date: targetDate,
      booking_status: { $nin: ['Cancelled', 'Refunded'] }
    });

    for (const slot of incomingSlots) {
      const normSlot = normalizeTimeSlot(slot);
      const isConflict = existingActiveBookings.some(b => {
        const bookedSlots = (b.slot_time || '').split(',').map(s => normalizeTimeSlot(s));
        return bookedSlots.includes(normSlot);
      });

      if (isConflict) {
        return res.status(400).json({
          success: false,
          message: `Slot "${slot}" on ${court} is already booked for ${targetDate}. Please choose another available slot.`
        });
      }

      // Check if slot is explicitly Blocked in Slot collection
      const blockedSlot = await Slot.findOne({
        $or: [{ ground: groundDoc._id }, { ground_id: groundDoc.ground_id }],
        court_id: court,
        date: targetDate,
        slot_time: slot,
        status: 'Blocked'
      });

      if (blockedSlot) {
        return res.status(400).json({
          success: false,
          message: `Slot "${slot}" on ${court} is currently blocked by the venue.`
        });
      }
    }

    // 4. Create and save the Booking document
    const bookingData = {
      booking_id,
      user: userDoc ? userDoc._id : (isObjectIdString(String(requesterUserId)) ? requesterUserId : undefined),
      ground: groundDoc._id,
      user_id: resolvedUserId,
      user_name: resolvedUserName,
      ground_id: groundDoc.ground_id || groundDoc._id,
      ground_name: resolvedGroundName,
      sport_type: resolvedSportType,
      court_id: court,
      slot_id: slot_id || null,
      date: targetDate,
      slot_time: incomingSlots.join(', '),
      total_price: resolvedPrice,
      payment_status: 'Paid',
      booking_status: 'Upcoming',
      admin_approval: 'Approved',
      approved_at: new Date(),
      qr_code: `SPORTVERSE_QR_${booking_id}`,
      is_qr_expired: false,
      qr_scanned: false,
      created_at: new Date()
    };

    const b = new Booking(bookingData);
    const savedBooking = await b.save();
    console.log(`✅ Booking ${booking_id} confirmed for ${resolvedUserName} on ${court} (${targetDate} ${slot_time})!`);

    // 5. Update ONLY the specific slot(s) in Slot collection
    const groundIds = [groundDoc._id, groundDoc.ground_id].filter(Boolean);
    for (const slot of incomingSlots) {
      try {
        await Slot.updateMany(
          {
            $or: [{ ground: groundDoc._id }, { ground_id: { $in: groundIds } }],
            court_id: court,
            date: targetDate,
            slot_time: slot,
          },
          {
            $set: {
              status: 'Booked',
              booking_id: booking_id,
              booked_by_user_id: resolvedUserId,
            },
          }
        );
      } catch (slotUpdateErr) {
        console.warn('⚠️ Slot collection status update warning:', slotUpdateErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: savedBooking
    });
  } catch (error) {
    console.error('❌ createBooking Controller Exception:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get bookings for a specific user
// @route   GET /api/bookings/user/:userId
// @access  Private
exports.getUserBookings = async (req, res) => {
  try {
    const rawUserId = req.params.userId;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (requesterRole !== 'Admin' && requesterId !== rawUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only view your own bookings',
      });
    }

    let userDoc = null;
    if (isObjectIdString(rawUserId)) {
      userDoc = await User.findById(rawUserId);
    }

    const queryOr = [
      { user_id: rawUserId },
      { user_id: String(rawUserId) },
    ];
    if (isObjectIdString(rawUserId)) {
      queryOr.push({ user: rawUserId });
      queryOr.push({ user_id: new mongoose.Types.ObjectId(rawUserId) });
    }
    const numericUserId = parseInt(rawUserId, 10);
    if (!isNaN(numericUserId)) {
      queryOr.push({ user_id: numericUserId });
    }
    if (userDoc && userDoc.email) {
      queryOr.push({ user_email: userDoc.email.toLowerCase() });
    }

    const bookings = await Booking.find({ $or: queryOr })
      .populate('user', 'fullName email phone')
      .populate('ground')
      .sort({ created_at: -1 });

    return res.json({ success: true, bookings: bookings || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/cancel/:bookingId
// @access  Private
exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const booking = await Booking.findOne({ booking_id: bookingId });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Verify ownership: user who booked, ground owner, or Admin
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    let isAuthorized = requesterRole === 'Admin' || (booking.user_id && booking.user_id.toString() === requesterId);

    if (!isAuthorized && booking.ground) {
      const ground = await Ground.findById(booking.ground);
      if (ground && ground.owner_id && ground.owner_id.toString() === requesterId) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You do not have permission to cancel this booking',
      });
    }

    booking.booking_status = 'Cancelled';
    await booking.save();

    // Reset slot in Slot collection back to 'Available'
    try {
      const incomingSlots = (booking.slot_time || '').split(',').map(s => s.trim()).filter(Boolean);
      for (const s of incomingSlots) {
        await Slot.updateMany(
          {
            $or: [
              { booking_id: booking.booking_id },
              {
                $or: [{ ground: booking.ground }, { ground_id: booking.ground_id }],
                court_id: booking.court_id || 'Court 1',
                date: booking.date,
                slot_time: s,
              },
            ],
          },
          {
            $set: {
              status: 'Available',
              booking_id: null,
              booked_by_user_id: null,
            },
          }
        );
      }
    } catch (slotResetErr) {
      console.warn('⚠️ Failed to reset slot status on cancel:', slotResetErr.message);
    }

    return res.json({ success: true, message: 'Booking cancelled successfully', booking });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin approves or rejects a ground booking request
// @route   PUT /api/bookings/:bookingId/approve
// @access  Admin
exports.approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status, rejectReason = '' } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Approved" or "Rejected".',
      });
    }

    const booking = await Booking.findOne({ booking_id: bookingId })
      .populate('user', 'fullName email');

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking ${bookingId} not found.` });
    }

    booking.admin_approval = status;
    booking.approved_at = new Date();
    if (status === 'Rejected') {
      booking.booking_status = 'Cancelled';
      // Reset slots
      try {
        await Slot.updateMany(
          { booking_id: booking.booking_id },
          { $set: { status: 'Available', booking_id: null, booked_by_user_id: null } }
        );
      } catch (_) {}
    }
    await booking.save();

    return res.status(200).json({
      success: true,
      message: `Booking ${bookingId} has been ${status}.`,
      booking,
    });
  } catch (error) {
    console.error('❌ approveBooking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin or Ground Owner checks in player via QR code or Booking ID
// @route   PUT /api/bookings/:bookingId/checkin or POST /api/bookings/checkin
// @access  Admin / GroundOwner
exports.checkInBooking = async (req, res) => {
  try {
    let rawId = req.params.bookingId || req.body.bookingId || req.body.qr_code || req.body.booking_id;
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Booking ID or QR code is required' });
    }

    if (typeof rawId === 'object' && rawId !== null) {
      rawId = rawId.booking_id || rawId.bookingId || rawId.qr_code || JSON.stringify(rawId);
    }
    let trimmedId = String(rawId).trim().replace(/^["']|["']$/g, '');

    if (trimmedId.startsWith('{') && trimmedId.endsWith('}')) {
      try {
        const parsed = JSON.parse(trimmedId);
        trimmedId = parsed.booking_id || parsed.bookingId || parsed.qr_code || trimmedId;
      } catch (_) {}
    }

    const extractedId = trimmedId.replace(/^SPORTVERSE_QR_/i, '').trim();
    const cleanNumericOrCode = extractedId.replace(/^SPV-/i, '').trim();
    const spvPrefixed = cleanNumericOrCode.startsWith('SPV-') ? cleanNumericOrCode : `SPV-${cleanNumericOrCode}`;
    const qrPrefixed = `SPORTVERSE_QR_${extractedId}`;
    const qrPrefixedSpv = `SPORTVERSE_QR_${spvPrefixed}`;

    const query = {
      $or: [
        { booking_id: trimmedId },
        { booking_id: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
        { booking_id: extractedId },
        { booking_id: { $regex: new RegExp(`^${extractedId}$`, 'i') } },
        { booking_id: spvPrefixed },
        { booking_id: { $regex: new RegExp(`^${spvPrefixed}$`, 'i') } },
        { qr_code: trimmedId },
        { qr_code: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
        { qr_code: qrPrefixed },
        { qr_code: { $regex: new RegExp(`^${qrPrefixed}$`, 'i') } },
        { qr_code: qrPrefixedSpv },
        ...(isObjectIdString(trimmedId) ? [{ _id: trimmedId }] : []),
        ...(isObjectIdString(extractedId) ? [{ _id: extractedId }] : [])
      ]
    };

    const booking = await Booking.findOne(query)
      .populate('user', 'fullName email phone')
      .populate('ground', 'title sport_type location owner_id');

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking not found for ID: ${trimmedId}` });
    }

    // Check if QR pass is ALREADY SCANNED / COMPLETED
    if (booking.booking_status === 'Completed' || booking.is_qr_expired === true || booking.qr_scanned === true) {
      return res.status(200).json({
        success: false,
        expired: true,
        alreadyCheckedIn: true,
        message: `⚠️ QR Ticket Expired! Pass #${booking.booking_id} for ${booking.user_name || 'Player'} has ALREADY been scanned and used. Duplicate entry denied.`,
        booking: {
          booking_id: booking.booking_id,
          user_name: booking.user_name || (booking.user ? booking.user.fullName : 'Player'),
          ground_name: booking.ground_name || (booking.ground ? booking.ground.title : 'Sports Arena'),
          court_id: booking.court_id || 'Court 1',
          sport_type: booking.sport_type,
          date: booking.date,
          slot_time: booking.slot_time,
          total_price: booking.total_price,
          booking_status: 'Completed (Expired)',
          is_qr_expired: true,
          payment_status: booking.payment_status,
          qr_code: booking.qr_code,
        }
      });
    }

    // First time scan: Mark check-in confirmed
    booking.booking_status = 'Completed';
    booking.is_qr_expired = true;
    booking.qr_scanned = true;
    booking.scanned_at = new Date();
    await booking.save();

    console.log(`🎟️ Check-in confirmed for Booking ${booking.booking_id} (${booking.user_name || 'Player'})`);

    return res.status(200).json({
      success: true,
      expired: false,
      alreadyCheckedIn: false,
      message: `✅ Entry Approved! Check-in confirmed for ${booking.user_name || 'Player'} (${booking.booking_id}). Ticket is verified.`,
      booking: {
        booking_id: booking.booking_id,
        user_name: booking.user_name || (booking.user ? booking.user.fullName : 'Player'),
        ground_name: booking.ground_name || (booking.ground ? booking.ground.title : 'Sports Arena'),
        court_id: booking.court_id || 'Court 1',
        sport_type: booking.sport_type,
        date: booking.date,
        slot_time: booking.slot_time,
        total_price: booking.total_price,
        booking_status: 'Completed',
        is_qr_expired: true,
        payment_status: booking.payment_status,
        qr_code: booking.qr_code,
      }
    });
  } catch (error) {
    console.error('❌ checkInBooking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get booked slots for a ground on a specific date
// @route   GET /api/bookings/ground/:groundId
// @access  Public
exports.getGroundBookedSlots = async (req, res) => {
  try {
    const { groundId } = req.params;
    const { date, court_id } = req.query;

    const groundMatchQuery = [];
    if (isObjectIdString(groundId)) {
      groundMatchQuery.push({ ground: groundId });
    }
    const numId = parseInt(groundId, 10);
    if (!isNaN(numId)) {
      groundMatchQuery.push({ ground_id: numId });
    }
    groundMatchQuery.push({ ground_id: groundId });

    let groundDoc = null;
    if (isObjectIdString(groundId)) groundDoc = await Ground.findById(groundId);
    if (!groundDoc && !isNaN(numId)) groundDoc = await Ground.findOne({ ground_id: numId });
    if (groundDoc) {
      groundMatchQuery.push({ ground_name: new RegExp(`^${groundDoc.title.trim()}$`, 'i') });
      groundMatchQuery.push({ ground: groundDoc._id });
    }

    const query = {
      $or: groundMatchQuery,
      booking_status: { $nin: ['Cancelled', 'Refunded'] }
    };

    if (date) query.date = date;
    if (court_id && court_id !== 'All') query.court_id = court_id;

    const bookings = await Booking.find(query).select('booking_id date court_id slot_time booking_status user_name');

    const bookedSlotTimes = [];
    bookings.forEach(b => {
      if (b.slot_time) {
        b.slot_time.split(',').forEach(s => {
          const trimmed = s.trim();
          if (trimmed && !bookedSlotTimes.includes(trimmed)) {
            bookedSlotTimes.push(trimmed);
          }
        });
      }
    });

    return res.json({
      success: true,
      groundId,
      date: date || 'all',
      court_id: court_id || 'all',
      bookedSlotTimes,
      bookings
    });
  } catch (error) {
    console.error('❌ getGroundBookedSlots error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
