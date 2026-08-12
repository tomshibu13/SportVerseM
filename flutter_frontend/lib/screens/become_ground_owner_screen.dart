import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import '../theme/app_theme.dart';

class BecomeGroundOwnerScreen extends StatefulWidget {
  const BecomeGroundOwnerScreen({super.key});

  @override
  State<BecomeGroundOwnerScreen> createState() => _BecomeGroundOwnerScreenState();
}

class _BecomeGroundOwnerScreenState extends State<BecomeGroundOwnerScreen> {
  // Step state: 1 (Ground Details) -> 2 (Location) -> 3 (Pricing & Facilities) -> 4 (Success)
  int _currentStep = 1;

  // Step 1 Controllers & State (Ground Information)
  final _groundNameController = TextEditingController();
  final _courtsController = TextEditingController(text: '2');
  final _descriptionController = TextEditingController();
  final List<String> _selectedSports = ['Football', 'Badminton'];

  // Step 2 Controllers & State (Location & Map)
  final _addressController = TextEditingController();
  final _cityController = TextEditingController();
  final _stateController = TextEditingController();
  final _pincodeController = TextEditingController();
  late TextEditingController _latController;
  late TextEditingController _lngController;

  late MapController _mapController;
  LatLng _selectedLocation = const LatLng(11.2588, 75.7804); // Kozhikode, India default
  bool _isFetchingGps = false;

  // Step 3 Controllers & State (Pricing & Facilities)
  final _priceController = TextEditingController(text: '800');
  String _openingTime = '06:00 AM';
  String _closingTime = '11:00 PM';
  final List<String> _selectedFacilities = [
    'Parking',
    'Changing Room',
    'Washroom',
    'Lighting',
    'Wi-Fi'
  ];

  final List<String> _sportsList = [
    'Football',
    'Badminton',
    'Cricket',
    'Basketball',
    'Tennis',
    'Volleyball',
    'Hockey',
    'Other'
  ];

  final List<String> _facilitiesList = [
    'Parking',
    'Changing Room',
    'Washroom',
    'Lighting',
    'Drinking Water',
    'Equipment Rental',
    'Cafeteria',
    'Wi-Fi',
    'First Aid'
  ];

  @override
  void initState() {
    super.initState();
    _mapController = MapController();
    _latController = TextEditingController(text: _selectedLocation.latitude.toStringAsFixed(4));
    _lngController = TextEditingController(text: _selectedLocation.longitude.toStringAsFixed(4));
  }

