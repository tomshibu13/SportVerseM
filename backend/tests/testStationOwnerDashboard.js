require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const http = require('http');
const app = require('../src/app');
const User = require('../models/User');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');
const jwt = require('jsonwebtoken');

function generateToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
}

async function runTests() {
  console.log('🧪 Starting Station Owner Dashboard & Settings Tests...');
  await mongoose.connect(process.env.MONGO_URI);

  // Start HTTP server on port 0
  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  console.log(`🌐 Test server listening on ${baseUrl}`);

  try {
    // 1. Find Luke (GroundOwner)
    const luke = await User.findOne({ email: 'luke@gmail.com' });
    if (!luke) {
      throw new Error('Luke not found in database');
    }
    const token = generateToken(luke);
    console.log(`✅ Test User found: ${luke.fullName} (${luke.email}), Role: ${luke.role}, ID: ${luke._id}`);

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };

    // 2. Test GET /api/grounds/owner/:ownerId
    console.log('\n--- Test 1: Fetch Owner Grounds ---');
    const groundsRes = await fetch(`${baseUrl}/grounds/owner/${luke._id}`, { headers: authHeaders });
    const groundsBody = await groundsRes.json();
    
    if (groundsRes.status !== 200 || !groundsBody.grounds || groundsBody.grounds.length === 0) {
      throw new Error(`Failed to fetch owner grounds: status=${groundsRes.status}, body=${JSON.stringify(groundsBody)}`);
    }
    const ownerGround = groundsBody.grounds[0];
    console.log(`✅ Grounds fetched: count=${groundsBody.grounds.length}, first="${ownerGround.title}" (ID: ${ownerGround._id})`);

    // 3. Test GET /api/owner/dashboard/:ownerId
    console.log('\n--- Test 2: Fetch Owner Dashboard Stats ---');
    const statsRes = await fetch(`${baseUrl}/owner/dashboard/${luke._id}`, { headers: authHeaders });
    const statsBody = await statsRes.json();

    if (statsRes.status !== 200 || !statsBody.stats) {
      throw new Error(`Failed to fetch dashboard stats: status=${statsRes.status}, body=${JSON.stringify(statsBody)}`);
    }
    const stats = statsBody.stats;
    console.log(`✅ Dashboard stats fetched:`);
    console.log(`   - Active venues: ${stats.activeVenuesCount}`);
    console.log(`   - Total revenue: ₹${stats.totalRevenue}`);
    console.log(`   - Today revenue: ₹${stats.todaysRevenue}`);
    console.log(`   - Total bookings: ${stats.totalBookings}`);
    console.log(`   - Active bookings: ${stats.activeBookingsCount}`);
    console.log(`   - Recent activities: ${stats.recentActivities?.length || 0} items`);
    console.log(`   - Court occupancy: ${stats.courtOccupancy}`);
    console.log(`   - Upcoming slots: ${stats.upcomingSlots?.length || 0} slots`);

    if (stats.totalRevenue <= 0) {
      throw new Error('Expected totalRevenue > 0 for Luke who has confirmed bookings');
    }
    if (!stats.recentActivities || stats.recentActivities.length === 0) {
      throw new Error('Expected recentActivities to be populated from bookings');
    }

    // 4. Test GET /api/bookings/owner/:ownerId
    console.log('\n--- Test 3: Fetch Owner Bookings ---');
    const bookingsRes = await fetch(`${baseUrl}/bookings/owner/${luke._id}`, { headers: authHeaders });
    const bookingsBody = await bookingsRes.json();

    if (bookingsRes.status !== 200 || !bookingsBody.bookings) {
      throw new Error(`Failed to fetch owner bookings: status=${bookingsRes.status}`);
    }
    console.log(`✅ Bookings fetched: ${bookingsBody.bookings.length} reservations found`);

    // 5. Test Station Settings: PUT /api/grounds/:id (Update ground title, phone, opening_time, closing_time)
    console.log('\n--- Test 4: Station Settings - Update Ground ---');
    const updateGroundRes = await fetch(`${baseUrl}/grounds/${ownerGround._id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        title: 'Smash Arena (Updated)',
        phone: '9876543210',
        address: 'Kochi Sports Complex, Stadium Road',
        opening_time: '06:00',
        closing_time: '23:00'
      })
    });
    const updateGroundBody = await updateGroundRes.json();

    if (updateGroundRes.status !== 200 || !updateGroundBody.ground) {
      throw new Error(`Failed to update ground: status=${updateGroundRes.status}, message=${updateGroundBody.message}`);
    }
    console.log(`✅ Ground updated in MongoDB: title="${updateGroundBody.ground.title}", phone="${updateGroundBody.ground.phone}", hours=${updateGroundBody.ground.opening_time} - ${updateGroundBody.ground.closing_time}`);

    // 6. Test Station Settings: PUT /api/auth/me (Update user profile & phone)
    console.log('\n--- Test 5: Station Settings - Update Profile ---');
    const profileRes = await fetch(`${baseUrl}/auth/me`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        phone: '9876543210',
      })
    });
    const profileBody = await profileRes.json();

    if (profileRes.status !== 200 || !profileBody.user) {
      throw new Error(`Failed to update profile: status=${profileRes.status}, message=${profileBody.message}`);
    }
    console.log(`✅ User profile updated: phone="${profileBody.user.phone}"`);

    // 7. Test ProShop: GroundOwner creating and managing product
    console.log('\n--- Test 6: ProShop - GroundOwner Product Creation ---');
    const newProductRes = await fetch(`${baseUrl}/products`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: 'Yonex Pro Grip Tape (Station Stock)',
        category: 'Accessories',
        sport: 'Badminton',
        price: 199,
        stock: 35,
        shop_owner_id: luke._id.toString()
      })
    });
    const newProductBody = await newProductRes.json();

    if (newProductRes.status !== 201 || !newProductBody.product) {
      throw new Error(`Failed to create product: status=${newProductRes.status}, message=${newProductBody.message}`);
    }
    const createdProd = newProductBody.product;
    console.log(`✅ ProShop Product created by GroundOwner: "${createdProd.title}", price=₹${createdProd.price}, stock=${createdProd.stock}`);

    // Clean up created test product
    await mongoose.model('Product').findByIdAndDelete(createdProd._id);
    console.log('🧹 Cleaned up test product');

    console.log('\n🎉 ALL 6 STATION OWNER DASHBOARD & SETTINGS TESTS PASSED SUCCESSFULLY!');
  } finally {
    server.close();
    await mongoose.disconnect();
  }
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
