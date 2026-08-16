import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

import '../theme/app_theme.dart';
import '../widgets/primary_button.dart';
import '../providers/auth_provider.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import 'home_screen.dart';
import 'become_ground_owner_screen.dart';

class ProfileCompletionScreen extends StatefulWidget {
  const ProfileCompletionScreen({super.key});

  @override
  State<ProfileCompletionScreen> createState() => _ProfileCompletionScreenState();
}

class _ProfileCompletionScreenState extends State<ProfileCompletionScreen> {
  // Navigation & Step Control
  int _currentStep = 1;

  // Step 1 Controllers & Fields
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  String _profileImageUrl = '';
  String _selectedRole = 'User'; // 'User' (Athlete) or 'GroundOwner' (Owner)
  String _selectedPlace = 'New York, USA';

  // Athlete Preferences
  String _selectedSkillLevel = 'Intermediate';
  final List<String> _selectedSports = ['Football', 'Cricket'];

  // Step 2 Controllers & Fields (Ground Owner Details)
  late TextEditingController _groundNameController;
  late TextEditingController _priceController;
  String _selectedSportType = 'Football';
  late MapController _mapController;
  LatLng _selectedGroundLocation = const LatLng(40.7128, -74.0060); // Default NY

  bool _isLoading = false;
  bool _isFetchingGps = false;

  // Preset Places with Map Coordinates
  final Map<String, LatLng> _placesWithCoords = {
    'New York, USA': const LatLng(40.7128, -74.0060),
    'London, UK': const LatLng(51.5074, -0.1278),
    'Mumbai, India': const LatLng(19.0760, 72.8777),
    'Delhi, India': const LatLng(28.6139, 77.2090),
    'Bangalore, India': const LatLng(12.9716, 77.5946),
    'Dubai, UAE': const LatLng(25.2048, 55.2708),
    'Tokyo, Japan': const LatLng(35.6762, 139.6503),
    'Sydney, Australia': const LatLng(-33.8688, 151.2093),
    'Los Angeles, USA': const LatLng(34.0522, -118.2437),
    'Toronto, Canada': const LatLng(43.6532, -79.3832),
  };

  final List<String> _availableSports = [
    'Football',
    'Cricket',
    'Basketball',
    'Tennis',
    'Badminton',
    'Volleyball',
    'Padel',
    'Swimming',
  ];

  final List<String> _skillLevels = [
    'Beginner',
    'Intermediate',
    'Advanced',
    'Pro',
  ];

