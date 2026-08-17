import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../theme/app_theme.dart';
import '../models/ground_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'bookings_screen.dart';

class GroundBookingScreen extends StatefulWidget {
  final GroundModel ground;

  const GroundBookingScreen({
    super.key,
    required this.ground,
  });

  @override
  State<GroundBookingScreen> createState() => _GroundBookingScreenState();
}

class _GroundBookingScreenState extends State<GroundBookingScreen> {
  late DateTime _selectedDate;
  final List<String> _selectedSlotTimes = [];
  final List<GroundSlot> _selectedSlots = [];

  String _selectedTimeOfDay = 'All'; // 'All', 'Morning', 'Afternoon', 'Evening'
  String _selectedPaymentMethod = 'UPI / GPay';
  bool _addEquipmentRental = false;
  bool _addRefresherDrinks = false;
  bool _isSubmitting = false;

  final TextEditingController _nameController = TextEditingController(text: 'Player');
  final TextEditingController _phoneController = TextEditingController(text: '+91 98765 43210');
  final TextEditingController _notesController = TextEditingController();

  // Generated default slot schedule for ground if available_slots is sparse
  late List<GroundSlot> _slotsForSelectedDay;

  @override
  void initState() {
    super.initState();
    _selectedDate = DateTime.now();
    final user = AuthService.currentUser;
    if (user != null) {
      final name = user['full_name'] ?? user['fullName'] ?? user['name'];
      if (name != null && name.toString().isNotEmpty) {
        _nameController.text = name.toString();
      }
      final phone = user['phone'];
      if (phone != null && phone.toString().isNotEmpty) {
        _phoneController.text = phone.toString();
      }
    }
    _generateSlotsForGround();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _generateSlotsForGround() {
    final basePrice = widget.ground.pricePerHour > 0 ? widget.ground.pricePerHour : 500.0;

    // Use ground's available slots if populated, or generate full daily schedule
    if (widget.ground.availableSlots.isNotEmpty && widget.ground.availableSlots.length >= 6) {
      _slotsForSelectedDay = List.from(widget.ground.availableSlots);
    } else {
      _slotsForSelectedDay = [
        GroundSlot(slotId: 'sl_1', time: '06:00 AM - 07:00 AM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_2', time: '07:00 AM - 08:00 AM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_3', time: '08:00 AM - 09:00 AM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_4', time: '09:00 AM - 10:00 AM', isBooked: true, price: basePrice),
        GroundSlot(slotId: 'sl_5', time: '10:00 AM - 11:00 AM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_6', time: '11:00 AM - 12:00 PM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_7', time: '03:00 PM - 04:00 PM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_8', time: '04:00 PM - 05:00 PM', isBooked: false, price: basePrice),
        GroundSlot(slotId: 'sl_9', time: '05:00 PM - 06:00 PM', isBooked: false, price: (basePrice * 1.15).roundToDouble()),
        GroundSlot(slotId: 'sl_10', time: '06:00 PM - 07:00 PM', isBooked: true, price: (basePrice * 1.25).roundToDouble()),
        GroundSlot(slotId: 'sl_11', time: '07:00 PM - 08:00 PM', isBooked: false, price: (basePrice * 1.25).roundToDouble()),
        GroundSlot(slotId: 'sl_12', time: '08:00 PM - 09:00 PM', isBooked: false, price: (basePrice * 1.25).roundToDouble()),
        GroundSlot(slotId: 'sl_13', time: '09:00 PM - 10:00 PM', isBooked: false, price: (basePrice * 1.15).roundToDouble()),
        GroundSlot(slotId: 'sl_14', time: '10:00 PM - 11:00 PM', isBooked: false, price: basePrice),
      ];
    }
  }

  List<GroundSlot> get _filteredSlots {
    return _slotsForSelectedDay.where((slot) {
      if (_selectedTimeOfDay == 'All') return true;
      final t = slot.time.toUpperCase();
      if (_selectedTimeOfDay == 'Morning') {
        return t.contains('06:00 AM') || t.contains('07:00 AM') || t.contains('08:00 AM') ||
               t.contains('09:00 AM') || t.contains('10:00 AM') || t.contains('11:00 AM');
      } else if (_selectedTimeOfDay == 'Afternoon') {
        return t.contains('12:00 PM') || t.contains('01:00 PM') || t.contains('02:00 PM') ||
               t.contains('03:00 PM') || t.contains('04:00 PM');
      } else if (_selectedTimeOfDay == 'Evening') {
        return t.contains('05:00 PM') || t.contains('06:00 PM') || t.contains('07:00 PM') ||
               t.contains('08:00 PM') || t.contains('09:00 PM') || t.contains('10:00 PM');
      }
      return true;
    }).toList();
  }

  double get _calculatedSlotsPrice {
    return _selectedSlots.fold(0.0, (sum, s) => sum + s.price);
  }

  double get _calculatedAddonsPrice {
    double add = 0.0;
    if (_addEquipmentRental) add += 100.0 * _selectedSlots.length;
    if (_addRefresherDrinks) add += 50.0;
    return add;
  }

  double get _totalBookingPrice {
    return _calculatedSlotsPrice + _calculatedAddonsPrice;
  }

  void _toggleSlotSelection(GroundSlot slot) {
    if (slot.isBooked) return;

    setState(() {
      if (_selectedSlotTimes.contains(slot.time)) {
        _selectedSlotTimes.remove(slot.time);
        _selectedSlots.removeWhere((s) => s.time == slot.time);
      } else {
        _selectedSlotTimes.add(slot.time);
        _selectedSlots.add(slot);
      }
    });
  }

  Future<void> _handleConfirmBooking() async {
    if (_selectedSlots.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please select at least one available court slot.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    final dateStr = DateFormat('yyyy-MM-dd').format(_selectedDate);
    final combinedSlotTime = _selectedSlots.map((s) => s.time).join(', ');

    final user = AuthService.currentUser;
    final userId = user?['_id'] ?? user?['id'] ?? user?['user_id'] ?? 1;
    final userName = _nameController.text.trim().isNotEmpty
        ? _nameController.text.trim()
        : (user?['full_name'] ?? user?['fullName'] ?? user?['name'] ?? 'Player');
    final slotId = _selectedSlots.isNotEmpty ? _selectedSlots.first.slotId : 'sl_1';

    try {
      final res = await ApiService.createBooking(
        userId: userId,
        groundId: widget.ground.groundId,
        groundName: widget.ground.title,
        sportType: widget.ground.sportType,
        date: dateStr,
        slotTime: combinedSlotTime,
        totalPrice: _totalBookingPrice,
        userName: userName,
        slotId: slotId,
      );

      setState(() => _isSubmitting = false);

      if (res['success'] == true && mounted) {
        final bookingData = res['booking'] is Map ? res['booking'] as Map<String, dynamic> : <String, dynamic>{};
        final bookingId = bookingData['booking_id'] ?? 'SPV-BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';

        _showBookingSuccessDialog(bookingId, dateStr, combinedSlotTime);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Unable to complete reservation. Please try again.'),
              backgroundColor: const Color(0xFFDC2626),
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Booking error: $e'),
            backgroundColor: Colors.redAccent,
          ),
        );
      }
    }
  }

