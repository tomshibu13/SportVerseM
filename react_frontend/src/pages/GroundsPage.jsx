import React, { useState } from 'react';
import { MapPin, Plus, Star, IndianRupee, Layers, Search, Filter, CheckCircle2, Check } from 'lucide-react';

const SPORT_FILTERS = ['ALL', 'Football', 'Badminton', 'Cricket', 'Tennis', 'Padel'];

export default function GroundsPage({ grounds = [], onOpenAddGround, onApproveGround, searchTerm: globalSearchTerm = '' }) {
  const [selectedSport, setSelectedSport] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [localSearch, setLocalSearch] = useState('');
  const [updatingGroundId, setUpdatingGroundId] = useState(null);

  const activeSearch = localSearch || globalSearchTerm;

  const handleApprove = async (groundId) => {
    setUpdatingGroundId(groundId);
    try {
      if (onApproveGround) {
        await onApproveGround(groundId, 'Approved');
      }
    } finally {
      setUpdatingGroundId(null);
    }
  };

  const filteredGrounds = grounds.filter((g) => {
    const sportName = g.sport_type || (Array.isArray(g.sports) ? g.sports.join(' ') : g.sports) || '';
    const matchesSport = selectedSport === 'ALL' || sportName.toLowerCase().includes(selectedSport.toLowerCase());
    const isPending = g.status === 'Pending';
    const isApproved = g.status === 'Approved' || g.status === 'Active';
    const matchesStatus =
      selectedStatus === 'ALL' ||
      (selectedStatus === 'Pending' && isPending) ||
      (selectedStatus === 'Approved' && isApproved);

    const q = activeSearch.toLowerCase();
    const matchesSearch =
      !activeSearch ||
      (g.title && g.title.toLowerCase().includes(q)) ||
      (g.location && g.location.toLowerCase().includes(q)) ||
      sportName.toLowerCase().includes(q);
    return matchesSport && matchesStatus && matchesSearch;
  });

  const pendingCount = grounds.filter((g) => g.status === 'Pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <MapPin size={24} color="#c8895b" />
            <span>Sports Venues & Courts ({grounds.length})</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Manage sports complexes, court pricing, approval status in MongoDB, and slot allocations.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddGround}>
          <Plus size={16} />
          <span>+ Add Ground / Arena</span>
        </button>
      </div>

      {/* Sport & Status Filter Tags */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {SPORT_FILTERS.map((sport) => (
            <button
              key={sport}
              onClick={() => setSelectedSport(sport)}
              style={{
                background: selectedSport === sport ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedSport === sport ? 'none' : '1px solid var(--border-color)',
                color: selectedSport === sport ? '#ffffff' : '#a39c93',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {sport}
            </button>
          ))}

          <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 0.25rem' }}></div>

          <button
            onClick={() => setSelectedStatus(selectedStatus === 'Pending' ? 'ALL' : 'Pending')}
            style={{
              background: selectedStatus === 'Pending' ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              color: selectedStatus === 'Pending' ? '#000000' : '#f59e0b',
              padding: '0.35rem 0.85rem',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Pending Approvals ({pendingCount})
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '240px' }}>
          <Search size={15} color="#a39c93" />
          <input
            type="text"
            placeholder="Filter grounds..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Grid of Grounds */}
      {filteredGrounds.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#a39c93' }}>
          <MapPin size={36} color="#c8895b" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No venues found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try clearing your search query or add a new sports ground.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
          {filteredGrounds.map((g) => {
            const isPending = g.status === 'Pending';
            const groundId = g._id || g.id || g.ground_id;

            return (
              <div className="card" key={groundId} style={{ padding: '0', overflow: 'hidden', border: isPending ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-color)' }}>
                <div style={{ height: '170px', position: 'relative', overflow: 'hidden' }}>
                  <img
                    src={g.image || (g.images && g.images[0]) || 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=600&q=80'}
                    alt={g.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    background: 'rgba(10, 9, 8, 0.85)',
                    backdropFilter: 'blur(4px)',
                    padding: '0.25rem 0.65rem',
                    borderRadius: '20px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                  }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    <span>{g.rating || 4.8}</span>
                  </div>

                  <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                    <span className={`badge ${isPending ? 'badge-orange' : 'badge-green'}`}>
                      {g.status || 'Approved'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.4rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#ffffff' }}>
                      {g.title}
                    </h3>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: '#a39c93', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.85rem' }}>
                    <MapPin size={14} color="#c8895b" />
                    <span>{g.location || g.address}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <span style={{ fontSize: '0.725rem', color: '#a39c93', display: 'block' }}>Hourly Rate</span>
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c8895b' }}>
                        ₹{g.pricePerHour || g.price_per_hour}/hr
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.725rem', color: '#a39c93', display: 'block' }}>Sports</span>
                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: '#ffffff' }}>
                        {Array.isArray(g.sports) ? g.sports.join(', ') : (g.sport_type || g.sports)}
                      </span>
                    </div>
                  </div>

                  {/* Direct Approve Action for Pending Grounds */}
                  {isPending && (
                    <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(245, 158, 11, 0.2)' }}>
                      <button
                        className="btn btn-primary"
                        style={{ width: '100%', background: '#10b981', borderColor: '#10b981', fontSize: '0.825rem', padding: '0.45rem' }}
                        disabled={updatingGroundId === groundId}
                        onClick={() => handleApprove(groundId)}
                      >
                        <Check size={15} />
                        <span>{updatingGroundId === groundId ? 'Updating MongoDB...' : 'Approve Venue in DB'}</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
