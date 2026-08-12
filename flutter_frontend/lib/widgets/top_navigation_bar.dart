import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'custom_graphics.dart';

/// Standalone Top Navigation Bar Component matching the design system
class TopNavigationBar extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onMenuPressed;
  final VoidCallback? onNotificationPressed;
  final bool showCart;
  final int cartCount;
  final VoidCallback? onCartPressed;
  final Widget? trailing;

  const TopNavigationBar({
    super.key,
    this.onMenuPressed,
    this.onNotificationPressed,
    this.showCart = false,
    this.cartCount = 0,
    this.onCartPressed,
    this.trailing,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Left Menu Icon Button
            IconButton(
              icon: const Icon(Icons.menu, size: 24, color: AppColors.primaryBlack),
              onPressed: onMenuPressed ?? () {},
            ),

            // Center Logo Header (SportVerse AI)
            const Expanded(
              child: Center(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: SportVerseInlineHeader(),
                ),
              ),
            ),

            // Right Action Icons Row
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Notification Bell (Visible on all pages)
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_outlined,
                          size: 24, color: AppColors.primaryBlack),
                      onPressed: onNotificationPressed ?? () {},
                    ),
                    Positioned(
                      right: 10,
                      top: 10,
                      child: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.warmAccent,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                  ],
                ),

                // Shopping Cart Icon (Visible ONLY when showCart is true, e.g. Shop Page)
                if (showCart) ...[
                  Stack(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.shopping_bag_outlined,
                            size: 24, color: AppColors.primaryBlack),
                        onPressed: onCartPressed ?? () {},
                      ),
                      Positioned(
                        right: 8,
                        top: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: const BoxDecoration(
                            color: Color(0xFFC8895B),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            '$cartCount',
                            style: const TextStyle(
                              fontSize: 9,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],

                // Optional Additional Trailing Action Widget
                if (trailing != null) trailing!,
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Typedef for backwards compatibility
typedef SportVerseTopBar = TopNavigationBar;
