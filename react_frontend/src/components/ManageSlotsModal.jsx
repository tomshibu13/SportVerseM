import React, { useState, useEffect } from 'react';
import { X, Clock, IndianRupee, Check, Lock, Unlock, Sparkles, AlertCircle } from 'lucide-react';

const DEFAULT_SLOT_TIMES = [
  '06:00 AM - 07:00 AM',
  '07:00 AM - 08:00 AM',
  '08:00 AM - 09:00 AM',
  '09:00 AM - 10:00 AM',
  '10:00 AM - 11:00 AM',
  '11:00 AM - 12:00 PM',
  '03:00 PM - 04:00 PM',
  '04:00 PM - 05:00 PM',
  '05:00 PM - 06:00 PM',
  '06:00 PM - 07:00 PM',
  '07:00 PM - 08:00 PM',
  '08:00 PM - 09:00 PM',
  '09:00 PM - 10:00 PM',
  '10:00 PM - 11:00 PM',
];

export default function ManageSlotsModal({ isOpen, onClose, ground, onUpdateGround }) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (ground) {
      const basePrice = Number(ground.pricePerHour || ground.price_per_hour) || 700;
      if (ground.available_slots && ground.available_slots.length > 0) {
        setSlots(
          ground.available_slots.map((s, idx) => ({
            slot_id: s.slot_id || `sl_${idx + 1}`,
            time: s.time || DEFAULT_SLOT_TIMES[idx % DEFAULT_SLOT_TIMES.length],
            is_booked: Boolean(s.is_booked),
            price: Number(s.price || basePrice),
          }))
        );
      } else {
        // Generate standard daily slots
        setSlots(
          DEFAULT_SLOT_TIMES.map((time, idx) => {
            const isPrime = time.includes('06:00 PM') || time.includes('07:00 PM') || time.includes('08:00 PM');
            return {
              slot_id: `sl_${idx + 1}`,
              time,
              is_booked: idx === 3 || idx === 9,
              price: isPrime ? Math.round(basePrice * 1.25) : basePrice,
            };
          })
        );
      }
    }
  }, [ground]);

  if (!isOpen || !ground) return null;

  const handlePriceChange = (index, newPrice) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, price: Number(newPrice) || 0 } : slot))
    );
  };

  const handleToggleLock = (index) => {
    setSlots((prev) =>
      prev.map((slot, i) => (i === index ? { ...slot, is_booked: !slot.is_booked } : slot))
    );
  };

  const handleApplySurgeAll = (multiplier) => {
    const basePrice = Number(ground.pricePerHour || ground.price_per_hour) || 700;
    setSlots((prev) =>
      prev.map((slot) => ({
        ...slot,
        price: Math.round(basePrice * multiplier),
      }))
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setSavedSuccess(false);
    try {
      const groundId = ground._id || ground.id || ground.ground_id;
      await onUpdateGround(groundId, {
        available_slots: slots,
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Failed to save slot changes:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '640px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={20} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff' }}>Manage Slots & Dynamic Pricing</h3>
              <span style={{ fontSize: '0.75rem', color: '#c8895b', fontWeight: 600 }}>{ground.title}</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        {/* Quick Batch Surge Preset Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(200, 137, 91, 0.1)', border: '1px solid rgba(200, 137, 91, 0.25)', borderRadius: '8px', padding: '0.6rem 0.85rem', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: '#ffffff', fontWeight: 600 }}>
            <Sparkles size={16} color="#c8895b" />
            <span>Batch Pricing Multiplier:</span>
          </div>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleApplySurgeAll(1.0)}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#a39c93', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer' }}
            >
              Base (1.0x)
            </button>
            <button
              type="button"
              onClick={() => handleApplySurgeAll(1.15)}
              style={{ background: 'rgba(200,137,91,0.2)', border: '1px solid #c8895b', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              +15% Surge
            </button>
            <button
              type="button"
              onClick={() => handleApplySurgeAll(1.3)}
              style={{ background: 'rgba(200,137,91,0.2)', border: '1px solid #c8895b', color: '#ffffff', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}
            >
              +30% Peak
            </button>
          </div>
        </div>

        {/* Scrollable Slots List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingRight: '0.25rem', marginBottom: '1rem' }}>
          {slots.map((slot, index) => (
            <div
              key={slot.slot_id || index}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.65rem 0.85rem',
                background: slot.is_booked ? 'rgba(239, 68, 68, 0.08)' : 'rgba(255, 255, 255, 0.03)',
                border: slot.is_booked ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid var(--border-color)',
                borderRadius: '8px',
                gap: '0.75rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Clock size={16} color={slot.is_booked ? '#ef4444' : '#10b981'} />
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>{slot.time}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Rate Input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '0.2rem 0.45rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#c8895b', fontWeight: 700 }}>₹</span>
                  <input
                    type="number"
                    value={slot.price}
                    onChange={(e) => handlePriceChange(index, e.target.value)}
                    style={{ width: '65px', background: 'transparent', border: 'none', color: '#ffffff', fontSize: '0.8rem', fontWeight: 700, outline: 'none' }}
                    min="100"
                    step="50"
                  />
                </div>

                {/* Status Toggle Button */}
                <button
                  type="button"
                  onClick={() => handleToggleLock(index)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.35rem 0.65rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: slot.is_booked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                    color: slot.is_booked ? '#ef4444' : '#10b981',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                  title={slot.is_booked ? 'Click to mark Available' : 'Click to Block Slot'}
                >
                  {slot.is_booked ? (
                    <>
                      <Lock size={12} />
                      <span>Blocked</span>
                    </>
                  ) : (
                    <>
                      <Unlock size={12} />
                      <span>Open</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
          {savedSuccess ? (
            <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Check size={16} />
              <span>Slot schedule synchronized with MongoDB!</span>
            </div>
          ) : (
            <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
              {slots.filter((s) => !s.is_booked).length} of {slots.length} slots open for bookings
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave} disabled={loading}>
              {loading ? 'Saving...' : 'Save & Sync Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
