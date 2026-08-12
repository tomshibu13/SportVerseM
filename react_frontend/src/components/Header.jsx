import React from 'react';
import { Search, Bell, QrCode, Sparkles, Building2 } from 'lucide-react';

export default function Header({ onOpenQRScan, searchTerm, setSearchTerm }) {
  return (
    <header style={styles.header}>
      {/* Search Input */}
      <div style={styles.searchWrapper}>
        <Search size={18} color="#a39c93" style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search grounds, booking IDs, customers..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Right Controls */}
      <div style={styles.rightSection}>
        {/* Venue Switcher */}
        <div style={styles.venueSelectCard}>
          <Building2 size={16} color="#c8895b" />
          <select style={styles.venueSelect}>
            <option value="all">All Stations (3 Grounds)</option>
            <option value="101">Elite Football Arena</option>
            <option value="102">Victory Badminton Court</option>
            <option value="105">Super Strikers Cricket Box</option>
          </select>
        </div>

        {/* AI Dynamic Pricing Pill */}
        <div style={styles.aiStatusPill}>
          <Sparkles size={14} color="#c8895b" />
          <span>AI Dynamic Pricing: <strong>ACTIVE (+15%)</strong></span>
        </div>

        {/* QR Check-In Action Button */}
        <button className="btn btn-primary" onClick={onOpenQRScan} style={{ gap: '0.4rem', fontSize: '0.825rem' }}>
          <QrCode size={16} />
          <span>QR Check-In</span>
        </button>

        {/* Notification Bell */}
        <div style={styles.iconBtn}>
          <Bell size={18} color="#fcfbf8" />
          <span style={styles.notifBadge}>3</span>
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '70px',
    backgroundColor: 'var(--bg-card)',
    borderBottom: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2rem',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    backdropFilter: 'blur(12px)',
  },
  searchWrapper: {
    position: 'relative',
    width: '320px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  searchInput: {
    width: '100%',
    padding: '0.55rem 1rem 0.55rem 2.4rem',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
    color: '#ffffff',
    fontSize: '0.85rem',
    outline: 'none',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  venueSelectCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.75rem',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius-sm)',
  },
  venueSelect: {
    background: 'transparent',
    border: 'none',
    color: '#ffffff',
    fontSize: '0.825rem',
    fontWeight: 600,
    outline: 'none',
    cursor: 'pointer',
  },
  aiStatusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.45rem 0.85rem',
    borderRadius: '9999px',
    background: 'rgba(200, 137, 91, 0.12)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    color: '#e5ba93',
    fontSize: '0.775rem',
  },
  iconBtn: {
    position: 'relative',
    width: '38px',
    height: '38px',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  notifBadge: {
    position: 'absolute',
    top: '-4px',
    right: '-4px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'var(--primary)',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
