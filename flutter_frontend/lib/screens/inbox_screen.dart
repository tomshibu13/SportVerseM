import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  final List<Map<String, dynamic>> _notifications = [
    {
      'title': 'AI Recommendation ✨',
      'body': 'Kickoff Arena added a 20% discount on 7:00 PM slots for tonight!',
      'time': '10 mins ago',
      'icon': Icons.auto_awesome,
      'unread': true,
    },
    {
      'title': 'Booking Confirmed 🎟️',
      'body': 'Your booking at Smash Court (Badminton Court #3) is confirmed.',
      'time': '2 hours ago',
      'icon': Icons.check_circle_outline,
      'unread': false,
    },
    {
      'title': 'Match Challenge 🏆',
      'body': 'Rahul invited you to a 7v7 Football match at Malaparamba Turf.',
      'time': '1 day ago',
      'icon': Icons.sports_soccer,
      'unread': false,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: const Text(
          'Inbox & Notifications',
          style: TextStyle(
            color: AppColors.primaryBlack,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
      ),
      body: ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        itemCount: _notifications.length,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (context, index) {
          final item = _notifications[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: item['unread']
                  ? AppColors.lightDecorAccent.withValues(alpha: 0.3)
                  : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: item['unread'] ? AppColors.warmAccent : AppColors.border,
              ),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: AppColors.warmAccent.withValues(alpha: 0.15),
                  child: Icon(
                    item['icon'] as IconData,
                    color: AppColors.warmAccent,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item['title'] as String,
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlack,
                            ),
                          ),
                          Text(
                            item['time'] as String,
                            style: const TextStyle(
                              fontSize: 10,
                              color: AppColors.mutedText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['body'] as String,
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.secondaryText,
                          height: 1.3,
                        ),
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
}
