import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// 4 Feature Tiles Grid/Row matching exact design mockup bottom section of Screen 1
class FeatureHighlightsTiles extends StatelessWidget {
  const FeatureHighlightsTiles({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      {
        'icon': Icons.location_on_outlined,
        'title': 'Find Nearby',
        'subtitle': 'Venues',
      },
      {
        'icon': Icons.calendar_today_outlined,
        'title': 'Book Instantly',
        'subtitle': 'Real-time Slots',
      },
      {
        'icon': Icons.emoji_events_outlined,
        'title': 'Compete',
        'subtitle': '& Win',
      },
      {
        'icon': Icons.shopping_bag_outlined,
        'title': 'Shop',
        'subtitle': 'Sports Gear',
      },
    ];

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: List.generate(items.length, (index) {
        final item = items[index];
        final bool showDivider = index < items.length - 1;

        return Expanded(
          child: Row(
            children: [
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Circular Dark Badge with Gold Icon
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: const Color(0xFF1B1D24),
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: AppColors.goldAccent.withValues(alpha: 0.3),
                          width: 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.3),
                            blurRadius: 6,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Icon(
                        item['icon'] as IconData,
                        size: 22,
                        color: AppColors.goldStart,
                      ),
                    ),
                    const SizedBox(height: 8),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        item['title'] as String,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.goldStart,
                          height: 1.1,
                        ),
                      ),
                    ),
                    const SizedBox(height: 2),
                    FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(
                        item['subtitle'] as String,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w500,
                          color: Colors.white70,
                          height: 1.1,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              if (showDivider)
                Container(
                  width: 1,
                  height: 38,
                  margin: const EdgeInsets.symmetric(horizontal: 2),
                  color: Colors.white.withValues(alpha: 0.12),
                ),
            ],
          ),
        );
      }),
    );
  }
}

/// Floating Light Callout Bar (Shown at bottom of design overview image)
class FeatureHighlightsBar extends StatelessWidget {
  const FeatureHighlightsBar({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 4),
          ),
        ],
        border: Border.all(color: AppColors.borderSubtle, width: 1),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildItem(
            icon: Icons.location_on_outlined,
            line1: 'Find Nearby',
            line2: 'Sports Grounds',
          ),
          _buildItem(
            icon: Icons.calendar_today_outlined,
            line1: 'Book Instantly',
            line2: 'in Few Clicks',
          ),
          _buildItem(
            icon: Icons.verified_user_outlined,
            line1: 'Secure & Easy',
            line2: 'Payments',
          ),
          _buildItem(
            icon: Icons.people_outline_rounded,
            line1: 'Community',
            line2: '& Tournaments',
          ),
        ],
      ),
    );
  }

  Widget _buildItem(
      {required IconData icon, required String line1, required String line2}) {
    return Flexible(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: AppColors.goldLightBg,
              shape: BoxShape.circle,
              border: Border.all(
                  color: AppColors.goldAccent.withValues(alpha: 0.5),
                  width: 1.2),
            ),
            child: Icon(icon, size: 18, color: AppColors.goldAccent),
          ),
          const SizedBox(width: 8),
          Flexible(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  line1,
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                    height: 1.1,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  line2,
                  style: const TextStyle(
                    fontSize: 9,
                    color: AppColors.textSecondary,
                    height: 1.1,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
