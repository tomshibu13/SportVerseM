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
      return dotenv.env['ANDROID_API_URL'] ?? 'http://10.244.238.104:5000/api';
    }
    return dotenv.env['API_URL'] ?? 'http://localhost:5000/api';
  }

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (AuthService.currentToken != null && AuthService.currentToken!.isNotEmpty)
      'Authorization': 'Bearer ${AuthService.currentToken}',
  };

  // Auth Methods
  static Future<Map<String, dynamic>> login(String email, String password) async {
    return await AuthService.login(email, password);
  }

  static Future<Map<String, dynamic>> register(String fullName, String email, String password, String role, String phone) async {
    return await AuthService.register(
      fullName: fullName,
      email: email,
      password: password,
      confirmPassword: password,
      phone: phone,
    );
  }

  // Fetch Public Grounds from Backend
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

  // Fetch Grounds Owned by Specific Owner
  static Future<List<GroundModel>> fetchGroundsByOwner(String ownerId) async {
    try {
      final uri = Uri.parse('$baseUrl/grounds/owner/$ownerId');
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['grounds'] is List) {
          return (data['grounds'] as List).map((g) => GroundModel.fromJson(g)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching grounds for owner $ownerId: $e');
    }
    return [];
  }

  // Fetch Bookings for Specific Owner's Venues
  static Future<List<BookingModel>> fetchOwnerBookings(String ownerId) async {
    try {
      final uri = Uri.parse('$baseUrl/bookings/owner/$ownerId');
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['bookings'] is List) {
          return (data['bookings'] as List).map((b) => BookingModel.fromJson(b)).toList();
        }
      }
    } catch (e) {
      debugPrint('Error fetching bookings for owner $ownerId: $e');
    }
    return [];
  }

  // Fetch Real-time Owner Dashboard Analytics from MongoDB
  static Future<Map<String, dynamic>> fetchOwnerDashboardStats(String ownerId) async {
    try {
      final uri = Uri.parse('$baseUrl/owner/dashboard/$ownerId');
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['stats'] is Map) {
          return Map<String, dynamic>.from(data['stats']);
        }
      }
    } catch (e) {
      debugPrint('Error fetching owner dashboard stats for $ownerId: $e');
    }
    return {};
  }

  // Create Ground
  static Future<Map<String, dynamic>> createGround(Map<String, dynamic> groundData) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/grounds'),
        headers: _headers,
        body: jsonEncode(groundData),
      ).timeout(const Duration(seconds: 8));

      final data = jsonDecode(res.body);
      if (res.statusCode == 201 || res.statusCode == 200) {
        return data;
      } else {
        return {'success': false, 'message': data['message'] ?? 'Failed to register ground'};
      }
    } catch (e) {
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Create Booking
  static Future<Map<String, dynamic>> createBooking({
    dynamic userId = '1',
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
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 10));

      final data = jsonDecode(res.body);
      if (res.statusCode == 201 || res.statusCode == 200) {
        return data;
      } else {
        return {'success': false, 'message': data['message'] ?? 'Failed to book slot'};
      }
    } catch (e) {
      debugPrint('createBooking exception: $e');
      return {'success': false, 'message': 'Network error: $e'};
    }
  }

  // Fetch Bookings for a Specific User
  static Future<List<BookingModel>> fetchUserBookings(dynamic userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/bookings/user/$userId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 8));

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
        headers: _headers,
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error cancelling booking $bookingId: $e');
    }

    return {'success': false, 'message': 'Failed to cancel booking'};
  }

  // Update Ground (Pricing, Slots, Facilities, Status)
  static Future<Map<String, dynamic>> updateGround(dynamic groundId, Map<String, dynamic> updateData) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/grounds/$groundId'),
        headers: _headers,
        body: jsonEncode(updateData),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error updating ground $groundId: $e');
    }

    return {'success': false, 'message': 'Failed to update ground'};
  }

  // Delete Ground
  static Future<Map<String, dynamic>> deleteGround(dynamic groundId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/grounds/$groundId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error deleting ground $groundId: $e');
    }

    return {'success': false, 'message': 'Failed to delete ground'};
  }

  // Check In Booking (Player entry via QR or ID)
  static Future<Map<String, dynamic>> checkInBooking(String bookingIdOrQr) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings/checkin'),
        headers: _headers,
        body: jsonEncode({'booking_id': bookingIdOrQr}),
      ).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('Error checking in booking $bookingIdOrQr: $e');
    }

    return {'success': false, 'message': 'Check-in verification failed'};
  }

  // Fetch All Bookings (For Superadmin)
  static Future<List<BookingModel>> fetchAllBookings() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings'), headers: _headers).timeout(const Duration(seconds: 6));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['bookings'] != null) {
          return (data['bookings'] as List).map((b) => BookingModel.fromJson(b)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // Fetch Booked Slots for Ground and Date from MongoDB
  static Future<List<String>> fetchBookedSlotsForGround(dynamic groundId, {String? date}) async {
    try {
      final queryParams = <String, String>{};
      if (date != null && date.isNotEmpty) queryParams['date'] = date;

      final uri = Uri.parse('$baseUrl/bookings/ground/$groundId')
          .replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final res = await http.get(uri).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['bookedSlotTimes'] is List) {
          return List<String>.from(data['bookedSlotTimes']);
        }
      }
    } catch (e) {
      debugPrint('Error fetching booked slots: $e');
    }
    return [];
  }

  // ── Dynamic Slot Management APIs ──

  // Fetch Slots for a Ground on a Specific Date (and optional Court)
  static Future<Map<String, dynamic>> fetchSlots({
    required dynamic groundId,
    required String date,
    String? courtId,
    String? status,
  }) async {
    try {
      final queryParams = <String, String>{
        'ground_id': groundId.toString(),
        'date': date,
      };
      if (courtId != null && courtId.isNotEmpty && courtId != 'All') {
        queryParams['court_id'] = courtId;
      }
      if (status != null && status.isNotEmpty && status != 'All') {
        queryParams['status'] = status;
      }

      final uri = Uri.parse('$baseUrl/slots').replace(queryParameters: queryParams);
      final res = await http.get(uri, headers: _headers).timeout(const Duration(seconds: 6));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['slots'] is List) {
          final slotsList = (data['slots'] as List).map((s) => GroundSlot.fromJson(s)).toList();
          final courtsList = data['courts'] is List ? List<String>.from(data['courts']) : <String>['Court 1'];
          return {
            'success': true,
            'slots': slotsList,
            'courts': courtsList,
          };
        }
      }
    } catch (e) {
      debugPrint('Error fetching slots for ground $groundId on $date: $e');
    }

    return {
      'success': false,
      'slots': <GroundSlot>[],
      'courts': <String>['Court 1'],
    };
  }

  // Create Custom Slot (Owner / Admin)
  static Future<Map<String, dynamic>> createSlot(Map<String, dynamic> slotData) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/slots'),
        headers: _headers,
        body: jsonEncode(slotData),
      ).timeout(const Duration(seconds: 6));

      return jsonDecode(res.body);
    } catch (e) {
      debugPrint('Error creating slot: $e');
      return {'success': false, 'message': 'Failed to create slot: $e'};
    }
  }

  // Bulk Generate Slots for Ground (Owner / Admin)
  static Future<Map<String, dynamic>> generateSlots({
    required dynamic groundId,
    String? startDate,
    String? endDate,
    int? days,
    List<String>? courts,
    double? price,
    double? pricePerHour,
  }) async {
    try {
      final effectivePrice = price ?? pricePerHour;
      final payload = {
        'ground_id': groundId.toString(),
        if (startDate != null) 'start_date': startDate,
        if (endDate != null) 'end_date': endDate,
        if (courts != null) 'courts': courts,
        if (effectivePrice != null) 'price': effectivePrice,
      };

      final res = await http.post(
        Uri.parse('$baseUrl/slots/generate'),
        headers: _headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 10));

      return jsonDecode(res.body);
    } catch (e) {
      debugPrint('Error generating slots: $e');
      return {'success': false, 'message': 'Failed to generate slots: $e'};
    }
  }

  // Update Slot Price / Status (Owner / Admin)
  static Future<Map<String, dynamic>> updateSlot(String slotId, Map<String, dynamic> data) async {
    try {
      final res = await http.put(
        Uri.parse('$baseUrl/slots/$slotId'),
        headers: _headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 6));

      return jsonDecode(res.body);
    } catch (e) {
      debugPrint('Error updating slot $slotId: $e');
      return {'success': false, 'message': 'Failed to update slot'};
    }
  }

  // Delete Slot (Owner / Admin)
  static Future<Map<String, dynamic>> deleteSlot(String slotId) async {
    try {
      final res = await http.delete(
        Uri.parse('$baseUrl/slots/$slotId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 6));

      return jsonDecode(res.body);
    } catch (e) {
      debugPrint('Error deleting slot $slotId: $e');
      return {'success': false, 'message': 'Failed to delete slot'};
    }
  }

  // Fetch Marketplace Products from MongoDB
  static Future<List<ProductModel>> fetchProducts({String category = 'All', String search = ''}) async {
    try {
      final queryParams = <String, String>{};
      if (category != 'All' && category.isNotEmpty) queryParams['category'] = category;
      if (search.trim().isNotEmpty) queryParams['search'] = search.trim();
      
      final uri = Uri.parse('$baseUrl/products').replace(queryParameters: queryParams.isNotEmpty ? queryParams : null);
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['products'] != null) {
          return (data['products'] as List).map((p) => ProductModel.fromJson(p)).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // Create Order in MongoDB
  static Future<Map<String, dynamic>> createOrder({
    required dynamic userId,
    String? customerName,
    String? customerPhone,
    required List<Map<String, dynamic>> items,
    required double totalAmount,
    required String deliveryAddress,
    String paymentMethod = 'UPI / Online Payment',
  }) async {
    try {
      final body = {
        'userId': userId,
        if (customerName != null) 'customerName': customerName,
        if (customerPhone != null) 'customerPhone': customerPhone,
        'items': items,
        'totalAmount': totalAmount,
        'deliveryAddress': deliveryAddress,
        'paymentMethod': paymentMethod,
      };

      final res = await http.post(
        Uri.parse('$baseUrl/orders'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = jsonDecode(res.body);
        return {'success': true, 'order': data['order'], 'message': data['message'] ?? 'Order placed successfully!'};
      }
    } catch (e) {
      return {'success': false, 'message': e.toString()};
    }
    return {'success': false, 'message': 'Failed to place order'};
  }

  // Fetch User Orders from MongoDB
  static Future<List<Map<String, dynamic>>> fetchUserOrders(dynamic userId) async {
    try {
      final res = await http.get(
        Uri.parse('$baseUrl/orders/user/$userId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true && data['orders'] is List) {
          return (data['orders'] as List)
              .whereType<Map>()
              .map((o) => Map<String, dynamic>.from(o))
              .toList();
        }
      }
    } catch (_) {}
    return [];
  }

  // ── Razorpay Payment API ──
  static Future<Map<String, dynamic>> createRazorpayOrder({
    required double amount,
    String currency = 'INR',
    String purpose = 'general_payment',
    String? receipt,
    Map<String, dynamic>? notes,
  }) async {
    try {
      final body = {
        'amount': amount,
        'currency': currency,
        'purpose': purpose,
        if (receipt != null) 'receipt': receipt,
        if (notes != null) 'notes': notes,
      };

      final res = await http.post(
        Uri.parse('$baseUrl/payment/create-order'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 8));

      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('Error creating Razorpay order: $e');
    }
    return {'success': false, 'message': 'Failed to initialize payment gateway'};
  }

  static Future<Map<String, dynamic>> verifyRazorpayPayment({
    required String razorpayOrderId,
    required String razorpayPaymentId,
    required String razorpaySignature,
    required String purpose,
    String? bookingId,
    dynamic orderId,
    dynamic groundId,
    dynamic userId,
    required double amount,
    String? customerName,
    String? customerEmail,
    String? customerPhone,
    String paymentMethod = 'Razorpay / UPI',
    Map<String, dynamic>? metadata,
  }) async {
    try {
      final body = {
        'razorpay_order_id': razorpayOrderId,
        'razorpay_payment_id': razorpayPaymentId,
        'razorpay_signature': razorpaySignature,
        'purpose': purpose,
        if (bookingId != null) 'booking_id': bookingId,
        if (orderId != null) 'order_id': orderId,
        if (groundId != null) 'ground_id': groundId,
        if (userId != null) 'user_id': userId,
        'amount': amount,
        if (customerName != null) 'customer_name': customerName,
        if (customerEmail != null) 'customer_email': customerEmail,
        if (customerPhone != null) 'customer_phone': customerPhone,
        'payment_method': paymentMethod,
        if (metadata != null) 'metadata': metadata,
      };

      final res = await http.post(
        Uri.parse('$baseUrl/payment/verify-payment'),
        headers: _headers,
        body: jsonEncode(body),
      ).timeout(const Duration(seconds: 10));

      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
    } catch (e) {
      debugPrint('Error verifying Razorpay payment: $e');
    }
    return {'success': false, 'message': 'Payment verification failed'};
  }

  // AI Assistant Chat - Full Structured Map
  static Future<Map<String, dynamic>> askAiAssistantFull(
    String message, {
    List<Map<String, dynamic>>? history,
    String? token,
    Map<String, dynamic>? user,
  }) async {
    try {
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
        if (token != null && token.isNotEmpty)
          'Authorization': 'Bearer $token'
        else if (AuthService.currentToken != null && AuthService.currentToken!.isNotEmpty)
          'Authorization': 'Bearer ${AuthService.currentToken}',
      };

      final res = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: headers,
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 25));

      if (res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (e) {
      debugPrint('AI Chat Network Error: $e');
    }

    return {
      'success': false,
      'intent': 'GENERAL_UNRELATED',
      'reply': "Unable to connect to SportVerse AI server. Please check your network connection.",
      'isInjury': false,
      'riskLevel': null,
      'responseType': 'NORMAL',
      'sources': [],
      'disclaimer': null,
      'suggested_actions': ['Retry message', 'Check connection']
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
      final res = await http.get(
        Uri.parse('$baseUrl/notifications/user/$userId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 4));

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


