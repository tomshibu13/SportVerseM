import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';
import '../widgets/top_navigation_bar.dart';

class CommunityScreen extends StatelessWidget {
  const CommunityScreen({super.key});

  final List<Map<String, dynamic>> _posts = const [
    {
      'name': 'Calicut Football Strikers ⚽',
      'members': '128 Players',
      'activity': '7v7 Weekend Tournament at Malaparamba',
      'time': 'Sat 12 Aug, 6:00 PM',
      'type': 'Match Challenge',
    },
    {
      'name': 'Kerala Smashers Badminton 🏸',
      'members': '84 Players',
      'activity': 'Looking for 2 players for Doubles match',
      'time': 'Sun 13 Aug, 7:00 AM',
      'type': 'Player Request',
    },
    {
      'name': 'Kozhikode Hoopers 🏀',
      'members': '62 Players',
      'activity': '3v3 Half Court Casual Pickup Game',
      'time': 'Fri 11 Aug, 5:30 PM',
      'type': 'Casual Play',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      body: ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        itemCount: _posts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final item = _posts[index];
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item['name'] as String,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        item['type'] as String,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warmAccent,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  item['members'] as String,
                  style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                ),
                const Divider(height: 20),
                Text(
                  item['activity'] as String,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primaryBlack,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.access_time,
                        size: 12, color: AppColors.warmAccent),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        item['time'] as String,
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.secondaryText),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {},
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlack,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: const Text('Join Match',
                          style: TextStyle(fontSize: 11, color: Colors.white)),
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
}
