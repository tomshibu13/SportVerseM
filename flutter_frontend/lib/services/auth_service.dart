import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;

class AuthService {
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.244.238.104:5000/api';
    }
    return 'http://localhost:5000/api';
  }
  static String? currentToken;
  static Map<String, dynamic>? currentUser;

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
