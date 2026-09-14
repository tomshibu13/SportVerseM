import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Zap, CheckCircle2, XCircle, Edit3, Calendar, Layers, RefreshCw } from 'lucide-react';
import { fetchMyGrounds, fetchSlotsApi, generateSlotsApi, updateSlotApi, createSlotApi } from '../services/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
  '20:00', '21:00', '22:00'
];

const slotColors = {
  available: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  booked: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  blocked: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#7fb3a0' },
  expired: { bg: 'rgba(255,255,255,0.02)', border: 'rgba(255,255,255,0.05)', text: '#4a7a6a' },
};

// Helper to get date string (YYYY-MM-DD) for a day of current week
function getDateForDay(dayName) {
  const dayIndex = days.indexOf(dayName);
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
  const diff = dayIndex - currentDayOfWeek;
  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diff);
  const yyyy = targetDate.getFullYear();
  const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
  const dd = String(targetDate.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Convert "06:00" to "06:00 AM - 07:00 AM"
function hourToTimeRange(h) {
  const [hStr] = h.split(':');
  const num = parseInt(hStr, 10);
  const ampm = num >= 12 ? 'PM' : 'AM';
  const dhr = num > 12 ? num - 12 : num === 0 ? 12 : num;
  const nextNum = num + 1;
  const nampm = nextNum >= 12 && nextNum < 24 ? 'PM' : 'AM';
  const ndhr = nextNum > 12 ? nextNum - 12 : nextNum === 0 || nextNum === 24 ? 12 : nextNum;
  return {
    startTime: `${dhr.toString().padStart(2, '0')}:00 ${ampm}`,
    endTime: `${ndhr.toString().padStart(2, '0')}:00 ${nampm}`,
    timeRange: `${dhr.toString().padStart(2, '0')}:00 ${ampm} - ${ndhr.toString().padStart(2, '0')}:00 ${nampm}`,
  };
}

export default function SlotsPage({ currentUser }) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [grounds, setGrounds] = useState([]);
  const [selectedGroundIndex, setSelectedGroundIndex] = useState(0);
  const [selectedCourt, setSelectedCourt] = useState('Court 1');
  const [availableCourts, setAvailableCourts] = useState(['Court 1']);
  const [slotMap, setSlotMap] = useState({}); // { [h]: { status, price, slotId, rawSlot } }
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  // 1. Fetch initial grounds
  useEffect(() => {
    if (currentUser) {
      const ownerId = currentUser._id || currentUser.id || currentUser.userId;
      fetchMyGrounds(ownerId).then(g => {
        setGrounds(g);
        if (g.length > 0) {
          const cCount = parseInt(g[0].court_count || 1, 10) || 1;
          const courts = Array.from({ length: cCount }, (_, i) => `Court ${i + 1}`);
          setAvailableCourts(courts);
          setSelectedCourt(courts[0]);
        }
        setLoading(false);
      }).catch(() => setLoading(false));
    }
  }, [currentUser]);

  const currentGround = grounds[selectedGroundIndex];
  const groundId = currentGround ? (currentGround.ground_id || currentGround._id || currentGround.id) : null;
  const dateStr = getDateForDay(selectedDay);

  // 2. Fetch slots from backend for current ground, date, and court
  const loadSlots = useCallback(async () => {
    if (!groundId) return;
    try {
      const res = await fetchSlotsApi({
        groundId,
        date: dateStr,
        courtId: selectedCourt,
      });

      const fetchedSlots = res.slots || res.data || [];
      const fetchedCourts = res.courts || availableCourts;
      if (fetchedCourts.length > 0) setAvailableCourts(fetchedCourts);

      const basePrice = currentGround?.price_per_hour || 500;
      const newMap = {};

      // Initialize all default operational hours as Available
      hours.forEach(h => {
        newMap[h] = {
          status: 'available',
          price: basePrice,
          slotId: null,
          rawSlot: null,
        };
      });

      // Overlay real DB slots
      fetchedSlots.forEach(s => {
        const timeMatch = (s.start_time || s.time || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hr = parseInt(timeMatch[1], 10);
          if (timeMatch[3].toUpperCase() === 'PM' && hr < 12) hr += 12;
          if (timeMatch[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
          const hrStr = hr.toString().padStart(2, '0') + ':00';

          if (hours.includes(hrStr)) {
            const rawStatus = (s.status || (s.is_booked ? 'Booked' : s.is_blocked ? 'Blocked' : 'Available')).toLowerCase();
            newMap[hrStr] = {
              status: rawStatus,
              price: s.price || basePrice,
              slotId: s.slot_id || s._id,
              rawSlot: s,
            };
          }
        }
      });

      setSlotMap(newMap);
    } catch (e) {
      console.warn('Error loading dynamic slots:', e);
    }
  }, [groundId, dateStr, selectedCourt, currentGround]);

  useEffect(() => {
    if (groundId) {
      loadSlots();
    }
  }, [groundId, dateStr, selectedCourt, loadSlots]);

  // 3. Toggle slot status (Available <-> Blocked)
  const toggleSlot = async (h) => {
    const slot = slotMap[h];
    if (!slot || slot.status === 'booked') return; // Cannot alter booked slots

    const nextStatus = slot.status === 'available' ? 'blocked' : 'available';
    const serverStatus = nextStatus === 'available' ? 'Available' : 'Blocked';

    // Optimistic UI update
    setSlotMap(prev => ({
      ...prev,
      [h]: { ...prev[h], status: nextStatus },
    }));

    try {
      if (slot.slotId) {
        // Update existing slot in DB
        await updateSlotApi(slot.slotId, { status: serverStatus });
      } else {
        // Create slot in DB
        const { startTime, endTime } = hourToTimeRange(h);
        const createRes = await createSlotApi({
          ground_id: groundId,
          court_id: selectedCourt,
          date: dateStr,
          start_time: startTime,
          end_time: endTime,
          price: slot.price,
          status: serverStatus,
        });
        const created = createRes.slot || createRes.data;
        if (created) {
          setSlotMap(prev => ({
            ...prev,
            [h]: { ...prev[h], slotId: created._id || created.slot_id },
          }));
        }
      }
    } catch (err) {
      console.error('Failed to toggle slot:', err);
      // Revert on error
      loadSlots();
    }
  };

  // 4. Auto-Generate 7 Days Schedule
  const handleAutoGenerate = async () => {
    if (!groundId) return;
    setActionLoading(true);
    try {
      await generateSlotsApi({
        groundId,
        days: 7,
        courts: availableCourts,
        pricePerHour: currentGround?.price_per_hour || 500,
      });
      await loadSlots();
    } catch (err) {
      console.error('Failed to generate slots:', err);
    } finally {
      setActionLoading(false);
    }
  };

  // 5. AI Pricing Optimizer
  const handleAI = async () => {
    if (!groundId) return;
    setAiBusy(true);
    try {
      const basePrice = currentGround?.price_per_hour || 500;
      const peakPrice = Math.round(basePrice * 1.3);
      const offPeakPrice = Math.round(basePrice * 0.85);

      const updated = { ...slotMap };
      const updates = [];

      hours.forEach(h => {
        const slot = updated[h];
        if (slot && slot.status !== 'booked') {
          let newPrice = basePrice;
          if (['17:00', '18:00', '19:00', '20:00', '21:00'].includes(h)) {
            newPrice = peakPrice;
          } else if (['06:00', '07:00'].includes(h)) {
            newPrice = offPeakPrice;
          }

          updated[h] = { ...slot, price: newPrice };

          if (slot.slotId) {
            updates.push(updateSlotApi(slot.slotId, { price: newPrice }));
          } else {
            const { startTime, endTime } = hourToTimeRange(h);
            updates.push(
              createSlotApi({
                ground_id: groundId,
                court_id: selectedCourt,
                date: dateStr,
                start_time: startTime,
                end_time: endTime,
                price: newPrice,
                status: slot.status === 'blocked' ? 'Blocked' : 'Available',
              })
            );
          }
        }
      });

      setSlotMap(updated);
      await Promise.allSettled(updates);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 4000);
    } catch (err) {
      console.error('AI optimizer failed:', err);
    } finally {
      setAiBusy(false);
    }
  };

  if (loading) return <div style={{ padding: '2rem', color: '#10b981' }}>Loading venue schedule...</div>;
  if (!currentGround) return <div style={{ padding: '2rem', color: '#10b981' }}>No registered facilities found for your account.</div>;

  const totalSlots = hours.length;
  const booked = hours.filter(h => slotMap[h]?.status === 'booked').length;
  const available = hours.filter(h => slotMap[h]?.status === 'available').length;
  const blocked = totalSlots - booked - available;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Slot & Pricing Manager</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>
            Live dynamic scheduling for <strong>{currentGround.title}</strong> ({dateStr})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button
            className="btn btn-secondary"
            onClick={handleAutoGenerate}
            disabled={actionLoading}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#e8f5f1', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
            <RefreshCw size={14} className={actionLoading ? 'spin' : ''} />
            {actionLoading ? 'Generating...' : 'Auto-Gen 7 Days'}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleAI}
            disabled={aiBusy}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1.1rem', background: 'var(--green-gradient)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>
            <Zap size={16} />
            {aiBusy ? 'AI Optimizing...' : aiDone ? '✓ AI Applied!' : 'AI Pricing Optimizer'}
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { l: 'Total Slots', v: totalSlots, color: '#e8f5f1' },
          { l: 'Booked', v: booked, color: '#ef4444' },
          { l: 'Available', v: available, color: '#10b981' },
          { l: 'Blocked', v: blocked, color: '#7fb3a0' },
        ].map(s => (
          <div key={s.l} className="card" style={{ textAlign: 'center', padding: '1rem', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '0.8rem', color: '#7fb3a0', marginTop: '0.25rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Day Selector & Court Selector */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {days.map(d => {
            const isSelected = selectedDay === d;
            return (
              <button
                key={d}
                onClick={() => setSelectedDay(d)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid',
                  background: isSelected ? 'var(--green-gradient)' : 'rgba(255,255,255,0.04)',
                  borderColor: isSelected ? '#10b981' : 'var(--border-color)',
                  color: isSelected ? '#fff' : '#7fb3a0',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
                }}>
                {d}
              </button>
            );
          })}
        </div>

        {availableCourts.length > 1 && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <Layers size={14} color="#7fb3a0" />
            {availableCourts.map(c => {
              const isSelected = selectedCourt === c;
              return (
                <button
                  key={c}
                  onClick={() => setSelectedCourt(c)}
                  style={{
                    padding: '0.4rem 0.8rem',
                    borderRadius: '6px',
                    border: '1px solid',
                    background: isSelected ? '#10b981' : 'transparent',
                    borderColor: isSelected ? '#10b981' : 'var(--border-color)',
                    color: isSelected ? '#fff' : '#7fb3a0',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}>
                  {c}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* AI Notice */}
      {aiDone && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Zap size={16} color="#10b981" />
          <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>
            AI Dynamic Pricing Applied! Peak evening slots optimized to ₹{Math.round((currentGround?.price_per_hour || 500) * 1.3)}. Early morning slots discounted to ₹{Math.round((currentGround?.price_per_hour || 500) * 0.85)}.
          </span>
        </div>
      )}

      {/* Slot Grid */}
      <div className="card" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '14px', padding: '1.25rem' }}>
        <div className="card-header" style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e8f5f1', fontWeight: 700, fontSize: '1rem' }}>
            <Clock size={16} color="#10b981" /> {selectedDay} Slots — {currentGround.title} ({selectedCourt})
          </span>
          <div style={{ display: 'flex', gap: '0.85rem' }}>
            {[
              { l: 'Available', c: '#10b981' },
              { l: 'Booked', c: '#ef4444' },
              { l: 'Blocked', c: '#7fb3a0' }
            ].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.c }} />
                <span style={{ fontSize: '0.75rem', color: '#7fb3a0' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(125px, 1fr))', gap: '0.75rem' }}>
          {hours.map(h => {
            const slot = slotMap[h] || { status: 'available', price: currentGround?.price_per_hour || 500 };
            const c = slotColors[slot.status] || slotColors.available;
            const isBooked = slot.status === 'booked';

            return (
              <div
                key={h}
                onClick={() => toggleSlot(h)}
                title={isBooked ? 'Player has confirmed booking for this slot (Locked)' : `Click to toggle ${slot.status === 'available' ? 'Blocked' : 'Available'}`}
                style={{
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: '10px',
                  padding: '0.85rem 0.6rem',
                  textAlign: 'center',
                  cursor: isBooked ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease',
                  userSelect: 'none',
                }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e8f5f1' }}>{h}</div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: c.text,
                    marginTop: '0.25rem',
                    textTransform: 'capitalize',
                  }}>
                  {slot.status}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7fb3a0', marginTop: '0.2rem', fontWeight: 600 }}>
                  ₹{slot.price}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tip footer */}
      <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', fontSize: '0.8rem', color: '#7fb3a0' }}>
        💡 <strong style={{ color: '#10b981' }}>Pro tip:</strong> Click any <em>Available</em> or <em>Blocked</em> slot to toggle. Booked slots are locked and reserved by players. Use <strong>Auto-Gen 7 Days</strong> to publish standard slots across all dates.
      </div>
    </div>
  );
}
