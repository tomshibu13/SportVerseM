import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';
import '../widgets/top_navigation_bar.dart';
import 'bookings_screen.dart';
import 'shop_screen.dart';
import 'find_nearby_screen.dart';
import 'profile_screen.dart';
import 'injury_assistant/injury_assessment_screen.dart';
import 'ai_assistant_screen.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/ground_model.dart';
import 'ground_booking_screen.dart';
import 'become_ground_owner_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentBottomTab = 0;
  int _selectedSportIndex = 0;
  String _selectedLocation = 'Calicut, Kerala';
  String _searchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _availableLocations = const [
    'Calicut, Kerala',
    'Kochi, Kerala',
    'Trivandrum, Kerala',
    'Wayanad, Kerala',
    'Kannur, Kerala',
    'Bangalore, KA',
    'Chennai, TN',
  ];

  final List<Map<String, dynamic>> _sportsCategories = [
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Badminton', 'icon': Icons.sports_tennis},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Tennis', 'icon': Icons.sports_baseball},
    {'name': 'More', 'icon': Icons.grid_view},
  ];

  List<GroundModel> _databaseGrounds = [];
  bool _isLoadingVenues = true;

  List<Map<String, dynamic>> get _filteredVenues {
    if (_databaseGrounds.isEmpty) return <Map<String, dynamic>>[];
    return _databaseGrounds.where((g) {
      final query = _searchQuery.toLowerCase().trim();
      if (query.isEmpty) return true;
      return g.title.toLowerCase().contains(query) ||
          g.sportType.toLowerCase().contains(query) ||
          g.location.toLowerCase().contains(query);
    }).map((g) {
      return {
        'groundId': g.groundId,
        'title': g.title,
        'sport': g.sportType,
        'rating': g.rating.toStringAsFixed(1),
        'reviews': '(${g.reviewCount})',
        'location': g.location,
        'price': '₹${g.pricePerHour.toInt()}',
        'isFavorite': false,
        'image': g.images.isNotEmpty
            ? g.images.first
            : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
        'groundModel': g,
      };
    }).toList();
  }

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
      );
    }
    _loadDatabaseGrounds();
  }

  Future<void> _loadDatabaseGrounds() async {
    try {
      final grounds = await ApiService.fetchGrounds();
      if (mounted) {
        setState(() {
          _databaseGrounds = grounds;
          _isLoadingVenues = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoadingVenues = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  void _showLocationPickerModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Material(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Select Location',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.warmAccent.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.my_location,
                      color: AppColors.warmAccent, size: 20),
                ),
                title: const Text(
                  'Use Current Location (GPS)',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: AppColors.warmAccent,
                    fontSize: 14,
                  ),
                ),
                subtitle: const Text(
                  'Auto-detect nearby grounds & arenas',
                  style: TextStyle(fontSize: 11, color: AppColors.mutedText),
                ),
                onTap: () {
                  setState(() => _selectedLocation = 'Calicut, Kerala');
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Location updated to Calicut, Kerala via GPS'),
                      duration: Duration(seconds: 2),
                    ),
                  );
                },
              ),
              const Divider(height: 20),
              Expanded(
                child: ListView.builder(
                  shrinkWrap: true,
                  itemCount: _availableLocations.length,
                  itemBuilder: (context, index) {
                    final loc = _availableLocations[index];
                    final isSelected = loc == _selectedLocation;
                    return ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: Icon(
                        Icons.location_on_outlined,
                        color: isSelected
                            ? AppColors.warmAccent
                            : AppColors.secondaryText,
                      ),
                      title: Text(
                        loc,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight:
                              isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected
                              ? AppColors.warmAccent
                              : AppColors.primaryBlack,
                        ),
                      ),
                      trailing: isSelected
                          ? const Icon(Icons.check_circle,
                              color: AppColors.warmAccent, size: 20)
                          : null,
                      onTap: () {
                        setState(() => _selectedLocation = loc);
                        Navigator.pop(context);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Location updated to $loc'),
                            duration: const Duration(seconds: 2),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
              ],
            ),
          ),
        );
      },
    );
  }

  void _openAIAssistant([String? initialQuery]) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => AIAssistantScreen(initialQuery: initialQuery),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: _currentBottomTab == 0
          ? FloatingActionButton.extended(
              onPressed: _openAIAssistant,
              backgroundColor: AppColors.primaryBlack,
              elevation: 6,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(28),
                side: const BorderSide(color: AppColors.warmAccent, width: 1.5),
              ),
              icon: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
                  ),
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 16),
              ),
              label: const Text(
                'AI Injury Assistant',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            )
          : null,
      body: SafeArea(
        child: _buildBody(),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 10,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentBottomTab,
          onTap: (index) => setState(() => _currentBottomTab = index),
          type: BottomNavigationBarType.fixed,
          backgroundColor: Colors.white,
          selectedItemColor: AppColors.warmAccent,
          unselectedItemColor: AppColors.mutedText,
          selectedLabelStyle:
              const TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 11),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.home_outlined),
              activeIcon: Icon(Icons.home, color: AppColors.warmAccent),
              label: 'Home',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.location_on_outlined),
              activeIcon: Icon(Icons.location_on, color: AppColors.warmAccent),
              label: 'Explore',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.calendar_today_outlined),
              activeIcon: Icon(Icons.calendar_today, color: AppColors.warmAccent),
              label: 'Bookings',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.shopping_bag_outlined),
              activeIcon: Icon(Icons.shopping_bag, color: AppColors.warmAccent),
              label: 'Shop',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_outline),
              activeIcon: Icon(Icons.person, color: AppColors.warmAccent),
              label: 'Profile',
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBody() {
    switch (_currentBottomTab) {
      case 0:
        return _buildHomeContent();
      case 1:
        return FindNearbyScreen(
          onBack: () => setState(() => _currentBottomTab = 0),
        );
      case 2:
        return const BookingsScreen();
      case 3:
        return ShopScreen(
          onBack: () => setState(() => _currentBottomTab = 0),
        );
      case 4:
        return const ProfileScreen();
      default:
        return _buildHomeContent();
    }
  }

  Widget _buildHomeContent() {
    return SingleChildScrollView(
      physics: const BouncingScrollPhysics(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── Top Header Row (Menu Icon, Logo Header, Notification Bell) ──
          const TopNavigationBar(),

          // ── Location & Search Bar Row ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
            child: Row(
              children: [
                GestureDetector(
                  onTap: _showLocationPickerModal,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.location_on_outlined,
                            size: 16, color: AppColors.primaryBlack),
                        const SizedBox(width: 4),
                        Text(
                          _selectedLocation,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryBlack,
                          ),
                        ),
                        const SizedBox(width: 4),
                        const Icon(Icons.keyboard_arrow_down,
                            size: 16, color: AppColors.secondaryText),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(color: AppColors.border),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.search,
                            size: 18, color: AppColors.mutedText),
                        const SizedBox(width: 8),
                        Expanded(
                          child: TextField(
                            controller: _searchController,
                            onChanged: (val) => setState(() => _searchQuery = val),
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.primaryBlack,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Search for grounds, sports...',
                              hintStyle: const TextStyle(
                                fontSize: 12,
                                color: AppColors.mutedText,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.zero,
                              suffixIcon: _searchQuery.isNotEmpty
                                  ? GestureDetector(
                                      onTap: () {
                                        setState(() {
                                          _searchController.clear();
                                          _searchQuery = '';
                                        });
                                      },
                                      child: const Icon(Icons.close,
                                          size: 16, color: AppColors.mutedText),
                                    )
                                  : null,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 16),

          // ── Hero Carousel Banner Card ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              width: double.infinity,
              height: 210,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                image: const DecorationImage(
                  image: AssetImage('assets/images/hero_kick.png'),
                  fit: BoxFit.cover,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.12),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(20),
                  gradient: LinearGradient(
                    colors: [
                      Colors.black.withValues(alpha: 0.75),
                      Colors.transparent,
                    ],
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                ),
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'PLAY. BOOK. COMPETE.',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                        letterSpacing: 1.2,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text.rich(
                      TextSpan(
                        children: [
                          TextSpan(
                            text: 'Your Game.\n',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              height: 1.1,
                            ),
                          ),
                          TextSpan(
                            text: 'Your Ground.',
                            style: TextStyle(
                              fontSize: 22,
                              fontWeight: FontWeight.w900,
                              color: AppColors.warmAccentSecondary,
                              height: 1.1,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 6),
                    const Text(
                      'Discover and book the best\nsports venues near you.',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.white70,
                        height: 1.3,
                      ),
                    ),
                    const SizedBox(height: 12),
                    GestureDetector(
                      onTap: () => setState(() => _currentBottomTab = 1),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 8),
                        decoration: BoxDecoration(
                          gradient: AppColors.goldGradient,
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: const Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'Book Now',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 4),
                            Icon(Icons.arrow_forward,
                                size: 12, color: Colors.white),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 20),

          // ── 5 Quick Action Grid Cards Row ──
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                _buildActionCard('Book Instantly', Icons.event_available, () {
                  if (_databaseGrounds.isNotEmpty) {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => GroundBookingScreen(ground: _databaseGrounds.first),
                      ),
                    );
                  } else {
                    setState(() => _currentBottomTab = 1);
                  }
                }),
                const SizedBox(width: 10),
                _buildActionCard('Find Nearby', Icons.near_me_outlined, () {
                  setState(() => _currentBottomTab = 1);
                }),
                const SizedBox(width: 10),
                _buildActionCard('Shop Gear', Icons.shopping_bag_outlined, () {
                  setState(() => _currentBottomTab = 3);
                }),
                const SizedBox(width: 10),
                _buildActionCard('My Bookings', Icons.confirmation_number_outlined, () {
                  setState(() => _currentBottomTab = 2);
                }),
                const SizedBox(width: 10),
                _buildActionCard('Injury AI', Icons.medical_services_outlined, () {
                  _openAIAssistant('I have a sports injury and need advice');
                }),
                const SizedBox(width: 10),
                _buildActionCard('Profile', Icons.person_outline, () {
                  setState(() => _currentBottomTab = 4);
                }),
              ],
            ),
          ),

          const SizedBox(height: 24),

          // ── Popular Venues Section Header ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Popular Venues',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _currentBottomTab = 1),
                  child: const Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(
                          fontSize: 12,
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
          ),

          const SizedBox(height: 12),

          // Horizontal Venues List
          SizedBox(
            height: 245,
            child: _isLoadingVenues
                ? const Center(
                    child: CircularProgressIndicator(
                      color: AppColors.warmAccent,
                    ),
                  )
                : _filteredVenues.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.search_off, size: 36, color: AppColors.mutedText),
                            const SizedBox(height: 8),
                            Text(
                              'No venues match "$_searchQuery"',
                              style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                            ),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _searchController.clear();
                                  _searchQuery = '';
                                });
                              },
                              child: const Text('Reset Search',
                                  style: TextStyle(color: AppColors.warmAccent)),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        physics: const BouncingScrollPhysics(),
                        scrollDirection: Axis.horizontal,
                        padding: const EdgeInsets.symmetric(horizontal: 20),
                        itemCount: _filteredVenues.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 14),
                        itemBuilder: (context, index) {
                          final venue = _filteredVenues[index];
                          return _buildVenueCard(venue);
                        },
                      ),
          ),

          const SizedBox(height: 24),

          // ── Special Offer Discount Banner Card ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F1116),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: AppColors.warmAccent.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.percent,
                        color: AppColors.warmAccent, size: 24),
                  ),
                  const SizedBox(width: 14),
                  const Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Special Offer!',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: AppColors.warmAccent,
                          ),
                        ),
                        SizedBox(height: 2),
                        Text(
                          'Get up to 20% OFF',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        Text(
                          'on your first booking',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.white54,
                          ),
                        ),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () => setState(() => _currentBottomTab = 1),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text(
                        'Claim Offer ➔',
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ── AI Injury Assistant Feature Banner ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: GestureDetector(
              onTap: () => _openAIAssistant('I want to check an injury and get sports medicine first aid'),
              child: Container(
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  color: const Color(0xFF1A0A05),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFFA76F45).withValues(alpha: 0.4), width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.15),
                      blurRadius: 12,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        color: const Color(0xFFA76F45).withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.medical_services_rounded, color: Color(0xFFA76F45), size: 26),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'AI INJURY ASSISTANT',
                            style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Color(0xFFA76F45), letterSpacing: 1.4),
                          ),
                          SizedBox(height: 3),
                          Text(
                            'Smart Injury Assessment',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          Text(
                            'Get AI-powered risk analysis & sports medicine guidance',
                            style: TextStyle(fontSize: 11, color: Colors.white54, height: 1.3),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        gradient: AppColors.goldGradient,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Text('Assess →', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white)),
                    ),
                  ],
                ),
              ),
            ),
          ),

          const SizedBox(height: 24),

          // ── Popular Sports Section Header ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Popular Sports',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                ),
                GestureDetector(
                  onTap: () => setState(() => _currentBottomTab = 1),
                  child: const Row(
                    children: [
                      Text(
                        'View All',
                        style: TextStyle(
                          fontSize: 12,
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
          ),

          const SizedBox(height: 14),

          // Sports Categories Pills Grid
          SizedBox(
            height: 95,
            child: ListView.separated(
              physics: const BouncingScrollPhysics(),
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 20),
              itemCount: _sportsCategories.length,
              separatorBuilder: (_, __) => const SizedBox(width: 12),
              itemBuilder: (context, index) {
                final item = _sportsCategories[index];
                final isSelected = index == _selectedSportIndex;
                return GestureDetector(
                  onTap: () => setState(() => _selectedSportIndex = index),
                  child: Column(
                    children: [
                      Container(
                        width: 52,
                        height: 52,
                        decoration: BoxDecoration(
                          color: isSelected
                              ? AppColors.lightDecorAccent
                              : Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isSelected
                                ? AppColors.warmAccent
                                : AppColors.border,
                            width: isSelected ? 1.5 : 1,
                          ),
                        ),
                        child: Icon(
                          item['icon'] as IconData,
                          color: isSelected
                              ? AppColors.warmAccent
                              : AppColors.primaryBlack,
                          size: 24,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['name'] as String,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.normal,
                          color: isSelected
                              ? AppColors.warmAccent
                              : AppColors.secondaryText,
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 24),

          // ── Open Matches & Community Games (Find Teammates) ──
          _buildOpenMatchesSection(),

          const SizedBox(height: 24),

          // ── Trending Pro-Shop Sports Gear (Marketplace Preview) ──
          _buildTrendingShopSection(),

          const SizedBox(height: 24),

          // ── Active Tournaments & Championships ──
          _buildTournamentsSection(),

          const SizedBox(height: 24),

          // ── Why SportVerse Core Platform Pillars ──
          _buildWhySportVerseSection(),

          const SizedBox(height: 24),

          // ── Athlete Reviews & Turf Stories ──
          _buildAthleteReviewsSection(),

          const SizedBox(height: 24),

          // ── Ground Owner Partnership Banner ──
          _buildPartnerBannerSection(),

          const SizedBox(height: 90),
        ],
      ),
    );
  }

  Widget _buildActionCard(String title, IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 100,
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, size: 24, color: AppColors.primaryBlack),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: AppColors.primaryBlack,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVenueCard(Map<String, dynamic> venue) {
    final GroundModel? groundModel = venue['groundModel'] as GroundModel?;

    return GestureDetector(
      onTap: () {
        if (groundModel != null) {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => GroundBookingScreen(ground: groundModel),
            ),
          );
        } else {
          setState(() => _currentBottomTab = 1);
        }
      },
      child: Container(
        width: 180,
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
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                  child: Image.network(
                    venue['image'] as String,
                    height: 100,
                    width: 180,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      height: 100,
                      width: 180,
                      color: const Color(0xFF1E293B),
                      child: const Center(
                        child: Icon(Icons.sports, size: 40, color: Colors.white30),
                      ),
                    ),
                  ),
                ),
                Positioned(
                  right: 8,
                  top: 8,
                  child: CircleAvatar(
                    radius: 14,
                    backgroundColor: Colors.white.withValues(alpha: 0.8),
                    child: Icon(
                      venue['isFavorite']
                          ? Icons.favorite
                          : Icons.favorite_border,
                      size: 14,
                      color: venue['isFavorite'] ? Colors.red : Colors.grey,
                    ),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    venue['title'] as String,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Row(
                    children: [
                      Flexible(
                        child: Text(
                          '${venue['sport']} • ',
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                              fontSize: 11, color: AppColors.secondaryText),
                        ),
                      ),
                      const Icon(Icons.star, size: 12, color: Colors.amber),
                      Text(
                        ' ${venue['rating']} ${venue['reviews']}',
                        style: const TextStyle(
                            fontSize: 11, color: AppColors.secondaryText),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      const Icon(Icons.location_on_outlined,
                          size: 12, color: AppColors.mutedText),
                      Expanded(
                        child: Text(
                          venue['location'] as String,
                          style: const TextStyle(
                              fontSize: 10, color: AppColors.mutedText),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text.rich(
                    TextSpan(
                      children: [
                        TextSpan(
                          text: venue['price'] as String,
                          style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.bold,
                            color: AppColors.warmAccent,
                          ),
                        ),
                        const TextSpan(
                          text: ' /hr',
                          style: TextStyle(
                              fontSize: 10, color: AppColors.mutedText),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 1. Open Matches & Community Games (Find Teammates) ──
  Widget _buildOpenMatchesSection() {
    final openMatches = [
      {
        'title': '5v5 Night Turf Football Clash',
        'venue': 'Kozhikode Football Arena, Court A',
        'time': 'Today, 08:30 PM - 09:30 PM',
        'sport': 'Football',
        'icon': Icons.sports_soccer,
        'needed': '2 players needed',
        'spotsColor': const Color(0xFFEF4444),
        'host': 'Captain Rahul',
        'level': 'Intermediate',
        'fee': '₹150 / player',
      },
      {
        'title': 'Badminton Doubles Match Play',
        'venue': 'Calicut Smash Badminton Academy',
        'time': 'Tomorrow, 07:00 AM - 08:00 AM',
        'sport': 'Badminton',
        'icon': Icons.sports_tennis,
        'needed': '1 player needed',
        'spotsColor': const Color(0xFFD97706),
        'host': 'Arun V.',
        'level': 'Advanced',
        'fee': '₹100 / player',
      },
      {
        'title': 'Cricket T20 Box Match (8-a-side)',
        'venue': 'Malabar Box Cricket Arena',
        'time': 'Tomorrow, 05:00 PM - 07:00 PM',
        'sport': 'Cricket',
        'icon': Icons.sports_cricket,
        'needed': '3 players needed',
        'spotsColor': const Color(0xFF10B981),
        'host': 'Shibin K.',
        'level': 'All Levels',
        'fee': '₹200 / player',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.groups, color: AppColors.warmAccent, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'Open Matches & Teams',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => _openAIAssistant('Find open sports matches and teammates near me'),
                child: const Row(
                  children: [
                    Text(
                      'Host Match',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.add_circle_outline, size: 14, color: AppColors.warmAccent),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 160,
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: openMatches.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final match = openMatches[index];
              return Container(
                width: 280,
                padding: const EdgeInsets.all(14),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: AppColors.warmAccent.withValues(alpha: 0.15),
                              child: Icon(match['icon'] as IconData, size: 14, color: AppColors.warmAccent),
                            ),
                            const SizedBox(width: 8),
                            Text(
                              match['sport'] as String,
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (match['spotsColor'] as Color).withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            match['needed'] as String,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: match['spotsColor'] as Color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          match['title'] as String,
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            const Icon(Icons.schedule, size: 11, color: AppColors.mutedText),
                            const SizedBox(width: 4),
                            Text(
                              match['time'] as String,
                              style: const TextStyle(fontSize: 10.5, color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          match['fee'] as String,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: AppColors.warmAccent),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Joined "${match['title']}"! Captain ${match['host']} notified.'),
                                backgroundColor: AppColors.primaryBlack,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primaryBlack,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: const Size(60, 28),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Join Match', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ── 2. Trending Pro-Shop Sports Gear (Marketplace Preview) ──
  Widget _buildTrendingShopSection() {
    final trendingShopGear = [
      {
        'title': 'Yonex Astrox 100 ZZ',
        'category': 'Badminton Racket',
        'price': '₹12,999',
        'originalPrice': '₹14,499',
        'rating': '4.9',
        'reviews': '142',
        'image': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
        'tag': 'Best Seller',
      },
      {
        'title': 'Asics Gel Rocket 11 Shoes',
        'category': 'Court Shoes',
        'price': '₹4,299',
        'originalPrice': '₹4,999',
        'rating': '4.7',
        'reviews': '89',
        'image': 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
        'tag': 'Non-Marking',
      },
      {
        'title': 'Nike Strike Pro Football',
        'category': 'Match Ball',
        'price': '₹1,499',
        'originalPrice': '₹1,999',
        'rating': '4.8',
        'reviews': '112',
        'image': 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=800&q=80',
        'tag': '25% OFF',
      },
      {
        'title': 'Spalding TF-1000 Basketball',
        'category': 'Official Game Ball',
        'price': '₹2,899',
        'originalPrice': '₹3,499',
        'rating': '4.9',
        'reviews': '95',
        'image': 'https://images.unsplash.com/photo-1519766304817-4f37bda74a29?auto=format&fit=crop&w=800&q=80',
        'tag': 'Official',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.shopping_bag_outlined, color: AppColors.warmAccent, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'Trending Gear & Pro-Shop',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => setState(() => _currentBottomTab = 3),
                child: const Row(
                  children: [
                    Text(
                      'View Shop',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.warmAccent),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 225,
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: trendingShopGear.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final item = trendingShopGear[index];
              return GestureDetector(
                onTap: () => setState(() => _currentBottomTab = 3),
                child: Container(
                  width: 165,
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
                      Stack(
                        children: [
                          ClipRRect(
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                            child: Image.network(
                              item['image'] as String,
                              height: 105,
                              width: 165,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                height: 105,
                                color: Colors.grey.shade100,
                                child: const Icon(Icons.sports, color: AppColors.mutedText),
                              ),
                            ),
                          ),
                          Positioned(
                            top: 8,
                            left: 8,
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.warmAccent,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                item['tag'] as String,
                                style: const TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.white),
                              ),
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: const EdgeInsets.all(10),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              item['title'] as String,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              item['category'] as String,
                              style: const TextStyle(fontSize: 10, color: AppColors.secondaryText),
                            ),
                            const SizedBox(height: 6),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['price'] as String,
                                      style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w900, color: AppColors.warmAccent),
                                    ),
                                    Text(
                                      item['originalPrice'] as String,
                                      style: const TextStyle(
                                        fontSize: 9.5,
                                        color: AppColors.mutedText,
                                        decoration: TextDecoration.lineThrough,
                                      ),
                                    ),
                                  ],
                                ),
                                Container(
                                  padding: const EdgeInsets.all(5),
                                  decoration: BoxDecoration(
                                    color: AppColors.primaryBlack,
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.add_shopping_cart, size: 14, color: Colors.white),
                                ),
                              ],
                            ),
                          ],
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
    );
  }

  // ── 3. Active Tournaments & Championships ──
  Widget _buildTournamentsSection() {
    final tournaments = [
      {
        'title': 'Kerala Super Turf League 2026',
        'sport': 'Football 5v5',
        'prize': '₹50,000 Prize Pool',
        'teams': '16 Teams Competing',
        'date': 'Sep 05 - Sep 07, 2026',
        'location': 'Kozhikode Arena',
        'badge': 'Filling Fast 🔥',
        'badgeColor': const Color(0xFFDC2626),
        'entry': '₹1,500 / Team',
      },
      {
        'title': 'Calicut Smash Badminton Open',
        'sport': 'Badminton Doubles',
        'prize': '₹25,000 Prize Pool',
        'teams': '32 Pairs (Men & Mixed)',
        'date': 'Sep 12 - Sep 13, 2026',
        'location': 'Smash Badminton Club',
        'badge': 'Open for Entry',
        'badgeColor': const Color(0xFF16A34A),
        'entry': '₹600 / Pair',
      },
      {
        'title': 'Malabar T20 Box Cricket Cup',
        'sport': 'Box Cricket',
        'prize': '₹75,000 Prize Pool',
        'teams': '24 Teams',
        'date': 'Sep 20 - Sep 22, 2026',
        'location': 'Malabar Turf Arena',
        'badge': 'Cash Prize 🏆',
        'badgeColor': const Color(0xFFD97706),
        'entry': '₹2,000 / Team',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.emoji_events_outlined, color: AppColors.warmAccent, size: 22),
                  SizedBox(width: 8),
                  Text(
                    'Tournaments & Leagues',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                ],
              ),
              GestureDetector(
                onTap: () => _openAIAssistant('Tell me about upcoming tournaments in Kerala'),
                child: const Row(
                  children: [
                    Text(
                      'All Events',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                      ),
                    ),
                    SizedBox(width: 2),
                    Icon(Icons.arrow_forward_ios, size: 10, color: AppColors.warmAccent),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 175,
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: tournaments.length,
            separatorBuilder: (_, __) => const SizedBox(width: 14),
            itemBuilder: (context, index) {
              final tourney = tournaments[index];
              return Container(
                width: 290,
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF1E1B18), Color(0xFF2C241E)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.4), width: 1.2),
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
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.emoji_events, color: Colors.amber, size: 18),
                            const SizedBox(width: 6),
                            Text(
                              tourney['prize'] as String,
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.amber),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: (tourney['badgeColor'] as Color).withValues(alpha: 0.25),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: (tourney['badgeColor'] as Color).withValues(alpha: 0.6)),
                          ),
                          child: Text(
                            tourney['badge'] as String,
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: tourney['badgeColor'] as Color,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          tourney['title'] as String,
                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3),
                        Text(
                          '📅 ${tourney['date']} • 📍 ${tourney['location']}',
                          style: const TextStyle(fontSize: 10.5, color: Color(0xFFD4C7BC)),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          tourney['entry'] as String,
                          style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.white70),
                        ),
                        ElevatedButton(
                          onPressed: () {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Tournament registration open for "${tourney['title']}"!'),
                                backgroundColor: AppColors.primaryBlack,
                                behavior: SnackBarBehavior.floating,
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.warmAccent,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: const Size(70, 28),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: const Text('Register Team', style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold)),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ── 4. Why SportVerse Core Platform Pillars ──
  Widget _buildWhySportVerseSection() {
    final pillars = [
      {
        'icon': Icons.qr_code_scanner_rounded,
        'title': 'Instant QR Entry',
        'desc': 'Zero waiting. Dynamic gate ticket pass generated upon booking.',
      },
      {
        'icon': Icons.auto_awesome,
        'title': 'AI Matchmaking',
        'desc': 'Smart algorithms recommend slots & players matching your skill.',
      },
      {
        'icon': Icons.verified_rounded,
        'title': 'FIFA & BWF Certified',
        'desc': 'All venues undergo 12-point quality turf & lighting audits.',
      },
      {
        'icon': Icons.security_rounded,
        'title': 'Razorpay & UPI',
        'desc': '100% encrypted checkout with instant refund protection.',
      },
    ];

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 20),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          const Row(
            children: [
              Icon(Icons.shield_outlined, color: AppColors.warmAccent, size: 20),
              SizedBox(width: 8),
              Text(
                'Why SportVerse?',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryBlack,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text(
            'The complete ecosystem for athletes, turf owners, and sports clubs.',
            style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
          ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: pillars.length,
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 12,
              crossAxisSpacing: 12,
              childAspectRatio: 1.45,
            ),
            itemBuilder: (context, index) {
              final p = pillars[index];
              return Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.background,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(p['icon'] as IconData, size: 22, color: AppColors.warmAccent),
                    const SizedBox(height: 6),
                    Text(
                      p['title'] as String,
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 2),
                    Expanded(
                      child: Text(
                        p['desc'] as String,
                        style: const TextStyle(fontSize: 10, color: AppColors.mutedText, height: 1.2),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // ── 5. Athlete Reviews & Turf Stories ──
  Widget _buildAthleteReviewsSection() {
    final reviews = [
      {
        'name': 'Fahad Mohammed',
        'sport': 'Footballer',
        'rating': 5,
        'comment': 'The synthetic turf quality at Kozhikode Arena is top notch! QR check-in took 2 seconds.',
        'venue': 'Kozhikode Arena',
      },
      {
        'name': 'Anjali Nair',
        'sport': 'Badminton Player',
        'rating': 5,
        'comment': 'Wooden court cushioning is exceptional. Booking through Razorpay was seamless and quick.',
        'venue': 'Smash Badminton Academy',
      },
      {
        'name': 'Deepak Menon',
        'sport': 'Box Cricket',
        'rating': 5,
        'comment': 'AI Injury Assistant gave instant first aid advice when I twisted my ankle on court!',
        'venue': 'Malabar Turf Club',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            children: [
              Icon(Icons.rate_review_outlined, color: AppColors.warmAccent, size: 20),
              SizedBox(width: 8),
              Text(
                'Player Reviews & Stories',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: AppColors.primaryBlack,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 135,
          child: ListView.separated(
            physics: const BouncingScrollPhysics(),
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: reviews.length,
            separatorBuilder: (_, __) => const SizedBox(width: 12),
            itemBuilder: (context, index) {
              final r = reviews[index];
              return Container(
                width: 260,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 6,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 12,
                              backgroundColor: AppColors.warmAccent.withValues(alpha: 0.15),
                              child: Text(
                                (r['name'] as String).substring(0, 1),
                                style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  r['name'] as String,
                                  style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold),
                                ),
                                Text(
                                  r['sport'] as String,
                                  style: const TextStyle(fontSize: 9.5, color: AppColors.mutedText),
                                ),
                              ],
                            ),
                          ],
                        ),
                        Row(
                          children: List.generate(
                            5,
                            (i) => const Icon(Icons.star, size: 11, color: Colors.amber),
                          ),
                        ),
                      ],
                    ),
                    Text(
                      '"${r['comment']}"',
                      style: const TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.secondaryText, height: 1.3),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '🏟️ ${r['venue']}',
                      style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: AppColors.warmAccent),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ── 6. Ground Owner Partnership Banner ──
  Widget _buildPartnerBannerSection() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF131110), Color(0xFF261D17)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.5), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.15),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppColors.warmAccent.withValues(alpha: 0.2),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.storefront_rounded, color: AppColors.warmAccent, size: 26),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'OWN A SPORTS ARENA?',
                    style: TextStyle(
                      fontSize: 9.5,
                      fontWeight: FontWeight.bold,
                      color: AppColors.warmAccent,
                      letterSpacing: 1.2,
                    ),
                  ),
                  const SizedBox(height: 3),
                  const Text(
                    'Partner with SportVerse',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Boost bookings by 3x with automated slot pricing & QR entry.',
                    style: TextStyle(fontSize: 10.5, color: Color(0xFFD4C7BC), height: 1.3),
                  ),
                  const SizedBox(height: 10),
                  ElevatedButton.icon(
                    onPressed: () async {
                      final authenticated = await AuthService.requireAuth(
                        context,
                        message: 'Sign in to register and list your sports facility',
                      );
                      if (authenticated && mounted) {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()),
                        );
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.warmAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      minimumSize: const Size(120, 32),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                    icon: const Icon(Icons.add_business_outlined, size: 14),
                    label: const Text(
                      'List Your Ground Now',
                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// AI Assistant Sheet Component
class AIAssistantSheet extends StatefulWidget {
  const AIAssistantSheet({super.key});

  @override
  State<AIAssistantSheet> createState() => _AIAssistantSheetState();
}

class _AIAssistantSheetState extends State<AIAssistantSheet> {
  late final TextEditingController _promptController;
  late final ScrollController _scrollController;
  bool _isTyping = false;

  static const List<String> _quickPrompts = [
    '⚽ Book Football slot',
    '🏸 Badminton near me',
    '🏥 I have an injury',
    '👟 Best turf shoes',
  ];

  late List<Map<String, dynamic>> _messages;

  @override
  void initState() {
    super.initState();
    _promptController = TextEditingController();
    _scrollController = ScrollController();
    _messages = [
      {
        'sender': 'ai',
        'text':
            'Hi! I am SportVerse AI Assistant 🤖. How can I help you today? Ask me for venue recommendations, available slots, sports gear advice, or report an injury!',
        'isInjury': false,
      },
    ];
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add({'sender': 'user', 'text': text, 'isInjury': false});
      _isTyping = true;
    });
    _promptController.clear();
    _scrollToBottom();

    final result = await ApiService.askAiAssistantFull(text, history: _messages);
    final response = result['reply'] ?? 'AI response received.';
    final isInjury = result['isInjury'] == true ||
        response.contains('🏥') ||
        response.toLowerCase().contains('injury') ||
        response.toLowerCase().contains('rice protocol') ||
        text.toLowerCase().contains('twist') ||
        text.toLowerCase().contains('pain') ||
        text.toLowerCase().contains('ankle') ||
        text.toLowerCase().contains('knee') ||
        text.toLowerCase().contains('medicine');

    if (mounted) {
      setState(() {
        _isTyping = false;
        _messages.add({
          'sender': 'ai',
          'text': response,
          'isInjury': isInjury,
        });
      });
      _scrollToBottom();
    }
  }

  @override
  void dispose() {
    _promptController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.80,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 12),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: const BoxDecoration(
                    gradient: AppColors.goldGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.auto_awesome,
                      color: Colors.white, size: 20),
                ),
                const SizedBox(width: 12),
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'SportVerse AI Assistant',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlack,
                      ),
                    ),
                    Text(
                      'Smart Venue, Gear & Injury Guidance',
                      style: TextStyle(
                        fontSize: 11,
                        color: AppColors.secondaryText,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),

          const Divider(height: 1),

          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(20),
              itemCount: _messages.length + (_isTyping ? 1 : 0),
              itemBuilder: (context, index) {
                if (_isTyping && index == _messages.length) {
                  return Align(
                    alignment: Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: AppColors.warmAccent,
                            ),
                          ),
                          SizedBox(width: 8),
                          Text('SportVerse AI is typing...',
                              style: TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                        ],
                      ),
                    ),
                  );
                }

                final msg = _messages[index];
                final isUser = msg['sender'] == 'user';
                final isInjury = msg['isInjury'] == true;

                return Align(
                  alignment:
                      isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(14),
                    constraints: BoxConstraints(
                      maxWidth: MediaQuery.of(context).size.width * 0.82,
                    ),
                    decoration: BoxDecoration(
                      color: isUser
                          ? AppColors.primaryBlack
                          : (isInjury
                              ? const Color(0xFFFFF7ED)
                              : AppColors.lightDecorAccent),
                      border: isInjury
                          ? Border.all(color: const Color(0xFFFDBA74), width: 1)
                          : null,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          msg['text'] as String,
                          style: TextStyle(
                            fontSize: 13,
                            height: 1.4,
                            color: isUser ? Colors.white : AppColors.primaryBlack,
                          ),
                        ),
                        if (isInjury && !isUser) ...[
                          const SizedBox(height: 12),
                          GestureDetector(
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => const InjuryAssessmentScreen(),
                                ),
                              );
                            },
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(
                                  vertical: 10, horizontal: 12),
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [Color(0xFFEF4444), Color(0xFFDC2626)],
                                ),
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.medical_services_outlined,
                                      size: 16, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'Launch AI Injury Assessment',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  SizedBox(width: 4),
                                  Icon(Icons.arrow_forward_ios,
                                      size: 10, color: Colors.white),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Quick Prompts Bar
          SizedBox(
            height: 36,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _quickPrompts.length,
              separatorBuilder: (_, __) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final prompt = _quickPrompts[index];
                return GestureDetector(
                  onTap: () => _sendMessage(prompt),
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: Center(
                      child: Text(
                        prompt,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: AppColors.primaryBlack,
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),

          const SizedBox(height: 8),

          Padding(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              bottom: 16 + MediaQuery.of(context).viewInsets.bottom,
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border),
                    ),
                    child: TextField(
                      controller: _promptController,
                      decoration: const InputDecoration(
                        hintText: 'Ask SportVerse AI or describe an injury...',
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 12),
                      ),
                      onSubmitted: _sendMessage,
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.send, color: AppColors.warmAccent),
                  onPressed: () => _sendMessage(_promptController.text),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
