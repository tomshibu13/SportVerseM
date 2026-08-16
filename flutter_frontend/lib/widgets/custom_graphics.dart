import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

export 'top_navigation_bar.dart';

/// Top Logo Header for Splash/Onboarding Screen
class SportVerseLogoHeader extends StatelessWidget {
  final bool isDark;
  const SportVerseLogoHeader({super.key, this.isDark = true});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Image.asset(
          'assets/images/app_logo.png',
          width: 72,
          height: 72,
          fit: BoxFit.contain,
          errorBuilder: (context, error, stackTrace) => Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Icon(Icons.sports, color: Colors.white, size: 34),
          ),
        ),
        const SizedBox(height: 10),
        const Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: 'SPORTVERSE ',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                  color: Colors.white,
                ),
              ),
              TextSpan(
                text: 'AI',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1.5,
                  color: AppColors.goldStart,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'FIND  •  BOOK  •  PLAY  •  COMPETE',
          style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            letterSpacing: 2.0,
            color: isDark ? const Color(0xAAFFFFFF) : AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}

/// Horizontal Inline Top Navbar Header with Logo + Text
class SportVerseInlineHeader extends StatelessWidget {
  const SportVerseInlineHeader({super.key});

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Image.asset(
          'assets/images/app_logo.png',
          height: 28,
          width: 28,
          fit: BoxFit.contain,
          errorBuilder: (_, __, ___) => const Icon(
            Icons.sports,
            color: AppColors.warmAccent,
            size: 24,
          ),
        ),
        const SizedBox(width: 8),
        const Text.rich(
          TextSpan(
            children: [
              TextSpan(
                text: 'SPORTVERSE ',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                  color: AppColors.primaryBlack,
                ),
              ),
              TextSpan(
                text: 'AI',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 0.8,
                  color: AppColors.warmAccentSecondary,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Background Dot Matrix Graphic (5x5 grid)
class DotMatrixWidget extends StatelessWidget {
  final Color color;
  final double size;

  const DotMatrixWidget({
    super.key,
    this.color = const Color(0xFFDDD8CF),
    this.size = 48,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: GridView.builder(
        physics: const NeverScrollableScrollPhysics(),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 5,
          mainAxisSpacing: 4,
          crossAxisSpacing: 4,
        ),
        itemCount: 25,
        itemBuilder: (_, __) => Container(
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
      ),
    );
  }
}

/// Gold Metallic Gradient Primary Button ("Get Started ➔" or "Create Account ➔")
class GoldGradientButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  const GoldGradientButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        gradient: AppColors.goldGradient,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: AppColors.goldMiddle.withValues(alpha: 0.35),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(28),
          onTap: isLoading ? null : onPressed,
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Text(
                          text,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF18130B),
                            letterSpacing: 0.3,
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 20,
                        color: Color(0xFF18130B),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// Dark Obsidian Pill Button ("Log In ➔")
class DarkPillButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  const DarkPillButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      height: 56,
      decoration: BoxDecoration(
        color: AppColors.textPrimary,
        borderRadius: BorderRadius.circular(28),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.25),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(28),
          onTap: isLoading ? null : onPressed,
          child: Center(
            child: isLoading
                ? const SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                  )
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        text,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(width: 10),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        size: 20,
                        color: Colors.white,
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}

/// Floating Circular Back Arrow Button
class CustomBackButton extends StatelessWidget {
  final VoidCallback? onTap;
  const CustomBackButton({super.key, this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap ?? () => Navigator.maybePop(context),
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
          border: Border.all(color: AppColors.borderSubtle),
        ),
        child: const Icon(Icons.arrow_back, size: 20, color: AppColors.textPrimary),
      ),
    );
  }
}

/// Gold Decorative Wave Ribbons Painter (Used at bottom of dark card)
class GoldenWavesPainter extends CustomPainter {
  const GoldenWavesPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final Paint paint1 = Paint()
      ..color = const Color(0x22F5D08D)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    final Paint paint2 = Paint()
      ..color = const Color(0x11C59341)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final Path path1 = Path();
    path1.moveTo(0, h);
    path1.quadraticBezierTo(w * 0.35, h * 0.65, w, h * 0.95);

    final Path path2 = Path();
    path2.moveTo(0, h * 0.9);
    path2.quadraticBezierTo(w * 0.5, h * 0.5, w, h * 0.85);

    canvas.drawPath(path1, paint1);
    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// Gold Swoosh Motion Lines Painter (Used behind soccer ball on Login Screen)
class SoccerBallMotionLinesPainter extends CustomPainter {
  const SoccerBallMotionLinesPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final Paint paint1 = Paint()
      ..color = const Color(0x33C8895B)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final Paint paint2 = Paint()
      ..color = const Color(0x22F3E5D8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.8;

    final Path path1 = Path();
    path1.moveTo(0, h * 0.8);
    path1.quadraticBezierTo(w * 0.5, h * 0.2, w * 0.9, h * 0.1);

    final Path path2 = Path();
    path2.moveTo(w * 0.1, h * 0.9);
    path2.quadraticBezierTo(w * 0.6, h * 0.4, w, h * 0.3);

    canvas.drawPath(path1, paint1);
    canvas.drawPath(path2, paint2);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
