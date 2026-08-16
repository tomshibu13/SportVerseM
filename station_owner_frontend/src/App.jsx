import React, { useState, useEffect } from 'react';
import './index.css';
import LoginPage     from './components/LoginPage';
import Sidebar       from './components/Sidebar';
import Header        from './components/Header';
import OverviewPage  from './pages/OverviewPage';
import CourtsPage    from './pages/CourtsPage';
import SlotsPage     from './pages/SlotsPage';
import BookingsPage  from './pages/BookingsPage';
import CheckInPage   from './pages/CheckInPage';
import ProShopPage   from './pages/ProShopPage';
import RevenuePage   from './pages/RevenuePage';
import SettingsPage  from './pages/SettingsPage';

const pageComponents = {
  overview:  OverviewPage,
  courts:    CourtsPage,
  slots:     SlotsPage,
  bookings:  BookingsPage,
  checkin:   CheckInPage,
  proshop:   ProShopPage,
  revenue:   RevenuePage,
  settings:  SettingsPage,
};

const pageTitles = {
  overview:  'Station Overview',
  courts:    'My Courts & Venues',
  slots:     'Slot & Pricing Manager',
  bookings:  'Player Reservations',
  checkin:   'QR Check-In Scanner',
  proshop:   'Pro-Shop Inventory',
  revenue:   'Revenue & Analytics',
  settings:  'Station Settings',
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);

  // Persist session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sv_station_user');
    const token = localStorage.getItem('sv_station_token');
    if (saved && token) {
      try { setCurrentUser(JSON.parse(saved)); } catch (_) {}
    }
  }, []);

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('sv_station_token', token);
    localStorage.setItem('sv_station_user', JSON.stringify(user));
    setCurrentUser(user);
    setActiveTab('overview');
  };

  const handleLogout = () => {
    localStorage.removeItem('sv_station_token');
    localStorage.removeItem('sv_station_user');
    setCurrentUser(null);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1000);
  };

  const handleOpenQRScan = () => setActiveTab('checkin');

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const PageComponent = pageComponents[activeTab] || OverviewPage;

  return (
    <div className="app-layout">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        currentUser={currentUser}
      />
      <div className="main-content">
        <Header
          onOpenQRScan={handleOpenQRScan}
          onRefresh={handleRefresh}
          loading={loading}
        />
        <div className="page-container">
          {/* Breadcrumb */}
          <div style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4a7a6a' }}>SportVerse</span>
            <span style={{ color: '#4a7a6a' }}>›</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>{pageTitles[activeTab]}</span>
          </div>
          <PageComponent currentUser={currentUser} />
        </div>
      </div>
    </div>
  );
}
