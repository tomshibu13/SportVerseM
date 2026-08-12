import React, { useState } from 'react';
import { Clock, Sparkles, Zap, Plus } from 'lucide-react';

export default function SlotsPage({ grounds = [] }) {
  const [selectedGroundId, setSelectedGroundId] = useState(grounds[0]?.ground_id || 101);
  const [aiPricingEnabled, setAiPricingEnabled] = useState(true);
  const [selectedDate, setSelectedDate] = useState('2026-08-10');

  const selectedGround = grounds.find((g) => g.ground_id === Number(selectedGroundId)) || grounds[0];

  const [slotsState, setSlotsState] = useState(
    selectedGround?.available_slots || [
      { slot_id: 's1', time: '06:00 AM - 07:00 AM', is_booked: false, price: 800 },
      { slot_id: 's2', time: '07:00 AM - 08:00 AM', is_booked: true, price: 800 },
      { slot_id: 's3', time: '05:00 PM - 06:00 PM', is_booked: false, price: 950, isPeak: true },
      { slot_id: 's4', time: '06:00 PM - 07:00 PM', is_booked: false, price: 950, isPeak: true },
      { slot_id: 's5', time: '07:00 PM - 08:00 PM', is_booked: true, price: 950, isPeak: true },
      { slot_id: 's6', time: '08:00 PM - 09:00 PM', is_booked: false, price: 950, isPeak: true },
    ]
  );

  const toggleSlotBooking = (slotId) => {
    setSlotsState(
      slotsState.map((s) => (s.slot_id === slotId ? { ...s, is_booked: !s.is_booked } : s))
    );
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Slot Scheduling & AI Dynamic Pricing</h1>
          <p className="page-subtitle">Configure hourly slots, peak surge rates, and AI yield algorithms</p>
        </div>

        {/* AI Dynamic Switch Card */}
        <div style={styles.aiToggleBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#c8895b" />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>AI Yield Engine</div>
              <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Auto-surge high demand slots</div>
            </div>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={aiPricingEnabled}
              onChange={() => setAiPricingEnabled(!aiPricingEnabled)}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      {/* Control Bar: Venue Dropdown & Date Selector */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ margin: 0, minWidth: '240px' }}>
            <label className="form-label">Select Arena / Court</label>
            <select
              className="select-field"
              value={selectedGroundId}
              onChange={(e) => setSelectedGroundId(e.target.value)}
            >
              {grounds.map((g) => (
                <option key={g.ground_id} value={g.ground_id}>
                  {g.title} ({g.sport_type})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ margin: 0, minWidth: '180px' }}>
            <label className="form-label">Date Schedule</label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
          </div>

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Base Price: <strong style={{ color: '#ffffff' }}>₹{selectedGround?.price_per_hour}/hr</strong>
            </div>
            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>
              <Plus size={14} /> Add Slot Time
            </button>
          </div>
        </div>
      </div>

      {/* Slot Grid Matrix */}
      <div className="grid-3">
        {slotsState.map((slot) => {
          const isPeak = slot.isPeak || slot.price > (selectedGround?.price_per_hour || 700);
          return (
            <div
              key={slot.slot_id}
              className="glass-card"
              style={{
                border: slot.is_booked
                  ? '1px solid rgba(239, 68, 68, 0.3)'
                  : isPeak
                  ? '1px solid rgba(200, 137, 91, 0.4)'
                  : '1px solid var(--border-color)',
                background: slot.is_booked ? 'rgba(239, 68, 68, 0.05)' : 'var(--bg-card)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.95rem' }}>
                  <Clock size={16} color={slot.is_booked ? '#ef4444' : '#c8895b'} />
                  {slot.time}
                </div>
                {isPeak && (
                  <span className="badge badge-completed">
                    <Zap size={12} /> Peak Surge
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.75rem 0' }}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block' }}>Slot Rate</span>
                  <span style={{ fontSize: '1.4rem', fontWeight: 800, color: isPeak ? '#e5ba93' : '#c8895b' }}>
                    ₹{aiPricingEnabled && isPeak ? Math.round(slot.price * 1.15) : slot.price}
                  </span>
                </div>

                <span className={`badge badge-${slot.is_booked ? 'cancelled' : 'approved'}`}>
                  {slot.is_booked ? 'Booked' : 'Available'}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button
                  className={`btn ${slot.is_booked ? 'btn-danger' : 'btn-secondary'}`}
                  style={{ flex: 1, fontSize: '0.775rem', padding: '0.45rem' }}
                  onClick={() => toggleSlotBooking(slot.slot_id)}
                >
                  {slot.is_booked ? 'Mark Unbooked' : 'Reserve Slot'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  aiToggleBox: {
    padding: '0.65rem 1rem',
    borderRadius: 'var(--radius-md)',
    background: 'rgba(200, 137, 91, 0.15)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  }
};
