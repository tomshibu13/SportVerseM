const Product = require('../models/Product');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');

const initialProducts = [
  {
    product_id: 101,
    title: 'Yonex Astrox 100 ZZ',
    category: 'Badminton Racket',
    sport: 'Badminton',
    price: 12999,
    original_price: 14499,
    rating: 4.9,
    reviews: 142,
    image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
    description: 'High-end offensive badminton racket with Hyper Slim Shaft and Namd graphite for relentless steep smashes.',
    stock: 15,
    shop_owner_id: 3
  },
  {
    product_id: 102,
    title: 'Asics Gel Rocket 11 Indoor Court Shoes',
    category: 'Badminton Shoes',
    sport: 'Badminton',
    price: 4299,
    original_price: 4999,
    rating: 4.7,
    reviews: 89,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
    description: 'Non-marking gum rubber sole engineered for indoor badminton, squash, and volleyball courts with Gel cushioning.',
    stock: 28,
    shop_owner_id: 3
  },
  {
    product_id: 103,
    title: 'Yonex Mavis 350 Nylon Shuttlecocks (Pack of 6)',
    category: 'Badminton Accessories',
    sport: 'Badminton',
    price: 999,
    original_price: 1199,
    rating: 4.8,
    reviews: 310,
    image: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=800&q=80',
    description: 'Precision-manufactured slow/medium speed nylon shuttlecocks with natural cork base for authentic flight trajectory.',
    stock: 75,
    shop_owner_id: 3
  },
  {
    product_id: 201,
    title: 'SG Sunny Tonny Classic Cricket Bat',
    category: 'Cricket Bat',
    sport: 'Cricket',
    price: 8499,
    original_price: 9999,
    rating: 4.8,
    reviews: 64,
    image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
    description: 'Finest Grade 1 English Willow cricket bat with balanced pick-up, massive edges, and Singapore cane handle.',
    stock: 12,
    shop_owner_id: 3
  },
  {
    product_id: 202,
    title: 'Kookaburra Turf Regulation White Leather Cricket Ball',
    category: 'Cricket Equipment',
    sport: 'Cricket',
    price: 1299,
    original_price: 1599,
    rating: 4.7,
    reviews: 45,
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
    description: 'Four-piece alum tanned white leather construction with hand-stitched seam for T20 & day-night tournaments.',
    stock: 50,
    shop_owner_id: 3
  },
  {
    product_id: 301,
    title: 'Nike Strike Pro Match Football',
    category: 'Football',
    sport: 'Football',
    price: 1499,
    original_price: 1999,
    rating: 4.8,
    reviews: 112,
    image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80',
    description: 'Textured casing with Nike Aerowsculpt grooves for consistent spin, touch, and pinpoint shot accuracy.',
    stock: 40,
    shop_owner_id: 3
  },
  {
    product_id: 302,
    title: 'Nivia Ashtang 2.0 Official Match Ball',
    category: 'Football',
    sport: 'Football',
    price: 1249,
    original_price: 1599,
    rating: 4.6,
    reviews: 78,
    image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=80',
    description: 'FIFA Quality Pro certified micro-fiber composite leather football for all-weather competitive play.',
    stock: 35,
    shop_owner_id: 3
  },
  {
    product_id: 303,
    title: 'Puma Future 7 Play FG Turf Cleats',
    category: 'Football Shoes',
    sport: 'Football',
    price: 3799,
    original_price: 4999,
    rating: 4.7,
    reviews: 53,
    image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
    description: 'Lightweight synthetic upper with PWRTAPE support and multi-ground stud configuration for firm ground & artificial turf.',
    stock: 22,
    shop_owner_id: 3
  },
  {
    product_id: 401,
    title: 'Spalding TF-1000 Legacy Basketball',
    category: 'Basketball',
    sport: 'Basketball',
    price: 2899,
    original_price: 3499,
    rating: 4.9,
    reviews: 95,
    image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
    description: 'Exclusive ZK microfiber composite leather cover with deep channel design for superior moisture management and grip.',
    stock: 20,
    shop_owner_id: 3
  },
  {
    product_id: 501,
    title: 'Wilson Clash 100 V2 Tennis Racket',
    category: 'Tennis Racket',
    sport: 'Tennis',
    price: 14999,
    original_price: 17499,
    rating: 4.8,
    reviews: 41,
    image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
    description: 'Patented FORTYFIVE frame technology combining unmatched flexibility with explosive stability on every swing.',
    stock: 10,
    shop_owner_id: 3
  },
  {
    product_id: 502,
    title: 'Wilson US Open Championship Tennis Balls (4-Pack)',
    category: 'Tennis Equipment',
    sport: 'Tennis',
    price: 599,
    original_price: 799,
    rating: 4.7,
    reviews: 160,
    image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?auto=format&fit=crop&w=800&q=80',
    description: 'Official ball of the US Open crafted with premium heavy-duty Tex/Tech wool felt.',
    stock: 60,
    shop_owner_id: 3
  },
  {
    product_id: 601,
    title: 'Nike Dri-FIT Pro Athlete Training Jersey',
    category: 'Sportswear',
    sport: 'Apparel',
    price: 1695,
    original_price: 2195,
    rating: 4.8,
    reviews: 130,
    image: 'https://images.unsplash.com/photo-1511746315387-c4a76990fdce?auto=format&fit=crop&w=800&q=80',
    description: 'Breathable sweat-wicking knit fabric keeps you cool and dry during intense match play.',
    stock: 45,
    shop_owner_id: 3
  },
  {
    product_id: 701,
    title: 'SportVerse Pro Insulated Thermal Sports Bottle (1L)',
    category: 'Accessories',
    sport: 'Accessories',
    price: 799,
    original_price: 1099,
    rating: 4.9,
    reviews: 210,
    image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
    description: 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks icy cold for 24 hours or hot for 12 hours.',
    stock: 80,
    shop_owner_id: 3
  }
];

