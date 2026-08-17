import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  CalendarCheck, 
  IndianRupee, 
  ArrowUpRight, 
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  QrCode,
  Check,
  X,
  TrendingUp,
  RefreshCw,
  Search,
  ShieldCheck,
  ExternalLink,
  Sliders,
  Layers,
  ShoppingBag,
  Activity,
  Building2,
  Lock,
  Filter
} from 'lucide-react';

export default function OverviewPage({ 
  grounds = [], 
  bookings = [], 
  users = [],
  products = [],
  currentUser = null,
  pendingOwnersCount = 0,
  pendingBookingsCount = 0,
  onOpenQRScan, 
  onOpenAddGround, 
  setActiveTab,
  onConfirmCheckIn,
  onApproveBooking,
  onCancelBooking,
  onApproveGround,
  onApproveUser,
  onViewQRPass,
  onEditGround,
  onManageSlots,
  onRefresh,
  refreshing = false,
}) {
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedSportFilter, setSelectedSportFilter] = useState('ALL');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('ALL');
  const [selectedGroundForApproval, setSelectedGroundForApproval] = useState('ALL');
  const [actioningId, setActioningId] = useState(null);

  // ── Helper: Match Booking to Ground ──
  const findGroundForBooking = (b) => {
    if (!b) return null;
    const bGId = String(b.ground_id || (b.ground && (b.ground._id || b.ground.ground_id)) || '').toLowerCase();
    const bGName = String(b.ground_name || (b.ground && b.ground.title) || '').trim().toLowerCase();

    return grounds.find((g) => {
      const gId = String(g._id || g.id || g.ground_id || '').toLowerCase();
      const gName = String(g.title || '').trim().toLowerCase();
      return (bGId && (bGId === gId || bGId === String(g.ground_id))) || (bGName && bGName === gName);
    }) || null;
  };

  // ── Helper: Check if Current User is Owner of Ground ──
  const checkIsGroundOwner = (ground) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true; // Superadmin has master clearance
    if (!ground) return false;
    const currentUserId = String(currentUser._id || currentUser.id || '').toLowerCase();
    const currentUserEmail = String(currentUser.email || '').toLowerCase();
    const gOwnerId = String(ground.owner_id || ground.ownerId || ground.owner || '').toLowerCase();
    return (currentUserId && gOwnerId === currentUserId) || (currentUserEmail && gOwnerId === currentUserEmail);
  };

  // ── 1. Calculate Real Financial Metrics from Database ──
  const nonCancelledBookings = bookings.filter((b) => b.booking_status !== 'Cancelled');
  const totalRevenue = nonCancelledBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
  
  const completedBookings = bookings.filter((b) => b.booking_status === 'Completed');
  const completedRevenue = completedBookings.reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
  const completedCount = completedBookings.length;

  const upcomingBookings = bookings.filter((b) => b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed');
  const upcomingCount = upcomingBookings.length;
  
  const cancelledBookings = bookings.filter((b) => b.booking_status === 'Cancelled');
  const cancelledCount = cancelledBookings.length;

  const avgBookingValue = nonCancelledBookings.length > 0 
    ? Math.round(totalRevenue / nonCancelledBookings.length) 
    : 0;

  // ── 2. Calculate User Demographics ──
  const playerCount = users.filter((u) => u.role === 'User' || !u.role).length;
  const groundOwnerCount = users.filter((u) => u.role === 'GroundOwner').length;
  const pendingOwners = users.filter((u) => u.role === 'GroundOwner' && u.approvalStatus === 'Pending');

  // ── 3. Calculate Ground Metrics ──
  const approvedGroundsCount = grounds.filter((g) => g.status === 'Approved' || g.status === 'Active').length;
  const pendingGroundsCount = grounds.filter((g) => g.status === 'Pending' || g.status === 'Pending Approval').length;
  const pendingBookingsList = bookings.filter((b) => b.admin_approval === 'Pending');

  const pendingTotal = pendingOwners.length + pendingBookingsList.length + pendingGroundsCount;

  // ── Filter Pending Bookings strictly based on Selected Ground ──
  const filteredPendingBookings = pendingBookingsList.filter((b) => {
    if (selectedGroundForApproval === 'ALL') return true;
    const bGround = findGroundForBooking(b);
    if (!bGround) return false;
    const gId = String(bGround._id || bGround.id || bGround.ground_id);
    return gId === String(selectedGroundForApproval);
  });

  const selectedGroundObj = selectedGroundForApproval !== 'ALL'
    ? grounds.find((g) => String(g._id || g.id || g.ground_id) === String(selectedGroundForApproval))
    : null;

  // ── 4. Dynamic Sport Demand Breakdown ──
  const sportCounts = {};
  const sportRevenues = {};
  bookings.forEach((b) => {
    const rawSport = b.sport_type || b.sport || 'General';
    const sName = rawSport.includes('Badminton') ? 'Badminton' :
      rawSport.includes('Football') ? 'Football' :
      rawSport.includes('Cricket') ? 'Cricket' :
      rawSport.includes('Padel') ? 'Padel' :
      rawSport.includes('Tennis') ? 'Tennis' : rawSport;
    
    sportCounts[sName] = (sportCounts[sName] || 0) + 1;
    if (b.booking_status !== 'Cancelled') {
      sportRevenues[sName] = (sportRevenues[sName] || 0) + (Number(b.total_price) || 0);
    }
  });

  const totalBookingsCount = Math.max(bookings.length, 1);
  const sportList = Object.keys(sportCounts).map((sport) => ({
    sport,
    count: sportCounts[sport],
    percentage: Math.round((sportCounts[sport] / totalBookingsCount) * 100),
    revenue: sportRevenues[sport] || 0,
  })).sort((a, b) => b.count - a.count);

  // ── 5. Filtering for Venue Directory ──
  const filteredGrounds = grounds.filter((g) => {
    const sportName = g.sport_type || (Array.isArray(g.sports) ? g.sports.join(' ') : g.sports) || '';
    const matchesSport = selectedSportFilter === 'ALL' || 
      (selectedSportFilter === 'Pending' ? (g.status === 'Pending' || g.status === 'Pending Approval') : sportName.toLowerCase().includes(selectedSportFilter.toLowerCase()));
    const q = venueSearch.toLowerCase();
    const matchesSearch = !venueSearch || 
      (g.title && g.title.toLowerCase().includes(q)) ||
      (g.location && g.location.toLowerCase().includes(q)) ||
      sportName.toLowerCase().includes(q);
    return matchesSport && matchesSearch;
  });

  // ── 6. Filtering for Recent Bookings Stream ──
  const filteredBookings = bookings.filter((b) => {
    if (bookingFilterStatus === 'ALL') return true;
    if (bookingFilterStatus === 'Pending') return b.admin_approval === 'Pending';
    return b.booking_status === bookingFilterStatus;
  });

  // Handle direct inline approvals
  const handleApproveOwner = async (user) => {
    setActioningId(user._id || user.id);
    try {
      if (onApproveUser) await onApproveUser(user, 'Approved');
    } finally {
      setActioningId(null);
    }
  };

  const handleApproveBookingDirect = async (bookingId, ground) => {
    if (!checkIsGroundOwner(ground)) {
      alert('Only the registered Ground Owner (or Superadmin) has permission to approve bookings for this venue.');
      return;
    }
    setActioningId(bookingId);
    try {
      if (onApproveBooking) await onApproveBooking(bookingId, 'Approved');
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* ─────────────────────────────────────────────────────────────
          SECTION 1: Executive Command Banner & Real-time Live Status
          ───────────────────────────────────────────────────────────── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.18) 0%, rgba(20, 18, 16, 0.95) 100%)',
        border: '1px solid rgba(200, 137, 91, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        flexWrap: 'wrap',
        gap: '1.25rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              color: '#10b981',
              padding: '0.2rem 0.6rem',
              borderRadius: '20px',
              fontSize: '0.725rem',
              fontWeight: 700,
              letterSpacing: '0.04em',
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              DATABASE CONNECTED
            </span>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c8895b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SportVerse Superadmin Console
            </span>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            System Overview & Operations Center
          </h1>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.25rem', maxWidth: '650px' }}>
            Real-time control console querying live MongoDB collections: managing <strong>{grounds.length} sports arenas</strong>, <strong>{users.length} platform users</strong>, and <strong>{bookings.length} player reservations</strong>.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          {onRefresh && (
            <button 
              className="btn btn-secondary" 
              onClick={onRefresh}
              disabled={refreshing}
              title="Refresh all metrics from MongoDB"
              style={{ fontSize: '0.825rem' }}
            >
              <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
              <span>{refreshing ? 'Syncing...' : 'Sync DB'}</span>
            </button>
          )}

          <button className="btn btn-secondary" onClick={onOpenQRScan} style={{ fontSize: '0.825rem', borderColor: 'rgba(200, 137, 91, 0.4)', color: '#c8895b' }}>
            <QrCode size={15} color="#c8895b" />
            <span>QR Scanner</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenAddGround} style={{ fontSize: '0.825rem' }}>
            <Sparkles size={15} />
            <span>+ Add Ground</span>
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 2: Executive KPI Metrics Cards (6-Stat Grid)
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.15rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Revenue
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={17} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.35rem', fontWeight: 600 }}>
            <ArrowUpRight size={13} />
            <span>₹{completedRevenue.toLocaleString()} completed</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Sports Arenas
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={17} color="#c8895b" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {grounds.length} Arenas
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c8895b', marginTop: '0.35rem', fontWeight: 600 }}>
            {approvedGroundsCount} Active Live • {pendingGroundsCount} Pending
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Bookings
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={17} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {bookings.length} Slots
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.35rem', fontWeight: 600 }}>
            {completedCount} Completed • {upcomingCount} Upcoming
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Platform Users
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(168, 85, 247, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={17} color="#c084fc" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            {users.length} Accounts
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.35rem' }}>
            {playerCount} Players • {groundOwnerCount} Owners
          </div>
        </div>

        <div 
          className="card" 
          style={{ 
            border: pendingTotal > 0 ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid var(--border-color)',
            background: pendingTotal > 0 ? 'rgba(245, 158, 11, 0.05)' : 'var(--bg-card)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: pendingTotal > 0 ? '#f59e0b' : '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Pending Approvals
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={17} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: pendingTotal > 0 ? '#f59e0b' : '#ffffff', letterSpacing: '-0.02em' }}>
            {pendingTotal} Actions
          </div>
          <div 
            style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.35rem', cursor: 'pointer', fontWeight: 600 }}
            onClick={() => setActiveTab(pendingOwners.length > 0 ? 'users' : 'bookings')}
          >
            {pendingOwners.length} Owners • {pendingBookingsList.length} Bookings →
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.775rem', fontWeight: 600, color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Avg Booking Value
            </span>
            <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={17} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
            ₹{avgBookingValue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.35rem' }}>
            Per 1-hour court session
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 3: Ground-Specific Booking Approvals & Owner Action Hub
          ───────────────────────────────────────────────────────────── */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.12) 0%, rgba(20, 18, 16, 0.95) 100%)',
        border: '1px solid rgba(200, 137, 91, 0.35)',
        padding: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
              <ShieldCheck size={20} color="#c8895b" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>
                Ground Owner Booking Approvals Console
              </h2>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#a39c93' }}>
              Select a sports arena below to inspect and approve pending player slot reservations. <strong>Only the assigned Ground Owner</strong> has authorization to confirm bookings for their venue.
            </p>
          </div>

          {/* Ground Selection Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(10, 9, 8, 0.9)', border: '1px solid var(--border-highlight)', borderRadius: '10px', padding: '0.4rem 0.8rem' }}>
            <Building2 size={16} color="#c8895b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>Selected Ground:</span>
            <select
              className="form-select"
              value={selectedGroundForApproval}
              onChange={(e) => setSelectedGroundForApproval(e.target.value)}
              style={{ width: '220px', padding: '0.3rem 0.6rem', fontSize: '0.825rem', background: 'transparent', border: 'none', color: '#c8895b', fontWeight: 700 }}
            >
              <option value="ALL">All Sports Grounds ({grounds.length})</option>
              {grounds.map((g) => {
                const gId = String(g._id || g.id || g.ground_id);
                const gPendingCount = pendingBookingsList.filter(b => {
                  const bG = findGroundForBooking(b);
                  return bG && String(bG._id || bG.id || bG.ground_id) === gId;
                }).length;

                return (
                  <option key={gId} value={gId}>
                    {g.title} {gPendingCount > 0 ? `(${gPendingCount} Pending)` : ''}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Selected Ground Info Summary Banner */}
        {selectedGroundObj && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(10, 9, 8, 0.75)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '0.75rem 1.25rem',
            marginBottom: '1.25rem',
            flexWrap: 'wrap',
            gap: '0.75rem',
          }}>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#ffffff' }}>{selectedGroundObj.title}</div>
              <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                {selectedGroundObj.location || selectedGroundObj.address} • <span style={{ color: '#c8895b' }}>{Array.isArray(selectedGroundObj.sports) ? selectedGroundObj.sports.join(', ') : selectedGroundObj.sport_type}</span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.7rem', color: '#a39c93', display: 'block' }}>Assigned Ground Owner</span>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#10b981' }}>
                  {(() => {
                    const ownerUser = users.find(u => String(u._id || u.id) === String(selectedGroundObj.owner_id));
                    return ownerUser ? `${ownerUser.fullName} (${ownerUser.email})` : `Owner ID #${selectedGroundObj.owner_id}`;
                  })()}
                </span>
              </div>

              {checkIsGroundOwner(selectedGroundObj) ? (
                <span className="badge badge-green" style={{ fontSize: '0.75rem' }}>
                  ✓ Owner Authorized
                </span>
              ) : (
                <span className="badge badge-orange" style={{ fontSize: '0.75rem' }}>
                  🔒 Viewing as Supervisor
                </span>
              )}
            </div>
          </div>
        )}

        {/* Pending Bookings List for Selected Ground */}
        {filteredPendingBookings.length === 0 ? (
          <div style={{
            background: 'rgba(10, 9, 8, 0.6)',
            border: '1px dashed var(--border-color)',
            borderRadius: '10px',
            padding: '2rem',
            textAlign: 'center',
            color: '#a39c93',
          }}>
            <CheckCircle2 size={32} color="#10b981" style={{ margin: '0 auto 0.5rem auto' }} />
            <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
              {selectedGroundObj ? `No pending approvals for "${selectedGroundObj.title}"` : 'All booking approvals are up to date!'}
            </div>
            <div style={{ fontSize: '0.8rem', marginTop: '0.25rem' }}>
              All player reservations for this selection have been reviewed and confirmed.
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '1rem' }}>
            {filteredPendingBookings.map((b) => {
              const bookingGround = findGroundForBooking(b) || selectedGroundObj;
              const isOwner = checkIsGroundOwner(bookingGround);
              const ownerUser = bookingGround ? users.find(u => String(u._id || u.id) === String(bookingGround.owner_id)) : null;
              const ownerName = ownerUser ? ownerUser.fullName : (bookingGround ? `Owner #${bookingGround.owner_id}` : 'Station Owner');

              return (
                <div key={b.booking_id || b._id} style={{
                  background: 'rgba(10, 9, 8, 0.85)',
                  border: isOwner ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--border-color)',
                  borderRadius: '12px',
                  padding: '1.15rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.25rem' }}>
                        <span className="badge badge-blue" style={{ fontSize: '0.675rem' }}>
                          {b.sport || b.sport_type || 'Sports'}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: '#c8895b', fontFamily: 'monospace', fontWeight: 700 }}>
                          {b.booking_id}
                        </span>
                      </div>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem' }}>{b.user_name}</div>
                      <div style={{ fontSize: '0.775rem', color: '#a39c93' }}>
                        {b.user_email && <span>{b.user_email} • </span>}
                        {b.ground_name}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#10b981', display: 'block' }}>
                        ₹{b.total_price}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: '#a39c93' }}>Paid Slot</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.45rem 0.65rem', borderRadius: '6px', fontSize: '0.775rem', color: '#ffffff' }}>
                    <Clock size={13} color="#c8895b" />
                    <span><strong>{b.booking_date || b.date}</strong> at <strong>{b.slot_time || b.booking_time}</strong></span>
                  </div>

                  {/* Owner Authorization Label */}
                  <div style={{ fontSize: '0.725rem', color: '#a39c93', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.5rem' }}>
                    <span>Ground Owner: <strong style={{ color: '#ffffff' }}>{ownerName}</strong></span>
                    {isOwner ? (
                      <span style={{ color: '#10b981', fontWeight: 700 }}>✓ You can approve</span>
                    ) : (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>🔒 Owner only</span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                    {isOwner ? (
                      <>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1, background: '#10b981', borderColor: '#10b981', gap: '0.3rem', fontSize: '0.8rem' }}
                          disabled={actioningId === b.booking_id}
                          onClick={() => handleApproveBookingDirect(b.booking_id, bookingGround)}
                        >
                          <Check size={14} />
                          <span>{actioningId === b.booking_id ? 'Confirming...' : 'Approve Booking'}</span>
                        </button>
                        {onCancelBooking && (
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={actioningId === b.booking_id}
                            onClick={() => onCancelBooking(b.booking_id)}
                            style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
                          >
                            Reject
                          </button>
                        )}
                      </>
                    ) : (
                      <div style={{
                        width: '100%',
                        background: 'rgba(245, 158, 11, 0.1)',
                        border: '1px solid rgba(245, 158, 11, 0.3)',
                        borderRadius: '6px',
                        padding: '0.4rem 0.6rem',
                        fontSize: '0.725rem',
                        color: '#f59e0b',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                      }}>
                        <Lock size={12} />
                        <span>Approval reserved for ground owner ({ownerName})</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 4: Main Operations Grid (Venues & Recent Bookings)
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        
        {/* Left Column: Registered Sports Arenas Directory */}
        <div className="card">
          <div className="card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="card-title">
              <MapPin size={18} color="#c8895b" />
              <span>Sports Venues & Arenas ({grounds.length})</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('grounds')}>
              <span>View All Venues →</span>
            </button>
          </div>

          {/* Table Filters */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['ALL', 'Badminton', 'Football', 'Cricket', 'Pending'].map((sport) => (
                <button
                  key={sport}
                  onClick={() => setSelectedSportFilter(sport)}
                  style={{
                    background: selectedSportFilter === sport ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                    border: selectedSportFilter === sport ? 'none' : '1px solid var(--border-color)',
                    color: selectedSportFilter === sport ? '#ffffff' : '#a39c93',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '16px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {sport}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.3rem 0.6rem', width: '180px' }}>
              <Search size={13} color="#a39c93" />
              <input
                type="text"
                placeholder="Search arena..."
                value={venueSearch}
                onChange={(e) => setVenueSearch(e.target.value)}
                style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.775rem', width: '100%' }}
              />
            </div>
          </div>

          {/* Venues Table */}
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue & Location</th>
                  <th>Sport</th>
                  <th>Rate</th>
                  <th>Slots</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredGrounds.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                      No sports venues matching your query in MongoDB.
                    </td>
                  </tr>
                ) : (
                  filteredGrounds.slice(0, 6).map((g) => {
                    const groundId = g._id || g.id || g.ground_id;
                    const isPending = g.status === 'Pending' || g.status === 'Pending Approval';
                    const sportLabel = Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || 'Sports');
                    const slotsCount = g.totalSlots !== undefined ? g.totalSlots : (g.available_slots ? g.available_slots.length : 0);

                    return (
                      <tr key={groundId}>
                        <td>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.title}</div>
                          <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>{g.location || g.address}</div>
                        </td>
                        <td>
                          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>
                            {sportLabel}
                          </span>
                        </td>
                        <td style={{ color: '#c8895b', fontWeight: 700, fontSize: '0.85rem' }}>
                          ₹{g.pricePerHour || g.price_per_hour}/hr
                        </td>
                        <td>
                          <span style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>
                            {slotsCount} slots
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${isPending ? 'badge-orange' : 'badge-green'}`} style={{ fontSize: '0.7rem' }}>
                            {g.status || 'Active'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.3rem' }}>
                            {isPending ? (
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => onApproveGround && onApproveGround(groundId, 'Approved')}
                                style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                              >
                                Approve
                              </button>
                            ) : (
                              onManageSlots && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  onClick={() => onManageSlots(g)}
                                  style={{ fontSize: '0.725rem', padding: '0.2rem 0.5rem' }}
                                  title="Manage configured slots"
                                >
                                  Slots
                                </button>
                              )
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

        {/* Right Column: Live Player Bookings Stream */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CalendarCheck size={18} color="#3b82f6" />
                <span>Live Bookings Stream</span>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('bookings')}>
                Manage All ({bookings.length})
              </button>
            </div>

            {/* Filter tags for booking stream */}
            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
              {['ALL', 'Upcoming', 'Completed', 'Cancelled'].map((st) => (
                <button
                  key={st}
                  onClick={() => setBookingFilterStatus(st)}
                  style={{
                    background: bookingFilterStatus === st ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255,255,255,0.04)',
                    border: bookingFilterStatus === st ? '1px solid #3b82f6' : '1px solid var(--border-color)',
                    color: bookingFilterStatus === st ? '#ffffff' : '#a39c93',
                    padding: '0.2rem 0.55rem',
                    borderRadius: '14px',
                    fontSize: '0.725rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            {/* Bookings List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '360px', overflowY: 'auto' }}>
              {filteredBookings.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#a39c93', fontSize: '0.825rem' }}>
                  No bookings found for the selected filter.
                </div>
              ) : (
                filteredBookings.slice(0, 6).map((b) => {
                  const isCompleted = b.booking_status === 'Completed';
                  const isCancelled = b.booking_status === 'Cancelled';
                  const isUpcoming = !isCompleted && !isCancelled;

                  return (
                    <div key={b.booking_id || b._id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.65rem 0.8rem',
                      background: 'rgba(10, 9, 8, 0.75)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '8px',
                      gap: '0.5rem',
                    }}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.user_name}</span>
                          <span style={{ color: '#c8895b', fontSize: '0.75rem', fontFamily: 'monospace' }}>{b.booking_id}</span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: '#a39c93', marginTop: '0.15rem' }}>
                          {b.ground_name} • {b.slot_time || b.booking_time}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span style={{ fontWeight: 700, color: '#10b981', fontSize: '0.825rem' }}>₹{b.total_price}</span>

                        <span className={`badge ${
                          isCompleted ? 'badge-green' :
                          isUpcoming ? 'badge-blue' : 'badge-red'
                        }`} style={{ fontSize: '0.675rem', padding: '0.15rem 0.45rem' }}>
                          {b.booking_status}
                        </span>

                        {isUpcoming && onConfirmCheckIn && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Verify and Confirm Player Check-In"
                            onClick={() => onConfirmCheckIn(b.booking_id)}
                            style={{ padding: '0.2rem 0.4rem', borderColor: '#10b981', color: '#10b981' }}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}

                        {onViewQRPass && (
                          <button
                            className="btn btn-secondary btn-sm"
                            title="View Gate QR Pass"
                            onClick={() => onViewQRPass(b)}
                            style={{ padding: '0.2rem 0.4rem' }}
                          >
                            <QrCode size={13} color="#c8895b" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Quick Console Shortcuts */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
              <Clock size={18} color="#c8895b" />
              <span>Administrative Console Shortcuts</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }} onClick={onOpenQRScan}>
                <CheckCircle2 size={14} color="#10b981" />
                <span>QR Check-In</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }} onClick={() => setActiveTab('users')}>
                <Users size={14} color="#c084fc" />
                <span>Owner Approvals</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }} onClick={() => setActiveTab('slots')}>
                <Sliders size={14} color="#f59e0b" />
                <span>Dynamic Slots</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.775rem' }} onClick={() => setActiveTab('analytics')}>
                <Activity size={14} color="#3b82f6" />
                <span>Platform Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 5: Real-time Analytics & Sports Demand Breakdown
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Live Sport Demand Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} color="#c8895b" />
              <span>Live Sport Demand Distribution (MongoDB)</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>{bookings.length} Total Bookings</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {sportList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '1.5rem', color: '#a39c93', fontSize: '0.85rem' }}>
                No booking records to analyze yet.
              </div>
            ) : (
              sportList.map((item, idx) => {
                const colors = ['#10b981', '#c8895b', '#3b82f6', '#f59e0b', '#c084fc'];
                const barColor = colors[idx % colors.length];
                return (
                  <div key={item.sport}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.825rem', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 600, color: '#ffffff' }}>{item.sport}</span>
                      <div style={{ display: 'flex', gap: '0.75rem' }}>
                        <span style={{ color: '#a39c93', fontSize: '0.75rem' }}>{item.count} bookings (₹{item.revenue.toLocaleString()})</span>
                        <span style={{ fontWeight: 700, color: barColor }}>{item.percentage}%</span>
                      </div>
                    </div>
                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percentage}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Booking Fulfillment & User Roster Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <ShieldCheck size={18} color="#10b981" />
              <span>Fulfillment & Account Overview</span>
            </h3>
            <span className="badge badge-green">Healthy Platform</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '1rem' }}>
            <div style={{ background: 'rgba(10, 9, 8, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#a39c93', fontWeight: 600 }}>Completed Bookings</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10b981', marginTop: '0.2rem' }}>
                {completedCount} ({bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 0}%)
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a39c93', marginTop: '0.2rem' }}>Successfully verified</div>
            </div>

            <div style={{ background: 'rgba(10, 9, 8, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#a39c93', fontWeight: 600 }}>Active Players</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.2rem' }}>
                {playerCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a39c93', marginTop: '0.2rem' }}>Registered accounts</div>
            </div>

            <div style={{ background: 'rgba(10, 9, 8, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#a39c93', fontWeight: 600 }}>Station Partners</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#c8895b', marginTop: '0.2rem' }}>
                {groundOwnerCount}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a39c93', marginTop: '0.2rem' }}>{pendingOwners.length} awaiting review</div>
            </div>

            <div style={{ background: 'rgba(10, 9, 8, 0.7)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.75rem' }}>
              <div style={{ fontSize: '0.75rem', color: '#a39c93', fontWeight: 600 }}>Pro-Shop Products</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem' }}>
                {products.length} Items
              </div>
              <div style={{ fontSize: '0.7rem', color: '#a39c93', marginTop: '0.2rem' }}>Marketplace gear</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          SECTION 6: Platform Users & Registered Accounts Preview
          ───────────────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Users size={18} color="#c8895b" />
            <span>Platform User Directory ({users.length})</span>
          </h3>
          <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('users')}>
            Manage All Users →
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Name</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Location</th>
                <th>Joined</th>
                <th>Approval Status</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                    No registered users in MongoDB database.
                  </td>
                </tr>
              ) : (
                users.slice(0, 5).map((u) => (
                  <tr key={u._id || u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: u.role === 'Admin' ? 'linear-gradient(135deg, #c8895b 0%, #a86c43 100%)' :
                            u.role === 'GroundOwner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {(u.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        u.role === 'Admin' ? 'badge-primary' :
                        u.role === 'GroundOwner' ? 'badge-green' :
                        u.role === 'ShopOwner' ? 'badge-orange' : 'badge-blue'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {u.role || 'User'}
                      </span>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#a39c93' }}>
                      {u.phone || 'N/A'}
                    </td>

                    <td style={{ fontSize: '0.8rem', color: '#a39c93' }}>
                      {u.location || 'Kerala'}
                    </td>

                    <td style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                      {u.createdAt}
                    </td>

                    <td>
                      <span className={`badge ${
                        u.approvalStatus === 'Approved' ? 'badge-green' :
                        u.approvalStatus === 'Pending' ? 'badge-orange' : 'badge-red'
                      }`} style={{ fontSize: '0.7rem' }}>
                        {u.approvalStatus || 'Approved'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
