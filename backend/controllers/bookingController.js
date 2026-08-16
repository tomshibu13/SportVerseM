const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ground = require('../models/Ground');
const User = require('../models/User');
const { sendBookingApprovalEmail } = require('../utils/emailService');

const initialBookings = [
  {
    booking_id: 'SPV-BK-9921',
    user_id: 1,
    user_name: 'Tom Holland',
    ground_id: 101,
    ground_name: 'Elite Football Arena',
    sport_type: 'Football',
    date: '2026-08-10',
    slot_time: '07:00 AM - 08:00 AM',
    total_price: 800,
    payment_status: 'Paid',
    booking_status: 'Upcoming',
    qr_code: 'SPORTVERSE_QR_SPV-BK-9921',
    created_at: new Date()
  },
  {
    booking_id: 'SPV-BK-8842',
    user_id: 1,
    user_name: 'Tom Holland',
    ground_id: 102,
    ground_name: 'Victory Badminton Court',
    sport_type: 'Badminton',
    date: '2026-08-04',
    slot_time: '04:00 PM - 05:00 PM',
    total_price: 500,
    payment_status: 'Paid',
    booking_status: 'Completed',
    qr_code: 'SPORTVERSE_QR_SPV-BK-8842',
    created_at: new Date(Date.now() - 86400000 * 4)
  }
];

const seedBookingsIfEmpty = async () => {
  // Disabled mock bookings seeding as requested
};

exports.seedBookingsIfEmpty = seedBookingsIfEmpty;

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

