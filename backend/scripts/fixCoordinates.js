require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Ground = require('../models/Ground');

async function fixCoordinates() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);

  // Fix Smash
  await Ground.updateMany(
    { title: 'Smash', latitude: { $exists: false } },
    { $set: { latitude: 11.2580, longitude: 75.7890 } }
  );

  // Fix Arena
  await Ground.updateMany(
    { title: 'Arena', latitude: { $exists: false } },
    { $set: { latitude: 11.2520, longitude: 75.7810 } }
  );

  // Set default coordinates for any ground missing them
  await Ground.updateMany(
    { $or: [{ latitude: { $exists: false } }, { latitude: null }] },
    { $set: { latitude: 11.2588, longitude: 75.7804 } }
  );

  const grounds = await Ground.find({});
  console.log(`Updated all ${grounds.length} grounds in MongoDB:`);
  grounds.forEach(g => {
    console.log(`- "${g.title}" | Lat: ${g.latitude}, Lng: ${g.longitude}`);
  });

  await mongoose.disconnect();
}

fixCoordinates();
