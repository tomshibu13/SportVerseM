import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/ground_model.dart';
import '../models/booking_model.dart';
import '../utils/validators.dart';
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

  Map<String, dynamic> _dashboardStats = {};

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
      final ownerId = (user?['_id'] ?? user?['id'] ?? user?['userId'] ?? user?['user_id'] ?? '').toString();

      if (ownerId.isEmpty) {
        if (mounted) setState(() => _isLoading = false);
        return;
      }

      final grounds = await ApiService.fetchGroundsByOwner(ownerId);
      final bookings = await ApiService.fetchOwnerBookings(ownerId);
      final stats = await ApiService.fetchOwnerDashboardStats(ownerId);

      if (mounted) {
        setState(() {
          _myGrounds = grounds;
          _allBookings = bookings;
          _dashboardStats = stats;
          _isLoading = false;
        });
      }
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
    DateTime selectedDate = DateTime.now();
    String selectedCourt = 'Court 1';
    List<String> availableCourts = ['Court 1'];
    List<GroundSlot> slots = [];
    bool isLoading = true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, modalSetState) {
            void loadSlots() async {
              modalSetState(() => isLoading = true);
              try {
                final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
                final res = await ApiService.fetchSlots(
                  groundId: ground.groundId,
                  date: dateStr,
                  courtId: selectedCourt,
                );
                final List<GroundSlot> fetchedSlots = (res['slots'] as List<GroundSlot>?) ?? [];
                final List<String> fetchedCourts = (res['courts'] as List<String>?) ?? ['Court 1'];
                modalSetState(() {
                  slots = fetchedSlots;
                  availableCourts = fetchedCourts.isNotEmpty ? fetchedCourts : ['Court 1'];
                  if (!availableCourts.contains(selectedCourt)) {
                    selectedCourt = availableCourts.first;
                  }
                  isLoading = false;
                });
              } catch (_) {
                modalSetState(() => isLoading = false);
              }
            }

            // Trigger initial load
            if (isLoading && slots.isEmpty) {
              loadSlots();
            }

            return Container(
              height: MediaQuery.of(context).size.height * 0.88,
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
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
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
                              const Text('Dynamic Slot Manager & Real-Time Availability', style: TextStyle(fontSize: 11, color: AppColors.secondaryText)),
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
                  const Divider(height: 1),

                  // Quick Action Toolbar: Generate 7-Days & Add Custom Slot
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: const Color(0xFFF9F7F4),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              side: const BorderSide(color: Color(0xFFC8895B)),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.auto_awesome, size: 16, color: Color(0xFFC8895B)),
                            label: const Text('Auto-Gen 7 Days', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFFC8895B))),
                            onPressed: () async {
                              final confirm = await showDialog<bool>(
                                context: context,
                                builder: (dCtx) => AlertDialog(
                                  title: const Text('Generate 7-Day Slot Schedule'),
                                  content: Text(
                                    'This will automatically generate standard hourly slots (06:00 AM - 10:00 PM) for the next 7 days for ${ground.title} at ₹${ground.pricePerHour.toInt()}/hr.',
                                  ),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(dCtx, false), child: const Text('Cancel')),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                                      onPressed: () => Navigator.pop(dCtx, true),
                                      child: const Text('Generate Slots', style: TextStyle(color: Colors.white)),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm == true) {
                                modalSetState(() => isLoading = true);
                                await ApiService.generateSlots(
                                  groundId: ground.groundId,
                                  days: 7,
                                  courts: availableCourts,
                                  pricePerHour: ground.pricePerHour,
                                );
                                loadSlots();
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primaryBlack,
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            icon: const Icon(Icons.add, size: 16, color: Colors.white),
                            label: const Text('Add Single Slot', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                            onPressed: () {
                              final slotFormKey = GlobalKey<FormState>();
                              final startTimeController = TextEditingController(text: '06:00 AM');
                              final endTimeController = TextEditingController(text: '07:00 AM');
                              final priceController = TextEditingController(text: ground.pricePerHour.toInt().toString());
                              String slotCourt = selectedCourt;

                              showDialog(
                                context: context,
                                builder: (dCtx) => StatefulBuilder(
                                  builder: (dialogCtx, dSetState) => AlertDialog(
                                    title: const Text('Create Custom Slot'),
                                    content: SingleChildScrollView(
                                      child: Form(
                                        key: slotFormKey,
                                        child: Column(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            Text('Date: ${DateFormat('yyyy-MM-dd').format(selectedDate)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                            const SizedBox(height: 12),
                                            TextFormField(
                                              controller: startTimeController,
                                              validator: (v) => Validators.required(v, 'Start Time'),
                                              autovalidateMode: AutovalidateMode.onUserInteraction,
                                              decoration: const InputDecoration(
                                                labelText: 'Start Time (e.g. 06:00 AM)',
                                                border: OutlineInputBorder(),
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            TextFormField(
                                              controller: endTimeController,
                                              validator: (v) => Validators.required(v, 'End Time'),
                                              autovalidateMode: AutovalidateMode.onUserInteraction,
                                              decoration: const InputDecoration(
                                                labelText: 'End Time (e.g. 07:00 AM)',
                                                border: OutlineInputBorder(),
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            TextFormField(
                                              controller: priceController,
                                              keyboardType: TextInputType.number,
                                              validator: Validators.price,
                                              autovalidateMode: AutovalidateMode.onUserInteraction,
                                              decoration: const InputDecoration(
                                                labelText: 'Rate / Price (₹)',
                                                border: OutlineInputBorder(),
                                              ),
                                            ),
                                            const SizedBox(height: 10),
                                            DropdownButtonFormField<String>(
                                              initialValue: slotCourt,
                                              decoration: const InputDecoration(
                                                labelText: 'Court / Pitch',
                                                border: OutlineInputBorder(),
                                              ),
                                              items: availableCourts.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
                                              onChanged: (val) {
                                                if (val != null) dSetState(() => slotCourt = val);
                                              },
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                    actions: [
                                      TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
                                      ElevatedButton(
                                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                                        onPressed: () async {
                                          if (!(slotFormKey.currentState?.validate() ?? false)) {
                                            return;
                                          }
                                          final sTime = startTimeController.text.trim();
                                          final eTime = endTimeController.text.trim();
                                          final timeErr = Validators.timeRange(sTime, eTime);
                                          if (timeErr != null) {
                                            ScaffoldMessenger.of(context).showSnackBar(
                                              SnackBar(content: Text(timeErr), backgroundColor: Colors.redAccent),
                                            );
                                            return;
                                          }
                                          final price = double.tryParse(priceController.text) ?? ground.pricePerHour;
                                          final dateStr = DateFormat('yyyy-MM-dd').format(selectedDate);
                                          Navigator.pop(dCtx);

                                          await ApiService.createSlot({
                                            'ground_id': ground.groundId,
                                            'date': dateStr,
                                            'court_id': slotCourt,
                                            'start_time': sTime,
                                            'end_time': eTime,
                                            'price': price,
                                          });
                                          loadSlots();
                                        },
                                        child: const Text('Create Slot', style: TextStyle(color: Colors.white)),
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
                  ),

                  // Date selector horizontal bar
                  Container(
                    height: 56,
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      scrollDirection: Axis.horizontal,
                      itemCount: 14,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (context, idx) {
                        final d = DateTime.now().add(Duration(days: idx));
                        final isSel = DateFormat('yyyy-MM-dd').format(d) == DateFormat('yyyy-MM-dd').format(selectedDate);
                        return InkWell(
                          onTap: () {
                            modalSetState(() => selectedDate = d);
                            loadSlots();
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(
                              color: isSel ? AppColors.primaryBlack : const Color(0xFFF9F7F4),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: isSel ? AppColors.primaryBlack : AppColors.border),
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  idx == 0 ? 'TODAY' : DateFormat('E').format(d).toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 9,
                                    fontWeight: FontWeight.bold,
                                    color: isSel ? const Color(0xFFC8895B) : AppColors.mutedText,
                                  ),
                                ),
                                Text(
                                  DateFormat('d MMM').format(d),
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: isSel ? Colors.white : AppColors.primaryBlack,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                  // Court selector chips
                  if (availableCourts.length > 1)
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: Row(
                        children: availableCourts.map((court) {
                          final isSel = selectedCourt == court;
                          return Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(court, style: TextStyle(fontSize: 11, color: isSel ? Colors.white : AppColors.primaryBlack)),
                              selected: isSel,
                              selectedColor: AppColors.primaryBlack,
                              backgroundColor: const Color(0xFFF9F7F4),
                              onSelected: (v) {
                                if (v && selectedCourt != court) {
                                  modalSetState(() => selectedCourt = court);
                                  loadSlots();
                                }
                              },
                            ),
                          );
                        }).toList(),
                      ),
                    ),

                  const Divider(height: 1),

                  // Slots List
                  Expanded(
                    child: isLoading
                        ? const Center(child: CircularProgressIndicator(strokeWidth: 2.5, color: Color(0xFFC8895B)))
                        : slots.isEmpty
                            ? Center(
                                child: Padding(
                                  padding: const EdgeInsets.all(24),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      const Icon(Icons.calendar_today_outlined, size: 40, color: AppColors.mutedText),
                                      const SizedBox(height: 8),
                                      Text(
                                        'No slots found for ${DateFormat('dd MMM yyyy').format(selectedDate)} ($selectedCourt).',
                                        textAlign: TextAlign.center,
                                        style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                                      ),
                                      const SizedBox(height: 12),
                                      ElevatedButton.icon(
                                        style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFC8895B)),
                                        icon: const Icon(Icons.auto_awesome, size: 16, color: Colors.white),
                                        label: const Text('Generate Slots Now', style: TextStyle(color: Colors.white, fontSize: 12)),
                                        onPressed: () async {
                                          modalSetState(() => isLoading = true);
                                          await ApiService.generateSlots(
                                            groundId: ground.groundId,
                                            days: 7,
                                            courts: availableCourts,
                                            pricePerHour: ground.pricePerHour,
                                          );
                                          loadSlots();
                                        },
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            : ListView.builder(
                                padding: const EdgeInsets.all(16),
                                itemCount: slots.length,
                                itemBuilder: (context, index) {
                                  final slot = slots[index];
                                  final isBooked = slot.isBooked;
                                  final isBlocked = slot.isBlocked;
                                  final isExpired = slot.isExpired;

                                  Color statusColor = const Color(0xFF16A34A);
                                  String statusText = 'Available';
                                  IconData statusIcon = Icons.check_circle_outline;

                                  if (isBooked) {
                                    statusColor = const Color(0xFFDC2626);
                                    statusText = 'Booked';
                                    statusIcon = Icons.lock_rounded;
                                  } else if (isBlocked) {
                                    statusColor = const Color(0xFF64748B);
                                    statusText = 'Blocked';
                                    statusIcon = Icons.block_rounded;
                                  } else if (isExpired) {
                                    statusColor = const Color(0xFF94A3B8);
                                    statusText = 'Expired';
                                    statusIcon = Icons.history_toggle_off;
                                  }

                                  return Card(
                                    margin: const EdgeInsets.only(bottom: 10),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    color: isBooked
                                        ? const Color(0xFFFFF1F2)
                                        : isBlocked
                                            ? const Color(0xFFF1F5F9)
                                            : Colors.white,
                                    elevation: 0.5,
                                    child: Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                                      child: Row(
                                        children: [
                                          Icon(statusIcon, color: statusColor, size: 20),
                                          const SizedBox(width: 12),
                                          Expanded(
                                            child: Column(
                                              crossAxisAlignment: CrossAxisAlignment.start,
                                              children: [
                                                Row(
                                                  children: [
                                                    Text(slot.time, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                                    const SizedBox(width: 8),
                                                    Container(
                                                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                                      decoration: BoxDecoration(
                                                        color: statusColor.withValues(alpha: 0.12),
                                                        borderRadius: BorderRadius.circular(4),
                                                      ),
                                                      child: Text(
                                                        statusText,
                                                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: statusColor),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                                const SizedBox(height: 2),
                                                Text(
                                                  '${slot.courtId}  •  ₹${slot.price.toInt()}/hr',
                                                  style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                                ),
                                              ],
                                            ),
                                          ),
                                          // Price Edit Button
                                          IconButton(
                                            icon: const Icon(Icons.edit_outlined, size: 18, color: Colors.blueAccent),
                                            tooltip: 'Edit Price',
                                            onPressed: () {
                                              final priceFormKey = GlobalKey<FormState>();
                                              final priceController = TextEditingController(text: slot.price.toInt().toString());
                                              showDialog(
                                                context: context,
                                                builder: (dCtx) => AlertDialog(
                                                  title: Text('Edit Price: ${slot.time}'),
                                                  content: Form(
                                                    key: priceFormKey,
                                                    child: TextFormField(
                                                      controller: priceController,
                                                      keyboardType: TextInputType.number,
                                                      validator: Validators.price,
                                                      autovalidateMode: AutovalidateMode.onUserInteraction,
                                                      decoration: const InputDecoration(
                                                        labelText: 'Rate (₹)',
                                                        border: OutlineInputBorder(),
                                                      ),
                                                    ),
                                                  ),
                                                  actions: [
                                                    TextButton(onPressed: () => Navigator.pop(dCtx), child: const Text('Cancel')),
                                                    ElevatedButton(
                                                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                                                      onPressed: () async {
                                                        if (!(priceFormKey.currentState?.validate() ?? false)) {
                                                          return;
                                                        }
                                                        final newPrice = double.tryParse(priceController.text) ?? slot.price;
                                                        Navigator.pop(dCtx);
                                                        await ApiService.updateSlot(slot.slotId, {'price': newPrice});
                                                        loadSlots();
                                                      },
                                                      child: const Text('Save', style: TextStyle(color: Colors.white)),
                                                    ),
                                                  ],
                                                ),
                                              );
                                            },
                                          ),
                                          // Block / Unblock Button (if not booked)
                                          if (!isBooked)
                                            IconButton(
                                              icon: Icon(
                                                isBlocked ? Icons.lock_open : Icons.block,
                                                size: 18,
                                                color: isBlocked ? const Color(0xFF16A34A) : const Color(0xFF64748B),
                                              ),
                                              tooltip: isBlocked ? 'Unblock Slot' : 'Block Slot',
                                              onPressed: () async {
                                                final newStatus = isBlocked ? 'Available' : 'Blocked';
                                                await ApiService.updateSlot(slot.slotId, {'status': newStatus});
                                                loadSlots();
                                              },
                                            ),
                                          // Delete Slot Button (if not booked)
                                          if (!isBooked)
                                            IconButton(
                                              icon: const Icon(Icons.delete_outline, size: 18, color: Colors.redAccent),
                                              tooltip: 'Delete Slot',
                                              onPressed: () async {
                                                await ApiService.deleteSlot(slot.slotId);
                                                loadSlots();
                                              },
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
    final formKey = GlobalKey<FormState>();
    final titleController = TextEditingController(text: ground.title);
    final locationController = TextEditingController(text: ground.location);
    final priceController = TextEditingController(text: ground.pricePerHour.toInt().toString());

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Edit Facility Details'),
        content: SingleChildScrollView(
          child: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: titleController,
                  validator: Validators.groundTitle,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  decoration: const InputDecoration(labelText: 'Facility Name', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: locationController,
                  validator: Validators.city,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  decoration: const InputDecoration(labelText: 'Location / City', border: OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: priceController,
                  keyboardType: TextInputType.number,
                  validator: Validators.price,
                  autovalidateMode: AutovalidateMode.onUserInteraction,
                  decoration: const InputDecoration(labelText: 'Base Price per Hour (₹)', border: OutlineInputBorder()),
                ),
              ],
            ),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
            onPressed: () async {
              if (!(formKey.currentState?.validate() ?? false)) {
                return;
              }
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

    final double totalRevenue = (_dashboardStats['totalEarnings'] as num?)?.toDouble() ??
        _allBookings
            .where((b) => b.bookingStatus == 'Completed' || b.bookingStatus == 'Upcoming')
            .fold(0.0, (sum, item) => sum + item.totalPrice);

    final totalBookingsCount = (_dashboardStats['totalBookings'] as num?)?.toInt() ?? _allBookings.length;
    final totalGroundsCount = (_dashboardStats['totalGrounds'] as num?)?.toInt() ?? _myGrounds.length;
    final completedCheckIns = (_dashboardStats['checkedInCount'] as num?)?.toInt() ??
        _allBookings.where((b) => b.bookingStatus == 'Completed').length;

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
                      _buildKpiCard('Reservations', '$totalBookingsCount', Icons.calendar_today_outlined, const Color(0xFF2563EB)),
                      _buildKpiCard('Facilities', '$totalGroundsCount', Icons.stadium_outlined, const Color(0xFFEA580C)),
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
                    final customerBooking = _allBookings.firstWhere(
                      (b) => b.userName == name,
                      orElse: () => _allBookings.first,
                    );
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Contacting customer $name for reservation ${customerBooking.bookingId}...')),
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
    final peakHours = _dashboardStats['peakReservationHours']?.toString() ?? '05:00 PM - 09:00 PM';
    final courtOccupancy = _dashboardStats['courtOccupancy']?.toString() ??
        (_myGrounds.isEmpty ? '0%' : '${((_allBookings.length / (_myGrounds.length * 8).clamp(1, 999)) * 100).toInt()}%');
    final recentActivities = (_dashboardStats['recentActivities'] as List?) ?? [];
    final List<Map<String, String>> displayLogs = recentActivities.isNotEmpty
        ? recentActivities.map((a) {
            final map = a is Map ? a : <String, dynamic>{};
            return {
              'title': (map['title'] ?? 'Facility Update').toString(),
              'body': (map['description'] ?? map['body'] ?? 'Live facility update').toString(),
              'time': (map['time'] ?? 'Just now').toString(),
            };
          }).toList()
        : _allBookings.take(4).map((b) => {
              'title': b.bookingStatus == 'Completed' ? 'Check-In Confirmed' : 'New Reservation Confirmed',
              'body': '${b.userName} reserved ${b.groundName} for ${b.slotTime} (${b.date}).',
              'time': b.bookingStatus,
            }).toList();

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
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Peak Reservation Hours:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text(peakHours, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Average Court Occupancy:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    Text(courtOccupancy, style: const TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold, fontSize: 12)),
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
        if (displayLogs.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16.0),
              child: Center(
                child: Text('No recent activity recorded for your grounds.', style: TextStyle(color: Colors.grey, fontSize: 12)),
              ),
            ),
          )
        else
          ...displayLogs.map((notif) {
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
