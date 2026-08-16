import React, { useEffect, useState } from 'react';
import {
  TrendingUp, Users, CalendarCheck, IndianRupee,
  Star, Activity, ArrowUpRight, MapPin, Clock, Zap
} from 'lucide-react';

const KPICard = ({ title, value, sub, icon: Icon, color, delta }) => (
  <div className="card" style={{ position: 'relative', overflow: 'hidden', minHeight: '120px' }}>
    <div style={{
      position: 'absolute', top: '-20px', right: '-20px',
      width: '90px', height: '90px', borderRadius: '50%',
      background: `radial-gradient(circle, ${color}20, transparent 70%)`,
    }} />
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <p style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </p>
        <p style={{ fontSize: '2rem', fontWeight: 900, color: '#e8f5f1', lineHeight: 1 }}>{value}</p>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{sub}</p>
      </div>
      <div style={{
        width: '46px', height: '46px', borderRadius: '12px',
        background: `${color}18`, border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 14px ${color}25`,
      }}>
        <Icon size={22} color={color} />
      </div>
    </div>
    {delta && (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.6rem' }}>
        <ArrowUpRight size={13} color="#10b981" />
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>{delta} vs last week</span>
      </div>
    )}
  </div>
);

const OccupancyRing = ({ percent, label }) => {
  const r = 40;
  const circ = 2 * Math.PI * r;
  const filled = (percent / 100) * circ;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' }}>
      <svg width="100" height="100" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="50" cy="50" r={r} stroke="rgba(255,255,255,0.06)" strokeWidth="10" fill="none" />
        <circle cx="50" cy="50" r={r} stroke="url(#greenGrad)" strokeWidth="10"
          fill="none" strokeDasharray={circ} strokeDashoffset={circ - filled}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }}
        />
        <defs>
          <linearGradient id="greenGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: '#e8f5f1', textAlign: 'center', marginTop: '-4px' }}>
        {percent}%
      </div>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center' }}>{label}</div>
    </div>
  );
};

const recentActivity = [
  { time: '09:30 AM', event: 'Rahul D. checked in — Turf A', type: 'checkin' },
  { time: '09:45 AM', event: 'New booking: Slot 12:00 PM Turf A', type: 'booking' },
  { time: '10:00 AM', event: 'Payment received ₹1,200 — BK-9821', type: 'payment' },
  { time: '10:15 AM', event: 'Anjali M. checked in — Hall 1', type: 'checkin' },
  { time: '10:30 AM', event: 'Rating received ★ 5.0 on Turf A', type: 'rating' },
  { time: '10:55 AM', event: 'Pro-shop: 2x Shuttlecock sold', type: 'shop' },
];

const typeColor = { checkin: '#10b981', booking: '#3b82f6', payment: '#f59e0b', rating: '#a855f7', shop: '#f59e0b' };

export default function OverviewPage({ currentUser }) {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const name = currentUser?.fullName || 'Owner';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Hero banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.18) 0%, rgba(5,150,105,0.1) 50%, rgba(13,24,24,0.9) 100%)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem 2rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{ position: 'absolute', right: '10%', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, fontSize: '11rem', fontWeight: 900, color: '#10b981', pointerEvents: 'none', userSelect: 'none' }}>⚡</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.3rem' }}>
            <Zap size={18} color="#10b981" />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Station Control Center</span>
          </div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 900, color: '#e8f5f1' }}>
            Good {time.getHours() < 12 ? 'Morning' : time.getHours() < 17 ? 'Afternoon' : 'Evening'}, {name.split(' ')[0]}! 👋
          </h2>
          <p style={{ color: '#7fb3a0', marginTop: '0.3rem', fontSize: '0.9rem' }}>
            2 active venues • 12 bookings today • Earning strong 💪
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981', letterSpacing: '-0.02em' }}>
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#7fb3a0' }}>
            {time.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <KPICard title="Today's Revenue" value="₹18,400" sub="7 payments received" icon={IndianRupee} color="#10b981" delta="+24%" />
        <KPICard title="Active Bookings" value="12" sub="Next: 11:00 AM – Turf A" icon={CalendarCheck} color="#3b82f6" delta="+3 new" />
        <KPICard title="Players Today" value="34" sub="18 checked in so far" icon={Users} color="#a855f7" delta="+8" />
        <KPICard title="Avg. Rating" value="4.8 ★" sub="Based on 182 reviews" icon={Star} color="#f59e0b" delta="+0.1" />
      </div>

      {/* Occupancy + Activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: '1rem' }}>
        {/* Occupancy rings */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><Activity size={16} color="#10b981" /> Court Occupancy</span>
            <span className="badge badge-green">Live</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', padding: '1rem 0' }}>
            <OccupancyRing percent={88} label="Turf A" />
            <OccupancyRing percent={75} label="Hall 1" />
            <OccupancyRing percent={82} label="Overall" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginTop: '0.5rem' }}>
            {[{ l: 'Total Slots Today', v: '24' }, { l: 'Booked Slots', v: '20' }, { l: 'Available Slots', v: '4' }, { l: 'Peak Hour', v: '6–8 PM' }].map((s) => (
              <div key={s.l} style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                <div style={{ fontSize: '0.7rem', color: '#7fb3a0', marginBottom: '0.2rem' }}>{s.l}</div>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#e8f5f1' }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity feed */}
        <div className="card">
          <div className="card-header">
            <span className="card-title"><MapPin size={16} color="#3b82f6" /> Today's Activity Feed</span>
            <span className="badge badge-blue">Auto-updating</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {recentActivity.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0', borderBottom: i < recentActivity.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: typeColor[a.type], flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '0.84rem', color: '#e8f5f1', fontWeight: 500 }}>{a.event}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0 }}>
                  <Clock size={12} color="#4a7a6a" />
                  <span style={{ fontSize: '0.72rem', color: '#4a7a6a' }}>{a.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming Slots Timeline */}
      <div className="card">
        <div className="card-header">
          <span className="card-title"><Clock size={16} color="#f59e0b" /> Today's Upcoming Slots</span>
          <span className="badge badge-gold">8 Remaining</span>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', padding: '0.5rem 0' }}>
          {[
            { time: '11:00 AM', player: 'Booked – Rahul D.', court: 'Turf A', status: 'confirmed' },
            { time: '12:00 PM', player: 'Booked – Priya N.', court: 'Turf A', status: 'confirmed' },
            { time: '01:00 PM', player: 'Available', court: 'Turf A', status: 'free' },
            { time: '02:00 PM', player: 'Available', court: 'Hall 1', status: 'free' },
            { time: '03:00 PM', player: 'Booked – Kiran K.', court: 'Hall 1', status: 'confirmed' },
            { time: '04:00 PM', player: 'Booked – Anjali M.', court: 'Turf A', status: 'confirmed' },
            { time: '05:00 PM', player: 'Available', court: 'Hall 1', status: 'free' },
            { time: '06:00 PM', player: 'Booked – Team FC', court: 'Turf A', status: 'peak' },
          ].map((slot) => (
            <div key={slot.time} style={{
              minWidth: '140px', background: 'rgba(6,13,13,0.9)',
              border: `1px solid ${slot.status === 'free' ? 'rgba(16,185,129,0.25)' : slot.status === 'peak' ? 'rgba(245,158,11,0.35)' : 'var(--border-color)'}`,
              borderRadius: '10px', padding: '0.75rem',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: slot.status === 'peak' ? '#f59e0b' : '#e8f5f1' }}>{slot.time}</div>
              <div style={{ fontSize: '0.7rem', color: '#7fb3a0', marginTop: '0.2rem' }}>{slot.court}</div>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, marginTop: '0.4rem', color: slot.status === 'free' ? '#10b981' : '#7fb3a0' }}>
                {slot.player}
              </div>
              {slot.status === 'peak' && <span className="badge badge-gold" style={{ marginTop: '0.4rem', fontSize: '0.6rem' }}>Peak</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
