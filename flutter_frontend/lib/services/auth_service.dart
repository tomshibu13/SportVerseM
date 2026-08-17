import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint, debugPrintStack;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import 'package:google_sign_in/google_sign_in.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Google Sign-In Architecture:
//
//   Flutter (Web)     → GIS SDK renderButton() → authenticationEvents stream
//   Flutter (Android) → GoogleSignIn.instance.authenticate() → ID token
//
//   Both paths → POST /api/auth/google { idToken } → Node.js verifies with
//   Google tokeninfo API → creates/finds user in MongoDB → returns JWT
//
// Web IMPORTANT:
//   google_sign_in_web 1.1.3 does NOT support authenticate().
//   supportsAuthenticate() returns false on web.
//   On web, use renderButton() from google_sign_in_web/web_only.dart.
//   The Web client ID is read from the meta tag in web/index.html —
//   do NOT pass serverClientId to initialize() on web.
// ─────────────────────────────────────────────────────────────────────────────

class AuthService {
  // ── Base URL ──────────────────────────────────────────────────────────────
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return dotenv.env['ANDROID_API_URL'] ?? 'http://192.168.57.228:5000/api';
    }
    return dotenv.env['API_URL'] ?? 'http://localhost:5000/api';
  }

  static String? currentToken;
  static Map<String, dynamic>? currentUser;

  // ── Profile Update ────────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String phone,
    String? location,
    String? favoriteSport,
    String? bio,
    String? role,
  }) async {
    if (currentUser != null) {
      currentUser!['fullName'] = fullName;
      currentUser!['full_name'] = fullName;
      currentUser!['phone'] = phone;
      if (location != null) currentUser!['location'] = location;
      if (favoriteSport != null) currentUser!['favoriteSport'] = favoriteSport;
      if (bio != null) currentUser!['bio'] = bio;
      if (role != null) currentUser!['role'] = role;
    }
    if (currentToken == null) {
      return {'success': true, 'message': 'Profile updated locally'};
    }
    try {
      final response = await http.put(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $currentToken',
        },
        body: jsonEncode({
          'fullName': fullName,
          'phone': phone,
          if (location != null) 'location': location,
          if (favoriteSport != null) 'favoriteSport': favoriteSport,
          if (bio != null) 'bio': bio,
          if (role != null) 'role': role,
        }),
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200 && data['success'] == true) {
        currentUser = data['user'] as Map<String, dynamic>? ?? currentUser;
        return {'success': true, 'message': 'Profile updated in MongoDB successfully'};
      }
      return {'success': false, 'message': data['message'] ?? 'Failed to update profile'};
    } catch (e) {
      return {'success': true, 'message': 'Profile updated locally'};
    }
  }

  // ── Email/Password Register ───────────────────────────────────────────────
  static Future<Map<String, dynamic>> register({
    required String fullName,
    required String email,
    required String password,
    required String confirmPassword,
    String? phone,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'fullName': fullName,
          'email': email,
          'password': password,
          'confirmPassword': confirmPassword,
          'phone': phone ?? '',
        }),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 201) {
        currentToken = data['token'] as String?;
        currentUser = data['user'] as Map<String, dynamic>?;
        return {
          'success': true,
          'message': data['message'] ?? 'Registration successful',
          'data': data,
        };
      } else {
        String msg = data['message'] ?? 'Registration failed';
        if (data['errors'] != null && (data['errors'] as List).isNotEmpty) {
          msg = (data['errors'] as List).map((e) => e['message']).join('. ');
        }
        return {'success': false, 'message': msg};
      }
    } catch (e) {
      debugPrint('AuthService Register Exception: $e');
      return {
        'success': false,
        'message': 'Unable to connect to backend server. Exception: $e',
      };
    }
  }

  // ── Email/Password Login ──────────────────────────────────────────────────
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        currentToken = data['token'] as String?;
        currentUser = data['user'] as Map<String, dynamic>?;
        return {
          'success': true,
          'message': data['message'] ?? 'Login successful',
          'data': data,
        };
      } else {
        String msg = data['message'] ?? 'Invalid email or password';
        if (data['errors'] != null && (data['errors'] as List).isNotEmpty) {
          msg = (data['errors'] as List).map((e) => e['message']).join('. ');
        }
        return {'success': false, 'message': msg};
      }
    } catch (e) {
      debugPrint('AuthService Login Exception: $e');
      return {
        'success': false,
        'message': 'Unable to connect to backend server. Exception: $e',
      };
    }
  }

  // ── Google OAuth 2.0 ─────────────────────────────────────────────────────
  //
  // PLATFORM BEHAVIOUR:
  //   Android → authenticate() works → returns account → get idToken → POST backend
  //   Web     → authenticate() THROWS (unsupported by GIS SDK)
  //             Use AuthService.renderGoogleSignInButton() in the UI instead.
  //             authenticationEvents stream fires on button click → calls _handleGoogleAccount()
  //   Windows → not supported → returns error message

  static bool _isGoogleSignInInitialized = false;

  /// Call once at app startup (or lazily on first use).
  /// Safe to call multiple times — subsequent calls are no-ops.
  static Future<void> initGoogleSignIn() async {
    if (_isGoogleSignInInitialized) return;
    try {
      if (kIsWeb) {
        // Web: client ID is read from <meta name="google-signin-client_id">
        // in web/index.html. Do NOT pass serverClientId — it is explicitly
        // unsupported by google_sign_in_web and throws an assertion error.
        await GoogleSignIn.instance.initialize();
      } else {
        // Android/iOS: serverClientId (Web OAuth client ID) is required
        // to obtain a valid idToken for backend verification.
        // Use the WEB client ID, NOT the Android client ID.
        await GoogleSignIn.instance.initialize(
          serverClientId: dotenv.env['GOOGLE_SERVER_CLIENT_ID'] ??
              '476540604651-g3n2051unc5cq4ols1d8dcp1gn45082c.apps.googleusercontent.com',
        );
      }
      _isGoogleSignInInitialized = true;
      debugPrint('AuthService: Google Sign-In initialized (platform: ${kIsWeb ? "web" : "native"})');
    } catch (e) {
      // On hot-restart, the Dart static bool resets but JS-side stays alive.
      // "already been called" is a no-op — mark as initialized and continue.
      if (e.toString().contains('already been called') ||
          e.toString().contains('already initialized')) {
        _isGoogleSignInInitialized = true;
        debugPrint('AuthService: Google Sign-In was already initialized (hot-restart safe)');
      } else {
        debugPrint('AuthService: Google Sign-In initialization failed: $e');
        rethrow;
      }
    }
  }

  /// Android/iOS only: trigger the Google sign-in popup, get the account,
  /// extract the idToken, post to Node.js backend, return JWT result map.
  ///
  /// On Web: returns an error — use renderGoogleSignInButton() in the UI.
  static Future<Map<String, dynamic>> signInWithGoogle({String role = 'User'}) async {
    // Windows Desktop: not supported at all
    if (!kIsWeb && Platform.isWindows) {
      return {
        'success': false,
        'message': 'Google Sign-In is not supported on Windows Desktop. Use Chrome or Android.',
      };
    }

    // Web: google_sign_in_web does NOT support authenticate().
    // The UI must use renderGoogleSignInButton() which triggers the GIS flow.
    if (kIsWeb) {
      return {
        'success': false,
        'message': 'On Web, use the Google Sign-In button rendered by the SDK. '
            'Call AuthService.initGoogleSignIn() and listen to authenticationEvents.',
      };
    }

    try {
      await initGoogleSignIn();

      // Verify this platform supports the authenticate() call
      if (!GoogleSignIn.instance.supportsAuthenticate()) {
        return {
          'success': false,
          'message': 'Google Sign-In authenticate() is not supported on this platform.',
        };
      }

      // Sign out first to ensure fresh account picker always shows
      try {
        await GoogleSignIn.instance.signOut();
      } catch (_) {
        // ignore signOut errors — not fatal
      }

      // Step 1: Trigger Google OAuth 2.0 consent screen
      final GoogleSignInAccount googleUser =
          await GoogleSignIn.instance.authenticate();

      // Step 2: Get the ID token from Google
      final GoogleSignInAuthentication googleAuth = googleUser.authentication;
      final String? idToken = googleAuth.idToken;

      if (idToken == null) {
        return {
          'success': false,
          'message': 'Failed to get Google ID token. '
              'Ensure the Web Client ID is set as serverClientId.',
        };
      }

      // Step 3: Send ID token to Node.js → verify → get JWT
      return await _sendGoogleTokenToBackend(idToken: idToken, role: role);
    } catch (e, stackTrace) {
      debugPrint('AuthService Google Login Exception: $e');
      debugPrintStack(stackTrace: stackTrace, label: 'Google Sign-In');
      return {
        'success': false,
        'message': 'Google Sign-In failed: $e',
      };
    }
  }

  /// Called from the web authentication event listener after the GIS SDK button
  /// triggers a successful sign-in. Extract idToken and post to backend.
  static Future<Map<String, dynamic>> handleWebGoogleSignIn({
    required GoogleSignInAccount account,
    String role = 'User',
  }) async {
    try {
      final GoogleSignInAuthentication auth = account.authentication;
      final String? idToken = auth.idToken;

      if (idToken == null) {
        return {
          'success': false,
          'message': 'Google Sign-In: No ID token received from GIS SDK.',
        };
      }

      return await _sendGoogleTokenToBackend(idToken: idToken, role: role);
    } catch (e, stackTrace) {
      debugPrint('AuthService Web Google Sign-In Exception: $e');
      debugPrintStack(stackTrace: stackTrace, label: 'Web Google Sign-In');
      return {
        'success': false,
        'message': 'Google Sign-In failed: $e',
      };
    }
  }

  /// Shared: POST the Google idToken to Node.js backend.
  /// Node.js verifies via oauth2.googleapis.com/tokeninfo → creates/finds
  /// MongoDB user → returns JWT.
  static Future<Map<String, dynamic>> _sendGoogleTokenToBackend({
    required String idToken,
    String role = 'User',
  }) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/google'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'idToken': idToken, 'role': role}),
      ).timeout(const Duration(seconds: 15));

      final data = jsonDecode(response.body);

      if (response.statusCode == 200 && data['success'] == true) {
        currentToken = data['token'] as String?;
        currentUser = data['user'] as Map<String, dynamic>?;
        return {
          'success': true,
          'message': data['message'] ?? 'Google login successful',
          'data': data,
        };
      } else {
        return {
          'success': false,
          'message': data['message'] ?? 'Google login failed on backend',
        };
      }
    } catch (e, stackTrace) {
      debugPrint('AuthService Backend Google Token Exception: $e');
      debugPrintStack(stackTrace: stackTrace, label: 'Backend Google Token');
      return {
        'success': false,
        'message': 'Failed to connect to backend: $e',
      };
    }
  }

  // ── Get Current User ──────────────────────────────────────────────────────
  static Future<Map<String, dynamic>> getMe() async {
    if (currentToken == null) {
      return {'success': false, 'message': 'No auth token found'};
    }
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/auth/me'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $currentToken',
        },
      ).timeout(const Duration(seconds: 5));

      final data = jsonDecode(response.body);
      if (response.statusCode == 200) {
        currentUser = data['user'] as Map<String, dynamic>?;
        return {'success': true, 'user': currentUser};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Failed to fetch profile'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  static void logout() {
    currentToken = null;
    currentUser = null;
  }
}
