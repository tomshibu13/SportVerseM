const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  product_id: { type: Number },
  image: { type: String }
}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

mongoose.connect('mongodb://127.0.0.1:27017/sportverse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // 106: Wristbands
    await Product.updateOne(
      { product_id: 106 },
      { $set: { image: 'https://images.unsplash.com/photo-1549476464-37392f717541?auto=format&fit=crop&w=600&q=80' } }
    );
    // 107: Tennis Racket
    await Product.updateOne(
      { product_id: 107 },
      { $set: { image: 'https://images.unsplash.com/photo-1617150172054-94e824853da9?auto=format&fit=crop&w=600&q=80' } }
    );
    console.log('Fixed images correctly');
    process.exit(0);
  });
