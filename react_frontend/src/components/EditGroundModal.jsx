import React, { useState, useEffect } from 'react';
import { X, Building2, MapPin, IndianRupee, Sparkles } from 'lucide-react';

export default function EditGroundModal({ isOpen, onClose, ground, onUpdateGround }) {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [pricePerHour, setPricePerHour] = useState(700);
  const [sportType, setSportType] = useState('Football');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ground) {
      setTitle(ground.title || '');
      setLocation(ground.location || ground.address || '');
      setPricePerHour(ground.pricePerHour || ground.price_per_hour || 700);
      setSportType(ground.sport_type || (Array.isArray(ground.sports) ? ground.sports[0] : 'Football') || 'Football');
    }
  }, [ground]);

  if (!isOpen || !ground) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const groundId = ground._id || ground.id || ground.ground_id;
      await onUpdateGround(groundId, {
        title: title.trim(),
        location: location.trim(),
        address: location.trim(),
        price_per_hour: Number(pricePerHour),
        pricePerHour: Number(pricePerHour),
        sport_type: sportType,
        sports: [sportType],
      });
      onClose();
    } catch (err) {
      console.error('Error updating ground:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(200, 137, 91, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Edit Facility Details</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Update Arena Info in MongoDB</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Facility / Arena Name</label>
            <input
              type="text"
              className="form-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Apex Sports Arena"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location / City</label>
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
              <select className="form-select" value={sportType} onChange={(e) => setSportType(e.target.value)}>
                <option value="Football">Football</option>
                <option value="Badminton">Badminton</option>
                <option value="Cricket">Cricket</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="Basketball">Basketball</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Base Price per Hour (₹)</label>
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

          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" style={{ flex: 1.2 }} disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
