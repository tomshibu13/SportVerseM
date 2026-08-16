import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import 'home_screen.dart';

class RegistrationSubmittedScreen extends StatelessWidget {
  const RegistrationSubmittedScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final isDesktopOrWeb = media.size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: isDesktopOrWeb ? 480 : double.infinity,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
              child: Column(
                children: [
                  Expanded(
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const SizedBox(height: 20),
                          // ── Top Illustration / Confetti Banner ──
                          _buildSubmittedIllustration(media),
                          const SizedBox(height: 32),

                          // ── Title & Subtitle ──
                          const Text(
                            'Registration Submitted!',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF111111),
                              letterSpacing: -0.5,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Thank you for registering with\nSportVerse AI.',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF666666),
                              height: 1.4,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 36),

                          // ── What's Next Card ──
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: const Color(0xFFEEEEEE)),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.03),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFFF3E0),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(
                                        Icons.access_time_filled,
                                        size: 20,
                                        color: Color(0xFFFF6B00),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    const Text(
                                      'What\'s Next?',
                                      style: TextStyle(
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF111111),
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Our team will review your details and verify your ground. You will receive a notification once your ground is approved.',
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Color(0xFF666666),
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 20),
                                const Divider(color: Color(0xFFEEEEEE), height: 1),
                                const SizedBox(height: 16),

                                // Status Row
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    const Text(
                                      'Status',
                                      style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                        color: Color(0xFF333333),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFEF3C7),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: const Color(0xFFFDE68A)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: const [
                                          Icon(
                                            Icons.schedule,
                                            size: 14,
                                            color: Color(0xFFD97706),
                                          ),
                                          SizedBox(width: 6),
                                          Text(
                                            'Under Review',
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.bold,
                                              color: Color(0xFFD97706),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  // ── Bottom Action Button ──
                  Padding(
                    padding: const EdgeInsets.only(top: 16.0),
                    child: SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF111111),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          Navigator.pushAndRemoveUntil(
                            context,
                            MaterialPageRoute(builder: (_) => const HomeScreen()),
                            (route) => false,
                          );
                        },
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Text(
                              'Go to Dashboard',
                              style: TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            SizedBox(width: 8),
                            Icon(
                              Icons.arrow_forward,
                              size: 18,
                              color: Colors.white,
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSubmittedIllustration(MediaQueryData media) {
    return Container(
      width: double.infinity,
      height: 220,
      child: Stack(
        alignment: Alignment.center,
        children: [
          // Background Sports Field Box
          Container(
            width: double.infinity,
            height: 180,
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFFE8F5E9), Color(0xFFC8E6C9)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withOpacity(0.1),
                  blurRadius: 12,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Stack(
                children: [
                  // Ground outline/stripes illustration
                  Positioned.fill(
                    child: CustomPaint(
                      painter: GroundIllustrationPainter(),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Green Circle Checkmark Badge Overlay on Top
          Positioned(
            top: 0,
            child: Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: const Color(0xFF10B981),
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white, width: 4),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF10B981).withOpacity(0.3),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: const Icon(
                Icons.check_rounded,
                size: 42,
                color: Colors.white,
              ),
            ),
          ),

          // Confetti dots
          Positioned.fill(
            child: CustomPaint(
              painter: ConfettiPainter(),
            ),
          ),
        ],
      ),
    );
  }
}

class GroundIllustrationPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFF4CAF50).withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2;

    // Court border line
    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTWH(20, 40, size.width - 40, size.height - 60),
        const Radius.circular(12),
      ),
      paint,
    );

    // Center line
    canvas.drawLine(
      Offset(size.width / 2, 40),
      Offset(size.width / 2, size.height - 20),
      paint,
    );

    // Center circle
    canvas.drawCircle(
      Offset(size.width / 2, size.height / 2 + 10),
      25,
      paint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class ConfettiPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final colors = [
      const Color(0xFF3B82F6),
      const Color(0xFFEF4444),
      const Color(0xFFF59E0B),
      const Color(0xFF10B981),
      const Color(0xFF8B5CF6),
    ];

    final points = [
      const Offset(30, 20),
      const Offset(80, 10),
      const Offset(140, 25),
      const Offset(220, 15),
      const Offset(280, 30),
      const Offset(330, 12),
      const Offset(50, 45),
      const Offset(300, 50),
    ];

    for (int i = 0; i < points.length; i++) {
      final p = Paint()
        ..color = colors[i % colors.length]
        ..style = PaintingStyle.fill;
      canvas.drawCircle(points[i], (i % 3 == 0) ? 4 : 3, p);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
