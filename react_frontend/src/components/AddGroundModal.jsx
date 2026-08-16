import React, { useState } from 'react';
import { X, MapPin, IndianRupee, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

const SAMPLE_IMAGES = [
  { label: 'Football Turf', url: 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80' },
  { label: 'Badminton Hall', url: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80' },
  { label: 'Cricket Nets', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80' },
  { label: 'Padel Court', url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80' },
];

export default function AddGroundModal({ isOpen, onClose, onAddGround }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [sports, setSports] = useState('Football');
  const [pricePerHour, setPricePerHour] = useState(1200);
  const [imageUrl, setImageUrl] = useState(SAMPLE_IMAGES[0].url);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddGround({
        title: title.trim(),
        location: location.trim(),
        address: location.trim(),
        sports: [sports],
        sport_type: sports,
        pricePerHour: Number(pricePerHour),
        price_per_hour: Number(pricePerHour),
        totalSlots: 12,
        status: 'Active',
        image: imageUrl,
        images: [imageUrl],
      });
      // Reset form
      setTitle('');
      setLocation('');
      setSports('Football');
      setPricePerHour(1200);
      onClose();
    } catch (err) {
      console.error('Error in AddGroundModal:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={20} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Add New Sports Arena</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Register Venue in MongoDB Database</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Venue / Arena Title</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex International Sports Arena"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / Address</label>
            <input
              type="text"
              className="form-input"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kakkanad, Kochi, Kerala"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Primary Sport</label>
              <select className="form-select" value={sports} onChange={(e) => setSports(e.target.value)}>
                <option value="Football">Football</option>
                <option value="Badminton">Badminton</option>
                <option value="Cricket">Cricket</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="Basketball">Basketball</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hourly Rate (₹)</label>
              <input
                type="number"
                className="form-input"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                min="100"
                step="50"
                required
              />
            </div>
          </div>

          {/* Photo Selection */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ImageIcon size={13} color="#c8895b" />
              <span>Venue Photo Cover</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {SAMPLE_IMAGES.map((img, idx) => (
                <div
                  key={idx}
                  onClick={() => setImageUrl(img.url)}
                  style={{
                    height: '54px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    border: imageUrl === img.url ? '2px solid #c8895b' : '1px solid var(--border-color)',
                    position: 'relative',
                  }}
                >
                  <img src={img.url} alt={img.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: '2px', left: '2px', fontSize: '0.6rem', background: 'rgba(0,0,0,0.7)', padding: '1px 3px', borderRadius: '3px' }}>
                    {img.label}
                  </span>
                </div>
              ))}
            </div>
            <input
              type="url"
              className="form-input"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Or enter custom image URL..."
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.2 }} disabled={loading}>
              {loading ? 'Registering Venue...' : '+ Create Sports Arena'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
