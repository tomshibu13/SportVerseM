import React, { useEffect, useState } from 'react';
import { CalendarCheck, Search, Filter, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { fetchMyBookings } from '../services/api';

const statusConfig = {
  Confirmed:  { class: 'badge-blue',   icon: <Clock size={11} /> },
  Upcoming:   { class: 'badge-blue',   icon: <Clock size={11} /> },
  Completed:  { class: 'badge-green',  icon: <CheckCircle2 size={11} /> },
  Cancelled:  { class: 'badge-red',    icon: <XCircle size={11} /> },
};

export default function BookingsPage({ currentUser }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchMyBookings(currentUser._id || currentUser.id).then(d => { setBookings(d); setLoading(false); });
    }
  }, [currentUser]);

  const handleCancel = async (id) => {
    if (!window.confirm(`Cancel booking ${id}?`)) return;
    try {
        await fetch(`/api/bookings/cancel/${id}`, { method: 'PUT' });
        setBookings(prev => prev.map(b => (b.booking_id === id || b._id === id) ? { ...b, booking_status: 'Cancelled' } : b));
    } catch (e) {
        console.error('Failed to cancel:', e);
    }
  };

  const filtered = bookings.filter(b => {
    const matchFilter = filter === 'All' || b.booking_status === filter || (filter === 'Confirmed' && b.booking_status === 'Upcoming');
    const uName = b.user?.fullName || b.user_name || '';
    const bId = b.booking_id || b._id || '';
    const sp = b.ground?.sport_type || b.sport || '';
    const matchSearch = uName.toLowerCase().includes(search.toLowerCase()) ||
      bId.toLowerCase().includes(search.toLowerCase()) ||
      sp.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const counts = { All: bookings.length, Confirmed: 0, Completed: 0, Cancelled: 0 };
  bookings.forEach(b => { 
      const st = b.booking_status === 'Upcoming' ? 'Confirmed' : b.booking_status;
      if (counts[st] !== undefined) counts[st]++; 
  });

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
                const uName = b.user?.fullName || b.user_name || 'N/A';
                const bId = b.booking_id || b._id;
                const sp = b.ground?.sport_type || b.sport || 'Sport';
                const dDate = b.date || b.booking_date;
                const dTime = b.slot_time || b.booking_time;
                return (
                  <tr key={bId}>
                    <td><span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#10b981' }}>{bId.substring(0, 8)}</span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--green-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', color: '#fff' }}>
                          {uName.charAt(0) || '?'}
                        </div>
                        <span>{uName}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{sp}</span></td>
                    <td style={{ color: '#7fb3a0' }}>{dDate}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Clock size={13} color="#7fb3a0" />{dTime}
                      </div>
                    </td>
                    <td><span style={{ fontWeight: 700, color: '#e8f5f1' }}>₹{b.total_price?.toLocaleString()}</span></td>
                    <td>
                      <span className={`badge ${sc.class}`}>{sc.icon} {b.booking_status === 'Upcoming' ? 'Confirmed' : b.booking_status}</span>
                    </td>
                    <td>
                      {b.booking_status === 'Upcoming' || b.booking_status === 'Confirmed' ? (
                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(b._id || b.booking_id)}>
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
