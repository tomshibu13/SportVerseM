import 'package:flutter/material.dart';
import '../models/booking_model.dart';
import '../services/api_service.dart';

class BookingProvider with ChangeNotifier {
  List<BookingModel> _bookings = [];
  bool _isLoading = false;

  List<BookingModel> get bookings => _bookings;
  List<BookingModel> get upcomingBookings => _bookings.where((b) => b.bookingStatus == 'Upcoming').toList();
  List<BookingModel> get completedBookings => _bookings.where((b) => b.bookingStatus == 'Completed' || b.bookingStatus == 'Cancelled').toList();
  bool get isLoading => _isLoading;

  Future<void> loadUserBookings(dynamic userId) async {
    _isLoading = true;
    notifyListeners();

    _bookings = await ApiService.fetchUserBookings(userId);

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> createBooking({
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
    _isLoading = true;
    notifyListeners();

    final result = await ApiService.createBooking(
      userId: userId,
      userName: userName,
      groundId: groundId,
      groundName: groundName,
      sportType: sportType,
      date: date,
      slotTime: slotTime,
      totalPrice: totalPrice,
      slotId: slotId,
    );

    _isLoading = false;
    if (result['success'] == true) {
      final newBooking = BookingModel.fromJson(result['booking']);
      _bookings.insert(0, newBooking);
      notifyListeners();
      return true;
    }

    notifyListeners();
    return false;
  }
}
