import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/primary_button.dart';
import '../widgets/social_login_button.dart';
import '../services/auth_service.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';
import 'home_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _obscurePassword = true;
  bool _isLoading = false;

  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<Offset> _slideAnim;

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

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _slideAnim = Tween<Offset>(
      begin: const Offset(0, 0.04),
      end: Offset.zero,
    ).animate(CurvedAnimation(parent: _animController, curve: Curves.easeOutQuad));

    _animController.forward();
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  void _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty) {
      _showSnackBar('Please enter your email');
      return;
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(email)) {
      _showSnackBar('Please enter a valid email');
      return;
    }
    if (password.isEmpty) {
      _showSnackBar('Please enter your password');
      return;
    }
    if (password.length < 8) {
      _showSnackBar('Password must contain at least 8 characters');
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService.login(email, password);

    if (mounted) {
      setState(() => _isLoading = false);
      _showSnackBar(result['message'] as String);
      if (result['success'] == true) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const HomeScreen()),
        );
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.primaryBlack,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final media = MediaQuery.of(context);
    final isDesktopOrWeb = media.size.width > 600;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── Layer 1: Responsive Full-Screen Background Image (loginbg.png) ──
          Positioned.fill(
            child: Image.asset(
              'assets/images/loginbg.png',
              fit: BoxFit.cover,
              alignment: Alignment.topCenter,
              errorBuilder: (_, __, ___) => Container(color: AppColors.background),
            ),
          ),

          // ── Layer 2: Centered Responsive Form Content ──
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                return SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Center(
                    child: ConstrainedBox(
                      constraints: BoxConstraints(
                        maxWidth: isDesktopOrWeb ? 450 : double.infinity,
                        minHeight: constraints.maxHeight,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 24),
                        child: FadeTransition(
                          opacity: _fadeAnim,
                          child: SlideTransition(
                            position: _slideAnim,
                            child: Form(
                              key: _formKey,
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // ── Top Navigation Row (Back Arrow) ──
                                  Padding(
                                    padding: const EdgeInsets.only(top: 8, bottom: 12),
                                    child: GestureDetector(
                                      onTap: () => Navigator.maybePop(context),
                                      child: Container(
                                        padding: const EdgeInsets.all(6),
                                        color: Colors.transparent,
                                        child: const Icon(
                                          Icons.arrow_back_ios_new,
                                          size: 18,
                                          color: Color(0xFF222222),
                                        ),
                                      ),
                                    ),
                                  ),

                                  // ── Header Text Section ──
                                  const Padding(
                                    padding: EdgeInsets.only(left: 2),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'Welcome Back! 👋',
                                          style: TextStyle(
                                            fontSize: 28,
                                            fontWeight: FontWeight.w800,
                                            color: Color(0xFF111111),
                                            letterSpacing: -0.3,
                                          ),
                                        ),
                                        SizedBox(height: 6),
                                        Text(
                                          'Login to continue\nto SportVerse AI',
                                          style: TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.w400,
                                            color: AppColors.secondaryText,
                                            height: 1.4,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                  const SizedBox(height: 24),

                                  // ── Email Input Field ──
                                  CustomTextField(
                                    controller: _emailController,
                                    hintText: 'Email Address',
                                    prefixIcon: Icons.email_outlined,
                                    keyboardType: TextInputType.emailAddress,
                                  ),

                                  const SizedBox(height: 12),

                                  // ── Password Input Field ──
                                  CustomTextField(
                                    controller: _passwordController,
                                    hintText: 'Password',
                                    prefixIcon: Icons.lock_outline,
                                    obscureText: _obscurePassword,
                                    suffixIcon: GestureDetector(
                                      onTap: () => setState(
                                          () => _obscurePassword = !_obscurePassword),
                                      child: Icon(
                                        _obscurePassword
                                            ? Icons.visibility_outlined
                                            : Icons.visibility_off_outlined,
                                        size: 18,
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 8),

                                  // ── Forgot Password Link ──
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: GestureDetector(
                                      onTap: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) =>
                                                const ForgotPasswordScreen()),
                                      ),
                                      child: const Text(
                                        'Forgot Password?',
                                        style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color: AppColors.warmAccent,
                                        ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 20),

                                  // ── Primary Black Log In Button ──
                                  PrimaryButton(
                                    text: 'Log In',
                                    isLoading: _isLoading,
                                    onPressed: _handleLogin,
                                  ),

                                  const SizedBox(height: 18),

                                  // ── Divider Text ──
                                  const Center(
                                    child: Text(
                                      'or continue with',
                                      style: TextStyle(
                                        fontSize: 10,
                                        color: Color(0xFF777777),
                                        fontWeight: FontWeight.w400,
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 16),

                                  // ── Social Login Option 1: Google ──
                                  SocialLoginButton(
                                    text: 'Continue with Google',
                                    assetName: 'assets/images/google_logo.png',
                                    fallbackIcon: const Text(
                                      'G',
                                      style: TextStyle(
                                        fontSize: 18,
                                        fontWeight: FontWeight.bold,
                                        color: Color(0xFF4285F4),
                                      ),
                                    ),
                                    onPressed: () => _showSnackBar(
                                        'Google login will be available soon.'),
                                  ),

                                  const SizedBox(height: 10),

                                  // ── Social Login Option 2: Apple ──
                                  SocialLoginButton(
                                    text: 'Continue with Apple',
                                    assetName: 'assets/images/apple_logo.png',
                                    fallbackIcon: const Icon(
                                      Icons.apple,
                                      size: 20,
                                      color: Colors.black,
                                    ),
                                    onPressed: () => _showSnackBar(
                                        'Apple login will be available soon.'),
                                  ),

                                  const SizedBox(height: 22),

                                  // ── Create Account Navigation Link ──
                                  Center(
                                    child: GestureDetector(
                                      onTap: () => Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                            builder: (_) => const RegisterScreen()),
                                      ),
                                      child: const Text.rich(
                                        TextSpan(
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: Color(0xFF777777),
                                          ),
                                          children: [
                                            TextSpan(text: "Don't have an account? "),
                                            TextSpan(
                                              text: 'Create Account',
                                              style: TextStyle(
                                                color: AppColors.warmAccent,
                                                fontWeight: FontWeight.w700,
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  ),

                                  const SizedBox(height: 60),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
