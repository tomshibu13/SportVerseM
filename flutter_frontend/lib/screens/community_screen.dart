import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';
import '../widgets/top_navigation_bar.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  final List<Map<String, dynamic>> _posts = [
    {
      'id': 'p1',
      'name': 'Calicut Football Strikers ⚽',
      'members': '128 Players',
      'activity': '7v7 Weekend Tournament at Malaparamba',
      'time': 'Sat 12 Aug, 6:00 PM',
      'type': 'Match Challenge',
      'venue': 'Kickoff Arena, Malaparamba',
      'spotsLeft': 3,
      'joined': false,
    },
    {
      'id': 'p2',
      'name': 'Kerala Smashers Badminton 🏸',
      'members': '84 Players',
      'activity': 'Looking for 2 players for Doubles match',
      'time': 'Sun 13 Aug, 7:00 AM',
      'type': 'Player Request',
      'venue': 'Smash Court, Calicut',
      'spotsLeft': 2,
      'joined': false,
    },
    {
      'id': 'p3',
      'name': 'Kozhikode Hoopers 🏀',
      'members': '62 Players',
      'activity': '3v3 Half Court Casual Pickup Game',
      'time': 'Fri 11 Aug, 5:30 PM',
      'type': 'Casual Play',
      'venue': 'Hoopster Court, Medical College Road',
      'spotsLeft': 4,
      'joined': false,
    },
  ];

  void _showJoinMatchModal(Map<String, dynamic> post) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          final isJoined = post['joined'] == true;
          return Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
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
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.sports, color: AppColors.warmAccent, size: 24),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            post['name'] as String,
                            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                          ),
                          Text(
                            post['type'] as String,
                            style: const TextStyle(fontSize: 12, color: AppColors.warmAccent, fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Text(
                  post['activity'] as String,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 16, color: AppColors.mutedText),
                    const SizedBox(width: 6),
                    Text(post['venue'] as String, style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                  ],
                ),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.access_time, size: 16, color: AppColors.warmAccent),
                    const SizedBox(width: 6),
                    Text(post['time'] as String, style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      setState(() {
                        post['joined'] = !isJoined;
                        if (post['joined'] == true) {
                          post['spotsLeft'] = (post['spotsLeft'] as int) - 1;
                        } else {
                          post['spotsLeft'] = (post['spotsLeft'] as int) + 1;
                        }
                      });
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(
                            !isJoined
                                ? '🎉 You have joined ${post['name']} match!'
                                : 'You have left the match RSVP.',
                          ),
                          backgroundColor: !isJoined ? Colors.green : AppColors.primaryBlack,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: isJoined ? Colors.red : AppColors.primaryBlack,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: Text(
                      isJoined ? 'Leave Match RSVP' : 'Confirm Match RSVP',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  void _showCreateMatchModal() {
    final titleController = TextEditingController();
    final venueController = TextEditingController(text: 'Kickoff Arena');

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
          left: 20,
          right: 20,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('🏆 Create Match Challenge', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: titleController,
              decoration: const InputDecoration(
                labelText: 'Match Title / Club Name',
                hintText: 'e.g. Kozhikode 5v5 Friendly Match',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: venueController,
              decoration: const InputDecoration(
                labelText: 'Turf / Venue Name',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  if (titleController.text.trim().isNotEmpty) {
                    setState(() {
                      _posts.insert(0, {
                        'id': 'p${DateTime.now().millisecondsSinceEpoch}',
                        'name': '${titleController.text.trim()} ⚽',
                        'members': '1 Player (Host)',
                        'activity': 'Looking for players for open slot game',
                        'time': 'Upcoming weekend',
                        'type': 'Host Challenge',
                        'venue': venueController.text.trim(),
                        'spotsLeft': 6,
                        'joined': true,
                      });
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Match challenge posted to community!'), backgroundColor: Colors.green),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warmAccent,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Post Challenge', style: TextStyle(fontWeight: FontWeight.bold)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showCreateMatchModal,
        backgroundColor: AppColors.warmAccent,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text('Post Match', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: ListView.separated(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        itemCount: _posts.length,
        separatorBuilder: (_, __) => const SizedBox(height: 14),
        itemBuilder: (context, index) {
          final item = _posts[index];
          final isJoined = item['joined'] == true;

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isJoined ? AppColors.warmAccent : AppColors.border),
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
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isJoined ? Colors.green.withValues(alpha: 0.15) : AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Text(
                        isJoined ? 'Joined ✓' : item['type'] as String,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: isJoined ? Colors.green : AppColors.warmAccent,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  '${item['members']} • ${item['spotsLeft']} spots available',
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
                    const Icon(Icons.access_time, size: 12, color: AppColors.warmAccent),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        item['time'] as String,
                        style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () => _showJoinMatchModal(item),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isJoined ? Colors.green : AppColors.primaryBlack,
                        padding: const EdgeInsets.symmetric(horizontal: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      child: Text(isJoined ? 'Joined' : 'Join Match',
                          style: const TextStyle(fontSize: 11, color: Colors.white)),
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
