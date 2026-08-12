import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';

class ShopScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const ShopScreen({super.key, this.onBack});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  String _selectedCategory = 'All';
  int _cartItemCount = 2;
  final Set<int> _favoriteProductIds = {1, 3}; // Mock favorite ids

  // Categories matching the screenshot
  final List<Map<String, dynamic>> _categories = [
    {'name': 'All', 'icon': Icons.grid_view_rounded},
    {'name': 'Badminton', 'icon': Icons.sports_tennis_rounded},
    {'name': 'Cricket', 'icon': Icons.sports_cricket_rounded},
    {'name': 'Football', 'icon': Icons.sports_soccer_rounded},
    {'name': 'Basketball', 'icon': Icons.sports_basketball_rounded},
    {'name': 'Tennis', 'icon': Icons.sports_baseball_rounded},
    {'name': 'More', 'icon': Icons.more_horiz_rounded},
  ];

  // Best Sellers Products matching the reference design image
  final List<Map<String, dynamic>> _bestSellers = [
    {
      'id': 1,
      'title': 'Yonex Astrox 100 ZZ',
      'category': 'Badminton Racket',
      'sport': 'Badminton',
      'rating': 4.8,
      'reviews': 120,
      'price': 12999,
      'originalPrice': 14499,
      'discount': '10% OFF',
      'image':
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 2,
      'title': 'Asics Gel Rocket 11',
      'category': 'Badminton Shoes',
      'sport': 'Badminton',
      'rating': 4.6,
      'reviews': 89,
      'price': 4299,
      'originalPrice': 4999,
      'discount': null,
      'image':
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 3,
      'title': 'SG Sunny Tonny',
      'category': 'Cricket Bat',
      'sport': 'Cricket',
      'rating': 4.7,
      'reviews': 64,
      'price': 8499,
      'originalPrice': 9999,
      'discount': '15% OFF',
      'image':
          'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=600&q=80',
    },
    {
      'id': 4,
      'title': 'Nivia Ashtang 2.0',
      'category': 'Football',
      'sport': 'Football',
      'rating': 4.5,
      'reviews': 76,
      'price': 1499,
      'originalPrice': 1999,
      'discount': null,
      'image':
          'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    },
  ];

  // Shop By Collection data
  final List<Map<String, dynamic>> _collections = [
    {
      'title': 'Rackets',
      'bgGradient': const [Color(0xFF1B1B1E), Color(0xFF2C2C34)],
      'image':
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    },
    {
      'title': 'Footwear',
      'bgGradient': const [Color(0xFF283618), Color(0xFF384E20)],
      'image':
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      'title': 'Sportswear',
      'bgGradient': const [Color(0xFF14213D), Color(0xFF243B6A)],
      'image':
          'https://images.unsplash.com/photo-1511746315387-c4a76990fdce?auto=format&fit=crop&w=600&q=80',
    },
  ];

  List<Map<String, dynamic>> get _filteredProducts {
    if (_selectedCategory == 'All') return _bestSellers;
    return _bestSellers.where((p) {
      return p['sport'].toString().toLowerCase() ==
          _selectedCategory.toLowerCase();
    }).toList();
  }

  void _addToCart(Map<String, dynamic> product) {
    setState(() {
      _cartItemCount++;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product['title']} added to your cart!'),
        backgroundColor: AppColors.primaryBlack,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  void _toggleFavorite(int id) {
    setState(() {
      if (_favoriteProductIds.contains(id)) {
        _favoriteProductIds.remove(id);
      } else {
        _favoriteProductIds.add(id);
      }
    });
  }

  void _openProductDetailsModal(Map<String, dynamic> product) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildProductDetailSheet(product),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      body: SafeArea(
        child: Column(
          children: [
            // ── 1. TOP NAVBAR HEADER ──
            _buildTopAppBar(),

            // ── SCROLLABLE SHOP CONTENT ──
            Expanded(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 8),

                    // ── 2. HERO FEATURED CAROUSEL BANNER ──
                    _buildHeroBanner(),

                    const SizedBox(height: 20),

                    // ── 3. HORIZONTAL CATEGORIES BAR ──
                    _buildCategoryFilterBar(),

                    const SizedBox(height: 20),

                    // ── 4. TRUST / VALUE PROPOSITION BAR ──
                    _buildTrustFeatureBar(),

                    const SizedBox(height: 24),

                    // ── 5. BEST SELLERS SECTION ──
                    _buildSectionHeader(
                      title: 'Best Sellers',
                      onViewAll: () {},
                    ),
                    const SizedBox(height: 12),
                    _buildBestSellersGrid(),

                    const SizedBox(height: 24),

                    // ── 6. SHOP BY COLLECTION SECTION ──
                    _buildSectionHeader(
                      title: 'Shop By Collection',
                      onViewAll: () {},
                    ),
                    const SizedBox(height: 12),
                    _buildCollectionCarousel(),

                    const SizedBox(height: 100),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 1. Top App Bar Row ──
  Widget _buildTopAppBar() {
    return TopNavigationBar(
      onMenuPressed: widget.onBack,
      showCart: true,
      cartCount: _cartItemCount,
    );
  }

  // ── 2. Hero Banner Card ──
  Widget _buildHeroBanner() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 185,
        width: double.infinity,
        decoration: BoxDecoration(
          color: const Color(0xFF0F1015),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        child: Stack(
          children: [
            // Banner Background Image (Yonex Badminton Racket & Kit)
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: MediaQuery.of(context).size.width * 0.52,
              child: ClipRRect(
                borderRadius: const BorderRadius.horizontal(
                  right: Radius.circular(20),
                ),
                child: Image.network(
                  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1B1D25),
                    child: const Icon(Icons.sports_tennis,
                        size: 64, color: Color(0xFFC8895B)),
                  ),
                ),
              ),
            ),

            // Left Text Content Overlay
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text(
                    'NEW ARRIVAL',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFFC8895B),
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Unleash Your\nBest Performance',
                    style: TextStyle(
                      fontSize: 19,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.25,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Premium gear for every athlete',
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.white70,
                    ),
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8895B),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 8),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(20),
                      ),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Shop Now',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        SizedBox(width: 6),
                        Icon(Icons.arrow_forward_rounded, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            // Banner Dots Indicator at Bottom Center
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(4, (index) {
                  final isActive = index == 1;
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: isActive ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: isActive
                          ? const Color(0xFFC8895B)
                          : Colors.white.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(3),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 3. Horizontal Category Circles Filter Bar ──
  Widget _buildCategoryFilterBar() {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 16),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = _selectedCategory == cat['name'];

          return InkWell(
            onTap: () => setState(() => _selectedCategory = cat['name'] as String),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 58,
                  height: 58,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected
                          ? const Color(0xFFC8895B)
                          : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: isSelected
                            ? const Color(0xFFC8895B).withValues(alpha: 0.25)
                            : Colors.black.withValues(alpha: 0.03),
                        blurRadius: isSelected ? 8 : 4,
                        offset: const Offset(0, 3),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Icon(
                      cat['icon'] as IconData,
                      size: 24,
                      color: isSelected
                          ? const Color(0xFFC8895B)
                          : AppColors.primaryBlack,
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  cat['name'] as String,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected
                        ? const Color(0xFFC8895B)
                        : AppColors.primaryBlack,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── 4. Trust / Value Proposition Feature Highlights Bar ──
  Widget _buildTrustFeatureBar() {
    final items = [
      {
        'icon': Icons.local_shipping_outlined,
        'title': 'Free Delivery',
        'sub': 'On orders above ₹999',
      },
      {
        'icon': Icons.verified_user_outlined,
        'title': '100% Original',
        'sub': 'Genuine products only',
      },
      {
        'icon': Icons.autorenew_rounded,
        'title': 'Easy Returns',
        'sub': '7 days return policy',
      },
      {
        'icon': Icons.headset_mic_outlined,
        'title': 'Support 24/7',
        'sub': 'We are here to help you',
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          physics: const BouncingScrollPhysics(),
          child: Row(
            children: items.map((item) {
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      item['icon'] as IconData,
                      size: 22,
                      color: AppColors.primaryBlack,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      item['title'] as String,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlack,
                        height: 1.1,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      item['sub'] as String,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 9,
                        color: AppColors.mutedText,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }

  // ── Section Header (Title & View All) ──
  Widget _buildSectionHeader(
      {required String title, required VoidCallback onViewAll}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlack,
            ),
          ),
          GestureDetector(
            onTap: onViewAll,
            child: const Row(
              children: [
                Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFFC8895B),
                  ),
                ),
                SizedBox(width: 2),
                Icon(
                  Icons.arrow_forward_ios,
                  size: 10,
                  color: Color(0xFFC8895B),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 5. Best Sellers Product Cards Grid ──
  Widget _buildBestSellersGrid() {
    final products = _filteredProducts;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.58,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
        ),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          final int productId = product['id'];
          final bool isFav = _favoriteProductIds.contains(productId);

          return InkWell(
            onTap: () => _openProductDetailsModal(product),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppColors.borderSubtle),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 8,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Image Thumbnail & Badges
                Expanded(
                  child: Stack(
                    children: [
                      ClipRRect(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(16),
                        ),
                        child: Container(
                          width: double.infinity,
                          color: const Color(0xFFFAFAFA),
                          child: Image.network(
                            product['image'],
                            fit: BoxFit.cover,
                            errorBuilder: (_, __, ___) => Container(
                              color: Colors.grey.shade100,
                              child: const Icon(Icons.sports,
                                  color: AppColors.mutedText),
                            ),
                          ),
                        ),
                      ),

                      // Discount Badge (if any)
                      if (product['discount'] != null)
                        Positioned(
                          top: 8,
                          left: 8,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 6, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFC8895B),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              product['discount'],
                              style: const TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w900,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),

                      // Favorite Heart Button
                      Positioned(
                        top: 8,
                        right: 8,
                        child: GestureDetector(
                          onTap: () => _toggleFavorite(productId),
                          child: Container(
                            padding: const EdgeInsets.all(5),
                            decoration: const BoxDecoration(
                              color: Colors.white,
                              shape: BoxShape.circle,
                            ),
                            child: Icon(
                              isFav
                                  ? Icons.favorite_rounded
                                  : Icons.favorite_border_rounded,
                              size: 16,
                              color: isFav
                                  ? const Color(0xFFE53935)
                                  : AppColors.mutedText,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

                // Product Information Content
                Padding(
                  padding: const EdgeInsets.all(10),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product['title'],
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        product['category'],
                        style: const TextStyle(
                          fontSize: 10,
                          color: AppColors.mutedText,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Rating Row
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              size: 14, color: Color(0xFFFFB300)),
                          const SizedBox(width: 2),
                          Text(
                            '${product['rating']} ',
                            style: const TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlack,
                            ),
                          ),
                          Text(
                            '(${product['reviews']})',
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.mutedText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),

                      // Price & Cart Button Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                '₹${product['price']}',
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlack,
                                ),
                              ),
                              if (product['originalPrice'] != null)
                                Text(
                                  '₹${product['originalPrice']}',
                                  style: const TextStyle(
                                    fontSize: 10,
                                    color: AppColors.mutedText,
                                    decoration: TextDecoration.lineThrough,
                                  ),
                                ),
                            ],
                          ),

                          // Gold Add To Cart Button
                          InkWell(
                            onTap: () => _addToCart(product),
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              padding: const EdgeInsets.all(7),
                              decoration: BoxDecoration(
                                color: const Color(0xFFC8895B),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(
                                Icons.add_shopping_cart_rounded,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
      ),
    );
  }

  // ── 6. Shop By Collection Carousel ──
  Widget _buildCollectionCarousel() {
    return SizedBox(
      height: 125,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _collections.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final col = _collections[index];

          return Container(
            width: 220,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: col['bgGradient'] as List<Color>,
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Stack(
              children: [
                // Collection Background Image Thumbnail
                Positioned(
                  right: -10,
                  top: 0,
                  bottom: 0,
                  width: 110,
                  child: ClipRRect(
                    borderRadius: const BorderRadius.horizontal(
                      right: Radius.circular(16),
                    ),
                    child: Image.network(
                      col['image'],
                      fit: BoxFit.cover,
                    ),
                  ),
                ),

                // Text Overlay Content
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        col['title'],
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Row(
                        children: [
                          Text(
                            'Explore Now',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFFC8895B),
                            ),
                          ),
                          SizedBox(width: 4),
                          Icon(
                            Icons.arrow_forward_rounded,
                            size: 13,
                            color: Color(0xFFC8895B),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Product Details Modal ──
  Widget _buildProductDetailSheet(Map<String, dynamic> product) {
    int qty = 1;
    return StatefulBuilder(
      builder: (context, setModalState) {
        return Container(
          constraints: BoxConstraints(
            maxHeight: MediaQuery.of(context).size.height * 0.85,
          ),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 10, bottom: 8),
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.shade300,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),

                // Product Image
                Stack(
                  children: [
                    Image.network(
                      product['image'],
                      width: double.infinity,
                      height: 220,
                      fit: BoxFit.cover,
                    ),
                    Positioned(
                      top: 12,
                      right: 12,
                      child: CircleAvatar(
                        backgroundColor: Colors.white,
                        child: IconButton(
                          icon: const Icon(Icons.close,
                              color: AppColors.primaryBlack),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                    ),
                  ],
                ),

                Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        product['category'],
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFFC8895B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        product['title'],
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star_rounded,
                              color: Color(0xFFFFB300), size: 18),
                          const SizedBox(width: 4),
                          Text(
                            '${product['rating']} ',
                            style: const TextStyle(
                                fontSize: 14, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            '(${product['reviews']} customer reviews)',
                            style: const TextStyle(
                                fontSize: 12, color: AppColors.mutedText),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Text(
                        '₹${product['price']}',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'Quantity',
                        style: TextStyle(
                            fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove_circle_outline),
                            onPressed: qty > 1
                                ? () => setModalState(() => qty--)
                                : null,
                          ),
                          Text(
                            '$qty',
                            style: const TextStyle(
                                fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add_circle_outline),
                            onPressed: () => setModalState(() => qty++),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      SizedBox(
                        width: double.infinity,
                        height: 52,
                        child: ElevatedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            _addToCart(product);
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFC8895B),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(26),
                            ),
                          ),
                          child: const Text(
                            'Add to Cart',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
