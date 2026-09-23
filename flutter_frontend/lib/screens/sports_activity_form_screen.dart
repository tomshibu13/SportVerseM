import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/fitness_provider.dart';
import '../models/fitness_model.dart';
import '../theme/app_theme.dart';

class SportsActivityFormScreen extends StatefulWidget {
  final SportsActivity? activity;

  const SportsActivityFormScreen({super.key, this.activity});

  @override
  State<SportsActivityFormScreen> createState() => _SportsActivityFormScreenState();
}

class _SportsActivityFormScreenState extends State<SportsActivityFormScreen> {
  final _formKey = GlobalKey<FormState>();
  
  final List<String> _sportsCategories = [
    "Football", "Basketball", "Tennis", "Badminton", "Cricket", "Volleyball", "Other"
  ];
  final List<String> _intensityLevels = ["Low", "Moderate", "High", "Vigorous"];

  String? _selectedSport;
  String? _selectedIntensity;
  DateTime _selectedDate = DateTime.now();

  final _durationController = TextEditingController();
  final _caloriesController = TextEditingController();
  final _distanceController = TextEditingController();
  final _notesController = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.activity != null) {
      final act = widget.activity!;
      _selectedSport = _sportsCategories.contains(act.sportId) ? act.sportId : "Other";
      _selectedIntensity = _intensityLevels.contains(act.intensity) ? act.intensity : null;
      _selectedDate = act.activityDate;
      _durationController.text = act.duration > 0 ? act.duration.toString() : '';
      _caloriesController.text = act.calories > 0 ? act.calories.toStringAsFixed(0) : '';
      _distanceController.text = act.distance > 0 ? act.distance.toStringAsFixed(2) : '';
      _notesController.text = act.notes ?? '';
    } else {
      _selectedSport = _sportsCategories.first;
    }
  }

  @override
  void dispose() {
    _durationController.dispose();
    _caloriesController.dispose();
    _distanceController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime(2000),
      lastDate: DateTime.now(),
      builder: (context, child) {
        return Theme(
          data: Theme.of(context).copyWith(
            colorScheme: const ColorScheme.light(
              primary: AppColors.primaryBlack,
              onPrimary: Colors.white,
              onSurface: AppColors.primaryBlack,
            ),
          ),
          child: child!,
        );
      },
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _saveActivity() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    
    final payload = {
      'sport_id': _selectedSport,
      'duration': int.parse(_durationController.text),
      'activity_date': _selectedDate.toIso8601String(),
      'calories': double.tryParse(_caloriesController.text) ?? 0.0,
      'distance': double.tryParse(_distanceController.text) ?? 0.0,
      'intensity': _selectedIntensity,
      'notes': _notesController.text.trim(),
    };

    final provider = context.read<FitnessProvider>();
    bool success = false;

    if (widget.activity == null) {
      success = await provider.addActivity(payload);
    } else {
      success = await provider.updateActivity(widget.activity!.id, payload);
    }

    if (!mounted) return;
    
    setState(() => _isSaving = false);
    
    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.activity == null ? 'Activity added' : 'Activity updated'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Failed to save activity'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.activity != null;
    final dateFormat = DateFormat('MMMM d, yyyy');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(isEditing ? 'Edit Activity' : 'Add Activity', style: const TextStyle(color: AppColors.primaryBlack, fontSize: 20, fontWeight: FontWeight.w600)),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
      ),
      body: _isSaving
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Sport *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedSport,
                      items: _sportsCategories.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                      onChanged: (val) => setState(() => _selectedSport = val),
                      decoration: const InputDecoration(),
                      validator: (value) => value == null ? 'Please select a sport' : null,
                    ),
                    const SizedBox(height: 20),

                    const Text('Date *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                    const SizedBox(height: 8),
                    InkWell(
                      onTap: _pickDate,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(dateFormat.format(_selectedDate), style: const TextStyle(fontSize: 16, color: AppColors.primaryBlack)),
                            const Icon(Icons.calendar_today, color: AppColors.textSecondary, size: 20),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Duration (min) *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _durationController,
                                keyboardType: TextInputType.number,
                                decoration: const InputDecoration(hintText: 'e.g. 45'),
                                validator: (value) {
                                  if (value == null || value.isEmpty) return 'Required';
                                  final num = int.tryParse(value);
                                  if (num == null || num <= 0) return 'Must be > 0';
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Intensity', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedIntensity,
                                hint: const Text('Optional'),
                                items: _intensityLevels.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                                onChanged: (val) => setState(() => _selectedIntensity = val),
                                decoration: const InputDecoration(),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Calories (kcal)', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _caloriesController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(hintText: 'e.g. 300'),
                                validator: (value) {
                                  if (value != null && value.isNotEmpty) {
                                    final num = double.tryParse(value);
                                    if (num == null || num < 0) return 'Invalid';
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Distance (km)', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _distanceController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(hintText: 'e.g. 5.2'),
                                validator: (value) {
                                  if (value != null && value.isNotEmpty) {
                                    final num = double.tryParse(value);
                                    if (num == null || num < 0) return 'Invalid';
                                  }
                                  return null;
                                },
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),

                    const Text('Notes', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(hintText: 'Any thoughts on this session?'),
                    ),
                    const SizedBox(height: 40),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _saveActivity,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlack,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: const Text('Save Activity', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
