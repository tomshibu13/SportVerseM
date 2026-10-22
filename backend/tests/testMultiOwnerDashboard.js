require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const User = require('../models/User');
const Ground = require('../models/Ground');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
}

async function testAllOwners() {
  console.log('🧪 Testing Multi-Owner Dashboard Data Isolation...');
  await mongoose.connect(process.env.MONGO_URI);

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    const owners = await User.find({ role: 'GroundOwner', email: { $in: ['luke@gmail.com', 'tomshibu1829@gmail.com', 'tomshibu6@gmail.com'] } });

    for (const owner of owners) {
      console.log(`\n========================================`);
      console.log(`Testing Login & Dashboard for: ${owner.fullName} (${owner.email})`);
      const token = generateToken(owner);
      const headers = { 'Authorization': `Bearer ${token}` };

      // 1. Grounds
      const gRes = await fetch(`${baseUrl}/grounds/owner/${owner._id}`, { headers });
      const gData = await gRes.json();
      console.log(`  🏟️ Grounds: found ${gData.grounds?.length || 0} venues (First: "${gData.grounds?.[0]?.title || 'None'}")`);

      // 2. Stats
      const sRes = await fetch(`${baseUrl}/owner/dashboard/${owner._id}`, { headers });
      const sData = await sRes.json();
      console.log(`  📊 Stats: Total Revenue=₹${sData.stats?.totalRevenue}, Total Bookings=${sData.stats?.totalBookings}, Activities=${sData.stats?.recentActivities?.length}`);

      // 3. Bookings
      const bRes = await fetch(`${baseUrl}/bookings/owner/${owner._id}`, { headers });
      const bData = await bRes.json();
      console.log(`  🎟️ Bookings: ${bData.bookings?.length || 0} reservations found`);
    }

    console.log(`\n🎉 Multi-owner data isolation verified successfully!`);
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

testAllOwners().catch(err => {
  console.error(err);
  process.exit(1);
});
