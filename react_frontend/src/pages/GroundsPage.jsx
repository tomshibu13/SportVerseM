import React, { useState } from 'react';
import { Plus, MapPin, Star, ShieldCheck, Sparkles, Edit3 } from 'lucide-react';

export default function GroundsPage({ grounds = [], onOpenAddGround }) {
  const [selectedSport, setSelectedSport] = useState('All');

  const filteredGrounds = selectedSport === 'All'
    ? grounds
    : grounds.filter((g) => g.sport_type.toLowerCase() === selectedSport.toLowerCase());

  return (
    <div className="animate-fade-in">
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Venues & Court Control</h1>
          <p className="page-subtitle">Manage facility listings, base hourly rates, and court amenities</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddGround}>
          <Plus size={16} />
          Register New Arena
        </button>
      </div>

      {/* Sport Category Filter Tabs */}
      <div style={styles.filterRow}>
        {['All', 'Football', 'Badminton', 'Cricket', 'Tennis'].map((sport) => (
          <button
            key={sport}
            onClick={() => setSelectedSport(sport)}
            style={{
              ...styles.filterTab,
              ...(selectedSport === sport ? styles.filterTabActive : {}),
            }}
          >
            {sport}
          </button>
        ))}
      </div>

      {/* Grounds Grid */}
      <div className="grid-3">
        {filteredGrounds.map((ground) => (
          <div key={ground.ground_id} className="glass-card glass-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={ground.images[0]}
                alt={ground.title}
                style={{ width: '100%', height: '180px', objectFit: 'cover' }}
              />
              <span className="badge badge-approved" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                <ShieldCheck size={12} />
                {ground.status}
              </span>
              <span className="badge badge-sport" style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                {ground.sport_type}
              </span>
            </div>

            <div style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <h3 style={{ fontSize: '1.1rem' }}>{ground.title}</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#e5ba93', fontSize: '0.85rem', fontWeight: 700 }}>
                  <Star size={14} fill="#c8895b" color="#c8895b" />
                  {ground.rating} ({ground.review_count})
                </div>
              </div>

              <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.75rem' }}>
                <MapPin size={14} color="#a39c93" />
                {ground.location}
              </div>

              {/* Facilities pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '1rem' }}>
                {ground.facilities?.slice(0, 4).map((facility, idx) => (
                  <span key={idx} style={styles.facilityPill}>
                    {facility}
                  </span>
                ))}
              </div>

              {/* Pricing & AI Score */}
              <div style={styles.cardFooter}>
                <div>
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-dim)', display: 'block' }}>Base Rate</span>
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e5ba93' }}>
                    ₹{ground.price_per_hour}
                    <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>/hr</span>
                  </span>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', color: '#c8895b' }}>
                    <Sparkles size={12} />
                    AI Score: <strong>{ground.ai_score || 95}%</strong>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', marginTop: '0.3rem' }}>
                    <Edit3 size={12} /> Edit Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  filterRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1.5rem',
  },
  filterTab: {
    padding: '0.5rem 1rem',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border-color)',
    background: 'rgba(15, 13, 11, 0.9)',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  filterTabActive: {
    background: 'rgba(200, 137, 91, 0.18)',
    borderColor: 'var(--primary)',
    color: '#ffffff',
    fontWeight: 700,
  },
  facilityPill: {
    fontSize: '0.725rem',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    background: 'rgba(255, 255, 255, 0.05)',
    color: '#a39c93',
    border: '1px solid var(--border-color)',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.75rem',
    borderTop: '1px solid var(--border-color)',
  }
};
