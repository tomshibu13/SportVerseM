import React from 'react';
import StatCard from '../components/StatCard';
import { TrendingUp, DollarSign, Users, Award } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Revenue & Performance Analytics</h1>
        <p className="page-subtitle">Detailed financial reports, court utilization metrics, and AI dynamic pricing yield</p>
      </div>

      {/* Metric Highlights */}
      <div className="grid-4" style={{ marginBottom: '1.75rem' }}>
        <StatCard title="Monthly Gross Revenue" value="₹1,84,500" change="+24.8% YoY" isPositive={true} icon={DollarSign} color="gold" />
        <StatCard title="Average Hourly Yield" value="₹890/hr" change="+12% dynamic uplift" isPositive={true} icon={TrendingUp} color="bronze" />
        <StatCard title="Repeat Customer Rate" value="68.4%" change="+5.1% retention" isPositive={true} icon={Users} color="cyan" />
        <StatCard title="Station Quality Rank" value="#1 in Region" subtitle="Top rated turf 4.9★" icon={Award} color="amber" />
      </div>

      {/* Visual Analytics Sections */}
      <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
        {/* Weekly Revenue Trend Bar Visual */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '0.4rem' }}>Weekly Revenue Trend</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Daily revenue split across Football, Badminton & Cricket arenas
          </p>

          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '180px', padding: '0 0.5rem' }}>
            {[
              { day: 'Mon', rev: 14200, height: '45%' },
              { day: 'Tue', rev: 16800, height: '55%' },
              { day: 'Wed', rev: 18900, height: '65%' },
              { day: 'Thu', rev: 21000, height: '72%' },
              { day: 'Fri', rev: 28500, height: '88%' },
              { day: 'Sat', rev: 34200, height: '100%' },
              { day: 'Sun', rev: 31000, height: '94%' },
            ].map((item) => (
              <div key={item.day} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', flex: 1 }}>
                <span style={{ fontSize: '0.7rem', color: '#e5ba93', fontWeight: 600 }}>₹{(item.rev/1000).toFixed(1)}k</span>
                <div
                  style={{
                    width: '65%',
                    maxWidth: '32px',
                    height: item.height,
                    background: 'linear-gradient(180deg, #c8895b 0%, rgba(200, 137, 91, 0.25) 100%)',
                    borderRadius: '6px 6px 0 0',
                    boxShadow: '0 0 10px rgba(200, 137, 91, 0.25)',
                  }}
                ></div>
                <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Peak Hours Utilization */}
        <div className="glass-card">
          <h3 style={{ marginBottom: '0.4rem' }}>Time Slot Occupancy Heatmap</h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Average booking density throughout the day
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { time: '06:00 AM - 10:00 AM (Morning)', label: 'High Demand (78%)', pct: '78%', color: '#c8895b' },
              { time: '10:00 AM - 04:00 PM (Midday)', label: 'Moderate (42%)', pct: '42%', color: '#f59e0b' },
              { time: '04:00 PM - 07:00 PM (Evening)', label: 'Prime Peak (96%)', pct: '96%', color: '#e5ba93' },
              { time: '07:00 PM - 11:00 PM (Night Lights)', label: 'Maximum Surge (100%)', pct: '100%', color: '#a76f45' },
            ].map((slot, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '0.25rem' }}>
                  <span>{slot.time}</span>
                  <span style={{ fontWeight: 700, color: slot.color }}>{slot.label}</span>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: slot.pct, height: '100%', background: slot.color, borderRadius: '4px' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
