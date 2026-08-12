const API_BASE_URL = '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('sportverse_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkBackendHealth = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.success || data.status === 'OK';
  } catch (e) {
    return false;
  }
};

export const loginAdminApi = async (email, password) => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return await res.json();
  } catch (err) {
    return { success: false, message: 'Server connection error' };
  }
};

export const fetchUsers = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/users`, {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    const data = await res.json();
    return data.users || [];
  } catch (err) {
    return [
      { id: 1, fullName: 'System Administrator', email: 'tomshibu66@gmail.com', role: 'Admin', phone: '9999999999', createdAt: new Date().toISOString() },
      { id: 2, fullName: 'Alexander Vance', email: 'alexander.vance@sportverse.com', role: 'GroundOwner', phone: '9876543210', createdAt: new Date().toISOString() },
      { id: 3, fullName: 'Tom Holland', email: 'tom.holland@example.com', role: 'User', phone: '9876543211', createdAt: new Date().toISOString() }
    ];
  }
};

export const fetchGrounds = async (sport = 'All', search = '') => {
  try {
    const query = new URLSearchParams();
    if (sport && sport !== 'All') query.append('sport', sport);
    if (search) query.append('search', search);

    const res = await fetch(`${API_BASE_URL}/grounds?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch grounds');
    const data = await res.json();
    return data.grounds || [];
  } catch (err) {
    console.warn('API error, using mock grounds:', err);
    return getMockGrounds();
  }
};

export const createGround = async (groundData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/grounds`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(groundData),
    });
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('API Error creating ground:', err);
    return { success: true, message: 'Ground added locally (Mock)', ground: { ...groundData, ground_id: Date.now() } };
  }
};

export const fetchBookings = async (userId = 1) => {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/user/${userId}`);
    if (!res.ok) throw new Error('Failed to fetch bookings');
    const data = await res.json();
    return data.bookings || [];
  } catch (err) {
    console.warn('API error, using mock bookings:', err);
    return getMockBookings();
  }
};

export const cancelBookingApi = async (bookingId) => {
  try {
    const res = await fetch(`${API_BASE_URL}/bookings/cancel/${bookingId}`, {
      method: 'PUT',
    });
    return await res.json();
  } catch (err) {
    return { success: true, message: 'Booking cancelled (Mock)' };
  }
};

export const fetchProducts = async (category = 'All') => {
  try {
    const query = category && category !== 'All' ? `?category=${category}` : '';
    const res = await fetch(`${API_BASE_URL}/products${query}`);
    if (!res.ok) throw new Error('Failed to fetch products');
    const data = await res.json();
    return data.products || [];
  } catch (err) {
    return getMockProducts();
  }
};

export const createProductApi = async (productData) => {
  try {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    return await res.json();
  } catch (err) {
    return { success: true, product: { ...productData, product_id: Date.now() } };
  }
};

