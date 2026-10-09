const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

async function check() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/sportverse';
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const users = await User.find({ role: 'GroundOwner' }).select('+stationPassword +password');
    for (const u of users) {
      console.log(`User: ${u.email}`);
      console.log(`  stationPasswordDisplay: ${u.stationPasswordDisplay}`);
      console.log(`  stationPassword: ${u.stationPassword}`);
      console.log(`  password: ${u.password}`);
    }
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
check();
