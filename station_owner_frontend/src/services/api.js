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
  return await request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

// ── Grounds ──
export async function fetchMyGrounds(ownerId) {
  const data = await request(`/grounds/owner/${ownerId}`);
  return data.grounds || [];
}

// ── Bookings ──
export async function fetchMyBookings(ownerId) {
  const data = await request(`/bookings/owner/${ownerId}`);
  return data.bookings || [];
}

export async function cancelBookingApi(bookingId) {
  return await request(`/bookings/cancel/${bookingId}`, { method: 'PUT' });
}

export async function checkInBookingApi(bookingIdOrQr) {
  return await request('/bookings/checkin', {
    method: 'POST',
    body: JSON.stringify({ booking_id: bookingIdOrQr }),
  });
}

// ── Products ──
export async function fetchMyProducts() {
  const data = await request('/products');
  return data.products || [];
}

export async function updateProductApi(productId, data) {
  return await request(`/products/${productId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

// ── Dashboard ──
export async function fetchDashboardStats(ownerId) {
  try {
    const data = await request(`/owner/dashboard/${ownerId}`);
    return data.stats;
  } catch (err) {
    console.error("Dashboard stats fetch failed:", err);
    return null;
  }
}
