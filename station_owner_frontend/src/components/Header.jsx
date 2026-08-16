import React from 'react';
import { Search, Bell, QrCode, RefreshCw } from 'lucide-react';

export default function Header({ onOpenQRScan, onRefresh, loading }) {
  return (
    <header style={styles.header}>
      <div style={styles.searchBox}>
        <Search size={16} color="#7fb3a0" />
        <input type="text" placeholder="Search booking ID, player name, or court..." style={styles.searchInput} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          className="btn btn-primary btn-sm"
          style={{ gap: '0.4rem', fontSize: '0.8rem' }}
          onClick={onOpenQRScan}
        >
          <QrCode size={15} />
          <span>QR Check-In</span>
        </button>

        <button
          style={styles.iconBtn}
          onClick={onRefresh}
          title="Refresh data"
          disabled={loading}
        >
          <RefreshCw size={16} color={loading ? '#10b981' : '#7fb3a0'}
            style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}
          />
        </button>

        <button style={styles.iconBtn} title="Notifications">
          <Bell size={17} color="#7fb3a0" />
          <span style={styles.notifDot} />
        </button>
      </div>

      <style>{`@keyframes spin { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }`}</style>
    </header>
  );
}

const styles = {
  header: {
    height: '62px',
    background: 'var(--bg-header)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    position: 'sticky', top: 0, zIndex: 10,
    backdropFilter: 'blur(12px)',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: '0.6rem',
    background: 'rgba(6,13,13,0.8)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px', padding: '0.4rem 0.9rem',
    width: '360px',
  },
  searchInput: {
    background: 'transparent', border: 'none', outline: 'none',
    color: '#e8f5f1', fontSize: '0.85rem', width: '100%',
  },
  iconBtn: {
    width: '36px', height: '36px', borderRadius: '50%',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid var(--border-color)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', position: 'relative',
  },
  notifDot: {
    position: 'absolute', top: '7px', right: '7px',
    width: '7px', height: '7px', borderRadius: '50%', background: '#10b981',
  },
};
