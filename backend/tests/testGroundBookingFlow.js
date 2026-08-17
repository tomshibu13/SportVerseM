const http = require('http');

function apiRequest(method, path, body = null) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request({
      hostname: '127.0.0.1',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {})
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

async function testBooking() {
  console.log('--- 1. Fetching available grounds ---');
  const groundsRes = await apiRequest('GET', '/grounds');
  console.log('Found', groundsRes.data.grounds.length, 'grounds.');

  const targetGround = groundsRes.data.grounds[0];
  console.log('Selected Ground:', targetGround.title, 'ID:', targetGround._id, 'ground_id:', targetGround.ground_id);

  console.log('\n--- 2. Booking a slot on ground ---');
  const bookingPayload = {
    user_id: '6a81a65e4eb9387e8ddba795',
    user_name: 'Tom Shibu',
    ground_id: targetGround.ground_id || targetGround._id,
    ground_name: targetGround.title,
    sport_type: targetGround.sport_type,
    date: '2026-08-22',
    slot_time: '07:00 AM - 08:00 AM',
    total_price: targetGround.price_per_hour,
    slot_id: 'sl_2'
  };

  const createRes = await apiRequest('POST', '/bookings', bookingPayload);
  console.log('Booking Creation Status:', createRes.status, 'Response:', createRes.data);

  if (createRes.data.booking) {
    const bId = createRes.data.booking.booking_id;
    console.log('\n--- 3. Fetching User Bookings for user ---');
    const userBookingsRes = await apiRequest('GET', `/bookings/user/6a81a65e4eb9387e8ddba795`);
    console.log('User bookings count:', userBookingsRes.data.bookings.length);
    const found = userBookingsRes.data.bookings.some(b => b.booking_id === bId);
    console.log('Newly created booking present in user bookings list:', found);

    console.log('\n--- 4. Checking in player with QR pass ---');
    const checkInRes = await apiRequest('POST', '/bookings/checkin', { bookingId: bId });
    console.log('Check-in status:', checkInRes.status, 'Message:', checkInRes.data.message);
  }
}

testBooking().catch(console.error);
