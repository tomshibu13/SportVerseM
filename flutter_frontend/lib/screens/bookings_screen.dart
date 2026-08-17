import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../models/booking_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/top_navigation_bar.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<BookingModel> _bookings = [];
  bool _isLoading = true;

  List<BookingModel> get _upcomingBookings => _bookings
      .where((b) =>
          b.bookingStatus.toLowerCase() == 'upcoming' ||
          b.bookingStatus.toLowerCase() == 'confirmed' ||
          b.bookingStatus.toLowerCase() == 'active')
      .toList();

  List<BookingModel> get _completedBookings => _bookings
      .where((b) =>
          b.bookingStatus.toLowerCase() == 'completed' ||
          b.bookingStatus.toLowerCase() == 'cancelled')
      .toList();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadBookings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadBookings() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final userId = AuthService.currentUser?['_id'] ??
          AuthService.currentUser?['id'] ??
          AuthService.currentUser?['user_id'] ??
          '1';
      final list = await ApiService.fetchUserBookings(userId);
      if (mounted) {
        setState(() {
          _bookings = list;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showDirectionsDialog(BookingModel booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.directions, color: AppColors.warmAccent),
            const SizedBox(width: 8),
            Expanded(child: Text(booking.groundName, style: const TextStyle(fontSize: 18))),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '📍 Address:',
              style: TextStyle(fontWeight: FontWeight.bold, color: Colors.grey[800], fontSize: 13),
            ),
            const SizedBox(height: 4),
            Text(booking.address.isNotEmpty ? booking.address : booking.location),
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.green.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.green.withValues(alpha: 0.2)),
              ),
              child: const Row(
                children: [
                  Icon(Icons.check_circle_outline, color: Colors.green, size: 18),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Turn-by-turn navigation available at entry gate.',
                      style: TextStyle(fontSize: 12, color: Colors.green),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Opening navigation to ${booking.groundName}...'),
                  backgroundColor: AppColors.primaryBlack,
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlack,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Start Navigation'),
          ),
        ],
      ),
    );
  }

  void _showQRCodeTicketModal(BookingModel booking) {
    final qrString = booking.qrCode.isNotEmpty ? booking.qrCode : 'SPORTVERSE_QR_${booking.bookingId}';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(
          maxHeight: MediaQuery.of(context).size.height * 0.88,
        ),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
              ),
              const SizedBox(height: 16),
              const Text(
                '🎟️ Digital Entry Pass',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
              ),
              const SizedBox(height: 6),
              Text(
                'Show this QR ticket at the court entry gate for automated check-in',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),
              const SizedBox(height: 20),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F1116),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.4)),
                ),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                      child: Stack(
                        alignment: Alignment.center,
                        children: [
                          Opacity(
                            opacity: booking.bookingStatus == 'Completed' ? 0.35 : 1.0,
                            child: Column(
                              children: [
                                QrImageView(
                                  data: qrString,
                                  version: QrVersions.auto,
                                  size: 160.0,
                                  backgroundColor: Colors.white,
                                  eyeStyle: const QrEyeStyle(
                                    eyeShape: QrEyeShape.square,
                                    color: Color(0xFF0F1116),
                                  ),
                                  dataModuleStyle: const QrDataModuleStyle(
                                    dataModuleShape: QrDataModuleShape.square,
                                    color: Color(0xFF0F1116),
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: const Color(0xFFF3F4F6),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text(
                                    qrString,
                                    style: const TextStyle(
                                      fontFamily: 'monospace',
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1F2937),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          if (booking.bookingStatus == 'Completed')
                            Transform.rotate(
                              angle: -0.2,
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: Colors.white, width: 2),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withValues(alpha: 0.3),
                                      blurRadius: 8,
                                    ),
                                  ],
                                ),
                                child: const Text(
                                  'QR EXPIRED / USED',
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w900,
                                    fontSize: 12,
                                    letterSpacing: 1.1,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      booking.groundName,
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${booking.date} • ${booking.slotTime}',
                      style: const TextStyle(fontSize: 12, color: AppColors.warmAccent),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () => Navigator.pop(ctx),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: AppColors.border),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Close'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('Ticket saved to gallery / wallet!'),
                            backgroundColor: Colors.green,
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.warmAccent,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('Save Ticket'),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _cancelBooking(BookingModel booking) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Cancel Booking?'),
        content: Text('Are you sure you want to cancel your reservation for ${booking.groundName}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Keep Slot')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final res = await ApiService.cancelBooking(booking.bookingId);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(res['message'] ?? 'Booking for ${booking.groundName} cancelled.'),
                    backgroundColor: AppColors.primaryBlack,
                  ),
                );
                _loadBookings();
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('Cancel Booking'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (!AuthService.isLoggedIn) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: const TopNavigationBar(),
        body: _buildSignedOutState(),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              indicatorColor: AppColors.warmAccent,
              labelColor: AppColors.warmAccent,
              unselectedLabelColor: AppColors.secondaryText,
              labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              tabs: [
                Tab(text: 'Upcoming (${_upcomingBookings.length})'),
                Tab(text: 'Completed (${_completedBookings.length})'),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(color: AppColors.warmAccent),
                  )
                : TabBarView(
                    controller: _tabController,
                    children: [
                      _buildBookingList(_upcomingBookings, isUpcoming: true),
                      _buildBookingList(_completedBookings, isUpcoming: false),
                    ],
                  ),
          ),
        ],
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
              child: const Icon(Icons.confirmation_number_outlined, size: 54, color: AppColors.warmAccent),
            ),
            const SizedBox(height: 20),
            const Text(
              'Sign In to View Bookings',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please sign in to access your booked court slots, view digital match entry tickets, and navigate to arenas.',
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
                    _loadBookings();
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

  Widget _buildBookingList(List<BookingModel> bookings, {required bool isUpcoming}) {
    if (bookings.isEmpty) {
      return RefreshIndicator(
        onRefresh: _loadBookings,
        color: AppColors.warmAccent,
        child: ListView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          children: [
            SizedBox(height: MediaQuery.of(context).size.height * 0.25),
            Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.confirmation_number_outlined, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 12),
                  Text(
                    isUpcoming ? 'No upcoming bookings' : 'No past bookings',
                    style: const TextStyle(color: AppColors.mutedText, fontSize: 15, fontWeight: FontWeight.w600),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Pull down to refresh',
                    style: TextStyle(color: AppColors.secondaryText, fontSize: 12),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBookings,
      color: AppColors.warmAccent,
      child: ListView.builder(
        physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
        padding: const EdgeInsets.all(20),
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          final b = bookings[index];
          final isCancelled = b.bookingStatus.toLowerCase() == 'cancelled';
          return Container(
            margin: const EdgeInsets.only(bottom: 16),
            padding: const EdgeInsets.all(16),
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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        b.groundName,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: isCancelled
                            ? Colors.red.withValues(alpha: 0.1)
                            : (isUpcoming
                                ? Colors.green.withValues(alpha: 0.1)
                                : Colors.grey.withValues(alpha: 0.1)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        b.bookingStatus,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: isCancelled
                              ? Colors.red
                              : (isUpcoming ? Colors.green : Colors.grey[700]),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  b.sportType,
                  style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                ),
                const Divider(height: 20),
                Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 14, color: AppColors.warmAccent),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        b.date,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 12),
                    const Icon(Icons.access_time, size: 14, color: AppColors.warmAccent),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        b.slotTime,
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        b.location,
                        style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '₹${b.totalPrice.toInt()}',
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                      ),
                    ),
                  ],
                ),
                if (isUpcoming && !isCancelled) ...[
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _showDirectionsDialog(b),
                          icon: const Icon(Icons.directions, size: 15, color: AppColors.primaryBlack),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          label: const Text('Directions', style: TextStyle(fontSize: 12, color: AppColors.primaryBlack)),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: () => _showQRCodeTicketModal(b),
                          icon: const Icon(Icons.qr_code, size: 15, color: Colors.white),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryBlack,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          ),
                          label: const Text('Entry Pass', style: TextStyle(fontSize: 12, color: Colors.white)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Center(
                    child: TextButton(
                      onPressed: () => _cancelBooking(b),
                      child: const Text('Cancel Reservation', style: TextStyle(fontSize: 11, color: Colors.red)),
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}
