const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sv_station_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn(`[StationAPI] ${endpoint} failed:`, err.message);
    throw err;
  }
}

// ── Auth ──
export async function loginApi(email, password) {
  try {
    return await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  } catch (_) {
    // Demo fallback for testing — accepts SV-Station# pattern passwords
    if (password.startsWith('SV-Station#') || password === 'owner123') {
      return {
        token: 'demo-station-token',
        user: {
          id: 2,
          fullName: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Alex Arena Owner',
          email,
          role: 'GroundOwner',
          approvalStatus: 'Approved',
          phone: '+91 9876543211',
        },
      };
    }
    throw new Error('Invalid credentials. Use your station password (SV-Station#...)');
  }
}

// ── Grounds ──
export async function fetchMyGrounds() {
  try {
    const data = await request('/grounds');
    return (data.grounds || data).slice(0, 2);
  } catch (_) {
    return [
      {
        id: 1,
        title: 'Metro Sports Complex – Turf A',
        location: 'Kochi Central, Kerala',
        sports: ['Football', 'Cricket'],
        pricePerHour: 1200,
        rating: 4.8,
        status: 'Active',
        totalSlots: 14,
        occupancyPercent: 88,
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 2,
        title: 'Victory Badminton Arena – Hall 1',
        location: 'North District, Kochi',
        sports: ['Badminton'],
        pricePerHour: 500,
        rating: 4.6,
        status: 'Active',
        totalSlots: 10,
        occupancyPercent: 75,
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
      },
    ];
  }
}

// ── Bookings ──
export async function fetchMyBookings() {
  try {
    const data = await request('/bookings/user/2');
    return data.bookings || data;
  } catch (_) {
    return [
      { booking_id: 'BK-9821', user_name: 'Rahul Dravid', sport: 'Football (Turf A)', booking_date: '2026-08-14', booking_time: '18:00 - 19:00', total_price: 1200, booking_status: 'Confirmed' },
      { booking_id: 'BK-9822', user_name: 'Anjali Menon', sport: 'Badminton (Hall 1)', booking_date: '2026-08-14', booking_time: '19:00 - 20:00', total_price: 500, booking_status: 'Confirmed' },
      { booking_id: 'BK-9823', user_name: 'Vikram Seth', sport: 'Football (Turf A)', booking_date: '2026-08-13', booking_time: '20:00 - 21:00', total_price: 1200, booking_status: 'Completed' },
      { booking_id: 'BK-9824', user_name: 'Kiran Kumar', sport: 'Badminton (Hall 1)', booking_date: '2026-08-15', booking_time: '07:00 - 08:00', total_price: 500, booking_status: 'Confirmed' },
      { booking_id: 'BK-9825', user_name: 'Priya Nair', sport: 'Football (Turf A)', booking_date: '2026-08-15', booking_time: '17:00 - 18:00', total_price: 1200, booking_status: 'Cancelled' },
    ];
  }
}

export async function cancelBookingApi(bookingId) {
  try {
    return await request(`/bookings/cancel/${bookingId}`, { method: 'PUT' });
  } catch (_) {
    return { success: true };
  }
}

// ── Products ──
export async function fetchMyProducts() {
  try {
    const data = await request('/products');
    return (data.products || data).slice(0, 4);
  } catch (_) {
    return [
      { id: 1, name: 'Yonex Astrox 99 Badminton Racket', category: 'Racket', sport: 'Badminton', price: 3490, stock: 15 },
      { id: 2, name: 'Nike Mercurial Vapor Football Boot', category: 'Footwear', sport: 'Football', price: 6995, stock: 8 },
      { id: 3, name: 'Cosco FIFA Football Size 5', category: 'Gear', sport: 'Football', price: 1250, stock: 24 },
      { id: 4, name: 'Yonex Feather Shuttlecock (6 pack)', category: 'Gear', sport: 'Badminton', price: 480, stock: 50 },
    ];
  }
}
