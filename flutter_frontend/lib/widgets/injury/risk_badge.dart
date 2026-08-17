import 'package:flutter/material.dart';

class RiskBadge extends StatefulWidget {
  final String riskLevel;
  final bool large;

  const RiskBadge({super.key, required this.riskLevel, this.large = false});

  @override
  State<RiskBadge> createState() => _RiskBadgeState();
}

class _RiskBadgeState extends State<RiskBadge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _animation = Tween<double>(begin: 1.0, end: 1.2).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );

    if (widget.large && widget.riskLevel.toUpperCase() == 'URGENT') {
      _controller.repeat(reverse: true);
    }
  }

  @override
  void didUpdateWidget(covariant RiskBadge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.large && widget.riskLevel.toUpperCase() == 'URGENT') {
      _controller.repeat(reverse: true);
    } else {
      _controller.stop();
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color get _color {
    switch (widget.riskLevel.toUpperCase()) {
      case 'LOW':
        return const Color(0xFF10B981);
      case 'MODERATE':
        return const Color(0xFFF59E0B);
      case 'HIGH':
        return const Color(0xFFEF4444);
      case 'URGENT':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF10B981);
    }
  }

  IconData get _icon {
    switch (widget.riskLevel.toUpperCase()) {
      case 'LOW':
        return Icons.verified;
      case 'MODERATE':
        return Icons.warning_amber_rounded;
      case 'HIGH':
        return Icons.error_outline;
      case 'URGENT':
        return Icons.emergency;
      default:
        return Icons.verified;
    }
  }

  String get _description {
    switch (widget.riskLevel.toUpperCase()) {
      case 'LOW':
        return 'Minor injury. Home care usually sufficient.';
      case 'MODERATE':
        return 'Monitor closely. Consult professional if pain persists.';
      case 'HIGH':
        return 'Professional assessment recommended.';
      case 'URGENT':
        return 'SEEK EMERGENCY CARE IMMEDIATELY';
      default:
        return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    if (widget.large) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [_color, _color.withValues(alpha: 0.8)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: [
            BoxShadow(
              color: _color.withValues(alpha: 0.3),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Column(
          children: [
            ScaleTransition(
              scale: _animation,
              child: Icon(_icon, color: Colors.white, size: 48),
            ),
            const SizedBox(height: 12),
            Text(
              'RISK LEVEL: ${widget.riskLevel.toUpperCase()}',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 20,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _description,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: Colors.white.withValues(alpha: 0.9),
                fontSize: 16,
                fontWeight: widget.riskLevel.toUpperCase() == 'URGENT' ? FontWeight.bold : FontWeight.normal,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: _color,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(_icon, color: Colors.white, size: 14),
          const SizedBox(width: 4),
          Text(
            widget.riskLevel.toUpperCase(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