  @override
  void dispose() {
    _groundNameController.dispose();
    _courtsController.dispose();
    _descriptionController.dispose();
    _addressController.dispose();
    _cityController.dispose();
    _stateController.dispose();
    _pincodeController.dispose();
    _latController.dispose();
    _lngController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  // ── Live Geolocation Fetcher ──
  Future<void> _getCurrentGpsLocation() async {
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

      final newPoint = LatLng(position.latitude, position.longitude);
      _updateLocation(newPoint);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('📍 Live GPS position detected: ${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}'),
            backgroundColor: AppColors.warmAccent,
          ),
        );
      }
    } catch (e) {
      _fallbackGpsLocation();
    } finally {
      if (mounted) setState(() => _isFetchingGps = false);
    }
  }

  void _fallbackGpsLocation() {
    const fallback = LatLng(11.2588, 75.7804);
    _updateLocation(fallback);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('📍 Ground location set on map (11.2588, 75.7804)')),
      );
    }
  }

  void _updateLocation(LatLng point) {
    setState(() {
      _selectedLocation = point;
      _latController.text = point.latitude.toStringAsFixed(4);
      _lngController.text = point.longitude.toStringAsFixed(4);
      if (_cityController.text.isEmpty) _cityController.text = 'Kozhikode';
      if (_stateController.text.isEmpty) _stateController.text = 'Kerala';
      if (_addressController.text.isEmpty) _addressController.text = 'Station Sports Arena, Main Road';
    });
    _mapController.move(point, 15.0);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.primaryBlack),
          onPressed: () {
            if (_currentStep > 1 && _currentStep < 4) {
              setState(() => _currentStep--);
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: const Text(
          'Become a Ground Owner',
          style: TextStyle(
            color: AppColors.primaryBlack,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SafeArea(
        child: Column(
          children: [
            if (_currentStep <= 3) _buildStepperHeader(),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(20),
                child: _buildCurrentStepView(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Stepper Header (3 Steps) ──
  Widget _buildStepperHeader() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: AppColors.border)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _buildStepItem(1, 'Ground Details'),
          _buildStepLine(1),
          _buildStepItem(2, 'Location'),
          _buildStepLine(2),
          _buildStepItem(3, 'Pricing & Facilities'),
        ],
      ),
    );
  }

  Widget _buildStepItem(int stepNum, String label) {
    final isActive = _currentStep == stepNum;
    final isDone = _currentStep > stepNum;
    return Column(
      children: [
        Container(
          width: 28,
          height: 28,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: (isActive || isDone) ? AppColors.warmAccent : Colors.transparent,
            border: Border.all(
              color: (isActive || isDone) ? AppColors.warmAccent : AppColors.border,
              width: 2,
            ),
          ),
          child: Center(
            child: isDone
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : Text(
                    '$stepNum',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: isActive ? Colors.white : AppColors.mutedText,
                    ),
                  ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: isActive ? FontWeight.bold : FontWeight.w500,
            color: (isActive || isDone) ? AppColors.warmAccent : AppColors.mutedText,
          ),
        ),
      ],
    );
  }

  Widget _buildStepLine(int afterStep) {
    final isDone = _currentStep > afterStep;
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14),
        color: isDone ? AppColors.warmAccent : AppColors.border,
      ),
    );
  }

  Widget _buildCurrentStepView() {
    switch (_currentStep) {
      case 1:
        return _buildStep1GroundDetails();
      case 2:
        return _buildStep2Location();
      case 3:
        return _buildStep3PricingFacilities();
      case 4:
        return _buildStep4Success();
      default:
        return _buildStep1GroundDetails();
    }
  }

  // ── Step 1: Ground Details ──
  Widget _buildStep1GroundDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Ground Information 🏟️',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 4),
        const Text(
          'Provide details about your sports facility and court availability.',
          style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
        ),
        const SizedBox(height: 16),
        _buildTextField('Ground Name', _groundNameController, 'e.g. Apex Thunder Box Cricket', Icons.stadium_outlined),
        const SizedBox(height: 16),
        const Text('Ground Type (Select all that apply)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _sportsList.map((sport) {
            final isSelected = _selectedSports.contains(sport);
            return ChoiceChip(
              label: Text(sport),
              selected: isSelected,
              selectedColor: AppColors.lightDecorAccent,
              backgroundColor: Colors.white,
              side: BorderSide(color: isSelected ? AppColors.warmAccent : AppColors.border),
              labelStyle: TextStyle(
                color: isSelected ? AppColors.warmAccent : AppColors.primaryBlack,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
        _buildTextField('Number of Courts / Grounds', _courtsController, 'Enter number of courts', Icons.numbers),
        const SizedBox(height: 16),
        const Text('Description', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 6),
        TextField(
          controller: _descriptionController,
          maxLines: 4,
          maxLength: 300,
          decoration: InputDecoration(
            hintText: 'Tell users about your ground, facilities and special features...',
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
          ),
        ),
        const SizedBox(height: 24),
        _buildPrimaryButton('Continue to Location →', () => setState(() => _currentStep = 2)),
      ],
    );
  }

  // ── Step 2: Location with OpenStreetMap & Live Geolocation ──
  Widget _buildStep2Location() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Location Details 📍', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 16),
        _buildTextField('Address', _addressController, 'Enter complete ground address', Icons.location_on_outlined),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _buildTextField('City', _cityController, 'Enter city', Icons.location_city)),
            const SizedBox(width: 12),
            Expanded(child: _buildTextField('State', _stateController, 'Enter state', Icons.map_outlined)),
          ],
        ),
        const SizedBox(height: 14),
        _buildTextField('PIN Code', _pincodeController, 'Enter PIN code', Icons.tag),
        const SizedBox(height: 16),
        const Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text('Locate ground on Map 📍', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
            Text('Tap map to set pin', style: TextStyle(fontSize: 11, fontStyle: FontStyle.italic, color: AppColors.mutedText)),
          ],
        ),
        const SizedBox(height: 8),

        // OpenStreetMap Container
        Container(
          height: 220,
          width: double.infinity,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border, width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.06),
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
                    initialCenter: _selectedLocation,
                    initialZoom: 15.0,
                    onTap: (tapPosition, point) {
                      _updateLocation(point);
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
                          point: _selectedLocation,
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
                Positioned(
                  bottom: 10,
                  left: 10,
                  right: 10,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black.withValues(alpha: 0.75),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.my_location, color: AppColors.warmAccent, size: 14),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            'Pin: ${_selectedLocation.latitude.toStringAsFixed(4)}, ${_selectedLocation.longitude.toStringAsFixed(4)}',
                            style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
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
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isFetchingGps ? null : _getCurrentGpsLocation,
                icon: _isFetchingGps
                    ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent))
                    : const Icon(Icons.my_location, size: 16, color: AppColors.warmAccent),
                label: Text(_isFetchingGps ? 'Locating...' : 'Use Current Location', style: const TextStyle(color: AppColors.warmAccent, fontSize: 12)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.warmAccent)),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () {
                  _updateLocation(_selectedLocation);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Tap anywhere on the map to set ground location pin.')),
                  );
                },
                icon: const Icon(Icons.map, size: 16, color: AppColors.primaryBlack),
                label: const Text('Select on Map', style: TextStyle(color: AppColors.primaryBlack, fontSize: 12)),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(child: _buildTextField('Latitude', _latController, '', Icons.navigation, readOnly: true)),
            const SizedBox(width: 12),
            Expanded(child: _buildTextField('Longitude', _lngController, '', Icons.navigation, readOnly: true)),
          ],
        ),
        const SizedBox(height: 24),
        _buildPrimaryButton('Continue to Pricing & Facilities →', () => setState(() => _currentStep = 3)),
      ],
    );
  }

  // ── Step 3: Pricing & Facilities ──
  Widget _buildStep3PricingFacilities() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Pricing & Facilities 🏷️', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 16),
        _buildTextField('Price per Hour (\$/hr)', _priceController, 'Enter price per hour', Icons.attach_money),
        const SizedBox(height: 14),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Opening Time', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _openingTime,
                    items: ['05:00 AM', '06:00 AM', '07:00 AM']
                        .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (val) => setState(() => _openingTime = val!),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Closing Time', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                  const SizedBox(height: 6),
                  DropdownButtonFormField<String>(
                    initialValue: _closingTime,
                    items: ['10:00 PM', '11:00 PM', '12:00 AM']
                        .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                        .toList(),
                    onChanged: (val) => setState(() => _closingTime = val!),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text('Facilities (Select all that apply)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 10),
        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: _facilitiesList.map((facility) {
            final isSelected = _selectedFacilities.contains(facility);
            return ChoiceChip(
              label: Text(facility),
              selected: isSelected,
              selectedColor: AppColors.lightDecorAccent,
              backgroundColor: Colors.white,
              side: BorderSide(color: isSelected ? AppColors.warmAccent : AppColors.border),
              labelStyle: TextStyle(
                color: isSelected ? AppColors.warmAccent : AppColors.primaryBlack,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
              onSelected: (selected) {
                setState(() {
                  if (selected) {
                    _selectedFacilities.add(facility);
                  } else {
                    _selectedFacilities.remove(facility);
                  }
                });
              },
            );
          }).toList(),
        ),
        const SizedBox(height: 24),
        _buildPrimaryButton('Submit Ground for Review 🎉', () => setState(() => _currentStep = 4)),
      ],
    );
  }

  // ── Step 4: Success Screen ──
  Widget _buildStep4Success() {
    return Column(
      children: [
        const SizedBox(height: 20),
        Container(
          width: 80,
          height: 80,
          decoration: const BoxDecoration(
            shape: BoxShape.circle,
            color: AppColors.warmAccent,
          ),
          child: const Icon(Icons.check, size: 48, color: Colors.white),
        ),
        const SizedBox(height: 20),
        const Text(
          'Registration Submitted!',
          style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 6),
        const Text(
          'Thank you for registering with SportVerse AI.',
          style: TextStyle(fontSize: 14, color: AppColors.secondaryText),
        ),
        const SizedBox(height: 24),
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
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.lightDecorAccent,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: const Text('⏳ Under Review', style: TextStyle(color: AppColors.warmAccent, fontWeight: FontWeight.bold, fontSize: 12)),
              ),
              const SizedBox(height: 12),
              const Text(
                'Your registration has been submitted successfully. Our team will review your details and documents.',
                style: TextStyle(fontSize: 14, color: AppColors.primaryBlack),
              ),
              const SizedBox(height: 6),
              const Text(
                'We will notify you once your ground is approved.',
                style: TextStyle(fontSize: 13, color: AppColors.secondaryText),
              ),
            ],
          ),
        ),
        const SizedBox(height: 32),
        _buildPrimaryButton('Go to Dashboard', () => Navigator.pop(context)),
      ],
    );
  }

  Widget _buildTextField(
    String label,
    TextEditingController controller,
    String hint,
    IconData icon, {
    bool isPassword = false,
    String? prefixText,
    bool readOnly = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
        const SizedBox(height: 6),
        TextField(
          controller: controller,
          obscureText: isPassword,
          readOnly: readOnly,
          decoration: InputDecoration(
            hintText: hint,
            prefixIcon: Icon(icon, size: 20, color: AppColors.mutedText),
            prefixText: prefixText,
            fillColor: Colors.white,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
          ),
        ),
      ],
    );
  }

  Widget _buildPrimaryButton(String text, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: Container(
        decoration: BoxDecoration(
          gradient: AppColors.goldGradient,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
              color: AppColors.warmAccent.withValues(alpha: 0.3),
              blurRadius: 8,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          ),
          onPressed: onPressed,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(text, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
              const SizedBox(width: 6),
              const Icon(Icons.arrow_forward, size: 18, color: Colors.white),
            ],
          ),
        ),
      ),
    );
  }
}
