const mongoose = require('mongoose');
const productSchema = new mongoose.Schema({
  product_id: { type: Number },
  image: { type: String }
}, { strict: false });
const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

mongoose.connect('mongodb://127.0.0.1:27017/sportverse', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    // 103: Yonex Racket (Badminton related image)
    await Product.updateOne(
        { product_id: 103 },
        { $set: { image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a631d1?auto=format&fit=crop&w=600&q=80' } }
    );
    // 104: Mavis Shuttlecocks (Badminton shuttlecock image)
    await Product.updateOne(
      { product_id: 104 },
      { $set: { image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=600&q=80' } }
    );
    // Just to be safe, update the image if the 1622279457486 ID is bad. Let's use a standard generic racket image for 103.
    await Product.updateOne(
      { product_id: 103 },
      { $set: { image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80' } }
    );
    console.log('Fixed images correctly');
    process.exit(0);
  });
