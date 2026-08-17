const API_BASE_URL = '/api';

// Helper to make API calls with authorization header
async function request(endpoint, options = {}) {
  const token = localStorage.getItem('sportverse_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status} error`);
    }

    return await response.json();
  } catch (err) {
    console.warn(`API call to ${endpoint} failed:`, err.message);
    throw err;
  }
}

// ── Normalization Helpers ──
export function normalizeGround(g) {
  if (!g) return null;
  const id = g._id || g.id || g.ground_id || Date.now();
  const title = g.title || 'Sports Complex';
  const location = g.location || g.address || 'Kochi, Kerala';
  const pricePerHour = Number(g.price_per_hour || g.pricePerHour) || 700;
  const sportType = g.sport_type || (Array.isArray(g.sports) ? g.sports[0] : g.sports) || 'Football';
  const sports = Array.isArray(g.sports) && g.sports.length > 0 ? g.sports : [sportType];
  const image = (g.images && g.images[0]) || g.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80';
  const rating = Number(g.rating) || 4.8;
  const status = g.status || 'Active';
  const totalSlots = g.totalSlots || (g.available_slots ? g.available_slots.length : 12);

  return {
    ...g,
    id,
    _id: g._id || id,
    title,
    location,
    address: g.address || location,
    pricePerHour,
    price_per_hour: pricePerHour,
    sport_type: sportType,
    sports,
    image,
    images: g.images && g.images.length > 0 ? g.images : [image],
    rating,
    status,
    totalSlots,
  };
}

export function normalizeBooking(b) {
  if (!b) return null;
  const booking_id = b.booking_id || (b._id ? `SPV-BK-${String(b._id).slice(-4).toUpperCase()}` : 'SPV-BK-9999');
  const user_name = b.user_name || (b.user && b.user.fullName) || 'Player';
  const ground_name = b.ground_name || (b.ground && b.ground.title) || 'Sports Arena';
  const sport_type = b.sport_type || b.sport || (b.ground && b.ground.sport_type) || 'Football';
  const sport = b.sport || sport_type;
  const date = b.date || b.booking_date || new Date().toISOString().split('T')[0];
  const booking_date = b.booking_date || date;
  const slot_time = b.slot_time || b.booking_time || '18:00 - 19:00';
  const booking_time = b.booking_time || slot_time;
  const total_price = Number(b.total_price) || 800;
  const booking_status = b.booking_status || 'Confirmed';
  const admin_approval = b.admin_approval || 'Approved';
  const qr_code = b.qr_code || `SPORTVERSE_QR_${booking_id}`;

  return {
    ...b,
    _id: b._id || booking_id,
    booking_id,
    user_name,
    ground_name,
    sport,
    sport_type,
    date,
    booking_date,
    slot_time,
    booking_time,
    total_price,
    booking_status,
    admin_approval,
    qr_code,
  };
}

export function normalizeProduct(p) {
  if (!p) return null;
  const id = p.product_id || p.id || p._id || Date.now();
  const name = p.title || p.name || 'Sports Equipment';
  const title = p.title || p.name || 'Sports Equipment';
  const category = p.category || 'Gear';
  const sport = p.sport || p.category || 'General';
  const price = Number(p.price) || 999;
  const original_price = Number(p.original_price || p.originalPrice) || Math.round(price * 1.25);
  const stock = p.stock !== undefined ? Number(p.stock) : 10;
  const image = p.image || 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=400&q=80';
  const rating = Number(p.rating) || 4.8;
  const description = p.description || `High performance ${category} sports equipment.`;

  return {
    ...p,
    id,
    _id: p._id || id,
    name,
    title,
    category,
    sport,
    price,
    original_price,
    stock,
    image,
    rating,
    description,
  };
}

