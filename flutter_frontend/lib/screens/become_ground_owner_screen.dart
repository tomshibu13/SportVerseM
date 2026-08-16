import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';

import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'registration_submitted_screen.dart';

class BecomeGroundOwnerScreen extends StatefulWidget {
  const BecomeGroundOwnerScreen({super.key});

  @override
  State<BecomeGroundOwnerScreen> createState() => _BecomeGroundOwnerScreenState();
}

class _BecomeGroundOwnerScreenState extends State<BecomeGroundOwnerScreen> {
  int _currentStep = 1; // Step 1 to 4

  // ── Step 1 Controllers ──
  final _groundNameController = TextEditingController(text: 'Smash Arena');
  final _courtCountController = TextEditingController(text: '3');
  final _descriptionController = TextEditingController(
    text: 'Premium indoor badminton court with AC, professional flooring and lighting.',
  );
  final List<String> _selectedGroundTypes = ['Badminton', 'Football'];

  // ── Step 2 Controllers ──
  final _addressController = TextEditingController(text: 'Kozhikode, Kerala');
  final _cityController = TextEditingController(text: 'Kozhikode');
  final _stateController = TextEditingController(text: 'Kerala');
  final _pinController = TextEditingController(text: '673001');
  final _latController = TextEditingController(text: '11.2588');
  final _lngController = TextEditingController(text: '75.7804');

  late MapController _mapController;
  LatLng _mapCenter = const LatLng(11.2588, 75.7804);
  bool _isFetchingGps = false;

  // ── Step 3 Controllers ──
  final _priceController = TextEditingController(text: '500');
  String _openingTime = '06:00 AM';
  String _closingTime = '11:00 PM';
  final List<String> _selectedFacilities = [
    'Parking',
    'Changing Room',
    'Washroom',
    'Lighting',
    'Wi-Fi',
  ];
  final List<String> _groundImages = [
    'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=400&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=400&q=80',
  ];

  bool _isSubmitting = false;

  final List<Map<String, dynamic>> _groundTypeOptions = [
    {'name': 'Badminton', 'icon': Icons.sports_tennis},
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Tennis', 'icon': Icons.sports_tennis},
    {'name': 'Volleyball', 'icon': Icons.sports_volleyball},
    {'name': 'Other', 'icon': Icons.more_horiz},
  ];

  final List<Map<String, dynamic>> _facilityOptions = [
    {'name': 'Parking', 'icon': Icons.local_parking},
    {'name': 'Changing Room', 'icon': Icons.checkroom},
    {'name': 'Washroom', 'icon': Icons.wc},
    {'name': 'Lighting', 'icon': Icons.lightbulb_outline},
    {'name': 'Drinking Water', 'icon': Icons.water_drop_outlined},
    {'name': 'Equipment Rental', 'icon': Icons.sports},
    {'name': 'Cafeteria', 'icon': Icons.coffee},
    {'name': 'Wi-Fi', 'icon': Icons.wifi},
    {'name': 'First Aid', 'icon': Icons.medical_services_outlined},
    {'name': 'Other', 'icon': Icons.more_horiz},
  ];

  final List<String> _timeOptions = [
    '05:00 AM',
    '06:00 AM',
    '07:00 AM',
    '08:00 AM',
    '09:00 AM',
    '10:00 PM',
    '11:00 PM',
    '12:00 AM',
  ];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _descriptionController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _groundNameController.dispose();
    _courtCountController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pinController.dispose();
    _latController.dispose();
    _lngController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  bool _isReverseGeocoding = false;

