const mongoose = require('mongoose');
const Ground = require('../models/Ground');
const User = require('../models/User');

const seedGroundsIfEmpty = async () => {
  // Seeding disabled
};

exports.seedGroundsIfEmpty = seedGroundsIfEmpty;

exports.getAllGrounds = async (req, res) => {
  try {
    const { sport, search } = req.query;
    await seedGroundsIfEmpty();
    let grounds = await Ground.find();

    if (sport && sport !== 'All') {
      grounds = grounds.filter(g => g.sport_type.toLowerCase() === sport.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      grounds = grounds.filter(g => g.title.toLowerCase().includes(q) || g.location.toLowerCase().includes(q) || g.sport_type.toLowerCase().includes(q));
    }

    return res.json({ success: true, grounds: grounds || [] });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroundById = async (req, res) => {
  try {
    const paramId = req.params.id;
    const numId = parseInt(paramId, 10);
    await seedGroundsIfEmpty();

    let ground = null;
    if (!isNaN(numId)) {
      ground = await Ground.findOne({ ground_id: numId });
    }
    if (!ground && mongoose.Types.ObjectId.isValid(paramId)) {
      ground = await Ground.findById(paramId);
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }
    return res.json({ success: true, ground });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createGround = async (req, res) => {
  try {
    const ownerId = req.body.owner_id || 2;

    // Promote user role/status in MongoDB if they are currently just a User
    if (ownerId && mongoose.Types.ObjectId.isValid(ownerId)) {
      const user = await User.findById(ownerId);
      if (user && user.role !== 'Admin' && user.role !== 'GroundOwner') {
        user.role = 'GroundOwner';
        user.approvalStatus = 'Pending';
        user.isApproved = false;
        await user.save();
        console.log(`👤 Promoted user ${user.email} to GroundOwner (Pending Approval)`);
      }
    }

    const sportType = req.body.sport_type || (Array.isArray(req.body.sports) ? req.body.sports[0] : req.body.sports) || 'Football';
    const pricePerHour = Number(req.body.price_per_hour || req.body.pricePerHour) || 700;
    const groundImages = req.body.images && req.body.images.length > 0
      ? req.body.images
      : [req.body.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'];

    const newGround = {
      ground_id: Date.now(),
      title: req.body.title || 'New Sports Complex',
      sport_type: sportType,
      location: req.body.location || 'City Sports Zone',
      address: req.body.address || req.body.location || 'Main Road',
      price_per_hour: pricePerHour,
      facilities: req.body.facilities || ['Floodlights', 'Parking'],
      images: groundImages,
      owner_id: ownerId,
      status: req.body.status || 'Active',
      rating: 4.8,
      review_count: 1,
      available_slots: [
        { slot_id: 'n1', time: '06:00 AM - 07:00 AM', is_booked: false, price: pricePerHour },
        { slot_id: 'n2', time: '07:00 AM - 08:00 AM', is_booked: false, price: pricePerHour },
        { slot_id: 'n3', time: '05:00 PM - 06:00 PM', is_booked: false, price: Math.round(pricePerHour * 1.2) }
      ]
    };

    const g = new Ground(newGround);
    await g.save();

    return res.status(201).json({ success: true, message: 'Ground created successfully in MongoDB', ground: g });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin updates ground status (Approved / Pending / Rejected)
// @route   PUT /api/grounds/:id/approve or PUT /api/grounds/:id/status
// @access  Admin
exports.approveGround = async (req, res) => {
  try {
    const groundId = req.params.id;
    const { status = 'Approved', approvalStatus } = req.body;
    const targetStatus = approvalStatus || status;
    const normalizedStatus = targetStatus === 'Active' ? 'Approved' : targetStatus;

    let ground = null;
    const numId = parseInt(groundId, 10);
    if (!isNaN(numId)) {
      ground = await Ground.findOne({ ground_id: numId });
    }
    if (!ground && mongoose.Types.ObjectId.isValid(groundId)) {
      ground = await Ground.findById(groundId);
    }

    if (!ground) {
      return res.status(404).json({ success: false, message: 'Ground not found in MongoDB database' });
    }

    ground.status = normalizedStatus;
    await ground.save();

    // Also update owner approval if ground is approved
    if (ground.owner_id && mongoose.Types.ObjectId.isValid(ground.owner_id)) {
      const owner = await User.findById(ground.owner_id);
      if (owner && normalizedStatus === 'Approved') {
        owner.approvalStatus = 'Approved';
        owner.isApproved = true;
        await owner.save();
      }
    }

    console.log(`🏟️ Ground ${ground.title} (${ground._id}) status updated to ${normalizedStatus} in MongoDB!`);

    return res.status(200).json({
      success: true,
      message: `Ground status updated to ${normalizedStatus} in MongoDB`,
      ground
    });
  } catch (error) {
    console.error('❌ approveGround error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin deletes a sports ground from MongoDB
// @route   DELETE /api/grounds/:id
// @access  Admin
exports.deleteGround = async (req, res) => {
  try {
    const groundId = req.params.id;
    let deleted = null;
    const numId = parseInt(groundId, 10);
    if (!isNaN(numId)) {
      deleted = await Ground.findOneAndDelete({ ground_id: numId });
    }
    if (!deleted && mongoose.Types.ObjectId.isValid(groundId)) {
      deleted = await Ground.findByIdAndDelete(groundId);
    }

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Ground not found in MongoDB' });
    }

    console.log(`🗑️ Ground ${deleted.title} deleted from MongoDB database!`);
    return res.status(200).json({ success: true, message: 'Ground deleted successfully from MongoDB' });
  } catch (error) {
    console.error('❌ deleteGround error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};



