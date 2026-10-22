require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Ground = require('../models/Ground');
const { checkInBooking } = require('../controllers/bookingController');

function mockRes() {
  return {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.data = payload;
      return this;
    }
  };
}

async function testGroundQRFix() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB');

  // Find two distinct grounds with distinct owners
  const grounds = await Ground.find({ status: 'Approved' }).limit(5);
  if (grounds.length < 2) {
    console.log('Need at least 2 grounds to test multi-owner ground isolation.');
    await mongoose.disconnect();
    return;
  }

  const groundA = grounds[0];
  const groundB = grounds[1];
  console.log('Ground A: #' + groundA.ground_id + ' "' + groundA.title + '" (owner: ' + groundA.owner_id + ')');
  console.log('Ground B: #' + groundB.ground_id + ' "' + groundB.title + '" (owner: ' + groundB.owner_id + ')');

  // Create a fresh test booking for Ground A
  const testBookingId = 'SPV-BK-' + Math.floor(1000 + Math.random() * 9000);
  const testQR = 'SPORTVERSE_QR_G' + groundA.ground_id + '_' + testBookingId;

  const bookingA = await Booking.create({
    booking_id: testBookingId,
    user_id: 'test_player_1',
    user_name: 'Test Player One',
    ground: groundA._id,
    ground_id: groundA.ground_id,
    ground_name: groundA.title,
    sport_type: groundA.sport_type || 'Football',
    date: '2026-12-01',
    slot_time: '06:00 PM - 07:00 PM',
    total_price: 800,
    payment_status: 'Paid',
    booking_status: 'Upcoming',
    admin_approval: 'Approved',
    qr_code: testQR,
    is_qr_expired: false,
    qr_scanned: false,
  });

  console.log('\nCreated Test Booking ' + bookingA.booking_id + ' for Ground A with QR: ' + bookingA.qr_code);

  // Test 1: Ground Owner B tries to check in Ground A's QR ticket
  console.log('\n--- Test 1: Ground Owner B scans Ground A booking QR ---');
  const reqOwnerB = {
    params: {},
    body: { qr_code: testQR },
    user: {
      userId: String(groundB.owner_id),
      role: 'GroundOwner',
      email: 'ownerB@test.com'
    }
  };
  const resOwnerB = mockRes();
  await checkInBooking(reqOwnerB, resOwnerB);
  console.log('Owner B scan status: ' + resOwnerB.statusCode);
  console.log('Owner B message: ' + resOwnerB.data?.message);
  console.log('Owner B groundMismatch flag: ' + resOwnerB.data?.groundMismatch);
  if (resOwnerB.statusCode === 403 && resOwnerB.data?.groundMismatch === true) {
    console.log('✅ TEST 1 PASSED: Owner B was correctly REJECTED with error!');
  } else {
    console.error('❌ TEST 1 FAILED: Owner B should have been rejected!');
    process.exit(1);
  }

  // Test 2: QR with mismatched Ground ID in the QR string (e.g., G99999)
  console.log('\n--- Test 2: QR string with mismatched ground ID ---');
  const fakeQR = 'SPORTVERSE_QR_G99999_' + testBookingId;
  const reqFakeQR = {
    params: {},
    body: { qr_code: fakeQR },
    user: {
      userId: String(groundA.owner_id),
      role: 'GroundOwner',
      email: 'ownerA@test.com'
    }
  };
  const resFakeQR = mockRes();
  await checkInBooking(reqFakeQR, resFakeQR);
  console.log('Fake QR status: ' + resFakeQR.statusCode);
  console.log('Fake QR message: ' + resFakeQR.data?.message);
  if (resFakeQR.statusCode === 400 && resFakeQR.data?.groundMismatch === true) {
    console.log('✅ TEST 2 PASSED: QR ground ID mismatch correctly REJECTED with 400 error!');
  } else {
    console.error('❌ TEST 2 FAILED: Mismatched QR ground ID should have been rejected!');
    process.exit(1);
  }

  // Test 3: Ground Owner A scans their own Ground A booking QR
  console.log('\n--- Test 3: Ground Owner A scans their own Ground A booking QR ---');
  const reqOwnerA = {
    params: {},
    body: { qr_code: testQR },
    user: {
      userId: String(groundA.owner_id),
      role: 'GroundOwner',
      email: 'ownerA@test.com'
    }
  };
  const resOwnerA = mockRes();
  await checkInBooking(reqOwnerA, resOwnerA);
  console.log('Owner A scan status: ' + resOwnerA.statusCode);
  console.log('Owner A message: ' + resOwnerA.data?.message);
  if (resOwnerA.statusCode === 200 && resOwnerA.data?.success === true) {
    console.log('✅ TEST 3 PASSED: Owner A successfully verified their ground booking QR!');
  } else {
    console.error('❌ TEST 3 FAILED: Owner A should have succeeded!');
    process.exit(1);
  }

  // Test 4: Duplicate scan of already completed pass
  console.log('\n--- Test 4: Duplicate scan of already used pass ---');
  const resDup = mockRes();
  await checkInBooking(reqOwnerA, resDup);
  console.log('Duplicate scan status: ' + resDup.statusCode);
  console.log('Duplicate message: ' + resDup.data?.message);
  if (resDup.data?.expired === true) {
    console.log('✅ TEST 4 PASSED: Duplicate scan correctly denied as expired!');
  } else {
    console.error('❌ TEST 4 FAILED: Duplicate scan should be marked expired!');
    process.exit(1);
  }

  // Clean up test booking
  await Booking.deleteOne({ booking_id: testBookingId });
  console.log('\nCleaned up test booking ' + testBookingId);

  await mongoose.disconnect();
  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY!');
}

testGroundQRFix().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
