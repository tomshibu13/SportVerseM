import React, { useEffect, useState } from 'react';
import { ShoppingBag, Plus, Edit3, TrendingUp, Package, AlertCircle } from 'lucide-react';
import { fetchMyProducts } from '../services/api';

export default function ProShopPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'Gear', sport: 'Football', price: '', stock: '' });

  useEffect(() => {
    fetchMyProducts().then(d => { setProducts(d); setLoading(false); });
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const p = { ...form, id: Date.now(), price: Number(form.price), stock: Number(form.stock) };
    setProducts([...products, p]);
    setShowModal(false);
    setForm({ name: '', category: 'Gear', sport: 'Football', price: '', stock: '' });
  };

  const updateStock = (id, delta) => {
    setProducts(products.map(p => p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
  };

  const totalValue = products.reduce((s, p) => s + p.price * p.stock, 0);
  const lowStock = products.filter(p => p.stock < 10).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#e8f5f1' }}>Pro-Shop Inventory</h2>
          <p style={{ color: '#7fb3a0', fontSize: '0.875rem' }}>Manage sports equipment and merchandise at your station</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
        {[
          { l: 'Total Products', v: products.length, icon: <Package size={20} color="#10b981" />, color: '#10b981' },
          { l: 'Inventory Value', v: `₹${totalValue.toLocaleString()}`, icon: <TrendingUp size={20} color="#3b82f6" />, color: '#3b82f6' },
          { l: 'Low Stock Alerts', v: lowStock, icon: <AlertCircle size={20} color="#f59e0b" />, color: '#f59e0b' },
        ].map(s => (
          <div key={s.l} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${s.color}18`, border: `1px solid ${s.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {s.icon}
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#e8f5f1' }}>{s.v}</div>
              <div style={{ fontSize: '0.78rem', color: '#7fb3a0' }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Products grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#7fb3a0' }}>Loading inventory...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {products.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                  {p.sport === 'Football' ? '⚽' : p.sport === 'Badminton' ? '🏸' : p.sport === 'Cricket' ? '🏏' : '🏀'}
                </div>
                <span className={`badge ${p.stock < 10 ? 'badge-gold' : 'badge-green'}`}>
                  {p.stock < 10 ? <AlertCircle size={11} /> : <Package size={11} />}
                  {p.stock < 10 ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#e8f5f1', marginBottom: '0.35rem', lineHeight: 1.3 }}>{p.name}</h3>
              <div style={{ display: 'flex', gap: '0.45rem', marginBottom: '0.85rem' }}>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem' }}>{p.sport}</span>
                <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', color: '#7fb3a0', border: '1px solid var(--border-color)', fontSize: '0.7rem' }}>{p.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#10b981' }}>₹{p.price?.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.78rem', color: '#7fb3a0' }}>Stock:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: 'rgba(6,13,13,0.8)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.2rem 0.5rem' }}>
                    <button onClick={() => updateStock(p.id, -1)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>−</button>
                    <span style={{ fontWeight: 800, color: '#e8f5f1', minWidth: '24px', textAlign: 'center' }}>{p.stock}</span>
                    <button onClick={() => updateStock(p.id, 1)} style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontWeight: 800, fontSize: '1rem', lineHeight: 1 }}>+</button>
                  </div>
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ width: '100%' }}>
                <Edit3 size={12} /> Edit Product
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#e8f5f1', marginBottom: '1.25rem' }}>
              ➕ Add New Product
            </h3>
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label className="form-label">Product Name</label>
                <input className="form-input" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Nike Football Size 5" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group"><label className="form-label">Sport</label>
                  <select className="form-select" value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
                    <option>Football</option><option>Badminton</option><option>Cricket</option><option>Basketball</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Category</label>
                  <select className="form-select" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                    <option>Gear</option><option>Racket</option><option>Footwear</option><option>Apparel</option><option>Accessories</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Price (₹)</label>
                  <input className="form-input" type="number" required value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group"><label className="form-label">Initial Stock</label>
                  <input className="form-input" type="number" required value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} placeholder="0" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Add Product</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
