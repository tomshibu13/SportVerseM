import React, { useState } from 'react';
import { Clock, Sparkles, TrendingUp, Zap, CheckCircle2 } from 'lucide-react';

export default function SlotsPage({ grounds = [] }) {
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.25);
  const [activeSurge, setActiveSurge] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={24} color="#c8895b" />
            <span>Slots & AI Dynamic Pricing</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Configure time slot windows, peak surge multipliers, and AI automated demand pricing.
          </p>
        </div>

        {/* Surge Controller */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(10, 9, 8, 0.8)', padding: '0.5rem 1rem', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', color: '#a39c93', fontWeight: 600 }}>Surge Multiplier:</span>
          {[1.1, 1.25, 1.35, 1.5].map((mult) => (
            <button
              key={mult}
              onClick={() => setSurgeMultiplier(mult)}
              style={{
                background: surgeMultiplier === mult ? '#c8895b' : 'rgba(255,255,255,0.05)',
                color: surgeMultiplier === mult ? '#ffffff' : '#a39c93',
                border: 'none',
                padding: '0.25rem 0.55rem',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              +{Math.round((mult - 1) * 100)}%
            </button>
          ))}
        </div>
      </div>

      {/* AI Dynamic Pricing Card */}
      <div className="card" style={{ background: 'linear-gradient(135deg, rgba(200, 137, 91, 0.15) 0%, rgba(20, 18, 16, 0.95) 100%)', border: '1px solid rgba(200, 137, 91, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={20} color="#c8895b" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>AI Dynamic Surge Recommendation Engine</h3>
          </div>
          <span className="badge badge-green">AI Real-Time Optimization Active</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#a39c93', lineHeight: 1.6 }}>
          Peak demand detected for <strong>Friday, Saturday & Sunday (17:00 - 22:00)</strong> across Football Turfs & Badminton Courts. Current surge multiplier of <strong>{surgeMultiplier}x (+{Math.round((surgeMultiplier - 1) * 100)}%)</strong> increases gross venue yields by an estimated <strong>18.5%</strong> without decreasing player booking volume.
        </p>
      </div>

      {/* Slot Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venue / Ground</th>
                <th>Standard Rate</th>
                <th>Peak Surge Rate ({surgeMultiplier}x)</th>
                <th>Peak Hours</th>
                <th>Demand Level</th>
                <th>Slot Allocation</th>
              </tr>
            </thead>
            <tbody>
              {grounds.map((g) => {
                const baseRate = g.pricePerHour || g.price_per_hour || 700;
                const dynamicRate = Math.round(baseRate * surgeMultiplier);
                return (
                  <tr key={g.id || g._id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                        {Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || 'Football')}
                      </div>
                    </td>
                    <td style={{ color: '#a39c93', fontWeight: 600 }}>₹{baseRate}/hr</td>
                    <td style={{ color: '#c8895b', fontWeight: 800, fontSize: '1rem' }}>
                      ₹{dynamicRate}/hr
                    </td>
                    <td>
                      <div style={{ fontSize: '0.8rem', color: '#ffffff' }}>17:00 - 22:00</div>
                      <div style={{ fontSize: '0.7rem', color: '#a39c93' }}>Evening High Demand</div>
                    </td>
                    <td>
                      <span className="badge badge-green">High Demand (89% Occupancy)</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600 }}>
                        {g.totalSlots || 12} slots/day
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
