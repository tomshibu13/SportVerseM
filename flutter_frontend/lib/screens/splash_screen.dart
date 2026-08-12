import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';
import '../widgets/feature_highlights_bar.dart';
import 'login_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      SystemChrome.setSystemUIOverlayStyle(SystemUiOverlayStyle.light);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0D0D0D),
      body: Stack(
        children: [
          // ── Layer 1: Full-bleed Hero Stadium Background Image ──
          Positioned.fill(
            child: Image.asset(
              'assets/images/hero_kick.png',
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: const Color(0xFF1A1A1A),
                child: const Icon(Icons.sports_soccer,
                    size: 100, color: AppColors.goldAccent),
              ),
            ),
          ),

          // ── Layer 2: Top Dark Gradient Overlay for Header Clarity ──
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            height: 260,
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [Color(0xFA000000), Color(0x99000000), Colors.transparent],
                ),
              ),
            ),
          ),

          // ── Layer 3: Foreground Content (Top Header & Bottom Card Sheet) ──
          SafeArea(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  minHeight: MediaQuery.of(context).size.height -
                      MediaQuery.of(context).padding.top -
                      MediaQuery.of(context).padding.bottom,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // ── Top Header Section ──
                    Padding(
                      padding: EdgeInsets.fromLTRB(
                        24,
                        MediaQuery.of(context).size.height * 0.08,
                        24,
                        20,
                      ),
                      child: const Stack(
                        alignment: Alignment.center,
                        children: [
                          Center(
                            child: SportVerseLogoHeader(isDark: true),
                          ),
                          Positioned(
                            right: 0,
                            top: 0,
                            child: DotMatrixWidget(
                              color: Color(0x44FFFFFF),
                              size: 44,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 20),

                    // ── Bottom Dark Sheet Card Container ──
                    Container(
                      width: double.infinity,
                      decoration: const BoxDecoration(
                        color: Color(0xFF0F1116),
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(32)),
                      ),
                      child: Stack(
                        children: [
                          // Bottom Gold Decorative Wave Ribbons
                          const Positioned.fill(
                            child: CustomPaint(
                              painter: GoldenWavesPainter(),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.fromLTRB(24, 28, 24, 24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text(
                                  'Your Game. Your Ground.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 22,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                const Text(
                                  'Find the best sports venues, book instantly,\nplay more and compete better.',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.white54,
                                    height: 1.4,
                                  ),
                                ),
                                const SizedBox(height: 18),

                                
                                const SizedBox(height: 22),

                                // Primary Gold Metallic Pill Button
                                GoldGradientButton(
                                  text: 'Get Started',
                                  onPressed: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => const LoginScreen()),
                                  ),
                                ),
                                const SizedBox(height: 14),

                                // Sign In Link
                                GestureDetector(
                                  onTap: () => Navigator.push(
                                    context,
                                    MaterialPageRoute(
                                        builder: (_) => const LoginScreen()),
                                  ),
                                  child: const Text.rich(
                                    TextSpan(
                                      style: TextStyle(
                                          fontSize: 13, color: Colors.white54),
                                      children: [
                                        TextSpan(
                                            text: 'Already have an account? '),
                                        TextSpan(
                                          text: 'Sign In',
                                          style: TextStyle(
                                            color: AppColors.goldAccent,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 22),

                                // 4 Feature Tiles Row
                                const FeatureHighlightsTiles(),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
