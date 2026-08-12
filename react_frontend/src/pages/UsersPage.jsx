import React, { useState } from 'react';
import { Users, Shield, UserCheck, Search, Mail, Phone, Calendar } from 'lucide-react';

export default function UsersPage({ users = [] }) {
  const [roleFilter, setRoleFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'All' || (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());
    const matchesSearch =
      (u.fullName && u.fullName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.phone && u.phone.includes(searchQuery));
    return matchesRole && matchesSearch;
  });

  const getRoleBadge = (role = 'User') => {
    switch (role.toLowerCase()) {
      case 'admin':
        return <span className="badge badge-approved" style={{ background: 'rgba(200, 137, 91, 0.25)', color: '#e5ba93' }}>👑 Admin</span>;
      case 'groundowner':
        return <span className="badge badge-completed">🏟️ Ground Owner</span>;
      case 'shopowner':
        return <span className="badge badge-pending">🛍️ Shop Owner</span>;
      default:
        return <span className="badge badge-sport">👤 User</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Superadmin User & Accounts Management</h1>
          <p className="page-subtitle">Live accounts fetched directly from MongoDB database backend</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card" style={{ marginBottom: '1.5rem', padding: '1.1rem' }}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} color="#a39c93" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              className="input-field"
              placeholder="Search users by name, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            {['All', 'Admin', 'GroundOwner', 'User'].map((r) => (
              <button
                key={r}
                onClick={() => setRoleFilter(r)}
                style={{
                  padding: '0.55rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-color)',
                  background: roleFilter === r ? 'rgba(200, 137, 91, 0.18)' : 'rgba(15, 13, 11, 0.9)',
                  borderColor: roleFilter === r ? 'var(--primary)' : 'var(--border-color)',
                  color: roleFilter === r ? '#ffffff' : 'var(--text-muted)',
                  fontSize: '0.825rem',
                  fontWeight: roleFilter === r ? 700 : 500,
                  cursor: 'pointer',
                }}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="custom-table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>User Name</th>
              <th>Email Address</th>
              <th>System Role</th>
              <th>Phone</th>
              <th>Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                  No registered users found matching query.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u, idx) => (
                <tr key={u._id || u.id || idx}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <UserCheck size={16} color="#c8895b" />
                      {u.fullName || 'Registered User'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#f3e5d8', fontSize: '0.85rem' }}>
                      <Mail size={14} color="#a39c93" />
                      {u.email}
                    </div>
                  </td>
                  <td>{getRoleBadge(u.role)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <Phone size={14} color="#a39c93" />
                      {u.phone || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                      <Calendar size={14} />
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
