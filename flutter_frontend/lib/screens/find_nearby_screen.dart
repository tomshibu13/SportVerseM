import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_theme.dart';
import '../widgets/top_navigation_bar.dart';
import '../models/ground_model.dart';
import '../services/api_service.dart';
import 'ground_booking_screen.dart';

class FindNearbyScreen extends StatefulWidget {
  final VoidCallback? onBack;
  const FindNearbyScreen({super.key, this.onBack});

  @override
  State<FindNearbyScreen> createState() => _FindNearbyScreenState();
}

class _FindNearbyScreenState extends State<FindNearbyScreen>
    with SingleTickerProviderStateMixin {
  late final MapController _mapController;
  late final AnimationController _pulseController;

  String _selectedLocation = 'Calicut, Kerala';
  String _selectedSport = 'All Sports';
  String _searchQuery = '';
  String _sortBy = 'Distance';
  GroundModel? _selectedGround;
  bool _isListViewFull = false;
  bool _isFetchingLocation = false;
  bool _isLoadingGrounds = true;

  // Live database grounds loaded from MongoDB
  List<GroundModel> _databaseGrounds = [];

  final Set<int> _favoriteGroundIds = {};

  // Live user position (Default: Calicut center coordinate)
  LatLng _userLocation = const LatLng(11.2588, 75.7804);

  // Sports filters
  final List<Map<String, dynamic>> _sportFilters = [
    {'name': 'All Sports', 'icon': Icons.grid_view_rounded},
    {'name': 'Football', 'icon': Icons.sports_soccer_rounded},
    {'name': 'Badminton', 'icon': Icons.sports_tennis_rounded},
    {'name': 'Basketball', 'icon': Icons.sports_basketball_rounded},
    {'name': 'Cricket', 'icon': Icons.sports_cricket_rounded},
    {'name': 'Tennis', 'icon': Icons.sports_baseball_rounded},
  ];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    // 1. Fetch initial device GPS geolocation
    _getCurrentUserLocation(showToast: false);

    // 2. Fetch live grounds directly from database
    _fetchDatabaseGrounds();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  // Fetch Live Grounds from MongoDB via ApiService
  Future<void> _fetchDatabaseGrounds() async {
    if (!mounted) return;
    setState(() => _isLoadingGrounds = true);

    try {
      final grounds = await ApiService.fetchGrounds(
        sport: _selectedSport == 'All Sports' ? 'All' : _selectedSport,
        search: _searchQuery,
      );

      if (mounted) {
        setState(() {
          _databaseGrounds = grounds;
          _isLoadingGrounds = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingGrounds = false);
      }
    }
  }

  // Fetch Live Device Location via Geolocator
  Future<void> _getCurrentUserLocation({bool showToast = true}) async {
    if (!mounted) return;
    setState(() => _isFetchingLocation = true);

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted && showToast) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('GPS is turned off. Please turn on Location in device settings.'),
              backgroundColor: Colors.orangeAccent,
              duration: Duration(seconds: 3),
            ),
          );
        }
        if (mounted) setState(() => _isFetchingLocation = false);
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted && showToast) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Location permission was denied.'),
                backgroundColor: Colors.orangeAccent,
                duration: Duration(seconds: 3),
              ),
            );
          }
          if (mounted) setState(() => _isFetchingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted && showToast) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location permission is permanently denied. Please allow location in App Settings.'),
              backgroundColor: Colors.redAccent,
              duration: Duration(seconds: 4),
            ),
          );
        }
        if (mounted) setState(() => _isFetchingLocation = false);
        return;
      }

      Position? position = await Geolocator.getLastKnownPosition();
      position ??= await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.medium,
      ).timeout(const Duration(seconds: 8), onTimeout: () async {
        return await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.low,
        );
      });

      final currentPos = position;
      if (mounted) {
        setState(() {
          _userLocation = LatLng(currentPos.latitude, currentPos.longitude);
          _isFetchingLocation = false;
        });

        _mapController.move(_userLocation, 14.0);

        if (showToast) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(
                  '📍 Location updated (${currentPos.latitude.toStringAsFixed(3)}, ${currentPos.longitude.toStringAsFixed(3)})'),
              backgroundColor: const Color(0xFF2E7D32),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    } catch (_) {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
        _mapController.move(_userLocation, 14.0);
      }
    }
  }

  // Filtered and Sorted list of Database Grounds with dynamic distance
  List<Map<String, dynamic>> get _filteredVenues {
    final rawGrounds = _databaseGrounds;
    if (rawGrounds.isEmpty) return <Map<String, dynamic>>[];

    final list = <Map<String, dynamic>>[];
    for (final ground in rawGrounds) {
      final lat = ground.latitude != 0.0 ? ground.latitude : 11.2588;
      final lng = ground.longitude != 0.0 ? ground.longitude : 75.7804;
      final coords = LatLng(lat, lng);

      double dynamicKm = ground.distanceKm;
      try {
        final meters = Geolocator.distanceBetween(
          _userLocation.latitude,
          _userLocation.longitude,
          coords.latitude,
          coords.longitude,
        );
        final km = double.parse((meters / 1000).toStringAsFixed(1));
        if (km > 0) dynamicKm = km;
      } catch (_) {}

      final matchesSport = _selectedSport == 'All Sports' ||
          ground.sportType.toLowerCase() == _selectedSport.toLowerCase();
      final matchesQuery = _searchQuery.isEmpty ||
          ground.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          ground.location.toLowerCase().contains(_searchQuery.toLowerCase());

      if (matchesSport && matchesQuery) {
        list.add({
          'id': ground.groundId,
          'title': ground.title,
          'sport': ground.sportType,
          'rating': ground.rating,
          'reviews': ground.reviewCount,
          'distanceKm': dynamicKm,
          'pricePerHour': ground.pricePerHour,
          'operatingHours': '6:00 AM - 11:00 PM',
          'isFeatured': ground.aiScore >= 95,
          'location': ground.location,
          'address': ground.address,
          'coords': coords,
          'color': _getSportColor(ground.sportType),
          'sportIcon': _getSportIcon(ground.sportType),
          'image': ground.images.isNotEmpty
              ? ground.images.first
              : 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
          'groundModel': ground,
        });
      }
    }

    list.sort((a, b) {
      if (_sortBy == 'Rating') {
        return (b['rating'] as double).compareTo(a['rating'] as double);
      } else if (_sortBy == 'Price') {
        return (a['pricePerHour'] as num).compareTo(b['pricePerHour'] as num);
      }
      return (a['distanceKm'] as num).compareTo(b['distanceKm'] as num);
    });

    return list;
  }

  Color _getSportColor(String sport) {
    switch (sport.toLowerCase()) {
      case 'football':
      case 'soccer':
        return const Color(0xFF1565C0);
      case 'badminton':
        return const Color(0xFF2E7D32);
      case 'basketball':
        return const Color(0xFFE65100);
      case 'cricket':
        return const Color(0xFFC62828);
      case 'tennis':
        return const Color(0xFF7B1FA2);
      default:
        return AppColors.warmAccent;
    }
  }

  IconData _getSportIcon(String sport) {
    switch (sport.toLowerCase()) {
      case 'football':
      case 'soccer':
        return Icons.sports_soccer_rounded;
      case 'badminton':
        return Icons.sports_tennis_rounded;
      case 'basketball':
        return Icons.sports_basketball_rounded;
      case 'cricket':
        return Icons.sports_cricket_rounded;
      case 'tennis':
        return Icons.sports_baseball_rounded;
      default:
        return Icons.sports_rounded;
    }
  }

  void _recenterMap() {
    _getCurrentUserLocation(showToast: true);
  }

  void _selectVenueOnMap(Map<String, dynamic> venue) {
    setState(() {
      _selectedGround = venue['groundModel'] as GroundModel;
    });
    _mapController.move(venue['coords'] as LatLng, 15.5);
  }

  void _openVenueDetailsModal(Map<String, dynamic> venue) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _buildVenueDetailsSheet(venue),
    );
  }

  @override
  Widget build(BuildContext context) {
    final filteredList = _filteredVenues;

    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      body: SafeArea(
        child: Column(
          children: [
            // ── TOP HEADER (Menu, Logo, Filter) ──
            _buildTopAppBar(),

            // ── LOCATION SELECTOR & SEARCH BAR ──
            _buildLocationAndSearchRow(),

            const SizedBox(height: 8),

            // ── SPORTS CATEGORY FILTERS CHIPS ──
            _buildSportsFilterBar(),

            const SizedBox(height: 8),

            // ── MAP VIEW & DRAGGABLE NEARBY GROUNDS SHEET ──
            Expanded(
              child: Stack(
                children: [
                  // OpenStreetMap view with Exact Database Ground Coordinates
                  Positioned.fill(
                    child: FlutterMap(
                      mapController: _mapController,
                      options: MapOptions(
                        initialCenter: _userLocation,
                        initialZoom: 13.5,
                        minZoom: 5.0,
                        maxZoom: 18.0,
                      ),
                      children: [
                        // OpenStreetMap Standard Tile Layer
                        TileLayer(
                          urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                          userAgentPackageName: 'com.sportverse.ai',
                        ),

                        // Map Markers Layer (Exact Database Markings)
                        MarkerLayer(
                          markers: [
                            // 1. User Live Location Pulse Marker
                            Marker(
                              point: _userLocation,
                              width: 60,
                              height: 60,
                              child: AnimatedBuilder(
                                animation: _pulseController,
                                builder: (context, child) {
                                  return Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Container(
                                        width: 24 + (_pulseController.value * 24),
                                        height: 24 + (_pulseController.value * 24),
                                        decoration: BoxDecoration(
                                          color: const Color(0xFF2196F3)
                                              .withValues(alpha: 0.35 - (_pulseController.value * 0.2)),
                                          shape: BoxShape.circle,
                                        ),
                                      ),
                                      Container(
                                        width: 18,
                                        height: 18,
                                        decoration: BoxDecoration(
                                          color: Colors.white,
                                          shape: BoxShape.circle,
                                          boxShadow: [
                                            BoxShadow(
                                              color: Colors.black.withValues(alpha: 0.2),
                                              blurRadius: 4,
                                            ),
                                          ],
                                        ),
                                        child: Center(
                                          child: Container(
                                            width: 12,
                                            height: 12,
                                            decoration: const BoxDecoration(
                                              color: Color(0xFF1E88E5),
                                              shape: BoxShape.circle,
                                            ),
                                          ),
                                        ),
                                      ),
                                    ],
                                  );
                                },
                              ),
                            ),

                            // 2. Exact Database Ground Pin Markers
                            ...filteredList.map((venue) {
                              final isSelected = _selectedGround?.groundId == venue['id'];
                              final LatLng coords = venue['coords'] as LatLng;

                              return Marker(
                                point: coords,
                                width: isSelected ? 56 : 46,
                                height: isSelected ? 56 : 46,
                                child: GestureDetector(
                                  onTap: () {
                                    _selectVenueOnMap(venue);
                                    _openVenueDetailsModal(venue);
                                  },
                                  child: AnimatedContainer(
                                    duration: const Duration(milliseconds: 200),
                                    decoration: const BoxDecoration(
                                      shape: BoxShape.circle,
                                    ),
                                    child: Stack(
                                      alignment: Alignment.center,
                                      children: [
                                        Container(
                                          width: isSelected ? 52 : 42,
                                          height: isSelected ? 52 : 42,
                                          decoration: BoxDecoration(
                                            color: venue['color'] as Color,
                                            shape: BoxShape.circle,
                                            border: Border.all(
                                              color: Colors.white,
                                              width: isSelected ? 3 : 2,
                                            ),
                                            boxShadow: [
                                              BoxShadow(
                                                color: (venue['color'] as Color).withValues(alpha: 0.45),
                                                blurRadius: isSelected ? 12 : 6,
                                                offset: const Offset(0, 3),
                                              ),
                                            ],
                                          ),
                                          child: Icon(
                                            venue['sportIcon'] as IconData,
                                            color: Colors.white,
                                            size: isSelected ? 24 : 20,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              );
                            }),
                          ],
                        ),
                      ],
                    ),
                  ),

                  // Floating Map Action Buttons (Locate Me & List View toggle)
                  Positioned(
                    bottom: 340,
                    left: 16,
                    right: 16,
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        // Locate Me Button
                        FloatingActionButton.small(
                          heroTag: 'locate_me_btn',
                          onPressed: _isFetchingLocation ? null : _recenterMap,
                          backgroundColor: Colors.white,
                          elevation: 4,
                          shape: const CircleBorder(),
                          child: _isFetchingLocation
                              ? const SizedBox(
                                  width: 16,
                                  height: 16,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: AppColors.warmAccent,
                                  ),
                                )
                              : const Icon(
                                  Icons.my_location_rounded,
                                  color: AppColors.primaryBlack,
                                  size: 20,
                                ),
                        ),

                        // List / Map View Toggle Button
                        ElevatedButton.icon(
                          onPressed: () {
                            setState(() {
                              _isListViewFull = !_isListViewFull;
                            });
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: AppColors.primaryBlack,
                            elevation: 4,
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                          ),
                          icon: Icon(
                            _isListViewFull ? Icons.map_outlined : Icons.format_list_bulleted_rounded,
                            size: 18,
                            color: AppColors.primaryBlack,
                          ),
                          label: Text(
                            _isListViewFull ? 'Map View' : 'List View',
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlack,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // ── DRAGGABLE SCROLLABLE SHEET FOR DATABASE GROUNDS ──
                  DraggableScrollableSheet(
                    initialChildSize: _isListViewFull ? 0.90 : 0.44,
                    minChildSize: 0.22,
                    maxChildSize: 0.94,
                    snap: true,
                    builder: (context, scrollController) {
                      return Container(
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.vertical(
                            top: Radius.circular(24),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Color(0x18000000),
                              blurRadius: 16,
                              offset: Offset(0, -4),
                            ),
                          ],
                        ),
                        child: CustomScrollView(
                          controller: scrollController,
                          slivers: [
                            SliverToBoxAdapter(
                              child: Column(
                                children: [
                                  const SizedBox(height: 10),
                                  Container(
                                    width: 44,
                                    height: 4.5,
                                    decoration: BoxDecoration(
                                      color: Colors.grey.shade300,
                                      borderRadius: BorderRadius.circular(3),
                                    ),
                                  ),
                                  const SizedBox(height: 12),

                                  // Sheet Header
                                  Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 20),
                                    child: Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Row(
                                          children: [
                                            const Text(
                                              'Nearby Grounds',
                                              style: TextStyle(
                                                fontSize: 18,
                                                fontWeight: FontWeight.bold,
                                                color: AppColors.primaryBlack,
                                              ),
                                            ),
                                            const SizedBox(width: 8),
                                            Container(
                                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                              decoration: BoxDecoration(
                                                color: AppColors.lightDecorAccent,
                                                borderRadius: BorderRadius.circular(10),
                                              ),
                                              child: Text(
                                                '${filteredList.length}',
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.warmAccent,
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),

                                        // Sort Dropdown
                                        PopupMenuButton<String>(
                                          initialValue: _sortBy,
                                          onSelected: (val) => setState(() => _sortBy = val),
                                          child: Row(
                                            children: [
                                              const Text(
                                                'Sort by: ',
                                                style: TextStyle(
                                                  fontSize: 12,
                                                  color: AppColors.mutedText,
                                                ),
                                              ),
                                              Text(
                                                _sortBy,
                                                style: const TextStyle(
                                                  fontSize: 12,
                                                  fontWeight: FontWeight.bold,
                                                  color: AppColors.primaryBlack,
                                                ),
                                              ),
                                              const Icon(
                                                Icons.keyboard_arrow_down,
                                                size: 16,
                                                color: AppColors.primaryBlack,
                                              ),
                                            ],
                                          ),
                                          itemBuilder: (context) => [
                                            const PopupMenuItem(
                                              value: 'Distance',
                                              child: Text('Distance'),
                                            ),
                                            const PopupMenuItem(
                                              value: 'Rating',
                                              child: Text('Rating'),
                                            ),
                                            const PopupMenuItem(
                                              value: 'Price',
                                              child: Text('Price'),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 14),
                                ],
                              ),
                            ),

                            // Ground Cards List
                            if (_isLoadingGrounds)
                              const SliverToBoxAdapter(
                                child: Padding(
                                  padding: EdgeInsets.all(40.0),
                                  child: Center(
                                    child: CircularProgressIndicator(
                                      color: AppColors.warmAccent,
                                    ),
                                  ),
                                ),
                              )
                            else if (filteredList.isEmpty)
                              SliverToBoxAdapter(
                                child: Padding(
                                  padding: const EdgeInsets.all(32.0),
                                  child: Column(
                                    children: [
                                      Icon(
                                        Icons.location_off_outlined,
                                        size: 48,
                                        color: Colors.grey.shade400,
                                      ),
                                      const SizedBox(height: 12),
                                      const Text(
                                        'No grounds found in this area',
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.secondaryText,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              )
                            else
                              SliverPadding(
                                padding: const EdgeInsets.symmetric(horizontal: 16),
                                sliver: SliverList(
                                  delegate: SliverChildBuilderDelegate(
                                    (context, index) {
                                      final venue = filteredList[index];
                                      return _buildGroundCard(venue);
                                    },
                                    childCount: filteredList.length,
                                  ),
                                ),
                              ),

                            const SliverToBoxAdapter(
                              child: SizedBox(height: 80),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── 1. Top App Bar Row ──
  Widget _buildTopAppBar() {
    return TopNavigationBar(
      onMenuPressed: widget.onBack,
      trailing: IconButton(
        icon: const Icon(Icons.tune_outlined, size: 22, color: AppColors.primaryBlack),
        onPressed: _showFilterOptionsModal,
      ),
    );
  }

  // ── 2. Location & Search Controls Row ──
  Widget _buildLocationAndSearchRow() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          // Location Pill
          InkWell(
            onTap: _showLocationPickerModal,
            borderRadius: BorderRadius.circular(20),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.location_on_outlined, size: 16, color: AppColors.warmAccent),
                  const SizedBox(width: 4),
                  Text(
                    _selectedLocation,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  const SizedBox(width: 4),
                  const Icon(Icons.keyboard_arrow_down, size: 16, color: AppColors.mutedText),
                ],
              ),
            ),
          ),

          const SizedBox(width: 8),

          // Search Field
          Expanded(
            child: Container(
              height: 42,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: AppColors.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.03),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: TextField(
                onChanged: (val) {
                  setState(() => _searchQuery = val);
                },
                decoration: InputDecoration(
                  hintText: 'Search ground, area...',
                  hintStyle: const TextStyle(
                    fontSize: 12,
                    color: AppColors.mutedText,
                  ),
                  prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.mutedText),
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(vertical: 11),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 16, color: AppColors.mutedText),
                          onPressed: () {
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ── 3. Horizontal Sports Category Chips Filter ──
  Widget _buildSportsFilterBar() {
    return SizedBox(
      height: 38,
      child: ListView.separated(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        itemCount: _sportFilters.length,
        separatorBuilder: (_, __) => const SizedBox(width: 8),
        itemBuilder: (context, index) {
          final sport = _sportFilters[index];
          final isSelected = _selectedSport == sport['name'];

          return InkWell(
            onTap: () {
              setState(() => _selectedSport = sport['name'] as String);
            },
            borderRadius: BorderRadius.circular(20),
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFFC8895B) : Colors.white,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: isSelected ? const Color(0xFFC8895B) : AppColors.border,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFFC8895B).withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        ),
                      ]
                    : [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.02),
                          blurRadius: 4,
                        ),
                      ],
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    sport['icon'] as IconData,
                    size: 16,
                    color: isSelected ? Colors.white : AppColors.primaryBlack,
                  ),
                  const SizedBox(width: 6),
                  Text(
                    sport['name'] as String,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? Colors.white : AppColors.primaryBlack,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  // ── 4. Ground Card Component Connected to Real Database ──
  Widget _buildGroundCard(Map<String, dynamic> venue) {
    final int venueId = venue['id'];
    final bool isFav = _favoriteGroundIds.contains(venueId);
    final isSelected = _selectedGround?.groundId == venueId;

    return Container(
      margin: const EdgeInsets.only(bottom: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isSelected ? AppColors.warmAccent : AppColors.borderSubtle,
          width: isSelected ? 1.5 : 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Ground Image with Badges
                Stack(
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        venue['image'],
                        width: 110,
                        height: 110,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          width: 110,
                          height: 110,
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.sports, color: AppColors.mutedText),
                        ),
                      ),
                    ),

                    // FEATURED Tag
                    if (venue['isFeatured'] == true)
                      Positioned(
                        top: 6,
                        left: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFF2E7D32),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Text(
                            'FEATURED',
                            style: TextStyle(
                              fontSize: 8,
                              fontWeight: FontWeight.w900,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ),
                      ),

                    // Circular Sport Badge icon
                    Positioned(
                      bottom: 6,
                      left: 6,
                      child: Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          color: venue['color'] as Color,
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 1.5),
                        ),
                        child: Icon(
                          venue['sportIcon'] as IconData,
                          color: Colors.white,
                          size: 14,
                        ),
                      ),
                    ),
                  ],
                ),

                const SizedBox(width: 12),

                // Ground Details
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            child: Text(
                              venue['title'],
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppColors.primaryBlack,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          InkWell(
                            onTap: () {
                              setState(() {
                                if (isFav) {
                                  _favoriteGroundIds.remove(venueId);
                                } else {
                                  _favoriteGroundIds.add(venueId);
                                }
                              });
                            },
                            child: Padding(
                              padding: const EdgeInsets.all(2.0),
                              child: Icon(
                                isFav ? Icons.favorite_rounded : Icons.favorite_border_rounded,
                                size: 20,
                                color: isFav ? const Color(0xFFE53935) : AppColors.mutedText,
                              ),
                            ),
                          ),
                        ],
                      ),

                      Text(
                        venue['sport'],
                        style: const TextStyle(
                          fontSize: 12,
                          color: AppColors.secondaryText,
                        ),
                      ),
                      const SizedBox(height: 4),

                      // Rating & Reviews Count
                      Row(
                        children: [
                          const Icon(Icons.star_rounded, size: 16, color: Color(0xFFFFB300)),
                          const SizedBox(width: 3),
                          Text(
                            '${venue['rating']} ',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: AppColors.primaryBlack,
                            ),
                          ),
                          Text(
                            '(${venue['reviews']})',
                            style: const TextStyle(
                              fontSize: 11,
                              color: AppColors.mutedText,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),

                      // Distance
                      Row(
                        children: [
                          const Icon(Icons.location_on_outlined, size: 13, color: AppColors.mutedText),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              '${venue['distanceKm']} km away • ${venue['location']}',
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.secondaryText,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),

                      // Operating Hours
                      Row(
                        children: [
                          const Icon(Icons.access_time_rounded, size: 13, color: AppColors.mutedText),
                          const SizedBox(width: 3),
                          Expanded(
                            child: Text(
                              venue['operatingHours'],
                              style: const TextStyle(
                                fontSize: 11,
                                color: AppColors.secondaryText,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),

                      const SizedBox(height: 8),

                      // Price & View Details Button Row
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Flexible(
                            child: RichText(
                              overflow: TextOverflow.ellipsis,
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: '₹${venue['pricePerHour'].toInt()} ',
                                    style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w900,
                                      color: Color(0xFFC8895B),
                                    ),
                                  ),
                                  const TextSpan(
                                    text: '/hr',
                                    style: TextStyle(
                                      fontSize: 10,
                                      color: AppColors.mutedText,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(width: 4),
                          ElevatedButton(
                            onPressed: () {
                              _selectVenueOnMap(venue);
                              _openVenueDetailsModal(venue);
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFC8895B),
                              foregroundColor: Colors.white,
                              elevation: 0,
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              minimumSize: const Size(80, 32),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(16),
                              ),
                            ),
                            child: const Text(
                              'View Details',
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Venue Details Sheet Modal ──
  Widget _buildVenueDetailsSheet(Map<String, dynamic> venue) {
    final GroundModel ground = venue['groundModel'] as GroundModel;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.85,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 10, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Ground Image Hero
            Stack(
              children: [
                Image.network(
                  venue['image'],
                  width: double.infinity,
                  height: 200,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: double.infinity,
                    height: 200,
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.sports, size: 48, color: AppColors.mutedText),
                  ),
                ),
                Positioned(
                  top: 12,
                  right: 12,
                  child: CircleAvatar(
                    backgroundColor: Colors.white,
                    child: IconButton(
                      icon: const Icon(Icons.close, color: AppColors.primaryBlack),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ),
                Positioned(
                  bottom: 12,
                  left: 16,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: venue['color'] as Color,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Icon(venue['sportIcon'] as IconData, color: Colors.white, size: 14),
                        const SizedBox(width: 4),
                        Text(
                          venue['sport'],
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          venue['title'],
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primaryBlack,
                          ),
                        ),
                      ),
                      Text(
                        '₹${venue['pricePerHour'].toInt()} / hr',
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFFC8895B),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      const Icon(Icons.location_on, size: 16, color: AppColors.warmAccent),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '${venue['address']} • ${venue['distanceKm']} km away',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.secondaryText,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      const Icon(Icons.star_rounded, color: Color(0xFFFFB300), size: 18),
                      const SizedBox(width: 4),
                      Text(
                        '${venue['rating']}',
                        style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        ' (${venue['reviews']} verified reviews)',
                        style: const TextStyle(fontSize: 13, color: AppColors.mutedText),
                      ),
                    ],
                  ),

                  // Facilities Section
                  const SizedBox(height: 16),
                  const Text(
                    'Facilities Available',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (ground.facilities.isNotEmpty
                            ? ground.facilities
                            : ['Floodlights', 'Turf', 'Changing Rooms', 'Parking', 'Water Cooler'])
                        .map(
                          (f) => Chip(
                            label: Text(f, style: const TextStyle(fontSize: 11)),
                            backgroundColor: AppColors.lightDecorAccent,
                            padding: EdgeInsets.zero,
                            materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                          ),
                        )
                        .toList(),
                  ),

                  // Available Slots Section
                  if (ground.availableSlots.isNotEmpty) ...[
                    const SizedBox(height: 18),
                    const Text(
                      'Available Slots Today',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlack,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: ground.availableSlots.map((slot) {
                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: slot.isBooked ? Colors.grey.shade100 : const Color(0xFFF1F8E9),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color: slot.isBooked ? Colors.grey.shade300 : const Color(0xFF81C784),
                            ),
                          ),
                          child: Text(
                            slot.time,
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: slot.isBooked ? Colors.grey : const Color(0xFF2E7D32),
                              decoration: slot.isBooked ? TextDecoration.lineThrough : null,
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ],

                  const SizedBox(height: 24),

                  // Book Slot Action Button
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => GroundBookingScreen(ground: ground),
                          ),
                        );
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primaryBlack,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(25),
                        ),
                      ),
                      child: const Text(
                        'Book Court Slot Now',
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
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

  // ── Location Picker Dialog ──
  void _showLocationPickerModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        final locations = [
          'Calicut, Kerala',
          'Kozhikode Beach, Calicut',
          'Mavoor Road, Calicut',
          'Malaparamba, Calicut',
          'Palayam, Calicut',
          'Koovapally, Kerala',
          'Kochi, Kerala',
          'Trivandrum, Kerala',
        ];
        return Material(
          color: Colors.white,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Select City / Region',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              ...locations.map(
                (loc) => ListTile(
                  leading: const Icon(Icons.location_city_rounded, color: AppColors.warmAccent),
                  title: Text(loc),
                  trailing: _selectedLocation == loc ? const Icon(Icons.check_circle, color: AppColors.warmAccent) : null,
                  onTap: () {
                    setState(() => _selectedLocation = loc);
                    Navigator.pop(context);
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

  // ── Filter Options Modal ──
  void _showFilterOptionsModal() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (context) {
        return Container(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Filter Venues',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  TextButton(
                    onPressed: () {
                      setState(() {
                        _selectedSport = 'All Sports';
                        _sortBy = 'Distance';
                        _searchQuery = '';
                      });
                      Navigator.pop(context);
                    },
                    child: const Text('Reset All'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Text('Sort By', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                children: ['Distance', 'Rating', 'Price'].map((s) {
                  final selected = _sortBy == s;
                  return ChoiceChip(
                    label: Text(s),
                    selected: selected,
                    selectedColor: AppColors.warmAccent,
                    onSelected: (sel) {
                      if (sel) {
                        setState(() => _sortBy = s);
                        Navigator.pop(context);
                      }
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }
}
