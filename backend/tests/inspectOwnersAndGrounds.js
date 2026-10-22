require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const User = require('../models/User');
const Booking = require('../models/Booking');

async function test() {
  await mongoose.connect(process.env.MONGO_URI);
  const owners = await User.find({ role: { $in: ['GroundOwner', 'Admin'] } });
  for (const o of owners) {
    const grounds = await Ground.find({
      $or: [
        { owner_id: o._id },
        { owner_id: String(o._id) },
        { owner_id: o.email },
        { owner_email: o.email }
      ]
    });
    console.log(`\nOwner: ${o.email} (${o.fullName}), role: ${o.role}, ID: ${o._id}, Grounds found: ${grounds.length}`);
    for (const g of grounds) {
      const bks = await Booking.find({ $or: [{ ground: g._id }, { ground_id: g.ground_id }, { ground_name: g.title }] });
      console.log(`   🏟️ Ground: "${g.title}", ground_id: ${g.ground_id}, status: ${g.status}, Bookings: ${bks.length}`);
      bks.forEach(b => {
        console.log(`      🎟️ Booking ${b.booking_id}: date=${b.date}, time=${b.slot_time}, status=${b.booking_status}, price=${b.total_price}`);
      });
    }
  }
  await mongoose.disconnect();
}
test().catch(console.error);
