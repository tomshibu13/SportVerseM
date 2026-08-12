import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import QRCheckInModal from './components/QRCheckInModal';
import AddGroundModal from './components/AddGroundModal';
import AddProductModal from './components/AddProductModal';

import OverviewPage from './pages/OverviewPage';
import UsersPage from './pages/UsersPage';
import GroundsPage from './pages/GroundsPage';
import SlotsPage from './pages/SlotsPage';
import BookingsPage from './pages/BookingsPage';
import ShopPage from './pages/ShopPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

import { 
  fetchGrounds, 
  createGround, 
  fetchBookings, 
  cancelBookingApi, 
  fetchProducts, 
  createProductApi,
  fetchUsers 
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('sportverse_admin_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isQRScanOpen, setIsQRScanOpen] = useState(false);
  const [isAddGroundOpen, setIsAddGroundOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Data states
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const userId = currentUser?.id || currentUser?._id || 1;
      const [gData, bData, pData, uData] = await Promise.all([
        fetchGrounds(),
        fetchBookings(userId),
        fetchProducts(),
        fetchUsers()
      ]);
      setGrounds(gData);
      setBookings(bData);
      setProducts(pData);
      setUsers(uData);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('sportverse_admin_user', JSON.stringify(user));
    localStorage.setItem('sportverse_token', token);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('sportverse_admin_user');
    localStorage.removeItem('sportverse_token');
    setCurrentUser(null);
  };

  const handleAddGround = async (newGroundData) => {
    const res = await createGround(newGroundData);
    if (res.ground) {
      setGrounds((prev) => [res.ground, ...prev]);
    }
  };

  const handleAddProduct = async (newProdData) => {
    const res = await createProductApi(newProdData);
    if (res.product) {
      setProducts((prev) => [res.product, ...prev]);
    }
  };

  const handleConfirmCheckIn = (bookingId) => {
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId ? { ...b, booking_status: 'Completed' } : b
      )
    );
  };

  const handleCancelBooking = async (bookingId) => {
    await cancelBookingApi(bookingId);
    setBookings((prev) =>
      prev.map((b) =>
        b.booking_id === bookingId ? { ...b, booking_status: 'Cancelled' } : b
      )
    );
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        onOpenAddGround={() => setIsAddGroundOpen(true)} 
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          onOpenQRScan={() => setIsQRScanOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <main className="page-container">
          {activeTab === 'overview' && (
            <OverviewPage
              grounds={grounds}
              bookings={bookings}
              onOpenQRScan={() => setIsQRScanOpen(true)}
              onOpenAddGround={() => setIsAddGroundOpen(true)}
              setActiveTab={setActiveTab}
            />
          )}

          {activeTab === 'users' && (
            <UsersPage users={users} />
          )}

          {activeTab === 'grounds' && (
            <GroundsPage
              grounds={grounds}
              onOpenAddGround={() => setIsAddGroundOpen(true)}
            />
          )}

          {activeTab === 'slots' && (
            <SlotsPage grounds={grounds} />
          )}

          {activeTab === 'bookings' && (
            <BookingsPage
              bookings={bookings}
              onOpenQRScan={() => setIsQRScanOpen(true)}
              onCancelBooking={handleCancelBooking}
            />
          )}

          {activeTab === 'shop' && (
            <ShopPage
              products={products}
              onOpenAddProduct={() => setIsAddProductOpen(true)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsPage />
          )}

          {activeTab === 'settings' && (
            <SettingsPage />
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <QRCheckInModal
        isOpen={isQRScanOpen}
        onClose={() => setIsQRScanOpen(false)}
        bookings={bookings}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <AddGroundModal
        isOpen={isAddGroundOpen}
        onClose={() => setIsAddGroundOpen(false)}
        onAddGround={handleAddGround}
      />

      <AddProductModal
        isOpen={isAddProductOpen}
        onClose={() => setIsAddProductOpen(false)}
        onAddProduct={handleAddProduct}
      />
    </div>
  );
}
