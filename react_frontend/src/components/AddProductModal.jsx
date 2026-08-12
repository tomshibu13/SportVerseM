import React, { useState } from 'react';
import Modal from './Modal';
import { Plus } from 'lucide-react';

export default function AddProductModal({ isOpen, onClose, onAddProduct }) {
  const [prod, setProd] = useState({
    title: '',
    category: 'Football',
    price: 1299,
    original_price: 1599,
    stock: 25,
    description: '',
    image: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!prod.title) return;

    onAddProduct({
      ...prod,
      price: Number(prod.price),
      original_price: Number(prod.original_price),
      stock: Number(prod.stock),
      image: prod.image || 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Gear to Pro-Shop">
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Product Name</label>
          <input
            type="text"
            className="input-field"
            placeholder="e.g. Speedster Grip Gloves"
            value={prod.title}
            onChange={(e) => setProd({ ...prod, title: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select
              className="select-field"
              value={prod.category}
              onChange={(e) => setProd({ ...prod, category: e.target.value })}
            >
              <option value="Football">Football</option>
              <option value="Rackets">Rackets</option>
              <option value="Shoes">Shoes</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input
              type="number"
              className="input-field"
              value={prod.stock}
              onChange={(e) => setProd({ ...prod, stock: e.target.value })}
              required
            />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Selling Price (₹)</label>
            <input
              type="number"
              className="input-field"
              value={prod.price}
              onChange={(e) => setProd({ ...prod, price: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Original MRP (₹)</label>
            <input
              type="number"
              className="input-field"
              value={prod.original_price}
              onChange={(e) => setProd({ ...prod, original_price: e.target.value })}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Image URL</label>
          <input
            type="url"
            className="input-field"
            placeholder="https://images.unsplash.com/..."
            value={prod.image}
            onChange={(e) => setProd({ ...prod, image: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea
            className="textarea-field"
            rows="3"
            placeholder="Brief details about the sports item..."
            value={prod.description}
            onChange={(e) => setProd({ ...prod, description: e.target.value })}
          ></textarea>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            <Plus size={16} />
            Save Product
          </button>
        </div>
      </form>
    </Modal>
  );
}
