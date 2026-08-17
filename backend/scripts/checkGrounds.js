require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Ground = require('../models/Ground');

async function checkGrounds() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);

  const grounds = await Ground.find({});
  console.log(`Found ${grounds.length} grounds in MongoDB:`);
  grounds.forEach(g => {
    console.log(`- [ID: ${g.ground_id || g._id}] "${g.title}" | Sport: ${g.sport_type} | Loc: ${g.location} | Lat/Lng: ${g.latitude}, ${g.longitude} | Price: ₹${g.price_per_hour}/hr | Status: ${g.status}`);
  });

  await mongoose.disconnect();
}

checkGrounds();
