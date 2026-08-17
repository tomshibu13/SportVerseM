import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  IndianRupee, 
  Clock, 
  CalendarCheck, 
  QrCode, 
  Sparkles, 
  CheckCircle2, 
  Plus, 
  ArrowUpRight,
  ShieldCheck,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Users,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

export default function OwnerDashboardPage({ 
  currentUser, 
  grounds = [], 
  bookings = [], 
  onOpenAddGround, 
  onOpenQRScan, 
  onEditGround,
  onManageSlots,
  onDeleteGround,
  onConfirmCheckIn,
  onCancelBooking,
  onViewQRPass,
  setActiveTab 
}) {
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [quickCheckInInput, setQuickCheckInInput] = useState('');
  const [checkInNotice, setCheckInNotice] = useState(null);

  const ownerName = currentUser?.fullName || currentUser?.name || 'Station Owner';
  const ownerEmail = currentUser?.email || 'owner@arena.com';

  const currentUserId = String(currentUser?._id || currentUser?.id || currentUser?.user_id || '').toLowerCase();
  const currentUserEmail = String(currentUser?.email || '').toLowerCase();

  // Strictly filter ONLY grounds registered by this logged-in Ground Owner
  const myGrounds = grounds.filter((g) => {
    const gOwnerId = String(g.owner_id || g.ownerId || g.owner || '').toLowerCase();
    const gOwnerEmail = String(g.owner_email || g.ownerEmail || '').toLowerCase();
    return (
      (currentUserId && gOwnerId === currentUserId) ||
      (currentUserEmail && (gOwnerId === currentUserEmail || gOwnerEmail === currentUserEmail))
    );
  });

  // Extract set of ground titles, IDs, and MongoDB _ids registered by this owner
  const myGroundIds = new Set();
  const myGroundNames = new Set();
  myGrounds.forEach((g) => {
    if (g._id) myGroundIds.add(String(g._id).toLowerCase());
    if (g.id) myGroundIds.add(String(g.id).toLowerCase());
    if (g.ground_id) myGroundIds.add(String(g.ground_id).toLowerCase());
    if (g.title) myGroundNames.add(String(g.title).toLowerCase());
  });

  // Filter ONLY bookings that belong to this owner's registered grounds
  const myBookings = bookings.filter((b) => {
    const bGroundId = String(b.ground_id || (b.ground && (b.ground._id || b.ground.ground_id)) || '').toLowerCase();
    const bGroundName = String(b.ground_name || (b.ground && b.ground.title) || '').toLowerCase();
    return myGroundIds.has(bGroundId) || myGroundNames.has(bGroundName);
  });

  // Real KPI calculations
  const totalRevenue = myBookings
    .filter((b) => b.booking_status === 'Completed' || b.booking_status === 'Confirmed' || b.booking_status === 'Upcoming')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  const completedCheckIns = myBookings.filter((b) => b.booking_status === 'Completed').length;
  const activeCourtsCount = myGrounds.length;

  // Instant Check-In Handler
  const handleQuickCheckIn = async (e) => {
    e.preventDefault();
    const query = quickCheckInInput.trim();
    if (!query) return;

    const qLower = query.toLowerCase();
    const cleanQ = query.replace(/^SPORTVERSE_QR_/i, '').trim().toLowerCase();

    const matched = myBookings.find((b) => {
      const bId = String(b.booking_id || '').toLowerCase();
      const qr = String(b.qr_code || '').toLowerCase();
      const uName = String(b.user_name || '').toLowerCase();
      return bId === qLower || qr === qLower || bId === cleanQ || qr.includes(cleanQ) || bId.includes(qLower) || (qLower.length >= 3 && uName.includes(qLower));
    });

    try {
      const targetId = matched ? matched.booking_id : query.replace(/^SPORTVERSE_QR_/i, '').trim();
      await onConfirmCheckIn(targetId);
      setCheckInNotice({
        type: 'success',
        msg: `✓ Check-in confirmed for ${matched?.user_name || 'Player'} (${targetId})!`
      });
      setQuickCheckInInput('');
    } catch (err) {
      setCheckInNotice({ type: 'error', msg: `Could not verify check-in for "${query}".` });
    }

    setTimeout(() => setCheckInNotice(null), 4000);
  };

  // Filtered Bookings
  const filteredBookings = myBookings.filter((b) => {
    const matchesFilter =
      bookingFilter === 'ALL' ||
      (bookingFilter === 'Upcoming' && (b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed')) ||
      b.booking_status === bookingFilter;

    const q = bookingSearch.toLowerCase();
    const matchesSearch =
      !q ||
      String(b.booking_id || '').toLowerCase().includes(q) ||
      String(b.user_name || '').toLowerCase().includes(q) ||
      String(b.ground_name || '').toLowerCase().includes(q) ||
      String(b.sport || b.sport_type || '').toLowerCase().includes(q);

    return matchesFilter && matchesSearch;
  });

  // Unique Customer list derived from actual bookings
  const customerMap = {};
  myBookings.forEach((b) => {
    const key = b.user_name || 'Player';
    if (!customerMap[key]) {
      customerMap[key] = {
        name: key,
        bookingsCount: 0,
        totalSpent: 0,
        lastDate: b.date || b.booking_date || 'Recent',
        sport: b.sport || b.sport_type || 'Football',
      };
    }
    customerMap[key].bookingsCount += 1;
    customerMap[key].totalSpent += Number(b.total_price) || 0;
  });
  const customerList = Object.values(customerMap);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Welcome Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.18) 0%, rgba(15, 13, 11, 0.95) 100%)',
        border: '1px solid rgba(16, 185, 129, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <ShieldCheck size={18} color="#10b981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SportVerse Verified Facility Partner
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>Welcome back, {ownerName}!</h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.25rem' }}>
            Control your sports courts, manage custom slot prices & availability schedules, and verify player check-ins.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={onOpenQRScan} style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
            <QrCode size={16} />
            <span>Launch QR Scanner</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddGround}>
            <Plus size={16} />
            <span>+ Add Court / Turf</span>
          </button>
        </div>
      </div>

      {/* Quick QR / ID Check-In Bar Widget */}
      <div className="card" style={{ background: 'rgba(15, 13, 11, 0.95)', border: '1px solid rgba(200, 137, 91, 0.3)' }}>
        <form onSubmit={handleQuickCheckIn} style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode size={18} color="#c8895b" />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Fast Player Check-In</div>
              <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>Enter Booking ID or scan pass</div>
            </div>
          </div>

          <div style={{ flex: 1, minWidth: '220px', display: 'flex', gap: '0.5rem' }}>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. SPV-BK-9821 or Player Name..."
              value={quickCheckInInput}
              onChange={(e) => setQuickCheckInInput(e.target.value)}
              style={{ fontSize: '0.85rem' }}
            />
            <button type="submit" className="btn btn-primary" style={{ whiteSpace: 'nowrap', padding: '0.4rem 1.25rem' }}>
              Verify & Check In
            </button>
          </div>
        </form>

        {checkInNotice && (
          <div style={{
            marginTop: '0.75rem',
            padding: '0.6rem 0.85rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            background: checkInNotice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
            border: checkInNotice.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
            color: checkInNotice.type === 'error' ? '#ef4444' : '#10b981',
          }}>
            {checkInNotice.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
            <span>{checkInNotice.msg}</span>
          </div>
        )}
      </div>

      {/* Station KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Gross Station Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>₹{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
            <ArrowUpRight size={14} />
            <span>Direct Payouts to Partner</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Active Courts & Turfs</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#c8895b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{activeCourtsCount} Venues</div>
          <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.3rem' }}>
            MongoDB Synced & Approved
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Total Reservations</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{myBookings.length} Bookings</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.3rem' }}>
            Player Booking Volume
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Completed Check-Ins</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{completedCheckIns} Verified</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem' }}>
            Players Welcomed on Court
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout: My Courts & Live Player Reservations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '1.5rem', alignItems: 'start' }}>
        {/* Left Column: My Venues & Facilities */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Building2 size={18} color="#c8895b" />
              <span>My Station Courts & Venues ({myGrounds.length})</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={onOpenAddGround}>
              + Add Arena
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myGrounds.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                <p>No courts registered yet.</p>
                <button className="btn btn-primary btn-sm" style={{ marginTop: '0.75rem' }} onClick={onOpenAddGround}>
                  + Register Your First Court
                </button>
              </div>
            ) : (
              myGrounds.map((g) => (
                <div key={g.id || g._id} style={{
                  padding: '1rem',
                  background: 'rgba(10, 9, 8, 0.8)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', gap: '0.85rem' }}>
                    <img
                      src={g.image || (g.images && g.images[0]) || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80'}
                      alt={g.title}
                      style={{ width: '68px', height: '68px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {g.title}
                        </h4>
                        <span className="badge badge-green">Live</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                        <MapPin size={12} color="#c8895b" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{g.location || g.address}</span>
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#c8895b', fontWeight: 700, marginTop: '0.25rem' }}>
                        ₹{g.pricePerHour || g.price_per_hour}/hr • {Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || 'Football')}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar for Ground */}
                  <div style={{ display: 'flex', gap: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.65rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ flex: 1.2, fontSize: '0.75rem', gap: '0.3rem' }}
                      onClick={() => onManageSlots(g)}
                    >
                      <Clock size={13} color="#c8895b" />
                      <span>Manage Slots & Rates</span>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.6rem' }}
                      title="Edit Details"
                      onClick={() => onEditGround(g)}
                    >
                      <Edit2 size={13} color="#a39c93" />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.3rem 0.6rem', color: '#ef4444' }}
                      title="Remove Court"
                      onClick={() => onDeleteGround(g)}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Player Reservations & Live Check-In Table */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="card-title">
              <CalendarCheck size={18} color="#3b82f6" />
              <span>Player Reservations ({myBookings.length})</span>
            </h3>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.3rem' }}>
              {['ALL', 'Upcoming', 'Completed', 'Cancelled'].map((f) => (
                <button
                  key={f}
                  onClick={() => setBookingFilter(f)}
                  style={{
                    background: bookingFilter === f ? '#c8895b' : 'rgba(255,255,255,0.05)',
                    color: bookingFilter === f ? '#ffffff' : '#a39c93',
                    border: 'none',
                    padding: '0.25rem 0.55rem',
                    borderRadius: '6px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box */}
          <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
            <Search size={14} color="#a39c93" />
            <input
              type="text"
              placeholder="Search player name, booking ID, sport..."
              value={bookingSearch}
              onChange={(e) => setBookingSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.8rem', width: '100%' }}
            />
          </div>

          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Player</th>
                  <th>Slot Time</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                      No reservations match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => (
                    <tr key={b.booking_id || b._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#c8895b', fontSize: '0.8rem' }}>{b.booking_id}</div>
                        <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{b.sport || b.sport_type || 'Football'}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#ffffff', fontSize: '0.85rem' }}>{b.user_name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{b.date || b.booking_date}</div>
                      </td>
                      <td style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                        {b.booking_time || b.slot_time}
                      </td>
                      <td style={{ fontWeight: 700, color: '#10b981', fontSize: '0.85rem' }}>
                        ₹{b.total_price}
                      </td>
                      <td>
                        <span className={`badge ${b.booking_status === 'Completed' ? 'badge-green' : b.booking_status === 'Cancelled' ? 'badge-red' : 'badge-blue'}`}>
                          {b.booking_status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center' }}>
                          {onViewQRPass && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '0.2rem 0.45rem', fontSize: '0.7rem' }}
                              onClick={() => onViewQRPass(b)}
                              title="View Gate QR Pass"
                            >
                              <QrCode size={12} color="#c8895b" />
                            </button>
                          )}
                          {b.booking_status !== 'Completed' && b.booking_status !== 'Cancelled' && (
                            <>
                              <button
                                className="btn btn-sm"
                                style={{ background: '#10b981', color: '#ffffff', padding: '0.2rem 0.5rem', fontSize: '0.7rem', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={() => onConfirmCheckIn(b.booking_id)}
                                title="Confirm Player Check-In"
                              >
                                <Check size={12} />
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ padding: '0.2rem 0.4rem', color: '#ef4444', fontSize: '0.7rem' }}
                                onClick={() => onCancelBooking(b.booking_id)}
                                title="Cancel Booking"
                              >
                                <X size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Customer Directory & Analytics Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        {/* Customer Directory */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} color="#c8895b" />
              <span>Station Players & Customers Directory ({customerList.length})</span>
            </h3>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Player Name</th>
                  <th>Favorite Sport</th>
                  <th>Reservations</th>
                  <th>Total Spent</th>
                </tr>
              </thead>
              <tbody>
                {customerList.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#a39c93' }}>
                      No player history recorded yet.
                    </td>
                  </tr>
                ) : (
                  customerList.slice(0, 5).map((c, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, color: '#ffffff' }}>{c.name}</td>
                      <td>
                        <span className="badge badge-gold" style={{ fontSize: '0.7rem' }}>{c.sport}</span>
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.bookingsCount} bookings</td>
                      <td style={{ fontWeight: 700, color: '#10b981' }}>₹{c.totalSpent.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Demand & Utilization Insights */}
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.12) 0%, rgba(15, 13, 11, 0.95) 100%)' }}>
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} color="#10b981" />
              <span>Court Demand & Occupancy Analytics</span>
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#a39c93' }}>Peak Reservation Window</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#ffffff' }}>05:00 PM - 10:00 PM</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#a39c93' }}>Weekend Occupancy Rate</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10b981' }}>91.4%</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#a39c93' }}>AI Dynamic Surge Yield</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#c8895b' }}>+₹4,250 / week</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#a39c93', lineHeight: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.75rem' }}>
              💡 Tip: You can adjust individual slot rates or turn on the <strong>AI Surge Multiplier</strong> under the <strong>Slots & Dynamic Pricing</strong> tab to optimize venue earnings during evening match slots.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
