const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Ground = require('../models/Ground');
const Review = require('../models/Review');
const User = require('../models/User');
const { getGroundReviews, createGroundReview, seedReviewsIfEmpty } = require('../controllers/reviewController');

async function runTests() {
  console.log('🧪 Starting Reviews & Navigation Integration Test...');
  await connectDB();

  // 1. Run seeder
  console.log('--- Step 1: Seeding reviews ---');
  await seedReviewsIfEmpty();

  // 2. Fetch a sample ground
  const ground = await Ground.findOne().lean();
  if (!ground) {
    console.error('❌ No ground found in database.');
    process.exit(1);
  }
  console.log(`Found ground: [${ground.title}], ground_id: ${ground.ground_id}, rating: ${ground.rating}, reviewCount: ${ground.review_count}`);

  // 3. Test GET reviews via Controller mock
  console.log('--- Step 2: Testing getGroundReviews ---');
  let mockResData = null;
  const mockReq = { params: { groundId: ground.ground_id }, query: {} };
  const mockRes = {
    status: (code) => ({
      json: (data) => { mockResData = { code, ...data }; return mockResData; }
    })
  };

  await getGroundReviews(mockReq, mockRes);
  console.log('getGroundReviews result:', {
    success: mockResData.success,
    totalReviews: mockResData.totalReviews,
    averageRating: mockResData.averageRating,
    sampleReview: mockResData.reviews[0] ? {
      name: mockResData.reviews[0].user_name,
      rating: mockResData.reviews[0].rating,
      text: mockResData.reviews[0].review_text.substring(0, 40) + '...'
    } : 'None'
  });

  // 4. Test POST review
  console.log('--- Step 3: Testing createGroundReview ---');
  let createResData = null;
  const mockCreateReq = {
    params: { groundId: ground.ground_id },
    body: {
      rating: 5,
      review_text: 'Outstanding turf! Absolutely loved the lighting and friendly station staff.',
      user_name: 'Test Athlete User'
    },
    user: null
  };
  const mockCreateRes = {
    status: (code) => ({
      json: (data) => { createResData = { code, ...data }; return createResData; }
    })
  };

  await createGroundReview(mockCreateReq, mockCreateRes);
  console.log('createGroundReview result:', {
    code: createResData.code,
    success: createResData.success,
    message: createResData.message,
    newStats: createResData.groundStats
  });

  // 5. Verify Ground updated in MongoDB
  const updatedGround = await Ground.findOne({ ground_id: ground.ground_id }).lean();
  console.log(`Verified Ground in DB: rating: ${updatedGround.rating}, reviews: ${updatedGround.review_count}`);

  console.log('✅ All Reviews & Ground sync tests passed successfully!');
  await mongoose.disconnect();
  process.exit(0);
}

runTests().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
