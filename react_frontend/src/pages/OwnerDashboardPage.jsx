import React from 'react';
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
  ShieldCheck
} from 'lucide-react';

export default function OwnerDashboardPage({ currentUser, grounds = [], bookings = [], onOpenAddGround, onOpenQRScan, setActiveTab }) {
  const ownerName = currentUser?.fullName || 'Station Owner';
  const ownerEmail = currentUser?.email || 'owner@arena.com';

  const myGrounds = grounds.length > 0 ? grounds.slice(0, 3) : [];
  const myBookings = bookings;
  const totalEarnings = myBookings
    .filter((b) => b.booking_status !== 'Cancelled')
    .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

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
              Station Owner Control Panel
            </span>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff' }}>Welcome back, {ownerName}!</h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.25rem' }}>
            Manage your sports station arenas, court slot availability, dynamic pricing, and scan player QR check-ins.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={onOpenQRScan} style={{ borderColor: 'rgba(16, 185, 129, 0.4)', color: '#10b981' }}>
            <QrCode size={16} />
            <span>Player QR Scanner</span>
          </button>
          <button className="btn btn-primary" onClick={onOpenAddGround}>
            <Plus size={16} />
            <span>+ Add Court / Turf</span>
          </button>
        </div>
      </div>

      {/* Station KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Station Gross Revenue</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IndianRupee size={18} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>₹{totalEarnings.toLocaleString()}</div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
            <ArrowUpRight size={14} />
            <span>Active Payout Cycle</span>
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Active Courts / Turfs</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={18} color="#c8895b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{myGrounds.length} Venues</div>
          <div style={{ fontSize: '0.75rem', color: '#a39c93', marginTop: '0.3rem' }}>
            Station Live & Operational
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Player Bookings</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarCheck size={18} color="#3b82f6" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>{myBookings.length} Slots</div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.3rem' }}>
            Confirmed Player Reservations
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#a39c93' }}>Court Occupancy</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#f59e0b" />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#ffffff' }}>88.4%</div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem' }}>
            Peak Demand Hours Active
          </div>
        </div>
      </div>

      {/* Main Grid: My Venues & Player Reservations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* My Venues List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Building2 size={18} color="#c8895b" />
              <span>My Station Courts & Arenas</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={onOpenAddGround}>
              + Add Arena
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {myGrounds.map((g) => (
              <div key={g.id || g._id} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                padding: '0.85rem',
                background: 'rgba(10, 9, 8, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '10px',
              }}>
                <img
                  src={g.image || (g.images && g.images[0]) || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80'}
                  alt={g.title}
                  style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.title}</div>
                  <div style={{ fontSize: '0.75rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <MapPin size={12} color="#c8895b" />
                    <span>{g.location || g.address}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#c8895b', fontWeight: 700, marginTop: '0.2rem' }}>
                    ₹{g.pricePerHour || g.price_per_hour}/hr • {Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || g.sports)}
                  </div>
                </div>
                <span className="badge badge-green">Live</span>
              </div>
            ))}
          </div>
        </div>

        {/* Incoming Player Reservations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarCheck size={18} color="#3b82f6" />
              <span>Player Reservations & Check-Ins</span>
            </h3>
            <button className="btn btn-secondary btn-sm" onClick={onOpenQRScan}>
              Scan QR
            </button>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Player</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {myBookings.map((b) => (
                  <tr key={b.booking_id || b._id}>
                    <td style={{ fontWeight: 700, color: '#c8895b' }}>{b.booking_id}</td>
                    <td style={{ fontWeight: 600 }}>{b.user_name}</td>
                    <td style={{ fontSize: '0.8rem', color: '#a39c93' }}>{b.booking_time || b.slot_time}</td>
                    <td>
                      <span className={`badge ${b.booking_status === 'Completed' ? 'badge-green' : 'badge-blue'}`}>
                        {b.booking_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
