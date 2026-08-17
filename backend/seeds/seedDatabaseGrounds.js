require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Ground = require('../models/Ground');

const REAL_DATABASE_GROUNDS = [
  {
    ground_id: 101,
    title: 'Kickoff Arena',
    sport_type: 'Football',
    location: 'Malaparamba, Calicut',
    address: 'Near Bypass Junction, Kozhikode, Kerala',
    latitude: 11.2480,
    longitude: 75.7910,
    distance_km: 1.5,
    price_per_hour: 800,
    rating: 4.8,
    review_count: 98,
    facilities: ['FIFA-grade Artificial Turf', 'Floodlights', 'Dressing Rooms', 'Parking', 'Mineral Water'],
    images: [
      'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 96,
    available_slots: [
      { slot_id: 'ka_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 800 },
      { slot_id: 'ka_2', time: '07:00 AM - 08:00 AM', is_booked: false, price: 800 },
      { slot_id: 'ka_3', time: '06:00 PM - 07:00 PM', is_booked: false, price: 950 },
      { slot_id: 'ka_4', time: '07:00 PM - 08:00 PM', is_booked: false, price: 950 }
    ]
  },
  {
    ground_id: 102,
    title: 'Smash Court',
    sport_type: 'Badminton',
    location: 'Mavoor Road, Calicut',
    address: 'Near Moffusil Bus Stand, Kozhikode, Kerala',
    latitude: 11.2650,
    longitude: 75.7720,
    distance_km: 1.2,
    price_per_hour: 400,
    rating: 4.9,
    review_count: 120,
    facilities: ['Synthetic BWF Approved Mat', 'Full Air Conditioning', 'Locker Facility', 'Pro Shop', 'Water Dispenser'],
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1511067007798-4029d3c7d5c0?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 98,
    available_slots: [
      { slot_id: 'sc_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 400 },
      { slot_id: 'sc_2', time: '07:00 AM - 08:00 AM', is_booked: false, price: 400 },
      { slot_id: 'sc_3', time: '07:00 PM - 08:00 PM', is_booked: false, price: 450 }
    ]
  },
  {
    ground_id: 103,
    title: 'Hoopster Court',
    sport_type: 'Basketball',
    location: 'Medical College Road, Calicut',
    address: 'Near Medical College, Kozhikode, Kerala',
    latitude: 11.2720,
    longitude: 75.7980,
    distance_km: 2.1,
    price_per_hour: 600,
    rating: 4.7,
    review_count: 76,
    facilities: ['Maple Wood Flooring', 'Electronic Scoreboard', 'Bleachers', 'Night Lighting'],
    images: [
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 92,
    available_slots: [
      { slot_id: 'hc_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 600 },
      { slot_id: 'hc_2', time: '05:00 PM - 06:00 PM', is_booked: false, price: 650 }
    ]
  },
  {
    ground_id: 104,
    title: 'Lords Cricket Turf',
    sport_type: 'Cricket',
    location: 'Palayam, Calicut',
    address: 'Railway Station Link Road, Kozhikode, Kerala',
    latitude: 11.2505,
    longitude: 75.7845,
    distance_km: 2.8,
    price_per_hour: 1000,
    rating: 4.6,
    review_count: 85,
    facilities: ['Box Cricket Net', 'Bowling Machine', 'Turf Pitch', 'Floodlights', 'Cricket Kit Rental'],
    images: [
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1531415074868-036b107e775a?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 90,
    available_slots: [
      { slot_id: 'lc_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 1000 },
      { slot_id: 'lc_2', time: '07:00 PM - 08:00 PM', is_booked: false, price: 1200 }
    ]
  },
  {
    ground_id: 105,
    title: 'Grand Slam Tennis Academy',
    sport_type: 'Tennis',
    location: 'West Hill, Calicut',
    address: 'Near Poly Junction, West Hill, Kozhikode, Kerala',
    latitude: 11.2810,
    longitude: 75.7650,
    distance_km: 3.5,
    price_per_hour: 700,
    rating: 4.8,
    review_count: 64,
    facilities: ['Clay Court', 'Synthetic Hard Court', 'Coaching Available', 'Locker Room'],
    images: [
      'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 94,
    available_slots: [
      { slot_id: 'gs_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 700 },
      { slot_id: 'gs_2', time: '05:00 PM - 06:00 PM', is_booked: false, price: 800 }
    ]
  },
  {
    ground_id: 106,
    title: 'Smash Arena',
    sport_type: 'Badminton',
    location: 'Koovapally, Kerala',
    address: 'Near Kanjirappally, Koovapally, Kottayam, Kerala',
    latitude: 9.5392,
    longitude: 76.8407,
    distance_km: 4.0,
    price_per_hour: 500,
    rating: 4.9,
    review_count: 110,
    facilities: ['BWF Standard Synthetic Court', 'Pro Lighting', 'Changing Room', 'Parking'],
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'
    ],
    owner_id: 1,
    status: 'Approved',
    ai_score: 97,
    available_slots: [
      { slot_id: 'sa_1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 500 },
      { slot_id: 'sa_2', time: '07:00 PM - 08:00 PM', is_booked: false, price: 550 }
    ]
  }
];

async function seedDatabaseGrounds() {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    for (const g of REAL_DATABASE_GROUNDS) {
      await Ground.findOneAndUpdate(
        { title: g.title },
        { $set: g },
        { upsert: true, new: true }
      );
      console.log(`✅ Synced Ground: "${g.title}" (${g.sport_type}) at Lat: ${g.latitude}, Lng: ${g.longitude}`);
    }

    console.log('🎉 All Database Grounds Synced with Exact Coordinates!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding grounds:', err);
    process.exit(1);
  }
}

seedDatabaseGrounds();
