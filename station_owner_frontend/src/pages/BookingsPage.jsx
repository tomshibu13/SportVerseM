import React, { useEffect, useState } from 'react';
import { CalendarCheck, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fetchMyBookings } from '../services/api';

const statusConfig = {
  Confirmed:  { class: 'badge-blue',   icon: <Clock size={11} /> },
  Completed:  { class: 'badge-green',  icon: <CheckCircle2 size={11} /> },
  Cancelled:  { class: 'badge-red',    icon: <XCircle size={11} /> },
};

export default function BookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchMyBookings().then(d => { setBookings(d); setLoading(false); });
  }, []);

  const handleCancel = (id) => {
    if (!window.confirm(`Cancel booking ${id}?`)) return;
    setBookings(prev => prev.map(b => b.booking_id === id ? { ...b, booking_status: 'Cancelled' } : b));
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'All' || b.booking_status === filter;
    const matchSearch = b.user_name?.toLowerCase().includes(search.toLowerCase()) ||
      b.booking_id?.toLowerCase().includes(search.toLowerCase()) ||
      b.sport?.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = { All: bookings.length, Confirmed: 0, Completed: 0, Cancelled: 0 };
  bookings.forEach(b => { if (counts[b.booking_status] !== undefined) counts[b.booking_status]++; });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Player Reservations</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>All bookings for your courts and venues</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.875rem', color: '#7fb3a0' }}>Total revenue today:</span>
          <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.1rem' }}>
            ₹{bookings.filter(b => b.booking_status !== 'Cancelled').reduce((s, b) => s + (b.total_price || 0), 0).toLocaleString()}
          </span>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {['All', 'Confirmed', 'Completed', 'Cancelled'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '0.45rem 1rem', borderRadius: '20px', border: '1px solid',
              background: filter === f ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
              borderColor: filter === f ? 'rgba(16,185,129,0.4)' : 'var(--border-color)',
              color: filter === f ? '#10b981' : '#7fb3a0',
              fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer',
            }}>
            {f} ({counts[f] || 0})
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(6,13,13,0.9)', border: '1px solid var(--border-color)', borderRadius: '20px', padding: '0.35rem 0.85rem' }}>
          <Search size={14} color="#7fb3a0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search player, ID..." style={{ background: 'transparent', border: 'none', outline: 'none', color: '#e8f5f1', fontSize: '0.83rem', width: '180px' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7fb3a0' }}>Fetching bookings...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th><th>Player</th><th>Court / Sport</th>
                <th>Date</th><th>Time Slot</th><th>Amount</th>
                <th>Status</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#7fb3a0' }}>No bookings match your filter</td></tr>
              ) : filtered.map((b) => {
                const sc = statusConfig[b.booking_status] || statusConfig['Confirmed'];
                return (
                  <tr key={b.booking_id}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>{b.booking_id}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--green-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>
                          {b.user_name?.charAt(0) || '?'}
                        </div>
                        <span>{b.user_name || 'N/A'}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{b.sport}</span></td>
                    <td style={{ color: '#7fb3a0' }}>{b.booking_date}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} color="#7fb3a0" />{b.booking_time}
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: '#e8f5f1' }}>₹{b.total_price?.toLocaleString()}</span></td>
                    <td>
                      <span className={`badge ${sc.class}`}>{sc.icon} {b.booking_status}</span>
                    </td>
                    <td>
                      {b.booking_status === 'Confirmed' ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b.booking_id)}>
                          <XCircle size={12} /> Cancel
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#4a7a6a' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
