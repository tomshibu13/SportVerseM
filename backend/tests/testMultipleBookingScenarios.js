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

async function testMultipleBookingScenarios() {
  const groundsRes = await apiRequest('GET', '/grounds');
  const g = groundsRes.data.grounds[0];

  console.log('Testing Booking with ObjectId string ground_id:', g._id);
  const res1 = await apiRequest('POST', '/bookings', {
    user_id: '6a81a4564eb9387e8ddba76a',
    user_name: 'Alex Footballer',
    ground_id: g._id,
    ground_name: g.title,
    sport_type: g.sport_type,
    date: '2026-08-25',
    slot_time: '05:00 PM - 06:00 PM',
    total_price: 1200
  });
  console.log('ObjectId Booking Status:', res1.status, 'Booking ID:', res1.data.booking?.booking_id);

  console.log('\nTesting Booking with numeric ground_id:', g.ground_id || 106);
  const res2 = await apiRequest('POST', '/bookings', {
    user_id: '6a81a4564eb9387e8ddba76a',
    user_name: 'Alex Footballer',
    ground_id: g.ground_id || 106,
    ground_name: g.title,
    sport_type: g.sport_type,
    date: '2026-08-26',
    slot_time: '06:00 PM - 07:00 PM',
    total_price: 1200
  });
  console.log('Numeric Booking Status:', res2.status, 'Booking ID:', res2.data.booking?.booking_id);
}

testMultipleBookingScenarios().catch(console.error);
