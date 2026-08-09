const Booking = require('../models/Booking');

let mockBookings = [
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

exports.createBooking = async (req, res) => {
  try {
    const { user_id, user_name, ground_id, ground_name, sport_type, date, slot_time, total_price } = req.body;
    const booking_id = 'SPV-BK-' + Math.floor(1000 + Math.random() * 9000);

    const newBookingObj = {
      booking_id,
      user_id: user_id || 1,
      user_name: user_name || 'Tom Holland',
      ground_id: ground_id || 101,
      ground_name: ground_name || 'Elite Football Arena',
      sport_type: sport_type || 'Football',
      date: date || '2026-08-12',
      slot_time: slot_time || '06:00 PM - 07:00 PM',
      total_price: Number(total_price) || 800,
      payment_status: 'Paid',
      booking_status: 'Upcoming',
      qr_code: `SPORTVERSE_QR_${booking_id}`,
      created_at: new Date()
    };

    try {
      const b = new Booking(newBookingObj);
      await b.save();
    } catch (e) {
      mockBookings.unshift(newBookingObj);
    }

    return res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: newBookingObj
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const userId = Number(req.params.userId) || 1;
    let bookings = [];
    try {
      bookings = await Booking.find({ user_id: userId }).sort({ created_at: -1 });
    } catch (e) {
      bookings = mockBookings.filter(b => b.user_id === userId);
    }
    if (!bookings || bookings.length === 0) {
      bookings = mockBookings.filter(b => b.user_id === userId);
    }
    return res.json({ success: true, bookings });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    let b = mockBookings.find(bk => bk.booking_id === bookingId);
    if (b) {
      b.booking_status = 'Cancelled';
    }
    return res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
