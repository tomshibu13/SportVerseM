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
import { fetchMyGrounds } from './services/api';

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
  const [loading, setLoading] = useState(true);
  const [grounds, setGrounds] = useState([]);
  const [groundsLoaded, setGroundsLoaded] = useState(false);

  // Persist session in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sv_station_user');
    const token = localStorage.getItem('sv_station_token');
    if (saved && token) {
      try { 
         const user = JSON.parse(saved);
         setCurrentUser(user); 
      } catch (_) {}
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function loadGrounds() {
      if (currentUser && (currentUser._id || currentUser.id)) {
        setLoading(true);
        const g = await fetchMyGrounds(currentUser._id || currentUser.id);
        setGrounds(g);
        setGroundsLoaded(true);
        setLoading(false);
      }
    }
    loadGrounds();
  }, [currentUser]);

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

  if (loading && !groundsLoaded) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#060d0d', color: '#10b981' }}>
        Loading station data...
      </div>
    );
  }

  if (groundsLoaded && grounds.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#060d0d', color: '#e8f5f1' }}>
        <h2 style={{ fontSize: '2rem', color: '#10b981', marginBottom: '1rem' }}>No Ground Registered Yet</h2>
        <p style={{ color: '#7fb3a0' }}>Please register a ground to access the dashboard.</p>
        <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #10b981', color: '#10b981', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>
    );
  }

  if (groundsLoaded && grounds.length > 0 && grounds[0].status === 'Pending') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', justifyContent: 'center', alignItems: 'center', background: '#060d0d', color: '#e8f5f1' }}>
        <h2 style={{ fontSize: '2rem', color: '#f59e0b', marginBottom: '1rem' }}>Registration Under Review</h2>
        <p style={{ color: '#7fb3a0' }}>Your ground registration is currently pending admin approval.</p>
        <button onClick={handleLogout} style={{ marginTop: '2rem', background: 'transparent', border: '1px solid #f59e0b', color: '#f59e0b', padding: '0.5rem 1rem', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
      </div>
    );
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
