import React, { useState } from 'react';
import { BarChart3, TrendingUp, IndianRupee, Users, Calendar, ArrowUpRight } from 'lucide-react';

const weeklyData = [
  { day: 'Mon', revenue: 12400, bookings: 9, players: 22 },
  { day: 'Tue', revenue: 9800,  bookings: 7, players: 18 },
  { day: 'Wed', revenue: 15200, bookings: 11, players: 28 },
  { day: 'Thu', revenue: 11000, bookings: 8, players: 20 },
  { day: 'Fri', revenue: 18400, bookings: 13, players: 34 },
  { day: 'Sat', revenue: 24600, bookings: 18, players: 46 },
  { day: 'Sun', revenue: 22800, bookings: 16, players: 42 },
];

const maxRev = Math.max(...weeklyData.map(d => d.revenue));

const monthData = [
  { month: 'Mar', revenue: 188000 },
  { month: 'Apr', revenue: 210000 },
  { month: 'May', revenue: 195000 },
  { month: 'Jun', revenue: 245000 },
  { month: 'Jul', revenue: 278000 },
  { month: 'Aug', revenue: 114200 },
];
const maxMonth = Math.max(...monthData.map(d => d.revenue));

const sportBreakdown = [
  { sport: 'Football (Turf A)', pct: 62, color: '#10b981', rev: '₹70,400' },
  { sport: 'Badminton (Hall 1)', pct: 38, color: '#3b82f6', rev: '₹43,200' },
];

const topPlayers = [
  { name: 'Rahul Dravid', visits: 18, spent: '₹21,600', sport: 'Football' },
  { name: 'Anjali Menon', visits: 14, spent: '₹7,000', sport: 'Badminton' },
  { name: 'Kiran Kumar', visits: 11, spent: '₹5,500', sport: 'Badminton' },
  { name: 'Priya Nair', visits: 9, spent: '₹10,800', sport: 'Football' },
];

export default function RevenuePage() {
  const [view, setView] = useState('weekly');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Revenue & Analytics</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Financial performance and player engagement insights</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {['weekly', 'monthly'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{
                padding: '0.4rem 0.85rem', borderRadius: '8px', border: '1px solid',
                background: view === v ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.04)',
                borderColor: view === v ? 'rgba(16,185,129,0.4)' : 'var(--border-color)',
                color: view === v ? '#10b981' : '#7fb3a0',
                fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', textTransform: 'capitalize',
              }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { l: 'This Week', v: '₹1,14,200', delta: '+18%', icon: <IndianRupee size={20} />, color: '#10b981' },
          { l: 'Total Bookings', v: '82', delta: '+12 vs last week', icon: <Calendar size={20} />, color: '#3b82f6' },
          { l: 'Unique Players', v: '210', delta: '+28 this week', icon: <Users size={20} />, color: '#a855f7' },
          { l: 'Avg Per Booking', v: '₹1,393', delta: 'Up ₹92', icon: <TrendingUp size={20} />, color: '#f59e0b' },
        ].map(s => (
          <div key={s.l} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#7fb3a0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem' }}>{s.l}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e8f5f1' }}>{s.v}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.35rem' }}>
                  <ArrowUpRight size={12} color="#10b981" />
                  <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600 }}>{s.delta}</span>
                </div>
              </div>
              <div style={{ color: s.color, opacity: 0.7 }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Bar chart */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><BarChart3 size={16} color="#10b981" /> {view === 'weekly' ? 'Daily Revenue This Week' : 'Monthly Revenue (2026)'}</span>
          <span className="badge badge-green">₹ INR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.6rem', height: '180px', padding: '0 0.5rem' }}>
          {(view === 'weekly' ? weeklyData : monthData).map((d, i) => {
            const rev = d.revenue;
            const max = view === 'weekly' ? maxRev : maxMonth;
            const h = Math.max(8, (rev / max) * 100);
            return (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 700, whiteSpace: 'nowrap' }}>
                  ₹{(rev / 1000).toFixed(0)}k
                </div>
                <div style={{
                  width: '100%', height: `${h}%`, borderRadius: '6px 6px 0 0',
                  background: 'linear-gradient(to top, #059669, #10b981)',
                  boxShadow: '0 4px 12px rgba(16,185,129,0.25)',
                  minHeight: '8px', transition: 'height 0.5s ease',
                }} />
                <div style={{ fontSize: '0.72rem', color: '#7fb3a0', fontWeight: 600 }}>{view === 'weekly' ? d.day : d.month}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem' }}>
        {/* Sport breakdown */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><TrendingUp size={16} color="#f59e0b" /> Revenue by Sport</span>
          </div>
          {sportBreakdown.map(s => (
            <div key={s.sport} style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e8f5f1' }}>{s.sport}</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: s.color }}>{s.pct}%</span>
                  <span style={{ fontSize: '0.78rem', color: '#7fb3a0' }}>{s.rev}</span>
                </div>
              </div>
              <div className="progress-bar">
                <div style={{ height: '100%', borderRadius: '4px', width: `${s.pct}%`, background: s.color, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: '#7fb3a0', marginBottom: '0.25rem' }}>Total This Month</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10b981' }}>₹1,13,600</div>
          </div>
        </div>

        {/* Top players */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Users size={16} color="#a855f7" /> Top Players by Visits</span>
            <span className="badge badge-purple">This Month</span>
          </div>
          {topPlayers.map((p, i) => (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.7rem 0', borderBottom: i < topPlayers.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--green-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem', color: '#fff', flexShrink: 0 }}>
                {p.name.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8f5f1' }}>{p.name}</div>
                <div style={{ fontSize: '0.72rem', color: '#7fb3a0' }}>{p.sport} · {p.visits} visits</div>
              </div>
              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '0.9rem' }}>{p.spent}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
