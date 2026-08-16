import React, { useEffect, useState } from 'react';
import { MapPin, Star, Users, Plus, Edit3, Trash2, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { fetchMyGrounds } from '../services/api';

export default function CourtsPage() {
  const [grounds, setGrounds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', location: '', sport: 'Football', pricePerHour: '', capacity: '' });

  useEffect(() => {
    fetchMyGrounds().then(d => { setGrounds(d); setLoading(false); });
  }, []);

  const handleToggle = (id) => {
    setGrounds(grounds.map(g => g.id === id ? { ...g, status: g.status === 'Active' ? 'Inactive' : 'Active' } : g));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newGround = { ...form, id: Date.now(), rating: 0, occupancyPercent: 0, totalSlots: 8, sports: [form.sport], pricePerHour: Number(form.pricePerHour), status: 'Active', image: 'https://images.unsplash.com/photo-1601985705806-5b9a71f6004f?auto=format&fit=crop&w=600&q=80' };
    setGrounds([...grounds, newGround]);
    setShowModal(false);
    setForm({ title: '', location: '', sport: 'Football', pricePerHour: '', capacity: '' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>My Courts & Venues</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Manage your registered sports facilities</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add New Court
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7fb3a0' }}>Loading your courts...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '1.25rem' }}>
          {grounds.map((g) => (
            <div key={g.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Court image */}
              <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                <img src={g.image} alt={g.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(13,24,24,0.95))' }} />
                <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
                  <span className={`badge ${g.status === 'Active' ? 'badge-green' : 'badge-red'}`}>
                    {g.status === 'Active' ? <CheckCircle2 size={11} /> : <XCircle size={11} />} {g.status}
                  </span>
                </div>
                <div style={{ position: 'absolute', bottom: '0.75rem', left: '1rem', right: '1rem' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>{g.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.2rem' }}>
                    <MapPin size={12} color="#7fb3a0" />
                    <span style={{ fontSize: '0.78rem', color: '#7fb3a0' }}>{g.location}</span>
                  </div>
                </div>
              </div>

              {/* Court details */}
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.85rem' }}>
                  {(g.sports || []).map(s => (
                    <span key={s} className="badge badge-blue" style={{ fontSize: '0.72rem' }}>{s}</span>
                  ))}
                  <span className="badge badge-gold">₹{g.pricePerHour}/hr</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', marginBottom: '1rem' }}>
                  {[
                    { l: 'Rating', v: `${g.rating} ★`, icon: <Star size={12} color="#f59e0b" /> },
                    { l: 'Slots', v: g.totalSlots, icon: <TrendingUp size={12} color="#3b82f6" /> },
                    { l: 'Occupancy', v: `${g.occupancyPercent}%`, icon: <Users size={12} color="#10b981" /> },
                  ].map((s) => (
                    <div key={s.l} style={{ background: 'rgba(6,13,13,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem', fontSize: '0.7rem', color: '#7fb3a0', marginBottom: '0.2rem' }}>{s.icon} {s.l}</div>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#e8f5f1' }}>{s.v}</div>
                    </div>
                  ))}
                </div>

                {/* Occupancy bar */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#7fb3a0', marginBottom: '0.35rem' }}>
                    <span>Occupancy Rate</span><span style={{ fontWeight: 700, color: '#10b981' }}>{g.occupancyPercent}%</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${g.occupancyPercent}%` }} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => handleToggle(g.id)}>
                    {g.status === 'Active' ? <><XCircle size={13} /> Deactivate</> : <><CheckCircle2 size={13} /> Activate</>}
                  </button>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}>
                    <Edit3 size={13} /> Edit Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Court Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#e8f5f1', marginBottom: '1.25rem' }}>
              ➕ Register New Court
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Court / Venue Name</label>
                <input className="form-input" required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g., Main Football Turf A" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" required value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g., Sector 5, Kochi" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">Primary Sport</label>
                  <select className="form-select" value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
                    <option>Football</option><option>Cricket</option><option>Badminton</option><option>Basketball</option><option>Volleyball</option><option>Tennis</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price per Hour (₹)</label>
                  <input className="form-input" type="number" required value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })} placeholder="1200" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Register Court</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
