import React, { useState, useEffect } from 'react';
import { Search, Bell, QrCode, ShieldCheck, RefreshCw, X, UserCheck, CalendarCheck, CheckCircle2 } from 'lucide-react';
import { checkHealthApi } from '../services/api';

export default function Header({ 
  onOpenQRScan, 
  searchTerm, 
  setSearchTerm, 
  currentUser,
  onRefresh, 
  refreshing,
  pendingOwnersCount = 0,
  pendingBookingsCount = 0,
  setActiveTab
}) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState({ online: true, latency: null });

  useEffect(() => {
    let isMounted = true;
    checkHealthApi().then((res) => {
      if (isMounted) setHealthStatus(res);
    });
    const interval = setInterval(() => {
      checkHealthApi().then((res) => {
        if (isMounted) setHealthStatus(res);
      });
    }, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const totalNotifs = pendingOwnersCount + pendingBookingsCount;

  return (
    <header style={styles.header}>
      {/* Search Input */}
      <div style={styles.searchContainer}>
        <Search size={17} color="#a39c93" />
        <input
          type="text"
          placeholder="Global search venue, user, booking ID, sport, or gear..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            style={{ background: 'transparent', border: 'none', color: '#a39c93', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Action Controls */}
      <div style={styles.actionGroup}>
        {/* Refresh button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={refreshing}
          title="Refresh Data from MongoDB"
          style={{ gap: '0.35rem' }}
        >
          <RefreshCw size={14} className={refreshing ? 'spin-animation' : ''} />
          <span>{refreshing ? 'Syncing...' : 'Sync DB'}</span>
        </button>

        {/* Quick QR Check-in */}
        <button
          className="btn btn-secondary"
          style={{ fontSize: '0.8rem', gap: '0.4rem', border: '1px solid rgba(200, 137, 91, 0.4)', color: '#c8895b' }}
          onClick={onOpenQRScan}
        >
          <QrCode size={16} />
          <span>Quick QR Check-In</span>
        </button>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <button 
            style={styles.iconBtn} 
            title="System Notifications"
            onClick={() => setIsNotifOpen(!isNotifOpen)}
          >
            <Bell size={18} color="#a39c93" />
            {totalNotifs > 0 && (
              <span style={styles.notifBadge}>{totalNotifs}</span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {isNotifOpen && (
            <div style={styles.notifDropdown}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '0.6rem', borderBottom: '1px solid var(--border-color)', marginBottom: '0.6rem' }}>
                <span style={{ fontSize: '0.825rem', fontWeight: 700, color: '#ffffff' }}>Pending Action Alerts</span>
                <span style={{ fontSize: '0.7rem', color: '#c8895b', fontWeight: 600 }}>{totalNotifs} Actionable</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {pendingOwnersCount > 0 && (
                  <div
                    onClick={() => {
                      setActiveTab('users');
                      setIsNotifOpen(false);
                    }}
                    style={styles.notifItem}
                  >
                    <div style={{ ...styles.notifIcon, background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                      <UserCheck size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{pendingOwnersCount} Ground Owner Registrations</div>
                      <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Requires admin review & approval</div>
                    </div>
                  </div>
                )}

                {pendingBookingsCount > 0 && (
                  <div
                    onClick={() => {
                      setActiveTab('bookings');
                      setIsNotifOpen(false);
                    }}
                    style={styles.notifItem}
                  >
                    <div style={{ ...styles.notifIcon, background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6' }}>
                      <CalendarCheck size={16} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#ffffff' }}>{pendingBookingsCount} Pending Bookings</div>
                      <div style={{ fontSize: '0.725rem', color: '#a39c93' }}>Awaiting slot confirmation</div>
                    </div>
                  </div>
                )}

                {totalNotifs === 0 && (
                  <div style={{ padding: '1rem', textAlign: 'center', color: '#a39c93', fontSize: '0.8rem' }}>
                    <CheckCircle2 size={24} color="#10b981" style={{ margin: '0 auto 0.4rem auto' }} />
                    <div>All registrations and bookings are up to date!</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Badge & Backend Status */}
        <div style={styles.adminStatusTag}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: healthStatus.online ? '#10b981' : '#ef4444',
            boxShadow: healthStatus.online ? '0 0 8px #10b981' : '0 0 8px #ef4444',
          }}></div>
          <span style={{ fontWeight: 700 }}>{currentUser?.role || 'Superadmin'}</span>
          {healthStatus.latency && (
            <span style={{ fontSize: '0.675rem', opacity: 0.8 }}>({healthStatus.latency}ms)</span>
          )}
        </div>
      </div>
    </header>
  );
}

const styles = {
  header: {
    height: '64px',
    backgroundColor: 'var(--bg-header)',
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
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    background: 'rgba(10, 9, 8, 0.7)',
    border: '1px solid var(--border-color)',
    borderRadius: '20px',
    padding: '0.45rem 0.9rem',
    width: '420px',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    color: '#ffffff',
    fontSize: '0.85rem',
    width: '100%',
  },
  actionGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  iconBtn: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.05)',
    border: '1px solid var(--border-color)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 0.2s ease',
  },
  notifBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    minWidth: '18px',
    height: '18px',
    borderRadius: '9px',
    background: '#ef4444',
    color: '#ffffff',
    fontSize: '0.65rem',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 4px',
    border: '2px solid #0f0d0b',
  },
  notifDropdown: {
    position: 'absolute',
    top: '46px',
    right: 0,
    width: '300px',
    background: '#181614',
    border: '1px solid var(--border-highlight)',
    borderRadius: '12px',
    padding: '0.85rem',
    boxShadow: '0 15px 35px rgba(0, 0, 0, 0.5)',
    zIndex: 50,
  },
  notifItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    padding: '0.6rem',
    borderRadius: '8px',
    background: 'rgba(255, 255, 255, 0.03)',
    cursor: 'pointer',
    transition: 'background 0.15s ease',
  },
  notifIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminStatusTag: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    color: '#10b981',
    padding: '0.35rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.75rem',
  },
};
