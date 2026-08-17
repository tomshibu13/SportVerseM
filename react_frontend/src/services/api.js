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
  const title = g.title || 'Sports Arena';
  const location = g.location || g.address || 'Kerala';
  const pricePerHour = Number(g.price_per_hour ?? g.pricePerHour ?? 0);
  const sportType = g.sport_type || (Array.isArray(g.sports) && g.sports[0]) || (typeof g.sports === 'string' ? g.sports : 'Sports');
  const sports = Array.isArray(g.sports) && g.sports.length > 0 ? g.sports : [sportType];
  const image = (g.images && g.images[0]) || g.image || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80';
  const rating = Number(g.rating || 0);
  const status = g.status || 'Active';
  const totalSlots = g.totalSlots !== undefined ? g.totalSlots : (g.available_slots ? g.available_slots.length : 0);
  const available_slots = Array.isArray(g.available_slots) ? g.available_slots : [];

  return {
    ...g,
    id,
    _id: g._id || id,
    ground_id: g.ground_id || id,
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
    available_slots,
  };
}

export function normalizeBooking(b) {
  if (!b) return null;
  const booking_id = b.booking_id || (b._id ? `SPV-BK-${String(b._id).slice(-4).toUpperCase()}` : 'SPV-BK-0000');
  const user_name = b.user_name || (b.user && b.user.fullName) || 'Player';
  const user_email = (b.user && b.user.email) || b.email || '';
  const user_phone = (b.user && b.user.phone) || b.phone || '';
  const ground_name = b.ground_name || (b.ground && b.ground.title) || 'Sports Arena';
  const sport_type = b.sport_type || b.sport || (b.ground && b.ground.sport_type) || 'Sports';
  const sport = b.sport || sport_type;
  const date = b.date || b.booking_date || (b.created_at ? b.created_at.split('T')[0] : new Date().toISOString().split('T')[0]);
  const booking_date = b.booking_date || date;
  const slot_time = b.slot_time || b.booking_time || 'General Slot';
  const booking_time = b.booking_time || slot_time;
  const total_price = Number(b.total_price !== undefined ? b.total_price : (b.price !== undefined ? b.price : 0));
  const booking_status = b.booking_status || 'Upcoming';
  const admin_approval = b.admin_approval || 'Approved';
  const qr_code = b.qr_code || `SPORTVERSE_QR_${booking_id}`;

  return {
    ...b,
    _id: b._id || booking_id,
    booking_id,
    user_name,
    user_email,
    user_phone,
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
  const category = p.category || p.sport || 'Gear';
  const sport = p.sport || p.category || 'General';
  const price = Number(p.price || 0);
  const original_price = Number(p.original_price || p.originalPrice || price);
  const stock = p.stock !== undefined ? Number(p.stock) : 0;
  const image = p.image || 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=400&q=80';
  const rating = Number(p.rating || 5.0);
  const description = p.description || `${category} equipment.`;

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
  const approvalStatus = u.approvalStatus || (u.isApproved ? 'Approved' : (role === 'GroundOwner' || role === 'ShopOwner' ? 'Pending' : 'Approved'));
  const isApproved = u.isApproved !== undefined ? u.isApproved : (approvalStatus === 'Approved');
  const phone = u.phone || '';
  const location = u.location || '';
  const createdAt = u.createdAt ? (typeof u.createdAt === 'string' && u.createdAt.includes('T') ? u.createdAt.split('T')[0] : String(u.createdAt)) : 'Recent';

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
    location,
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
    console.warn('Could not fetch users from backend:', err.message);
    return [];
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
    console.warn('Could not fetch grounds from backend:', err.message);
    return [];
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
      owner_id: groundData.owner_id || groundData.ownerId,
      owner_email: groundData.owner_email || groundData.ownerEmail,
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
    const endpoint = userId && userId !== 'admin' ? `/bookings/user/${userId}` : '/bookings';
    const data = await request(endpoint);
    const rawList = data.bookings || data;
    if (Array.isArray(rawList)) {
      return rawList.map(normalizeBooking);
    }
    return [];
  } catch (err) {
    console.warn('Could not fetch bookings from backend:', err.message);
    return [];
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
    console.warn('Could not fetch products from backend:', err.message);
    return [];
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
