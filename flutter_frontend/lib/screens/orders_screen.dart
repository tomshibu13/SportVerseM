import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import 'shop_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  bool _isLoading = true;
  List<Map<String, dynamic>> _orders = [];

  @override
  void initState() {
    super.initState();
    _fetchOrders();
  }

  Future<void> _fetchOrders() async {
    setState(() => _isLoading = true);
    try {
      final user = AuthService.currentUser;
      final userId = user?['userId'] ?? user?['user_id'] ?? user?['_id'] ?? user?['id'] ?? 'guest_user_1';
      final orders = await ApiService.fetchUserOrders(userId);

      if (mounted) {
        setState(() {
          _orders = orders;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AuthService.isLoggedIn) {
      return Scaffold(
        backgroundColor: const Color(0xFFF9F7F4),
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios, size: 20, color: AppColors.primaryBlack),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Your Orders',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlack,
            ),
          ),
          centerTitle: true,
        ),
        body: _buildSignedOutState(),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20, color: AppColors.primaryBlack),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Your Orders',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: AppColors.warmAccent),
            onPressed: _fetchOrders,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.warmAccent),
            )
          : RefreshIndicator(
              color: AppColors.warmAccent,
              onRefresh: _fetchOrders,
              child: _orders.isEmpty
                  ? _buildEmptyState()
                  : ListView.separated(
                      padding: const EdgeInsets.all(16),
                      physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                      itemCount: _orders.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 14),
                      itemBuilder: (context, index) => _buildOrderCard(_orders[index]),
                    ),
            ),
    );
  }

  Widget _buildSignedOutState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 28.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(
                color: AppColors.warmAccent.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_outline, size: 54, color: AppColors.warmAccent),
            ),
            const SizedBox(height: 20),
            const Text(
              'Sign In to View Orders',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please sign in with your SportVerse account to track sports gear orders, invoices, and shipment status.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 13,
                color: AppColors.mutedText,
                height: 1.5,
              ),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: () async {
                  final authenticated = await AuthService.requireAuth(context);
                  if (authenticated && mounted) {
                    setState(() {});
                    _fetchOrders();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlack,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.login_rounded, size: 18),
                label: const Text('Sign In Now', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.warmAccent.withValues(alpha: 0.1),
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.shopping_bag_outlined,
                size: 40,
                color: AppColors.warmAccent,
              ),
            ),
            const SizedBox(height: 20),
            const Text(
              'No Orders Yet',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'You haven\'t purchased any sports gear or equipment yet. Explore our pro-shop for high quality rackets, balls, and shoes.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.secondaryText, height: 1.4),
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ShopScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlack,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              icon: const Icon(Icons.storefront_outlined, size: 18),
              label: const Text(
                'Explore Pro-Shop',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final ref = order['order_reference']?.toString() ?? 'SV-ORD-${order['order_id']?.toString() ?? '100293'}';
    final total = (order['total_amount'] is num)
        ? (order['total_amount'] as num).toDouble()
        : (double.tryParse(order['total_amount']?.toString() ?? '0') ?? 0.0);
    final status = order['order_status']?.toString() ?? 'Confirmed';
    final estDate = order['estimated_delivery']?.toString() ?? 'In transit';
    final paymentMethod = order['payment_method']?.toString() ?? 'Online Payment';
    final address = order['delivery_address']?.toString() ?? 'SportVerse Central Hub';
    final items = (order['items'] is List) ? (order['items'] as List) : [];

    Color statusBg = const Color(0xFFE8F5E9);
    Color statusText = const Color(0xFF2E7D32);
    IconData statusIcon = Icons.check_circle_outline_rounded;

    final lowerStatus = status.toLowerCase();
    if (lowerStatus.contains('transit') || lowerStatus.contains('ship')) {
      statusBg = const Color(0xFFE3F2FD);
      statusText = const Color(0xFF1565C0);
      statusIcon = Icons.local_shipping_outlined;
    } else if (lowerStatus.contains('cancel')) {
      statusBg = const Color(0xFFFFEBEE);
      statusText = const Color(0xFFC62828);
      statusIcon = Icons.cancel_outlined;
    }

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Order Header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFFFAFAFA),
              borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(bottom: BorderSide(color: AppColors.borderSubtle)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      ref,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w900,
                        color: AppColors.warmAccent,
                        letterSpacing: 0.5,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Placed via $paymentMethod',
                      style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Icon(statusIcon, size: 14, color: statusText),
                      const SizedBox(width: 4),
                      Text(
                        status,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: statusText,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Items List
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ...items.map((item) {
                  final map = (item is Map) ? item : <String, dynamic>{};
                  final title = map['title']?.toString() ?? map['name']?.toString() ?? 'Sports Item';
                  final qty = (map['quantity'] is num)
                      ? (map['quantity'] as num).toInt()
                      : (int.tryParse(map['quantity']?.toString() ?? '1') ?? 1);
                  final price = (map['price'] is num)
                      ? (map['price'] as num).toDouble()
                      : (double.tryParse(map['price']?.toString() ?? '0') ?? 0.0);
                  final image = map['image']?.toString();

                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Container(
                            width: 44,
                            height: 44,
                            color: Colors.grey.shade100,
                            child: image != null && image.isNotEmpty
                                ? Image.network(
                                    image,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) => const Icon(Icons.sports, color: AppColors.mutedText, size: 20),
                                  )
                                : const Icon(Icons.sports, color: AppColors.mutedText, size: 20),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                title,
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlack,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Qty: $qty  •  ₹${price.toStringAsFixed(0)} each',
                                style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${(qty * price).toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryBlack,
                          ),
                        ),
                      ],
                    ),
                  );
                }),

                const Divider(height: 16),

                // Delivery & Total Info
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        address,
                        style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.schedule, size: 14, color: AppColors.warmAccent),
                        const SizedBox(width: 4),
                        Text(
                          'Est. Delivery: $estDate',
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        const Text('Total: ', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                        Text(
                          '₹${total.toStringAsFixed(0)}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                            color: AppColors.warmAccent,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
