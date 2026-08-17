import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  Sparkles, 
  MapPin, 
  IndianRupee, 
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';

export default function AnalyticsPage({ grounds = [], bookings = [], users = [], products = [] }) {
  // ── Financial Metrics ──
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

  // ── Calculate Sport Demand Distribution ──
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

  // ── Top Performing Arenas by Revenue & Bookings ──
  const venuePerformance = {};
  bookings.forEach((b) => {
    const gName = b.ground_name || (b.ground && b.ground.title) || 'Arena';
    if (!venuePerformance[gName]) {
      venuePerformance[gName] = { name: gName, bookings: 0, revenue: 0, completed: 0 };
    }
    venuePerformance[gName].bookings += 1;
    if (b.booking_status !== 'Cancelled') {
      venuePerformance[gName].revenue += (Number(b.total_price) || 0);
    }
    if (b.booking_status === 'Completed') {
      venuePerformance[gName].completed += 1;
    }
  });

  const topVenues = Object.values(venuePerformance).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // ── User Demographics ──
  const playerUsers = users.filter((u) => u.role === 'User' || !u.role);
  const groundOwners = users.filter((u) => u.role === 'GroundOwner');
  const shopOwners = users.filter((u) => u.role === 'ShopOwner');
  const admins = users.filter((u) => u.role === 'Admin');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <BarChart3 size={24} color="#c8895b" />
          <span>Real-Time Platform & Revenue Analytics</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
          Live insights computed dynamically from active bookings, registered venues, player volume, and pro-shop inventory in MongoDB.
        </p>
      </div>

      {/* Analytics Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#a39c93', fontWeight: 600 }}>Active Platform Revenue</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '0.25rem' }}>
            ₹{totalRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.3rem', fontWeight: 600 }}>
            ₹{completedRevenue.toLocaleString()} from {completedCount} completed sessions
          </div>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#a39c93', fontWeight: 600 }}>Avg Booking Value (AOV)</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c8895b', marginTop: '0.25rem' }}>
            ₹{avgBookingValue}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#c8895b', marginTop: '0.3rem' }}>
            Per 1-Hour Court Session
          </div>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#a39c93', fontWeight: 600 }}>Registered Sports Venues</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6', marginTop: '0.25rem' }}>
            {grounds.length} Arenas
          </div>
          <div style={{ fontSize: '0.75rem', color: '#3b82f6', marginTop: '0.3rem' }}>
            {grounds.filter(g => g.status === 'Approved' || g.status === 'Active').length} Active Live
          </div>
        </div>

        <div className="card">
          <span style={{ fontSize: '0.8rem', color: '#a39c93', fontWeight: 600 }}>Total Platform Accounts</span>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.25rem' }}>
            {users.length} Users
          </div>
          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.3rem' }}>
            {playerUsers.length} Players • {groundOwners.length} Ground Owners
          </div>
        </div>
      </div>

      {/* Analytics Visual Breakdown Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        
        {/* Dynamic Sport Demand Breakdown */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <TrendingUp size={18} color="#c8895b" />
              <span>Sport Demand & Revenue Breakdown</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>{bookings.length} Total Bookings</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
            {sportList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#a39c93', fontSize: '0.85rem' }}>
                No booking records in database yet.
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
                        <span style={{ color: '#a39c93', fontSize: '0.75rem' }}>{item.count} slots • ₹{item.revenue.toLocaleString()}</span>
                        <span style={{ fontWeight: 700, color: barColor }}>{item.percentage}%</span>
                      </div>
                    </div>
                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.08)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${item.percentage}%`, height: '100%', background: barColor, borderRadius: '4px', transition: 'width 0.4s ease' }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Booking Fulfillment Status */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <CalendarCheck size={18} color="#3b82f6" />
              <span>Reservation Fulfillment Health</span>
            </h3>
            <span className="badge badge-green">Live MongoDB</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600 }}>Completed</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{completedCount}</div>
                <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{bookings.length > 0 ? Math.round((completedCount / bookings.length) * 100) : 0}%</div>
              </div>

              <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#3b82f6', fontWeight: 600 }}>Upcoming</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{upcomingCount}</div>
                <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{bookings.length > 0 ? Math.round((upcomingCount / bookings.length) * 100) : 0}%</div>
              </div>

              <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: 600 }}>Cancelled</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginTop: '0.2rem' }}>{cancelledCount}</div>
                <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>{bookings.length > 0 ? Math.round((cancelledCount / bookings.length) * 100) : 0}%</div>
              </div>
            </div>

            <div style={{
              background: 'rgba(200, 137, 91, 0.1)',
              border: '1px solid rgba(200, 137, 91, 0.3)',
              borderRadius: '10px',
              padding: '1rem',
            }}>
              <div style={{ fontWeight: 700, color: '#c8895b', fontSize: '0.85rem', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={16} color="#c8895b" />
                <span>Live Optimization Insight</span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#ffffff', lineHeight: 1.5 }}>
                Platform has processed <strong>{bookings.length} total court bookings</strong> totaling <strong>₹{totalRevenue.toLocaleString()}</strong>. 
                {sportList.length > 0 && ` ${sportList[0].sport} represents the largest volume at ${sportList[0].percentage}% of reservations.`}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Venues by Revenue & User Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1.5rem' }}>
        
        {/* Top Arenas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <MapPin size={18} color="#c8895b" />
              <span>Top Generating Sports Venues</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Ranked by Revenue</span>
          </div>

          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Arena Name</th>
                  <th>Total Slots</th>
                  <th>Completed</th>
                  <th>Gross Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topVenues.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: '#a39c93' }}>
                      No venue booking history found.
                    </td>
                  </tr>
                ) : (
                  topVenues.map((v, idx) => (
                    <tr key={v.name}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{v.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#c8895b' }}>Rank #{idx + 1}</div>
                      </td>
                      <td style={{ color: '#3b82f6', fontWeight: 600 }}>{v.bookings} bookings</td>
                      <td style={{ color: '#10b981', fontWeight: 600 }}>{v.completed} sessions</td>
                      <td style={{ fontWeight: 800, color: '#ffffff' }}>₹{v.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Users size={18} color="#c084fc" />
              <span>Platform Account Distribution</span>
            </h3>
            <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>{users.length} Total</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(10,9,8,0.7)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>End-User Players</div>
                <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Mobile app sports players</div>
              </div>
              <span className="badge badge-blue" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {playerUsers.length} Users ({users.length > 0 ? Math.round((playerUsers.length / users.length) * 100) : 0}%)
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(10,9,8,0.7)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>Ground & Station Owners</div>
                <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Arena operators & managers</div>
              </div>
              <span className="badge badge-green" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {groundOwners.length} Owners
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'rgba(10,9,8,0.7)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.85rem' }}>Superadministrators</div>
                <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Master console controllers</div>
              </div>
              <span className="badge badge-primary" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                {admins.length} Admins
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
