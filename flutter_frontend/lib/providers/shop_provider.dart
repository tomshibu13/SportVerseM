import 'package:flutter/material.dart';
import '../models/product_model.dart';
import '../services/api_service.dart';

class ShopCartItem {
  final ProductModel product;
  int quantity;
  final String? size;

  ShopCartItem({
    required this.product,
    this.quantity = 1,
    this.size,
  });

  double get totalPrice => product.price * quantity;

  Map<String, dynamic> toJson() {
    return {
      'product_id': product.productId,
      'title': product.title,
      'category': product.category,
      'sport': product.sport,
      'price': product.price,
      'quantity': quantity,
      'image': product.image,
      if (size != null) 'size': size,
    };
  }
}

class ShopProvider with ChangeNotifier {
  List<ProductModel> _products = [];
  final List<ShopCartItem> _cartItems = [];
  final Set<int> _favoriteProductIds = {};
  List<Map<String, dynamic>> _userOrders = [];
  bool _isLoading = false;
  bool _isCheckingOut = false;
  String _selectedCategory = 'All';
  String _searchQuery = '';

  List<ProductModel> get products => _filteredProducts;
  List<ProductModel> get allProducts => _products;
  List<ShopCartItem> get cartItems => _cartItems;
  Set<int> get favoriteProductIds => _favoriteProductIds;
  List<Map<String, dynamic>> get userOrders => _userOrders;
  bool get isLoading => _isLoading;
  bool get isCheckingOut => _isCheckingOut;
  String get selectedCategory => _selectedCategory;
  String get searchQuery => _searchQuery;

  int get cartCount => _cartItems.fold(0, (sum, it) => sum + it.quantity);
  double get cartSubtotal => _cartItems.fold(0.0, (sum, it) => sum + it.totalPrice);
  double get deliveryFee => cartSubtotal > 999 || cartSubtotal == 0 ? 0.0 : 99.0;
  double get grandTotal => cartSubtotal + deliveryFee;

  List<ProductModel> get _filteredProducts {
    var list = _products;
    if (_selectedCategory != 'All' && _selectedCategory != 'More') {
      list = list.where((p) {
        final catMatch = p.category.toLowerCase().contains(_selectedCategory.toLowerCase());
        final sportMatch = p.sport.toLowerCase().contains(_selectedCategory.toLowerCase());
        final titleMatch = p.title.toLowerCase().contains(_selectedCategory.toLowerCase());
        return catMatch || sportMatch || titleMatch;
      }).toList();
    }

    if (_searchQuery.trim().isNotEmpty) {
      final q = _searchQuery.trim().toLowerCase();
      list = list.where((p) {
        return p.title.toLowerCase().contains(q) ||
            p.category.toLowerCase().contains(q) ||
            p.sport.toLowerCase().contains(q) ||
            p.description.toLowerCase().contains(q);
      }).toList();
    }

    return list;
  }

  List<ProductModel> get bestSellers {
    final list = List<ProductModel>.from(_products);
    list.sort((a, b) => b.rating.compareTo(a.rating));
    return list.take(8).toList();
  }

  List<ProductModel> get favoriteProducts {
    return _products.where((p) => _favoriteProductIds.contains(p.productId)).toList();
  }

  ShopProvider() {
    loadProducts();
  }

  void setSelectedCategory(String cat) {
    _selectedCategory = cat;
    notifyListeners();
    loadProducts(silent: true);
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> loadProducts({bool silent = false}) async {
    if (!silent) {
      _isLoading = true;
      notifyListeners();
    }

    try {
      final fetched = await ApiService.fetchProducts(
        category: _selectedCategory,
        search: _searchQuery,
      );

      if (fetched.isNotEmpty) {
        _products = fetched;
      } else if (_products.isEmpty) {
        // Fallback default list if backend is loading
        _products = _defaultCatalog;
      }
    } catch (_) {
      if (_products.isEmpty) {
        _products = _defaultCatalog;
      }
    }

    _isLoading = false;
    notifyListeners();
  }

  // ── CART ACTIONS ──
  void addToCart(ProductModel product, {int quantity = 1, String? size}) {
    final idx = _cartItems.indexWhere((it) => it.product.productId == product.productId && it.size == size);
    if (idx >= 0) {
      _cartItems[idx].quantity += quantity;
    } else {
      _cartItems.add(ShopCartItem(product: product, quantity: quantity, size: size));
    }
    notifyListeners();
  }

  void incrementQuantity(int productId, {String? size}) {
    final idx = _cartItems.indexWhere((it) => it.product.productId == productId && it.size == size);
    if (idx >= 0) {
      _cartItems[idx].quantity++;
      notifyListeners();
    }
  }

  void decrementQuantity(int productId, {String? size}) {
    final idx = _cartItems.indexWhere((it) => it.product.productId == productId && it.size == size);
    if (idx >= 0) {
      if (_cartItems[idx].quantity > 1) {
        _cartItems[idx].quantity--;
      } else {
        _cartItems.removeAt(idx);
      }
      notifyListeners();
    }
  }

  void removeFromCart(int productId, {String? size}) {
    _cartItems.removeWhere((it) => it.product.productId == productId && it.size == size);
    notifyListeners();
  }

  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }

  // ── FAVORITE / WISHLIST ACTIONS ──
  bool isFavorite(int productId) => _favoriteProductIds.contains(productId);

  void toggleFavorite(int productId) {
    if (_favoriteProductIds.contains(productId)) {
      _favoriteProductIds.remove(productId);
    } else {
      _favoriteProductIds.add(productId);
    }
    notifyListeners();
  }

