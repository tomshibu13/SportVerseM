import React, { useState } from 'react';
import { ShoppingBag, Plus, Star, Search, IndianRupee, Layers } from 'lucide-react';

const CATEGORIES = ['ALL', 'Racket', 'Footwear', 'Bat', 'Gear', 'Accessories'];

export default function ShopPage({ products = [], onOpenAddProduct, searchTerm: globalSearch = '' }) {
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [localSearch, setLocalSearch] = useState('');

  const activeSearch = localSearch || globalSearch;

  const filteredProducts = products.filter((p) => {
    const categoryName = p.category || p.sport || '';
    const matchesCat = selectedCat === 'ALL' || categoryName.toLowerCase().includes(selectedCat.toLowerCase());
    const q = activeSearch.toLowerCase();
    const pName = String(p.title || p.name || '').toLowerCase();
    const pCat = categoryName.toLowerCase();
    const matchesSearch = !activeSearch || pName.includes(q) || pCat.includes(q);
    return matchesCat && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#ffffff', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <ShoppingBag size={24} color="#c8895b" />
            <span>Pro-Shop Inventory & Sports Gear ({products.length})</span>
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#a39c93', marginTop: '0.2rem' }}>
            Manage sports gear, badminton rackets, football boots, and station marketplace inventory.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddProduct}>
          <Plus size={16} />
          <span>+ Add Equipment / Product</span>
        </button>
      </div>

      {/* Category Tags & Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              style={{
                background: selectedCat === cat ? 'var(--gold-gradient)' : 'rgba(255, 255, 255, 0.05)',
                border: selectedCat === cat ? 'none' : '1px solid var(--border-color)',
                color: selectedCat === cat ? '#ffffff' : '#a39c93',
                padding: '0.35rem 0.85rem',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(10, 9, 8, 0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.4rem 0.75rem', width: '240px' }}>
          <Search size={15} color="#a39c93" />
          <input
            type="text"
            placeholder="Search equipment..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', color: '#ffffff', fontSize: '0.85rem', width: '100%' }}
          />
        </div>
      </div>

      {/* Grid of Products */}
      {filteredProducts.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3rem', color: '#a39c93' }}>
          <ShoppingBag size={36} color="#c8895b" style={{ margin: '0 auto 0.5rem auto' }} />
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>No products found</div>
          <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Try changing category filters or add a new equipment item.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {filteredProducts.map((p) => (
            <div className="card" key={p.id || p._id} style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={p.image || 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=400&q=80'}
                  alt={p.name || p.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span className="badge badge-primary" style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  {p.category || p.sport}
                </span>

                <div style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  background: 'rgba(10, 9, 8, 0.85)',
                  backdropFilter: 'blur(4px)',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                }}>
                  <Star size={12} fill="#f59e0b" color="#f59e0b" />
                  <span>{p.rating || 4.8}</span>
                </div>
              </div>

              <div style={{ padding: '1.15rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#ffffff', marginBottom: '0.5rem', height: '42px', overflow: 'hidden', lineHeight: 1.3 }}>
                  {p.name || p.title}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                  <div>
                    <span style={{ fontSize: '0.7rem', color: '#a39c93', display: 'block' }}>Price</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c8895b' }}>₹{p.price}</span>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.7rem', color: '#a39c93', display: 'block' }}>Stock</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: (p.stock || 0) > 5 ? '#10b981' : '#ef4444' }}>
                      {p.stock !== undefined ? p.stock : 10} units
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
