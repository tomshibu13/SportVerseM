class BookingModel {
  final String bookingId;
  final int userId;
  final String userName;
  final int groundId;
  final String groundName;
  final String sportType;
  final String date;
  final String slotTime;
  final double totalPrice;
  final String paymentStatus;
  final String bookingStatus; // Upcoming, Completed, Cancelled
  final String qrCode;
  final String createdAt;

  BookingModel({
    required this.bookingId,
    required this.userId,
    required this.userName,
    required this.groundId,
    required this.groundName,
    required this.sportType,
    required this.date,
    required this.slotTime,
    required this.totalPrice,
    required this.paymentStatus,
    required this.bookingStatus,
    required this.qrCode,
    required this.createdAt,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    return BookingModel(
      bookingId: json['booking_id'] ?? '',
      userId: (json['user_id'] ?? 1).toInt(),
      userName: json['user_name'] ?? '',
      groundId: (json['ground_id'] ?? 0).toInt(),
      groundName: json['ground_name'] ?? '',
      sportType: json['sport_type'] ?? '',
      date: json['date'] ?? '',
      slotTime: json['slot_time'] ?? '',
      totalPrice: (json['total_price'] ?? 0).toDouble(),
      paymentStatus: json['payment_status'] ?? 'Paid',
      bookingStatus: json['booking_status'] ?? 'Upcoming',
      qrCode: json['qr_code'] ?? '',
      createdAt: json['created_at'] != null ? json['created_at'].toString() : '',
    );
  }
}