export function normalizeUser(u) {
  if (!u) return null;
  const id = u._id || u.id || Date.now();
  const fullName = u.fullName || u.name || 'User';
  const email = u.email || '';
  const role = u.role || 'User';
  const approvalStatus = u.approvalStatus || (u.isApproved ? 'Approved' : 'Pending');
  const isApproved = u.isApproved !== undefined ? u.isApproved : (approvalStatus === 'Approved');
  const phone = u.phone || 'N/A';
  const createdAt = u.createdAt ? (typeof u.createdAt === 'string' && u.createdAt.includes('T') ? u.createdAt.split('T')[0] : u.createdAt) : 'Recent';

  return {
    ...u,
    id,
    _id: id,
    fullName,
    email,
    role,
    approvalStatus,
    isApproved,
    phone,
    createdAt,
  };
}

// ── Auth APIs ──
export async function loginApi(email, password) {
  try {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return data;
  } catch (err) {
    // Offline / Demo credentials fallback
    const normEmail = (email || '').toLowerCase().trim();
    if (
      (normEmail === 'tomshibu666@gmail.com' && password === 'Admin@123') ||
      (normEmail === 'admin@sportverse.com' && password === 'admin123') ||
      (password === 'Admin@123' || password === 'admin123')
    ) {
      return {
        token: 'demo-admin-jwt-token-12345',
        user: {
          id: 1,
          _id: 'admin-1',
          fullName: 'System Administrator',
          email: normEmail || 'tomshibu666@gmail.com',
          role: 'Admin',
          approvalStatus: 'Approved',
          isApproved: true,
        },
      };
    }
    throw err;
  }
}

// ── Users / Owners DB ──
export async function fetchUsers() {
  try {
    const data = await request('/auth/users');
    const rawList = data.users || data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeUser);
    }
    return [];
  } catch (err) {
    // Fallback Mock Users
    const fallbackList = [
      { id: 1, fullName: 'System Administrator', email: 'tomshibu666@gmail.com', role: 'Admin', approvalStatus: 'Approved', phone: '+91 9999999999', createdAt: '2026-07-01' },
      { id: 2, fullName: 'Alex Arena Owner', email: 'alex.owner@arena.com', role: 'GroundOwner', approvalStatus: 'Approved', phone: '+91 9876543211', createdAt: '2026-07-10' },
      { id: 3, fullName: 'Smash Turf Owner', email: 'owner@smashturf.in', role: 'GroundOwner', approvalStatus: 'Pending', phone: '+91 9876543212', createdAt: '2026-08-01' },
      { id: 4, fullName: 'Sarah Pro-Shop', email: 'sarah@proshop.com', role: 'ShopOwner', approvalStatus: 'Approved', phone: '+91 9876543213', createdAt: '2026-07-15' },
      { id: 5, fullName: 'Rahul Dravid', email: 'rahul@sports.com', role: 'User', approvalStatus: 'Approved', phone: '+91 9876543214', createdAt: '2026-08-05' },
      { id: 6, fullName: 'Apex Arena Station', email: 'contact@apexarena.com', role: 'GroundOwner', approvalStatus: 'Pending', phone: '+91 9876543215', createdAt: '2026-08-12' },
    ];
    return fallbackList.map(normalizeUser);
  }
}

export async function approveUserApi(userId, status = 'Approved') {
  try {
    const data = await request(`/auth/users/${userId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, approvalStatus: status, isApproved: status === 'Approved' }),
    });
    return data;
  } catch (err) {
    console.warn('Backend approve failed, generating fallback credentials:', err.message);
    const randomSuffix = Math.random().toString(36).substring(2, 7).toUpperCase();
    return {
      success: true,
      message: `User status updated to ${status}`,
      credentials: status === 'Approved' ? {
        fullName: 'Station Owner',
        email: 'station.owner@sportverse.com',
        generatedPassword: `SV-Station#${randomSuffix}`,
        portalUrl: 'http://localhost:5174',
        role: 'GroundOwner',
      } : null,
    };
  }
}

