import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_sign_in/google_sign_in.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_text_field.dart';
import '../widgets/primary_button.dart';
import '../services/auth_service.dart';
import 'role_selection_screen.dart';
import 'login_screen.dart';
import 'home_screen.dart';

// Web-only import for GIS SDK renderButton()
import '../services/stub_google_sign_in_web.dart'
    if (dart.library.js_interop) 'package:google_sign_in_web/web_only.dart'
    as google_sign_in_web;

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _agreedToTerms = true;
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

    AuthService.initGoogleSignIn().then((_) {
      if (kIsWeb && mounted) {
        GoogleSignIn.instance.authenticationEvents
            .listen(_handleWebGoogleSignIn)
            .onError((Object e) {
          debugPrint('Google authenticationEvents error: $e');
        });
      }
    });
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleWebGoogleSignIn(GoogleSignInAuthenticationEvent event) async {
    if (event is GoogleSignInAuthenticationEventSignIn) {
      if (!_agreedToTerms) {
        _showSnackBar('Please accept the Terms & Conditions');
        return;
      }
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

  String? _validatePassword(String password) {
    if (password.isEmpty) {
      return 'Please enter a password';
    }
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!RegExp(r'[A-Z]').hasMatch(password)) {
      return 'Password must contain at least one uppercase letter (A-Z)';
    }
    if (!RegExp(r'[a-z]').hasMatch(password)) {
      return 'Password must contain at least one lowercase letter (a-z)';
    }
    if (!RegExp(r'\d').hasMatch(password)) {
      return 'Password must contain at least one number (0-9)';
    }
    if (!RegExp(r'[@$!%*?&#]').hasMatch(password)) {
      return r'Password must contain at least one special character (@$!%*?&#)';
    }
    return null;
  }

  void _handleRegister() async {
    final name = _fullNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final password = _passwordController.text.trim();
    final confirm = _confirmPasswordController.text.trim();

    if (name.isEmpty) {
      _showSnackBar('Please enter your full name');
      return;
    }
    if (email.isEmpty || !email.contains('@')) {
      _showSnackBar('Please enter a valid email address');
      return;
    }
    if (phone.isEmpty) {
      _showSnackBar('Please enter your phone number');
      return;
    }

    final passwordError = _validatePassword(password);
    if (passwordError != null) {
      _showSnackBar(passwordError);
      return;
    }

    if (password != confirm) {
      _showSnackBar('Passwords do not match');
      return;
    }
    if (!_agreedToTerms) {
      _showSnackBar('Please accept the Terms & Conditions');
      return;
    }

    setState(() => _isLoading = true);

    final result = await AuthService.register(
      fullName: name,
      email: email,
      password: password,
      confirmPassword: confirm,
      phone: phone,
    );

    if (mounted) {
      setState(() => _isLoading = false);
      _showSnackBar(result['message'] as String);
      if (result['success'] == true) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const RoleSelectionScreen()),
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
          // ── Layer 1: Responsive Cover Background Image (regbg.png) ──
          Positioned.fill(
            child: Image.asset(
              'assets/images/regbg.png',
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

                              // ── Title & Subtitle ──
                              const Padding(
                                padding: EdgeInsets.only(left: 2),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'Create Account',
                                      style: TextStyle(
                                        fontSize: 28,
                                        fontWeight: FontWeight.w700,
                                        color: Color(0xFF111111),
                                        letterSpacing: -0.3,
                                      ),
                                    ),
                                    SizedBox(height: 6),
                                    Text(
                                      'Join SportVerse AI and start your sports journey',
                                      style: TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w400,
                                        color: AppColors.secondaryText,
                                      ),
                                    ),
                                  ],
                                ),
                              ),

                              const SizedBox(height: 24),

                              // ── Form Fields Section ──
                              CustomTextField(
                                controller: _fullNameController,
                                hintText: 'Full Name',
                                prefixIcon: Icons.person_outline,
                              ),
                              const SizedBox(height: 12),
                              CustomTextField(
                                controller: _emailController,
                                hintText: 'Email Address',
                                prefixIcon: Icons.email_outlined,
                                keyboardType: TextInputType.emailAddress,
                              ),
                              const SizedBox(height: 12),
                              CustomTextField(
                                controller: _phoneController,
                                hintText: 'Phone Number',
                                prefixIcon: Icons.phone_outlined,
                                keyboardType: TextInputType.phone,
                              ),
                              const SizedBox(height: 12),
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
                              const SizedBox(height: 12),
                              CustomTextField(
                                controller: _confirmPasswordController,
                                hintText: 'Confirm Password',
                                prefixIcon: Icons.lock_outline,
                                obscureText: _obscureConfirmPassword,
                                suffixIcon: GestureDetector(
                                  onTap: () => setState(() =>
                                      _obscureConfirmPassword = !_obscureConfirmPassword),
                                  child: Icon(
                                    _obscureConfirmPassword
                                        ? Icons.visibility_outlined
                                        : Icons.visibility_off_outlined,
                                    size: 18,
                                    color: AppColors.secondaryText,
                                  ),
                                ),
                              ),

                              const SizedBox(height: 16),

                              // ── Terms & Privacy Checkbox ──
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.center,
                                children: [
                                  SizedBox(
                                    width: 20,
                                    height: 20,
                                    child: Checkbox(
                                      value: _agreedToTerms,
                                      activeColor: AppColors.primaryBlack,
                                      checkColor: Colors.white,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      side: const BorderSide(
                                          color: AppColors.border, width: 1.2),
                                      onChanged: (v) =>
                                          setState(() => _agreedToTerms = v ?? false),
                                    ),
                                  ),
                                  const SizedBox(width: 10),
                                  const Expanded(
                                    child: Text.rich(
                                      TextSpan(
                                        style: TextStyle(
                                          fontSize: 11,
                                          color: AppColors.secondaryText,
                                        ),
                                        children: [
                                          TextSpan(text: 'I agree to the '),
                                          TextSpan(
                                            text: 'Terms & Conditions',
                                            style: TextStyle(
                                              color: AppColors.warmAccent,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                          TextSpan(text: ' and '),
                                          TextSpan(
                                            text: 'Privacy Policy',
                                            style: TextStyle(
                                              color: AppColors.warmAccent,
                                              fontWeight: FontWeight.w700,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),

                              const SizedBox(height: 22),

                              // ── Create Account Primary Button ──
                              PrimaryButton(
                                text: 'Create Account',
                                isLoading: _isLoading,
                                onPressed: _handleRegister,
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
                                      if (!_agreedToTerms) {
                                        _showSnackBar('Please accept the Terms & Conditions');
                                        return;
                                      }
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
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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

                              // ── Log In Link ──
                              Center(
                                child: GestureDetector(
                                  onTap: () => Navigator.pushReplacement(
                                    context,
                                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                                  ),
                                  child: const Text.rich(
                                    TextSpan(
                                      style: TextStyle(
                                        fontSize: 11,
                                        color: Color(0xFF777777),
                                      ),
                                      children: [
                                        TextSpan(text: 'Already have an account? '),
                                        TextSpan(
                                          text: 'Log In',
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
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
