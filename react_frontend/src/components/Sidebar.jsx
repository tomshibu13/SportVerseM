import React from 'react';
import { 
  LayoutDashboard, 
  MapPin, 
  Clock, 
  CalendarCheck, 
  ShoppingBag, 
  BarChart3, 
  Users,
  Settings, 
  Sparkles,
  LogOut
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, onOpenAddGround }) {
  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'User & Admin DB', icon: Users, badge: 'Live DB' },
    { id: 'grounds', label: 'Venues & Courts', icon: MapPin },
    { id: 'slots', label: 'Slots & Pricing', icon: Clock, badge: 'AI Dynamic' },
    { id: 'bookings', label: 'Bookings & Check-In', icon: CalendarCheck },
    { id: 'shop', label: 'Pro-Shop Inventory', icon: ShoppingBag },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Station Settings', icon: Settings },
  ];

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoIconContainer}>
          <Sparkles size={22} color="#c8895b" />
        </div>
        <div>
          <h2 style={styles.brandTitle}>SportVerse</h2>
          <span style={styles.brandSubtitle}>Station Owner Hub</span>
        </div>
      </div>

      {/* Station Status Banner */}
      <div style={styles.stationBadgeCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={styles.statusDot}></span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e5ba93' }}>Station Live & Active</span>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#a39c93', marginTop: '0.25rem' }}>
          Downtown Hub • 3 Arenas
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.navMenu}>
        <div style={styles.menuGroupHeader}>MAIN MANAGEMENT</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navButton,
                ...(isActive ? styles.navButtonActive : {}),
              }}
            >
              <Icon size={19} color={isActive ? '#c8895b' : '#a39c93'} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && (
                <span style={styles.navItemBadge}>{item.badge}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* CTA Button to open Become Ground Owner Form */}
      <div style={{ padding: '0.5rem 0' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.8rem', gap: '0.4rem', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)' }}
          onClick={onOpenAddGround}
        >
          <Sparkles size={15} />
          <span>Become a Ground Owner</span>
        </button>
      </div>

      {/* Owner Profile Quick Card */}
      <div style={styles.ownerFooter}>
        <img 
          src="https://www.pngall.com/wp-content/uploads/5/Profile.png" 
          alt="Station Owner" 
          style={styles.avatar} 
        />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            Tom Shibu
          </div>
          <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>
            Station ID: #ST-409
          </div>
        </div>
        <button style={styles.logoutBtn} title="Logout" onClick={onLogout}>
          <LogOut size={16} color="#a39c93" />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: 'var(--bg-sidebar)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column',
    padding: '1.25rem 1rem',
    height: '100vh',
    position: 'sticky',
    top: 0,
    zIndex: 20,
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.5rem 0.5rem 1.25rem 0.5rem',
    borderBottom: '1px solid var(--border-color)',
  },
  logoIconContainer: {
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'rgba(200, 137, 91, 0.15)',
    border: '1px solid rgba(200, 137, 91, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontSize: '1.2rem',
    fontWeight: 800,
    color: '#ffffff',
    lineHeight: 1.1,
  },
  brandSubtitle: {
    fontSize: '0.725rem',
    color: 'var(--primary)',
    fontWeight: 600,
    letterSpacing: '0.04em',
  },
  stationBadgeCard: {
    margin: '1rem 0 0.5rem 0',
    padding: '0.75rem',
    borderRadius: '10px',
    background: 'rgba(15, 13, 11, 0.9)',
    border: '1px solid var(--border-color)',
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#c8895b',
    boxShadow: '0 0 8px #c8895b',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    marginTop: '0.75rem',
    flex: 1,
    overflowY: 'auto',
  },
  menuGroupHeader: {
    fontSize: '0.675rem',
    fontWeight: 700,
    color: 'var(--text-dim)',
    letterSpacing: '0.08em',
    padding: '0.5rem 0.75rem 0.25rem 0.75rem',
  },
  navButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.85rem',
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontSize: '0.875rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  navButtonActive: {
    background: 'rgba(200, 137, 91, 0.15)',
    color: '#ffffff',
    fontWeight: 600,
    borderLeft: '3px solid var(--primary)',
  },
  navItemBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    background: 'var(--gold-gradient)',
    color: '#ffffff',
    padding: '0.15rem 0.4rem',
    borderRadius: '6px',
    textTransform: 'uppercase',
  },
  ownerFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.75rem',
    borderRadius: 'var(--radius-sm)',
    background: 'rgba(21, 19, 17, 0.9)',
    border: '1px solid var(--border-color)',
    marginTop: 'auto',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '1px solid var(--primary)',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.25rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }
};
