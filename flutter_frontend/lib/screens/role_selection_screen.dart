import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import 'become_ground_owner_screen.dart';
import 'profile_completion_screen.dart';
import '../services/auth_service.dart';

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  String _selectedRole = 'GroundOwner'; // 'GroundOwner' or 'Athlete'
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (!kIsWeb) {
      SystemChrome.setSystemUIOverlayStyle(
        const SystemUiOverlayStyle(
          statusBarColor: Colors.transparent,
          statusBarIconBrightness: Brightness.dark,
        ),
      );
    }
  }

  Future<void> _onContinue() async {
    setState(() => _isLoading = true);
    
    // Save the selected role to the database immediately
    final user = AuthService.currentUser;
    final name = user?['fullName'] as String? ?? user?['full_name'] as String? ?? '';
    final phone = user?['phone'] as String? ?? '';
    
    // 'Athlete' maps to 'User' in the backend
    final backendRole = _selectedRole == 'Athlete' ? 'User' : 'GroundOwner';
    
    await AuthService.updateProfile(
      fullName: name,
      phone: phone,
      role: backendRole,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      if (_selectedRole == 'GroundOwner') {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const BecomeGroundOwnerScreen()),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const ProfileCompletionScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final isDesktopOrWeb = media.size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        children: [
          // ── Top Right Decorative Orange Dots ──
          Positioned(
            top: 20,
            right: 16,
            child: _buildDotGrid(),
          ),

          // ── Bottom Sports Illustration Background ──
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            height: media.size.height * 0.38,
            child: IgnorePointer(
              child: Image.asset(
                'assets/images/regbg.png',
                fit: BoxFit.cover,
                alignment: Alignment.bottomCenter,
                errorBuilder: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ),

          // ── Main Content SafeArea ──
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: BoxConstraints(
                  maxWidth: isDesktopOrWeb ? 450 : double.infinity,
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Back Button ──
                      GestureDetector(
                        onTap: () => Navigator.maybePop(context),
                        child: Container(
                          padding: const EdgeInsets.all(6),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.black.withOpacity(0.08)),
                          ),
                          child: const Icon(
                            Icons.arrow_back_ios_new,
                            size: 16,
                            color: Color(0xFF222222),
                          ),
                        ),
                      ),
                      const SizedBox(height: 24),

                      // ── Title & Subtitle ──
                      const Text(
                        'Create Account',
                        style: TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF111111),
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Join SportVerse AI and start your sports journey',
                        style: TextStyle(
                          fontSize: 13,
                          color: Color(0xFF666666),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // ── Choice Prompt ──
                      const Text(
                        'I want to register as',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF333333),
                        ),
                      ),
                      const SizedBox(height: 16),

                      // ── Option Card 1: Ground Owner ──
                      _buildRoleCard(
                        roleKey: 'GroundOwner',
                        title: 'Ground Owner',
                        description: 'List and manage your sports grounds and facilities',
                        iconData: Icons.stadium_rounded,
                        accentColor: const Color(0xFFFF6B00),
                      ),
                      const SizedBox(height: 16),

                      // ── Option Card 2: Athlete ──
                      _buildRoleCard(
                        roleKey: 'Athlete',
                        title: 'Athlete',
                        description: 'Book grounds, join events and connect with players',
                        iconData: Icons.directions_run_rounded,
                        accentColor: const Color(0xFFFF6B00),
                      ),
                      const SizedBox(height: 28),

                      // ── Continue Action Button ──
                      SizedBox(
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
                          onPressed: _isLoading ? null : _onContinue,
                          child: _isLoading
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: const [
                                    Text(
                                      'Continue',
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
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleCard({
    required String roleKey,
    required String title,
    required String description,
    required IconData iconData,
    required Color accentColor,
  }) {
    final isSelected = _selectedRole == roleKey;

    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedRole = roleKey;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white : const Color(0xFFFAF9F6),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? accentColor : const Color(0xFFE5E5E5),
            width: isSelected ? 2 : 1,
          ),
          boxShadow: isSelected
              ? [
                  BoxShadow(
                    color: accentColor.withOpacity(0.12),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ]
              : [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
        ),
        child: Stack(
          children: [
            Row(
              children: [
                // Icon Box
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? accentColor.withOpacity(0.1)
                        : Colors.black.withOpacity(0.04),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(
                    iconData,
                    size: 28,
                    color: isSelected ? accentColor : Colors.black54,
                  ),
                ),
                const SizedBox(width: 16),

                // Text Content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? const Color(0xFF111111) : const Color(0xFF333333),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        description,
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF777777),
                          height: 1.3,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 24),
              ],
            ),

            // Top-Right Checkmark Badge
            Positioned(
              top: 0,
              right: 0,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? accentColor : Colors.transparent,
                  border: Border.all(
                    color: isSelected ? accentColor : const Color(0xFFCCCCCC),
                    width: 2,
                  ),
                ),
                child: isSelected
                    ? const Icon(
                        Icons.check,
                        size: 14,
                        color: Colors.white,
                      )
                    : null,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDotGrid() {
    return Column(
      children: List.generate(
        4,
        (row) => Row(
          children: List.generate(
            6,
            (col) => Container(
              margin: const EdgeInsets.all(2.5),
              width: 4,
              height: 4,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: Color(0xFFFF9E59),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
