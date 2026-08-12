import React from 'react';
import StatCard from '../components/StatCard';
import { 
  DollarSign, 
  CalendarCheck, 
  Activity, 
  Sparkles, 
  QrCode, 
  Plus, 
  Clock, 
  ArrowRight,
  MapPin
} from 'lucide-react';

export default function OverviewPage({ grounds = [], bookings = [], onOpenQRScan, onOpenAddGround, setActiveTab }) {
  // Calculations for KPI Cards
  const totalRevenue = bookings.reduce((acc, curr) => acc + curr.total_price, 0) + 18450;
  const activeBookingsCount = bookings.filter(b => b.booking_status === 'Upcoming').length;
  const occupancyRate = 84;
  const aiScoreAvg = 96;

  return (
    <div className="animate-fade-in">
      {/* Welcome Banner */}
      <div style={styles.banner}>
        <div>
          <div style={styles.bannerBadge}>
            <Sparkles size={14} color="#c8895b" />
            <span>STATION OWNER CONTROL CENTER</span>
          </div>
          <h1 style={{ fontSize: '1.6rem', marginTop: '0.4rem', color: '#ffffff' }}>
            Welcome Back, Station Owner 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Here is your live station activity, booking revenue, and AI pricing performance for today.
          </p>
        </div>

        <div style={styles.quickActionsGroup}>
          <button className="btn btn-secondary" onClick={onOpenQRScan}>
            <QrCode size={16} color="#c8895b" />
            Quick QR Check-In
          </button>
          <button className="btn btn-primary" onClick={onOpenAddGround}>
            <Plus size={16} />
            Add New Arena
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard
          title="Today's Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change="+18.4% vs last week"
          isPositive={true}
          icon={DollarSign}
          color="gold"
        />
        <StatCard
          title="Active Court Bookings"
          value={activeBookingsCount + 8}
          change="+4 upcoming today"
          isPositive={true}
          icon={CalendarCheck}
          color="bronze"
        />
        <StatCard
          title="Court Occupancy Rate"
          value={`${occupancyRate}%`}
          change="+6.2% peak hours"
          isPositive={true}
          icon={Activity}
          color="cyan"
        />
        <StatCard
          title="Station AI Score"
          value={`${aiScoreAvg}/100`}
          subtitle="Optimal dynamic pricing active"
          icon={Sparkles}
          color="amber"
        />
      </div>

      {/* Main Grid Section */}
      <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
        {/* Left Column: Live Bookings & Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Today's Schedule Card */}
          <div className="glass-card">
            <div style={styles.cardHeader}>
              <div>
                <h3>Today's Arena Schedule</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Real-time slots and player reservations
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setActiveTab('bookings')}
              >
                View All <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1rem' }}>
              {bookings.slice(0, 4).map((b) => (
                <div key={b.booking_id} style={styles.scheduleItem}>
                  <div style={styles.timeBadge}>
                    <Clock size={14} color="#c8895b" />
                    <span>{b.slot_time}</span>
                  </div>

                  <div style={{ flex: 1, padding: '0 0.75rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>
                      {b.ground_name}
                    </div>
                    <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                      Player: <strong style={{ color: '#f3e5d8' }}>{b.user_name}</strong> • {b.sport_type}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: '#e5ba93', fontSize: '0.9rem' }}>
                      ₹{b.total_price}
                    </div>
                    <span className={`badge badge-${b.booking_status.toLowerCase()}`}>
                      {b.booking_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Station Grounds Summary */}
          <div className="glass-card">
            <div style={styles.cardHeader}>
              <div>
                <h3>Managed Venues & Arenas</h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Active facilities in your station
                </p>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ fontSize: '0.775rem', padding: '0.4rem 0.75rem' }}
                onClick={() => setActiveTab('grounds')}
              >
                Manage Courts <ArrowRight size={14} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              {grounds.map((g) => (
                <div key={g.ground_id} style={styles.miniGroundCard}>
                  <img src={g.images[0]} alt={g.title} style={styles.miniGroundImg} />
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="badge badge-sport">{g.sport_type}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e5ba93' }}>
                        ₹{g.price_per_hour}/hr
                      </span>
                    </div>
                    <h4 style={{ fontSize: '0.95rem', margin: '0.5rem 0 0.2rem 0', color: '#ffffff' }}>
                      {g.title}
                    </h4>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                      <MapPin size={12} color="#a39c93" />
                      {g.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Dynamic Pricing & Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* AI Dynamic Pricing Card */}
          <div className="glass-card" style={{ border: '1px solid var(--border-light)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <div style={{ padding: '0.4rem', borderRadius: '8px', background: 'rgba(200, 137, 91, 0.15)' }}>
                <Sparkles size={20} color="#c8895b" />
              </div>
              <div>
                <h3 style={{ fontSize: '1rem' }}>AI Dynamic Pricing Engine</h3>
                <span style={{ fontSize: '0.725rem', color: '#e5ba93' }}>Smart Demand Optimizer</span>
              </div>
            </div>

            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Peak hours tonight (06:00 PM – 10:00 PM) have a <strong>92% booking demand forecast</strong>.
              AI has auto-adjusted rates by +15% to maximize yield.
            </p>

            <div style={styles.aiMetricBox}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                <span style={{ fontSize: '0.775rem', color: '#a39c93' }}>Predicted Daily Lift:</span>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#e5ba93' }}>+₹3,200</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.775rem', color: '#a39c93' }}>Dynamic Rate Multiplier:</span>
                <span style={{ fontSize: '0.775rem', fontWeight: 700, color: '#c8895b' }}>1.18x Peak</span>
              </div>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '1rem', fontSize: '0.825rem' }}
              onClick={() => setActiveTab('slots')}
            >
              Tune Dynamic Rates
            </button>
          </div>

          {/* Peak Revenue Distribution */}
          <div className="glass-card">
            <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Revenue By Sport</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>Football Turf</span>
                  <span style={{ fontWeight: 600, color: '#e5ba93' }}>₹12,400 (52%)</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '52%', background: 'linear-gradient(90deg, #c8895b, #a76f45)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>Badminton Court</span>
                  <span style={{ fontWeight: 600, color: '#c8895b' }}>₹6,800 (28%)</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '28%', background: '#a76f45' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>Box Cricket</span>
                  <span style={{ fontWeight: 600, color: '#a39c93' }}>₹4,900 (20%)</span>
                </div>
                <div style={styles.progressBarBg}>
                  <div style={{ ...styles.progressBarFill, width: '20%', background: '#736d64' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  banner: {
    padding: '1.5rem 1.75rem',
    borderRadius: 'var(--radius-md)',
    background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.18) 0%, rgba(21, 19, 17, 0.95) 100%)',
    border: '1px solid var(--border-light)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '1.75rem',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  bannerBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.25rem 0.65rem',
    borderRadius: '9999px',
    background: 'rgba(200, 137, 91, 0.15)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    color: '#e5ba93',
    fontSize: '0.725rem',
    fontWeight: 700,
    letterSpacing: '0.04em',
  },
  quickActionsGroup: {
    display: 'flex',
    gap: '0.75rem',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scheduleItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '1px solid var(--border-color)',
  },
  timeBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    padding: '0.4rem 0.65rem',
    borderRadius: '6px',
    background: 'rgba(200, 137, 91, 0.15)',
    color: '#e5ba93',
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  miniGroundCard: {
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '1px solid var(--border-color)',
    overflow: 'hidden',
  },
  miniGroundImg: {
    width: '100%',
    height: '110px',
    objectFit: 'cover',
  },
  aiMetricBox: {
    margin: '1rem 0 0.5rem 0',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(15, 13, 11, 0.95)',
    border: '1px solid var(--border-color)',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    borderRadius: '3px',
    background: 'rgba(255, 255, 255, 0.08)',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '3px',
    transition: 'width 0.5s ease',
  }
};
