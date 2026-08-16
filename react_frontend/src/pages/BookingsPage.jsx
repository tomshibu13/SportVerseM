import React, { useState } from 'react';
import { CalendarCheck, QrCode, Search, CheckCircle2, XCircle, Clock, Check, X, Filter } from 'lucide-react';

const STATUS_FILTERS = ['ALL', 'Confirmed', 'Pending Approval', 'Completed', 'Cancelled'];

export default function BookingsPage({ 
  bookings = [], 
  onOpenQRScan, 
  onCancelBooking, 
  onApproveBooking,
  onConfirmCheckIn,
  searchTerm: globalSearch = '' 
}) {
  const [localSearch, setLocalSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const activeSearch = localSearch || globalSearch;

  const filteredBookings = bookings.filter((b) => {
    // Status match
    let matchesStatus = true;
    if (statusFilter === 'Pending Approval') {
      matchesStatus = b.admin_approval === 'Pending';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <CalendarCheck size={24} color="#c8895b" />
            <span>Bookings & QR Verification ({bookings.length})</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Track player reservations, process QR check-ins, approve slots, and manage cancellations.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenQRScan}>
          <QrCode size={16} />
          <span>Launch QR Scanner</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
              {st}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '280px' }}>
          <Search size={15} color="#a39c93" />
          <input
            type="text"
            placeholder="Search ID, player, arena..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Player Name</th>
                <th>Venue & Sport</th>
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
                    No bookings found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.booking_id || b._id}>
                    <td style={{ fontWeight: 700, color: '#c8895b', fontFamily: 'monospace' }}>
                      {b.booking_id}
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{b.user_name}</div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600 }}>{b.ground_name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>{b.sport || b.sport_type}</div>
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
                        b.booking_status === 'Completed' ? 'badge-green' :
                        b.booking_status === 'Confirmed' ? 'badge-blue' : 'badge-red'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        {/* Check-In Action */}
                        {b.booking_status === 'Confirmed' && (
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

                        {/* Admin Approval Actions for Pending */}
                        {b.admin_approval === 'Pending' && (
                          <button
                            className="btn btn-primary btn-sm"
                            title="Approve Booking"
                            onClick={() => onApproveBooking(b.booking_id, 'Approved')}
                            style={{ background: '#10b981', borderColor: '#10b981', padding: '0.3rem 0.5rem' }}
                          >
                            <Check size={13} />
                          </button>
                        )}

                        {/* Cancel Action */}
                        {b.booking_status === 'Confirmed' && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Cancel Booking"
                            onClick={() => onCancelBooking(b.booking_id)}
                            style={{ padding: '0.3rem 0.5rem' }}
                          >
                            <X size={13} />
                          </button>
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
  );
}
