import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/fitness_provider.dart';
import '../models/fitness_model.dart';
import '../theme/app_theme.dart';

class FitnessGoalFormScreen extends StatefulWidget {
  final FitnessGoal? goal;

  const FitnessGoalFormScreen({super.key, this.goal});

  @override
  State<FitnessGoalFormScreen> createState() => _FitnessGoalFormScreenState();
}

class _FitnessGoalFormScreenState extends State<FitnessGoalFormScreen> {
  final _formKey = GlobalKey<FormState>();

  final List<String> _goalTypes = [
    'Steps',
    'Active Minutes',
    'Sports Sessions',
    'Calories',
    'Distance'
  ];

  final List<String> _periods = [
    'Daily',
    'Weekly',
    'Monthly'
  ];

  String? _selectedType;
  String? _selectedPeriod;
  final _targetController = TextEditingController();

  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    if (widget.goal != null) {
      final g = widget.goal!;
      
      // Attempt to match goal type
      String matchingType = 'Steps';
      for (var t in _goalTypes) {
        if (g.goalType.toLowerCase().contains(t.toLowerCase())) {
          matchingType = t;
          break;
        }
      }
      _selectedType = matchingType;
      
      // Attempt to match period
      String matchingPeriod = 'Daily';
      for (var p in _periods) {
        if (g.period.toLowerCase() == p.toLowerCase()) {
          matchingPeriod = p;
          break;
        }
      }
      _selectedPeriod = matchingPeriod;

      _targetController.text = g.targetValue.truncateToDouble() == g.targetValue 
          ? g.targetValue.toInt().toString() 
          : g.targetValue.toString();
    } else {
      _selectedType = _goalTypes.first;
      _selectedPeriod = _periods.first;
    }
  }

  @override
  void dispose() {
    _targetController.dispose();
    super.dispose();
  }

  Future<void> _saveGoal() async {
    if (!_formKey.currentState!.validate()) return;
    
    setState(() => _isSaving = true);
    
    final targetValue = double.tryParse(_targetController.text) ?? 0.0;
    
    // Construct goal_type based on selections. E.g., "Daily Steps"
    final goalType = '$_selectedPeriod $_selectedType';

    final payload = {
      'goal_type': goalType,
      'target_value': targetValue,
      'period': _selectedPeriod,
    };

    final provider = context.read<FitnessProvider>();
    bool success = false;

    if (widget.goal == null) {
      success = await provider.addGoal(payload);
    } else {
      success = await provider.updateGoal(widget.goal!.id, payload);
    }

    if (!mounted) return;
    
    setState(() => _isSaving = false);
    
    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(widget.goal == null ? 'Goal created' : 'Goal updated'),
          backgroundColor: Colors.green,
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(provider.errorMessage ?? 'Failed to save goal'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.goal != null;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: Text(isEditing ? 'Edit Goal' : 'Set New Goal', style: const TextStyle(color: AppColors.primaryBlack, fontSize: 20, fontWeight: FontWeight.w600)),
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
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.track_changes, color: AppColors.warmAccent),
                          SizedBox(width: 12),
                          Expanded(
                            child: Text(
                              'Set realistic goals. Progress is automatically tracked from your fitness records and sports activities.',
                              style: TextStyle(color: AppColors.primaryBlack, fontSize: 13),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    const Text('Goal Category *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                    const SizedBox(height: 8),
                    DropdownButtonFormField<String>(
                      initialValue: _selectedType,
                      items: _goalTypes.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                      onChanged: (val) => setState(() => _selectedType = val),
                      decoration: const InputDecoration(),
                      validator: (value) => value == null ? 'Please select a goal category' : null,
                    ),
                    const SizedBox(height: 20),

                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Target Value *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              TextFormField(
                                controller: _targetController,
                                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                decoration: const InputDecoration(hintText: 'e.g. 10000'),
                                validator: (value) {
                                  if (value == null || value.isEmpty) return 'Required';
                                  final num = double.tryParse(value);
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
                              const Text('Period *', style: TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                              const SizedBox(height: 8),
                              DropdownButtonFormField<String>(
                                initialValue: _selectedPeriod,
                                items: _periods.map((s) => DropdownMenuItem(value: s, child: Text(s))).toList(),
                                onChanged: (val) => setState(() => _selectedPeriod = val),
                                decoration: const InputDecoration(),
                                validator: (value) => value == null ? 'Required' : null,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 40),

                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        onPressed: _saveGoal,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primaryBlack,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        child: Text(isEditing ? 'Update Goal' : 'Create Goal', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
