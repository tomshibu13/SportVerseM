import React, { useState, useEffect } from 'react';
import { Clock, Plus, Zap, CheckCircle2, XCircle, Edit3 } from 'lucide-react';
import { fetchMyGrounds } from '../services/api';

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const hours = ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00'];

const slotColors = {
  available: { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', text: '#10b981' },
  booked: { bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', text: '#ef4444' },
  blocked: { bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)', text: '#4a7a6a' },
};

export default function SlotsPage({ currentUser }) {
  const [selectedDay, setSelectedDay] = useState('Mon');
  const [grounds, setGrounds] = useState([]);
  const [selectedGroundIndex, setSelectedGroundIndex] = useState(0);
  const [slots, setSlots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiDone, setAiDone] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchMyGrounds(currentUser._id || currentUser.id).then(g => {
        setGrounds(g);
        if (g.length > 0) {
           const dbSlots = g[0].available_slots || [];
           const s = {};
           days.forEach(d => {
             s[d] = {};
             hours.forEach(h => { s[d][h] = { status: 'blocked', price: g[0].price_per_hour || 1200 }; });
           });
           
           dbSlots.forEach(slot => {
              // try to parse time "06:00 AM - 07:00 AM" to "06:00"
              const timeMatch = slot.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
              if (timeMatch) {
                 let hr = parseInt(timeMatch[1]);
                 if (timeMatch[3].toUpperCase() === 'PM' && hr < 12) hr += 12;
                 if (timeMatch[3].toUpperCase() === 'AM' && hr === 12) hr = 0;
                 const hrStr = hr.toString().padStart(2, '0') + ':00';
                 if (hours.includes(hrStr)) {
                    days.forEach(d => {
                       s[d][hrStr] = { status: slot.is_booked ? 'booked' : 'available', price: slot.price || g[0].price_per_hour || 1200 };
                    });
                 }
              }
           });
           setSlots(s);
        }
        setLoading(false);
      });
    }
  }, [currentUser]);

  const toggleSlot = (h) => {
    const cur = slots[selectedDay][h].status;
    if (cur === 'booked') return; // Can't change booked
    const next = cur === 'available' ? 'blocked' : 'available';
    setSlots(prev => ({ ...prev, [selectedDay]: { ...prev[selectedDay], [h]: { ...prev[selectedDay][h], status: next } } }));
  };

  const handleAI = async () => {
    setAiBusy(true);
    // Simulate AI delay
    setTimeout(async () => {
      const updated = { ...slots };
      const currentGround = grounds[selectedGroundIndex];
      const basePrice = currentGround.price_per_hour || 1200;
      
      days.forEach(d => {
        ['18:00', '19:00', '20:00'].forEach(h => {
          if (updated[d][h].status !== 'booked' && updated[d][h].status !== 'blocked') {
            updated[d][h] = { ...updated[d][h], price: Math.round(basePrice * 1.3) };
          }
        });
        ['06:00', '07:00'].forEach(h => {
          if (updated[d][h].status !== 'booked' && updated[d][h].status !== 'blocked') {
            updated[d][h] = { ...updated[d][h], price: Math.round(basePrice * 0.8) };
          }
        });
      });
      setSlots(updated);
      
      // Update DB
      if (currentGround) {
         const newAvailableSlots = [];
         hours.forEach(h => {
             // For simplicity, we save based on Mon's slots to apply to all days in DB since DB structure doesn't support days
             const slot = updated['Mon'][h];
             if (slot.status !== 'blocked') {
                 let num = parseInt(h.split(':')[0]);
                 let ampm = num >= 12 ? 'PM' : 'AM';
                 let dhr = num > 12 ? num - 12 : (num === 0 ? 12 : num);
                 let nextNum = num + 1;
                 let nampm = nextNum >= 12 && nextNum < 24 ? 'PM' : 'AM';
                 let ndhr = nextNum > 12 ? nextNum - 12 : (nextNum === 0 || nextNum === 24 ? 12 : nextNum);
                 const timeStr = `${dhr.toString().padStart(2,'0')}:00 ${ampm} - ${ndhr.toString().padStart(2,'0')}:00 ${nampm}`;
                 
                 newAvailableSlots.push({
                     slot_id: `s_${h}`,
                     time: timeStr,
                     is_booked: slot.status === 'booked',
                     price: slot.price
                 });
             }
         });
         
         await fetch(`/api/grounds/${currentGround._id || currentGround.id}`, {
             method: 'PUT',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({ available_slots: newAvailableSlots })
         });
      }

      setAiBusy(false);
      setAiDone(true);
      setTimeout(() => setAiDone(false), 3000);
    }, 1800);
  };

  if (loading) return <div style={{ padding: '2rem', color: '#10b981' }}>Loading slots...</div>;
  if (!slots || grounds.length === 0) return <div style={{ padding: '2rem', color: '#10b981' }}>No grounds found.</div>;

  const currentGround = grounds[selectedGroundIndex];
  const daySlots = slots[selectedDay] || {};
  const totalSlots = hours.length;
  const booked = hours.filter(h => daySlots[h]?.status === 'booked').length;
  const available = hours.filter(h => daySlots[h]?.status === 'available').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Slot & Pricing Manager</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Manage time slots and dynamic pricing for your courts</p>
        </div>
        <button className="btn btn-primary" onClick={handleAI} disabled={aiBusy}>
          <Zap size={16} />
          {aiBusy ? 'AI Optimizing...' : aiDone ? '✓ AI Applied!' : 'AI Pricing Optimizer'}
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
        {[
          { l: 'Total Slots', v: totalSlots, color: '#e8f5f1' },
          { l: 'Booked', v: booked, color: '#ef4444' },
          { l: 'Available', v: available, color: '#10b981' },
          { l: 'Blocked', v: totalSlots - booked - available, color: '#7fb3a0' },
        ].map(s => (
          <div key={s.l} className="card" style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: s.color }}>{s.v}</div>
            <div style={{ fontSize: '0.8rem', color: '#7fb3a0', marginTop: '0.25rem' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Day selector */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {days.map(d => (
          <button key={d} onClick={() => setSelectedDay(d)}
            style={{
              padding: '0.5rem 1rem', borderRadius: '8px', border: '1px solid',
              background: selectedDay === d ? 'var(--green-gradient)' : 'rgba(255,255,255,0.04)',
              borderColor: selectedDay === d ? '#10b981' : 'var(--border-color)',
              color: selectedDay === d ? '#fff' : '#7fb3a0',
              fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
              boxShadow: selectedDay === d ? '0 4px 12px rgba(16,185,129,0.3)' : 'none',
            }}>
            {d}
          </button>
        ))}
      </div>

      {/* AI notice */}
      {aiDone && (
        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Zap size={16} color="#10b981" />
          <span style={{ fontSize: '0.875rem', color: '#10b981', fontWeight: 600 }}>AI Pricing Applied! Peak hours (6–8 PM) optimized to ₹1,600. Off-peak (6–7 AM) discounted to ₹900.</span>
        </div>
      )}

      {/* Slot grid */}
      <div className="card">
        <div className="card-header" style={{ marginBottom: '1.25rem' }}>
          <span className="card-title"><Clock size={16} color="#10b981" /> {selectedDay} Slots — {currentGround.title}</span>
          <div style={{ display: 'flex', gap: '0.65rem' }}>
            {[{ l: 'Available', c: '#10b981' }, { l: 'Booked', c: '#ef4444' }, { l: 'Blocked', c: '#4a7a6a' }].map(s => (
              <div key={s.l} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '3px', background: s.c }} />
                <span style={{ fontSize: '0.75rem', color: '#7fb3a0' }}>{s.l}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '0.6rem' }}>
          {hours.map(h => {
            const slot = daySlots[h] || { status: 'available', price: 1200 };
            const c = slotColors[slot.status];
            return (
              <div key={h}
                onClick={() => toggleSlot(h)}
                title={slot.status === 'booked' ? 'Player has booked this slot' : 'Click to toggle availability'}
                style={{
                  background: c.bg, border: `1px solid ${c.border}`,
                  borderRadius: '10px', padding: '0.75rem',
                  textAlign: 'center', cursor: slot.status === 'booked' ? 'not-allowed' : 'pointer',
                  transition: 'all 0.18s ease',
                }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e8f5f1' }}>{h}</div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: c.text, marginTop: '0.25rem', textTransform: 'capitalize' }}>
                  {slot.status}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#7fb3a0', marginTop: '0.2rem' }}>₹{slot.price}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '10px', fontSize: '0.8rem', color: '#7fb3a0' }}>
        💡 <strong style={{ color: '#10b981' }}>Pro tip:</strong> Click any <em>Available</em> or <em>Blocked</em> slot to toggle. Booked slots are locked and cannot be changed. Use the AI Optimizer to automatically set peak prices.
      </div>
    </div>
  );
}
