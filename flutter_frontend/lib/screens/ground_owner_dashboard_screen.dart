import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
  
  // Simulated Notification Logs (Phase 2 Notifications)
  final List<Map<String, String>> _notifications = [
    {
      'title': 'New Booking Confirmed',
      'body': 'User Tom Holland booked Elite Football Arena for 07:00 PM today.',
      'time': '5 mins ago'
    },
    {
      'title': 'Ground Registration Approved',
      'body': 'Your new venue registration for Smash Arena has been approved by admin.',
      'time': '2 hours ago'
    },
    {
      'title': 'Dynamic Pricing Auto-Adjusted',
      'body': 'Slot rate increased by 15% for evening prime hour slot.',
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
    super.dispose();
  }

  Future<void> _loadDashboardData() async {
    setState(() => _isLoading = true);
    try {
      // Fetch grounds and filter those owned by current user
      final user = AuthService.currentUser;
      final ownerId = user?['id'] as int? ?? 2;
      
      final allGrounds = await ApiService.fetchGrounds();
      // Fetch bookings (which contains booking logs for all grounds)
      final bookingsList = await ApiService.fetchUserBookings(1); // loads DB bookings
      
      setState(() {
        _myGrounds = allGrounds.where((g) => g.ownerId == ownerId).toList();
        
        // If owner has no registered grounds in MongoDB yet, use fallback seeded grounds
        if (_myGrounds.isEmpty) {
          _myGrounds = allGrounds;
        }
        
        _allBookings = bookingsList;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
    }
  }

  // Phase 1 - Quick Register New Ground Link
  void _navigateToAddGround() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()),
    ).then((_) => _loadDashboardData());
  }

  // Phase 1 - Confirm Customer Check-In
  void _confirmCheckIn(BookingModel booking) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Confirm Check-in'),
        content: Text('Do you want to confirm player check-in for ${booking.userName}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
            onPressed: () {
              setState(() {
                booking.bookingStatus = 'Completed';
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('✅ Player ${booking.userName} checked in successfully!'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text('Check In', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // Phase 1 - Cancel booking
  void _cancelBooking(BookingModel booking) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Cancel Booking'),
        content: Text('Are you sure you want to cancel booking ${booking.bookingId}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('No'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            onPressed: () {
              setState(() {
                booking.bookingStatus = 'Cancelled';
              });
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('✕ Booking ${booking.bookingId} cancelled.'),
                  behavior: SnackBarBehavior.floating,
                ),
              );
            },
            child: const Text('Cancel Booking', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  // Phase 1 - Edit slot prices / availability dialog
  void _editSlots(GroundModel ground) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, modalSetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.75,
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
                              const Text('Configure Time Slots & Hourly Pricing', style: TextStyle(fontSize: 11, color: AppColors.secondaryText)),
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
                    child: ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: ground.availableSlots?.length ?? 0,
                      itemBuilder: (context, index) {
                        final slot = ground.availableSlots![index];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 12),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          color: slot.isBooked ? Colors.grey[100] : Colors.white,
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      slot.isBooked ? Icons.lock : Icons.lock_open,
                                      color: slot.isBooked ? Colors.grey : AppColors.warmAccent,
                                      size: 20,
                                    ),
                                    const SizedBox(width: 12),
                                    Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(slot.time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                        Text(
                                          slot.isBooked ? 'Status: Booked' : 'Status: Available',
                                          style: TextStyle(fontSize: 11, color: slot.isBooked ? Colors.red : Colors.green),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    Text('₹${slot.price}', style: const TextStyle(fontWeight: FontWeight.w900, color: AppColors.warmAccent)),
                                    const SizedBox(width: 8),
                                    IconButton(
                                      icon: const Icon(Icons.edit, size: 16, color: Colors.blueAccent),
                                      onPressed: () {
                                        final priceController = TextEditingController(text: slot.price.toString());
                                        showDialog(
                                          context: context,
                                          builder: (context) => AlertDialog(
                                            title: const Text('Update Slot Price'),
                                            content: TextField(
                                              controller: priceController,
                                              keyboardType: TextInputType.number,
                                              decoration: const InputDecoration(labelText: 'Price per hour (₹)'),
                                            ),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                                              ElevatedButton(
                                                style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                                                onPressed: () {
                                                  modalSetState(() {
                                                    slot.price = double.tryParse(priceController.text) ?? slot.price;
                                                  });
                                                  Navigator.pop(context);
                                                },
                                                child: const Text('Save', style: TextStyle(color: Colors.white)),
                                              )
                                            ],
                                          ),
                                        );
                                      },
                                    ),
                                  ],
                                )
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

  @override
  Widget build(BuildContext context) {
    final double totalRevenue = _allBookings
        .where((b) => b.bookingStatus == 'Completed' || b.bookingStatus == 'Upcoming')
        .fold(0.0, (sum, item) => sum + item.totalPrice);

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
          'Owner Control Center',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
        ),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.warmAccent),
            onPressed: _loadDashboardData,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : Column(
              children: [
                // ── KPI Summary Stats (Phase 2 Revenue Dashboard) ──
                Container(
                  padding: const EdgeInsets.all(16),
                  color: Colors.white,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildKpiCard('Earnings', '₹${totalRevenue.toInt()}', Icons.payments_outlined, Colors.green),
                      _buildKpiCard('Bookings', '${_allBookings.length}', Icons.calendar_today, Colors.blue),
                      _buildKpiCard('Venues', '${_myGrounds.length}', Icons.sports_soccer, Colors.deepOrange),
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
                      Tab(text: 'Venues'),
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

  // ── Tab 1: Venues / Grounds Tab (Phase 1 Ground Management) ──
  Widget _buildVenuesTab() {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Active Facilities (${_myGrounds.length})',
              style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
            ),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlack,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              ),
              onPressed: _navigateToAddGround,
              icon: const Icon(Icons.add, size: 14, color: Colors.white),
              label: const Text('Add Ground', style: TextStyle(fontSize: 11, color: Colors.white)),
            )
          ],
        ),
        const SizedBox(height: 16),
        ..._myGrounds.map((ground) {
          final imageUrl = ground.images.isNotEmpty ? ground.images[0] : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=400&q=80';
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
                      right: 12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: ground.status == 'Approved' ? Colors.green : Colors.orange,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          ground.status,
                          style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ),
                  ],
                ),
                Padding(
                  padding: const EdgeInsets.all(12),
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
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                          )
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 12, color: Colors.grey),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              ground.location,
                              style: const TextStyle(color: AppColors.secondaryText, fontSize: 11),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          TextButton.icon(
                            onPressed: () => _editSlots(ground),
                            icon: const Icon(Icons.settings, size: 14, color: AppColors.warmAccent),
                            label: const Text('Manage Slots', style: TextStyle(fontSize: 11, color: AppColors.warmAccent)),
                          ),
                          Row(
                            children: const [
                              Icon(Icons.star, color: Colors.amber, size: 14),
                              SizedBox(width: 4),
                              Text('4.8 (24 reviews)', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                            ],
                          )
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

  // ── Tab 2: Bookings Tab (Phase 1 Booking Management) ──
  Widget _buildBookingsTab() {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Customer Booking Requests',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        if (_allBookings.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Text('No active reservations in database.', style: TextStyle(color: Colors.grey)),
            ),
          )
        else
          ..._allBookings.map((booking) {
            final isUpcoming = booking.bookingStatus == 'Upcoming';
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: booking.bookingStatus == 'Completed'
                                ? Colors.green.withOpacity(0.1)
                                : booking.bookingStatus == 'Cancelled'
                                    ? Colors.red.withOpacity(0.1)
                                    : Colors.orange.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            booking.bookingStatus,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: booking.bookingStatus == 'Completed'
                                  ? Colors.green
                                  : booking.bookingStatus == 'Cancelled'
                                      ? Colors.red
                                      : Colors.orange,
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
                      'Customer: ${booking.userName}  •  Sport: ${booking.sportType}',
                      style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                    ),
                    Text(
                      'Time: ${booking.date} (${booking.slotTime})',
                      style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                    ),
                    const Divider(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Paid: ₹${booking.totalPrice}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                        if (isUpcoming)
                          Row(
                            children: [
                              TextButton(
                                onPressed: () => _cancelBooking(booking),
                                child: const Text('Cancel', style: TextStyle(color: Colors.red, fontSize: 11)),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                                ),
                                onPressed: () => _confirmCheckIn(booking),
                                child: const Text('Check In', style: TextStyle(color: Colors.white, fontSize: 11)),
                              ),
                            ],
                          )
                        else
                          const Text('Archived', style: TextStyle(fontSize: 11, color: Colors.grey)),
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

  // ── Tab 3: Customer Management Tab (Phase 2 Customers) ──
  Widget _buildCustomersTab() {
    // Collect unique customers from bookings
    final Set<String> uniqueUserNames = _allBookings.map((b) => b.userName).toSet();

    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Registered Customers',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        if (uniqueUserNames.isEmpty)
          const Center(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 40),
              child: Text('No customers found.', style: TextStyle(color: Colors.grey)),
            ),
          )
        else
          ...uniqueUserNames.map((name) {
            // Find user bookings count
            final userBookings = _allBookings.where((b) => b.userName == name).toList();
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppColors.warmAccent.withOpacity(0.2),
                  child: Text(name.substring(0, 1), style: const TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold)),
                ),
                title: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                subtitle: Text('Total Bookings: ${userBookings.length}', style: const TextStyle(fontSize: 11)),
                trailing: IconButton(
                  icon: const Icon(Icons.phone_outlined, color: Colors.green),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Calling customer $name... (+91 9988776655)')),
                    );
                  },
                ),
              ),
            );
          }),
      ],
    );
  }

  // ── Tab 4: Insights & Notifications Tab (Phase 2 Analytics) ──
  Widget _buildInsightsTab(double totalRevenue) {
    return ListView(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Analytics & AI Revenue Insights',
          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 12),
        Card(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          color: Colors.black,
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.insights, color: AppColors.warmAccent, size: 20),
                    SizedBox(width: 8),
                    Text('Occupancy Rates', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Peak Hours:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('05:00 PM - 09:00 PM', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text('Capacity Occupied:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text('76%', style: TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 20),
        
        // Notifications Center Logs
        const Text(
          'Notifications Center Logs',
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
              subtitle: Text(notif['body']!, style: const TextStyle(fontSize: 10)),
              trailing: Text(notif['time']!, style: const TextStyle(fontSize: 9, color: Colors.grey)),
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
          backgroundColor: color.withOpacity(0.1),
          radius: 20,
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14)),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }
}
