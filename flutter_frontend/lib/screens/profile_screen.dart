import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';
import '../widgets/top_navigation_bar.dart';
import '../services/auth_service.dart';
import 'login_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    if (AuthService.currentToken != null) {
      setState(() => _isLoading = true);
      await AuthService.getMe();
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showEditProfileDialog() {
    final user = AuthService.currentUser;
    final nameController = TextEditingController(
      text: user?['fullName'] as String? ?? user?['full_name'] as String? ?? '',
    );
    final phoneController = TextEditingController(
      text: user?['phone'] as String? ?? '',
    );

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text(
            'Edit Personal Information',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline, size: 18),
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Phone Number',
                  prefixIcon: Icon(Icons.phone_outlined, size: 18),
                  border: OutlineInputBorder(),
                  hintText: 'Enter your mobile number',
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlack,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                final newName = nameController.text.trim();
                final newPhone = phoneController.text.trim();
                final res = await AuthService.updateProfile(
                  fullName: newName,
                  phone: newPhone,
                );
                if (context.mounted) {
                  setState(() {});
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(res['message'] as String),
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              child: const Text('Save', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final fullName = (user?['fullName'] as String?)?.isNotEmpty == true
        ? user!['fullName'] as String
        : (user?['full_name'] as String?)?.isNotEmpty == true
            ? user!['full_name'] as String
            : 'User';
    final email = (user?['email'] as String?)?.isNotEmpty == true
        ? user!['email'] as String
        : '';
    final phone = (user?['phone'] as String?)?.isNotEmpty == true
        ? user!['phone'] as String
        : 'Not provided';
    final role = user?['role'] as String? ?? 'User';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.warmAccent),
            )
          : SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Top User Profile Info Header (Dynamic from Database) ──
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      // Avatar with Gold Ring & Camera Badge
                      Stack(
                        children: [
                          Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                  color: AppColors.warmAccent, width: 2.5),
                              image: const DecorationImage(
                                image: AssetImage('assets/images/hero_kick.png'),
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                          Positioned(
                            right: 0,
                            bottom: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.warmAccent,
                                shape: BoxShape.circle,
                                border:
                                    Border.all(color: Colors.white, width: 2),
                              ),
                              child: const Icon(
                                Icons.camera_alt,
                                size: 14,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(width: 16),

                      // Dynamic User Details Text from MongoDB
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Flexible(
                                  child: Text(
                                    fullName,
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                    style: const TextStyle(
                                      fontSize: 20,
                                      fontWeight: FontWeight.w900,
                                      color: AppColors.primaryBlack,
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 6),
                                const Icon(Icons.verified,
                                    color: Colors.amber, size: 18),
                              ],
                            ),
                            const SizedBox(height: 2),
                            Text(
                              email,
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.secondaryText,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Row(
                              children: [
                                const Icon(Icons.phone_outlined,
                                    size: 12, color: AppColors.mutedText),
                                const SizedBox(width: 4),
                                Text(
                                  phone,
                                  style: const TextStyle(
                                      fontSize: 11, color: AppColors.secondaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 2),
                            const Row(
                              children: [
                                Icon(Icons.location_on_outlined,
                                    size: 12, color: AppColors.mutedText),
                                SizedBox(width: 4),
                                Text(
                                  'Calicut, Kerala, India',
                                  style: TextStyle(
                                      fontSize: 11, color: AppColors.secondaryText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),

                            // Dynamic Role Member Badge
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.lightDecorAccent,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                    color: AppColors.warmAccent
                                        .withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.workspace_premium,
                                      size: 12, color: AppColors.warmAccent),
                                  const SizedBox(width: 4),
                                  Text(
                                    '$role Member',
                                    style: const TextStyle(
                                      fontSize: 10,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.warmAccent,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 20),

                  // ── 5 Quick Stat Metrics Row Cards ──
                  Container(
                    padding:
                        const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
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
                    child: SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      physics: const BouncingScrollPhysics(),
                      child: Row(
                        children: [
                          const SizedBox(width: 8),
                          _buildStatColumn(
                              '12', 'Bookings', Icons.calendar_today_outlined),
                          const SizedBox(width: 12),
                          _buildStatDivider(),
                          const SizedBox(width: 12),
                          _buildStatColumn(
                              '5', 'Tournaments', Icons.emoji_events_outlined),
                          const SizedBox(width: 12),
                          _buildStatDivider(),
                          const SizedBox(width: 12),
                          _buildStatColumn('4.8', 'Rating', Icons.star_outline),
                          const SizedBox(width: 12),
                          _buildStatDivider(),
                          const SizedBox(width: 12),
                          _buildStatColumn('28', 'Badges',
                              Icons.local_fire_department_outlined),
                          const SizedBox(width: 12),
                          _buildStatDivider(),
                          const SizedBox(width: 12),
                          _buildStatColumn('₹1,250', 'Wallet',
                              Icons.account_balance_wallet_outlined),
                          const SizedBox(width: 8),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Dark Fitness Overview Card ──
                  Container(
                    padding: const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F1116),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.15),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text(
                              'Fitness Overview',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            GestureDetector(
                              onTap: () {},
                              child: const Row(
                                children: [
                                  Text(
                                    'View Details',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.warmAccent,
                                    ),
                                  ),
                                  SizedBox(width: 2),
                                  Icon(Icons.arrow_forward_ios,
                                      size: 10, color: AppColors.warmAccent),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Score Dial + 4 Metrics Grid Row
                        Row(
                          children: [
                            // Left Fitness Dial Ring
                            Column(
                              children: [
                                Container(
                                  width: 84,
                                  height: 84,
                                  decoration: BoxDecoration(
                                    shape: BoxShape.circle,
                                    border: Border.all(
                                      color: AppColors.warmAccent,
                                      width: 4,
                                    ),
                                  ),
                                  child: const Column(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      Icon(Icons.directions_run,
                                          size: 18, color: AppColors.warmAccent),
                                      Text(
                                        '82',
                                        style: TextStyle(
                                          fontSize: 22,
                                          fontWeight: FontWeight.w900,
                                          color: Colors.white,
                                        ),
                                      ),
                                      Text(
                                        'Fitness Score',
                                        style: TextStyle(
                                          fontSize: 8,
                                          color: Colors.white54,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                const SizedBox(height: 6),
                                const Text(
                                  'Great Job!',
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.warmAccent,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(width: 20),

                            // Right 4 Stats
                            Expanded(
                              child: GridView.count(
                                shrinkWrap: true,
                                crossAxisCount: 2,
                                childAspectRatio: 2.2,
                                physics: const NeverScrollableScrollPhysics(),
                                children: [
                                  _buildFitnessMetric(
                                      '6,842', 'Steps', '/10,000', Icons.directions_walk),
                                  _buildFitnessMetric(
                                      '428', 'kcal', 'Calories', Icons.local_fire_department),
                                  _buildFitnessMetric(
                                      '48', 'min', 'Active Time', Icons.access_time),
                                  _buildFitnessMetric(
                                      '4.7', 'km', 'Distance', Icons.location_on),
                                ],
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 16),

                        // Bottom Weekly Goal Progress Bar
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.05),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Row(
                            children: [
                              const Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Weekly Goal',
                                    style: TextStyle(fontSize: 10, color: Colors.white54),
                                  ),
                                  Text(
                                    '5/7 Days Active',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: ClipRRect(
                                  borderRadius: BorderRadius.circular(4),
                                  child: const LinearProgressIndicator(
                                    value: 5 / 7,
                                    backgroundColor: Colors.white12,
                                    color: AppColors.warmAccent,
                                    minHeight: 8,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              const Icon(Icons.track_changes,
                                  color: AppColors.warmAccent, size: 22),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // ── Responsive Options Section (1 Column on Mobile, 2 Columns on Tablet/Desktop) ──
                  LayoutBuilder(
                    builder: (context, constraints) {
                      final isWide = constraints.maxWidth > 580;

                      final leftColumn = Column(
                        children: [
                          _buildMenuTile(
                            Icons.person_outline,
                            'Personal Information',
                            'Update your details',
                            null,
                            onTap: _showEditProfileDialog,
                          ),
                          _buildMenuTile(Icons.calendar_today_outlined,
                              'My Bookings', 'View and manage bookings', null),
                          _buildMenuTile(Icons.favorite_border, 'Favorites',
                              'Saved venues and sports', null),
                          _buildMenuTile(Icons.bar_chart, 'Fitness & Health',
                              'Track activity & progress', 'New'),
                          _buildMenuTile(Icons.track_changes,
                              'Goals & Challenges', 'Set goals & achieve more', null),
                          _buildMenuTile(
                              Icons.account_balance_wallet_outlined,
                              'Wallet & Payments',
                              'Manage transactions',
                              null),
                          const SizedBox(height: 12),

                          // Logout Button
                          SizedBox(
                            width: double.infinity,
                            height: 44,
                            child: OutlinedButton.icon(
                              onPressed: () {
                                AuthService.logout();
                                Navigator.pushAndRemoveUntil(
                                  context,
                                  MaterialPageRoute(
                                      builder: (_) => const LoginScreen()),
                                  (route) => false,
                                );
                              },
                              style: OutlinedButton.styleFrom(
                                side: const BorderSide(
                                    color: Colors.redAccent, width: 1.2),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(12),
                                ),
                              ),
                              icon: const Icon(Icons.logout,
                                  color: Colors.redAccent, size: 16),
                              label: const Text(
                                'Log Out',
                                style: TextStyle(
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ),
                        ],
                      );

                      final rightColumn = Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Recent Activities',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primaryBlack,
                                      ),
                                    ),
                                    Text(
                                      'View All',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.warmAccent,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                _buildActivityItem('Badminton', '1h 12m • 420 kcal',
                                    'Today, 7:30 PM', Icons.sports_tennis, Colors.green),
                                const SizedBox(height: 8),
                                _buildActivityItem('Running', '35 min • 280 kcal',
                                    'Today, 6:15 AM', Icons.directions_run, Colors.orange),
                                const SizedBox(height: 8),
                                _buildActivityItem('Football', '1h 30m • 650 kcal',
                                    'Yesterday, 6:00 PM', Icons.sports_soccer, Colors.purple),
                              ],
                            ),
                          ),

                          const SizedBox(height: 14),

                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(
                                      'Achievements',
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.primaryBlack,
                                      ),
                                    ),
                                    Text(
                                      'View All',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.warmAccent,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 10),
                                Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceAround,
                                  children: [
                                    _buildMedalBadge(
                                        '10K Steps', Icons.directions_walk),
                                    _buildMedalBadge('Calories Burner',
                                        Icons.local_fire_department),
                                    _buildMedalBadge(
                                        'Weekend Warrior', Icons.emoji_events),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      );

                      if (isWide) {
                        return Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(flex: 6, child: leftColumn),
                            const SizedBox(width: 14),
                            Expanded(flex: 5, child: rightColumn),
                          ],
                        );
                      } else {
                        return Column(
                          children: [
                            leftColumn,
                            const SizedBox(height: 14),
                            rightColumn,
                          ],
                        );
                      }
                    },
                  ),
                ],
              ),
            ),
    );
  }

  Widget _buildStatColumn(String value, String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 16, color: AppColors.primaryBlack),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        Text(
          label,
          style: const TextStyle(fontSize: 9, color: AppColors.mutedText),
        ),
      ],
    );
  }

  Widget _buildStatDivider() {
    return Container(
      height: 28,
      width: 1,
      color: AppColors.border,
    );
  }

  Widget _buildFitnessMetric(String value, String unit, String label, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 14, color: AppColors.warmAccent),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: Row(
                  children: [
                    Text(
                      value,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(width: 2),
                    Text(
                      unit,
                      style: const TextStyle(fontSize: 9, color: Colors.white54),
                    ),
                  ],
                ),
              ),
              Text(
                label,
                style: const TextStyle(fontSize: 8, color: Colors.white38),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMenuTile(IconData icon, String title, String subtitle, String? badge, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primaryBlack),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.warmAccent,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            badge,
                            style: const TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 9, color: AppColors.mutedText),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.mutedText),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(String sport, String details, String time, IconData icon, Color color) {
    return Row(
      children: [
        CircleAvatar(
          radius: 14,
          backgroundColor: color.withValues(alpha: 0.15),
          child: Icon(icon, size: 14, color: color),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                sport,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryBlack,
                ),
              ),
              Text(
                '$details • $time',
                style: const TextStyle(fontSize: 8, color: AppColors.mutedText),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildMedalBadge(String title, IconData icon) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            gradient: AppColors.goldGradient,
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(
                color: AppColors.warmAccent.withValues(alpha: 0.3),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Icon(icon, size: 16, color: Colors.white),
        ),
        const SizedBox(height: 4),
        Text(
          title,
          style: const TextStyle(fontSize: 8, color: AppColors.secondaryText),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }
}
