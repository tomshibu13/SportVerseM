import React from 'react';
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
  X
} from 'lucide-react';

export default function OverviewPage({ 
  grounds = [], 
  bookings = [], 
  users = [],
  pendingOwnersCount = 0,
  pendingBookingsCount = 0,
  onOpenQRScan, 
  onOpenAddGround, 
  setActiveTab,
  onConfirmCheckIn,
  onApproveBooking
}) {
  const totalRevenue = bookings
    .filter((b) => b.booking_status !== 'Cancelled')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

  const completedCount = bookings.filter((b) => b.booking_status === 'Completed').length;
  const recentBookings = bookings.slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.2) 0%, rgba(15, 13, 11, 0.95) 100%)',
        border: '1px solid rgba(200, 137, 91, 0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1.5rem 2rem',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <Sparkles size={18} color="#c8895b" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#c8895b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              SportVerse Superadmin Platform
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>System Overview & Control Console</h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.25rem' }}>
            Manage ground owners, approve registrations, verify QR check-ins, and review real-time revenue across sports arenas.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {pendingOwnersCount > 0 && (
            <button className="btn btn-secondary" onClick={() => setActiveTab('users')} style={{ borderColor: 'rgba(245, 158, 11, 0.5)', color: '#f59e0b' }}>
              <AlertCircle size={15} />
              <span>Review {pendingOwnersCount} Pending Owners</span>
            </button>
          )}
          <button className="btn btn-secondary" onClick={onOpenQRScan}>
            <QrCode size={15} color="#c8895b" />
            <span>QR Scanner</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddGround}>
            <Sparkles size={15} />
            <span>+ Add Ground</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Total Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>₹{totalRevenue.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
            <ArrowUpRight size={14} />
            <span>{completedCount} Completed Bookings</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Active Sports Grounds</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MapPin size={18} color="#c8895b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{grounds.length} Arenas</div>
          <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.3rem' }}>
            Kochi & Regional Stations
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Total Bookings</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{bookings.length} Slots</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.3rem' }}>
            Real-Time MongoDB Synced
          </div>
        </div>

        <div className="card" style={{ border: pendingOwnersCount > 0 ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: pendingOwnersCount > 0 ? '#f59e0b' : '#a39c93' }}>Pending Approvals</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertCircle size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{pendingOwnersCount} Owners</div>
          <div 
            style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem', cursor: 'pointer', fontWeight: 600 }} 
            onClick={() => setActiveTab('users')}
          >
            Review Applications →
          </div>
        </div>
      </div>

      {/* Main Grid: Venues & Recent Bookings */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '1.5rem' }}>
        {/* Venues Overview */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} color="#c8895b" />
              <span>Registered Sports Venues</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('grounds')}>
              View All ({grounds.length})
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Venue Name</th>
                  <th>Sport</th>
                  <th>Rate</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {grounds.slice(0, 5).map((g) => {
                  const isPending = g.status === 'Pending';
                  const groundId = g._id || g.id || g.ground_id;
                  return (
                    <tr key={groundId}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>{g.location}</div>
                      </td>
                      <td>
                        <span className="badge badge-primary">
                          {Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || g.sports)}
                        </span>
                      </td>
                      <td style={{ color: '#c8895b', fontWeight: 700 }}>₹{g.pricePerHour || g.price_per_hour}/hr</td>
                      <td>⭐ {g.rating || 4.8}</td>
                      <td>
                        <span className={`badge ${isPending ? 'badge-orange' : 'badge-green'}`}>
                          {g.status || 'Approved'}
                        </span>
                      </td>
                      <td>
                        {isPending ? (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => onApproveGround && onApproveGround(groundId, 'Approved')}
                            style={{ background: '#10b981', borderColor: '#10b981', fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            Approve
                          </button>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#10b981' }}>✓ Live</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Player Bookings & Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <CalendarCheck size={18} color="#3b82f6" />
                <span>Recent Bookings</span>
              </h3>
              <button className="btn btn-secondary btn-sm" onClick={() => setActiveTab('bookings')}>
                Manage All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {recentBookings.map((b) => (
                <div key={b.booking_id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.75rem',
                  background: 'rgba(10, 9, 8, 0.7)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#ffffff' }}>
                      {b.user_name} • <span style={{ color: '#c8895b' }}>{b.booking_id}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                      {b.ground_name} • {b.booking_time || b.slot_time}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${
                      b.booking_status === 'Completed' ? 'badge-green' :
                      b.booking_status === 'Confirmed' ? 'badge-blue' : 'badge-red'
                    }`}>
                      {b.booking_status}
                    </span>

                    {b.booking_status === 'Confirmed' && (
                      <button
                        className="btn btn-secondary btn-sm"
                        title="Confirm Check-In"
                        onClick={() => onConfirmCheckIn(b.booking_id)}
                        style={{ padding: '0.2rem 0.45rem', borderColor: '#10b981', color: '#10b981' }}
                      >
                        <CheckCircle2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
              <Clock size={18} color="#c8895b" />
              <span>Quick Console Actions</span>
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }} onClick={onOpenQRScan}>
                <CheckCircle2 size={15} color="#10b981" />
                <span>QR Check-In</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }} onClick={() => setActiveTab('users')}>
                <Users size={15} color="#3b82f6" />
                <span>Owner Approvals</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }} onClick={() => setActiveTab('slots')}>
                <Clock size={15} color="#f59e0b" />
                <span>Slot Surge AI</span>
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', fontSize: '0.8rem' }} onClick={() => setActiveTab('analytics')}>
                <ArrowUpRight size={15} color="#10b981" />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
