import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.244.238.104:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  static String? currentToken;
  static Map<String, dynamic>? currentUser;

  static Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      UserCredential userCredential;

      if (kIsWeb) {
        final GoogleAuthProvider googleProvider = GoogleAuthProvider();
        userCredential = await FirebaseAuth.instance.signInWithPopup(googleProvider);
      } else {
        final GoogleSignInAccount googleUser = await GoogleSignIn.instance.authenticate();

        final GoogleSignInAuthentication googleAuth = googleUser.authentication;

        final OAuthCredential credential = GoogleAuthProvider.credential(
          idToken: googleAuth.idToken,
        );

        userCredential = await FirebaseAuth.instance.signInWithCredential(credential);
      }

      final user = userCredential.user;
      if (user != null) {
        // Post Google user to backend MongoDB database
        try {
          final response = await http.post(
            Uri.parse('$baseUrl/auth/google'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({
              'fullName': user.displayName ?? 'Google User',
              'email': user.email ?? '',
              'phone': user.phoneNumber ?? '',
              'profileImage': user.photoURL ?? '',
            }),
          ).timeout(const Duration(seconds: 5));

          final data = jsonDecode(response.body);
          if (response.statusCode == 200 && data['success'] == true) {
            currentToken = data['token'] as String?;
            currentUser = data['user'] as Map<String, dynamic>?;
            return {
              'success': true,
              'message': data['message'] ?? 'Signed in with Google (Synced to MongoDB)',
              'user': currentUser,
              'token': currentToken,
            };
          }
        } catch (e) {
          debugPrint('Backend MongoDB sync error: $e');
        }

        // Fallback local user data if backend is unreachable
        final userData = {
          'id': user.uid.hashCode,
          'user_id': user.uid.hashCode,
          'fullName': user.displayName ?? 'Google User',
          'full_name': user.displayName ?? 'Google User',
          'email': user.email ?? '',
          'phone': user.phoneNumber ?? '',
          'profileImage': user.photoURL ?? '',
          'profile_image': user.photoURL ?? '',
          'role': 'User',
          'created_at': DateTime.now().toIso8601String(),
        };

        currentUser = userData;
        currentToken = await user.getIdToken();

        return {
          'success': true,
          'message': 'Signed in with Google as ${user.displayName ?? user.email}',
          'user': userData,
          'token': currentToken,
        };
      }

      return {
        'success': false,
        'message': 'Failed to retrieve Google user credentials',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Google Sign-In failed: ${e.toString()}',
      };
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String fullName,
    required String phone,
  }) async {
    if (currentUser != null) {
      currentUser!['fullName'] = fullName;
      currentUser!['full_name'] = fullName;
      currentUser!['phone'] = phone;
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
      ).timeout(const Duration(seconds: 5));

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
        return {
          'success': false,
          'message': msg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Unable to connect to backend server. Make sure backend is running on http://localhost:5000.',
      };
    }
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 5));

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
        return {
          'success': false,
          'message': msg,
        };
      }
    } catch (e) {
      return {
        'success': false,
        'message': 'Unable to connect to backend server. Make sure backend is running on http://localhost:5000.',
      };
    }
  }

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

  static void logout() {
    currentToken = null;
    currentUser = null;
  }
}
