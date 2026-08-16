import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Lock, Mail, ArrowRight, KeyRound, Eye, EyeOff } from 'lucide-react';
import { loginApi } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('tomshibu666@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await loginApi(email, password);
      if (data.token || data.user) {
        onLoginSuccess(
          data.user || { fullName: 'System Administrator', email, role: 'Admin', approvalStatus: 'Approved' },
          data.token || 'demo-admin-jwt-token'
        );
      } else {
        setError(data.message || 'Invalid admin credentials');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPreset = (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>
            <Sparkles size={28} color="#c8895b" />
          </div>
          <h1 style={styles.title}>SportVerse Admin</h1>
          <p style={styles.subtitle}>Superadmin & Platform Control Console</p>
        </div>

        {error && (
          <div style={styles.errorBox}>
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Quick Credential Presets */}
        <div style={{ marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '0.7rem', color: '#a39c93', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <KeyRound size={12} color="#c8895b" />
            <span>Quick Login Presets</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => handleSelectPreset('tomshibu666@gmail.com', 'Admin@123')}
              style={{
                background: email === 'tomshibu666@gmail.com' ? 'rgba(200, 137, 91, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: email === 'tomshibu666@gmail.com' ? '1px solid #c8895b' : '1px solid var(--border-color)',
                color: email === 'tomshibu666@gmail.com' ? '#ffffff' : '#a39c93',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Primary Superadmin
            </button>
            <button
              type="button"
              onClick={() => handleSelectPreset('admin@sportverse.com', 'admin123')}
              style={{
                background: email === 'admin@sportverse.com' ? 'rgba(200, 137, 91, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                border: email === 'admin@sportverse.com' ? '1px solid #c8895b' : '1px solid var(--border-color)',
                color: email === 'admin@sportverse.com' ? '#ffffff' : '#a39c93',
                padding: '0.4rem 0.6rem',
                borderRadius: '6px',
                fontSize: '0.725rem',
                fontWeight: 600,
                cursor: 'pointer',
                textAlign: 'center',
              }}
            >
              Demo Admin
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={14} color="#a39c93" />
              <span>Admin Email</span>
            </label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tomshibu666@gmail.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={14} color="#a39c93" />
              <span>Password</span>
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ paddingRight: '2.5rem' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: '#a39c93',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.75rem', height: '44px', fontSize: '0.95rem' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                <span>Sign In to Superadmin</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={styles.footerNote}>
          <ShieldCheck size={14} color="#10b981" />
          <span>MongoDB Connected • Express REST API Auth</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 30%, rgba(200, 137, 91, 0.12) 0%, transparent 60%), #0a0908',
    padding: '1.5rem',
  },
  card: {
    width: '100%',
    maxWidth: '430px',
    background: '#141210',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    borderRadius: '16px',
    padding: '2.25rem',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
  },
  header: {
    textAlign: 'center',
    marginBottom: '1.5rem',
  },
  logoBadge: {
    width: '56px',
    height: '56px',
    borderRadius: '16px',
    background: 'rgba(200, 137, 91, 0.15)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 1rem auto',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  subtitle: {
    fontSize: '0.825rem',
    color: '#a39c93',
    marginTop: '0.25rem',
  },
  errorBox: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    color: '#ef4444',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.825rem',
    marginBottom: '1.25rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  footerNote: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    marginTop: '1.75rem',
    paddingTop: '1rem',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
    fontSize: '0.75rem',
    color: '#a39c93',
  },
};
