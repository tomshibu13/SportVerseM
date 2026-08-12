import React, { useState } from 'react';
import { Sparkles, Shield, Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { loginAdminApi } from '../services/api';

export default function LoginPage({ onLoginSuccess }) {
  const [email, setEmail] = useState('tomshibu66@gmail.com');
  const [password, setPassword] = useState('Admin@123');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!email || !password) {
      setErrorMsg('Please enter email and password');
      return;
    }

    setLoading(true);
    const res = await loginAdminApi(email, password);
    setLoading(false);

    if (res.success && res.user) {
      onLoginSuccess(res.user, res.token);
    } else {
      setErrorMsg(res.message || 'Invalid administrator credentials');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.loginCard} className="animate-fade-in">
        {/* Brand Header */}
        <div style={styles.brandRow}>
          <div style={styles.iconBox}>
            <Sparkles size={24} color="#c8895b" />
          </div>
          <div>
            <h2 style={styles.brandName}>SportVerse AI</h2>
            <span style={styles.badgeText}>Superadmin Portal</span>
          </div>
        </div>

        <h3 style={styles.title}>Administrator Sign In</h3>
        <p style={styles.subtitle}>
          Enter your database credentials to access the Superadmin Control Center
        </p>

        {errorMsg && (
          <div style={styles.errorAlert}>
            <AlertCircle size={16} color="#ef4444" />
            <span style={{ fontSize: '0.825rem', color: '#f87171' }}>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="#a39c93" style={styles.inputIcon} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sportverse.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#a39c93" style={styles.inputIcon} />
              <input
                type="password"
                className="input-field"
                style={{ paddingLeft: '2.4rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '1rem', padding: '0.8rem' }}
          >
            {loading ? 'Authenticating...' : 'Log In to Superadmin Site'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div style={styles.footerNote}>
          <Shield size={14} color="#c8895b" />
          <span>Secured with JWT Role Validation & MongoDB Encryption</span>
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
    backgroundColor: 'var(--bg-dark)',
    padding: '1.5rem',
    background: 'radial-gradient(circle at 50% 30%, rgba(200, 137, 91, 0.15) 0%, rgba(11, 11, 11, 1) 70%)',
  },
  loginCard: {
    width: '100%',
    maxWidth: '440px',
    padding: '2.25rem',
    borderRadius: 'var(--radius-lg)',
    backgroundColor: 'var(--bg-card)',
    border: '1px solid var(--border-light)',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)',
  },
  brandRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '12px',
    background: 'rgba(200, 137, 91, 0.18)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: '1.25rem',
    fontWeight: 800,
    color: '#ffffff',
  },
  badgeText: {
    fontSize: '0.725rem',
    color: '#e5ba93',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: 800,
    marginBottom: '0.35rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '1.5rem',
    lineHeight: 1.4,
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  errorAlert: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    marginBottom: '1.25rem',
  },
  footerNote: {
    marginTop: '1.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    fontSize: '0.725rem',
    color: 'var(--text-dim)',
    textAlign: 'center',
  }
};
