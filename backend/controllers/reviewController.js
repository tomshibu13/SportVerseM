const mongoose = require('mongoose');
const Review = require('../models/Review');
const Ground = require('../models/Ground');
const User = require('../models/User');

// Helper to build ground query filter matching Number, String, ObjectId
function buildGroundQuery(groundId) {
  const conditions = [{ ground_id: groundId }];
  const numId = Number(groundId);
  if (!isNaN(numId)) {
    conditions.push({ ground_id: numId });
  }
  const strId = String(groundId);
  conditions.push({ ground_id: strId });
  if (mongoose.Types.ObjectId.isValid(groundId)) {
    conditions.push({ ground_id: new mongoose.Types.ObjectId(groundId) });
  }
  return { $or: conditions };
}

// ── GET /api/grounds/:groundId/reviews ──────────────────────────────────────────
exports.getGroundReviews = async (req, res) => {
  try {
    const groundId = req.params.groundId || req.query.ground_id || req.query.groundId;
    if (!groundId) {
      return res.status(400).json({ success: false, message: 'Ground ID is required' });
    }

    const query = buildGroundQuery(groundId);
    const reviews = await Review.find(query).sort({ created_at: -1 }).lean();

    // Populate user info if user_id is an ObjectId
    const populatedReviews = await Promise.all(
      reviews.map(async (rev) => {
        let reviewerName = rev.user_name || 'Sports Player';
        let reviewerAvatar = rev.user_avatar || '';
        if (rev.user_id && mongoose.Types.ObjectId.isValid(rev.user_id)) {
          const userDoc = await User.findById(rev.user_id).select('fullName profile_photo avatar role').lean();
          if (userDoc) {
            reviewerName = userDoc.fullName || reviewerName;
            reviewerAvatar = userDoc.profile_photo || userDoc.avatar || reviewerAvatar;
          }
        }
        return {
          ...rev,
          user_name: reviewerName,
          user_avatar: reviewerAvatar,
        };
      })
    );

    const totalReviews = populatedReviews.length;
    const averageRating = totalReviews > 0
      ? Number((populatedReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1))
      : 0;

    return res.status(200).json({
      success: true,
      groundId,
      totalReviews,
      averageRating,
      reviews: populatedReviews,
    });
  } catch (err) {
    console.error('❌ [ReviewController] getGroundReviews error:', err);
    return res.status(500).json({ success: false, message: 'Failed to retrieve reviews', error: err.message });
  }
};

// ── POST /api/grounds/:groundId/reviews ─────────────────────────────────────────
exports.createGroundReview = async (req, res) => {
  try {
    const groundId = req.params.groundId || req.body.ground_id || req.body.groundId;
    if (!groundId) {
      return res.status(400).json({ success: false, message: 'Ground ID is required' });
    }

    const { rating, review_text, booking_id } = req.body;
    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    // Identify user
    const userId = req.user ? req.user._id : req.body.user_id;
    const userName = req.user ? req.user.fullName : (req.body.user_name || 'Sports Player');
    const userAvatar = req.user ? (req.user.profile_photo || req.user.avatar || '') : '';

    // Generate unique review_id
    const reviewId = Date.now();

    // Verify ground exists in MongoDB
    const groundQueryConditions = [{ ground_id: groundId }];
    const numGid = Number(groundId);
    if (!isNaN(numGid)) groundQueryConditions.push({ ground_id: numGid });
    if (mongoose.Types.ObjectId.isValid(groundId)) {
      groundQueryConditions.push({ _id: new mongoose.Types.ObjectId(groundId) });
    }
    const ground = await Ground.findOne({ $or: groundQueryConditions });

    const newReview = await Review.create({
      review_id: reviewId,
      user_id: userId || null,
      user_name: userName,
      user_avatar: userAvatar,
      ground_id: ground ? ground.ground_id : groundId,
      booking_id: booking_id || '',
      rating: numRating,
      review_text: (review_text || '').trim(),
      created_at: new Date(),
    });

    // Update Ground's average rating and review_count in MongoDB
    if (ground) {
      const allGroundReviews = await Review.find(buildGroundQuery(ground.ground_id)).lean();
      const count = allGroundReviews.length;
      const sum = allGroundReviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
      const newAvgRating = count > 0 ? Number((sum / count).toFixed(1)) : numRating;

      ground.rating = newAvgRating;
      ground.review_count = count;
      await ground.save();
      console.log(`⭐ Updated Ground [${ground.title}] rating: ${newAvgRating} (${count} reviews)`);
    }

    return res.status(201).json({
      success: true,
      message: 'Review submitted successfully!',
      review: {
        ...newReview.toObject(),
        user_name: userName,
        user_avatar: userAvatar,
      },
      groundStats: ground ? { rating: ground.rating, reviewCount: ground.review_count } : null,
    });
  } catch (err) {
    console.error('❌ [ReviewController] createGroundReview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to submit review', error: err.message });
  }
};

// ── Initial Seeder for realistic sample reviews ─────────────────────────────────
exports.seedReviewsIfEmpty = async () => {
  try {
    const count = await Review.countDocuments();
    if (count > 0) return;

    const grounds = await Ground.find().limit(5).lean();
    if (!grounds || grounds.length === 0) return;

    const sampleReviews = [
      {
        rating: 5,
        review_text: 'Excellent turf quality! The floodlights are bright and the staff was very cooperative. Had an amazing 7v7 match with friends.',
        user_name: 'Rahul Varma',
      },
      {
        rating: 5,
        review_text: 'Top notch facilities! Changing rooms were clean, and parking was hassle-free. Will definitely book again next week.',
        user_name: 'Anjali Menon',
      },
      {
        rating: 4,
        review_text: 'Great playing experience. The synthetic turf is well maintained and shoes grip very well. Highly recommended for weekend games.',
        user_name: 'Mohammed Faiz',
      },
      {
        rating: 5,
        review_text: 'Smooth booking process on SportVerse and quick QR check-in at the station gate. The arena is pure professional grade!',
        user_name: 'David Thomas',
      },
    ];

    let seedCounter = 1;
    for (const g of grounds) {
      for (const s of sampleReviews) {
        await Review.create({
          review_id: Date.now() + seedCounter++,
          user_id: null,
          user_name: s.user_name,
          ground_id: g.ground_id,
          rating: s.rating,
          review_text: s.review_text,
          created_at: new Date(Date.now() - (seedCounter * 3600 * 1000 * 8)),
        });
      }
    }
    console.log('✅ Seeded realistic reviews for sample grounds.');
  } catch (err) {
    console.error('⚠️ [ReviewController] seedReviewsIfEmpty error:', err.message);
  }
};