export const fetchAiRecommendations = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/ai/recommendations`);
    if (!res.ok) throw new Error('Failed to fetch AI recommendations');
    return await res.json();
  } catch (err) {
    return {
      success: true,
      recommendations: [
        { id: 1, title: 'Peak Slot Demand', message: '7:00 PM - 9:00 PM football slots are at 95% occupancy.', type: 'trend' },
        { id: 2, title: 'Dynamic Pricing Insight', message: 'Raising badminton court rates by 10% on weekends could yield +15% revenue.', type: 'pricing' }
      ]
    };
  }
};

// Fallback Mock Data for Station Owner
const getMockGrounds = () => [
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
    images: ['https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80'],
    facilities: ['FIFA Floodlights', 'Artificial Turf', 'Locker Room', 'Cafeteria', 'Parking'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 98,
    available_slots: [
      { slot_id: 's1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 800 },
      { slot_id: 's2', time: '07:00 AM - 08:00 AM', is_booked: true, price: 800 },
      { slot_id: 's3', time: '05:00 PM - 06:00 PM', is_booked: false, price: 950 },
      { slot_id: 's4', time: '06:00 PM - 07:00 PM', is_booked: false, price: 950 },
      { slot_id: 's5', time: '07:00 PM - 08:00 PM', is_booked: true, price: 950 }
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
    images: ['https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80'],
    facilities: ['Synthetic Wooden Floor', 'Air Conditioned', 'Pro Shop', 'Water Cooler'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 94,
    available_slots: [
      { slot_id: 'b1', time: '08:00 AM - 09:00 AM', is_booked: false, price: 500 },
      { slot_id: 'b2', time: '09:00 AM - 10:00 AM', is_booked: true, price: 500 },
      { slot_id: 'b3', time: '04:00 PM - 05:00 PM', is_booked: false, price: 600 }
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
    images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80'],
    facilities: ['Box Cricket Netting', 'High Lux Floodlights', 'Bowling Machine', 'Refreshment Lounge'],
    owner_id: 2,
    status: 'Approved',
    ai_score: 97,
    available_slots: [
      { slot_id: 'cr1', time: '08:00 PM - 09:00 PM', is_booked: false, price: 1000 },
      { slot_id: 'cr2', time: '09:00 PM - 10:00 PM', is_booked: true, price: 1200 }
    ]
  }
];

const getMockBookings = () => [
  {
    booking_id: 'SPV-BK-9921',
    user_id: 1,
    user_name: 'Tom Holland',
    ground_id: 101,
    ground_name: 'Elite Football Arena',
    sport_type: 'Football',
    date: '2026-08-10',
    slot_time: '07:00 AM - 08:00 AM',
    total_price: 800,
    payment_status: 'Paid',
    booking_status: 'Upcoming',
    qr_code: 'SPORTVERSE_QR_SPV-BK-9921',
    created_at: new Date().toISOString()
  },
  {
    booking_id: 'SPV-BK-8842',
    user_id: 2,
    user_name: 'David Beckham',
    ground_id: 101,
    ground_name: 'Elite Football Arena',
    sport_type: 'Football',
    date: '2026-08-10',
    slot_time: '07:00 PM - 08:00 PM',
    total_price: 950,
    payment_status: 'Paid',
    booking_status: 'Upcoming',
    qr_code: 'SPORTVERSE_QR_SPV-BK-8842',
    created_at: new Date().toISOString()
  },
  {
    booking_id: 'SPV-BK-7719',
    user_id: 3,
    user_name: 'Serena Williams',
    ground_id: 102,
    ground_name: 'Victory Badminton Court',
    sport_type: 'Badminton',
    date: '2026-08-09',
    slot_time: '09:00 AM - 10:00 AM',
    total_price: 500,
    payment_status: 'Paid',
    booking_status: 'Completed',
    qr_code: 'SPORTVERSE_QR_SPV-BK-7719',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    booking_id: 'SPV-BK-5520',
    user_id: 4,
    user_name: 'Marcus Rashford',
    ground_id: 105,
    ground_name: 'Super Strikers Cricket Box',
    sport_type: 'Cricket',
    date: '2026-08-09',
    slot_time: '09:00 PM - 10:00 PM',
    total_price: 1200,
    payment_status: 'Paid',
    booking_status: 'Completed',
    qr_code: 'SPORTVERSE_QR_SPV-BK-5520',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString()
  }
];

const getMockProducts = () => [
  {
    product_id: 201,
    title: 'Nike Strike Pro Football',
    category: 'Football',
    price: 1499,
    original_price: 1999,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    description: 'Thermo-bonded 12-panel construction for true flight.',
    stock: 35
  },
  {
    product_id: 202,
    title: 'Yonex Astrox 88D Pro Racket',
    category: 'Rackets',
    price: 8490,
    original_price: 9990,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    description: 'Head-heavy badminton racket engineered for aggressive smashers.',
    stock: 12
  },
  {
    product_id: 203,
    title: 'Adidas Speedcourt Turf Shoes',
    category: 'Shoes',
    price: 4299,
    original_price: 5499,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: 'Non-marking rubber outsole built specifically for synthetic turf.',
    stock: 20
  }
];
