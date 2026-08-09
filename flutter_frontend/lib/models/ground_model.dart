class GroundSlot {
  final String slotId;
  final String time;
  final bool isBooked;
  final double price;

  GroundSlot({
    required this.slotId,
    required this.time,
    required this.isBooked,
    required this.price,
  });

  factory GroundSlot.fromJson(Map<String, dynamic> json) {
    return GroundSlot(
      slotId: json['slot_id'] ?? '',
      time: json['time'] ?? '',
      isBooked: json['is_booked'] ?? false,
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}

class GroundModel {
  final int groundId;
  final String title;
  final String sportType;
  final String location;
  final String address;
  final double distanceKm;
  final double pricePerHour;
  final double rating;
  final int reviewCount;
  final List<String> images;
  final List<String> facilities;
  final int ownerId;
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

  factory GroundModel.fromJson(Map<String, dynamic> json) {
    return GroundModel(
      groundId: json['ground_id'] is int ? json['ground_id'] : int.tryParse(json['ground_id'].toString()) ?? 0,
      title: json['title'] ?? '',
      sportType: json['sport_type'] ?? '',
      location: json['location'] ?? '',
      address: json['address'] ?? '',
      distanceKm: (json['distance_km'] ?? 2.5).toDouble(),
      pricePerHour: (json['price_per_hour'] ?? 0).toDouble(),
      rating: (json['rating'] ?? 4.5).toDouble(),
      reviewCount: (json['review_count'] ?? 0).toInt(),
      images: (json['images'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      facilities: (json['facilities'] as List<dynamic>?)?.map((e) => e.toString()).toList() ?? [],
      ownerId: (json['owner_id'] ?? 2).toInt(),
      status: json['status'] ?? 'Approved',
      aiScore: (json['ai_score'] ?? json['ai_recommendation_score'] ?? 90).toInt(),
      aiReasoning: json['ai_reasoning'],
      availableSlots: (json['available_slots'] as List<dynamic>?)
              ?.map((s) => GroundSlot.fromJson(s))
              .toList() ??
          [],
    );
  }
}
