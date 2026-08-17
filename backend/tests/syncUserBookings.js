const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const User = require('../models/User');

async function syncBookings() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sportverse');
  console.log('MongoDB Connected');

  const luke = await User.findOne({ email: 'luke@example.com' }) || await User.findById('6a81a4564eb9387e8ddba76a');
  if (luke) {
    console.log(`Found Luke: ${luke._id} (${luke.fullName})`);

    // Update any recent bookings with user_id: 1 or name Player One to Luke
    const res = await Booking.updateMany(
      { $or: [{ user_id: 1 }, { user_id: '1' }, { user_name: 'Player One' }] },
      {
        $set: {
          user_id: String(luke._id),
          user: luke._id,
          user_name: luke.fullName,
          booking_status: 'Upcoming',
          admin_approval: 'Approved'
        }
      }
    );
    console.log(`Updated ${res.modifiedCount} bookings to Luke's account!`);
  }

  const all = await Booking.find().sort({ created_at: -1 }).limit(10);
  console.log('\nTop 10 Bookings in MongoDB:');
  all.forEach(b => {
    console.log(`- ${b.booking_id} | ${b.user_name} (${b.user_id}) | ${b.ground_name} | status: ${b.booking_status} | approval: ${b.admin_approval}`);
  });

  await mongoose.disconnect();
}

syncBookings().catch(console.error);