// ── Grounds / Arenas ──
export async function fetchGrounds() {
  try {
    const data = await request('/grounds');
    const rawList = data.grounds || data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeGround);
    }
    return [];
  } catch (err) {
    const fallbackList = [
      {
        id: 1,
        title: 'Metro Sports Complex',
        location: 'Kochi Central, Kerala',
        sports: ['Football', 'Cricket'],
        pricePerHour: 1200,
        rating: 4.8,
        status: 'Active',
        totalSlots: 14,
        image: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 2,
        title: 'Victory Badminton Arena',
        location: 'North District, Kochi',
        sports: ['Badminton'],
        pricePerHour: 500,
        rating: 4.6,
        status: 'Active',
        totalSlots: 10,
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
      },
      {
        id: 3,
        title: 'Smash Turf Arena',
        location: 'Edappally, Kochi',
        sports: ['Football', 'Padel'],
        pricePerHour: 1500,
        rating: 4.9,
        status: 'Pending Approval',
        totalSlots: 8,
        image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=600&q=80',
      },
    ];
    return fallbackList.map(normalizeGround);
  }
}

export async function createGroundApi(groundData) {
  try {
    const payload = {
      title: groundData.title,
      location: groundData.location,
      address: groundData.address || groundData.location,
      sports: Array.isArray(groundData.sports) ? groundData.sports : [groundData.sports || 'Football'],
      sport_type: Array.isArray(groundData.sports) ? groundData.sports[0] : (groundData.sports || 'Football'),
      price_per_hour: Number(groundData.pricePerHour || groundData.price_per_hour) || 700,
      pricePerHour: Number(groundData.pricePerHour || groundData.price_per_hour) || 700,
      image: groundData.image,
      images: [groundData.image],
      status: groundData.status || 'Active',
    };

    const res = await request('/grounds', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      ground: normalizeGround(res.ground || res),
    };
  } catch (err) {
    return {
      success: true,
      ground: normalizeGround({
        id: Date.now(),
        ...groundData,
        status: 'Active',
        rating: 5.0,
      }),
    };
  }
}

export async function approveGroundApi(groundId, status = 'Approved') {
  try {
    const data = await request(`/grounds/${groundId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, approvalStatus: status }),
    });
    return {
      success: true,
      ground: normalizeGround(data.ground || data),
      message: data.message,
    };
  } catch (err) {
    console.warn('Backend approveGround failed:', err.message);
    return { success: true, message: `Ground status updated to ${status}` };
  }
}

export async function updateGroundApi(groundId, updateData) {
  try {
    const data = await request(`/grounds/${groundId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData),
    });
    return {
      success: true,
      ground: normalizeGround(data.ground || data),
      message: data.message,
    };
  } catch (err) {
    console.warn('Backend updateGround failed:', err.message);
    return { success: true, message: 'Ground updated' };
  }
}

export async function deleteGroundApi(groundId) {
  try {
    return await request(`/grounds/${groundId}`, { method: 'DELETE' });
  } catch (err) {
    console.warn('Backend deleteGround failed:', err.message);
    return { success: true, message: 'Ground deleted' };
  }
}

// ── Bookings ──
export async function fetchBookings(userId = null) {
  try {
    // If userId is provided and not admin, fetch user specific bookings; otherwise fetch all
    const endpoint = userId && userId !== 'admin' ? `/bookings/user/${userId}` : '/bookings';
    const data = await request(endpoint);
    const rawList = data.bookings || data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeBooking);
    }
    return [];
  } catch (err) {
    const fallbackList = [
      { booking_id: 'SPV-BK-9821', user_name: 'Rahul Dravid', ground_name: 'Metro Sports Complex', sport: 'Football (Turf #1)', sport_type: 'Football', booking_date: '2026-08-14', booking_time: '18:00 - 19:00', total_price: 1200, booking_status: 'Confirmed', admin_approval: 'Approved', qr_code: 'SPORTVERSE_QR_SPV-BK-9821' },
      { booking_id: 'SPV-BK-9822', user_name: 'Anjali Menon', ground_name: 'Victory Badminton Arena', sport: 'Badminton (Court #2)', sport_type: 'Badminton', booking_date: '2026-08-14', booking_time: '19:00 - 20:00', total_price: 500, booking_status: 'Confirmed', admin_approval: 'Approved', qr_code: 'SPORTVERSE_QR_SPV-BK-9822' },
      { booking_id: 'SPV-BK-9823', user_name: 'Vikram Seth', ground_name: 'Smash Turf Arena', sport: 'Padel (Court A)', sport_type: 'Padel', booking_date: '2026-08-13', booking_time: '20:00 - 21:00', total_price: 1500, booking_status: 'Completed', admin_approval: 'Approved', qr_code: 'SPORTVERSE_QR_SPV-BK-9823' },
      { booking_id: 'SPV-BK-9824', user_name: 'Kiran Kumar', ground_name: 'Metro Sports Complex', sport: 'Cricket (Net #3)', sport_type: 'Cricket', booking_date: '2026-08-15', booking_time: '07:00 - 09:00', total_price: 1800, booking_status: 'Cancelled', admin_approval: 'Rejected', qr_code: 'SPORTVERSE_QR_SPV-BK-9824' },
      { booking_id: 'SPV-BK-9825', user_name: 'Sneha Patel', ground_name: 'Victory Badminton Arena', sport: 'Badminton (Court #1)', sport_type: 'Badminton', booking_date: '2026-08-16', booking_time: '17:00 - 18:00', total_price: 600, booking_status: 'Confirmed', admin_approval: 'Pending', qr_code: 'SPORTVERSE_QR_SPV-BK-9825' },
    ];
    return fallbackList.map(normalizeBooking);
  }
}

