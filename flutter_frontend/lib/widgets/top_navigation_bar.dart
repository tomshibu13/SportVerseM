import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'custom_graphics.dart';
import '../screens/inbox_screen.dart';
import '../screens/become_ground_owner_screen.dart';
import '../screens/ai_assistant_screen.dart';

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

  void _showQuickMenu(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Quick Navigation',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                ),
                const SizedBox(height: 14),
                ListTile(
                  leading: const Icon(Icons.notifications_outlined, color: AppColors.warmAccent),
                  title: const Text('Notifications & Alerts', style: TextStyle(fontWeight: FontWeight.w600)),
                  trailing: const Icon(Icons.chevron_right, size: 20),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const InboxScreen()));
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.medical_services_outlined, color: Color(0xFFEF4444)),
                  title: const Text('AI Injury Assistant', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('Get AI-powered sports injury guidance', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right, size: 20),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const AIAssistantScreen(initialQuery: 'I have a sports injury and need advice')));
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.add_business_outlined, color: Color(0xFF10B981)),
                  title: const Text('Register Arena as Ground Owner', style: TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: const Text('List your courts and start earning', style: TextStyle(fontSize: 12)),
                  trailing: const Icon(Icons.chevron_right, size: 20),
                  onTap: () {
                    Navigator.pop(ctx);
                    Navigator.push(context, MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()));
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }

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
              onPressed: onMenuPressed ?? () => _showQuickMenu(context),
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
                      onPressed: onNotificationPressed ?? () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => const InboxScreen()),
                        );
                      },
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
