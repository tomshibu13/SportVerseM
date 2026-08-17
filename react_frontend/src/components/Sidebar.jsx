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
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ 
  activeTab, 
  setActiveTab, 
  onLogout, 
  onOpenAddGround, 
  currentUser,
  pendingOwnersCount = 0,
  pendingBookingsCount = 0
}) {
  const userName = currentUser?.fullName || currentUser?.name || 'System Admin';
  const roleTitle = currentUser?.role || 'Super Admin';
  const isAdmin = currentUser?.role === 'Admin' || !currentUser?.role;
  const isGroundOwner = currentUser?.role === 'GroundOwner';

  const allNavItems = [
    { id: 'overview', label: isGroundOwner ? 'Station Overview' : 'Overview', icon: LayoutDashboard },
    { 
      id: 'users', 
      label: 'User & Owner DB', 
      icon: Users, 
      badge: pendingOwnersCount > 0 ? `${pendingOwnersCount} Pending` : null, 
      badgeColor: '#f59e0b',
      adminOnly: true 
    },
    { id: 'grounds', label: isGroundOwner ? 'My Venues & Courts' : 'Venues & Courts', icon: MapPin },
    { id: 'slots', label: 'Slots & Dynamic Pricing', icon: Clock, badge: 'AI Surge' },
    { 
      id: 'bookings', 
      label: 'Bookings & Check-In', 
      icon: CalendarCheck, 
      badge: pendingBookingsCount > 0 ? `${pendingBookingsCount} Pending` : null,
      badgeColor: '#3b82f6'
    },
    { id: 'shop', label: 'Pro-Shop Inventory', icon: ShoppingBag },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
    { id: 'settings', label: 'Platform Settings', icon: Settings },
  ];

  const navItems = allNavItems.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.id === 'shop' && isGroundOwner) return false;
    return true;
  });

  return (
    <aside style={styles.sidebar}>
      {/* Brand Header */}
      <div style={styles.brandContainer}>
        <div style={styles.logoIconContainer}>
          <Sparkles size={22} color="#c8895b" />
        </div>
        <div>
          <h2 style={styles.brandTitle}>SportVerse</h2>
          <span style={styles.brandSubtitle}>Admin & Control Portal</span>
        </div>
      </div>

      {/* Admin Status Banner */}
      <div style={styles.stationBadgeCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck size={14} color="#10b981" />
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
            {isAdmin ? 'Superadmin Mode' : 'Station Control'}
          </span>
        </div>
        <div style={{ fontSize: '0.725rem', color: '#a39c93', marginTop: '0.25rem' }}>
          MongoDB Synced • REST API Active
        </div>
      </div>

      {/* Navigation Menu */}
      <nav style={styles.navMenu}>
        <div style={styles.menuGroupHeader}>CONTROL CONSOLE</div>
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
                <span style={{
                  ...styles.navItemBadge,
                  background: item.badgeColor ? item.badgeColor : 'var(--gold-gradient)',
                  color: '#ffffff',
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* CTA Button */}
      <div style={{ padding: '0.5rem 0' }}>
        <button
          className="btn btn-primary"
          style={{ width: '100%', fontSize: '0.8rem', gap: '0.4rem' }}
          onClick={onOpenAddGround}
        >
          <Sparkles size={15} />
          <span>+ Add Ground / Arena</span>
        </button>
      </div>

      {/* Owner Profile Quick Card */}
      <div style={styles.ownerFooter}>
        <div style={styles.avatarCircle}>
          {userName.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: 700, fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#ffffff' }}>
            {userName}
          </div>
          <div style={{ fontSize: '0.725rem', color: '#c8895b', fontWeight: 600 }}>
            {roleTitle}
          </div>
        </div>
        <button 
          style={styles.logoutBtn} 
          title="Sign Out" 
          onClick={onLogout}
        >
          <LogOut size={16} color="#a39c93" />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '265px',
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
    fontWeight: 700,
    borderLeft: '3px solid var(--primary)',
  },
  navItemBadge: {
    fontSize: '0.65rem',
    fontWeight: 700,
    padding: '0.15rem 0.45rem',
    borderRadius: '6px',
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
  avatarCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #c8895b 0%, #a86c43 100%)',
    color: '#ffffff',
    fontWeight: 800,
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    padding: '0.35rem',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.15s ease',
  }
};
