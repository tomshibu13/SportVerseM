import React, { useState } from 'react';
import { Search, QrCode } from 'lucide-react';

export default function BookingsPage({ bookings = [], onOpenQRScan, onCancelBooking }) {
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = bookings.filter((b) => {
    const matchesStatus = filterStatus === 'All' || b.booking_status.toLowerCase() === filterStatus.toLowerCase();
    const matchesSearch =
      b.booking_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.ground_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Bookings & Customer Check-In</h1>
          <p className="page-subtitle">Real-time player reservations, payment verifications, and entry scans</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenQRScan}>
          <QrCode size={16} />
          Scan Customer QR Code
        </button>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#a39c93" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search by Booking ID, customer name, venue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          {/* Filter Status Buttons */}
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['All', 'Upcoming', 'Completed', 'Cancelled'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: filterStatus === st ? 'rgba(200, 137, 91, 0.18)' : 'rgba(15, 13, 11, 0.9)',
                  borderColor: filterStatus === st ? 'var(--primary)' : 'var(--border-color)',
                  color: filterStatus === st ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.825rem',
                  fontWeight: filterStatus === st ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table of Bookings */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Customer</th>
              <th>Arena Venue</th>
              <th>Sport</th>
              <th>Date & Time</th>
              <th>Amount</th>
              <th>Payment</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No bookings found matching filters.
                </td>
              </tr>
            ) : (
              filtered.map((b) => (
                <tr key={b.booking_id}>
                  <td>
                    <span style={{ fontWeight: 700, color: '#c8895b', fontFamily: 'monospace' }}>
                      {b.booking_id}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ffffff' }}>{b.user_name}</div>
                    <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>ID: #{b.user_id}</div>
                  </td>
                  <td>{b.ground_name}</td>
                  <td>
                    <span className="badge badge-sport">{b.sport_type}</span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500, color: '#f3e5d8' }}>{b.date}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{b.slot_time}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#e5ba93' }}>₹{b.total_price}</span>
                  </td>
                  <td>
                    <span className={`badge badge-${b.payment_status.toLowerCase()}`}>
                      {b.payment_status}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${b.booking_status.toLowerCase()}`}>
                      {b.booking_status}
                    </span>
                  </td>
                  <td>
                    {b.booking_status === 'Upcoming' ? (
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={onOpenQRScan}
                        >
                          Check In
                        </button>
                        <button
                          className="btn btn-danger"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          onClick={() => onCancelBooking(b.booking_id)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Completed</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