const seedProductsIfEmpty = async () => {
  try {
    const count = await Product.countDocuments();
    if (count === 0) {
      console.log('Seeding initial sports gear catalog to MongoDB...');
      await Product.insertMany(initialProducts);
      console.log('Products seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding products:', err.message);
  }
};

exports.seedProductsIfEmpty = seedProductsIfEmpty;

// ── GET /api/products ──
exports.getAllProducts = async (req, res) => {
  try {
    const { category, sport, search } = req.query;
    await seedProductsIfEmpty();

    let query = {};
    if (category && category !== 'All' && category !== 'More') {
      query.$or = [
        { category: { $regex: new RegExp(category, 'i') } },
        { sport: { $regex: new RegExp(category, 'i') } },
        { title: { $regex: new RegExp(category, 'i') } }
      ];
    }

    if (sport && sport !== 'All') {
      query.sport = { $regex: new RegExp(`^${sport}$`, 'i') };
    }

    if (search && search.trim().length > 0) {
      const term = search.trim();
      query.$or = [
        { title: { $regex: new RegExp(term, 'i') } },
        { category: { $regex: new RegExp(term, 'i') } },
        { sport: { $regex: new RegExp(term, 'i') } },
        { description: { $regex: new RegExp(term, 'i') } }
      ];
    }

    const products = await Product.find(query).sort({ created_at: -1 });
    return res.json({ success: true, count: products.length, products });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/products/:id ──
exports.getProductById = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.findOne({
      $or: [
        { product_id: Number(id) || 0 },
        { _id: id }
      ]
    });

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    return res.json({ success: true, product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/products ──
exports.createProduct = async (req, res) => {
  try {
    const productTitle = req.body.title || req.body.name || 'New Sports Gear';
    const productCategory = req.body.category || req.body.sport || 'Gear';
    const productSport = req.body.sport || req.body.category || 'All';
    const productPrice = Number(req.body.price) || 999;
    const originalPrice = Number(req.body.original_price || req.body.originalPrice) || Math.round(productPrice * 1.25);
    const stockQty = Number(req.body.stock) || 10;

    const newProd = {
      product_id: Date.now(),
      title: productTitle,
      category: productCategory,
      sport: productSport,
      price: productPrice,
      original_price: originalPrice,
      rating: 4.8,
      reviews: 1,
      image: req.body.image || 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
      description: req.body.description || `High performance ${productCategory} sports equipment.`,
      stock: stockQty,
      shop_owner_id: req.body.shop_owner_id || 3
    };

    const product = new Product(newProd);
    await product.save();

    return res.status(201).json({ success: true, message: 'Product added to MongoDB marketplace', product });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── POST /api/orders (Create Order) ──
exports.createOrder = async (req, res) => {
  try {
    const {
      userId,
      user_id,
      customerName,
      customer_name,
      customerPhone,
      customer_phone,
      items = [],
      totalAmount,
      total_amount,
      deliveryAddress,
      delivery_address,
      paymentMethod,
      payment_method
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required to place an order.' });
    }

    const calculatedTotal = Number(totalAmount || total_amount) || items.reduce((sum, it) => sum + (Number(it.price) * (Number(it.quantity) || 1)), 0);
    const orderId = Date.now();
    const orderRef = `SV-ORD-${Math.floor(100000 + Math.random() * 900000)}`;

    const deliveryDays = 3;
    const estDate = new Date(Date.now() + deliveryDays * 24 * 60 * 60 * 1000);
    const estDateStr = estDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

    const orderData = {
      order_id: orderId,
      user_id: userId || user_id || 'guest_user_1',
      customer_name: customerName || customer_name || 'SportVerse Athlete',
      customer_phone: customerPhone || customer_phone || '+91 98765 43210',
      order_reference: orderRef,
      total_amount: calculatedTotal,
      items: items.map(item => ({
        product_id: Number(item.product_id || item.productId || item.id) || Date.now(),
        title: item.title || item.name || 'Sports Item',
        category: item.category || 'Gear',
        sport: item.sport || 'Sports',
        price: Number(item.price) || 0,
        quantity: Number(item.quantity) || 1,
        image: item.image || ''
      })),
      delivery_address: deliveryAddress || delivery_address || 'SportVerse Central Hub, Sector 4',
      payment_method: paymentMethod || payment_method || 'UPI / Online Payment',
      payment_status: 'Paid',
      order_status: 'Confirmed',
      estimated_delivery: estDateStr,
      created_at: new Date()
    };

    const newOrder = new Order(orderData);
    await newOrder.save();

    // Optionally save items to OrderItem collection
    for (const item of orderData.items) {
      try {
        await OrderItem.create({
          order_item_id: Date.now() + Math.floor(Math.random() * 1000),
          order_id: orderId,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.price
        });
      } catch (_) {}
    }

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: newOrder
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/orders/user/:userId ──
exports.getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({
      $or: [
        { user_id: userId },
        { user_id: String(userId) },
        { user_id: Number(userId) || -1 }
      ]
    }).sort({ created_at: -1 });

    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── GET /api/orders (All Orders for Admin / Shop Owners) ──
exports.getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find().sort({ created_at: -1 });
    return res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