  // ── CHECKOUT & ORDERS ──
  Future<Map<String, dynamic>> checkout({
    dynamic userId = 'guest_user_1',
    String customerName = 'SportVerse Athlete',
    String customerPhone = '+91 98765 43210',
    required String deliveryAddress,
    String paymentMethod = 'UPI / Online Payment',
  }) async {
    if (_cartItems.isEmpty) {
      return {'success': false, 'message': 'Cart is empty'};
    }

    _isCheckingOut = true;
    notifyListeners();

    final orderItems = _cartItems.map((it) => it.toJson()).toList();
    final total = grandTotal;

    final result = await ApiService.createOrder(
      userId: userId,
      customerName: customerName,
      customerPhone: customerPhone,
      items: orderItems,
      totalAmount: total,
      deliveryAddress: deliveryAddress,
      paymentMethod: paymentMethod,
    );

    _isCheckingOut = false;
    if (result['success'] == true) {
      if (result['order'] != null) {
        _userOrders.insert(0, Map<String, dynamic>.from(result['order']));
      }
      _cartItems.clear();
      notifyListeners();
      return result;
    }

    notifyListeners();
    return result;
  }

  Future<void> loadUserOrders(dynamic userId) async {
    try {
      final orders = await ApiService.fetchUserOrders(userId);
      _userOrders = orders;
      notifyListeners();
    } catch (_) {}
  }

  // Fallback initial catalog
  static final List<ProductModel> _defaultCatalog = [
    ProductModel(
      productId: 101,
      title: 'Yonex Astrox 100 ZZ',
      category: 'Badminton Racket',
      sport: 'Badminton',
      price: 12999,
      originalPrice: 14499,
      rating: 4.9,
      reviews: 142,
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
      description: 'High-end offensive badminton racket with Hyper Slim Shaft and Namd graphite for relentless steep smashes.',
      stock: 15,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 102,
      title: 'Asics Gel Rocket 11 Indoor Shoes',
      category: 'Badminton Shoes',
      sport: 'Badminton',
      price: 4299,
      originalPrice: 4999,
      rating: 4.7,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
      description: 'Non-marking gum rubber sole engineered for indoor badminton, squash, and volleyball courts with Gel cushioning.',
      stock: 28,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 103,
      title: 'Yonex Mavis 350 Shuttlecocks (Pack of 6)',
      category: 'Badminton Accessories',
      sport: 'Badminton',
      price: 999,
      originalPrice: 1199,
      rating: 4.8,
      reviews: 310,
      image: 'https://images.unsplash.com/photo-1613918108466-292b78a8ef95?auto=format&fit=crop&w=800&q=80',
      description: 'Precision-manufactured slow/medium speed nylon shuttlecocks with natural cork base for authentic flight trajectory.',
      stock: 75,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 201,
      title: 'SG Sunny Tonny Classic Cricket Bat',
      category: 'Cricket Bat',
      sport: 'Cricket',
      price: 8499,
      originalPrice: 9999,
      rating: 4.8,
      reviews: 64,
      image: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80',
      description: 'Finest Grade 1 English Willow cricket bat with balanced pick-up, massive edges, and Singapore cane handle.',
      stock: 12,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 301,
      title: 'Nike Strike Pro Match Football',
      category: 'Football',
      sport: 'Football',
      price: 1499,
      originalPrice: 1999,
      rating: 4.8,
      reviews: 112,
      image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80',
      description: 'Textured casing with Nike Aerowsculpt grooves for consistent spin, touch, and pinpoint shot accuracy.',
      stock: 40,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 303,
      title: 'Puma Future 7 Play FG Turf Cleats',
      category: 'Football Shoes',
      sport: 'Football',
      price: 3799,
      originalPrice: 4999,
      rating: 4.7,
      reviews: 53,
      image: 'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&w=800&q=80',
      description: 'Lightweight synthetic upper with PWRTAPE support and multi-ground stud configuration for firm ground & artificial turf.',
      stock: 22,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 401,
      title: 'Spalding TF-1000 Legacy Basketball',
      category: 'Basketball',
      sport: 'Basketball',
      price: 2899,
      originalPrice: 3499,
      rating: 4.9,
      reviews: 95,
      image: 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
      description: 'Exclusive ZK microfiber composite leather cover with deep channel design for superior moisture management and grip.',
      stock: 20,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 501,
      title: 'Wilson Clash 100 V2 Tennis Racket',
      category: 'Tennis Racket',
      sport: 'Tennis',
      price: 14999,
      originalPrice: 17499,
      rating: 4.8,
      reviews: 41,
      image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80',
      description: 'Patented FORTYFIVE frame technology combining unmatched flexibility with explosive stability on every swing.',
      stock: 10,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 601,
      title: 'Nike Dri-FIT Pro Athlete Training Jersey',
      category: 'Sportswear',
      sport: 'Apparel',
      price: 1695,
      originalPrice: 2195,
      rating: 4.8,
      reviews: 130,
      image: 'https://images.unsplash.com/photo-1511746315387-c4a76990fdce?auto=format&fit=crop&w=800&q=80',
      description: 'Breathable sweat-wicking knit fabric keeps you cool and dry during intense match play.',
      stock: 45,
      shopOwnerId: 3,
    ),
    ProductModel(
      productId: 701,
      title: 'SportVerse Pro Insulated Sports Bottle (1L)',
      category: 'Accessories',
      sport: 'Accessories',
      price: 799,
      originalPrice: 1099,
      rating: 4.9,
      reviews: 210,
      image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
      description: 'Double-wall vacuum insulated stainless steel bottle. Keeps drinks icy cold for 24 hours.',
      stock: 80,
      shopOwnerId: 3,
    )
  ];
}
