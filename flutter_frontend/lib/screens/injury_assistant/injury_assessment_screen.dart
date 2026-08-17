import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../../theme/app_theme.dart';
import '../../models/injury_model.dart';
import '../../widgets/top_navigation_bar.dart';
import '../../widgets/injury/assessment_step_indicator.dart';
import '../../widgets/injury/body_part_selector.dart';
import '../../widgets/injury/pain_scale_slider.dart';
import '../../services/injury_service.dart';
import './injury_result_screen.dart';

class InjuryAssessmentScreen extends StatefulWidget {
  const InjuryAssessmentScreen({super.key});

  @override
  State<InjuryAssessmentScreen> createState() => _InjuryAssessmentScreenState();
}

class _InjuryAssessmentScreenState extends State<InjuryAssessmentScreen> {
  int _currentStep = 0;
  final int _totalSteps = 8;
  bool _isLoading = false;

  // Form data
  String? _sport;
  String? _bodyPart;
  String? _injuryMechanism;
  List<String> _symptoms = [];
  int _painLevel = 0;
  bool _hasSwelling = false;
  String _mobilityStatus = 'Full';
  bool _hasPreviousInjury = false;
  int _painDurationDays = 1;

  final List<Map<String, dynamic>> _sports = [
    {'name': 'Football', 'icon': Icons.sports_soccer},
    {'name': 'Badminton', 'icon': Icons.sports_tennis},
    {'name': 'Cricket', 'icon': Icons.sports_cricket},
    {'name': 'Basketball', 'icon': Icons.sports_basketball},
    {'name': 'Running', 'icon': Icons.directions_run},
    {'name': 'Tennis', 'icon': Icons.sports_tennis},
    {'name': 'Swimming', 'icon': Icons.pool},
    {'name': 'Cycling', 'icon': Icons.pedal_bike},
    {'name': 'Other', 'icon': Icons.sports},
  ];

  final List<String> _mechanisms = [
    'Direct Impact / Collision',
    'Twisting / Rotation',
    'Overuse / Repetitive Strain',
    'Fall / Landing',
    'Sudden Stretch',
    'Muscle Pull / Strain',
    'Unknown'
  ];

  final List<String> _availableSymptoms = [
    'Localized Pain',
    'Swelling',
    'Bruising',
    'Stiffness',
    'Muscle Weakness',
    'Numbness/Tingling',
    'Popping/Clicking Sound',
    'Instability/Giving Way',
    'Limited Range of Motion',
    'Burning Sensation'
  ];

  void _nextStep() {
    if (_currentStep == 0 && _sport == null) {
      _showError('Please select a sport');
      return;
    }
    if (_currentStep == 1 && _bodyPart == null) {
      _showError('Please select an injured body part');
      return;
    }
    if (_currentStep == 2 && _injuryMechanism == null) {
      _showError('Please select how the injury happened');
      return;
    }
    
    if (_currentStep < _totalSteps - 1) {
      setState(() => _currentStep++);
    } else {
      _submitAssessment();
    }
  }

