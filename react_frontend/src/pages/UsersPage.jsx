import React, { useState } from 'react';
import { Users, CheckCircle2, XCircle, Search, ShieldCheck, Mail, Phone, Calendar, Key, AlertCircle, RefreshCw } from 'lucide-react';
import { approveUserApi } from '../services/api';

export default function UsersPage({ users = [], onUserUpdated, onShowCredentials, searchTerm: globalSearchTerm = '' }) {
  const [filterRole, setFilterRole] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const activeSearch = localSearchTerm || globalSearchTerm;

  const handleStatusChange = async (user, newStatus) => {
    const userId = user._id || user.id;
    setUpdatingId(userId);
    try {
      const res = await approveUserApi(userId, newStatus);
      if (onUserUpdated) await onUserUpdated();

      if (res && res.credentials) {
        onShowCredentials({
          fullName: user.fullName || res.credentials.fullName,
          email: user.email || res.credentials.email,
          generatedPassword: res.credentials.generatedPassword,
          portalUrl: res.credentials.portalUrl || 'http://localhost:5174',
          role: user.role,
        });
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update user status in MongoDB database.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = filterRole === 'ALL' || u.role === filterRole;
    const matchesStatus = filterStatus === 'ALL' || u.approvalStatus === filterStatus;
    const q = activeSearch.toLowerCase();
    const matchesSearch =
      !activeSearch ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.toLowerCase().includes(q));
    return matchesRole && matchesStatus && matchesSearch;
  });

  const pendingOwners = users.filter((u) => u.role === 'GroundOwner' && u.approvalStatus === 'Pending');
  const totalApproved = users.filter((u) => u.approvalStatus === 'Approved').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Users size={24} color="#c8895b" />
            <span>User & Ground Owner Directory</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Review registered platform accounts, approve Station Owner applications, and dispatch access credentials.
          </p>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem' }}>
            <Search size={15} color="#a39c93" />
            <input
              type="text"
              placeholder="Search user, email, phone..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '180px' }}
            />
          </div>

          <select
            className="form-select"
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Roles ({users.length})</option>
            <option value="GroundOwner">Ground Owners</option>
            <option value="ShopOwner">Shop Owners</option>
            <option value="User">Players / Users</option>
            <option value="Admin">Superadmins</option>
          </select>

          <select
            className="form-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Pending">Pending ({pendingOwners.length})</option>
            <option value="Approved">Approved ({totalApproved})</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Pending Owners Callout Banner */}
      {pendingOwners.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(15, 13, 11, 0.95) 100%)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          borderRadius: '12px',
          padding: '1rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertCircle size={22} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 700, color: '#ffffff', fontSize: '0.95rem' }}>
                {pendingOwners.length} Ground Owner Registration Application(s) Awaiting Review
              </div>
              <div style={{ fontSize: '0.75rem', color: '#a39c93' }}>
                Approving generates unique credentials and sends automated setup instructions.
              </div>
            </div>
          </div>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setFilterRole('GroundOwner');
              setFilterStatus('Pending');
            }}
            style={{ borderColor: '#f59e0b', color: '#f59e0b' }}
          >
            Filter Pending Only
          </button>
        </div>
      )}

      {/* Users Table Card */}
      <div className="card">
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>User / Owner</th>
                <th>Role</th>
                <th>Contact</th>
                <th>Registration Date</th>
                <th>Status</th>
                <th>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: '#a39c93' }}>
                    No users matching your filters.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id || u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: u.role === 'Admin' ? 'linear-gradient(135deg, #c8895b 0%, #a86c43 100%)' :
                            u.role === 'GroundOwner' ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'rgba(255,255,255,0.1)',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: '0.9rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {(u.fullName || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#ffffff' }}>{u.fullName}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Mail size={12} />
                            <span>{u.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${u.role === 'Admin' ? 'badge-primary' :
                        u.role === 'GroundOwner' ? 'badge-green' :
                          u.role === 'ShopOwner' ? 'badge-orange' : 'badge-blue'
                        }`}>
                        {u.role}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.825rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Phone size={12} />
                        <span>{u.phone || 'N/A'}</span>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.825rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                        <Calendar size={12} />
                        <span>{u.createdAt || 'Recent'}</span>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${u.approvalStatus === 'Approved' ? 'badge-green' :
                        u.approvalStatus === 'Pending' ? 'badge-orange' : 'badge-red'
                        }`}>
                        {u.approvalStatus || 'Approved'}
                      </span>
                    </td>

                    <td>
                      {u.role !== 'Admin' ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          {u.approvalStatus !== 'Approved' ? (
                            <button
                              className="btn btn-primary btn-sm"
                              disabled={updatingId === (u._id || u.id)}
                              onClick={() => handleStatusChange(u, 'Approved')}
                              style={{ background: '#10b981', borderColor: '#10b981', gap: '0.3rem' }}
                            >
                              <CheckCircle2 size={13} />
                              <span>{updatingId === (u._id || u.id) ? 'Updating...' : 'Approve & Issue Key'}</span>
                            </button>
                          ) : (
                            <button
                              className="btn btn-secondary btn-sm"
                              disabled={updatingId === (u._id || u.id)}
                              onClick={() => handleStatusChange(u, 'Pending')}
                              style={{ fontSize: '0.75rem' }}
                            >
                              <span>Revoke</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#c8895b', fontWeight: 600 }}>Superadmin Protected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
