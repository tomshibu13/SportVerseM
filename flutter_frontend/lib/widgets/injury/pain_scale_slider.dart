import 'package:flutter/material.dart';

class PainScaleSlider extends StatefulWidget {
  final int value;
  final Function(int) onChanged;

  const PainScaleSlider({
    super.key,
    required this.value,
    required this.onChanged,
  });

  @override
  State<PainScaleSlider> createState() => _PainScaleSliderState();
}

class _PainScaleSliderState extends State<PainScaleSlider> {
  Color _getColor(int value) {
    if (value <= 3) return const Color(0xFF10B981);
    if (value <= 6) return const Color(0xFFF59E0B);
    if (value <= 8) return const Color(0xFFEF4444);
    return const Color(0xFFDC2626);
  }

  String _getEmoji(int value) {
    if (value == 0) return '😊';
    if (value <= 2) return '🙂';
    if (value <= 4) return '😐';
    if (value <= 6) return '😟';
    if (value <= 8) return '😣';
    return '😭';
  }

  String _getDescription(int value) {
    if (value <= 1) return 'No Pain';
    if (value <= 3) return 'Mild';
    if (value <= 5) return 'Moderate';
    if (value <= 7) return 'Severe';
    if (value <= 9) return 'Very Severe';
    return 'Worst Possible';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          widget.value.toString(),
          style: TextStyle(
            fontSize: 48,
            fontWeight: FontWeight.bold,
            color: _getColor(widget.value),
          ),
        ),
        Text(
          _getDescription(widget.value),
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
            color: _getColor(widget.value),
          ),
        ),
        const SizedBox(height: 24),
        SliderTheme(
          data: SliderTheme.of(context).copyWith(
            activeTrackColor: _getColor(widget.value),
            inactiveTrackColor: Colors.grey.shade300,
            thumbColor: _getColor(widget.value),
            overlayColor: _getColor(widget.value).withValues(alpha: 0.2),
            valueIndicatorColor: _getColor(widget.value),
          ),
          child: Slider(
            value: widget.value.toDouble(),
            min: 0,
            max: 10,
            divisions: 10,
            label: widget.value.toString(),
            onChanged: (val) => widget.onChanged(val.toInt()),
          ),
        ),
        const SizedBox(height: 8),
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [0, 2, 4, 6, 8, 10]
              .map(
                (v) => Column(
                  children: [
                    Text(_getEmoji(v), style: const TextStyle(fontSize: 24)),
                    Text(v.toString(), style: const TextStyle(fontSize: 12)),
                  ],
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}