  void _prevStep() {
    if (_currentStep > 0) {
      setState(() => _currentStep--);
    } else {
      Navigator.pop(context);
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: Colors.red));
  }

  Future<void> _submitAssessment() async {
    setState(() => _isLoading = true);
    try {
      final data = {
        'sport': _sport,
        'bodyPart': _bodyPart,
        'injuryMechanism': _injuryMechanism,
        'symptoms': _symptoms,
        'painLevel': _painLevel,
        'hasSwelling': _hasSwelling,
        'mobilityStatus': _mobilityStatus,
        'hasPreviousInjury': _hasPreviousInjury,
        'painDurationDays': _painDurationDays,
      };

      final result = await InjuryService.assessInjury(data: data);
      InjuryReport? report;
      if (result['report'] != null) {
        try {
          report = InjuryReport.fromJson(result['report']);
        } catch (e) {
          debugPrint('Error parsing report directly: $e');
        }
      }

      if (report == null && result['report'] != null) {
        final id = result['report']['_id'] ?? result['report']['id'];
        if (id != null) {
          report = await InjuryService.getInjuryReport(id.toString());
        }
      }

      if (mounted && report != null) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => InjuryResultScreen(report: report!)),
        );
      } else if (mounted) {
        _showError('Unable to generate injury assessment. Please try again.');
        setState(() => _isLoading = false);
      }
    } catch (e) {
      if (mounted) {
        _showError(e.toString());
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildStep0() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.85,
      ),
      itemCount: _sports.length,
      itemBuilder: (context, index) {
        final sport = _sports[index];
        final isSelected = _sport == sport['name'];
        return GestureDetector(
          onTap: () => setState(() => _sport = sport['name']),
          child: Container(
            decoration: BoxDecoration(
              color: isSelected ? AppColors.warmAccent : Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: isSelected ? AppColors.warmAccent : AppColors.border),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(sport['icon'], size: 40, color: isSelected ? Colors.white : AppColors.primaryBlack),
                const SizedBox(height: 8),
                Text(
                  sport['name'],
                  style: TextStyle(
                    color: isSelected ? Colors.white : AppColors.primaryBlack,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStep1() {
    return BodyPartSelector(
      sport: _sport ?? 'Other',
      selected: _bodyPart,
      onSelected: (part) => setState(() => _bodyPart = part),
    );
  }

  Widget _buildStep2() {
    return Column(
      children: _mechanisms.map((mech) {
        final isSelected = _injuryMechanism == mech;
        return Padding(
          padding: const EdgeInsets.only(bottom: 8.0),
          child: InkWell(
            onTap: () => setState(() => _injuryMechanism = mech),
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: isSelected ? AppColors.warmAccent.withOpacity(0.1) : Colors.white,
                border: Border.all(color: isSelected ? AppColors.warmAccent : AppColors.border),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Row(
                children: [
                  Icon(
                    isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked,
                    color: isSelected ? AppColors.warmAccent : AppColors.mutedText,
                  ),
                  const SizedBox(width: 12),
                  Text(mech, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                ],
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildStep3() {
    return Column(
      children: _availableSymptoms.map((sym) {
        final isSelected = _symptoms.contains(sym);
        return CheckboxListTile(
          title: Text(sym),
          value: isSelected,
          activeColor: AppColors.warmAccent,
          onChanged: (bool? value) {
            setState(() {
              if (value == true) {
                _symptoms.add(sym);
              } else {
                _symptoms.remove(sym);
              }
            });
          },
          controlAffinity: ListTileControlAffinity.leading,
          contentPadding: EdgeInsets.zero,
        );
      }).toList(),
    );
  }

  Widget _buildStep4() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 32.0),
      child: PainScaleSlider(
        value: _painLevel,
        onChanged: (val) => setState(() => _painLevel = val),
      ),
    );
  }

  Widget _buildStep5() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SwitchListTile(
          title: const Text('Noticeable Swelling', style: TextStyle(fontWeight: FontWeight.bold)),
          value: _hasSwelling,
          activeColor: AppColors.warmAccent,
          onChanged: (val) => setState(() => _hasSwelling = val),
          contentPadding: EdgeInsets.zero,
        ),
        const SizedBox(height: 24),
        const Text('Mobility Status', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        const SizedBox(height: 12),
        ...['Full', 'Partial', 'Minimal', 'None'].map((status) {
          return RadioListTile<String>(
            title: Text(status),
            value: status,
            groupValue: _mobilityStatus,
            activeColor: AppColors.warmAccent,
            onChanged: (val) => setState(() => _mobilityStatus = val!),
            contentPadding: EdgeInsets.zero,
          );
        }).toList(),
      ],
    );
  }

  Widget _buildStep6() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SwitchListTile(
          title: const Text('Previous injury in this area', style: TextStyle(fontWeight: FontWeight.bold)),
          value: _hasPreviousInjury,
          activeColor: AppColors.warmAccent,
          onChanged: (val) => setState(() => _hasPreviousInjury = val),
          contentPadding: EdgeInsets.zero,
        ),
        if (_hasPreviousInjury) ...[
          const SizedBox(height: 24),
          Text('Pain Duration: $_painDurationDays days', style: const TextStyle(fontWeight: FontWeight.bold)),
          Slider(
            value: _painDurationDays.toDouble(),
            min: 1,
            max: 30,
            divisions: 29,
            activeColor: AppColors.warmAccent,
            label: _painDurationDays.toString(),
            onChanged: (val) => setState(() => _painDurationDays = val.toInt()),
          ),
        ],
      ],
    );
  }

  Widget _buildStep7() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Card(
          elevation: 0,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
            side: const BorderSide(color: AppColors.border),
          ),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const Divider(),
                _summaryRow('Sport', _sport ?? '-'),
                _summaryRow('Body Part', _bodyPart ?? '-'),
                _summaryRow('Mechanism', _injuryMechanism ?? '-'),
                _summaryRow('Pain Level', '$_painLevel/10'),
                _summaryRow('Swelling', _hasSwelling ? 'Yes' : 'No'),
                _summaryRow('Mobility', _mobilityStatus),
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.amber.withOpacity(0.1),
            border: Border.all(color: Colors.amber),
            borderRadius: BorderRadius.circular(8),
          ),
          child: const Row(
            children: [
              Icon(Icons.warning_amber_rounded, color: Colors.amber),
              SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Medical Disclaimer: This AI assessment provides general guidance and is not a substitute for professional medical advice, diagnosis, or treatment.',
                  style: TextStyle(fontSize: 12),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        ElevatedButton.icon(
          onPressed: () async {
            final picker = ImagePicker();
            await picker.pickImage(source: ImageSource.gallery);
            ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Image uploaded (simulation)')));
          },
          icon: const Icon(Icons.camera_alt),
          label: const Text('Add Photo (Optional)'),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.white,
            foregroundColor: AppColors.primaryBlack,
            elevation: 0,
            side: const BorderSide(color: AppColors.border),
            minimumSize: const Size(double.infinity, 50),
          ),
        ),
      ],
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: AppColors.mutedText)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _getCurrentStepWidget() {
    switch (_currentStep) {
      case 0: return _buildStep0();
      case 1: return _buildStep1();
      case 2: return _buildStep2();
      case 3: return _buildStep3();
      case 4: return _buildStep4();
      case 5: return _buildStep5();
      case 6: return _buildStep6();
      case 7: return _buildStep7();
      default: return const SizedBox.shrink();
    }
  }

  String _getStepTitle() {
    switch (_currentStep) {
      case 0: return 'What sport were you playing?';
      case 1: return 'Where is the injury?';
      case 2: return 'How did it happen?';
      case 3: return 'Select your symptoms';
      case 4: return 'Rate your pain';
      case 5: return 'Swelling & Mobility';
      case 6: return 'Injury History';
      case 7: return 'Review & Submit';
      default: return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const TopNavigationBar(),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : SafeArea(
              child: Column(
                children: [
                  AssessmentStepIndicator(currentStep: _currentStep, totalSteps: _totalSteps),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            _getStepTitle(),
                            style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 24),
                          _getCurrentStepWidget(),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      border: Border(top: BorderSide(color: AppColors.border)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _prevStep,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              side: const BorderSide(color: AppColors.border),
                            ),
                            child: const Text('Back', style: TextStyle(color: AppColors.primaryBlack)),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _nextStep,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.warmAccent,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                            ),
                            child: Text(
                              _currentStep == _totalSteps - 1 ? 'Get AI Assessment' : 'Next',
                              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
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
}