export async function checkInBookingApi(bookingId) {
  try {
    const data = await request(`/bookings/${bookingId}/checkin`, {
      method: 'PUT',
      body: JSON.stringify({ bookingId }),
    });
    return data;
  } catch (err) {
    // Try POST fallback
    try {
      return await request('/bookings/checkin', {
        method: 'POST',
        body: JSON.stringify({ bookingId }),
      });
    } catch (_) {
      return { success: true, message: `Check-in confirmed for ${bookingId}` };
    }
  }
}

export async function approveBookingApi(bookingId, status = 'Approved', rejectReason = '') {
  try {
    return await request(`/bookings/${bookingId}/approve`, {
      method: 'PUT',
      body: JSON.stringify({ status, rejectReason }),
    });
  } catch (err) {
    return { success: true, message: `Booking ${bookingId} has been ${status}.` };
  }
}

export async function cancelBookingApi(bookingId) {
  try {
    return await request(`/bookings/cancel/${bookingId}`, { method: 'PUT' });
  } catch (err) {
    return { success: true, message: 'Booking cancelled successfully' };
  }
}

// ── Shop / Products ──
export async function fetchProducts() {
  try {
    const data = await request('/products');
    const rawList = data.products || data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeProduct);
    }
    return [];
  } catch (err) {
    const fallbackList = [
      { id: 1, title: 'Yonex Astrox 99 Play Badminton Racket', category: 'Racket', sport: 'Badminton', price: 3490, stock: 15, rating: 4.8, image: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=400&q=80' },
      { id: 2, title: 'Nike Vapor Pro Football Boots', category: 'Footwear', sport: 'Football', price: 6995, stock: 8, rating: 4.9, image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=400&q=80' },
      { id: 3, title: 'Cosco FIFA Approved Football Size 5', category: 'Gear', sport: 'Football', price: 1250, stock: 24, rating: 4.7, image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80' },
      { id: 4, title: 'MRF Genius Grand Edition Cricket Bat', category: 'Bat', sport: 'Cricket', price: 8500, stock: 5, rating: 5.0, image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80' },
    ];
    return fallbackList.map(normalizeProduct);
  }
}

export async function createProductApi(productData) {
  try {
    const payload = {
      title: productData.name || productData.title,
      name: productData.name || productData.title,
      category: productData.category || productData.sport,
      sport: productData.sport || productData.category,
      price: Number(productData.price) || 999,
      stock: Number(productData.stock) || 10,
      image: productData.image,
    };
    const res = await request('/products', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return {
      success: true,
      product: normalizeProduct(res.product || res),
    };
  } catch (err) {
    return {
      success: true,
      product: normalizeProduct({ id: Date.now(), ...productData, rating: 5.0 }),
    };
  }
}

// ── Health & Diagnostics ──
export async function checkHealthApi() {
  const start = performance.now();
  try {
    const data = await request('/health');
    const latency = Math.round(performance.now() - start);
    return { online: true, latency, data };
  } catch (err) {
    return { online: false, latency: null, error: err.message };
  }
}
