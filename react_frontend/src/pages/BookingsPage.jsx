import React, { useState } from 'react';
import { 
  CalendarCheck, 
  QrCode, 
  Search, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Check, 
  X, 
  Filter, 
  Building2, 
  Lock, 
  ShieldCheck 
} from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'Pending Approval', 'Upcoming', 'Completed', 'Cancelled'];

export default function BookingsPage({ 
  bookings = [], 
  grounds = [],
  users = [],
  currentUser = null,
  onOpenQRScan, 
  onCancelBooking, 
  onApproveBooking,
  onConfirmCheckIn,
  onViewQRPass,
  searchTerm: globalSearch = '' 
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedGroundId, setSelectedGroundId] = useState('ALL');
  const [actioningId, setActioningId] = useState(null);

  const activeSearch = localSearch || globalSearch;

  // Match booking to a ground object
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

  // Check if current user is owner of the ground
  const checkIsOwner = (ground) => {
    if (!currentUser) return false;
    if (currentUser.role === 'Admin') return true;
    if (!ground) return false;
    const uId = String(currentUser._id || currentUser.id || '').toLowerCase();
    const uEmail = String(currentUser.email || '').toLowerCase();
    const gOwnerId = String(ground.owner_id || ground.ownerId || ground.owner || '').toLowerCase();
    return (uId && gOwnerId === uId) || (uEmail && gOwnerId === uEmail);
  };

  const filteredBookings = bookings.filter((b) => {
    // Ground filter
    if (selectedGroundId !== 'ALL') {
      const bGround = findGroundForBooking(b);
      if (!bGround) return false;
      const gId = String(bGround._id || bGround.id || bGround.ground_id);
      if (gId !== String(selectedGroundId)) return false;
    }

    // Status match
    let matchesStatus = true;
    if (statusFilter === 'Pending Approval') {
      matchesStatus = b.admin_approval === 'Pending';
    } else if (statusFilter === 'Upcoming') {
      matchesStatus = b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed';
    } else if (statusFilter !== 'ALL') {
      matchesStatus = b.booking_status === statusFilter;
    }

    // Search match
    const q = activeSearch.toLowerCase();
    const bId = String(b.booking_id || '').toLowerCase();
    const uName = String(b.user_name || '').toLowerCase();
    const gName = String(b.ground_name || '').toLowerCase();
    const sportName = String(b.sport || b.sport_type || '').toLowerCase();

    const matchesSearch =
      !activeSearch ||
      bId.includes(q) ||
      uName.includes(q) ||
      gName.includes(q) ||
      sportName.includes(q);

    return matchesStatus && matchesSearch;
  });

  const pendingApprovalsCount = bookings.filter((b) => {
    if (selectedGroundId === 'ALL') return b.admin_approval === 'Pending';
    const bGround = findGroundForBooking(b);
    return bGround && String(bGround._id || bGround.id || bGround.ground_id) === String(selectedGroundId) && b.admin_approval === 'Pending';
  }).length;

  const handleApprove = async (bookingId, ground) => {
    if (!checkIsOwner(ground)) {
      alert('Only the assigned Ground Owner (or Superadmin) has permission to approve bookings for this venue.');
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarCheck size={24} color="#c8895b" />
            <span>Bookings & Ground Owner Verification ({bookings.length})</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Inspect player reservations, filter by sports arena, verify QR check-in entry, and manage owner approvals.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenQRScan}>
          <QrCode size={16} />
          <span>Launch QR Scanner</span>
        </button>
      </div>

      {/* Filter Tabs, Ground Selector & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {STATUS_FILTERS.map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              style={{
                background: statusFilter === st ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                border: statusFilter === st ? 'none' : '1px solid var(--border-color)',
                color: statusFilter === st ? '#ffffff' : '#a39c93',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {st} {st === 'Pending Approval' && pendingApprovalsCount > 0 ? `(${pendingApprovalsCount})` : ''}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Ground Selection Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.35rem 0.65rem' }}>
            <Building2 size={15} color="#c8895b" />
            <select
              className="form-select"
              value={selectedGroundId}
              onChange={(e) => setSelectedGroundId(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.825rem', width: '180px', outline: 'none', padding: '0' }}
            >
              <option value="ALL">All Arenas ({grounds.length})</option>
              {grounds.map((g) => (
                <option key={g._id || g.id || g.ground_id} value={g._id || g.id || g.ground_id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '220px' }}>
            <Search size={15} color="#a39c93" />
            <input
              type="text"
              placeholder="Search ID, player..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '100%' }}
            />
          </div>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Player Details</th>
                <th>Venue & Owner</th>
                <th>Date & Slot Time</th>
                <th>Total Paid</th>
                <th>Approval</th>
                <th>Check-In Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '2.5rem', color: '#a39c93' }}>
                    No bookings found matching the selected venue and status filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => {
                  const bookingGround = findGroundForBooking(b);
                  const isOwner = checkIsOwner(bookingGround);
                  const ownerUser = bookingGround ? users.find(u => String(u._id || u.id) === String(bookingGround.owner_id)) : null;
                  const ownerName = ownerUser ? ownerUser.fullName : (bookingGround ? `Owner #${bookingGround.owner_id}` : 'Station Owner');
                  const isPendingApproval = b.admin_approval === 'Pending';
                  const isUpcoming = b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed';
                  const isCompleted = b.booking_status === 'Completed';

                  return (
                    <tr key={b.booking_id || b._id}>
                      <td style={{ fontWeight: 700, color: '#c8895b', fontFamily: 'monospace' }}>
                        {b.booking_id}
                      </td>

                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{b.user_name}</div>
                        {b.user_email && <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>{b.user_email}</div>}
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{b.ground_name}</div>
                        <div style={{ fontSize: '0.725rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <span style={{ color: '#c8895b' }}>{b.sport || b.sport_type}</span>
                          <span>• Owner: {ownerName}</span>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontWeight: 600 }}>{b.booking_date || b.date}</div>
                        <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>{b.booking_time || b.slot_time}</div>
                      </td>

                      <td style={{ fontWeight: 800, color: '#10b981' }}>
                        ₹{b.total_price}
                      </td>

                      <td>
                        <span className={`badge ${
                          b.admin_approval === 'Approved' ? 'badge-green' :
                          b.admin_approval === 'Pending' ? 'badge-orange' : 'badge-red'
                        }`}>
                          {b.admin_approval || 'Approved'}
                        </span>
                      </td>

                      <td>
                        <span className={`badge ${
                          isCompleted ? 'badge-green' :
                          isUpcoming ? 'badge-blue' : 'badge-red'
                        }`}>
                          {b.booking_status}
                        </span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {/* View QR Ticket Pass */}
                          {onViewQRPass && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="View Gate QR Entry Pass"
                              onClick={() => onViewQRPass(b)}
                              style={{ padding: '0.3rem 0.55rem', gap: '0.25rem', fontSize: '0.75rem' }}
                            >
                              <QrCode size={13} color="#c8895b" />
                              <span>QR Pass</span>
                            </button>
                          )}

                          {/* Check-In Action */}
                          {isUpcoming && onConfirmCheckIn && (
                            <button
                              className="btn btn-secondary btn-sm"
                              title="Confirm Player QR Check-In"
                              onClick={() => onConfirmCheckIn(b.booking_id)}
                              style={{ borderColor: '#10b981', color: '#10b981', padding: '0.3rem 0.6rem' }}
                            >
                              <CheckCircle2 size={13} />
                              <span>Check-In</span>
                            </button>
                          )}

                          {/* Ground Owner Approval Action for Pending */}
                          {isPendingApproval && (
                            isOwner ? (
                              <button
                                className="btn btn-primary btn-sm"
                                title="Approve & Confirm Slot Booking (Owner Authorized)"
                                disabled={actioningId === b.booking_id}
                                onClick={() => handleApprove(b.booking_id, bookingGround)}
                                style={{ background: '#10b981', borderColor: '#10b981', padding: '0.3rem 0.55rem', gap: '0.25rem' }}
                              >
                                <Check size={13} />
                                <span>{actioningId === b.booking_id ? 'Approving...' : 'Approve'}</span>
                              </button>
                            ) : (
                              <span style={{ fontSize: '0.7rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                <Lock size={11} />
                                <span>Owner Only</span>
                              </span>
                            )
                          )}

                          {/* Cancel Action */}
                          {isUpcoming && onCancelBooking && (
                            <button
                              className="btn btn-danger btn-sm"
                              title="Cancel Reservation"
                              onClick={() => onCancelBooking(b.booking_id)}
                              style={{ padding: '0.3rem 0.5rem' }}
                            >
                              <X size={13} />
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
  );
}