  // ── Reverse Geocoding & Map Location Auto-Fill ──
  Future<void> _reverseGeocodeAndFill(LatLng point) async {
    setState(() {
      _mapCenter = point;
      _latController.text = point.latitude.toStringAsFixed(4);
      _lngController.text = point.longitude.toStringAsFixed(4);
      _isReverseGeocoding = true;
    });

    try {
      _mapController.move(point, 15.0);
    } catch (_) {}

    try {
      final url = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse?format=json&lat=${point.latitude}&lon=${point.longitude}&addressdetails=1',
      );
      final response = await http.get(
        url,
        headers: {'User-Agent': 'SportVerseApp/1.0 (contact@sportverse.ai)'},
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final addressObj = data['address'] as Map<String, dynamic>?;

        if (addressObj != null) {
          final road = addressObj['road'] ?? addressObj['suburb'] ?? addressObj['neighbourhood'] ?? addressObj['pedestrian'] ?? '';
          final city = addressObj['city'] ?? addressObj['town'] ?? addressObj['village'] ?? addressObj['county'] ?? addressObj['state_district'] ?? '';
          final state = addressObj['state'] ?? '';
          final postcode = addressObj['postcode'] ?? '';
          final displayName = data['display_name'] as String? ?? '';

          setState(() {
            if (displayName.isNotEmpty) {
              _addressController.text = displayName.split(',').take(3).join(', ').trim();
            } else if (road.toString().isNotEmpty) {
              _addressController.text = road.toString();
            }
            if (city.toString().isNotEmpty) {
              _cityController.text = city.toString();
            }
            if (state.toString().isNotEmpty) {
              _stateController.text = state.toString();
            }
            if (postcode.toString().isNotEmpty) {
              _pinController.text = postcode.toString();
            }
            _isReverseGeocoding = false;
          });

          _showSnackBar('📍 Auto-filled location: ${_cityController.text}, ${_stateController.text}');
          return;
        }
      }
    } catch (e) {
      debugPrint('Reverse geocode error: $e');
    }

