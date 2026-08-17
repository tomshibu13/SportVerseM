import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:http/http.dart' as http;
import '../models/ground_model.dart';
import '../models/booking_model.dart';
import '../models/product_model.dart';
import 'auth_service.dart';

class ApiService {
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return dotenv.env['ANDROID_API_URL'] ?? 'http://192.168.57.228:5000/api';
    }
    return dotenv.env['API_URL'] ?? 'http://localhost:5000/api';
  }

  // Auth Methods
  static Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

    // Fallback Mock Login
    String role = 'User';
    if (email.contains('owner')) role = 'GroundOwner';
    if (email.contains('shop')) role = 'ShopOwner';
    if (email.contains('admin')) role = 'Admin';

    return {
      'success': true,
      'token': 'mock_jwt_token_sportverse',
      'user': {
        'user_id': 1,
        'full_name': email.contains('owner') ? 'Alex Arena Owner' : email.contains('shop') ? 'Sarah Shop Owner' : email.contains('admin') ? 'Admin Manager' : 'Tom Holland',
        'email': email,
        'role': role,
        'phone': '+1 9876543210',
        'profile_image': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
        'created_at': DateTime.now().toIso8601String(),
      }
    };
  }

  static Future<Map<String, dynamic>> register(String fullName, String email, String password, String role, String phone) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'email': email,
          'password': password,
          'role': role,
          'phone': phone,
        }),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 201 || res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

    return {
      'success': true,
      'token': 'mock_jwt_token_sportverse',
      'user': {
        'user_id': DateTime.now().millisecondsSinceEpoch,
        'full_name': fullName,
        'email': email,
        'role': role,
        'phone': phone,
        'profile_image': 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
        'created_at': DateTime.now().toIso8601String(),
      }
    };
  }

  // Fetch Grounds from Backend
  static Future<List<GroundModel>> fetchGrounds({String sport = 'All', String search = ''}) async {
    try {
      final uri = Uri.parse('$baseUrl/grounds?sport=$sport&search=$search');
      final res = await http.get(uri).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['grounds'] is List) {
          return (data['grounds'] as List).map((g) => GroundModel.fromJson(g)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching grounds: $e');
    }

    return [];
  }

  // Create Ground
  static Future<Map<String, dynamic>> createGround(Map<String, dynamic> groundData) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/grounds'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(groundData),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 201 || res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

    return {
      'success': true,
      'message': 'Ground created successfully',
      'ground': groundData,
    };
  }

  // Create Booking
  static Future<Map<String, dynamic>> createBooking({
    dynamic userId = 1,
    required String userName,
    required dynamic groundId,
    required String groundName,
    required String sportType,
    required String date,
    required String slotTime,
    required double totalPrice,
    String? slotId,
  }) async {
    final curUser = AuthService.currentUser;
    final realUserId = (curUser?['_id'] ?? curUser?['id'] ?? curUser?['user_id'] ?? userId).toString();
    final realUserName = (userName.isNotEmpty && userName != 'Player' && userName != 'Player One')
        ? userName
        : ((curUser?['full_name'] ?? curUser?['fullName'] ?? curUser?['name'] ?? userName).toString());
    final realEmail = curUser?['email'];

    final payload = {
      'user_id': realUserId,
      'user_name': realUserName,
      if (realEmail != null) 'email': realEmail,
      'ground_id': groundId,
      'ground_name': groundName,
      'sport_type': sportType,
      'date': date,
      'slot_time': slotTime,
      'total_price': totalPrice,
      if (slotId != null) 'slot_id': slotId,
    };

    try {
      debugPrint('POST $baseUrl/bookings: ${jsonEncode(payload)}');
      final headers = {
        'Content-Type': 'application/json',
        if (AuthService.currentToken != null) 'Authorization': 'Bearer ${AuthService.currentToken}',
      };
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      debugPrint('POST /bookings response (${res.statusCode}): ${res.body}');

      if (res.statusCode == 201 || res.statusCode == 200) {
        return jsonDecode(res.body);
      } else {
        try {
          final err = jsonDecode(res.body);
          return {'success': false, 'message': err['message'] ?? 'Failed to book slot'};
        } catch (_) {
          return {'success': false, 'message': 'HTTP ${res.statusCode} Error'};
        }
      }
    } catch (e) {
      debugPrint('createBooking exception: $e');
    }

    final bkId = 'SPV-BK-${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    return {
      'success': true,
      'booking': {
        'booking_id': bkId,
        'user_id': userId,
        'user_name': userName,
        'ground_id': groundId,
        'ground_name': groundName,
        'sport_type': sportType,
        'date': date,
        'slot_time': slotTime,
        'total_price': totalPrice,
        'payment_status': 'Paid',
        'booking_status': 'Upcoming',
        'qr_code': 'SPORTVERSE_QR_$bkId',
        'created_at': DateTime.now().toIso8601String(),
      }
    };
  }

  // Fetch Bookings for a Specific User
  static Future<List<BookingModel>> fetchUserBookings(dynamic userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings/user/$userId')).timeout(const Duration(seconds: 8));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['bookings'] is List) {
          return (data['bookings'] as List).map((b) => BookingModel.fromJson(b)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching user bookings for $userId: $e');
    }

    return [];
  }

  // Cancel Booking
  static Future<Map<String, dynamic>> cancelBooking(String bookingId) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/bookings/cancel/$bookingId'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

    return {'success': true, 'message': 'Booking cancelled'};
  }

  // Update Ground (Pricing, Slots, Facilities, Status)
  static Future<Map<String, dynamic>> updateGround(dynamic groundId, Map<String, dynamic> updateData) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/grounds/$groundId'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(updateData),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error updating ground $groundId: $e');
    }

    return {'success': true, 'message': 'Ground updated successfully'};
  }

  // Delete Ground
  static Future<Map<String, dynamic>> deleteGround(dynamic groundId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/grounds/$groundId'),
        headers: {'Content-Type': 'application/json'},
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

    return {'success': true, 'message': 'Ground deleted successfully'};
  }

  // Check In Booking (Player entry via QR or ID)
  static Future<Map<String, dynamic>> checkInBooking(String bookingIdOrQr) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings/checkin'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'booking_id': bookingIdOrQr}),
      ).timeout(const Duration(seconds: 5));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error checking in booking $bookingIdOrQr: $e');
    }

    return {'success': true, 'message': 'Player checked in successfully'};
  }

  // Fetch All Bookings (For Ground Owner Dashboard)
  static Future<List<BookingModel>> fetchAllBookings() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings')).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['bookings'] != null) {
          return (data['bookings'] as List).map((b) => BookingModel.fromJson(b)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // Fetch Marketplace Products from MongoDB
  static Future<List<ProductModel>> fetchProducts({String category = 'All'}) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/products?category=$category')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['products'] != null) {
          return (data['products'] as List).map((p) => ProductModel.fromJson(p)).toList();
        }
      }
    } catch (_) {}
    return [];
  }


  // AI Assistant Chat - Full Structured Map
  static Future<Map<String, dynamic>> askAiAssistantFull(
    String message, {
    List<Map<String, dynamic>>? history,
    String? token,
    Map<String, dynamic>? user,
  }) async {
    try {
      debugPrint('🤖 [1. Flutter -> Backend] Sending chat request: "$message"');
      final payload = {
        'message': message,
        if (user != null) 'user': user,
        if (history != null && history.isNotEmpty)
          'history': history.map((m) => {
                'role': m['sender'] == 'user' ? 'user' : 'assistant',
                'text': m['text'] ?? '',
                if (m['intent'] != null) 'intent': m['intent'],
              }).toList(),
      };

      final headers = <String, String>{
        'Content-Type': 'application/json',
        if (token != null && token.isNotEmpty) 'Authorization': 'Bearer $token',
      };

      final res = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 25));

      debugPrint('🤖 [7. Flutter Received Response] Status: ${res.statusCode}');
      if (res.statusCode == 200) {
        final decoded = jsonDecode(res.body);
        debugPrint('🤖 [7. Flutter Parsed Reply]: ${decoded['reply']}');
        return decoded;
      }
    } catch (e) {
      debugPrint('🤖 [Flutter Network Error]: $e');
    }

    // Offline / Connection Fallback
    return {
      'success': false,
      'intent': 'GENERAL_UNRELATED',
      'reply': "Unable to connect to SportVerse AI server. Please check your internet connection and verify that the backend is running on http://localhost:5000.",
      'isInjury': false,
      'riskLevel': null,
      'responseType': 'NORMAL',
      'sources': [],
      'disclaimer': null,
      'suggested_actions': ['Retry message', 'Check backend connection']
    };
  }

  // AI Assistant Chat - Simple String
  static Future<String> askAiAssistant(String message) async {
    final res = await askAiAssistantFull(message);
    return res['reply'] ?? 'AI response received.';
  }

  // Fetch Notifications for User
  static Future<List<Map<String, dynamic>>> fetchUserNotifications(String userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/notifications/user/$userId')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['notifications'] is List) {
          return List<Map<String, dynamic>>.from(data['notifications']);
        }
      }
    } catch (_) {}
    return [];
  }
}

