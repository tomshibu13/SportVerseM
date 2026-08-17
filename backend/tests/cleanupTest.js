const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');

async function cleanup() {
  await mongoose.connect('mongodb://127.0.0.1:27017/sportverse');
  await Ground.updateOne(
    { _id: '6a81a47a4eb9387e8ddba76f' },
    { title: 'Smash Arena', price_per_hour: 800 }
  );
  await Booking.deleteMany({ user_name: 'Test Player DB' });
  console.log('Cleaned up test data.');
  await mongoose.disconnect();
}
cleanup();
