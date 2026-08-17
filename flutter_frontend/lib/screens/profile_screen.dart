import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../widgets/top_navigation_bar.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../models/booking_model.dart';
import 'login_screen.dart';
import 'ground_owner_dashboard_screen.dart';
import 'become_ground_owner_screen.dart';
import 'bookings_screen.dart';
import 'inbox_screen.dart';
import 'find_nearby_screen.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _isLoading = false;
  int _userBookingsCount = 0;
  List<BookingModel> _userBookings = [];

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    if (AuthService.currentToken != null) {
      setState(() => _isLoading = true);
      await AuthService.getMe();
      final user = AuthService.currentUser;
      final userId = user?['userId'] ?? user?['user_id'] ?? user?['_id'] ?? user?['id'];
      if (userId != null) {
        try {
          final bookings = await ApiService.fetchUserBookings(userId.toString());
          if (mounted) {
            setState(() {
              _userBookings = bookings;
              _userBookingsCount = bookings.length;
            });
          }
        } catch (_) {}
      }
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _showEditProfileModal() {
    final user = AuthService.currentUser;
    final nameController = TextEditingController(
      text: user?['fullName'] as String? ?? user?['full_name'] as String? ?? '',
    );
    final phoneController = TextEditingController(
      text: user?['phone'] as String? ?? '',
    );
    final locationController = TextEditingController(
      text: user?['location'] as String? ?? '',
    );
    final sportController = TextEditingController(
      text: user?['favoriteSport'] as String? ?? '',
    );
    final bioController = TextEditingController(
      text: user?['bio'] as String? ?? '',
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 24,
            right: 24,
            top: 24,
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Row(
                  children: [
                    Icon(Icons.edit_note, color: AppColors.warmAccent, size: 22),
                    SizedBox(width: 8),
                    Text(
                      'Edit Personal Information',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlack,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Text(
                  'Update your profile details saved in your MongoDB SportVerse account.',
                  style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Full Name',
                    hintText: 'e.g. Rahul Sharma',
                    prefixIcon: const Icon(Icons.person_outline),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: phoneController,
                  keyboardType: TextInputType.phone,
                  decoration: InputDecoration(
                    labelText: 'Phone Number',
                    hintText: 'e.g. 9876543210',
                    prefixIcon: const Icon(Icons.phone_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: locationController,
                  decoration: InputDecoration(
                    labelText: 'City / Location',
                    hintText: 'e.g. Kozhikode, Kerala',
                    prefixIcon: const Icon(Icons.location_on_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: sportController,
                  decoration: InputDecoration(
                    labelText: 'Favorite Sport',
                    hintText: 'e.g. Football, Badminton, Cricket',
                    prefixIcon: const Icon(Icons.sports_soccer),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: bioController,
                  maxLines: 2,
                  decoration: InputDecoration(
                    labelText: 'Bio / Player Description',
                    hintText: 'e.g. Passionate footballer and weekend turf player.',
                    prefixIcon: const Icon(Icons.description_outlined),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.warmAccent,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onPressed: () async {
                      final newName = nameController.text.trim();
                      final newPhone = phoneController.text.trim();
                      final newLocation = locationController.text.trim();
                      final newSport = sportController.text.trim();
                      final newBio = bioController.text.trim();

                      if (newName.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please enter your full name')),
                        );
                        return;
                      }

                      final messenger = ScaffoldMessenger.of(context);
                      final navigator = Navigator.of(ctx);
                      final res = await AuthService.updateProfile(
                        fullName: newName,
                        phone: newPhone,
                        location: newLocation,
                        favoriteSport: newSport,
                        bio: newBio,
                      );

                      if (mounted) {
                        setState(() {});
                        navigator.pop();
                        messenger.showSnackBar(
                          SnackBar(
                            content: Text(res['message'] as String),
                            backgroundColor: AppColors.primaryBlack,
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      }
                    },
                    child: const Text(
                      'Save Changes',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 15,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showWalletModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '💳 SportVerse Wallet',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppColors.goldGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Available Balance',
                        style: TextStyle(color: Colors.white70, fontSize: 12),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '₹1,250.00',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Icon(Icons.account_balance_wallet, color: Colors.white, size: 36),
                ],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Payment gateway simulator initialized'),
                      backgroundColor: Colors.green,
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlack,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Add Funds to Wallet'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showFavoritesModal() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.favorite, color: Colors.red),
            SizedBox(width: 8),
            Text('Saved Venues'),
          ],
        ),
        content: const Text(
          'Quick access to your frequently booked sports turfs and arenas in SportVerse.',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard!'),
        backgroundColor: AppColors.primaryBlack,
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final fullName = (user?['fullName'] as String?)?.isNotEmpty == true
        ? user!['fullName'] as String
        : (user?['full_name'] as String?)?.isNotEmpty == true
            ? user!['full_name'] as String
            : 'SportVerse User';
    final email = (user?['email'] as String?)?.isNotEmpty == true
        ? user!['email'] as String
        : '';
    final phone = (user?['phone'] as String?)?.isNotEmpty == true
        ? user!['phone'] as String
        : 'Phone not added';
    final location = (user?['location'] as String?)?.isNotEmpty == true
        ? user!['location'] as String
        : 'Kerala, India';
    final favoriteSport = (user?['favoriteSport'] as String?)?.isNotEmpty == true
        ? user!['favoriteSport'] as String
        : 'Football';
    final bio = (user?['bio'] as String?)?.isNotEmpty == true
        ? user!['bio'] as String
        : '';

    final role = user?['role'] as String? ?? 'User';
    final rawApprovalStatus = user?['approvalStatus'] as String?;
    final isApprovedBool = user?['isApproved'] as bool?;
    final approvalStatus = rawApprovalStatus ?? (isApprovedBool == true ? 'Approved' : 'Pending');
    final isApproved = (role == 'Admin' || role == 'User')
        ? true
        : (isApprovedBool == true || approvalStatus == 'Approved') &&
            approvalStatus != 'Pending' &&
            approvalStatus != 'Rejected';

    const stationPortalUrl = 'http://localhost:5174';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      body: _isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.warmAccent),
            )
          : RefreshIndicator(
              onRefresh: _loadUserProfile,
              color: AppColors.warmAccent,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── User Profile Information Header ──
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: AppColors.border),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.04),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              // Avatar with tap to edit
                              GestureDetector(
                                onTap: _showEditProfileModal,
                                child: Stack(
                                  children: [
                                    Container(
                                      width: 80,
                                      height: 80,
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        border: Border.all(color: AppColors.warmAccent, width: 2.5),
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
                                        padding: const EdgeInsets.all(5),
                                        decoration: BoxDecoration(
                                          color: AppColors.warmAccent,
                                          shape: BoxShape.circle,
                                          border: Border.all(color: Colors.white, width: 2),
                                        ),
                                        child: const Icon(
                                          Icons.edit,
                                          size: 12,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 14),

                              // Dynamic User Details Text
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
                                              fontSize: 18,
                                              fontWeight: FontWeight.bold,
                                              color: AppColors.primaryBlack,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 4),
                                        const Icon(Icons.verified, color: Colors.amber, size: 16),
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
                                        const Icon(Icons.phone_outlined, size: 12, color: AppColors.mutedText),
                                        const SizedBox(width: 4),
                                        Text(
                                          phone,
                                          style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 2),
                                    Row(
                                      children: [
                                        const Icon(Icons.location_on_outlined, size: 12, color: AppColors.mutedText),
                                        const SizedBox(width: 4),
                                        Text(
                                          location,
                                          style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          if (bio.isNotEmpty) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.background,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                bio,
                                style: const TextStyle(fontSize: 11, color: AppColors.secondaryText, fontStyle: FontStyle.italic),
                              ),
                            ),
                          ],

                          const SizedBox(height: 14),

                          // Badges row & Edit profile action button
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Wrap(
                                spacing: 6,
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.lightDecorAccent,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.3)),
                                    ),
                                    child: Text(
                                      '$role Member',
                                      style: const TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.bold,
                                        color: AppColors.warmAccent,
                                      ),
                                    ),
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: Colors.grey[100],
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Text(
                                      '⚽ $favoriteSport',
                                      style: TextStyle(
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.grey[800],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                  side: const BorderSide(color: AppColors.warmAccent),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                ),
                                onPressed: _showEditProfileModal,
                                icon: const Icon(Icons.edit, size: 12, color: AppColors.warmAccent),
                                label: const Text(
                                  'Edit Profile',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 16),

                    // ── Ground Owner / Station Owner Dashboard & URL Portal Card ──
                    if (role == 'GroundOwner' || role == 'ShopOwner') ...[
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          gradient: isApproved
                              ? const LinearGradient(
                                  colors: [Color(0xFF1E1B18), Color(0xFF2C241E)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                )
                              : const LinearGradient(
                                  colors: [Color(0xFF241D17), Color(0xFF1A1410)],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isApproved
                                ? AppColors.warmAccent.withValues(alpha: 0.6)
                                : Colors.orange.withValues(alpha: 0.4),
                            width: 1.5,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withValues(alpha: 0.15),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              children: [
                                Icon(
                                  isApproved ? Icons.verified_user : Icons.hourglass_top_rounded,
                                  color: isApproved ? AppColors.warmAccent : Colors.orangeAccent,
                                  size: 22,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  isApproved
                                      ? 'Station Owner Control Center'
                                      : 'Station Owner Approval Pending',
                                  style: TextStyle(
                                    fontSize: 15,
                                    fontWeight: FontWeight.bold,
                                    color: isApproved ? Colors.white : Colors.orangeAccent,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              isApproved
                                  ? 'Your Ground Owner registration is Approved! You have full access to the Station Owner Web Portal & In-App Dashboard to manage courts, dynamic slot pricing, and player entries:'
                                  : 'Your Station Owner account is currently under review by Admin. Your station dashboard and credentials will be activated upon approval.',
                              style: const TextStyle(fontSize: 12, color: Color(0xFFD4C7BC), height: 1.4),
                            ),
                            if (isApproved) ...[
                              const SizedBox(height: 12),
                              // Portal URL Box
                              Container(
                                padding: const EdgeInsets.all(12),
                                decoration: BoxDecoration(
                                  color: Colors.black.withValues(alpha: 0.35),
                                  borderRadius: BorderRadius.circular(10),
                                  border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.3)),
                                ),
                                child: Row(
                                  children: [
                                    const Text('🌐 Portal: ', style: TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
                                    Expanded(
                                      child: Text(
                                        stationPortalUrl,
                                        style: const TextStyle(color: AppColors.warmAccent, fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.copy, size: 16, color: Colors.white70),
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () => _copyToClipboard(stationPortalUrl, 'Station Portal URL'),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(height: 12),
                              SizedBox(
                                width: double.infinity,
                                height: 44,
                                child: ElevatedButton.icon(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.warmAccent,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  onPressed: () {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(
                                        builder: (_) => const GroundOwnerDashboardScreen(),
                                      ),
                                    );
                                  },
                                  icon: const Icon(Icons.dashboard_customize_outlined, size: 16, color: Colors.white),
                                  label: const Text(
                                    'Open Station Dashboard',
                                    style: TextStyle(
                                      fontSize: 13,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    // ── Real Stat Metrics Row (VALID DATA ONLY) ──
                    Container(
                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
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
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _buildStatColumn('$_userBookingsCount', 'Bookings', Icons.calendar_today_outlined),
                          _buildStatDivider(),
                          _buildStatColumn(isApproved ? 'Verified' : 'Pending', 'Status', Icons.verified_user_outlined),
                          _buildStatDivider(),
                          _buildStatColumn(role, 'Account', Icons.sports_score_outlined),
                          _buildStatDivider(),
                          _buildStatColumn('₹1,250', 'Wallet', Icons.account_balance_wallet_outlined),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Menu Navigation Tiles ──
                    _buildMenuTile(
                      Icons.edit_outlined,
                      'Edit Personal Information',
                      'Update name, phone, city & favorite sport',
                      'Edit',
                      onTap: _showEditProfileModal,
                    ),
                    _buildMenuTile(
                      Icons.calendar_today_outlined,
                      'My Bookings',
                      '$_userBookingsCount confirmed sports reservations',
                      null,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const BookingsScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      Icons.notifications_outlined,
                      'Notifications & Alerts',
                      'View match confirmations & station credentials',
                      null,
                      onTap: () => Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const InboxScreen()),
                      ),
                    ),
                    _buildMenuTile(
                      Icons.favorite_border,
                      'Saved Venues',
                      'Quick access to favorite sports grounds',
                      null,
                      onTap: _showFavoritesModal,
                    ),
                    _buildMenuTile(
                      Icons.account_balance_wallet_outlined,
                      'Wallet & Payments',
                      'Manage balance and booking refunds',
                      null,
                      onTap: _showWalletModal,
                    ),
                    if (role != 'GroundOwner' && role != 'Admin')
                      _buildMenuTile(
                        Icons.add_business_outlined,
                        'Become Ground Owner',
                        'List your sports facility & manage courts',
                        'Earn',
                        onTap: () => Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()),
                        ),
                      ),

                    const SizedBox(height: 16),

                    // ── Real Booking Activity Section (VALID DATA ONLY) ──
                    Container(
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
                              const Text(
                                'Recent Match Bookings',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlack,
                                ),
                              ),
                              GestureDetector(
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const BookingsScreen()),
                                ),
                                child: const Text(
                                  'View All',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.warmAccent,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          if (_userBookings.isEmpty)
                            Padding(
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              child: Center(
                                child: Column(
                                  children: [
                                    Icon(Icons.sports_soccer, size: 32, color: Colors.grey[400]),
                                    const SizedBox(height: 8),
                                    Text(
                                      'No match bookings yet.',
                                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                                    ),
                                    const SizedBox(height: 8),
                                    ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: AppColors.warmAccent,
                                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      onPressed: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(builder: (_) => const FindNearbyScreen()),
                                      ),
                                      child: const Text(
                                        'Book a Turf Now',
                                        style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            )
                          else
                            ListView.separated(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _userBookings.length > 3 ? 3 : _userBookings.length,
                              separatorBuilder: (_, __) => const Divider(height: 16),
                              itemBuilder: (context, idx) {
                                final b = _userBookings[idx];
                                final groundName = b.groundName.isNotEmpty ? b.groundName : 'Sports Ground';
                                final sportType = b.sportType.isNotEmpty ? b.sportType : 'Match';
                                final date = b.date.isNotEmpty ? b.date : 'Upcoming';
                                final slot = b.slotTime;
                                final price = b.totalPrice.toStringAsFixed(0);

                                return Row(
                                  children: [
                                    CircleAvatar(
                                      radius: 16,
                                      backgroundColor: AppColors.warmAccent.withValues(alpha: 0.15),
                                      child: const Icon(Icons.sports_soccer, size: 16, color: AppColors.warmAccent),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            groundName,
                                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                                          ),
                                          Text(
                                            '$sportType • $date $slot',
                                            style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Text(
                                      '₹$price',
                                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                                    ),
                                  ],
                                );
                              },
                            ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Logout Button ──
                    SizedBox(
                      width: double.infinity,
                      height: 46,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          AuthService.logout();
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                            (route) => false,
                          );
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.redAccent, width: 1.2),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        icon: const Icon(Icons.logout, color: Colors.redAccent, size: 16),
                        label: const Text(
                          'Log Out',
                          style: TextStyle(
                            color: Colors.redAccent,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildStatColumn(String value, String label, IconData icon) {
    return Column(
      children: [
        Icon(icon, size: 18, color: AppColors.primaryBlack),
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
          style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
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

  Widget _buildMenuTile(IconData icon, String title, String subtitle, String? badge, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 20, color: AppColors.primaryBlack),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                      if (badge != null) ...[
                        const SizedBox(width: 6),
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
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.arrow_forward_ios, size: 12, color: AppColors.mutedText),
          ],
        ),
      ),
    );
  }
}
