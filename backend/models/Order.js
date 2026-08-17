const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  order_id: { type: Number, required: true, unique: true },
  user_id: { type: mongoose.Schema.Types.Mixed, required: true },
  customer_name: { type: String, default: 'SportVerse Athlete' },
  customer_phone: { type: String, default: '' },
  order_reference: { type: String, required: true, unique: true },
  total_amount: { type: Number, required: true },
  items: [
    {
      product_id: { type: Number },
      title: { type: String, required: true },
      category: { type: String },
      sport: { type: String },
      price: { type: Number, required: true },
      quantity: { type: Number, default: 1 },
      image: { type: String }
    }
  ],
  delivery_address: { type: String, default: 'SportVerse Arena Hub, Tech Park' },
  payment_method: { type: String, default: 'UPI / Online' },
  payment_status: { type: String, default: 'Paid' },
  order_status: { type: String, default: 'Confirmed' },
  estimated_delivery: { type: String },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
