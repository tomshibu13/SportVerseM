import React, { useState } from 'react';
import { Save, Building, CreditCard } from 'lucide-react';

export default function SettingsPage() {
  const [stationInfo, setStationInfo] = useState({
    stationName: 'Apex Sports Complex & Arena',
    ownerName: 'Alexander Vance',
    email: 'alexander.vance@sportverse.com',
    phone: '+91 98765 43210',
    address: '102 Stadium Way, Downtown Sports Zone',
    bankAccount: '•••• •••• 8842 (HDFC Bank)',
    upiId: 'apexarena@hdfcbank',
    autoPayoutEnabled: true,
    aiSensitivity: 'High (Optimal Revenue)',
    emailNotifications: true,
  });

  const [savedMsg, setSavedMsg] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg(true);
    setTimeout(() => setSavedMsg(false), 2000);
  };

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Station & Owner Settings</h1>
        <p className="page-subtitle">Configure business profile, banking payout destination, and operational preferences</p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '840px' }}>
        {/* Profile Card */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Building size={20} color="#c8895b" />
            <h3>Station Facility Profile</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Station Facility Name</label>
              <input
                type="text"
                className="input-field"
                value={stationInfo.stationName}
                onChange={(e) => setStationInfo({ ...stationInfo, stationName: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Owner Full Name</label>
              <input
                type="text"
                className="input-field"
                value={stationInfo.ownerName}
                onChange={(e) => setStationInfo({ ...stationInfo, ownerName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Contact Email</label>
              <input
                type="email"
                className="input-field"
                value={stationInfo.email}
                onChange={(e) => setStationInfo({ ...stationInfo, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Contact Phone</label>
              <input
                type="text"
                className="input-field"
                value={stationInfo.phone}
                onChange={(e) => setStationInfo({ ...stationInfo, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Facility Address</label>
            <input
              type="text"
              className="input-field"
              value={stationInfo.address}
              onChange={(e) => setStationInfo({ ...stationInfo, address: e.target.value })}
            />
          </div>
        </div>

        {/* Financial & Payout Settings */}
        <div className="glass-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <CreditCard size={20} color="#a76f45" />
            <h3>Banking & Settlement Payouts</h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Linked Bank Account</label>
              <input
                type="text"
                className="input-field"
                value={stationInfo.bankAccount}
                onChange={(e) => setStationInfo({ ...stationInfo, bankAccount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Business UPI ID</label>
              <input
                type="text"
                className="input-field"
                value={stationInfo.upiId}
                onChange={(e) => setStationInfo({ ...stationInfo, upiId: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#ffffff' }}>Automatic Daily Payouts</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Transfer settled booking funds at midnight</div>
            </div>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={stationInfo.autoPayoutEnabled}
                onChange={() => setStationInfo({ ...stationInfo, autoPayoutEnabled: !stationInfo.autoPayoutEnabled })}
              />
              <span className="slider"></span>
            </label>
          </div>
        </div>

        {/* Save Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem 1.75rem' }}>
            <Save size={18} /> Save Settings
          </button>
          {savedMsg && <span style={{ color: '#e5ba93', fontWeight: 600, fontSize: '0.9rem' }}>✓ Settings saved successfully!</span>}
        </div>
      </form>
    </div>
  );
}
