const Product = require('../models/Product');

const mockProducts = [
  {
    product_id: 201,
    title: 'Nike Strike Pro Football',
    category: 'Football',
    price: 1499,
    original_price: 1999,
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    description: 'Thermo-bonded 12-panel construction for true flight and maximum power transfer.',
    stock: 35,
    shop_owner_id: 3
  },
  {
    product_id: 202,
    title: 'Yonex Astrox 88D Pro Racket',
    category: 'Rackets',
    price: 8490,
    original_price: 9990,
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    description: 'Head-heavy badminton racket engineered for aggressive rear-court smashers.',
    stock: 12,
    shop_owner_id: 3
  },
  {
    product_id: 203,
    title: 'Adidas Speedcourt Turf Shoes',
    category: 'Shoes',
    price: 4299,
    original_price: 5499,
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    description: 'Non-marking rubber outsole built specifically for synthetic turf & indoor courts.',
    stock: 20,
    shop_owner_id: 3
  },
  {
    product_id: 204,
    title: 'Wilson US Open Tennis Balls (4-Pack)',
    category: 'Accessories',
    price: 599,
    original_price: 799,
    rating: 4.6,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
    description: 'Premium extra-duty felt designed for hard court durability.',
    stock: 50,
    shop_owner_id: 3
  }
];

exports.getAllProducts = async (req, res) => {
  try {
    const { category } = req.query;
    let products = [...mockProducts];
    if (category && category !== 'All') {
      products = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }
    return res.json({ success: true, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const newProd = {
      product_id: Date.now(),
      title: req.body.title || 'New Sports Gear',
      category: req.body.category || 'Accessories',
      price: Number(req.body.price) || 999,
      original_price: Number(req.body.original_price) || 1299,
      rating: 4.8,
      image: req.body.image || 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
      description: req.body.description || 'High performance sports equipment.',
      stock: Number(req.body.stock) || 10,
      shop_owner_id: 3
    };
    mockProducts.push(newProd);
    return res.status(201).json({ success: true, message: 'Product added to marketplace', product: newProd });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
