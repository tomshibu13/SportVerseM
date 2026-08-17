class BookingModel {
  final String bookingId;
  final dynamic userId;
  final String userName;
  final dynamic groundId;
  final String groundName;
  final String sportType;
  final String date;
  final String slotTime;
  final double totalPrice;
  final String paymentStatus;
  String bookingStatus; // Upcoming, Completed, Cancelled
  final String qrCode;
  final String location;
  final String address;
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
    this.location = 'Calicut, Kerala',
    this.address = 'Calicut, Kerala',
    required this.createdAt,
  });

  dynamic operator [](String key) {
    switch (key) {
      case 'booking_id':
      case 'bookingId':
      case 'id':
      case '_id':
        return bookingId;
      case 'user_id':
      case 'userId':
      case 'user':
        return userId;
      case 'user_name':
      case 'userName':
      case 'player':
        return userName;
      case 'ground_id':
      case 'groundId':
      case 'ground':
        return groundId;
      case 'ground_name':
      case 'groundName':
      case 'title':
        return groundName;
      case 'sport_type':
      case 'sportType':
      case 'sport':
        return sportType;
      case 'date':
      case 'booking_date':
        return date;
      case 'slot_time':
      case 'slotTime':
      case 'time':
        return slotTime;
      case 'total_price':
      case 'totalPrice':
      case 'price':
        return totalPrice;
      case 'payment_status':
      case 'paymentStatus':
        return paymentStatus;
      case 'booking_status':
      case 'bookingStatus':
      case 'status':
        return bookingStatus;
      case 'qr_code':
      case 'qrCode':
        return qrCode;
      case 'location':
        return location;
      case 'address':
        return address;
      case 'created_at':
      case 'createdAt':
        return createdAt;
      default:
        return null;
    }
  }

  factory BookingModel.fromJson(dynamic rawJson) {
    if (rawJson is BookingModel) {
      return rawJson;
    }

    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    String groundTitle = json['ground_name']?.toString() ?? '';
    String sport = json['sport_type']?.toString() ?? '';
    String loc = 'Calicut, Kerala';
    String addr = 'Calicut, Kerala';

    if (json['ground'] != null && json['ground'] is Map) {
      final g = json['ground'] as Map;
      if (groundTitle.isEmpty && g['title'] != null) groundTitle = g['title'].toString();
      if (sport.isEmpty && g['sport_type'] != null) sport = g['sport_type'].toString();
      if (g['location'] != null) loc = g['location'].toString();
      if (g['address'] != null) addr = g['address'].toString();
    }

    String uName = json['user_name']?.toString() ?? '';
    if (json['user'] != null && json['user'] is Map) {
      final u = json['user'] as Map;
      if (uName.isEmpty && u['fullName'] != null) uName = u['fullName'].toString();
    }

    return BookingModel(
      bookingId: json['booking_id']?.toString() ?? json['id']?.toString() ?? json['_id']?.toString() ?? '',
      userId: json['user_id'] ?? (json['user'] is Map ? json['user']['_id'] : 1),
      userName: uName.isNotEmpty ? uName : 'Player',
      groundId: json['ground_id'] ?? (json['ground'] is Map ? json['ground']['_id'] : 0),
      groundName: groundTitle.isNotEmpty ? groundTitle : 'Sports Arena',
      sportType: sport.isNotEmpty ? sport : 'Sports',
      date: json['date']?.toString() ?? '',
      slotTime: json['slot_time']?.toString() ?? '',
      totalPrice: (json['total_price'] is num)
          ? (json['total_price'] as num).toDouble()
          : (double.tryParse(json['total_price']?.toString() ?? '0') ?? 0.0),
      paymentStatus: json['payment_status']?.toString() ?? 'Paid',
      bookingStatus: json['booking_status']?.toString() ?? 'Upcoming',
      qrCode: json['qr_code']?.toString() ?? 'SPORTVERSE_QR_${json['booking_id'] ?? 'PASS'}',
      location: loc,
      address: addr,
      createdAt: json['created_at'] != null ? json['created_at'].toString() : '',
    );
  }
}
