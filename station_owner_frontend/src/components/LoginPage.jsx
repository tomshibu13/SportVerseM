import React, { useState } from 'react';
import { Zap, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import { loginApi } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await loginApi(email, password);
      if (data.token || data.user) {
        onLoginSuccess(data.user, data.token || 'demo-token');
      } else {
        setError(data.message || 'Login failed. Check your credentials.');
      }
    } catch (err) {
      setError(err.message || 'Unable to connect to server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Animated background blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoBadge}>
            <Zap size={28} color="#10b981" fill="rgba(16,185,129,0.25)" />
          </div>
          <div>
            <h1 style={styles.title}>SportVerse</h1>
            <span style={styles.subtitle}>Station Owner Portal</span>
          </div>
        </div>

        <p style={styles.welcomeText}>
          Sign in using the unique credentials provided by your SportVerse System Admin upon registration approval.
        </p>

        {error && (
          <div style={styles.errorBox}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Mail size={13} color="#7fb3a0" /><span>Station Owner Email</span>
            </label>
            <input
              type="email"
              className="form-input"
              placeholder="owner@yourarena.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Lock size={13} color="#7fb3a0" /><span>Station Password (SV-Station#...)</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="SV-Station#XXXXX"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ height: '46px', marginTop: '0.5rem', fontSize: '1rem', letterSpacing: '0.02em' }}
          >
            {loading ? 'Authenticating...' : (
              <><span>Access My Station Portal</span><ArrowRight size={18} /></>
            )}
          </button>
        </form>

        {/* Features reminder */}
        <div style={styles.featureRow}>
          {['Manage Courts', 'Slot Pricing', 'QR Check-In', 'Live Revenue'].map((f) => (
            <div key={f} style={styles.featurePill}>
              <CheckCircle2 size={12} color="#10b981" />
              <span>{f}</span>
            </div>
          ))}
        </div>

        <p style={styles.footerNote}>
          Station Owner Dashboard • SportVerse AI Platform • v2.0
        </p>
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
    background: '#060d0d',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
  },
  blob1: {
    position: 'absolute', top: '-80px', left: '-80px',
    width: '380px', height: '380px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  blob2: {
    position: 'absolute', bottom: '-100px', right: '-100px',
    width: '450px', height: '450px', borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(5,150,105,0.12) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: '100%', maxWidth: '440px',
    background: 'rgba(13, 24, 24, 0.95)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '20px',
    padding: '2.25rem',
    boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(16,185,129,0.1)',
    backdropFilter: 'blur(12px)',
  },
  logoRow: {
    display: 'flex', alignItems: 'center', gap: '0.85rem',
    marginBottom: '1.25rem',
  },
  logoBadge: {
    width: '56px', height: '56px', borderRadius: '16px',
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 20px rgba(16,185,129,0.2)',
  },
  title: {
    fontSize: '1.6rem', fontWeight: 900, color: '#e8f5f1', lineHeight: 1.1,
  },
  subtitle: {
    fontSize: '0.8rem', fontWeight: 700, color: '#10b981',
    letterSpacing: '0.06em', textTransform: 'uppercase',
  },
  welcomeText: {
    fontSize: '0.825rem', color: '#7fb3a0', lineHeight: 1.6,
    marginBottom: '1.25rem',
    padding: '0.75rem', background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.15)', borderRadius: '8px',
  },
  errorBox: {
    background: 'rgba(239,68,68,0.15)',
    border: '1px solid rgba(239,68,68,0.3)',
    color: '#ef4444', padding: '0.75rem', borderRadius: '8px',
    fontSize: '0.825rem', marginBottom: '1rem',
  },
  featureRow: {
    display: 'flex', flexWrap: 'wrap', gap: '0.5rem',
    marginTop: '1.5rem', paddingTop: '1.25rem',
    borderTop: '1px solid rgba(16,185,129,0.12)',
  },
  featurePill: {
    display: 'flex', alignItems: 'center', gap: '0.3rem',
    padding: '0.25rem 0.65rem', borderRadius: '20px',
    background: 'rgba(16,185,129,0.08)',
    border: '1px solid rgba(16,185,129,0.2)',
    fontSize: '0.75rem', fontWeight: 600, color: '#7fb3a0',
  },
  footerNote: {
    marginTop: '1.25rem', textAlign: 'center',
    fontSize: '0.725rem', color: '#4a7a6a',
  },
};
