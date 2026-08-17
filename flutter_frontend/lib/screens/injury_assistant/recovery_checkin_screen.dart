import 'package:flutter/material.dart';
import '../../models/injury_model.dart';
import '../../theme/app_theme.dart';
import '../../services/injury_service.dart';
import '../../widgets/injury/pain_scale_slider.dart';
import 'package:intl/intl.dart';

class RecoveryCheckInScreen extends StatefulWidget {
  final InjuryReport report;
  final VoidCallback? onCheckinAdded;

  const RecoveryCheckInScreen({super.key, required this.report, this.onCheckinAdded});

  @override
  State<RecoveryCheckInScreen> createState() => _RecoveryCheckInScreenState();
}

class _RecoveryCheckInScreenState extends State<RecoveryCheckInScreen> {
  int _painLevel = 0;
  String _mobilityStatus = 'Full';
  final TextEditingController _notesController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submitCheckIn() async {
    setState(() => _isLoading = true);
    try {
      final data = {
        'painLevel': _painLevel,
        'mobilityStatus': _mobilityStatus,
        'notes': _notesController.text,
      };

      await InjuryService.addRecoveryCheckIn(widget.report.id, data);

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Check-in saved successfully!')));

      if (widget.onCheckinAdded != null) {
        widget.onCheckinAdded!();
      }

      if (!mounted) return;
      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Recovery Check-in', style: TextStyle(color: AppColors.primaryBlack, fontSize: 16)),
            Text(widget.report.bodyPart, style: const TextStyle(color: AppColors.mutedText, fontSize: 12)),
          ],
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (widget.report.checkIns.isNotEmpty) ...[
              const Text('Previous Check-ins', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
              const SizedBox(height: 12),
              ...widget.report.checkIns.map((ci) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: AppColors.lightDecorAccent,
                  child: Text(ci.painLevel.toString(), style: const TextStyle(color: AppColors.primaryBlack, fontWeight: FontWeight.bold)),
                ),
                title: Text(DateFormat('MMM dd, hh:mm a').format(ci.date)),
                subtitle: Text('Mobility: ${ci.mobilityStatus}${ci.notes.isNotEmpty ? ' • ${ci.notes}' : ''}'),
              )),
              const Divider(height: 32),
            ],

            const Text('New Check-in', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 24),

            const Text('Current Pain Level', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            PainScaleSlider(
              value: _painLevel,
              onChanged: (val) => setState(() => _painLevel = val),
            ),
            const SizedBox(height: 32),

            const Text('Current Mobility', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            ...['Full', 'Partial', 'Minimal', 'None'].map((status) {
              final isSelected = _mobilityStatus == status;
              return Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: InkWell(
                  onTap: () => setState(() => _mobilityStatus = status),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.warmAccent.withValues(alpha: 0.1) : Colors.white,
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
                        Text(status, style: TextStyle(fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
                      ],
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: 24),

            const Text('Notes (Optional)', style: TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 12),
            TextField(
              controller: _notesController,
              maxLines: 3,
              decoration: InputDecoration(
                hintText: 'How are you feeling today?',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.warmAccent),
                ),
              ),
            ),
            const SizedBox(height: 32),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitCheckIn,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.warmAccent,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: _isLoading
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Check-in', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
