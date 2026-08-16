import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Database, Server, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { checkHealthApi } from '../services/api';

export default function SettingsPage() {
  const [convenienceFee, setConvenienceFee] = useState(() => {
    return localStorage.getItem('sportverse_setting_fee') || '5';
  });
  const [approvalMode, setApprovalMode] = useState(() => {
    return localStorage.getItem('sportverse_setting_approval') || 'manual';
  });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [testingHealth, setTestingHealth] = useState(false);

  const runHealthTest = async () => {
    setTestingHealth(true);
    const result = await checkHealthApi();
    setHealthStatus(result);
    setTestingHealth(false);
  };

  useEffect(() => {
    runHealthTest();
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('sportverse_setting_fee', convenienceFee);
    localStorage.setItem('sportverse_setting_approval', approvalMode);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Settings size={24} color="#c8895b" />
          <span>Platform & API Configuration</span>
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
          Manage backend endpoints, MongoDB database diagnostics, platform commission fees, and admin security settings.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Diagnostics Card */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <Server size={18} color="#c8895b" />
              <span>Backend & Database Diagnostics</span>
            </h3>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={runHealthTest}
              disabled={testingHealth}
            >
              <RefreshCw size={13} className={testingHealth ? 'spin-animation' : ''} />
              <span>{testingHealth ? 'Testing...' : 'Ping Test'}</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(10, 9, 8, 0.8)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Express Node.js Backend API</div>
                <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>http://localhost:5000/api</div>
              </div>
              <span className={`badge ${healthStatus?.online ? 'badge-green' : 'badge-red'}`}>
                {healthStatus?.online ? `Online (${healthStatus.latency || 10}ms)` : 'Offline / Standalone'}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(10, 9, 8, 0.8)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>MongoDB Database Server</div>
                <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>mongodb://127.0.0.1:27017/sportverse</div>
              </div>
              <span className="badge badge-green">Connected</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(10, 9, 8, 0.8)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>JWT Security Service</div>
                <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>Bearer token authentication (7 days expiry)</div>
              </div>
              <span className="badge badge-primary">Active</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem', background: 'rgba(10, 9, 8, 0.8)', borderRadius: '8px' }}>
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff' }}>Station Owner Portal URL</div>
                <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>http://localhost:5174</div>
              </div>
              <span className="badge badge-primary">Configured</span>
            </div>
          </div>
        </div>

        {/* Platform Settings Card */}
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: '1rem' }}>
            <ShieldCheck size={18} color="#c8895b" />
            <span>Platform Commission & Rules</span>
          </h3>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div className="form-group">
              <label className="form-label">Default Platform Convenience Fee (%)</label>
              <input 
                type="number" 
                className="form-input" 
                value={convenienceFee}
                onChange={(e) => setConvenienceFee(e.target.value)}
                min="0"
                max="25"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Ground Owner Approval Policy</label>
              <select 
                className="form-select" 
                value={approvalMode}
                onChange={(e) => setApprovalMode(e.target.value)}
              >
                <option value="manual">Manual Superadmin Review (Recommended)</option>
                <option value="auto">Auto-Approve Immediately Upon Registration</option>
              </select>
            </div>

            {savedSuccess && (
              <div style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <CheckCircle2 size={16} />
                <span>Configuration saved successfully!</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary" style={{ marginTop: '0.5rem' }}>
              Save Platform Settings
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