  void _showBookingSuccessDialog(String bookingId, String dateStr, String slotTimeStr) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: Colors.white,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 68,
                  height: 68,
                  decoration: const BoxDecoration(
                    color: Color(0xFFE8F5E9),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.check_circle_rounded,
                    color: Color(0xFF2E7D32),
                    size: 48,
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Booking Confirmed!',
                  style: TextStyle(
                    fontSize: 22,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primaryBlack,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  'Your slot at ${widget.ground.title} is secured.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 13,
                    color: AppColors.secondaryText,
                  ),
                ),
                const SizedBox(height: 18),

                // Booking Ticket Card with QR
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF9F7F4),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppColors.border),
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Booking ID',
                            style: TextStyle(fontSize: 11, color: AppColors.mutedText),
                          ),
                          Text(
                            bookingId,
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.warmAccent,
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Date:', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                          Text(dateStr, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Time:', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                          Expanded(
                            child: Text(
                              slotTimeStr,
                              textAlign: TextAlign.right,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Total Paid:', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                          Text(
                            '₹${_totalBookingPrice.toInt()}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF2E7D32),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      // Real QR code visual
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Column(
                          children: [
                            QrImageView(
                              data: 'SPORTVERSE_QR_$bookingId',
                              version: QrVersions.auto,
                              size: 110.0,
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
                            const SizedBox(height: 6),
                            Text(
                              'SPORTVERSE_QR_$bookingId',
                              style: TextStyle(
                                fontFamily: 'monospace',
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: Colors.grey.shade800,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 24),

                // Action Buttons
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(ctx); // Close dialog
                      Navigator.pop(context); // Pop booking screen
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const BookingsScreen()),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryBlack,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(23)),
                    ),
                    child: const Text('View in My Bookings', style: TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 8),
                TextButton(
                  onPressed: () {
                    Navigator.pop(ctx);
                    Navigator.pop(context);
                  },
                  child: const Text('Back to Grounds', style: TextStyle(color: AppColors.warmAccent)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ground = widget.ground;

    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 20, color: AppColors.primaryBlack),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Book Court Slot',
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        centerTitle: true,
      ),
      bottomNavigationBar: _buildBottomCheckoutBar(),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.only(bottom: 30),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── 1. Ground Hero Info Header ──
            _buildGroundHeroHeader(ground),

            const SizedBox(height: 16),

            // ── 2. Date Selection Strip ──
            _buildDateSelectorSection(),

            const SizedBox(height: 20),

            // ── 3. Time of Day Category Tabs & Slots Grid ──
            _buildSlotsSelectionSection(),

            const SizedBox(height: 20),

            // ── 4. Optional Add-ons & Equipment Rental ──
            _buildAddonsSection(),

            const SizedBox(height: 20),

            // ── 5. Player Info & Contact Form ──
            _buildPlayerInfoSection(),

            const SizedBox(height: 20),

            // ── 6. Payment Method Selector ──
            _buildPaymentMethodSection(),

            const SizedBox(height: 20),

            // ── 7. Price Breakdown Summary ──
            _buildPriceSummarySection(),
          ],
        ),
      ),
    );
  }

  // ── 1. Ground Hero Info Header ──
  Widget _buildGroundHeroHeader(GroundModel ground) {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(14),
            child: Image.network(
              ground.images.isNotEmpty
                  ? ground.images.first
                  : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
              width: 100,
              height: 100,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                width: 100,
                height: 100,
                color: Colors.grey.shade200,
                child: const Icon(Icons.sports, color: AppColors.mutedText),
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        ground.sportType.toUpperCase(),
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warmAccent,
                        ),
                      ),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded, size: 16, color: Color(0xFFFFB300)),
                        const SizedBox(width: 2),
                        Text(
                          '${ground.rating}',
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                        ),
                        Text(
                          ' (${ground.reviewCount})',
                          style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  ground.title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
                    const SizedBox(width: 3),
                    Expanded(
                      child: Text(
                        '${ground.location} • ${ground.distanceKm} km away',
                        style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  '₹${ground.pricePerHour.toInt()} / hour',
                  style: const TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFC8895B),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── 2. Horizontal Date Selector ──
  Widget _buildDateSelectorSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '1. Select Booking Date',
                  style: TextStyle(
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                ),
                Text(
                  DateFormat('MMMM yyyy').format(_selectedDate),
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: AppColors.warmAccent,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            height: 78,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: 14,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (context, index) {
                final date = DateTime.now().add(Duration(days: index));
                final isSelected = DateFormat('yyyy-MM-dd').format(date) ==
                    DateFormat('yyyy-MM-dd').format(_selectedDate);

                return InkWell(
                  onTap: () {
                    setState(() {
                      _selectedDate = date;
                      _selectedSlotTimes.clear();
                      _selectedSlots.clear();
                    });
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 200),
                    width: 58,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primaryBlack : const Color(0xFFF9F7F4),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? AppColors.primaryBlack : AppColors.border,
                        width: isSelected ? 1.5 : 1,
                      ),
                      boxShadow: isSelected
                          ? [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.15),
                                blurRadius: 8,
                                offset: const Offset(0, 3),
                              ),
                            ]
                          : [],
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          index == 0 ? 'TODAY' : DateFormat('E').format(date).toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isSelected ? const Color(0xFFC8895B) : AppColors.mutedText,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('d').format(date),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w900,
                            color: isSelected ? Colors.white : AppColors.primaryBlack,
                          ),
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
  }

  // ── 3. Slots Filter & Grid ──
  Widget _buildSlotsSelectionSection() {
    final slots = _filteredSlots;

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                '2. Choose Available Slots',
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryBlack,
                ),
              ),
              if (_selectedSlots.isNotEmpty)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE8F5E9),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    '${_selectedSlots.length} Selected',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF2E7D32),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),

          // Time Filter Chips (All, Morning, Afternoon, Evening)
          Wrap(
            spacing: 8,
            children: ['All', 'Morning', 'Afternoon', 'Evening'].map((period) {
              final isSel = _selectedTimeOfDay == period;
              return ChoiceChip(
                label: Text(period),
                selected: isSel,
                selectedColor: const Color(0xFFC8895B),
                labelStyle: TextStyle(
                  fontSize: 11,
                  fontWeight: isSel ? FontWeight.bold : FontWeight.normal,
                  color: isSel ? Colors.white : AppColors.primaryBlack,
                ),
                backgroundColor: const Color(0xFFF9F7F4),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                onSelected: (val) {
                  if (val) setState(() => _selectedTimeOfDay = period);
                },
              );
            }).toList(),
          ),

          const SizedBox(height: 14),

          // Legend Indicators (Available, Selected, Booked)
          Row(
            children: [
              _buildLegendPill(const Color(0xFFF1F8E9), const Color(0xFF2E7D32), 'Available'),
              const SizedBox(width: 12),
              _buildLegendPill(const Color(0xFFC8895B), Colors.white, 'Selected'),
              const SizedBox(width: 12),
              _buildLegendPill(Colors.grey.shade100, Colors.grey.shade400, 'Booked'),
            ],
          ),

          const SizedBox(height: 16),

          // Slots Grid View
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: slots.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 10,
              crossAxisSpacing: 10,
              childAspectRatio: 2.2,
            ),
            itemBuilder: (context, index) {
              final slot = slots[index];
              final isSelected = _selectedSlotTimes.contains(slot.time);
              final isBooked = slot.isBooked;

              return InkWell(
                onTap: isBooked ? null : () => _toggleSlotSelection(slot),
                borderRadius: BorderRadius.circular(12),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 150),
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: isBooked
                        ? Colors.grey.shade100
                        : (isSelected ? const Color(0xFFC8895B) : Colors.white),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isBooked
                          ? Colors.grey.shade300
                          : (isSelected ? const Color(0xFFC8895B) : AppColors.border),
                      width: isSelected ? 2 : 1,
                    ),
                    boxShadow: isSelected
                        ? [
                            BoxShadow(
                              color: const Color(0xFFC8895B).withValues(alpha: 0.35),
                              blurRadius: 8,
                              offset: const Offset(0, 3),
                            ),
                          ]
                        : [],
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            slot.time,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: isBooked
                                  ? Colors.grey.shade400
                                  : (isSelected ? Colors.white : AppColors.primaryBlack),
                              decoration: isBooked ? TextDecoration.lineThrough : null,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            isBooked ? 'Unavailable' : '₹${slot.price.toInt()}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                              color: isBooked
                                  ? Colors.grey.shade400
                                  : (isSelected ? Colors.white70 : const Color(0xFF2E7D32)),
                            ),
                          ),
                        ],
                      ),
                      Icon(
                        isBooked
                            ? Icons.block_rounded
                            : (isSelected ? Icons.check_circle : Icons.radio_button_unchecked),
                        size: 18,
                        color: isBooked
                            ? Colors.grey.shade400
                            : (isSelected ? Colors.white : AppColors.mutedText),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildLegendPill(Color bg, Color fg, String label) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(3),
            border: Border.all(color: fg.withValues(alpha: 0.5)),
          ),
        ),
        const SizedBox(width: 4),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
        ),
      ],
    );
  }

  // ── 4. Add-ons & Equipment ──
  Widget _buildAddonsSection() {
    return Material(
      color: Colors.white,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '3. Add-ons & Equipment (Optional)',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.bold,
                color: AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 10),
            CheckboxListTile(
              value: _addEquipmentRental,
              onChanged: (v) => setState(() => _addEquipmentRental = v ?? false),
              title: const Text('Sports Gear & Balls / Shuttlecocks', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: const Text('Includes rackets/bats & tournament-grade balls (+₹100/slot)', style: TextStyle(fontSize: 11, color: AppColors.mutedText)),
              activeColor: const Color(0xFFC8895B),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
            CheckboxListTile(
              value: _addRefresherDrinks,
              onChanged: (v) => setState(() => _addRefresherDrinks = v ?? false),
              title: const Text('Energy Drinks & Mineral Water Pack', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              subtitle: const Text('Cold electrolyte drinks waiting at court (+₹50)', style: TextStyle(fontSize: 11, color: AppColors.mutedText)),
              activeColor: const Color(0xFFC8895B),
              contentPadding: EdgeInsets.zero,
              dense: true,
            ),
          ],
        ),
      ),
    );
  }

  // ── 5. Player Details ──
  Widget _buildPlayerInfoSection() {
    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '4. Contact Information',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlack,
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _nameController,
            decoration: InputDecoration(
              labelText: 'Lead Player Full Name',
              prefixIcon: const Icon(Icons.person_outline, size: 18, color: AppColors.warmAccent),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            decoration: InputDecoration(
              labelText: 'Phone Number (for SMS & WhatsApp Confirmation)',
              prefixIcon: const Icon(Icons.phone_outlined, size: 18, color: AppColors.warmAccent),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            ),
          ),
        ],
      ),
    );
  }

  // ── 6. Payment Method ──
  Widget _buildPaymentMethodSection() {
    final methods = [
      {'name': 'UPI / GPay', 'icon': Icons.account_balance_wallet_outlined},
      {'name': 'Credit / Debit Card', 'icon': Icons.credit_card_outlined},
      {'name': 'Pay at Venue', 'icon': Icons.storefront_outlined},
    ];

    return Container(
      color: Colors.white,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '5. Payment Method',
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: AppColors.primaryBlack,
            ),
          ),
          const SizedBox(height: 12),
          ...methods.map((m) {
            final name = m['name'] as String;
            final icon = m['icon'] as IconData;
            final isSel = _selectedPaymentMethod == name;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Material(
                color: isSel ? const Color(0xFFFDF8F4) : Colors.white,
                borderRadius: BorderRadius.circular(12),
                child: InkWell(
                  onTap: () => setState(() => _selectedPaymentMethod = name),
                  borderRadius: BorderRadius.circular(12),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    decoration: BoxDecoration(
                      border: Border.all(
                        color: isSel ? const Color(0xFFC8895B) : AppColors.border,
                        width: isSel ? 1.5 : 1.0,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          icon,
                          size: 20,
                          color: isSel ? const Color(0xFFC8895B) : AppColors.secondaryText,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            name,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                              color: isSel ? AppColors.primaryBlack : AppColors.secondaryText,
                            ),
                          ),
                        ),
                        Container(
                          width: 18,
                          height: 18,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSel ? const Color(0xFFC8895B) : const Color(0xFFD1D5DB),
                              width: isSel ? 5 : 1.5,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }

  // ── 7. Price Summary Breakdown ──
  Widget _buildPriceSummarySection() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Price Breakdown',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
          ),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Court Slots (${_selectedSlots.length} hrs)', style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
              Text('₹${_calculatedSlotsPrice.toInt()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
            ],
          ),
          if (_calculatedAddonsPrice > 0) ...[
            const SizedBox(height: 6),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('Equipment & Refreshments', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                Text('+₹${_calculatedAddonsPrice.toInt()}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text('Platform Convenience Fee', style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
              Text('FREE', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.green.shade700)),
            ],
          ),
          const Divider(height: 18),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Payable Amount',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
              ),
              Text(
                '₹${_totalBookingPrice.toInt()}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w900,
                  color: Color(0xFFC8895B),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Bottom Fixed Checkout Bar ──
  Widget _buildBottomCheckoutBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        border: const Border(top: BorderSide(color: AppColors.border)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedSlots.isEmpty ? 'No slots selected' : '${_selectedSlots.length} slot(s) selected',
                  style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                ),
                Text(
                  '₹${_totalBookingPrice.toInt()}',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w900,
                    color: Color(0xFFC8895B),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 20),
            Expanded(
              child: SizedBox(
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleConfirmBooking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlack,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                    elevation: 0,
                  ),
                  child: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'Confirm & Pay',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                            ),
                            SizedBox(width: 6),
                            Icon(Icons.arrow_forward, size: 16),
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
}
