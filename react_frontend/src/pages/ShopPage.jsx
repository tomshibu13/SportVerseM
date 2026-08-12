import React, { useState } from 'react';
import { Plus, Star, AlertTriangle } from 'lucide-react';

export default function ShopPage({ products = [], onOpenAddProduct }) {
  const [selectedCat, setSelectedCat] = useState('All');

  const filteredProducts = selectedCat === 'All'
    ? products
    : products.filter((p) => p.category.toLowerCase() === selectedCat.toLowerCase());

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">Pro-Shop Gear Inventory</h1>
          <p className="page-subtitle">Manage sports merchandise, equipment stock, and retail pricing at your station</p>
        </div>

        <button className="btn btn-primary" onClick={onOpenAddProduct}>
          <Plus size={16} />
          Add New Product
        </button>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {['All', 'Football', 'Rackets', 'Shoes', 'Accessories'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCat(cat)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-color)',
              background: selectedCat === cat ? 'rgba(200, 137, 91, 0.18)' : 'rgba(15, 13, 11, 0.9)',
              borderColor: selectedCat === cat ? 'var(--primary)' : 'var(--border-color)',
              color: selectedCat === cat ? '#ffffff' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: selectedCat === cat ? 700 : 500,
              cursor: 'pointer',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      <div className="grid-3">
        {filteredProducts.map((p) => (
          <div key={p.product_id} className="glass-card glass-card-interactive" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ position: 'relative' }}>
              <img src={p.image} alt={p.title} style={{ width: '100%', height: '170px', objectFit: 'cover' }} />
              <span className="badge badge-sport" style={{ position: 'absolute', top: '12px', left: '12px' }}>
                {p.category}
              </span>
              {p.stock <= 15 && (
                <span className="badge badge-pending" style={{ position: 'absolute', top: '12px', right: '12px' }}>
                  <AlertTriangle size={12} /> Low Stock ({p.stock})
                </span>
              )}
            </div>

            <div style={{ padding: '1.25rem' }}>
              <h3 style={{ fontSize: '1.05rem', marginBottom: '0.3rem' }}>{p.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', height: '2.4em', overflow: 'hidden', lineHeight: '1.2rem' }}>
                {p.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1rem' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#e5ba93' }}>₹{p.price}</span>
                    {p.original_price && (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textDecoration: 'line-through' }}>
                        ₹{p.original_price}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: 'var(--text-dim)' }}>
                    In Stock: <strong style={{ color: '#ffffff' }}>{p.stock} units</strong>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', color: '#e5ba93', fontSize: '0.825rem', fontWeight: 700 }}>
                  <Star size={14} fill="#c8895b" color="#c8895b" />
                  {p.rating}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
