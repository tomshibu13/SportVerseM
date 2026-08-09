const Ground = require('../models/Ground');

const mockGrounds = [
  {
    ground_id: 101,
    title: 'Elite Football Arena',
    sport_type: 'Football',
    location: 'Downtown Sports Hub, Sector 5',
    address: '102 Stadium Way, Downtown',
    distance_km: 2.2,
    price_per_hour: 800,
    rating: 4.8,
    review_count: 124,
    images: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
    ],
    facilities: ['FIFA Floodlights', 'Artificial Turf', 'Locker Room', 'Cafeteria', 'Parking'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 98,
    available_slots: [
      { slot_id: 's1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 800 },
      { slot_id: 's2', time: '07:00 AM - 08:00 AM', is_booked: true, price: 800 },
      { slot_id: 's3', time: '05:00 PM - 06:00 PM', is_booked: false, price: 950 },
      { slot_id: 's4', time: '06:00 PM - 07:00 PM', is_booked: false, price: 950 },
      { slot_id: 's5', time: '07:00 PM - 08:00 PM', is_booked: false, price: 950 }
    ]
  },
  {
    ground_id: 102,
    title: 'Victory Badminton Court',
    sport_type: 'Badminton',
    location: 'Greenwood Indoor Complex',
    address: '45 Badminton Avenue, North District',
    distance_km: 1.4,
    price_per_hour: 500,
    rating: 4.6,
    review_count: 89,
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1521537634581-0dced2efa2ab?auto=format&fit=crop&w=800&q=80'
    ],
    facilities: ['Synthetic Wooden Floor', 'Air Conditioned', 'Pro Shop', 'Water Cooler'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 94,
    available_slots: [
      { slot_id: 'b1', time: '08:00 AM - 09:00 AM', is_booked: false, price: 500 },
      { slot_id: 'b2', time: '09:00 AM - 10:00 AM', is_booked: false, price: 500 },
      { slot_id: 'b3', time: '04:00 PM - 05:00 PM', is_booked: false, price: 600 }
    ]
  },
  {
    ground_id: 103,
    title: 'Thunder Basketball Arena',
    sport_type: 'Basketball',
    location: 'Metro Sports Park',
    address: '88 Slam Dunk Drive',
    distance_km: 3.1,
    price_per_hour: 750,
    rating: 4.9,
    review_count: 210,
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'
    ],
    facilities: ['Hardwood Flooring', 'Scoreboard', 'Night Lights', 'Spectator Seating'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 96,
    available_slots: [
      { slot_id: 'c1', time: '07:00 AM - 08:00 AM', is_booked: false, price: 750 },
      { slot_id: 'c2', time: '06:00 PM - 07:00 PM', is_booked: false, price: 850 }
    ]
  },
  {
    ground_id: 104,
    title: 'Smash Tennis Club',
    sport_type: 'Tennis',
    location: 'Riverside Club Grounds',
    address: '12 Tennis Court Lane',
    distance_km: 4.0,
    price_per_hour: 900,
    rating: 4.7,
    review_count: 65,
    images: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'
    ],
    facilities: ['Clay Court', 'Grass Court', 'Coaching Available', 'Locker Room'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 91,
    available_slots: [
      { slot_id: 't1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 900 },
      { slot_id: 't2', time: '05:00 PM - 06:00 PM', is_booked: false, price: 1000 }
    ]
  },
  {
    ground_id: 105,
    title: 'Super Strikers Cricket Box',
    sport_type: 'Cricket',
    location: 'Eastside Turf Arena',
    address: '77 Pavilion Road',
    distance_km: 1.8,
    price_per_hour: 1000,
    rating: 4.8,
    review_count: 175,
    images: [
      'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80'
    ],
    facilities: ['Box Cricket Netting', 'High Lux Floodlights', 'Bowling Machine', 'Refreshment Lounge'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 97,
    available_slots: [
      { slot_id: 'cr1', time: '08:00 PM - 09:00 PM', is_booked: false, price: 1000 },
      { slot_id: 'cr2', time: '09:00 PM - 10:00 PM', is_booked: false, price: 1200 }
    ]
  }
];

exports.getAllGrounds = async (req, res) => {
  try {
    const { sport, search } = req.query;
    let grounds = [];
    try {
      grounds = await Ground.find();
    } catch (e) {
      grounds = [...mockGrounds];
    }
    if (!grounds || grounds.length === 0) {
      grounds = [...mockGrounds];
    }

    if (sport && sport !== 'All') {
      grounds = grounds.filter(g => g.sport_type.toLowerCase() === sport.toLowerCase());
    }

    if (search) {
      const q = search.toLowerCase();
      grounds = grounds.filter(g => g.title.toLowerCase().includes(q) || g.location.toLowerCase().includes(q) || g.sport_type.toLowerCase().includes(q));
    }

    return res.json({ success: true, grounds });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroundById = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let ground = null;
    try {
      ground = await Ground.findOne({ ground_id: id });
    } catch (e) {
      ground = mockGrounds.find(g => g.ground_id === id);
    }
    if (!ground) {
      ground = mockGrounds.find(g => g.ground_id === id);
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
    const newGround = {
      ground_id: Date.now(),
      title: req.body.title || 'New Sports Complex',
      sport_type: req.body.sport_type || 'Football',
      location: req.body.location || 'City Sports Zone',
      address: req.body.address || 'Main Road',
      price_per_hour: Number(req.body.price_per_hour) || 700,
      facilities: req.body.facilities || ['Floodlights', 'Parking'],
      images: [req.body.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'],
      owner_id: req.body.owner_id || 2,
      status: 'Approved',
      rating: 4.8,
      review_count: 1,
      available_slots: [
        { slot_id: 'n1', time: '06:00 AM - 07:00 AM', is_booked: false, price: Number(req.body.price_per_hour) || 700 },
        { slot_id: 'n2', time: '07:00 AM - 08:00 AM', is_booked: false, price: Number(req.body.price_per_hour) || 700 },
        { slot_id: 'n3', time: '05:00 PM - 06:00 PM', is_booked: false, price: Number(req.body.price_per_hour) || 800 }
      ]
    };

    try {
      const g = new Ground(newGround);
      await g.save();
    } catch (e) {
      mockGrounds.push(newGround);
    }

    return res.status(201).json({ success: true, message: 'Ground created successfully', ground: newGround });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMockGrounds = () => mockGrounds;