  final List<String> _presetAvatars = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
  ];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();

    final user = AuthService.currentUser;
    final name = user?['fullName'] as String? ?? user?['full_name'] as String? ?? '';
    final phone = user?['phone'] as String? ?? '';
    _profileImageUrl = user?['profileImage'] as String? ?? user?['profile_image'] as String? ?? '';

    _nameController = TextEditingController(text: name);
    _phoneController = TextEditingController(text: phone);
    _groundNameController = TextEditingController(text: '${name.isNotEmpty ? name : "User"}\'s Sports Arena');
    _priceController = TextEditingController(text: '45');

    if (user?['role'] != null && (user!['role'] == 'User' || user['role'] == 'GroundOwner')) {
      _selectedRole = user['role'] as String;
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _groundNameController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  // ── GPS Geolocation Fetcher ──
  Future<void> _getCurrentUserGpsLocation() async {
    setState(() => _isFetchingGps = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _fallbackGpsLocation();
        return;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _fallbackGpsLocation();
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        _fallbackGpsLocation();
        return;
      }

      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );

      final gpsPoint = LatLng(position.latitude, position.longitude);
      final locationString = 'GPS (${position.latitude.toStringAsFixed(3)}, ${position.longitude.toStringAsFixed(3)})';

      setState(() {
        _selectedGroundLocation = gpsPoint;
        if (!_placesWithCoords.containsKey(locationString)) {
          _placesWithCoords[locationString] = gpsPoint;
        }
        _selectedPlace = locationString;
        _isFetchingGps = false;
      });

      _mapController.move(gpsPoint, 15.0);
      _showSnackBar('📍 Live GPS position detected: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}');
    } catch (e) {
      _fallbackGpsLocation();
    }
  }

  void _fallbackGpsLocation() {
    const fallback = LatLng(11.2588, 75.7804);
    setState(() {
      _selectedGroundLocation = fallback;
      _isFetchingGps = false;
    });
    _mapController.move(fallback, 15.0);
    _showSnackBar('📍 Live GPS position set: 11.2588, 75.7804');
  }

  void _onPlaceChanged(String? newPlace) {
    if (newPlace != null && _placesWithCoords.containsKey(newPlace)) {
      setState(() {
        _selectedPlace = newPlace;
        _selectedGroundLocation = _placesWithCoords[newPlace]!;
      });
      _mapController.move(_selectedGroundLocation, 14.0);
    }
  }

  void _showEditProfileImageDialog() {
    final urlController = TextEditingController(text: _profileImageUrl);
    showDialog(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: const Text(
            'Edit Profile Picture',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Choose a preset avatar or paste image URL:',
                style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: _presetAvatars.map((url) {
                  return GestureDetector(
                    onTap: () {
                      setState(() => _profileImageUrl = url);
                      Navigator.pop(ctx);
                    },
                    child: CircleAvatar(
                      radius: 24,
                      backgroundImage: NetworkImage(url),
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: urlController,
                decoration: const InputDecoration(
                  labelText: 'Custom Image URL',
                  hintText: 'https://example.com/photo.jpg',
                  prefixIcon: Icon(Icons.link, size: 18),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel', style: TextStyle(color: Colors.grey)),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryBlack,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () {
                if (urlController.text.trim().isNotEmpty) {
                  setState(() => _profileImageUrl = urlController.text.trim());
                }
                Navigator.pop(ctx);
              },
              child: const Text('Save Photo', style: TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  Future<void> _handleCompleteProfile() async {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();

    if (name.isEmpty) {
      _showSnackBar('Please enter your full name');
      return;
    }

    if (_selectedRole == 'GroundOwner') {
      if (_groundNameController.text.trim().isEmpty) {
        _showSnackBar('Please enter your Ground Name');
        return;
      }
    }

    setState(() => _isLoading = true);

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    authProvider.setSelectedRole(_selectedRole);

    final result = await AuthService.updateProfile(
      fullName: name,
      phone: phone,
      role: _selectedRole,
    );

    if (_selectedRole == 'GroundOwner') {
      try {
        await http.post(
          Uri.parse('${ApiService.baseUrl}/grounds'),
          headers: {'Content-Type': 'application/json'},
          body: jsonEncode({
            'title': _groundNameController.text.trim(),
            'sport_type': _selectedSportType,
            'location': _selectedPlace,
            'price_per_hour': double.tryParse(_priceController.text.trim()) ?? 45,
            'rating': 4.8,
            'image': 'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
            'description': 'Premium sports venue near $_selectedPlace.',
            'coords': {
              'lat': _selectedGroundLocation.latitude,
              'lng': _selectedGroundLocation.longitude,
            },
          }),
        ).timeout(const Duration(seconds: 3));
      } catch (_) {}
    }

    if (mounted) {
      setState(() => _isLoading = false);
      _showSnackBar(result['message'] as String? ?? 'Profile setup complete!');

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    }
  }

  void _skipSetup() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const HomeScreen()),
    );
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.primaryBlack,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = AuthService.currentUser;
    final email = user?['email'] as String? ?? 'googleuser@gmail.com';

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: Container(
              constraints: const BoxConstraints(maxWidth: 580),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: AppColors.borderSubtle, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.05),
                    blurRadius: 24,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              padding: const EdgeInsets.all(24),
              child: _currentStep == 1
                  ? _buildStepOne(email)
                  : _buildStepTwoOwner(),
            ),
          ),
        ),
      ),
    );
  }

  // ── STEP 1: PERSONAL & ROLE SELECTION ──
  Widget _buildStepOne(String email) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Bar
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.lightDecorAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Google Sign-In Verified ✓',
                style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: AppColors.warmAccent,
                ),
              ),
            ),
            GestureDetector(
              onTap: _skipSetup,
              child: const Text(
                'Skip for now',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AppColors.mutedText,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        const Text(
          'Complete Your Profile 🎯',
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        const SizedBox(height: 6),
        const Text(
          'Customize your profile and choose your primary role on SportVerse.',
          style: TextStyle(
            fontSize: 13,
            color: AppColors.secondaryText,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),

        // Avatar Preview with Edit Profile Button
        Center(
          child: Column(
            children: [
              Stack(
                children: [
                  CircleAvatar(
                    radius: 44,
                    backgroundColor: AppColors.lightDecorAccent,
                    backgroundImage: _profileImageUrl.isNotEmpty
                        ? NetworkImage(_profileImageUrl)
                        : null,
                    child: _profileImageUrl.isEmpty
                        ? const Icon(Icons.person, size: 48, color: AppColors.warmAccent)
                        : null,
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: GestureDetector(
                      onTap: _showEditProfileImageDialog,
                      child: Container(
                        padding: const EdgeInsets.all(7),
                        decoration: const BoxDecoration(
                          color: AppColors.primaryBlack,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.camera_alt,
                          size: 14,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _showEditProfileImageDialog,
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                icon: const Icon(Icons.edit, size: 14, color: AppColors.primaryBlack),
                label: const Text(
                  'Edit Profile Picture',
                  style: TextStyle(fontSize: 12, color: AppColors.primaryBlack, fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Full Name Field
        const Text(
          'Full Name',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            hintText: 'Enter your full name',
            prefixIcon: Icon(Icons.person_outline, size: 18),
          ),
        ),
        const SizedBox(height: 16),

        // Email Field (Google Verified)
        const Text(
          'Email Address (Google Verified)',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 6),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            color: const Color(0xFFF7F7F7),
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border, width: 1),
          ),
          child: Row(
            children: [
              const Icon(Icons.mark_email_read_outlined, size: 18, color: AppColors.mutedText),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  email,
                  style: const TextStyle(fontSize: 13, color: AppColors.mutedText, fontWeight: FontWeight.w500),
                ),
              ),
              const Icon(Icons.lock_outline, size: 16, color: AppColors.mutedText),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Phone Number Field
        const Text(
          'Phone Number',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _phoneController,
          keyboardType: TextInputType.phone,
          decoration: const InputDecoration(
            hintText: 'Enter phone number (e.g. +1 234 567 890)',
            prefixIcon: Icon(Icons.phone_outlined, size: 18),
          ),
        ),
        const SizedBox(height: 16),

        // Place Selection & Geo Location Section
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Expanded(
              child: Text(
                'Select Preferred Place / City',
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
              ),
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _isFetchingGps ? null : _getCurrentUserGpsLocation,
              child: Row(
                children: [
                  _isFetchingGps
                      ? const SizedBox(
                          width: 12,
                          height: 12,
                          child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent),
                        )
                      : const Icon(Icons.my_location, size: 14, color: AppColors.warmAccent),
                  const SizedBox(width: 4),
                  Text(
                    _isFetchingGps ? 'Locating...' : 'Use GPS 📍',
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      color: AppColors.warmAccent,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          initialValue: _selectedPlace,
          decoration: const InputDecoration(
            prefixIcon: Icon(Icons.location_city_outlined, size: 18),
          ),
          items: _placesWithCoords.keys.map((place) {
            return DropdownMenuItem<String>(
              value: place,
              child: Text(place, style: const TextStyle(fontSize: 13)),
            );
          }).toList(),
          onChanged: _onPlaceChanged,
        ),
        const SizedBox(height: 8),

        // Dedicated Geo Location Action Card
        OutlinedButton.icon(
          onPressed: _isFetchingGps ? null : _getCurrentUserGpsLocation,
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 44),
            padding: const EdgeInsets.symmetric(vertical: 10),
            side: const BorderSide(color: AppColors.warmAccent, width: 1.2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            backgroundColor: AppColors.lightDecorAccent.withValues(alpha: 0.3),
          ),
          icon: _isFetchingGps
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent),
                )
              : const Icon(Icons.gps_fixed, size: 16, color: AppColors.warmAccent),
          label: Text(
            _isFetchingGps ? 'Detecting GPS Geolocation...' : 'Auto-Detect My GPS Geolocation 📡',
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: AppColors.warmAccent,
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Select Role (Showing EXACTLY 2 Roles: Athlete vs Owner)
        const Text(
          'Select Your Account Role',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildRoleCard(
                role: 'User',
                label: '⚽ Athlete',
                subtitle: 'Book grounds & play matches',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildRoleCard(
                role: 'GroundOwner',
                label: '🏟️ Ground Owner',
                subtitle: 'List & manage your venues',
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Additional Options for Athlete Role
        if (_selectedRole == 'User') ...[
          const Text(
            'Favorite Sports',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _availableSports.map((sport) {
              final isSelected = _selectedSports.contains(sport);
              return FilterChip(
                label: Text(sport),
                selected: isSelected,
                selectedColor: AppColors.lightDecorAccent,
                checkmarkColor: AppColors.warmAccent,
                labelStyle: TextStyle(
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? AppColors.warmAccent : AppColors.secondaryText,
                ),
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                  side: BorderSide(
                    color: isSelected ? AppColors.warmAccent : AppColors.border,
                    width: 1,
                  ),
                ),
                onSelected: (selected) {
                  setState(() {
                    if (selected) {
                      _selectedSports.add(sport);
                    } else {
                      _selectedSports.remove(sport);
                    }
                  });
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          const Text(
            'Skill Level',
            style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: _skillLevels.map((level) {
              final isSelected = _selectedSkillLevel == level;
              return ChoiceChip(
                label: Text(level),
                selected: isSelected,
                selectedColor: AppColors.primaryBlack,
                labelStyle: TextStyle(
                  fontSize: 12,
                  color: isSelected ? Colors.white : AppColors.primaryBlack,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
                backgroundColor: const Color(0xFFF3F3F3),
                onSelected: (selected) {
                  if (selected) {
                    setState(() => _selectedSkillLevel = level);
                  }
                },
              );
            }).toList(),
          ),
        ],

        const SizedBox(height: 28),

        // Action Button
        if (_selectedRole == 'GroundOwner') ...[
          PrimaryButton(
            text: 'Next: Ground & Location Details →',
            onPressed: () {
              final name = _nameController.text.trim();
              if (name.isEmpty) {
                _showSnackBar('Please enter your full name before proceeding');
                return;
              }
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const BecomeGroundOwnerScreen()),
              );
            },
          ),
        ] else ...[
          PrimaryButton(
            text: 'Complete Profile & Continue',
            isLoading: _isLoading,
            onPressed: _handleCompleteProfile,
          ),
        ],
      ],
    );
  }

  // ── STEP 2: GROUND DETAILS & OPENSTREETMAP LOCATION PICKER (FOR OWNER) ──
  Widget _buildStepTwoOwner() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header & Back Step Bar
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            GestureDetector(
              onTap: () => setState(() => _currentStep = 1),
              child: const Row(
                children: [
                  Icon(Icons.arrow_back, size: 16, color: AppColors.primaryBlack),
                  SizedBox(width: 4),
                  Text(
                    'Step 1 (Personal Info)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: AppColors.lightDecorAccent,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                'Step 2 of 2: Ground Location',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.warmAccent),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        const Text(
          'Enter Ground Details & Map Location 🏟️',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Provide details about your sports venue and pinpoint its location on OpenStreetMap for $_selectedPlace.',
          style: const TextStyle(
            fontSize: 13,
            color: AppColors.secondaryText,
            height: 1.4,
          ),
        ),
        const SizedBox(height: 20),

        // Ground Name Field
        const Text(
          'Ground / Venue Name',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 6),
        TextField(
          controller: _groundNameController,
          decoration: const InputDecoration(
            hintText: 'e.g. Apex Sports Turf Arena',
            prefixIcon: Icon(Icons.sports_score, size: 18),
          ),
        ),
        const SizedBox(height: 16),

        // Row for Sport Type & Price
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Sport Type',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
                  ),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _selectedSportType,
                    decoration: const InputDecoration(
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                    items: ['Football', 'Cricket', 'Badminton', 'Tennis', 'Basketball', 'Padel', 'Volleyball']
                        .map((sport) => DropdownMenuItem(value: sport, child: Text(sport, style: const TextStyle(fontSize: 13))))
                        .toList(),
                    onChanged: (val) {
                      if (val != null) setState(() => _selectedSportType = val);
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Price / Hour (\$/hr)',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
                  ),
                  const SizedBox(height: 6),
                  TextField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      hintText: '45',
                      prefixIcon: Icon(Icons.attach_money, size: 18),
                      contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // OpenStreetMap Interactive Location Picker Header
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Select Location on OpenStreetMap 📍',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.primaryBlack),
            ),
            Text(
              'Tap map to set pin',
              style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: Colors.grey.shade600),
            ),
          ],
        ),
        const SizedBox(height: 8),

        // OpenStreetMap Widget Container with GPS Locate Floating Button
        Container(
          height: 260,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(15),
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _selectedGroundLocation,
                    initialZoom: 14.0,
                    minZoom: 4.0,
                    maxZoom: 18.0,
                    onTap: (tapPosition, point) {
                      setState(() {
                        _selectedGroundLocation = point;
                      });
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.sportverse.ai',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _selectedGroundLocation,
                          width: 48,
                          height: 48,
                          child: const Stack(
                            alignment: Alignment.center,
                            children: [
                              Icon(
                                Icons.location_on_rounded,
                                color: Colors.redAccent,
                                size: 44,
                              ),
                              Positioned(
                                top: 10,
                                child: Icon(
                                  Icons.sports_soccer,
                                  color: Colors.white,
                                  size: 14,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                // Floating GPS Locate Button on Map Overlay
                Positioned(
                  top: 12,
                  right: 12,
                  child: FloatingActionButton.small(
                    heroTag: 'map_gps_locate_btn',
                    backgroundColor: Colors.white,
                    elevation: 4,
                    onPressed: _isFetchingGps ? null : _getCurrentUserGpsLocation,
                    shape: const CircleBorder(),
                    child: _isFetchingGps
                        ? const SizedBox(
                            width: 14,
                            height: 14,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent),
                          )
                        : const Icon(Icons.my_location_rounded, color: AppColors.primaryBlack, size: 18),
                  ),
                ),

                // Selected Coordinates Badge Overlay
                Positioned(
                  bottom: 12,
                  left: 12,
                  right: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.8),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.my_location, color: Colors.amberAccent, size: 16),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Pin: ${_selectedGroundLocation.latitude.toStringAsFixed(4)}, ${_selectedGroundLocation.longitude.toStringAsFixed(4)} ($_selectedPlace)',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 11,
                              fontWeight: FontWeight.w500,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),

        // Action Buttons: Back & Complete Registration
        Row(
          children: [
            Expanded(
              flex: 1,
              child: OutlinedButton(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: () => setState(() => _currentStep = 1),
                child: const Text(
                  '← Back',
                  style: TextStyle(color: AppColors.primaryBlack, fontWeight: FontWeight.w600),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                text: 'Submit & Complete Setup 🎉',
                isLoading: _isLoading,
                onPressed: _handleCompleteProfile,
              ),
            ),
          ],
        ),
      ],
    );
  }

  // Helper Widget for Role Cards (Athlete vs Owner)
  Widget _buildRoleCard({
    required String role,
    required String label,
    required String subtitle,
  }) {
    final isSelected = _selectedRole == role;
    return GestureDetector(
      onTap: () => setState(() => _selectedRole = role),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryBlack : Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected ? AppColors.primaryBlack : AppColors.border,
            width: 1.5,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 8,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.bold,
                color: isSelected ? Colors.white : AppColors.primaryBlack,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: 10,
                color: isSelected ? Colors.white.withValues(alpha: 0.8) : AppColors.mutedText,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
