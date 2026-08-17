import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product_model.dart';
import '../providers/shop_provider.dart';
import '../services/auth_service.dart';
import '../services/razorpay_service.dart';
import '../theme/app_theme.dart';
import '../widgets/top_navigation_bar.dart';

class ShopScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const ShopScreen({super.key, this.onBack});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _activeFilter = 'All'; // 'All', 'BestSellers', 'Sale', 'Wishlist'

  // Categories matching the design
  final List<Map<String, dynamic>> _categories = [
    {'name': 'All', 'icon': Icons.grid_view_rounded},
    {'name': 'Badminton', 'icon': Icons.sports_tennis_rounded},
    {'name': 'Cricket', 'icon': Icons.sports_cricket_rounded},
    {'name': 'Football', 'icon': Icons.sports_soccer_rounded},
    {'name': 'Basketball', 'icon': Icons.sports_basketball_rounded},
    {'name': 'Tennis', 'icon': Icons.sports_baseball_rounded},
    {'name': 'Sportswear', 'icon': Icons.checkroom_rounded},
    {'name': 'Accessories', 'icon': Icons.fitness_center_rounded},
  ];

  // Shop By Collection data
  final List<Map<String, dynamic>> _collections = [
    {
      'title': 'Rackets',
      'category': 'Badminton',
      'bgGradient': const [Color(0xFF1B1B1E), Color(0xFF2C2C34)],
      'image': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
    },
    {
      'title': 'Footwear',
      'category': 'Shoes',
      'bgGradient': const [Color(0xFF283618), Color(0xFF384E20)],
      'image': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    },
    {
      'title': 'Sportswear',
      'category': 'Sportswear',
      'bgGradient': const [Color(0xFF14213D), Color(0xFF243B6A)],
      'image': 'https://images.unsplash.com/photo-1511746315387-c4a76990fdce?auto=format&fit=crop&w=600&q=80',
    },
    {
      'title': 'Match Balls',
      'category': 'Football',
      'bgGradient': const [Color(0xFF4A154B), Color(0xFF6B1D6D)],
      'image': 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
    },
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ShopProvider>(context, listen: false).loadProducts();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _onAddToCart(BuildContext ctx, ProductModel product, {int qty = 1, String? size}) async {
    final authenticated = await AuthService.requireAuth(
      ctx,
      message: 'Sign in to add items to bag and complete purchases',
    );
    if (!authenticated || !mounted) return;

    final shop = Provider.of<ShopProvider>(context, listen: false);
    shop.addToCart(product, quantity: qty, size: size);

    if (!mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle_outline, color: Colors.greenAccent, size: 20),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Added ${product.title} to bag!',
                style: const TextStyle(fontWeight: FontWeight.w600),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        backgroundColor: AppColors.primaryBlack,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        action: SnackBarAction(
          label: 'View Bag',
          textColor: AppColors.warmAccent,
          onPressed: () => _showCartModal(context),
        ),
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showCartModal(BuildContext ctx) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bCtx) => _CartBottomSheet(
        onProceedToCheckout: () async {
          Navigator.pop(bCtx);
          final authenticated = await AuthService.requireAuth(
            context,
            message: 'Sign in to proceed with order checkout',
          );
          if (authenticated && mounted) {
            _showCheckoutModal(context);
          }
        },
      ),
    );
  }

  Future<void> _showCheckoutModal(BuildContext ctx) async {
    final authenticated = await AuthService.requireAuth(
      ctx,
      message: 'Sign in to checkout and place sports gear orders',
    );
    if (!authenticated || !mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bCtx) => const _CheckoutBottomSheet(),
    );
  }

  Future<void> _showOrdersModal(BuildContext ctx) async {
    final authenticated = await AuthService.requireAuth(
      ctx,
      message: 'Sign in to view your orders and track shipments',
    );
    if (!authenticated || !mounted) return;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bCtx) => const _OrdersBottomSheet(),
    );
  }

  void _openProductDetailsModal(BuildContext ctx, ProductModel product) {
    showModalBottomSheet(
      context: ctx,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (bCtx) => _ProductDetailSheet(
        product: product,
        onAddToCart: (qty, size) => _onAddToCart(context, product, qty: qty, size: size),
        onBuyNow: (qty, size) async {
          final authenticated = await AuthService.requireAuth(
            context,
            message: 'Sign in to purchase ${product.title}',
          );
          if (!authenticated || !mounted) return;
          _onAddToCart(context, product, qty: qty, size: size);
          if (bCtx.mounted) {
            Navigator.pop(bCtx);
          }
          if (mounted) {
            _showCheckoutModal(context);
          }
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final shop = Provider.of<ShopProvider>(context);

    // Filtered product computation based on active tabs
    List<ProductModel> displayedProducts = shop.products;
    if (_activeFilter == 'BestSellers') {
      displayedProducts = shop.bestSellers;
    } else if (_activeFilter == 'Sale') {
      displayedProducts = shop.products.where((p) => p.discount != null).toList();
    } else if (_activeFilter == 'Wishlist') {
      displayedProducts = shop.favoriteProducts;
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      body: SafeArea(
        child: Column(
          children: [
            // ── 1. TOP NAVBAR HEADER ──
            TopNavigationBar(
              onMenuPressed: widget.onBack,
              showCart: true,
              cartCount: shop.cartCount,
              onCartPressed: () => _showCartModal(context),
            ),

            // ── SCROLLABLE SHOP CONTENT ──
            Expanded(
              child: RefreshIndicator(
                color: AppColors.warmAccent,
                onRefresh: () => shop.loadProducts(),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),

                      // ── SEARCH BAR & MY ORDERS LINK ──
                      _buildSearchAndActionBar(context, shop),

                      const SizedBox(height: 12),

                      // ── 2. HERO FEATURED CAROUSEL BANNER ──
                      _buildHeroBanner(context, shop),

                      const SizedBox(height: 20),

                      // ── 3. HORIZONTAL CATEGORIES BAR ──
                      _buildCategoryFilterBar(shop),

                      const SizedBox(height: 16),

                      // ── 4. QUICK FILTER CHIPS (All, Best Sellers, Sale, Wishlist) ──
                      _buildQuickFilterChips(shop),

                      const SizedBox(height: 16),

                      // ── 5. TRUST / VALUE PROPOSITION BAR ──
                      _buildTrustFeatureBar(),

                      const SizedBox(height: 24),

                      // ── 6. PRODUCTS SECTION ──
                      _buildSectionHeader(
                        title: _activeFilter == 'Wishlist'
                            ? 'My Wishlist (${displayedProducts.length})'
                            : _activeFilter == 'BestSellers'
                                ? 'Top Rated Gear'
                                : _activeFilter == 'Sale'
                                    ? 'Special Deals & Offers'
                                    : shop.selectedCategory == 'All'
                                        ? 'All Sports Equipment'
                                        : '${shop.selectedCategory} Gear',
                        subtitle: '${displayedProducts.length} items available',
                        onViewAll: () {
                          setState(() {
                            _activeFilter = 'All';
                            shop.setSelectedCategory('All');
                            _searchController.clear();
                            shop.setSearchQuery('');
                          });
                        },
                      ),
                      const SizedBox(height: 12),

                      if (shop.isLoading)
                        const Padding(
                          padding: EdgeInsets.all(40.0),
                          child: Center(
                            child: CircularProgressIndicator(color: AppColors.warmAccent),
                          ),
                        )
                      else if (displayedProducts.isEmpty)
                        _buildEmptyState(shop)
                      else
                        _buildProductsGrid(context, displayedProducts),

                      const SizedBox(height: 28),

                      // ── 7. SHOP BY COLLECTION SECTION ──
                      _buildSectionHeader(
                        title: 'Shop By Collection',
                        subtitle: 'Curated gear by sport discipline',
                        onViewAll: () {},
                      ),
                      const SizedBox(height: 12),
                      _buildCollectionCarousel(shop),

                      const SizedBox(height: 100),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Search & Orders Bar ──
  Widget _buildSearchAndActionBar(BuildContext context, ShopProvider shop) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(
            child: Container(
              height: 46,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                controller: _searchController,
                onChanged: (val) => shop.setSearchQuery(val),
                decoration: InputDecoration(
                  hintText: 'Search rackets, shoes, jerseys...',
                  hintStyle: const TextStyle(fontSize: 13, color: AppColors.mutedText),
                  prefixIcon: const Icon(Icons.search_rounded, size: 20, color: AppColors.primaryBlack),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18, color: Colors.grey),
                          onPressed: () {
                            _searchController.clear();
                            shop.setSearchQuery('');
                          },
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          InkWell(
            onTap: () => _showOrdersModal(context),
            borderRadius: BorderRadius.circular(14),
            child: Container(
              height: 46,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Row(
                children: [
                  Icon(Icons.receipt_long_outlined, size: 18, color: AppColors.warmAccent),
                  SizedBox(width: 6),
                  Text(
                    'Orders',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── Hero Banner ──
  Widget _buildHeroBanner(BuildContext context, ShopProvider shop) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        height: 180,
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
            // Banner Background Image
            Positioned(
              right: 0,
              top: 0,
              bottom: 0,
              width: MediaQuery.of(context).size.width * 0.50,
              child: ClipRRect(
                borderRadius: const BorderRadius.horizontal(right: Radius.circular(20)),
                child: Image.network(
                  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1B1D25),
                    child: const Icon(Icons.sports_tennis, size: 64, color: Color(0xFFC8895B)),
                  ),
                ),
              ),
            ),

            // Left Content Overlay
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFC8895B).withValues(alpha: 0.2),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: const Color(0xFFC8895B).withValues(alpha: 0.4)),
                    ),
                    child: const Text(
                      'PRO-SHOP NEW ARRIVALS',
                      style: TextStyle(
                        fontSize: 9,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFFC8895B),
                        letterSpacing: 1.2,
                      ),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Unleash Your\nBest Performance',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      if (shop.allProducts.isNotEmpty) {
                        _openProductDetailsModal(context, shop.allProducts.first);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC8895B),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text('Shop Featured', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_rounded, size: 14),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Horizontal Category Filter Bar ──
  Widget _buildCategoryFilterBar(ShopProvider shop) {
    return SizedBox(
      height: 90,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _categories.length,
        separatorBuilder: (_, __) => const SizedBox(width: 14),
        itemBuilder: (context, index) {
          final cat = _categories[index];
          final isSelected = shop.selectedCategory == cat['name'];

          return InkWell(
            onTap: () {
              setState(() => _activeFilter = 'All');
              shop.setSelectedCategory(cat['name'] as String);
            },
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFFC8895B) : Colors.white,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: isSelected ? const Color(0xFFC8895B) : AppColors.border,
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
                      color: isSelected ? Colors.white : AppColors.primaryBlack,
                    ),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  cat['name'] as String,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? const Color(0xFFC8895B) : AppColors.primaryBlack,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Quick Filter Chips ──
  Widget _buildQuickFilterChips(ShopProvider shop) {
    final chips = [
      {'key': 'All', 'label': 'All Gear', 'icon': Icons.grid_view},
      {'key': 'BestSellers', 'label': '🔥 Best Sellers', 'icon': Icons.local_fire_department},
      {'key': 'Sale', 'label': '🏷️ Deals & Discounts', 'icon': Icons.percent},
      {'key': 'Wishlist', 'label': '❤️ Wishlist (${shop.favoriteProductIds.length})', 'icon': Icons.favorite},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: chips.map((c) {
          final isSelected = _activeFilter == c['key'];
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: FilterChip(
              selected: isSelected,
              label: Text(
                c['label'] as String,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                  color: isSelected ? Colors.white : AppColors.primaryBlack,
                ),
              ),
              backgroundColor: Colors.white,
              selectedColor: AppColors.primaryBlack,
              checkmarkColor: Colors.white,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(20),
                side: BorderSide(color: isSelected ? AppColors.primaryBlack : AppColors.border),
              ),
              onSelected: (_) {
                setState(() => _activeFilter = c['key'] as String);
              },
            ),
          );
        }).toList(),
      ),
    );
  }

  // ── Value Proposition Bar ──
  Widget _buildTrustFeatureBar() {
    final items = [
      {'icon': Icons.local_shipping_outlined, 'title': 'Free Delivery', 'sub': 'On orders > ₹999'},
      {'icon': Icons.verified_user_outlined, 'title': '100% Genuine', 'sub': 'Authentic equipment'},
      {'icon': Icons.autorenew_rounded, 'title': 'Easy Returns', 'sub': '7-day replacement'},
      {'icon': Icons.headset_mic_outlined, 'title': '24/7 Support', 'sub': 'Athlete assistance'},
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.borderSubtle),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
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
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Row(
                  children: [
                    Icon(item['icon'] as IconData, size: 20, color: AppColors.warmAccent),
                    const SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          item['title'] as String,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                        ),
                        Text(
                          item['sub'] as String,
                          style: const TextStyle(fontSize: 9, color: AppColors.mutedText),
                        ),
                      ],
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

  // ── Section Header ──
  Widget _buildSectionHeader({
    required String title,
    String? subtitle,
    required VoidCallback onViewAll,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
              ),
              if (subtitle != null)
                Text(
                  subtitle,
                  style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                ),
            ],
          ),
          GestureDetector(
            onTap: onViewAll,
            child: const Row(
              children: [
                Text(
                  'Reset',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFC8895B)),
                ),
                SizedBox(width: 2),
                Icon(Icons.refresh_rounded, size: 14, color: Color(0xFFC8895B)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Products Grid ──
  Widget _buildProductsGrid(BuildContext context, List<ProductModel> products) {
    final shop = Provider.of<ShopProvider>(context, listen: false);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.54,
          crossAxisSpacing: 12,
          mainAxisSpacing: 14,
        ),
        itemCount: products.length,
        itemBuilder: (context, index) {
          final product = products[index];
          final isFav = shop.isFavorite(product.productId);

          return InkWell(
            onTap: () => _openProductDetailsModal(context, product),
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
                  // Product Thumbnail & Badges
                  Expanded(
                    child: Stack(
                      children: [
                        ClipRRect(
                          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                          child: Container(
                            width: double.infinity,
                            color: const Color(0xFFFAFAFA),
                            child: Image.network(
                              product.image,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Colors.grey.shade100,
                                child: const Icon(Icons.sports, color: AppColors.mutedText),
                              ),
                            ),
                          ),
                        ),

                        // Discount Badge
                        if (product.discount != null)
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFC8895B),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                product.discount!,
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: Colors.white),
                              ),
                            ),
                          ),

                        // Wishlist Heart
                        Positioned(
                          top: 8,
                          right: 8,
                          child: GestureDetector(
                            onTap: () => shop.toggleFavorite(product.productId),
                            child: Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: Colors.white.withValues(alpha: 0.9),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                size: 16,
                                color: isFav ? const Color(0xFFE53935) : AppColors.mutedText,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Info Section
                  Padding(
                    padding: const EdgeInsets.all(10),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          product.category,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                        ),
                        const SizedBox(height: 4),

                        // Rating
                        Row(
                          children: [
                            const Icon(Icons.star_rounded, size: 14, color: Color(0xFFFFB300)),
                            const SizedBox(width: 2),
                            Text(
                              '${product.rating} ',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                            ),
                            Text(
                              '(${product.reviews})',
                              style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),

                        // Price & Add to Bag
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '₹${product.price.toStringAsFixed(0)}',
                                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                                ),
                                if (product.originalPrice > product.price)
                                  Text(
                                    '₹${product.originalPrice.toStringAsFixed(0)}',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      color: AppColors.mutedText,
                                      decoration: TextDecoration.lineThrough,
                                    ),
                                  ),
                              ],
                            ),
                            InkWell(
                              onTap: () => _onAddToCart(context, product),
                              borderRadius: BorderRadius.circular(10),
                              child: Container(
                                padding: const EdgeInsets.all(7),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFC8895B),
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: const Icon(Icons.add_shopping_cart_rounded, size: 16, color: Colors.white),
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

  Widget _buildEmptyState(ShopProvider shop) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 40, horizontal: 20),
      child: Center(
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.04),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.search_off_rounded, size: 36, color: AppColors.mutedText),
            ),
            const SizedBox(height: 16),
            const Text(
              'No sports gear found',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
            ),
            const SizedBox(height: 6),
            const Text(
              'Try changing category or clearing your search term.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 12, color: AppColors.mutedText),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                setState(() => _activeFilter = 'All');
                _searchController.clear();
                shop.setSearchQuery('');
                shop.setSelectedCategory('All');
              },
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryBlack),
              child: const Text('Show All Products', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Collection Carousel ──
  Widget _buildCollectionCarousel(ShopProvider shop) {
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

          return InkWell(
            onTap: () {
              setState(() => _activeFilter = 'All');
              shop.setSelectedCategory(col['category'] as String);
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
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
                  Positioned(
                    right: -10,
                    top: 0,
                    bottom: 0,
                    width: 110,
                    child: ClipRRect(
                      borderRadius: const BorderRadius.horizontal(right: Radius.circular(16)),
                      child: Image.network(
                        col['image'] as String,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          col['title'] as String,
                          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(height: 6),
                        const Row(
                          children: [
                            Text(
                              'Explore Now',
                              style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFC8895B)),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.arrow_forward_rounded, size: 13, color: Color(0xFFC8895B)),
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
}

// ─────────────────────────────────────────────────────────────
// ── PRODUCT DETAILS BOTTOM SHEET ──
// ─────────────────────────────────────────────────────────────
class _ProductDetailSheet extends StatefulWidget {
  final ProductModel product;
  final Function(int qty, String? size) onAddToCart;
  final Function(int qty, String? size) onBuyNow;

  const _ProductDetailSheet({
    required this.product,
    required this.onAddToCart,
    required this.onBuyNow,
  });

  @override
  State<_ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends State<_ProductDetailSheet> {
  int _quantity = 1;
  String? _selectedSize;

  final List<String> _sizes = ['S', 'M', 'L', 'XL', 'Standard'];

  @override
  void initState() {
    super.initState();
    if (widget.product.category.toLowerCase().contains('shoe') ||
        widget.product.category.toLowerCase().contains('wear') ||
        widget.product.category.toLowerCase().contains('jersey')) {
      _selectedSize = 'M';
    }
  }

  @override
  Widget build(BuildContext context) {
    final p = widget.product;

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.90),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
            ),

            // Cover Image
            Stack(
              children: [
                Image.network(
                  p.image,
                  width: double.infinity,
                  height: 240,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    height: 240,
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.sports, size: 64, color: AppColors.mutedText),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: AppColors.primaryBlack),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ),
                if (p.discount != null)
                  Positioned(
                    bottom: 12,
                    left: 16,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFC8895B),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'SAVE ${p.discount!}',
                        style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 11),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: AppColors.warmAccent.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: Text(
                          p.category.toUpperCase(),
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                        ),
                      ),
                      Text(
                        'In Stock (${p.stock} available)',
                        style: const TextStyle(fontSize: 12, color: Colors.green, fontWeight: FontWeight.bold),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    p.title,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                  ),
                  const SizedBox(height: 8),

                  // Rating & Reviews
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFFFB300), size: 18),
                      const SizedBox(width: 4),
                      Text(
                        '${p.rating} ',
                        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        '(${p.reviews} verified buyer reviews)',
                        style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Price
                  Row(
                    children: [
                      Text(
                        '₹${p.price.toStringAsFixed(0)}',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
                      ),
                      const SizedBox(width: 8),
                      if (p.originalPrice > p.price)
                        Text(
                          '₹${p.originalPrice.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.mutedText,
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Size selection if apparel/shoes
                  if (_selectedSize != null) ...[
                    const Text('Select Size / Fit', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      children: _sizes.map((s) {
                        final isSel = _selectedSize == s;
                        return ChoiceChip(
                          label: Text(s),
                          selected: isSel,
                          selectedColor: AppColors.primaryBlack,
                          labelStyle: TextStyle(
                            color: isSel ? Colors.white : AppColors.primaryBlack,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                          onSelected: (_) => setState(() => _selectedSize = s),
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // Description
                  const Text('Product Overview', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 6),
                  Text(
                    p.description,
                    style: const TextStyle(fontSize: 13, color: Color(0xFF555555), height: 1.4),
                  ),
                  const SizedBox(height: 20),

                  // Quantity Stepper
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Quantity', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                      Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFF5F5F5),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            IconButton(
                              icon: const Icon(Icons.remove, size: 18),
                              onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                            ),
                            Text('$_quantity', style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                            IconButton(
                              icon: const Icon(Icons.add, size: 18),
                              onPressed: () => setState(() => _quantity++),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Action Buttons (Add to Bag & Buy Now)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            Navigator.pop(context);
                            widget.onAddToCart(_quantity, _selectedSize);
                          },
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            side: const BorderSide(color: AppColors.primaryBlack, width: 1.5),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text('Add to Bag', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () => widget.onBuyNow(_quantity, _selectedSize),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFC8895B),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                          child: const Text('Buy Now', style: TextStyle(fontWeight: FontWeight.bold)),
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
  }
}

// ─────────────────────────────────────────────────────────────
// ── SHOPPING BAG / CART BOTTOM SHEET ──
// ─────────────────────────────────────────────────────────────
class _CartBottomSheet extends StatelessWidget {
  final VoidCallback onProceedToCheckout;

  const _CartBottomSheet({required this.onProceedToCheckout});

  @override
  Widget build(BuildContext context) {
    return Consumer<ShopProvider>(
      builder: (context, shop, _) {
        final items = shop.cartItems;
        final subtotal = shop.cartSubtotal;
        final delivery = shop.deliveryFee;
        final total = shop.grandTotal;

        return Container(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Shopping Bag (${shop.cartCount})',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  if (items.isNotEmpty)
                    TextButton(
                      onPressed: () => shop.clearCart(),
                      child: const Text('Clear All', style: TextStyle(color: Colors.red, fontSize: 12)),
                    ),
                ],
              ),

              // Free delivery indicator
              if (subtotal > 0 && subtotal < 999)
                Container(
                  margin: const EdgeInsets.symmetric(vertical: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: const Color(0xFFFFE0B2)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.local_shipping_outlined, size: 16, color: Color(0xFFE65100)),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Add ₹${(999 - subtotal).toStringAsFixed(0)} more for FREE Delivery!',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFE65100)),
                        ),
                      ),
                    ],
                  ),
                ),

              const Divider(),
              Expanded(
                child: items.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(20),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.shopping_bag_outlined, size: 48, color: AppColors.mutedText),
                            ),
                            const SizedBox(height: 16),
                            const Text('Your shopping bag is empty', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            const SizedBox(height: 6),
                            const Text('Explore top sports gear and add items to your bag', style: TextStyle(color: AppColors.mutedText, fontSize: 12)),
                          ],
                        ),
                      )
                    : ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const Divider(height: 16),
                        itemBuilder: (context, idx) {
                          final item = items[idx];
                          final p = item.product;

                          return Row(
                            children: [
                              ClipRRect(
                                borderRadius: BorderRadius.circular(10),
                                child: Image.network(
                                  p.image,
                                  width: 54,
                                  height: 54,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) => Container(
                                    width: 54,
                                    height: 54,
                                    color: Colors.grey.shade200,
                                    child: const Icon(Icons.sports, color: AppColors.mutedText),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      p.title,
                                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      '₹${p.price.toStringAsFixed(0)} ${item.size != null ? '• Size: ${item.size}' : ''}',
                                      style: const TextStyle(color: AppColors.warmAccent, fontSize: 12, fontWeight: FontWeight.bold),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                decoration: BoxDecoration(
                                  color: Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Row(
                                  children: [
                                    InkWell(
                                      onTap: () => shop.decrementQuantity(p.productId, size: item.size),
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                        child: Icon(Icons.remove, size: 14),
                                      ),
                                    ),
                                    Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                    InkWell(
                                      onTap: () => shop.incrementQuantity(p.productId, size: item.size),
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                                        child: Icon(Icons.add, size: 14),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                                onPressed: () => shop.removeFromCart(p.productId, size: item.size),
                              ),
                            ],
                          );
                        },
                      ),
              ),

              if (items.isNotEmpty) ...[
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Subtotal', style: TextStyle(fontSize: 13, color: AppColors.mutedText)),
                    Text('₹${subtotal.toStringAsFixed(0)}', style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Delivery Fee', style: TextStyle(fontSize: 13, color: AppColors.mutedText)),
                    Text(
                      delivery == 0 ? 'FREE' : '₹${delivery.toStringAsFixed(0)}',
                      style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: delivery == 0 ? Colors.green : AppColors.primaryBlack),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Amount', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                    Text(
                      '₹${total.toStringAsFixed(0)}',
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: AppColors.warmAccent),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: onProceedToCheckout,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlack,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Proceed to Checkout', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

// ─────────────────────────────────────────────────────────────
// ── CHECKOUT MODAL / PAYMENT SHEET ──
// ─────────────────────────────────────────────────────────────
class _CheckoutBottomSheet extends StatefulWidget {
  const _CheckoutBottomSheet();

  @override
  State<_CheckoutBottomSheet> createState() => _CheckoutBottomSheetState();
}

class _CheckoutBottomSheetState extends State<_CheckoutBottomSheet> {
  final _addressController = TextEditingController(text: 'Flat 402, Elite Residency, Stadium Road, Bangalore');
  final _phoneController = TextEditingController(text: '+91 98765 43210');
  final _nameController = TextEditingController(text: 'SportVerse Athlete');
  String _paymentMethod = 'UPI / Google Pay';

  @override
  void dispose() {
    _addressController.dispose();
    _phoneController.dispose();
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _handlePlaceOrder() async {
    final shop = Provider.of<ShopProvider>(context, listen: false);
    if (_addressController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please enter delivery address.')));
      return;
    }

    String? razorpayTxnId;

    // Process payment via Razorpay if online payment selected
    if (_paymentMethod != 'Cash on Delivery') {
      final rzpResult = await RazorpayService.processPayment(
        context: context,
        amount: shop.grandTotal,
        purpose: 'buying_product',
        title: 'SportVerse Pro-Shop',
        description: 'Sports equipment order (${shop.cartCount} items)',
        customerName: _nameController.text.trim(),
        customerPhone: _phoneController.text.trim(),
      );

      if (!rzpResult.success) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(rzpResult.message ?? 'Payment was cancelled or unsuccessful.'),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
        return;
      }
      razorpayTxnId = rzpResult.paymentId;
    }

    final result = await shop.checkout(
      customerName: _nameController.text.trim(),
      customerPhone: _phoneController.text.trim(),
      deliveryAddress: _addressController.text.trim(),
      paymentMethod: _paymentMethod == 'Cash on Delivery' ? 'Cash on Delivery' : 'Razorpay / Online Payment',
    );

    if (!mounted) return;
    Navigator.pop(context);

    if (result['success'] == true) {
      final order = result['order'] ?? {};
      final orderRef = order['order_reference'] ?? 'SV-ORD-${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
      final estDate = order['estimated_delivery'] ?? 'in 2-3 business days';

      showDialog(
        context: context,
        builder: (c) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: const BoxDecoration(
                  color: Color(0xFFE8F5E9),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: Color(0xFF2E7D32), size: 40),
              ),
              const SizedBox(height: 16),
              const Text('Order Confirmed!', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 6),
              Text(
                'Reference ID: $orderRef',
                style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warmAccent, fontSize: 13),
              ),
              if (razorpayTxnId != null) ...[
                const SizedBox(height: 4),
                Text(
                  'Razorpay Txn: $razorpayTxnId',
                  style: const TextStyle(fontSize: 11, fontFamily: 'monospace', fontWeight: FontWeight.bold, color: Color(0xFF0C2340)),
                ),
              ],
              const SizedBox(height: 12),
              Text(
                'Your sports equipment is being packed and prepared for shipment. Estimated delivery: $estDate.',
                textAlign: TextAlign.center,
                style: const TextStyle(color: Color(0xFF555555), fontSize: 12, height: 1.4),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(c),
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primaryBlack),
                  child: const Text('Awesome!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(result['message'] ?? 'Failed to place order.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final shop = Provider.of<ShopProvider>(context);

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.90),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            const SizedBox(height: 16),
            const Text('Checkout & Delivery Details', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),

            // Delivery Address
            const Text('Delivery Address', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 6),
            TextField(
              controller: _addressController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'Enter complete street address & pincode',
                prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.warmAccent),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
            const SizedBox(height: 16),

            // Contact Info
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Recipient Name', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _nameController,
                        decoration: InputDecoration(
                          hintText: 'Name',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Phone Number', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 6),
                      TextField(
                        controller: _phoneController,
                        decoration: InputDecoration(
                          hintText: 'Phone',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Payment Options
            const Text('Select Payment Method', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
            const SizedBox(height: 8),
            ...['UPI / Google Pay', 'Credit / Debit Card', 'Net Banking', 'Cash on Delivery'].map((m) {
              final isSel = _paymentMethod == m;
              return InkWell(
                onTap: () => setState(() => _paymentMethod = m),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isSel ? AppColors.warmAccent.withValues(alpha: 0.1) : Colors.white,
                    border: Border.all(color: isSel ? AppColors.warmAccent : AppColors.border),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        isSel ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                        color: isSel ? AppColors.warmAccent : Colors.grey,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(m, style: TextStyle(fontWeight: isSel ? FontWeight.bold : FontWeight.normal, fontSize: 13)),
                    ],
                  ),
                ),
              );
            }),

            const SizedBox(height: 16),
            // Summary
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFF9F9F9),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.border),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('${shop.cartCount} items in bag', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                  Text(
                    'Total: ₹${shop.grandTotal.toStringAsFixed(0)}',
                    style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.warmAccent, fontSize: 16),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Place Order Button
            SizedBox(
              width: double.infinity,
              height: 50,
              child: ElevatedButton(
                onPressed: shop.isCheckingOut ? null : _handlePlaceOrder,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFC8895B),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: shop.isCheckingOut
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                      )
                    : const Text('Confirm & Place Order', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────
// ── MY ORDERS MODAL ──
// ─────────────────────────────────────────────────────────────
class _OrdersBottomSheet extends StatefulWidget {
  const _OrdersBottomSheet();

  @override
  State<_OrdersBottomSheet> createState() => _OrdersBottomSheetState();
}

class _OrdersBottomSheetState extends State<_OrdersBottomSheet> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<ShopProvider>(context, listen: false).loadUserOrders('guest_user_1');
    });
  }

  @override
  Widget build(BuildContext context) {
    final shop = Provider.of<ShopProvider>(context);
    final orders = shop.userOrders;

    return Container(
      constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('My Gear Orders (${orders.length})', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const Divider(),
          Expanded(
            child: orders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(18),
                          decoration: BoxDecoration(color: Colors.grey.shade100, shape: BoxShape.circle),
                          child: const Icon(Icons.receipt_long_outlined, size: 40, color: AppColors.mutedText),
                        ),
                        const SizedBox(height: 12),
                        const Text('No past orders yet', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 4),
                        const Text('Your placed sports equipment orders will show up here.', style: TextStyle(fontSize: 12, color: AppColors.mutedText)),
                      ],
                    ),
                  )
                    : ListView.separated(
                        itemCount: orders.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 12),
                        itemBuilder: (context, idx) {
                          final o = orders[idx];
                          final ref = o['order_reference'] ?? 'SV-ORD-${o['order_id']}';
                          final total = o['total_amount'] ?? 0;
                          final status = o['order_status'] ?? 'Confirmed';
                          final estDate = o['estimated_delivery'] ?? 'In transit';
                          final items = (o['items'] as List?) ?? [];

                          return Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(14),
                              border: Border.all(color: AppColors.border),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withValues(alpha: 0.02),
                                  blurRadius: 6,
                                  offset: const Offset(0, 2),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(ref, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppColors.warmAccent)),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFE8F5E9),
                                        borderRadius: BorderRadius.circular(6),
                                      ),
                                      child: Text(
                                        status,
                                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF2E7D32)),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 8),
                                ...items.map((it) {
                                  return Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 2.0),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.circle, size: 6, color: AppColors.warmAccent),
                                        const SizedBox(width: 6),
                                        Expanded(
                                          child: Text(
                                            '${it['title']} (x${it['quantity'] ?? 1})',
                                            style: const TextStyle(fontSize: 12),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                        Text('₹${it['price']}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                                      ],
                                    ),
                                  );
                                }),
                                const Divider(height: 16),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('Est. Delivery: $estDate', style: const TextStyle(fontSize: 11, color: AppColors.mutedText)),
                                    Text('Total: ₹$total', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                                  ],
                                ),
                              ],
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
