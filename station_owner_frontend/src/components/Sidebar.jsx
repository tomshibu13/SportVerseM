import React from 'react';
import { 
  LayoutDashboard, MapPin, Clock, CalendarCheck,
  ShoppingBag, BarChart3, Settings, Zap, LogOut,
  QrCode, ChevronRight
} from 'lucide-react';

const navItems = [
  { id: 'overview',  label: 'Station Overview', icon: LayoutDashboard },
  { id: 'courts',   label: 'My Courts & Venues', icon: MapPin },
  { id: 'slots',    label: 'Slot & Pricing Manager', icon: Clock, badge: 'AI' },
  { id: 'bookings', label: 'Player Reservations', icon: CalendarCheck },
  { id: 'checkin',  label: 'QR Check-In Scanner', icon: QrCode, badge: 'Live' },
  { id: 'proshop',  label: 'Pro-Shop Inventory', icon: ShoppingBag },
  { id: 'revenue',  label: 'Revenue & Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Station Settings', icon: Settings },
];

export default function Sidebar({ activeTab, setActiveTab, onLogout, currentUser }) {
  const name  = currentUser?.fullName || 'Station Owner';
  const email = currentUser?.email || '';

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.logoBox}>
          <Zap size={22} color="#10b981" fill="rgba(16,185,129,0.2)" />
        </div>
        <div>
          <div style={styles.brandTitle}>SportVerse</div>
          <div style={styles.brandSub}>Station Owner Portal</div>
        </div>
      </div>

      {/* Owner info card */}
      <div style={styles.ownerCard}>
        <div style={styles.ownerAvatar}>{name.charAt(0).toUpperCase()}</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#e8f5f1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {name}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#7fb3a0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {email}
          </div>
          <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '0.1rem 0.45rem', borderRadius: '6px', marginTop: '0.25rem', display: 'inline-block' }}>
            ✓ Approved Owner
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        <div style={styles.navGroupLabel}>STATION CONTROLS</div>
        {navItems.map(({ id, label, icon: Icon, badge }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              style={{ ...styles.navBtn, ...(active ? styles.navBtnActive : {}) }}
            >
              <Icon size={18} color={active ? '#10b981' : '#7fb3a0'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
              {badge && <span style={styles.navBadge}>{badge}</span>}
              {active && <ChevronRight size={14} color="#10b981" />}
            </button>
          );
        })}
      </nav>

      {/* Status Dot */}
      <div style={styles.statusBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div className="pulse-green" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#10b981' }}>Station Live & Active</span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#4a7a6a', marginTop: '0.2rem' }}>Backend API Connected</div>
      </div>

      {/* Logout */}
      <button onClick={onLogout} style={styles.logoutBtn}>
        <LogOut size={16} color="#7fb3a0" />
        <span>Sign Out</span>
      </button>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '268px', background: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex', flexDirection: 'column',
    padding: '1.25rem 1rem',
    height: '100vh', position: 'sticky', top: 0, zIndex: 20,
    gap: '0.5rem',
  },
  brand: {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.5rem 0.5rem 1.25rem 0.5rem',
    borderBottom: '1px solid var(--border-color)',
    marginBottom: '0.5rem',
  },
  logoBox: {
    width: '42px', height: '42px', borderRadius: '12px',
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 0 14px rgba(16,185,129,0.15)',
  },
  brandTitle: { fontSize: '1.2rem', fontWeight: 900, color: '#e8f5f1', lineHeight: 1.1 },
  brandSub: { fontSize: '0.7rem', fontWeight: 700, color: '#10b981', letterSpacing: '0.05em' },
  ownerCard: {
    display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
    padding: '0.85rem', borderRadius: '10px',
    background: 'rgba(16,185,129,0.06)',
    border: '1px solid rgba(16,185,129,0.15)',
    marginBottom: '0.25rem',
  },
  ownerAvatar: {
    width: '40px', height: '40px', borderRadius: '10px',
    background: 'var(--green-gradient)',
    color: '#fff', fontWeight: 800, fontSize: '1rem',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
    boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
  },
  nav: { display: 'flex', flexDirection: 'column', gap: '0.25rem', flex: 1, overflowY: 'auto' },
  navGroupLabel: {
    fontSize: '0.67rem', fontWeight: 700, color: 'var(--text-dim)',
    letterSpacing: '0.1em', padding: '0.5rem 0.75rem 0.3rem',
  },
  navBtn: {
    display: 'flex', alignItems: 'center', gap: '0.7rem',
    padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)',
    border: 'none', background: 'transparent',
    color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500,
    cursor: 'pointer', transition: 'all 0.18s ease', width: '100%',
  },
  navBtnActive: {
    background: 'rgba(16,185,129,0.12)',
    color: '#e8f5f1', fontWeight: 700,
    borderLeft: '3px solid #10b981',
  },
  navBadge: {
    fontSize: '0.62rem', fontWeight: 700,
    background: 'var(--green-gradient)',
    color: '#fff', padding: '0.12rem 0.4rem',
    borderRadius: '6px', textTransform: 'uppercase',
  },
  statusBar: {
    padding: '0.75rem',
    background: 'rgba(6,13,13,0.9)',
    border: '1px solid var(--border-color)',
    borderRadius: '10px',
    marginTop: 'auto',
  },
  logoutBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
    padding: '0.6rem', borderRadius: 'var(--radius-sm)',
    background: 'rgba(239,68,68,0.08)',
    border: '1px solid rgba(239,68,68,0.2)',
    color: '#7fb3a0', fontSize: '0.85rem', fontWeight: 600,
    cursor: 'pointer', transition: 'all 0.18s ease',
    marginTop: '0.5rem',
  },
};
