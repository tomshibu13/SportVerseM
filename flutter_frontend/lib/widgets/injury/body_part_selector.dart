import 'package:flutter/material.dart';
import '../../theme/app_theme.dart';

class BodyPartSelector extends StatelessWidget {
  final String sport;
  final String? selected;
  final Function(String) onSelected;

  const BodyPartSelector({
    super.key,
    required this.sport,
    required this.selected,
    required this.onSelected,
  });

  List<String> _getPartsForSport(String sportName) {
    switch (sportName.toLowerCase()) {
      case 'football':
        return ['Ankle', 'Knee', 'Thigh/Hamstring', 'Hip', 'Lower Back', 'Shoulder', 'Head', 'Groin', 'Calf', 'Foot'];
      case 'badminton':
        return ['Shoulder', 'Elbow', 'Wrist', 'Knee', 'Ankle', 'Lower Back', 'Neck'];
      case 'cricket':
        return ['Finger/Hand', 'Shoulder', 'Lower Back', 'Knee', 'Ankle', 'Side/Ribs', 'Thumb'];
      case 'basketball':
        return ['Ankle', 'Knee', 'Finger/Hand', 'Wrist', 'Shoulder', 'Hip'];
      case 'running':
        return ['Knee', 'Shin', 'Hip', 'Foot', 'Ankle', 'IT Band/Thigh', 'Lower Back'];
      case 'tennis':
        return ['Elbow', 'Shoulder', 'Wrist', 'Knee', 'Ankle', 'Lower Back'];
      default:
        return ['Head', 'Neck/Spine', 'Shoulder', 'Elbow', 'Wrist', 'Hand/Finger', 'Chest', 'Ribs', 'Hip', 'Knee', 'Ankle', 'Foot'];
    }
  }

  @override
  Widget build(BuildContext context) {
    final parts = _getPartsForSport(sport);
    return Wrap(
      spacing: 12.0,
      runSpacing: 12.0,
      children: parts.map((part) {
        final isSelected = selected == part;
        return InkWell(
          onTap: () => onSelected(part),
          borderRadius: BorderRadius.circular(20),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isSelected ? AppColors.warmAccent : Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(
                color: isSelected ? AppColors.warmAccent : AppColors.border,
              ),
            ),
            child: Text(
              part,
              style: TextStyle(
                color: isSelected ? Colors.white : AppColors.primaryBlack,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}