    _applyFallbackLocationInfo(point);
  }

  void _applyFallbackLocationInfo(LatLng point) {
    String fallbackAddress = 'Stadium Road, Near Sports Hub';
    String fallbackCity = 'Kozhikode';
    String fallbackState = 'Kerala';
    String fallbackPin = '673001';

    if ((point.latitude - 11.2588).abs() < 0.5 && (point.longitude - 75.7804).abs() < 0.5) {
      fallbackAddress = 'Mananchira Square, Beach Road';
      fallbackCity = 'Kozhikode';
      fallbackState = 'Kerala';
      fallbackPin = '673001';
    } else if ((point.latitude - 19.0760).abs() < 0.5 && (point.longitude - 72.8777).abs() < 0.5) {
      fallbackAddress = 'Marine Drive, Sector 4';
      fallbackCity = 'Mumbai';
      fallbackState = 'Maharashtra';
      fallbackPin = '400001';
    } else if ((point.latitude - 12.9716).abs() < 0.5 && (point.longitude - 77.5946).abs() < 0.5) {
      fallbackAddress = 'MG Road, Indiranagar';
      fallbackCity = 'Bangalore';
      fallbackState = 'Karnataka';
      fallbackPin = '560001';
    } else if ((point.latitude - 28.6139).abs() < 0.5 && (point.longitude - 77.2090).abs() < 0.5) {
      fallbackAddress = 'Connaught Place, Central Zone';
      fallbackCity = 'New Delhi';
      fallbackState = 'Delhi';
      fallbackPin = '110001';
    }

    setState(() {
      _addressController.text = fallbackAddress;
      _cityController.text = fallbackCity;
      _stateController.text = fallbackState;
      _pinController.text = fallbackPin;
      _isReverseGeocoding = false;
    });

    _showSnackBar('📍 Location coordinates set: ${point.latitude.toStringAsFixed(4)}, ${point.longitude.toStringAsFixed(4)}');
  }

  // ── Full Screen Map Picker Modal ──
  void _openFullMapPicker() {
    LatLng tempSelectedPoint = _mapCenter;
    final MapController modalMapController = MapController();
    final TextEditingController searchController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (modalCtx, modalSetState) {
            return Container(
              height: MediaQuery.of(context).size.height * 0.85,
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: Column(
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 5,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: Colors.grey[300],
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),

                  // Header title
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Select Location on Map',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(modalCtx),
                        ),
                      ],
                    ),
                  ),

                  // Search Bar
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                    child: TextField(
                      controller: searchController,
                      decoration: InputDecoration(
                        hintText: 'Search city or place (e.g. Kozhikode, Bangalore)...',
                        prefixIcon: const Icon(Icons.search, color: Color(0xFFFF6B00)),
                        suffixIcon: IconButton(
                          icon: const Icon(Icons.send_rounded, color: Color(0xFFFF6B00)),
                          onPressed: () async {
                            final query = searchController.text.trim();
                            if (query.isNotEmpty) {
                              try {
                                final url = Uri.parse(
                                  'https://nominatim.openstreetmap.org/search?format=json&q=${Uri.encodeComponent(query)}',
                                );
                                final res = await http.get(
                                  url,
                                  headers: {'User-Agent': 'SportVerseApp/1.0'},
                                );
                                if (res.statusCode == 200) {
                                  final data = jsonDecode(res.body) as List;
                                  if (data.isNotEmpty) {
                                    final lat = double.parse(data[0]['lat']);
                                    final lon = double.parse(data[0]['lon']);
                                    final newPt = LatLng(lat, lon);
                                    modalSetState(() {
                                      tempSelectedPoint = newPt;
                                    });
                                    modalMapController.move(newPt, 14.0);
                                  }
                                }
                              } catch (_) {}
                            }
                          },
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                    ),
                  ),

                  // Interactive Map
                  Expanded(
                    child: Stack(
                      children: [
                        FlutterMap(
                          mapController: modalMapController,
                          options: MapOptions(
                            initialCenter: tempSelectedPoint,
                            initialZoom: 14.0,
                            onTap: (tapPos, point) {
                              modalSetState(() {
                                tempSelectedPoint = point;
                              });
                            },
                          ),
                          children: [
                            TileLayer(
                              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                              userAgentPackageName: 'com.sportverse.app',
                            ),
                            MarkerLayer(
                              markers: [
                                Marker(
                                  point: tempSelectedPoint,
                                  width: 48,
                                  height: 48,
                                  child: const Icon(
                                    Icons.location_on,
                                    size: 48,
                                    color: Color(0xFFEF4444),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),

                        Positioned(
                          top: 12,
                          left: 20,
                          right: 20,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.75),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              '📍 Tap map to position marker: ${tempSelectedPoint.latitude.toStringAsFixed(4)}, ${tempSelectedPoint.longitude.toStringAsFixed(4)}',
                              style: const TextStyle(fontSize: 12, color: Colors.white),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Confirm Button
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF111111),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        onPressed: () {
                          Navigator.pop(modalCtx);
                          _reverseGeocodeAndFill(tempSelectedPoint);
                        },
                        child: const Text(
                          'Confirm Selected Location',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  // ── GPS Geolocation Action ──
  Future<void> _fetchCurrentLocation() async {
    setState(() => _isFetchingGps = true);
    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        _setFallbackGps();
        return;
      }
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          _setFallbackGps();
          return;
        }
      }
      if (permission == LocationPermission.deniedForever) {
        _setFallbackGps();
        return;
      }
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 8),
      );
      final newPoint = LatLng(position.latitude, position.longitude);
      setState(() => _isFetchingGps = false);
      _reverseGeocodeAndFill(newPoint);
    } catch (e) {
      _setFallbackGps();
    }
  }

  void _setFallbackGps() {
    const fallback = LatLng(11.2588, 75.7804);
    setState(() => _isFetchingGps = false);
    _reverseGeocodeAndFill(fallback);
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: const Color(0xFF111111),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  void _onNextStep() {
    if (_currentStep == 1) {
      if (_groundNameController.text.trim().isEmpty) {
        _showSnackBar('Please enter your ground name');
        return;
      }
      if (_selectedGroundTypes.isEmpty) {
        _showSnackBar('Please select at least one ground type');
        return;
      }
      setState(() => _currentStep = 2);
    } else if (_currentStep == 2) {
      if (_addressController.text.trim().isEmpty) {
        _showSnackBar('Please enter complete address');
        return;
      }
      setState(() => _currentStep = 3);
    } else if (_currentStep == 3) {
      if (_priceController.text.trim().isEmpty) {
        _showSnackBar('Please enter price per hour');
        return;
      }
      setState(() => _currentStep = 4);
    } else if (_currentStep == 4) {
      _submitGroundRegistration();
    }
  }

  Future<void> _submitGroundRegistration() async {
    setState(() => _isSubmitting = true);

    try {
      final user = AuthService.currentUser;
      final payload = {
        'title': _groundNameController.text.trim(),
        'sport_type': _selectedGroundTypes.isNotEmpty ? _selectedGroundTypes.first : 'Badminton',
        'location': '${_cityController.text.trim()}, ${_stateController.text.trim()}',
        'address': _addressController.text.trim(),
        'price_per_hour': double.tryParse(_priceController.text.trim()) ?? 500,
        'facilities': _selectedFacilities,
        'images': _groundImages,
        'owner_id': user?['id'] ?? 2,
        'description': _descriptionController.text.trim(),
        'court_count': _courtCountController.text.trim(),
        'latitude': _latController.text.trim(),
        'longitude': _lngController.text.trim(),
        'opening_time': _openingTime,
        'closing_time': _closingTime,
      };

      await ApiService.createGround(payload);
      
      // Fetch latest profile to sync the role change in memory (from User to GroundOwner)
      await AuthService.getMe();
    } catch (e) {
      debugPrint('Ground creation error: $e');
    }

    if (mounted) {
      setState(() => _isSubmitting = false);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const RegistrationSubmittedScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final isDesktopOrWeb = media.size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: Color(0xFF222222)),
          onPressed: () {
            if (_currentStep > 1) {
              setState(() => _currentStep--);
            } else {
              Navigator.maybePop(context);
            }
          },
        ),
        title: const Text(
          'Ground Owner Registration',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Color(0xFF111111),
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: isDesktopOrWeb ? 500 : double.infinity,
            ),
            child: Column(
              children: [
                // ── Stepper Header Bar ──
                _buildStepperProgressHeader(),

                // ── Form Scrollable Area ──
                Expanded(
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_currentStep == 1) _buildStep1GroundInfo(),
                        if (_currentStep == 2) _buildStep2Location(),
                        if (_currentStep == 3) _buildStep3FacilitiesPricing(),
                        if (_currentStep == 4) _buildStep4ReviewDetails(),
                      ],
                    ),
                  ),
                ),

                // ── Bottom Action Button Bar ──
                _buildBottomActionBar(),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Stepper Progress Header ──
  Widget _buildStepperProgressHeader() {
    final steps = [
      {'number': 1, 'label': 'Ground Info'},
      {'number': 2, 'label': 'Location'},
      {'number': 3, 'label': 'Facilities'},
      {'number': 4, 'label': 'Review'},
    ];

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Colors.black.withOpacity(0.06))),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(steps.length, (index) {
          final stepNum = steps[index]['number'] as int;
          final stepLabel = steps[index]['label'] as String;
          final isDone = stepNum < _currentStep;
          final isActive = stepNum == _currentStep;

          return Expanded(
            child: Row(
              children: [
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: (isDone || isActive)
                            ? const Color(0xFFFF6B00)
                            : const Color(0xFFE5E5E5),
                      ),
                      child: Center(
                        child: isDone
                            ? const Icon(Icons.check, size: 16, color: Colors.white)
                            : Text(
                                '$stepNum',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.bold,
                                  color: (isDone || isActive) ? Colors.white : Colors.black45,
                                ),
                              ),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      stepLabel,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: (isActive || isDone) ? FontWeight.bold : FontWeight.normal,
                        color: (isActive || isDone) ? const Color(0xFFFF6B00) : Colors.black45,
                      ),
                    ),
                  ],
                ),
                if (index < steps.length - 1)
                  Expanded(
                    child: Container(
                      height: 2,
                      margin: const EdgeInsets.only(bottom: 16, left: 4, right: 4),
                      color: isDone ? const Color(0xFFFF6B00) : const Color(0xFFE5E5E5),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ── STEP 1: Ground Info ──
  Widget _buildStep1GroundInfo() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ground Information',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
        ),
        const SizedBox(height: 4),
        const Text(
          'Tell us about your sports ground',
          style: TextStyle(fontSize: 13, color: Color(0xFF666666)),
        ),
        const SizedBox(height: 24),

        // Ground Name
        _buildSectionLabel('Ground Name'),
        _buildTextField(
          controller: _groundNameController,
          hint: 'Enter ground name',
          prefixIcon: Icons.domain_outlined,
        ),
        const SizedBox(height: 20),

        // Ground Type Multi-Select
        _buildSectionLabel('Ground Type (Select all that apply)'),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 3.2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _groundTypeOptions.length,
          itemBuilder: (context, index) {
            final item = _groundTypeOptions[index];
            final name = item['name'] as String;
            final icon = item['icon'] as IconData;
            final isSelected = _selectedGroundTypes.contains(name);

            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedGroundTypes.remove(name);
                  } else {
                    _selectedGroundTypes.add(name);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFFFF3E0) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? const Color(0xFFFF6B00) : const Color(0xFFE5E5E5),
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(icon, size: 18, color: isSelected ? const Color(0xFFFF6B00) : Colors.black54),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? const Color(0xFFFF6B00) : const Color(0xFF333333),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isSelected)
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFFF6B00),
                        ),
                        child: const Icon(Icons.check, size: 10, color: Colors.white),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 20),

        // Number of Courts
        _buildSectionLabel('Number of Courts / Grounds'),
        _buildTextField(
          controller: _courtCountController,
          hint: 'Enter number',
          prefixIcon: Icons.grid_view_rounded,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 20),

        // Description with Counter
        _buildSectionLabel('Description'),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: const Color(0xFFE5E5E5)),
          ),
          child: Column(
            children: [
              TextField(
                controller: _descriptionController,
                maxLines: 4,
                maxLength: 300,
                buildCounter: (context, {required currentLength, required isFocused, maxLength}) => null,
                style: const TextStyle(fontSize: 13, color: Color(0xFF111111)),
                decoration: const InputDecoration(
                  hintText: 'Tell users about your ground, facilities and special features...',
                  border: InputBorder.none,
                  enabledBorder: InputBorder.none,
                  focusedBorder: InputBorder.none,
                  contentPadding: EdgeInsets.all(14),
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(right: 12, bottom: 8),
                child: Align(
                  alignment: Alignment.bottomRight,
                  child: Text(
                    '${_descriptionController.text.length}/300',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF888888)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ── STEP 2: Location ──
  Widget _buildStep2Location() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Location',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
        ),
        const SizedBox(height: 4),
        const Text(
          'Where is your ground located?',
          style: TextStyle(fontSize: 13, color: Color(0xFF666666)),
        ),
        const SizedBox(height: 24),

        // Address
        _buildSectionLabel('Address'),
        _buildTextField(
          controller: _addressController,
          hint: 'Enter complete address',
          prefixIcon: Icons.location_on_outlined,
        ),
        const SizedBox(height: 16),

        // City & State Side-by-Side
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('City'),
                  _buildTextField(
                    controller: _cityController,
                    hint: 'Enter city',
                    prefixIcon: Icons.location_city_outlined,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('State'),
                  _buildTextField(
                    controller: _stateController,
                    hint: 'Enter state',
                    prefixIcon: Icons.map_outlined,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // PIN Code
        _buildSectionLabel('PIN Code'),
        _buildTextField(
          controller: _pinController,
          hint: 'Enter PIN code',
          prefixIcon: Icons.markunread_mailbox_outlined,
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 20),

        // Map Preview Section
        _buildSectionLabel('Locate your ground'),
        const SizedBox(height: 8),
        Container(
          height: 180,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE5E5E5)),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                FlutterMap(
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: _mapCenter,
                    initialZoom: 14.0,
                    onTap: (tapPos, point) => _reverseGeocodeAndFill(point),
                  ),
                  children: [
                    TileLayer(
                      urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'com.sportverse.app',
                    ),
                    MarkerLayer(
                      markers: [
                        Marker(
                          point: _mapCenter,
                          width: 40,
                          height: 40,
                          child: const Icon(
                            Icons.location_on,
                            size: 40,
                            color: Color(0xFFEF4444),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),

                // Overlay Select on Map button
                Positioned(
                  bottom: 12,
                  right: 12,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black87,
                      elevation: 3,
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                    ),
                    onPressed: _openFullMapPicker,
                    icon: const Icon(Icons.center_focus_strong, size: 16, color: Color(0xFFFF6B00)),
                    label: const Text('Select on Map', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                  ),
                ),

                if (_isReverseGeocoding)
                  Positioned.fill(
                    child: Container(
                      color: Colors.black26,
                      child: const Center(
                        child: CircularProgressIndicator(color: Color(0xFFFF6B00)),
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Use Current Location Button
        SizedBox(
          width: double.infinity,
          height: 46,
          child: OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: Color(0xFFFF6B00)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: _isFetchingGps ? null : _fetchCurrentLocation,
            icon: _isFetchingGps
                ? const SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFFF6B00)),
                  )
                : const Icon(Icons.my_location, size: 18, color: Color(0xFFFF6B00)),
            label: const Text(
              'Use Current Location',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFFF6B00)),
            ),
          ),
        ),
        const SizedBox(height: 16),

        // Latitude & Longitude Side-by-Side
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Latitude'),
                  _buildTextField(
                    controller: _latController,
                    hint: '11.2588',
                    prefixIcon: Icons.location_searching,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Longitude'),
                  _buildTextField(
                    controller: _lngController,
                    hint: '75.7804',
                    prefixIcon: Icons.location_searching,
                  ),
                ],
              ),
            ),
          ],
        ),
      ],
    );
  }

  // ── STEP 3: Facilities & Pricing ──
  Widget _buildStep3FacilitiesPricing() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Facilities & Pricing',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
        ),
        const SizedBox(height: 4),
        const Text(
          'Set your pricing and add facilities',
          style: TextStyle(fontSize: 13, color: Color(0xFF666666)),
        ),
        const SizedBox(height: 24),

        // Price per Hour
        _buildSectionLabel('Price per Hour'),
        _buildTextField(
          controller: _priceController,
          hint: 'Enter price per hour',
          prefixText: '₹  ',
          keyboardType: TextInputType.number,
        ),
        const SizedBox(height: 16),

        // Opening & Closing Times Side-by-Side
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Opening Time'),
                  _buildDropdownField(
                    value: _openingTime,
                    items: _timeOptions,
                    onChanged: (val) => setState(() => _openingTime = val!),
                    icon: Icons.access_time,
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildSectionLabel('Closing Time'),
                  _buildDropdownField(
                    value: _closingTime,
                    items: _timeOptions,
                    onChanged: (val) => setState(() => _closingTime = val!),
                    icon: Icons.access_time,
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),

        // Facilities Multi-Select Grid
        _buildSectionLabel('Facilities (Select all that apply)'),
        const SizedBox(height: 8),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            childAspectRatio: 3.2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
          ),
          itemCount: _facilityOptions.length,
          itemBuilder: (context, index) {
            final item = _facilityOptions[index];
            final name = item['name'] as String;
            final icon = item['icon'] as IconData;
            final isSelected = _selectedFacilities.contains(name);

            return GestureDetector(
              onTap: () {
                setState(() {
                  if (isSelected) {
                    _selectedFacilities.remove(name);
                  } else {
                    _selectedFacilities.add(name);
                  }
                });
              },
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: isSelected ? const Color(0xFFFFF3E0) : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? const Color(0xFFFF6B00) : const Color(0xFFE5E5E5),
                    width: isSelected ? 1.5 : 1,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(icon, size: 16, color: isSelected ? const Color(0xFFFF6B00) : Colors.black54),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        name,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          color: isSelected ? const Color(0xFFFF6B00) : const Color(0xFF333333),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (isSelected)
                      Container(
                        padding: const EdgeInsets.all(2),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Color(0xFFFF6B00),
                        ),
                        child: const Icon(Icons.check, size: 10, color: Colors.white),
                      ),
                  ],
                ),
              ),
            );
          },
        ),
        const SizedBox(height: 20),

        // Ground Images (Min 3 required)
        _buildSectionLabel('Ground Images (Min 3 required)'),
        const SizedBox(height: 8),
        SizedBox(
          height: 100,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: _groundImages.length + 1,
            itemBuilder: (context, index) {
              if (index == _groundImages.length) {
                // Add More Tile
                return GestureDetector(
                  onTap: () {
                    setState(() {
                      _groundImages.add(
                        'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=400&q=80',
                      );
                    });
                  },
                  child: Container(
                    width: 90,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFCCCCCC), style: BorderStyle.solid),
                    ),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: const [
                        Icon(Icons.add, size: 24, color: Colors.black54),
                        SizedBox(height: 4),
                        Text('Add More', style: TextStyle(fontSize: 11, color: Colors.black54)),
                      ],
                    ),
                  ),
                );
              }

              final url = _groundImages[index];
              return Stack(
                children: [
                  Container(
                    width: 90,
                    margin: const EdgeInsets.only(right: 12),
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(12),
                      image: DecorationImage(
                        image: NetworkImage(url),
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                  Positioned(
                    top: 4,
                    right: 16,
                    child: GestureDetector(
                      onTap: () {
                        setState(() => _groundImages.removeAt(index));
                      },
                      child: Container(
                        padding: const EdgeInsets.all(3),
                        decoration: const BoxDecoration(
                          shape: BoxShape.circle,
                          color: Colors.black54,
                        ),
                        child: const Icon(Icons.close, size: 12, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  // ── STEP 4: Review Your Details ──
  Widget _buildStep4ReviewDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Review Your Details',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
        ),
        const SizedBox(height: 4),
        const Text(
          'Please review your information before submitting',
          style: TextStyle(fontSize: 13, color: Color(0xFF666666)),
        ),
        const SizedBox(height: 24),

        // Summary Card 1: Ground Info
        _buildReviewCard(
          title: 'Ground Information',
          onEdit: () => setState(() => _currentStep = 1),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _groundNameController.text.trim().isEmpty ? 'Smash Arena' : _groundNameController.text.trim(),
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
              ),
              const SizedBox(height: 4),
              Text(
                '${_selectedGroundTypes.join(', ')} • ${_courtCountController.text.trim()} Courts',
                style: const TextStyle(fontSize: 12, color: Color(0xFF555555)),
              ),
              const SizedBox(height: 4),
              Text(
                _descriptionController.text.trim(),
                style: const TextStyle(fontSize: 12, color: Color(0xFF777777)),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Summary Card 2: Location
        _buildReviewCard(
          title: 'Location',
          onEdit: () => setState(() => _currentStep = 2),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '${_addressController.text.trim()}, ${_cityController.text.trim()}, ${_stateController.text.trim()} - ${_pinController.text.trim()}',
                style: const TextStyle(fontSize: 13, color: Color(0xFF333333)),
              ),
              const SizedBox(height: 4),
              Text(
                '${_latController.text.trim()}, ${_lngController.text.trim()}',
                style: const TextStyle(fontSize: 12, color: Color(0xFF777777)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Summary Card 3: Facilities & Pricing
        _buildReviewCard(
          title: 'Facilities & Pricing',
          onEdit: () => setState(() => _currentStep = 3),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '₹ ${_priceController.text.trim()} / hour   •   $_openingTime - $_closingTime',
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: Color(0xFFFF6B00)),
              ),
              const SizedBox(height: 6),
              Text(
                _selectedFacilities.join(', '),
                style: const TextStyle(fontSize: 12, color: Color(0xFF555555)),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildReviewCard({
    required String title,
    required VoidCallback onEdit,
    required Widget child,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFEEEEEE)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF111111)),
              ),
              GestureDetector(
                onTap: onEdit,
                child: Row(
                  children: const [
                    Icon(Icons.edit_outlined, size: 14, color: Color(0xFFFF6B00)),
                    SizedBox(width: 4),
                    Text(
                      'Edit',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFFFF6B00)),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          child,
        ],
      ),
    );
  }

  // ── Bottom Action Bar ──
  Widget _buildBottomActionBar() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF111111),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              onPressed: _isSubmitting ? null : _onNextStep,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          _currentStep == 4 ? 'Submit for Review' : 'Continue',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white),
                        ),
                        const SizedBox(width: 8),
                        const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
                      ],
                    ),
            ),
          ),
          if (_currentStep == 4) ...[
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: const [
                Icon(Icons.shield_outlined, size: 14, color: Color(0xFF888888)),
                SizedBox(width: 6),
                Text(
                  'Your details are secure and will be reviewed by our team.',
                  style: TextStyle(fontSize: 11, color: Color(0xFF888888)),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  // ── Helper Form Widgets ──
  Widget _buildSectionLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Text(
        text,
        style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF333333)),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    IconData? prefixIcon,
    String? prefixText,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E5E5)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(fontSize: 13, color: Color(0xFF111111)),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 18, color: Colors.black54) : null,
          prefixText: prefixText,
          prefixStyle: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFFF6B00)),
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        ),
      ),
    );
  }

  Widget _buildDropdownField({
    required String value,
    required List<String> items,
    required ValueChanged<String?> onChanged,
    required IconData icon,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0xFFE5E5E5)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          icon: const Icon(Icons.keyboard_arrow_down, color: Colors.black54),
          isExpanded: true,
          style: const TextStyle(fontSize: 13, color: Color(0xFF111111)),
          items: items.map((t) {
            return DropdownMenuItem<String>(
              value: t,
              child: Row(
                children: [
                  Icon(icon, size: 16, color: Colors.black54),
                  const SizedBox(width: 8),
                  Text(t),
                ],
              ),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }
}
