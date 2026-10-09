const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function fix() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sportverse';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const users = await User.find({ stationPasswordDisplay: { $ne: '' } });
    console.log(`Found ${users.length} users with stationPasswordDisplay`);
    
    let count = 0;
    for (const u of users) {
      if (u.stationPasswordDisplay) {
        const salt = await bcrypt.genSalt(10);
        u.stationPassword = await bcrypt.hash(u.stationPasswordDisplay, salt);
        await u.save();
        console.log(`Re-hashed password for ${u.email}`);
        count++;
      }
    }
    console.log(`Fixed ${count} users.`);
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
fix();
