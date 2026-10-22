import React, { useState, useEffect } from 'react';
import { Settings, Bell, Lock, Globe, Clock, User, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { fetchMyGrounds, updateGroundApi, updateProfileApi } from '../services/api';

export default function SettingsPage({ currentUser, grounds = [], onGroundsUpdated, onUserUpdated }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [currentGround, setCurrentGround] = useState(grounds[0] || null);

  const [form, setForm] = useState({
    stationName: '',
    address: '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    openTime: '06:00',
    closeTime: '22:00',
    notifyBookings: true,
    notifyPayments: true,
    notifyLowStock: true,
    currency: 'INR',
    language: 'English',
    timezone: 'Asia/Kolkata',
  });
  const [pw, setPw] = useState({ current: '', new: '', confirm: '' });

  // Sync initial state from currentGround and currentUser
  useEffect(() => {
    let savedPrefs = {};
    try {
      const stored = localStorage.getItem('sv_station_settings');
      if (stored) savedPrefs = JSON.parse(stored);
    } catch (_) {}

    const targetGround = grounds.length > 0 ? grounds[0] : null;
    if (targetGround) {
      setCurrentGround(targetGround);
    }

    setForm(prev => ({
      ...prev,
      stationName: targetGround?.title || prev.stationName,
      address: targetGround?.address || targetGround?.location || prev.address,
      phone: targetGround?.phone || currentUser?.phone || prev.phone,
      email: currentUser?.email || prev.email,
      openTime: targetGround?.opening_time || prev.openTime,
      closeTime: targetGround?.closing_time || prev.closeTime,
      ...savedPrefs,
    }));
  }, [grounds, currentUser]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      // 1. Password validation if updating password
      if (pw.new) {
        if (pw.new.length < 6) {
          throw new Error('New password must be at least 6 characters long.');
        }
        if (pw.new !== pw.confirm) {
          throw new Error('New password and confirm password do not match.');
        }
      }

      // 2. Update Ground if ground exists
      const targetGround = currentGround || (grounds.length > 0 ? grounds[0] : null);
      if (targetGround) {
        const groundId = targetGround._id || targetGround.ground_id || targetGround.id;
        await updateGroundApi(groundId, {
          title: form.stationName,
          address: form.address,
          location: form.address,
          phone: form.phone,
          opening_time: form.openTime,
          closing_time: form.closeTime,
        });
      }

      // 3. Update User Profile & Password
      const profileData = {
        phone: form.phone,
        ...(pw.new ? { currentPassword: pw.current, newPassword: pw.new } : {})
      };
      const profileRes = await updateProfileApi(profileData);

      if (profileRes && profileRes.user) {
        localStorage.setItem('sv_station_user', JSON.stringify({ ...currentUser, ...profileRes.user }));
        if (onUserUpdated) onUserUpdated({ ...currentUser, ...profileRes.user });
      }

      // 4. Save local preferences
      const prefsToStore = {
        notifyBookings: form.notifyBookings,
        notifyPayments: form.notifyPayments,
        notifyLowStock: form.notifyLowStock,
        currency: form.currency,
        language: form.language,
        timezone: form.timezone,
      };
      localStorage.setItem('sv_station_settings', JSON.stringify(prefsToStore));

      // 5. Trigger ground refresh in App
      if (onGroundsUpdated) {
        await onGroundsUpdated();
      }

      setSaved(true);
      setPw({ current: '', new: '', confirm: '' });
      setTimeout(() => setSaved(false), 3500);
    } catch (err) {
      console.error('Save settings error:', err);
      setError(err.message || 'Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '900px' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Station Settings</h2>
        <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Configure your station profile, hours, and preferences</p>
      </div>

      {saved && (
        <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <CheckCircle2 size={18} color="#10b981" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#10b981' }}>Station profile & settings saved successfully to MongoDB!</span>
        </div>
      )}

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <AlertCircle size={18} color="#ef4444" />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#ef4444' }}>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Station Profile */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <span className="card-title"><User size={16} color="#10b981" /> Station Profile</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Station / Arena Name</label>
              <input className="form-input" value={form.stationName} onChange={e => setForm({ ...form, stationName: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Contact Phone</label>
              <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="form-label">Station Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1', marginBottom: 0 }}>
              <label className="form-label">Owner Email (Login)</label>
              <input className="form-input" type="email" value={form.email} readOnly style={{ opacity: 0.65, cursor: 'not-allowed' }} />
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <span className="card-title"><Clock size={16} color="#3b82f6" /> Operating Hours</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Opening Time</label>
              <input className="form-input" type="time" value={form.openTime} onChange={e => setForm({ ...form, openTime: e.target.value })} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Closing Time</label>
              <input className="form-input" type="time" value={form.closeTime} onChange={e => setForm({ ...form, closeTime: e.target.value })} />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <span className="card-title"><Bell size={16} color="#a855f7" /> Notifications</span>
          </div>
          {[
            { key: 'notifyBookings', label: 'New booking alerts', desc: 'Get notified when a player books a slot' },
            { key: 'notifyPayments', label: 'Payment received alerts', desc: 'Get notified for every successful payment' },
            { key: 'notifyLowStock', label: 'Low stock alerts', desc: 'Get notified when pro-shop stock falls below 10' },
          ].map(n => (
            <div key={n.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#e8f5f1' }}>{n.label}</div>
                <div style={{ fontSize: '0.78rem', color: '#7fb3a0', marginTop: '0.15rem' }}>{n.desc}</div>
              </div>
              <div
                onClick={() => setForm({ ...form, [n.key]: !form[n.key] })}
                style={{
                  width: '42px', height: '24px', borderRadius: '12px',
                  background: form[n.key] ? 'var(--green-gradient)' : 'rgba(255,255,255,0.1)',
                  border: `1px solid ${form[n.key] ? 'rgba(16,185,129,0.4)' : 'var(--border-color)'}`,
                  cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}>
                <div style={{
                  position: 'absolute', top: '3px',
                  left: form[n.key] ? 'calc(100% - 19px)' : '3px',
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: '#fff', transition: 'left 0.2s ease',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
                }} />
              </div>
            </div>
          ))}
        </div>

        {/* Regional */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <span className="card-title"><Globe size={16} color="#f59e0b" /> Regional Settings</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Currency</label>
              <select className="form-select" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}>
                <option>INR</option><option>USD</option><option>EUR</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Language</label>
              <select className="form-select" value={form.language} onChange={e => setForm({ ...form, language: e.target.value })}>
                <option>English</option><option>Hindi</option><option>Malayalam</option><option>Tamil</option>
              </select>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Timezone</label>
              <select className="form-select" value={form.timezone} onChange={e => setForm({ ...form, timezone: e.target.value })}>
                <option>Asia/Kolkata</option><option>Asia/Dubai</option><option>Europe/London</option>
              </select>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '1.25rem' }}>
            <span className="card-title"><Lock size={16} color="#ef4444" /> Change Password</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Current Password</label>
              <input className="form-input" type="password" value={pw.current} onChange={e => setPw({ ...pw, current: e.target.value })} placeholder="SV-Station#..." />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">New Password</label>
              <input className="form-input" type="password" value={pw.new} onChange={e => setPw({ ...pw, new: e.target.value })} placeholder="Min 8 chars" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Confirm New Password</label>
              <input className="form-input" type="password" value={pw.confirm} onChange={e => setPw({ ...pw, confirm: e.target.value })} placeholder="Re-enter new password" />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', paddingBottom: '1rem' }}>
          <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => {
            const targetGround = currentGround || (grounds.length > 0 ? grounds[0] : null);
            setForm({
              stationName: targetGround?.title || '',
              address: targetGround?.address || targetGround?.location || '',
              phone: targetGround?.phone || currentUser?.phone || '',
              email: currentUser?.email || '',
              openTime: targetGround?.opening_time || '06:00',
              closeTime: targetGround?.closing_time || '22:00',
              notifyBookings: true,
              notifyPayments: true,
              notifyLowStock: true,
              currency: 'INR',
              language: 'English',
              timezone: 'Asia/Kolkata',
            });
            setPw({ current: '', new: '', confirm: '' });
          }}>Reset to Defaults</button>
          <button type="submit" className="btn btn-primary" disabled={saving} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
            {saving ? <><RefreshCw size={16} className="spin" /> Saving Changes...</> : <><CheckCircle2 size={16} /> Save All Settings</>}
          </button>
        </div>
      </form>
    </div>
  );
}
