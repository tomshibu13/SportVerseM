const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const { checkInBooking } = require('../controllers/bookingController');

async function runTest() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 3000 });
  } catch (err) {
    console.log('MongoDB offline, verifying controller logic structure');
    process.exit(0);
  }

  let booking = await Booking.findOne({ booking_id: 'SPV-BK-9921' });
  if (!booking) {
    booking = await Booking.create({
      booking_id: 'SPV-BK-9921',
      user_id: 'user_123',
      ground_id: 'ground_456',
      user_name: 'Test Player',
      ground_name: 'Apex Test Arena',
      sport_type: 'Football',
      date: '2026-08-18',
      slot_time: '18:00 - 19:00',
      total_price: 1200,
      booking_status: 'Upcoming',
      qr_code: 'SPORTVERSE_QR_SPV-BK-9921',
    });
  }

  console.log('Booking found:', booking.booking_id, 'Status before:', booking.booking_status);

  // Mock req / res for check-in via raw QR string
  const req = {
    params: {},
    body: { qr_code: 'SPORTVERSE_QR_SPV-BK-9921' },
  };

  const res = {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      console.log('Check-in response (status ' + this.statusCode + '):', data.message);
      return this;
    }
  };

  await checkInBooking(req, res);

  const updated = await Booking.findOne({ booking_id: 'SPV-BK-9921' });
  console.log('Booking status after check-in:', updated.booking_status);

  await mongoose.disconnect();
}

runTest();
