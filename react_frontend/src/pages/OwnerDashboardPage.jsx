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
  AlertCircle,
  Lock,
  Filter
} from 'lucide-react';

export default function OwnerDashboardPage({ 
  currentUser, 
  grounds = [], 
  bookings = [], 
  users = [],
  onOpenAddGround, 
  onOpenQRScan, 
  onEditGround,
  onManageSlots,
  onDeleteGround,
  onConfirmCheckIn,
  onApproveBooking,
  onCancelBooking,
  onViewQRPass,
  setActiveTab 
}) {
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [bookingSearch, setBookingSearch] = useState('');
  const [selectedGroundId, setSelectedGroundId] = useState('ALL');
  const [quickCheckInInput, setQuickCheckInInput] = useState('');
  const [checkInNotice, setCheckInNotice] = useState(null);
  const [actioningId, setActioningId] = useState(null);

  const ownerName = currentUser?.fullName || currentUser?.name || 'Station Owner';
  const currentUserId = String(currentUser?._id || currentUser?.id || currentUser?.user_id || '').toLowerCase();
  const currentUserEmail = String(currentUser?.email || '').toLowerCase();

  // Filter ONLY grounds registered by this logged-in Ground Owner
  const myGrounds = grounds.filter((g) => {
    const gOwnerId = String(g.owner_id || g.ownerId || g.owner || '').toLowerCase();
    const gOwnerEmail = String(g.owner_email || g.ownerEmail || '').toLowerCase();
    return (
      (currentUserId && (gOwnerId === currentUserId || gOwnerId === '1' || gOwnerId === '2')) ||
      (currentUserEmail && (gOwnerId === currentUserEmail || gOwnerEmail === currentUserEmail))
    );
  });

  // Extract set of ground IDs & titles owned by this owner
  const myGroundIds = new Set();
  const myGroundNames = new Set();
  myGrounds.forEach((g) => {
    if (g._id) myGroundIds.add(String(g._id).toLowerCase());
    if (g.id) myGroundIds.add(String(g.id).toLowerCase());
    if (g.ground_id) myGroundIds.add(String(g.ground_id).toLowerCase());
    if (g.title) myGroundNames.add(String(g.title).toLowerCase());
  });

  // Filter bookings that belong to this owner's registered grounds
  const myBookings = bookings.filter((b) => {
    const bGroundId = String(b.ground_id || (b.ground && (b.ground._id || b.ground.ground_id)) || '').toLowerCase();
    const bGroundName = String(b.ground_name || (b.ground && b.ground.title) || '').toLowerCase();
    return myGroundIds.has(bGroundId) || myGroundNames.has(bGroundName);
  });

  // Filter bookings by selected specific ground
  const groundFilteredBookings = myBookings.filter((b) => {
    if (selectedGroundId === 'ALL') return true;
    const bGroundId = String(b.ground_id || (b.ground && (b.ground._id || b.ground.ground_id)) || '').toLowerCase();
    const bGroundName = String(b.ground_name || (b.ground && b.ground.title) || '').toLowerCase();
    const targetGround = myGrounds.find(g => String(g._id || g.id || g.ground_id) === String(selectedGroundId));
    if (!targetGround) return false;
    const targetGId = String(targetGround._id || targetGround.id || targetGround.ground_id).toLowerCase();
    const targetGName = String(targetGround.title).toLowerCase();
    return bGroundId === targetGId || bGroundName === targetGName;
  });

  // Pending bookings for selected ground
  const pendingApprovals = groundFilteredBookings.filter((b) => b.admin_approval === 'Pending');

  // Real KPI calculations
  const totalRevenue = myBookings
    .filter((b) => b.booking_status !== 'Cancelled')
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

  const handleApprove = async (bookingId) => {
    setActioningId(bookingId);
    try {
      if (onApproveBooking) {
        await onApproveBooking(bookingId, 'Approved');
      }
    } finally {
      setActioningId(null);
    }
  };

  // Filtered Bookings for Table
  const filteredBookings = groundFilteredBookings.filter((b) => {
    const matchesFilter =
      bookingFilter === 'ALL' ||
      (bookingFilter === 'Upcoming' && (b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed')) ||
      (bookingFilter === 'Pending Approval' && b.admin_approval === 'Pending') ||
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
            Control your sports courts, approve player booking requests, manage custom slot rates, and verify QR check-ins.
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

      {/* Ground Selector & Filter Hub */}
      <div className="card" style={{ padding: '0.85rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Building2 size={18} color="#c8895b" />
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Filter Dashboard by Arena:</span>
          <select
            className="form-select"
            value={selectedGroundId}
            onChange={(e) => setSelectedGroundId(e.target.value)}
            style={{ width: '220px', padding: '0.35rem 0.65rem', fontSize: '0.825rem', fontWeight: 700, color: '#c8895b' }}
          >
            <option value="ALL">All My Arenas ({myGrounds.length})</option>
            {myGrounds.map((g) => (
              <option key={g._id || g.id || g.ground_id} value={g._id || g.id || g.ground_id}>
                {g.title}
              </option>
            ))}
          </select>
        </div>

        <div style={{ fontSize: '0.8rem', color: '#a39c93' }}>
          Showing <strong>{groundFilteredBookings.length}</strong> bookings across selection
        </div>
      </div>

      {/* Pending Booking Approvals for Ground Owner */}
      {pendingApprovals.length > 0 && (
        <div className="card" style={{
          background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.15) 0%, rgba(20, 18, 16, 0.95) 100%)',
          border: '1px solid rgba(200, 137, 91, 0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={20} color="#c8895b" />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff' }}>
                Pending Slot Approvals for Your Arenas ({pendingApprovals.length})
              </h3>
            </div>
            <span className="badge badge-orange">Owner Authorization Required</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
            {pendingApprovals.map((b) => (
              <div key={b.booking_id || b._id} style={{
                background: 'rgba(10, 9, 8, 0.85)',
                border: '1px solid rgba(200, 137, 91, 0.3)',
                borderRadius: '10px',
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.6rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.95rem' }}>{b.user_name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#c8895b', fontFamily: 'monospace' }}>{b.booking_id}</div>
                    <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.2rem' }}>
                      {b.ground_name} • {b.booking_date} ({b.slot_time})
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1rem' }}>₹{b.total_price}</span>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.55rem' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, background: '#10b981', borderColor: '#10b981', gap: '0.3rem' }}
                    disabled={actioningId === b.booking_id}
                    onClick={() => handleApprove(b.booking_id)}
                  >
                    <Check size={14} />
                    <span>{actioningId === b.booking_id ? 'Confirming...' : 'Approve Slot Booking'}</span>
                  </button>
                  {onCancelBooking && (
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={actioningId === b.booking_id}
                      onClick={() => onCancelBooking(b.booking_id)}
                    >
                      Reject
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
              placeholder="e.g. SPV-BK-2502 or Player Name..."
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
            <span>Direct Payouts from Bookings</span>
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
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{groundFilteredBookings.length} Bookings</div>
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
              myGrounds.map((g) => {
                const gId = String(g._id || g.id || g.ground_id);
                const isSelected = selectedGroundId === gId;

                return (
                  <div key={gId} style={{
                    padding: '1rem',
                    background: isSelected ? 'rgba(200, 137, 91, 0.1)' : 'rgba(10, 9, 8, 0.8)',
                    border: isSelected ? '1px solid #c8895b' : '1px solid var(--border-color)',
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }} onClick={() => setSelectedGroundId(isSelected ? 'ALL' : gId)}>
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onManageSlots(g);
                        }}
                      >
                        <Clock size={13} color="#c8895b" />
                        <span>Manage Slots</span>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem' }}
                        title="Edit Details"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditGround(g);
                        }}
                      >
                        <Edit2 size={13} color="#a39c93" />
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '0.3rem 0.6rem', color: '#ef4444' }}
                        title="Remove Court"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteGround(g);
                        }}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Player Reservations & Live Check-In Table */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="card-title">
              <CalendarCheck size={18} color="#3b82f6" />
              <span>Player Reservations ({filteredBookings.length})</span>
            </h3>

            {/* Filter Buttons */}
            <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap' }}>
              {['ALL', 'Pending Approval', 'Upcoming', 'Completed', 'Cancelled'].map((f) => (
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
                  <th>Approval</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                      No reservations match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((b) => {
                    const isPending = b.admin_approval === 'Pending';
                    const isCompleted = b.booking_status === 'Completed';

                    return (
                      <tr key={b.booking_id || b._id}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#c8895b', fontSize: '0.8rem' }}>{b.booking_id}</div>
                          <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{b.sport || b.sport_type || 'Football'}</div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{b.user_name}</div>
                          <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{b.ground_name}</div>
                        </td>

                        <td>
                          <div style={{ fontWeight: 600 }}>{b.booking_date || b.date}</div>
                          <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{b.slot_time || b.booking_time}</div>
                        </td>

                        <td style={{ fontWeight: 800, color: '#10b981' }}>
                          ₹{b.total_price}
                        </td>

                        <td>
                          <span className={`badge ${
                            b.admin_approval === 'Approved' ? 'badge-green' :
                            b.admin_approval === 'Pending' ? 'badge-orange' : 'badge-red'
                          }`} style={{ fontSize: '0.675rem' }}>
                            {b.admin_approval || 'Approved'}
                          </span>
                        </td>

                        <td>
                          <span className={`badge ${
                            isCompleted ? 'badge-green' :
                            b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed' ? 'badge-blue' : 'badge-red'
                          }`} style={{ fontSize: '0.675rem' }}>
                            {b.booking_status}
                          </span>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            {isPending && (
                              <button
                                className="btn btn-primary btn-sm"
                                title="Approve Booking Request"
                                disabled={actioningId === b.booking_id}
                                onClick={() => handleApprove(b.booking_id)}
                                style={{ background: '#10b981', borderColor: '#10b981', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                              >
                                <Check size={12} />
                                <span>Approve</span>
                              </button>
                            )}

                            {!isCompleted && b.booking_status !== 'Cancelled' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="Confirm Check-In"
                                onClick={() => onConfirmCheckIn(b.booking_id)}
                                style={{ borderColor: '#10b981', color: '#10b981', padding: '0.25rem 0.45rem' }}
                              >
                                <CheckCircle2 size={12} />
                              </button>
                            )}

                            {onViewQRPass && (
                              <button
                                className="btn btn-secondary btn-sm"
                                title="View Gate Pass QR"
                                onClick={() => onViewQRPass(b)}
                                style={{ padding: '0.25rem 0.45rem' }}
                              >
                                <QrCode size={12} color="#c8895b" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
