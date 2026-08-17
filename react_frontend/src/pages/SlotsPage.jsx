import React, { useState } from 'react';
import { Clock, Sparkles, TrendingUp, Zap, CheckCircle2, Settings2, Search, MapPin } from 'lucide-react';

export default function SlotsPage({ grounds = [], onManageSlots }) {
  const [surgeMultiplier, setSurgeMultiplier] = useState(1.25);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredGrounds = grounds.filter((g) => {
    const q = searchTerm.toLowerCase();
    const sName = g.sport_type || (Array.isArray(g.sports) ? g.sports.join(' ') : g.sports) || '';
    return !searchTerm || (g.title && g.title.toLowerCase().includes(q)) || (g.location && g.location.toLowerCase().includes(q)) || sName.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Clock size={24} color="#c8895b" />
            <span>Time Slots & Dynamic Surge Pricing</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Configure venue operating slots, live court pricing, peak demand surge multipliers, and availability in MongoDB.
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
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>Live Dynamic Surge Simulation</h3>
          </div>
          <span className="badge badge-green">Real-time Simulation Active</span>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#a39c93', lineHeight: 1.6 }}>
          Currently displaying dynamic rates across <strong>{grounds.length} sports arenas</strong> using a <strong>{surgeMultiplier}x (+{Math.round((surgeMultiplier - 1) * 100)}%)</strong> surge factor. Custom slot schedules can be fine-tuned per arena below.
        </p>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '280px' }}>
        <Search size={15} color="#a39c93" />
        <input
          type="text"
          placeholder="Filter venues & sports..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '100%' }}
        />
      </div>

      {/* Slot Table */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Venue / Ground</th>
                <th>Standard Rate</th>
                <th>Surge Rate ({surgeMultiplier}x)</th>
                <th>Configured Slots in DB</th>
                <th>Live Status</th>
                {onManageSlots && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredGrounds.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                    No venues found matching your query.
                  </td>
                </tr>
              ) : (
                filteredGrounds.map((g) => {
                  const baseRate = g.pricePerHour || g.price_per_hour || 0;
                  const dynamicRate = Math.round(baseRate * surgeMultiplier);
                  const slots = Array.isArray(g.available_slots) ? g.available_slots : [];
                  const bookedSlotsCount = slots.filter((s) => s.is_booked).length;

                  return (
                    <tr key={g.id || g._id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#ffffff' }}>{g.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                          {g.location || g.address} • <span style={{ color: '#c8895b' }}>{Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || 'Sports')}</span>
                        </div>
                      </td>
                      <td style={{ color: '#a39c93', fontWeight: 600 }}>₹{baseRate}/hr</td>
                      <td style={{ color: '#c8895b', fontWeight: 800, fontSize: '1rem' }}>
                        ₹{dynamicRate}/hr
                      </td>
                      <td>
                        {slots.length > 0 ? (
                          <div>
                            <div style={{ fontSize: '0.825rem', color: '#3b82f6', fontWeight: 700 }}>
                              {slots.length} Daily Slots
                            </div>
                            <div style={{ fontSize: '0.7rem', color: bookedSlotsCount > 0 ? '#f59e0b' : '#10b981' }}>
                              {bookedSlotsCount} Booked • {slots.length - bookedSlotsCount} Available
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Standard Hours (Open)</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${g.status === 'Pending' ? 'badge-orange' : 'badge-green'}`}>
                          {g.status || 'Active'}
                        </span>
                      </td>
                      {onManageSlots && (
                        <td>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.75rem', gap: '0.3rem' }}
                            onClick={() => onManageSlots(g)}
                          >
                            <Settings2 size={13} color="#c8895b" />
                            <span>Manage Slots</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
