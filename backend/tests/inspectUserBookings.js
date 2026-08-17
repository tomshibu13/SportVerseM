const mongoose = require('mongoose');
const Booking = require('../models/Booking');

async function inspectBookings() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sportverse');
  console.log('MongoDB Connected');

  const all = await Booking.find().sort({ created_at: -1 });
  console.log(`Total Bookings in DB: ${all.length}`);
  all.slice(0, 8).forEach(b => {
    console.log(`ID: ${b.booking_id}, User: ${b.user_name} (${b.user_id}, userRef: ${b.user}), Ground: ${b.ground_name} (${b.ground_id}, groundRef: ${b.ground}), Status: ${b.booking_status}, Approval: ${b.admin_approval}, Date: ${b.date}, Slot: ${b.slot_time}`);
  });

  const forUser = await Booking.find({
    $or: [
      { user_id: '6a81a4564eb9387e8ddba76a' },
      { user: '6a81a4564eb9387e8ddba76a' }
    ]
  });
  console.log(`\nBookings matching user 6a81a4564eb9387e8ddba76a: ${forUser.length}`);
  forUser.forEach(b => {
    console.log(`- ${b.booking_id} | ${b.user_name} | ${b.ground_name} | user_id=${b.user_id} | user=${b.user} | status=${b.booking_status}`);
  });

  await mongoose.disconnect();
}

inspectBookings().catch(console.error);
