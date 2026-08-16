import React, { useState } from 'react';
import { X, ShoppingBag, Plus, Sparkles, Image as ImageIcon } from 'lucide-react';

const SAMPLE_PROD_IMAGES = [
  { label: 'Racket', url: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=400&q=80' },
  { label: 'Shoes', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80' },
  { label: 'Football', url: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=400&q=80' },
  { label: 'Cricket Bat', url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=400&q=80' },
];

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Gear');
  const [sport, setSport] = useState('Badminton');
  const [price, setPrice] = useState(1499);
  const [stock, setStock] = useState(15);
  const [imageUrl, setImageUrl] = useState(SAMPLE_PROD_IMAGES[0].url);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onAddProduct({
        name: name.trim(),
        title: name.trim(),
        category,
        sport,
        price: Number(price),
        stock: Number(stock),
        image: imageUrl,
      });
      setName('');
      setCategory('Gear');
      setSport('Badminton');
      setPrice(1499);
      setStock(15);
      onClose();
    } catch (err) {
      console.error('Error in AddProductModal:', err);
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
              <ShoppingBag size={20} color="#c8895b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff' }}>Add Pro-Shop Equipment</h3>
              <span style={{ fontSize: '0.75rem', color: '#a39c93' }}>Manage Marketplace Inventory</span>
            </div>
          </div>

          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#a39c93' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Product / Equipment Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Yonex Nanoflare 800 Badminton Racket"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Category</label>
              <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="Racket">Racket</option>
                <option value="Footwear">Footwear</option>
                <option value="Bat">Bat</option>
                <option value="Gear">Gear & Balls</option>
                <option value="Accessories">Accessories</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Sport</label>
              <select className="form-select" value={sport} onChange={(e) => setSport(e.target.value)}>
                <option value="Badminton">Badminton</option>
                <option value="Football">Football</option>
                <option value="Cricket">Cricket</option>
                <option value="Tennis">Tennis</option>
                <option value="Padel">Padel</option>
                <option value="General">General Fitness</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                min="50"
                step="50"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Stock Quantity</label>
              <input
                type="number"
                className="form-input"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                min="1"
                required
              />
            </div>
          </div>

          {/* Photo Presets */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ImageIcon size={13} color="#c8895b" />
              <span>Product Image Cover</span>
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {SAMPLE_PROD_IMAGES.map((img, idx) => (
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
              {loading ? 'Adding Product...' : '+ Add Item to Shop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
