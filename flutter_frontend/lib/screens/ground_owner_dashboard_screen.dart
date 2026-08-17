import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/ground_model.dart';
import '../models/booking_model.dart';
import 'become_ground_owner_screen.dart';

class GroundOwnerDashboardScreen extends StatefulWidget {
  const GroundOwnerDashboardScreen({super.key});

  @override
  State<GroundOwnerDashboardScreen> createState() => _GroundOwnerDashboardScreenState();
}

class _GroundOwnerDashboardScreenState extends State<GroundOwnerDashboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isLoading = false;
  List<GroundModel> _myGrounds = [];
  List<BookingModel> _allBookings = [];
  String _bookingFilter = 'All';
  final TextEditingController _checkInInputController = TextEditingController();

  final List<Map<String, String>> _notifications = [
    {
      'title': 'New Booking Confirmed',
      'body': 'User Tom Holland booked Smash Arena for 06:00 PM today.',
      'time': '10 mins ago'
    },
    {
      'title': 'Facility Active & Live',
      'body': 'Your sports facility is active and visible for instant public reservations.',
      'time': '1 hour ago'
    },
    {
      'title': 'Dynamic Peak Rate Applied',
      'body': 'Evening slots (05:00 PM - 09:00 PM) optimized with standard prime rates.',
      'time': '1 day ago'
    }
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDashboardData();
  }

  @override
  void dispose() {
    _tabController.dispose();
    _checkInInputController.dispose();
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      final user = AuthService.currentUser;
      final ownerId = (user?['_id'] ?? user?['id'] ?? user?['user_id'] ?? '').toString();
      final ownerEmail = (user?['email'] ?? '').toString().toLowerCase();

      final allGrounds = await ApiService.fetchGrounds();
      final bookingsList = await ApiService.fetchAllBookings();

      final filtered = allGrounds.where((g) {
        final gOwner = g.ownerId.toString().toLowerCase();
        return (ownerId.isNotEmpty && gOwner == ownerId.toLowerCase()) ||
               (ownerEmail.isNotEmpty && gOwner == ownerEmail);
      }).toList();

      final myGroundNames = filtered.map((g) => g.title.toLowerCase()).toSet();
      final myGroundIds = <String>{};
      for (final g in filtered) {
        myGroundIds.add(g.groundId.toString().toLowerCase());
        final rawId = g['_id'];
        if (rawId != null) myGroundIds.add(rawId.toString().toLowerCase());
      }

      final ownerBookings = bookingsList.where((b) {
        final bGroundId = (b.groundId ?? '').toString().toLowerCase();
        final bGroundName = b.groundName.toLowerCase();
        return myGroundIds.contains(bGroundId) || myGroundNames.contains(bGroundName);
      }).toList();

      setState(() {
        _myGrounds = filtered;
        _allBookings = ownerBookings;
        _isLoading = false;
      });
    } catch (e) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _navigateToAddGround() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()),
    ).then((_) => _loadDashboardData());
  }

  Future<void> _performCheckIn(String rawId) async {
    final query = rawId.trim();
    if (query.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a Booking ID or QR code to verify.')),
      );
      return;
    }

    final res = await ApiService.checkInBooking(query);
    if (res['success'] == true) {
      _checkInInputController.clear();
      await _loadDashboardData();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFF16A34A),
            behavior: SnackBarBehavior.floating,
            content: Text('✅ ${res['message'] ?? 'Check-in confirmed successfully!'}'),
          ),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: const Color(0xFFDC2626),
            behavior: SnackBarBehavior.floating,
            content: Text('✕ ${res['message'] ?? 'Invalid booking ID'}'),
          ),
        );
      }
    }
  }

  void _showQRScannerModal() {
    final searchCtrl = TextEditingController();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final pendingBookings = _allBookings.where((b) => b.bookingStatus != 'Completed' && b.bookingStatus != 'Cancelled').take(4).toList();
          return Container(
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            padding: EdgeInsets.only(
              left: 24,
              right: 24,
              top: 24,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.qr_code_scanner, color: Color(0xFF16A34A), size: 24),
                    SizedBox(width: 8),
                    Text(
                      'QR Check-In Scanner',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  height: 150,
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F1116),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF16A34A), width: 2),
                  ),
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      const Icon(Icons.qr_code_2, size: 80, color: Colors.white24),
                      Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF16A34A).withValues(alpha: 0.2),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: const Color(0xFF16A34A)),
                            ),
                            child: const Text(
                              '📷 Scanning Active / Camera Ready',
                              style: TextStyle(color: Color(0xFF4ADE80), fontSize: 11, fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Point scanner at player QR ticket or select below',
                            style: TextStyle(color: Colors.white70, fontSize: 10),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                if (pendingBookings.isNotEmpty) ...[
                  const Align(
                    alignment: Alignment.centerLeft,
                    child: Text(
                      'Quick Select Pending Ticket:',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.secondaryText),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: pendingBookings.map((b) {
                      return ActionChip(
                        avatar: const Icon(Icons.confirmation_number_outlined, size: 14, color: AppColors.warmAccent),
                        label: Text('${b.bookingId} (${b.userName})', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        backgroundColor: const Color(0xFFF1F5F9),
                        onPressed: () async {
                          Navigator.pop(ctx);
                          await _performCheckIn(b.bookingId);
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),
                ],
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: searchCtrl,
                        decoration: InputDecoration(
                          hintText: 'Enter Booking ID or QR string...',
                          hintStyle: const TextStyle(fontSize: 12),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        ),
                        onSubmitted: (val) async {
                          Navigator.pop(ctx);
                          await _performCheckIn(val);
                        },
                      ),
                    ),
                    const SizedBox(width: 10),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF16A34A),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onPressed: () async {
                        Navigator.pop(ctx);
                        await _performCheckIn(searchCtrl.text);
                      },
                      child: const Text('Verify', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _cancelBooking(BookingModel booking) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Reservation?'),
        content: Text('Are you sure you want to cancel booking ${booking.bookingId} for ${booking.userName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Keep Active'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              await ApiService.cancelBooking(booking.bookingId);
              await _loadDashboardData();
              messenger.showSnackBar(
                SnackBar(
                  behavior: SnackBarBehavior.floating,
                  content: Text('✕ Booking ${booking.bookingId} has been cancelled.'),
                ),
              );
            },
            child: const Text('Confirm Cancel', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _editSlots(GroundModel ground) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, modalSetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.80,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 5,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                ground.title,
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                                overflow: TextOverflow.ellipsis,
                              ),
                              const Text('Configure Time Slots & Live Hourly Pricing', style: TextStyle(fontSize: 11, color: AppColors.secondaryText)),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(),
                  Expanded(
                    child: ground.availableSlots.isEmpty
                        ? const Center(child: Text('No slots configured for this facility.'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: ground.availableSlots.length,
                            itemBuilder: (context, index) {
                              final slot = ground.availableSlots[index];
                              return Card(
                                margin: const EdgeInsets.only(bottom: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                color: slot.isBooked ? const Color(0xFFF8FAFC) : Colors.white,
                                elevation: 1,
                                child: Padding(
                                  padding: const EdgeInsets.all(12),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Row(
                                        children: [
                                          Icon(
                                            slot.isBooked ? Icons.lock : Icons.lock_open,
                                            color: slot.isBooked ? Colors.grey : const Color(0xFF16A34A),
                                            size: 20,
                                          ),
                                          const SizedBox(width: 12),
                                          Column(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Text(slot.time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                              Text(
                                                slot.isBooked ? 'Status: Booked / Reserved' : 'Status: Open for Booking',
                                                style: TextStyle(fontSize: 11, color: slot.isBooked ? Colors.red : Colors.green),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      Row(
                                        children: [
                                          Text('₹${slot.price.toInt()}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.warmAccent)),
                                          const SizedBox(width: 8),
                                          IconButton(
                                            icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.blueAccent),
                                            tooltip: 'Edit Slot Rate',
                                            onPressed: () {
                                              final priceController = TextEditingController(text: slot.price.toInt().toString());
                                              showDialog(
                                                context: context,
                                                builder: (dialogCtx) => AlertDialog(
                                                  title: const Text('Update Slot Price'),
                                                  content: TextField(
                                                    controller: priceController,
                                                    keyboardType: TextInputType.number,
                                                    decoration: const InputDecoration(
                                                      labelText: 'Rate per hour (₹)',
                                                      border: OutlineInputBorder(),
                                                    ),
                                                  ),
                                                  actions: [
                                                    TextButton(onPressed: () => Navigator.pop(dialogCtx), child: const Text('Cancel')),
                                                    ElevatedButton(
                                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                                                      onPressed: () async {
                                                        final newPrice = double.tryParse(priceController.text) ?? slot.price;
                                                        modalSetState(() {
                                                          slot.price = newPrice;
                                                        });
                                                        Navigator.pop(dialogCtx);

                                                        // Save updated slots to MongoDB
                                                        final updatedSlots = ground.availableSlots.map((s) => {
                                                          'slot_id': s.slotId,
                                                          'time': s.time,
                                                          'is_booked': s.isBooked,
                                                          'price': s.price,
                                                        }).toList();

                                                        await ApiService.updateGround(ground.groundId, {
                                                          'available_slots': updatedSlots,
                                                        });
                                                        await _loadDashboardData();
                                                      },
                                                      child: const Text('Save Rate', style: TextStyle(color: Colors.white)),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            },
                                          ),
                                          IconButton(
                                            icon: Icon(
                                              slot.isBooked ? Icons.toggle_on : Icons.toggle_off,
                                              size: 26,
                                              color: slot.isBooked ? Colors.grey : const Color(0xFF16A34A),
                                            ),
                                            tooltip: slot.isBooked ? 'Mark Available' : 'Block Slot',
                                            onPressed: () async {
                                              modalSetState(() {
                                                slot.isBooked = !slot.isBooked;
                                              });
                                              final updatedSlots = ground.availableSlots.map((s) => {
                                                'slot_id': s.slotId,
                                                'time': s.time,
                                                'is_booked': s.isBooked,
                                                'price': s.price,
                                              }).toList();

                                              await ApiService.updateGround(ground.groundId, {
                                                'available_slots': updatedSlots,
                                              });
                                              await _loadDashboardData();
                                            },
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              );
                            },
                          ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _editGroundDetails(GroundModel ground) {
    final titleController = TextEditingController(text: ground.title);
    final locationController = TextEditingController(text: ground.location);
    final priceController = TextEditingController(text: ground.pricePerHour.toInt().toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Facility Details'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'Facility Name', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: locationController,
                decoration: const InputDecoration(labelText: 'Location / City', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: priceController,
                keyboardType: TextInputType.number,
                decoration: const InputDecoration(labelText: 'Base Price per Hour (₹)', border: OutlineInputBorder()),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              final newPrice = double.tryParse(priceController.text) ?? ground.pricePerHour;
              Navigator.pop(ctx);

              await ApiService.updateGround(ground.groundId, {
                'title': titleController.text.trim(),
                'location': locationController.text.trim(),
                'price_per_hour': newPrice,
              });
              await _loadDashboardData();
              messenger.showSnackBar(
                const SnackBar(content: Text('Facility details updated successfully!')),
              );
            },
            child: const Text('Save Changes', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _deleteGround(GroundModel ground) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Remove Facility?'),
        content: Text('Are you sure you want to remove "${ground.title}"? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(ctx);
              await ApiService.deleteGround(ground.groundId);
              await _loadDashboardData();
              messenger.showSnackBar(
                SnackBar(content: Text('Facility "${ground.title}" removed.')),
              );
            },
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
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
        appBar: AppBar(
          backgroundColor: Colors.white,
          elevation: 0.5,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.primaryBlack),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            'Ground Control Center',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
          ),
          centerTitle: true,
        ),
        body: _buildSignedOutState(),
      );
    }

    final user = AuthService.currentUser;
    final ownerName = user?['full_name'] ?? user?['name'] ?? 'Ground Partner';

    final double totalRevenue = _allBookings
        .where((b) => b.bookingStatus == 'Completed' || b.bookingStatus == 'Upcoming')
        .fold(0.0, (sum, item) => sum + item.totalPrice);

    final completedCheckIns = _allBookings.where((b) => b.bookingStatus == 'Completed').length;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.primaryBlack),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                gradient: AppColors.goldGradient,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.stadium_rounded, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Ground Control Center',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
                ),
                Text(
                  'Partner: $ownerName',
                  style: const TextStyle(fontSize: 10.5, color: Color(0xFF16A34A), fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.warmAccent),
            tooltip: 'Refresh Dashboard',
            onPressed: _loadDashboardData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : Column(
              children: [
                // ── KPI Summary Stats ──
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildKpiCard('Total Revenue', '₹${totalRevenue.toInt()}', Icons.payments_outlined, const Color(0xFF16A34A)),
                      _buildKpiCard('Reservations', '${_allBookings.length}', Icons.calendar_today_outlined, const Color(0xFF2563EB)),
                      _buildKpiCard('Facilities', '${_myGrounds.length}', Icons.stadium_outlined, const Color(0xFFEA580C)),
                      _buildKpiCard('Checked-In', '$completedCheckIns', Icons.how_to_reg_outlined, const Color(0xFF7C3AED)),
                    ],
                  ),
                ),

                // TabBar controller header
                Container(
                  color: Colors.white,
                  child: TabBar(
                    controller: _tabController,
                    indicatorColor: AppColors.warmAccent,
                    labelColor: AppColors.warmAccent,
                    unselectedLabelColor: AppColors.secondaryText,
                    labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                    tabs: const [
                      Tab(text: 'Facilities'),
                      Tab(text: 'Bookings'),
                      Tab(text: 'Customers'),
                      Tab(text: 'Insights'),
                    ],
                  ),
                ),

                // Tab Views
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildVenuesTab(),
                      _buildBookingsTab(),
                      _buildCustomersTab(),
                      _buildInsightsTab(totalRevenue),
                    ],
                  ),
                )
              ],
            ),
    );
  }

  // ── Tab 1: Venues / Facilities Tab ──
  Widget _buildVenuesTab() {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Managed Facilities (${_myGrounds.length})',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlack,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              onPressed: _navigateToAddGround,
              icon: const Icon(Icons.add_business_rounded, size: 15, color: Colors.white),
              label: const Text('Add Facility', style: TextStyle(fontSize: 11.5, color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
        const SizedBox(height: 14),
        if (_myGrounds.isEmpty)
          Center(
            child: Padding(
              padding: const EdgeInsets.symmetric(vertical: 40),
              child: Column(
                children: [
                  const Icon(Icons.stadium_outlined, size: 48, color: Colors.grey),
                  const SizedBox(height: 12),
                  const Text('No facilities registered under your account yet.', style: TextStyle(color: Colors.grey)),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: _navigateToAddGround,
                    style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                    child: const Text('Register Your First Ground', style: TextStyle(color: Colors.white)),
                  ),
                ],
              ),
            ),
          )
        else
          ..._myGrounds.map((ground) {
            final imageUrl = ground.images.isNotEmpty
                ? ground.images[0]
                : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=400&q=80';
            return Card(
              margin: const EdgeInsets.only(bottom: 16),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 2,
              clipBehavior: Clip.antiAlias,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Stack(
                    children: [
                      Image.network(
                        imageUrl,
                        height: 140,
                        width: double.infinity,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(height: 140, color: Colors.grey[200], child: const Icon(Icons.image));
                        },
                      ),
                      Positioned(
                        top: 12,
                        left: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.7),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            ground.sportType,
                            style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: ground.status == 'Approved' || ground.status == 'Active'
                                ? const Color(0xFF16A34A)
                                : const Color(0xFFEA580C),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            ground.status,
                            style: const TextStyle(color: Colors.white, fontSize: 10.5, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                ground.title,
                                style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: AppColors.primaryBlack),
                              ),
                            ),
                            Text(
                              '₹${ground.pricePerHour.toInt()}/hr',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: AppColors.warmAccent),
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        Row(
                          children: [
                            const Icon(Icons.location_on_outlined, size: 13, color: Colors.grey),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                ground.location,
                                style: const TextStyle(color: AppColors.secondaryText, fontSize: 11.5),
                              ),
                            ),
                          ],
                        ),
                        if (ground.facilities.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Wrap(
                            spacing: 6,
                            runSpacing: 4,
                            children: ground.facilities.map((f) {
                              return Container(
                                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(f, style: const TextStyle(fontSize: 10, color: Color(0xFF475569))),
                              );
                            }).toList(),
                          ),
                        ],
                        const Divider(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            TextButton.icon(
                              onPressed: () => _editSlots(ground),
                              icon: const Icon(Icons.schedule, size: 15, color: AppColors.warmAccent),
                              label: const Text('Manage Slots & Rates', style: TextStyle(fontSize: 11.5, color: AppColors.warmAccent, fontWeight: FontWeight.bold)),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.blueAccent),
                                  tooltip: 'Edit Details',
                                  onPressed: () => _editGroundDetails(ground),
                                ),
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                  tooltip: 'Delete Facility',
                                  onPressed: () => _deleteGround(ground),
                                ),
                              ],
                            ),
                          ],
                        )
                      ],
                    ),
                  )
                ],
              ),
            );
          }),
      ],
    );
  }

  // ── Tab 2: Bookings & Live Check-In Tab ──
  Widget _buildBookingsTab() {
    final filteredBookings = _allBookings.where((b) {
      if (_bookingFilter == 'All') return true;
      return b.bookingStatus.toLowerCase() == _bookingFilter.toLowerCase();
    }).toList();

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        // Fast Check-In Card
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: const Color(0xFFF0FDF4),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFF86EFAC)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.qr_code_scanner, color: Color(0xFF16A34A), size: 18),
                  SizedBox(width: 8),
                  Text(
                    'Instant Customer Check-In',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF166534)),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: const Color(0xFFCBD5E1)),
                      ),
                      child: TextField(
                        controller: _checkInInputController,
                        style: const TextStyle(fontSize: 13),
                        decoration: const InputDecoration(
                          hintText: 'Enter Booking ID or Scan QR (e.g. SPV-BK-9921)...',
                          hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 11.5),
                          border: InputBorder.none,
                          isDense: true,
                          contentPadding: EdgeInsets.symmetric(vertical: 10),
                        ),
                        onSubmitted: (val) => _performCheckIn(val),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF16A34A),
                      side: const BorderSide(color: Color(0xFF16A34A)),
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: _showQRScannerModal,
                    icon: const Icon(Icons.qr_code_scanner, size: 16),
                    label: const Text('Scan QR', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                  ),
                  const SizedBox(width: 6),
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF16A34A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    onPressed: () => _performCheckIn(_checkInInputController.text),
                    child: const Text('Check In', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),

        const SizedBox(height: 16),

        // Filter chips row
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Reservations List',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
            ),
            Row(
              children: ['All', 'Upcoming', 'Completed', 'Cancelled'].map((filter) {
                final isSelected = _bookingFilter == filter;
                return Padding(
                  padding: const EdgeInsets.only(left: 4),
                  child: ChoiceChip(
                    label: Text(filter, style: TextStyle(fontSize: 10, color: isSelected ? Colors.white : AppColors.primaryBlack, fontWeight: FontWeight.bold)),
                    selected: isSelected,
                    selectedColor: AppColors.warmAccent,
                    onSelected: (val) {
                      if (val) setState(() => _bookingFilter = filter);
                    },
                  ),
                );
              }).toList(),
            ),
          ],
        ),

        const SizedBox(height: 12),

        if (filteredBookings.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Text('No reservations matching current filter.', style: TextStyle(color: Colors.grey)),
            ),
          )
        else
          ...filteredBookings.map((booking) {
            final isUpcoming = booking.bookingStatus == 'Upcoming';
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 1,
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          booking.bookingId,
                          style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warmAccent, fontFamily: 'monospace'),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: booking.bookingStatus == 'Completed'
                                ? const Color(0xFFDCFCE7)
                                : booking.bookingStatus == 'Cancelled'
                                    ? const Color(0xFFFEE2E2)
                                    : const Color(0xFFFEF3C7),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            booking.bookingStatus,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: booking.bookingStatus == 'Completed'
                                  ? const Color(0xFF16A34A)
                                  : booking.bookingStatus == 'Cancelled'
                                      ? const Color(0xFFDC2626)
                                      : const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      booking.groundName,
                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Player: ${booking.userName}  •  Sport: ${booking.sportType}',
                      style: const TextStyle(fontSize: 11.5, color: AppColors.secondaryText),
                    ),
                    Text(
                      'Date: ${booking.date}  •  Slot: ${booking.slotTime}',
                      style: const TextStyle(fontSize: 11.5, color: AppColors.secondaryText),
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Paid: ₹${booking.totalPrice.toInt()}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5)),
                        if (isUpcoming)
                          Row(
                            children: [
                              TextButton(
                                onPressed: () => _cancelBooking(booking),
                                child: const Text('Cancel', style: TextStyle(color: Colors.red, fontSize: 11)),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF16A34A),
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                ),
                                onPressed: () => _performCheckIn(booking.bookingId),
                                child: const Text('Confirm Check-In', style: TextStyle(color: Colors.white, fontSize: 11)),
                              ),
                            ],
                          )
                        else
                          Text(
                            booking.bookingStatus == 'Completed' ? '✅ Completed Check-In' : '✕ Cancelled',
                            style: TextStyle(
                              fontSize: 11,
                              color: booking.bookingStatus == 'Completed' ? Colors.green : Colors.grey,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                      ],
                    )
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }

  // ── Tab 3: Customer Management Tab ──
  Widget _buildCustomersTab() {
    final Set<String> uniqueUserNames = _allBookings.map((b) => b.userName).toSet();

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Registered Facility Customers (${uniqueUserNames.length})',
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        if (uniqueUserNames.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Text('No customer bookings recorded yet.', style: TextStyle(color: Colors.grey)),
            ),
          )
        else
          ...uniqueUserNames.map((name) {
            final userBookings = _allBookings.where((b) => b.userName == name).toList();
            final double totalSpent = userBookings.fold(0.0, (sum, b) => sum + b.totalPrice);

            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              elevation: 1,
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.warmAccent.withValues(alpha: 0.15),
                  child: Text(
                    name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'P',
                    style: const TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold),
                  ),
                ),
                title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                subtitle: Text('Total Reservations: ${userBookings.length} • Spent: ₹${totalSpent.toInt()}', style: const TextStyle(fontSize: 11)),
                trailing: IconButton(
                  icon: const Icon(Icons.phone_outlined, color: Colors.green),
                  tooltip: 'Contact Customer',
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Contacting customer $name... (+91 9988776655)')),
                    );
                  },
                ),
              ),
            );
          }),
      ],
    );
  }

  // ── Tab 4: Insights & Analytics Tab ──
  Widget _buildInsightsTab(double totalRevenue) {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Facility Performance & Analytics',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          color: const Color(0xFF0F172A),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.insights, color: AppColors.warmAccent, size: 20),
                    SizedBox(width: 8),
                    Text('Occupancy & Peak Demands', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 14),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Peak Reservation Hours:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('05:00 PM - 09:00 PM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                const Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Average Court Occupancy:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('82%', style: TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Total Realized Earnings:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('₹${totalRevenue.toInt()}', style: const TextStyle(color: Color(0xFF4ADE80), fontWeight: FontWeight.bold, fontSize: 13)),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Activity Notifications
        const Text(
          'Facility Activity & Logs',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        ..._notifications.map((notif) {
          return Card(
            margin: const EdgeInsets.only(bottom: 10),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            child: ListTile(
              leading: const Icon(Icons.notifications_active_outlined, color: AppColors.warmAccent),
              title: Text(notif['title']!, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
              subtitle: Text(notif['body']!, style: const TextStyle(fontSize: 10.5)),
              trailing: Text(notif['time']!, style: const TextStyle(fontSize: 9.5, color: Colors.grey)),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildKpiCard(String label, String value, IconData icon, Color color) {
    return Column(
      children: [
        CircleAvatar(
          backgroundColor: color.withValues(alpha: 0.12),
          radius: 18,
          child: Icon(icon, color: color, size: 18),
        ),
        const SizedBox(height: 6),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13.5)),
        Text(label, style: const TextStyle(fontSize: 9.5, color: Colors.grey)),
      ],
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
                color: const Color(0xFF16A34A).withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.shield_outlined, size: 54, color: Color(0xFF16A34A)),
            ),
            const SizedBox(height: 20),
            const Text(
              'Station Access Restricted',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w900,
                color: AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Please sign in with your approved Station Owner account to access arena controls, pricing schedules, and live check-in gate.',
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
                    _loadDashboardData();
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlack,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                icon: const Icon(Icons.login_rounded, size: 18),
                label: const Text('Sign In to Station', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
