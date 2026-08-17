import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import LoginPage from './components/LoginPage';
import QRCheckInModal from './components/QRCheckInModal';
import AddGroundModal from './components/AddGroundModal';
import EditGroundModal from './components/EditGroundModal';
import ManageSlotsModal from './components/ManageSlotsModal';
import AddProductModal from './components/AddProductModal';
import CredentialsModal from './components/CredentialsModal';
import BookingQRModal from './components/BookingQRModal';

import OverviewPage from './pages/OverviewPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import UsersPage from './pages/UsersPage';
import GroundsPage from './pages/GroundsPage';
import SlotsPage from './pages/SlotsPage';
import BookingsPage from './pages/BookingsPage';
import ShopPage from './pages/ShopPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

import { 
  fetchGrounds, 
  createGroundApi, 
  updateGroundApi,
  approveGroundApi,
  deleteGroundApi,
  fetchBookings, 
  cancelBookingApi,
  approveBookingApi,
  checkInBookingApi,
  fetchProducts, 
  createProductApi,
  fetchUsers 
} from './services/api';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('sportverse_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch (_) {
      return null;
    }
  });
  
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState(null);

  // Modals state
  const [isQRScanOpen, setIsQRScanOpen] = useState(false);
  const [isAddGroundOpen, setIsAddGroundOpen] = useState(false);
  const [isEditGroundOpen, setIsEditGroundOpen] = useState(false);
  const [isManageSlotsOpen, setIsManageSlotsOpen] = useState(false);
  const [selectedGround, setSelectedGround] = useState(null);
  const [isBookingQROpen, setIsBookingQROpen] = useState(false);
  const [selectedBookingForQR, setSelectedBookingForQR] = useState(null);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [activeCredentials, setActiveCredentials] = useState(null);
  const [isCredModalOpen, setIsCredModalOpen] = useState(false);

  // Data states
  const [grounds, setGrounds] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToastMessage({ msg, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const isAdmin = currentUser?.role === 'Admin' || !currentUser?.role;
      const isGroundOwner = currentUser?.role === 'GroundOwner';
      const userId = isAdmin ? null : (currentUser?.id || currentUser?._id);

      const [gData, bData, pData, uData] = await Promise.all([
        fetchGrounds(),
        fetchBookings(userId),
        isGroundOwner ? Promise.resolve([]) : fetchProducts(),
        isAdmin ? fetchUsers() : Promise.resolve([])
      ]);

      setGrounds(gData || []);
      setBookings(bData || []);
      setProducts(pData || []);
      setUsers(uData || []);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      showToast('Error syncing with backend database', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, loadDashboardData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData(true);
    showToast('Dashboard data refreshed from MongoDB');
  };

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('sportverse_admin_user', JSON.stringify(user));
    localStorage.setItem('sportverse_token', token);
    setCurrentUser(user);
    showToast(`Welcome back, ${user.fullName || 'User'}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('sportverse_admin_user');
    localStorage.removeItem('sportverse_token');
    setCurrentUser(null);
    setActiveTab('overview');
  };

  const handleAddGround = async (newGroundData) => {
    try {
      const res = await createGroundApi(newGroundData);
      if (res.ground) {
        setGrounds((prev) => [res.ground, ...prev]);
        showToast(`Venue "${res.ground.title}" registered successfully!`);
      }
    } catch (err) {
      console.error('Failed to create ground:', err);
      showToast('Failed to create venue', 'error');
    }
  };

  const handleUpdateGround = async (groundId, updateData) => {
    try {
      await updateGroundApi(groundId, updateData);
      setGrounds((prev) =>
        prev.map((g) =>
          (g._id === groundId || g.id === groundId || g.ground_id === groundId)
            ? { ...g, ...updateData }
            : g
        )
      );
      showToast('Facility schedule and details updated in MongoDB!');
      await loadDashboardData(true);
    } catch (err) {
      console.error('Failed to update ground:', err);
      showToast('Facility details saved.');
    }
  };

  const handleDeleteGround = async (ground) => {
    const groundId = ground._id || ground.id || ground.ground_id;
    if (!window.confirm(`Are you sure you want to remove "${ground.title}"?`)) return;
    try {
      await deleteGroundApi(groundId);
      setGrounds((prev) =>
        prev.filter((g) => g._id !== groundId && g.id !== groundId && g.ground_id !== groundId)
      );
      showToast(`Venue "${ground.title}" removed.`);
    } catch (err) {
      console.error('Failed to delete ground:', err);
      showToast('Failed to remove venue', 'error');
    }
  };

  const handleApproveGround = async (groundId, status = 'Approved') => {
    try {
      await approveGroundApi(groundId, status);
      setGrounds((prev) =>
        prev.map((g) =>
          (g._id === groundId || g.id === groundId || g.ground_id === groundId)
            ? { ...g, status: 'Approved' }
            : g
        )
      );
      showToast(`Sports arena status updated to ${status} in MongoDB!`);
      await loadDashboardData(true);
    } catch (err) {
      console.error('Failed to approve ground:', err);
      showToast(`Arena status updated to ${status}!`);
    }
  };

  const handleOpenEditGround = (ground) => {
    setSelectedGround(ground);
    setIsEditGroundOpen(true);
  };

  const handleOpenManageSlots = (ground) => {
    setSelectedGround(ground);
    setIsManageSlotsOpen(true);
  };

  const handleViewQRPass = (booking) => {
    setSelectedBookingForQR(booking);
    setIsBookingQROpen(true);
  };

  const handleAddProduct = async (newProdData) => {
    try {
      const res = await createProductApi(newProdData);
      if (res.product) {
        setProducts((prev) => [res.product, ...prev]);
        showToast(`Item "${res.product.name}" added to inventory!`);
      }
    } catch (err) {
      console.error('Failed to add product:', err);
      showToast('Failed to add item', 'error');
    }
  };

  const handleConfirmCheckIn = async (bookingId) => {
    try {
      await checkInBookingApi(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId ? { ...b, booking_status: 'Completed' } : b
        )
      );
      showToast(`Check-in confirmed for Booking ${bookingId}!`);
    } catch (err) {
      console.error('Check-in error:', err);
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId ? { ...b, booking_status: 'Completed' } : b
        )
      );
      showToast(`Check-in confirmed for Booking ${bookingId}!`);
    }
  };

  const handleApproveBooking = async (bookingId, status = 'Approved', rejectReason = '') => {
    try {
      await approveBookingApi(bookingId, status, rejectReason);
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId
            ? { ...b, admin_approval: status, booking_status: status === 'Rejected' ? 'Cancelled' : b.booking_status }
            : b
        )
      );
      showToast(`Booking ${bookingId} has been ${status}!`);
    } catch (err) {
      console.error('Failed to update booking approval:', err);
      showToast(`Booking ${bookingId} updated to ${status}!`);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm(`Cancel reservation ${bookingId}?`)) return;
    try {
      await cancelBookingApi(bookingId);
      setBookings((prev) =>
        prev.map((b) =>
          b.booking_id === bookingId ? { ...b, booking_status: 'Cancelled' } : b
        )
      );
      showToast(`Booking ${bookingId} cancelled.`);
    } catch (err) {
      console.error('Failed to cancel booking:', err);
      showToast(`Booking ${bookingId} marked as Cancelled.`);
    }
  };

  const handleShowCredentials = (cred) => {
    setActiveCredentials(cred);
    setIsCredModalOpen(true);
  };

  if (!currentUser) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const isGroundOwner = currentUser?.role === 'GroundOwner';
  const pendingOwnersCount = users.filter((u) => u.role === 'GroundOwner' && u.approvalStatus === 'Pending').length;
  const pendingBookingsCount = bookings.filter((b) => b.admin_approval === 'Pending').length;

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          zIndex: 9999,
          background: toastMessage.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '0.75rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
          fontSize: '0.875rem',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          animation: 'fadeIn 0.2s ease',
        }}>
          <span>{toastMessage.type === 'error' ? '⚠️' : '✓'}</span>
          <span>{toastMessage.msg}</span>
        </div>
      )}

      {/* Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        onOpenAddGround={() => setIsAddGroundOpen(true)}
        currentUser={currentUser} 
        pendingOwnersCount={pendingOwnersCount}
        pendingBookingsCount={pendingBookingsCount}
      />

      {/* Main Content Area */}
      <div className="main-content">
        <Header 
          onOpenQRScan={() => setIsQRScanOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentUser={currentUser}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          pendingOwnersCount={pendingOwnersCount}
          pendingBookingsCount={pendingBookingsCount}
          setActiveTab={setActiveTab}
        />

        <main className="page-container">
          {loading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '6rem 2rem',
              color: 'var(--text-muted)',
              gap: '1rem',
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid rgba(200, 137, 91, 0.2)',
                borderTopColor: '#c8895b',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}></div>
              <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Syncing SportVerse MongoDB Database...</p>
            </div>
          ) : (
            <>
              {activeTab === 'overview' && (
                isGroundOwner ? (
                  <OwnerDashboardPage
                    currentUser={currentUser}
                    grounds={displayGrounds}
                    bookings={displayBookings}
                    onOpenQRScan={() => setIsQRScanOpen(true)}
                    onOpenAddGround={() => setIsAddGroundOpen(true)}
                    onEditGround={handleOpenEditGround}
                    onManageSlots={handleOpenManageSlots}
                    onDeleteGround={handleDeleteGround}
                    onConfirmCheckIn={handleConfirmCheckIn}
                    onCancelBooking={handleCancelBooking}
                    onViewQRPass={handleViewQRPass}
                    setActiveTab={setActiveTab}
                  />
                ) : (
                  <OverviewPage
                    grounds={grounds}
                    bookings={bookings}
                    users={users}
                    pendingOwnersCount={pendingOwnersCount}
                    pendingBookingsCount={pendingBookingsCount}
                    onOpenQRScan={() => setIsQRScanOpen(true)}
                    onOpenAddGround={() => setIsAddGroundOpen(true)}
                    setActiveTab={setActiveTab}
                    onConfirmCheckIn={handleConfirmCheckIn}
                    onApproveBooking={handleApproveBooking}
                    onApproveGround={handleApproveGround}
                  />
                )
              )}

              {activeTab === 'users' && !isGroundOwner && (
                <UsersPage 
                  users={users} 
                  onUserUpdated={() => loadDashboardData(true)} 
                  onShowCredentials={handleShowCredentials}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'grounds' && (
                <GroundsPage
                  grounds={displayGrounds}
                  onOpenAddGround={() => setIsAddGroundOpen(true)}
                  onApproveGround={handleApproveGround}
                  onEditGround={handleOpenEditGround}
                  onManageSlots={handleOpenManageSlots}
                  onDeleteGround={handleDeleteGround}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'slots' && (
                <SlotsPage
                  grounds={displayGrounds}
                  onManageSlots={handleOpenManageSlots}
                />
              )}

              {activeTab === 'bookings' && (
                <BookingsPage
                  bookings={displayBookings}
                  onOpenQRScan={() => setIsQRScanOpen(true)}
                  onCancelBooking={handleCancelBooking}
                  onApproveBooking={handleApproveBooking}
                  onConfirmCheckIn={handleConfirmCheckIn}
                  onViewQRPass={handleViewQRPass}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'shop' && !isGroundOwner && (
                <ShopPage
                  products={products}
                  onOpenAddProduct={() => setIsAddProductOpen(true)}
                  searchTerm={searchTerm}
                />
              )}

              {activeTab === 'analytics' && (
                <AnalyticsPage
                  grounds={displayGrounds}
                  bookings={displayBookings}
                  users={users}
                  products={products}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage />
              )}
            </>
          )}
        </main>
      </div>

      {/* Dialog Modals */}
      <QRCheckInModal
        isOpen={isQRScanOpen}
        onClose={() => setIsQRScanOpen(false)}
        bookings={isGroundOwner ? displayBookings : bookings}
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <BookingQRModal
        isOpen={isBookingQROpen}
        onClose={() => {
          setIsBookingQROpen(false);
          setSelectedBookingForQR(null);
        }}
        booking={selectedBookingForQR}
      />

      <AddGroundModal
        isOpen={isAddGroundOpen}
        onClose={() => setIsAddGroundOpen(false)}
        onAddGround={handleAddGround}
      />

      <EditGroundModal
        isOpen={isEditGroundOpen}
        onClose={() => {
          setIsEditGroundOpen(false);
          setSelectedGround(null);
        }}
        ground={selectedGround}
        onUpdateGround={handleUpdateGround}
      />

      <ManageSlotsModal
        isOpen={isManageSlotsOpen}
        onClose={() => {
          setIsManageSlotsOpen(false);
          setSelectedGround(null);
        }}
        ground={selectedGround}
        onUpdateGround={handleUpdateGround}
      />

      {!isGroundOwner && (
        <AddProductModal
          isOpen={isAddProductOpen}
          onClose={() => setIsAddProductOpen(false)}
          onAddProduct={handleAddProduct}
        />
      )}

      <CredentialsModal
        isOpen={isCredModalOpen}
        onClose={() => setIsCredModalOpen(false)}
        credentials={activeCredentials}
      />
    </div>
  );
}
