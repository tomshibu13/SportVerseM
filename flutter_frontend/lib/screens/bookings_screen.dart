import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';

class BookingsScreen extends StatefulWidget {
  const BookingsScreen({super.key});

  @override
  State<BookingsScreen> createState() => _BookingsScreenState();
}

class _BookingsScreenState extends State<BookingsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  final List<Map<String, dynamic>> _upcomingBookings = [
    {
      'title': 'Kickoff Arena',
      'sport': 'Football (7v7 Turf)',
      'date': 'Today, 09 Aug 2026',
      'time': '07:00 PM - 08:00 PM',
      'slot': 'Slot #A2',
      'price': '₹800',
      'location': 'Malaparamba, Calicut',
      'status': 'Confirmed',
    },
    {
      'title': 'Smash Court',
      'sport': 'Badminton (Court #3)',
      'date': 'Tomorrow, 10 Aug 2026',
      'time': '06:00 AM - 07:00 AM',
      'slot': 'Court #3',
      'price': '₹400',
      'location': 'Calicut, Kerala',
      'status': 'Confirmed',
    },
  ];

  final List<Map<String, dynamic>> _completedBookings = [
    {
      'title': 'Hoopster Court',
      'sport': 'Basketball Court',
      'date': '05 Aug 2026',
      'time': '05:00 PM - 06:00 PM',
      'slot': 'Court #1',
      'price': '₹600',
      'location': 'Kozhikode, Kerala',
      'status': 'Completed',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const SportVerseTopBar(),
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
              tabs: const [
                Tab(text: 'Upcoming Bookings'),
                Tab(text: 'Completed'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
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

  Widget _buildBookingList(List<Map<String, dynamic>> bookings, {required bool isUpcoming}) {
    if (bookings.isEmpty) {
      return const Center(
        child: Text(
          'No bookings found',
          style: TextStyle(color: AppColors.mutedText, fontSize: 14),
        ),
      );
    }

    return ListView.builder(
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.all(20),
      itemCount: bookings.length,
      itemBuilder: (context, index) {
        final b = bookings[index];
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
                      b['title'] as String,
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
                      color: isUpcoming
                          ? Colors.green.withValues(alpha: 0.1)
                          : Colors.grey.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      b['status'] as String,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isUpcoming ? Colors.green : Colors.grey[700],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                b['sport'] as String,
                style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
              ),
              const Divider(height: 20),
              Row(
                children: [
                  const Icon(Icons.calendar_today, size: 14, color: AppColors.warmAccent),
                  const SizedBox(width: 6),
                  Text(
                    b['date'] as String,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                  const Spacer(),
                  const Icon(Icons.access_time, size: 14, color: AppColors.warmAccent),
                  const SizedBox(width: 6),
                  Text(
                    b['time'] as String,
                    style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                children: [
                  const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
                  const SizedBox(width: 6),
                  Text(
                    b['location'] as String,
                    style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                  ),
                  const Spacer(),
                  Text(
                    b['price'] as String,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.warmAccent,
                    ),
                  ),
                ],
              ),
              if (isUpcoming) ...[
                const SizedBox(height: 14),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: AppColors.border),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Directions',
                            style: TextStyle(fontSize: 12, color: AppColors.primaryBlack)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlack,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(10),
                          ),
                        ),
                        child: const Text('Reschedule',
                            style: TextStyle(fontSize: 12, color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}
