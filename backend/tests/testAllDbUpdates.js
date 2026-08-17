const http = require('http');

function apiRequest(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }, (res) => {
      let raw = '';
      res.on('data', chunk => raw += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(raw) });
        } catch (e) {
          resolve({ status: res.statusCode, raw });
        }
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function testAll() {
  console.log('--- 1. Testing Ground Fetch & Update ---');
  const groundsRes = await apiRequest('GET', '/grounds');
  console.log('Grounds count:', groundsRes.data.grounds ? groundsRes.data.grounds.length : 'no grounds array');
  
  if (groundsRes.data.grounds && groundsRes.data.grounds.length > 0) {
    const firstGround = groundsRes.data.grounds[0];
    const gId = firstGround._id || firstGround.ground_id;
    console.log('Testing update on Ground ID:', gId, 'Title before:', firstGround.title);

    const updateRes = await apiRequest('PUT', `/grounds/${gId}`, {
      title: firstGround.title + ' (Updated)',
      price_per_hour: 850
    });
    console.log('Update Ground HTTP Status:', updateRes.status, 'Response:', updateRes.data);

    // Verify change in DB
    const checkGround = await apiRequest('GET', `/grounds/${gId}`);
    console.log('Verified Ground in DB:', checkGround.data.ground ? checkGround.data.ground.title : checkGround.data);
  }

  console.log('\n--- 2. Testing Booking Create & Check-In ---');
  const bookingCreateRes = await apiRequest('POST', '/bookings', {
    user_id: 'test_user_99',
    user_name: 'Test Player DB',
    ground_id: 'test_ground_99',
    ground_name: 'Apex Test Stadium',
    sport_type: 'Football',
    date: '2026-08-20',
    slot_time: '18:00 - 19:00',
    total_price: 1200
  });
  console.log('Booking Create Status:', bookingCreateRes.status, 'Created Booking:', bookingCreateRes.data.booking ? bookingCreateRes.data.booking.booking_id : bookingCreateRes.data);

  if (bookingCreateRes.data.booking) {
    const bId = bookingCreateRes.data.booking.booking_id;
    const checkInRes = await apiRequest('POST', '/bookings/checkin', { bookingId: bId });
    console.log('Check-In Status:', checkInRes.status, 'Check-in Msg:', checkInRes.data.message);
  }

  console.log('\n--- 3. Testing User Approval ---');
  const usersRes = await apiRequest('GET', '/auth/users');
  console.log('Users count:', usersRes.data.users ? usersRes.data.users.length : usersRes.data.length);
  if (usersRes.data.users && usersRes.data.users.length > 0) {
    const userToApprove = usersRes.data.users[0];
    const uId = userToApprove._id || userToApprove.id;
    const approveRes = await apiRequest('PUT', `/auth/users/${uId}/approve`, { status: 'Approved' });
    console.log('Approve User Status:', approveRes.status, 'Msg:', approveRes.data.message);
  }
}

testAll().catch(console.error);