exports.createBooking = async (req, res) => {
  try {
    const { user_id, user_name, ground_id, ground_name, sport_type, date, slot_time, total_price, slot_id } = req.body;
    const booking_id = 'SPV-BK-' + Math.floor(1000 + Math.random() * 9000);

    // 1. Look up normalized Ground document
    let groundDoc = null;
    const parsedGroundId = parseInt(ground_id, 10);
    if (!isNaN(parsedGroundId)) {
      groundDoc = await Ground.findOne({ ground_id: parsedGroundId });
    }
    if (!groundDoc && ground_id && mongoose.Types.ObjectId.isValid(ground_id)) {
      groundDoc = await Ground.findById(ground_id);
    }

    // 2. Look up normalized User document
    let userDoc = null;
    if (user_id && mongoose.Types.ObjectId.isValid(user_id)) {
      userDoc = await User.findById(user_id);
    }

    // Resolve details using normalized entities or fallbacks
    const resolvedGroundName = ground_name || (groundDoc ? groundDoc.title : 'Sports Ground');
    const resolvedSportType = sport_type || (groundDoc ? groundDoc.sport_type : 'Football');
    const resolvedUserName = user_name || (userDoc ? userDoc.fullName : 'Guest User');
    const resolvedPrice = Number(total_price) || (groundDoc ? groundDoc.price_per_hour : 800);

    const bookingData = {
      booking_id,
      user: userDoc ? userDoc._id : undefined,
      ground: groundDoc ? groundDoc._id : undefined,
      user_id: user_id || 1,
      user_name: resolvedUserName,
      ground_id: ground_id || 101,
      ground_name: resolvedGroundName,
      sport_type: resolvedSportType,
      date: date || new Date().toISOString().split('T')[0],
      slot_time: slot_time || '06:00 PM - 07:00 PM',
      total_price: resolvedPrice,
      payment_status: 'Paid',
      booking_status: 'Upcoming',
      qr_code: `SPORTVERSE_QR_${booking_id}`,
      created_at: new Date()
    };

    const b = new Booking(bookingData);
    const savedBooking = await b.save();
    console.log(`✅ Booking ${booking_id} saved to MongoDB database!`);

    // 3. Mark slot as booked in Ground document
    if (groundDoc && groundDoc.available_slots) {
      try {
        const slotIdx = groundDoc.available_slots.findIndex(
          s => (slot_id && s.slot_id === slot_id) || (slot_time && s.time === slot_time)
        );
        if (slotIdx !== -1) {
          groundDoc.available_slots[slotIdx].is_booked = true;
          await groundDoc.save();
          console.log(`📌 Ground slot updated to booked for ground: ${groundDoc.title}`);
        }
      } catch (slotErr) {
        console.error('⚠️ Failed to update slot status on ground:', slotErr.message);
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

exports.getUserBookings = async (req, res) => {
  try {
    await seedBookingsIfEmpty();
    const rawUserId = req.params.userId;
    const numericUserId = parseInt(rawUserId, 10);
    let bookings = [];

    const query = {
      $or: [
        { user_id: rawUserId },
        { user_id: numericUserId },
        ...(mongoose.Types.ObjectId.isValid(rawUserId) ? [{ user: rawUserId }] : [])
      ]
    };
    bookings = await Booking.find(query)
      .populate('user', 'fullName email phone')
      .populate('ground')
      .sort({ created_at: -1 });

    // Fallback to all bookings in DB if specific user query returns nothing
    if (!bookings || bookings.length === 0) {
      bookings = await Booking.find()
        .populate('user', 'fullName email phone')
        .populate('ground')
        .sort({ created_at: -1 });
    }

    return res.json({ success: true, bookings: bookings || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const updated = await Booking.findOneAndUpdate(
      { booking_id: bookingId },
      { booking_status: 'Cancelled' },
      { new: true }
    );
    if (updated) {
      return res.json({ success: true, message: 'Booking cancelled successfully in MongoDB', booking: updated });
    }
    return res.status(404).json({ success: false, message: 'Booking not found' });
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
    // status must be 'Approved' or 'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be "Approved" or "Rejected".',
      });
    }

    // Fetch booking and populate user so we get their email
    const booking = await Booking.findOne({ booking_id: bookingId })
      .populate('user', 'fullName email');

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking ${bookingId} not found.` });
    }

    // If already actioned, skip double-approval
    if (booking.admin_approval === status) {
      return res.status(200).json({
        success: true,
        message: `Booking is already ${status}.`,
        booking,
      });
    }

    // Update approval fields
    booking.admin_approval = status;
    booking.approved_at = new Date();
    // Rejected bookings should be marked Cancelled
    if (status === 'Rejected') {
      booking.booking_status = 'Cancelled';
    }
    await booking.save();

    console.log(`👑 Booking ${bookingId} admin_approval set to ${status}`);

    // ── Resolve user name & email ──────────────────────────────────────────
    let userName  = booking.user_name || 'Player';
    let userEmail = null;

    if (booking.user && booking.user.email) {
      // Populated from User collection
      userName  = booking.user.fullName || userName;
      userEmail = booking.user.email;
    } else if (mongoose.Types.ObjectId.isValid(booking.user_id)) {
      // Fallback: manual lookup
      const userDoc = await User.findById(booking.user_id).select('fullName email');
      if (userDoc) {
        userName  = userDoc.fullName || userName;
        userEmail = userDoc.email;
      }
    }

    // ── Send email notification ────────────────────────────────────────────
    let emailResult = null;
    if (userEmail) {
      try {
        emailResult = await sendBookingApprovalEmail({
          userName,
          userEmail,
          bookingId:   booking.booking_id,
          groundName:  booking.ground_name,
          sportType:   booking.sport_type,
          date:        booking.date,
          slotTime:    booking.slot_time,
          totalPrice:  booking.total_price,
          qrCode:      booking.qr_code,
          status,
          rejectReason,
        });

        if (emailResult.mode === 'ethereal' && emailResult.previewUrl) {
          console.log(`📧 [Email/Test] Booking approval email preview: ${emailResult.previewUrl}`);
        } else {
          console.log(`📧 [Email] Booking ${status} email sent to ${userEmail}`);
        }
      } catch (emailErr) {
        // Non-fatal — never block the approval because of email failure
        console.error(`❌ [Email] Failed to send booking approval email to ${userEmail}:`, emailErr.message);
      }
    } else {
      console.warn(`⚠️  [Email] No email address found for booking ${bookingId} — notification skipped.`);
    }

    return res.status(200).json({
      success: true,
      message: `Booking ${bookingId} has been ${status}.`,
      emailSent: !!emailResult,
      emailPreview: emailResult?.previewUrl || null,
      booking: {
        booking_id:     booking.booking_id,
        ground_name:    booking.ground_name,
        sport_type:     booking.sport_type,
        date:           booking.date,
        slot_time:      booking.slot_time,
        total_price:    booking.total_price,
        booking_status: booking.booking_status,
        admin_approval: booking.admin_approval,
        approved_at:    booking.approved_at,
        notifiedUser:   userEmail || null,
      },
    });
  } catch (error) {
    console.error('❌ approveBooking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin or Station Owner checks in player via QR code or Booking ID
// @route   PUT /api/bookings/:bookingId/checkin or POST /api/bookings/checkin
// @access  Admin / StationOwner
exports.checkInBooking = async (req, res) => {
  try {
    const rawId = req.params.bookingId || req.body.bookingId || req.body.qr_code || req.body.booking_id;
    if (!rawId) {
      return res.status(400).json({ success: false, message: 'Booking ID or QR code is required' });
    }

    const trimmedId = String(rawId).trim();
    // Support searching by booking_id, qr_code, or mongodb _id
    const query = {
      $or: [
        { booking_id: trimmedId },
        { booking_id: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
        { qr_code: trimmedId },
        { qr_code: { $regex: new RegExp(`^${trimmedId}$`, 'i') } },
        ...(mongoose.Types.ObjectId.isValid(trimmedId) ? [{ _id: trimmedId }] : [])
      ]
    };

    const booking = await Booking.findOne(query)
      .populate('user', 'fullName email phone')
      .populate('ground', 'title sport_type location');

    if (!booking) {
      return res.status(404).json({ success: false, message: `Booking not found for ID: ${trimmedId}` });
    }

    booking.booking_status = 'Completed';
    await booking.save();

    console.log(`🎟️ Check-in confirmed for Booking ${booking.booking_id} (${booking.user_name || 'Player'})`);

    return res.status(200).json({
      success: true,
      message: `Check-in confirmed for ${booking.user_name || 'Player'} (${booking.booking_id})!`,
      booking: {
        booking_id: booking.booking_id,
        user_name: booking.user_name || (booking.user ? booking.user.fullName : 'Player'),
        ground_name: booking.ground_name || (booking.ground ? booking.ground.title : 'Sports Arena'),
        sport_type: booking.sport_type,
        date: booking.date,
        slot_time: booking.slot_time,
        total_price: booking.total_price,
        booking_status: booking.booking_status,
        payment_status: booking.payment_status,
        qr_code: booking.qr_code,
      }
    });
  } catch (error) {
    console.error('❌ checkInBooking error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

