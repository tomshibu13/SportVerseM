class GroundSlot {
  final String slotId;
  final String time;
  final String courtId;
  final String date;
  final String startTime;
  final String endTime;
  bool isBooked;
  double price;
  String status; // 'Available', 'Booked', 'Blocked', 'Expired'

  GroundSlot({
    required this.slotId,
    required this.time,
    required this.isBooked,
    required this.price,
    this.courtId = 'Court 1',
    this.date = '',
    this.startTime = '',
    this.endTime = '',
    this.status = 'Available',
  });

  bool get isAvailable => status == 'Available' && !isBooked;
  bool get isBlocked => status == 'Blocked';
  bool get isExpired => status == 'Expired';

  dynamic operator [](String key) {
    switch (key) {
      case 'slot_id':
      case 'slotId':
      case '_id':
      case 'id':
        return slotId;
      case 'time':
      case 'slot_time':
        return time;
      case 'court_id':
      case 'courtId':
        return courtId;
      case 'date':
        return date;
      case 'start_time':
      case 'startTime':
        return startTime;
      case 'end_time':
      case 'endTime':
        return endTime;
      case 'is_booked':
      case 'isBooked':
        return isBooked;
      case 'price':
        return price;
      case 'status':
        return status;
      default:
        return null;
    }
  }

  factory GroundSlot.fromJson(dynamic rawJson) {
    if (rawJson is GroundSlot) {
      return rawJson;
    }
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    final slotTime = json['slot_time']?.toString() ?? json['time']?.toString() ?? '';
    final rawStatus = json['status']?.toString() ?? 'Available';
    final isBooked = json['is_booked'] == true || json['isBooked'] == true || rawStatus == 'Booked';

    return GroundSlot(
      slotId: json['_id']?.toString() ?? json['slot_id']?.toString() ?? json['slotId']?.toString() ?? json['id']?.toString() ?? '',
      time: slotTime,
      isBooked: isBooked,
      price: json['price'] is num
          ? (json['price'] as num).toDouble()
          : (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      courtId: json['court_id']?.toString() ?? json['courtId']?.toString() ?? 'Court 1',
      date: json['date']?.toString() ?? '',
      startTime: json['start_time']?.toString() ?? json['startTime']?.toString() ?? '',
      endTime: json['end_time']?.toString() ?? json['endTime']?.toString() ?? '',
      status: rawStatus,
    );
  }

  Map<String, dynamic> toJson() => {
    'slot_id': slotId,
    'time': time,
    'court_id': courtId,
    'date': date,
    'start_time': startTime,
    'end_time': endTime,
    'is_booked': isBooked,
    'price': price,
    'status': status,
  };
}

class GroundModel {
  final dynamic groundId;
  final String title;
  final String sportType;
  final String location;
  final String address;
  final double latitude;
  final double longitude;
  final double distanceKm;
  final double pricePerHour;
  final double rating;
  final int reviewCount;
  final List<String> images;
  final List<String> facilities;
  final dynamic ownerId;
  final String status;
  final int aiScore;
  final String? aiReasoning;
  final List<GroundSlot> availableSlots;

  GroundModel({
    required this.groundId,
    required this.title,
    required this.sportType,
    required this.location,
    required this.address,
    this.latitude = 11.2588,
    this.longitude = 75.7804,
    required this.distanceKm,
    required this.pricePerHour,
    required this.rating,
    required this.reviewCount,
    required this.images,
    required this.facilities,
    required this.ownerId,
    required this.status,
    required this.aiScore,
    this.aiReasoning,
    required this.availableSlots,
  });

  dynamic operator [](String key) {
    switch (key) {
      case 'ground_id':
      case 'groundId':
      case 'id':
      case '_id':
        return groundId;
      case 'title':
      case 'name':
        return title;
      case 'sport_type':
      case 'sportType':
      case 'sport':
        return sportType;
      case 'location':
        return location;
      case 'address':
        return address;
      case 'latitude':
      case 'lat':
        return latitude;
      case 'longitude':
      case 'lng':
        return longitude;
      case 'distance_km':
      case 'distanceKm':
        return distanceKm;
      case 'price_per_hour':
      case 'pricePerHour':
      case 'price':
        return pricePerHour;
      case 'rating':
        return rating;
      case 'review_count':
      case 'reviewCount':
        return reviewCount;
      case 'images':
      case 'image':
        return images;
      case 'facilities':
        return facilities;
      case 'owner_id':
      case 'ownerId':
        return ownerId;
      case 'status':
        return status;
      case 'ai_score':
      case 'aiScore':
        return aiScore;
      case 'available_slots':
      case 'availableSlots':
      case 'slots':
        return availableSlots;
      default:
        return null;
    }
  }

  factory GroundModel.fromJson(dynamic rawJson) {
    if (rawJson is GroundModel) {
      return rawJson;
    }
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return GroundModel(
      groundId: json['ground_id'] ?? json['id'] ?? json['_id'] ?? 0,
      title: json['title']?.toString() ?? '',
      sportType: json['sport_type']?.toString() ?? json['sport']?.toString() ?? 'Sports',
      location: json['location']?.toString() ?? '',
      address: json['address']?.toString() ?? json['location']?.toString() ?? '',
      latitude: json['latitude'] is num
          ? (json['latitude'] as num).toDouble()
          : (double.tryParse(json['latitude']?.toString() ?? '') ??
              (json['lat'] is num ? (json['lat'] as num).toDouble() : 11.2588)),
      longitude: json['longitude'] is num
          ? (json['longitude'] as num).toDouble()
          : (double.tryParse(json['longitude']?.toString() ?? '') ??
              (json['lng'] is num ? (json['lng'] as num).toDouble() : 75.7804)),
      distanceKm: json['distance_km'] is num
          ? (json['distance_km'] as num).toDouble()
          : (double.tryParse(json['distance_km']?.toString() ?? '') ?? 2.5),
      pricePerHour: json['price_per_hour'] is num
          ? (json['price_per_hour'] as num).toDouble()
          : (double.tryParse(json['price_per_hour']?.toString() ?? '') ??
              (json['price'] is num ? (json['price'] as num).toDouble() : 500.0)),
      rating: json['rating'] is num
          ? (json['rating'] as num).toDouble()
          : (double.tryParse(json['rating']?.toString() ?? '') ?? 4.5),
      reviewCount: json['review_count'] is num
          ? (json['review_count'] as num).toInt()
          : (int.tryParse(json['review_count']?.toString() ?? '') ?? 0),
      images: (json['images'] as List<dynamic>?)?.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList() ?? [],
      facilities: (json['facilities'] as List<dynamic>?)?.map((e) => e?.toString() ?? '').where((s) => s.isNotEmpty).toList() ?? [],
      ownerId: json['owner_id'] ?? json['ownerId'] ?? '2',
      status: json['status']?.toString() ?? 'Approved',
      aiScore: json['ai_score'] is num
          ? (json['ai_score'] as num).toInt()
          : (int.tryParse(json['ai_score']?.toString() ?? '') ?? 90),
      aiReasoning: json['ai_reasoning']?.toString(),
      availableSlots: (json['available_slots'] as List<dynamic>?)
              ?.map((s) => GroundSlot.fromJson(s))
              .toList() ??
          [],
    );
  }
}
