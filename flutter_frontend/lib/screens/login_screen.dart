import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/primary_button.dart';
import '../services/auth_service.dart';
import 'forgot_password_screen.dart';
import 'register_screen.dart';
import 'home_screen.dart';
import 'role_selection_screen.dart';

// Web-only import for GIS SDK renderButton()
import '../services/stub_google_sign_in_web.dart'
    if (dart.library.js_interop) 'package:google_sign_in_web/web_only.dart'
    as google_sign_in_web;
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

    // Initialize Google Sign-In once. Safe to call multiple times.
    AuthService.initGoogleSignIn().then((_) {
      if (kIsWeb && mounted) {
        // On web, listen to GIS SDK authentication events (triggered by renderButton)
        GoogleSignIn.instance.authenticationEvents
            .listen(_handleWebGoogleSignIn)
            .onError((Object e) {
          debugPrint('Google authenticationEvents error: $e');
        });
      }
    });
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

  /// Called by the GIS SDK authenticationEvents stream on Web after
  /// the user completes the Google Sign-In button flow.
  Future<void> _handleWebGoogleSignIn(GoogleSignInAuthenticationEvent event) async {
    if (event is GoogleSignInAuthenticationEventSignIn) {
      setState(() => _isLoading = true);
      final result = await AuthService.handleWebGoogleSignIn(account: event.user);
      if (mounted) {
        setState(() => _isLoading = false);
        _showSnackBar(result['message'] as String);
        if (result['success'] == true) {
          final isNewUser = result['data']?['isNewUser'] == true;
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(
              builder: (_) => isNewUser ? const RoleSelectionScreen() : const HomeScreen(),
            ),
          );
        }
      }
    }
  }

  void _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty) {
      _showSnackBar('Please enter your email');
      return;
    }
    final emailRegex = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
    if (!emailRegex.hasMatch(email)) {
      _showSnackBar('Please enter a valid email address');
      return;
    }
    if (password.isEmpty) {
      _showSnackBar('Please enter your password');
      return;
    }
    if (password.length < 6) {
      _showSnackBar('Password must contain at least 6 characters');
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
                  child: ConstrainedBox(
                    constraints: BoxConstraints(
                      minHeight: constraints.maxHeight,
                      minWidth: constraints.maxWidth,
                    ),
                    child: Center(
                      child: ConstrainedBox(
                        constraints: BoxConstraints(
                          maxWidth: isDesktopOrWeb ? 450 : double.infinity,
                        ),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
                          child: FadeTransition(
                            opacity: _fadeAnim,
                            child: SlideTransition(
                              position: _slideAnim,
                              child: Form(
                                key: _formKey,
                                child: Column(
                                  mainAxisSize: MainAxisSize.min,
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // ── Top Navigation Row (Back Arrow) ──
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 12),
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
                                            'Welcome Back!',
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

                                    // ── Google Sign-In ──────────────────────
                                    if (kIsWeb)
                                      SizedBox(
                                        height: 52,
                                        width: double.infinity,
                                        child: google_sign_in_web.renderButton(),
                                      )
                                    else
                                      SizedBox(
                                        width: double.infinity,
                                        height: 52,
                                        child: OutlinedButton.icon(
                                          onPressed: _isLoading ? null : () async {
                                            final navigator = Navigator.of(context);
                                            setState(() => _isLoading = true);
                                            final result = await AuthService.signInWithGoogle();
                                            if (!mounted) return;
                                            setState(() => _isLoading = false);
                                            _showSnackBar(result['message'] as String);
                                            if (result['success'] == true) {
                                              final isNewUser = result['data']?['isNewUser'] == true;
                                              navigator.pushReplacement(
                                                MaterialPageRoute(
                                                  builder: (_) => isNewUser ? const RoleSelectionScreen() : const HomeScreen(),
                                                ),
                                              );
                                            }
                                          },
                                          style: OutlinedButton.styleFrom(
                                            backgroundColor: Colors.white,
                                            side: const BorderSide(color: AppColors.border),
                                            shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(12)),
                                          ),
                                          icon: Image.asset('assets/images/google_logo.png', height: 24),
                                          label: const Text(
                                            'Continue with Google',
                                            style: TextStyle(
                                              color: AppColors.primaryBlack,
                                              fontWeight: FontWeight.w600,
                                              fontSize: 15,
                                            ),
                                          ),
                                        ),
                                      ),

                                    const SizedBox(height: 16),

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
                                  ],
                                ),
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
