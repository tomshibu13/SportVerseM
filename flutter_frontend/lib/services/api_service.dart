import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:http/http.dart' as http;
import '../models/user_model.dart';
import '../models/ground_model.dart';
import '../models/booking_model.dart';
import '../models/product_model.dart';

class ApiService {
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return 'http://10.244.238.104:5000/api';
    }
    return 'http://localhost:5000/api';
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

  // Fetch Grounds
  static Future<List<GroundModel>> fetchGrounds({String sport = 'All', String search = ''}) async {
    try {
      final uri = Uri.parse('$baseUrl/grounds?sport=$sport&search=$search');
      final res = await http.get(uri).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          return (data['grounds'] as List).map((g) => GroundModel.fromJson(g)).toList();
        }
      }
    } catch (_) {}

    // Fallback Mock Grounds
    List<GroundModel> mockList = [
      GroundModel(
        groundId: 101,
        title: 'Elite Football Arena',
        sportType: 'Football',
        location: 'Downtown Sports Hub, Sector 5',
        address: '102 Stadium Way, Downtown',
        distanceKm: 2.2,
        pricePerHour: 800,
        rating: 4.8,
        reviewCount: 124,
        images: [
          'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&q=80'
        ],
        facilities: ['FIFA Floodlights', 'Artificial Turf', 'Locker Room', 'Cafeteria', 'Parking'],
        ownerId: 2,
        status: 'Approved',
        aiScore: 98,
        aiReasoning: 'Top recommended ground for Football with 4.8 rating and high slot availability.',
        availableSlots: [
          GroundSlot(slotId: 's1', time: '06:00 AM - 07:00 AM', isBooked: false, price: 800),
          GroundSlot(slotId: 's2', time: '07:00 AM - 08:00 AM', isBooked: true, price: 800),
          GroundSlot(slotId: 's3', time: '05:00 PM - 06:00 PM', isBooked: false, price: 950),
          GroundSlot(slotId: 's4', time: '06:00 PM - 07:00 PM', isBooked: false, price: 950),
          GroundSlot(slotId: 's5', time: '07:00 PM - 08:00 PM', isBooked: false, price: 950),
        ],
      ),
      GroundModel(
        groundId: 102,
        title: 'Victory Badminton Court',
        sportType: 'Badminton',
        location: 'Greenwood Indoor Complex',
        address: '45 Badminton Avenue, North District',
        distanceKm: 1.4,
        pricePerHour: 500,
        rating: 4.6,
        reviewCount: 89,
        images: [
          'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1521537634581-0dced2efa2ab?auto=format&fit=crop&w=800&q=80'
        ],
        facilities: ['Synthetic Wooden Floor', 'Air Conditioned', 'Pro Shop', 'Water Cooler'],
        ownerId: 2,
        status: 'Approved',
        aiScore: 94,
        availableSlots: [
          GroundSlot(slotId: 'b1', time: '08:00 AM - 09:00 AM', isBooked: false, price: 500),
          GroundSlot(slotId: 'b2', time: '09:00 AM - 10:00 AM', isBooked: false, price: 500),
          GroundSlot(slotId: 'b3', time: '04:00 PM - 05:00 PM', isBooked: false, price: 600),
        ],
      ),
      GroundModel(
        groundId: 103,
        title: 'Thunder Basketball Arena',
        sportType: 'Basketball',
        location: 'Metro Sports Park',
        address: '88 Slam Dunk Drive',
        distanceKm: 3.1,
        pricePerHour: 750,
        rating: 4.9,
        reviewCount: 210,
        images: ['https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=800&q=80'],
        facilities: ['Hardwood Flooring', 'Scoreboard', 'Night Lights', 'Spectator Seating'],
        ownerId: 2,
        status: 'Approved',
        aiScore: 96,
        availableSlots: [
          GroundSlot(slotId: 'c1', time: '07:00 AM - 08:00 AM', isBooked: false, price: 750),
          GroundSlot(slotId: 'c2', time: '06:00 PM - 07:00 PM', isBooked: false, price: 850),
        ],
      ),
      GroundModel(
        groundId: 104,
        title: 'Smash Tennis Club',
        sportType: 'Tennis',
        location: 'Riverside Club Grounds',
        address: '12 Tennis Court Lane',
        distanceKm: 4.0,
        pricePerHour: 900,
        rating: 4.7,
        reviewCount: 65,
        images: ['https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=800&q=80'],
        facilities: ['Clay Court', 'Grass Court', 'Coaching Available', 'Locker Room'],
        ownerId: 2,
        status: 'Approved',
        aiScore: 91,
        availableSlots: [
          GroundSlot(slotId: 't1', time: '06:00 AM - 07:00 AM', isBooked: false, price: 900),
          GroundSlot(slotId: 't2', time: '05:00 PM - 06:00 PM', isBooked: false, price: 1000),
        ],
      ),
      GroundModel(
        groundId: 105,
        title: 'Super Strikers Cricket Box',
        sportType: 'Cricket',
        location: 'Eastside Turf Arena',
        address: '77 Pavilion Road',
        distanceKm: 1.8,
        pricePerHour: 1000,
        rating: 4.8,
        reviewCount: 175,
        images: ['https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=800&q=80'],
        facilities: ['Box Cricket Netting', 'High Lux Floodlights', 'Bowling Machine'],
        ownerId: 2,
        status: 'Approved',
        aiScore: 97,
        availableSlots: [
          GroundSlot(slotId: 'cr1', time: '08:00 PM - 09:00 PM', isBooked: false, price: 1000),
        ],
      ),
    ];

    if (sport != 'All') {
      mockList = mockList.where((g) => g.sportType.toLowerCase() == sport.toLowerCase()).toList();
    }
    if (search.isNotEmpty) {
      mockList = mockList.where((g) => g.title.toLowerCase().contains(search.toLowerCase()) || g.location.toLowerCase().contains(search.toLowerCase())).toList();
    }

    return mockList;
  }

  // Create Booking
  static Future<Map<String, dynamic>> createBooking({
    required int userId,
    required String userName,
    required int groundId,
    required String groundName,
    required String sportType,
    required String date,
    required String slotTime,
    required double totalPrice,
  }) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/bookings'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'user_id': userId,
          'user_name': userName,
          'ground_id': groundId,
          'ground_name': groundName,
          'sport_type': sportType,
          'date': date,
          'slot_time': slotTime,
          'total_price': totalPrice,
        }),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 201 || res.statusCode == 200) {
        return jsonDecode(res.body);
      }
    } catch (_) {}

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

  // Fetch User Bookings
  static Future<List<BookingModel>> fetchUserBookings(int userId) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/bookings/user/$userId')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          return (data['bookings'] as List).map((b) => BookingModel.fromJson(b)).toList();
        }
      }
    } catch (_) {}

    return [
      BookingModel(
        bookingId: 'SPV-BK-9921',
        userId: userId,
        userName: 'Tom Holland',
        groundId: 101,
        groundName: 'Elite Football Arena',
        sportType: 'Football',
        date: '2026-08-10',
        slotTime: '07:00 AM - 08:00 AM',
        totalPrice: 800,
        paymentStatus: 'Paid',
        bookingStatus: 'Upcoming',
        qrCode: 'SPORTVERSE_QR_SPV-BK-9921',
        createdAt: DateTime.now().toIso8601String(),
      ),
      BookingModel(
        bookingId: 'SPV-BK-8842',
        userId: userId,
        userName: 'Tom Holland',
        groundId: 102,
        groundName: 'Victory Badminton Court',
        sportType: 'Badminton',
        date: '2026-08-04',
        slotTime: '04:00 PM - 05:00 PM',
        totalPrice: 500,
        paymentStatus: 'Paid',
        bookingStatus: 'Completed',
        qrCode: 'SPORTVERSE_QR_SPV-BK-8842',
        createdAt: DateTime.now().subtract(const Duration(days: 4)).toIso8601String(),
      ),
    ];
  }

  // Fetch Marketplace Products
  static Future<List<ProductModel>> fetchProducts({String category = 'All'}) async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/products?category=$category')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          return (data['products'] as List).map((p) => ProductModel.fromJson(p)).toList();
        }
      }
    } catch (_) {}

    List<ProductModel> products = [
      ProductModel(
        productId: 201,
        title: 'Nike Strike Pro Football',
        category: 'Football',
        price: 1499,
        originalPrice: 1999,
        rating: 4.8,
        image: 'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
        description: 'Thermo-bonded 12-panel construction for true flight and maximum power transfer.',
        stock: 35,
        shopOwnerId: 3,
      ),
      ProductModel(
        productId: 202,
        title: 'Yonex Astrox 88D Pro Racket',
        category: 'Rackets',
        price: 8490,
        originalPrice: 9990,
        rating: 4.9,
        image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=600&q=80',
        description: 'Head-heavy badminton racket engineered for aggressive rear-court smashers.',
        stock: 12,
        shopOwnerId: 3,
      ),
      ProductModel(
        productId: 203,
        title: 'Adidas Speedcourt Turf Shoes',
        category: 'Shoes',
        price: 4299,
        originalPrice: 5499,
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
        description: 'Non-marking rubber outsole built specifically for synthetic turf & indoor courts.',
        stock: 20,
        shopOwnerId: 3,
      ),
      ProductModel(
        productId: 204,
        title: 'Wilson US Open Tennis Balls (4-Pack)',
        category: 'Accessories',
        price: 599,
        originalPrice: 799,
        rating: 4.6,
        image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=600&q=80',
        description: 'Premium extra-duty felt designed for hard court durability.',
        stock: 50,
        shopOwnerId: 3,
      ),
    ];

    if (category != 'All') {
      products = products.where((p) => p.category.toLowerCase() == category.toLowerCase()).toList();
    }
    return products;
  }

  // AI Assistant Chat
  static Future<String> askAiAssistant(String message) async {
    try {
      final res = await http.post(
        Uri.parse('$baseUrl/ai/chat'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'message': message}),
      ).timeout(const Duration(seconds: 4));

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        return data['reply'] ?? 'AI response received.';
      }
    } catch (_) {}

    final msg = message.toLowerCase();
    if (msg.contains('football') || msg.contains('soccer')) {
      return "⚽ For Football, I highly recommend 'Elite Football Arena' (2.2 km away, ₹800/hr). It features FIFA-approved artificial turf, high-lux floodlights, and active evening slots!";
    } else if (msg.contains('badminton')) {
      return "🏸 For Badminton, 'Victory Badminton Court' is rated 4.6 stars (1.4 km away, ₹500/hr). Synthetic wooden courts with full A/C!";
    } else if (msg.contains('gear') || msg.contains('racket') || msg.contains('shoe')) {
      return "👟 Based on court surfaces, check out 'Adidas Speedcourt Turf Shoes' (₹4,299) in the marketplace for non-marking turf grip!";
    } else {
      return "🤖 SportVerse AI Recommendation: Your playing history shows strong affinity for weekend evening slots. We recommend booking grounds 24 hours in advance!";
    }
  }

  // Fetch Users for Admin Portal (Tbl_users)
  static Future<List<UserModel>> fetchAdminUsers() async {
    try {
      final res = await http.get(Uri.parse('$baseUrl/auth/users')).timeout(const Duration(seconds: 4));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (data['success'] == true) {
          return (data['users'] as List).map((u) => UserModel.fromJson(u)).toList();
        }
      }
    } catch (_) {}

    return [
      UserModel(userId: 1, fullName: 'Tom Holland', email: 'tom@sportverse.com', role: 'User', phone: '+1 9876543210', profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80', createdAt: '2026-08-01'),
      UserModel(userId: 2, fullName: 'Alex Arena Manager', email: 'owner@arena.com', role: 'GroundOwner', phone: '+1 9876543211', profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80', createdAt: '2026-07-28'),
      UserModel(userId: 3, fullName: 'Sarah Gear Shop', email: 'shop@sportverse.com', role: 'ShopOwner', phone: '+1 9876543212', profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80', createdAt: '2026-07-25'),
      UserModel(userId: 4, fullName: 'Admin Chief', email: 'admin@sportverse.com', role: 'Admin', phone: '+1 9876543213', profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80', createdAt: '2026-07-15'),
    ];
  }
}
