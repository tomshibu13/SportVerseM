class ReviewModel {
  final dynamic reviewId;
  final dynamic userId;
  final String userName;
  final String userAvatar;
  final dynamic groundId;
  final String bookingId;
  final double rating;
  final String reviewText;
  final DateTime createdAt;

  ReviewModel({
    required this.reviewId,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.groundId,
    required this.bookingId,
    required this.rating,
    required this.reviewText,
    required this.createdAt,
  });

  String get initials {
    if (userName.trim().isEmpty) return 'U';
    final parts = userName.trim().split(RegExp(r'\s+'));
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inSeconds < 60) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays == 1) {
      return 'Yesterday';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else if (difference.inDays < 30) {
      final weeks = (difference.inDays / 7).floor();
      return '${weeks}w ago';
    } else {
      return '${createdAt.day}/${createdAt.month}/${createdAt.year}';
    }
  }

  factory ReviewModel.fromJson(Map<String, dynamic> json) {
    DateTime parsedDate;
    try {
      parsedDate = json['created_at'] != null
          ? DateTime.parse(json['created_at'].toString())
          : (json['createdAt'] != null
              ? DateTime.parse(json['createdAt'].toString())
              : DateTime.now());
    } catch (_) {
      parsedDate = DateTime.now();
    }

    return ReviewModel(
      reviewId: json['review_id'] ?? json['reviewId'] ?? json['_id'] ?? '',
      userId: json['user_id'] ?? json['userId'],
      userName: json['user_name']?.toString() ??
          (json['user'] is Map ? json['user']['fullName']?.toString() : null) ??
          'Sports Player',
      userAvatar: json['user_avatar']?.toString() ??
          (json['user'] is Map ? (json['user']['profile_photo'] ?? json['user']['avatar'])?.toString() : null) ??
          '',
      groundId: json['ground_id'] ?? json['groundId'],
      bookingId: json['booking_id']?.toString() ?? '',
      rating: (json['rating'] is num)
          ? (json['rating'] as num).toDouble()
          : (double.tryParse(json['rating']?.toString() ?? '5.0') ?? 5.0),
      reviewText: json['review_text']?.toString() ?? json['comment']?.toString() ?? '',
      createdAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() => {
    'review_id': reviewId,
    'user_id': userId,
    'user_name': userName,
    'user_avatar': userAvatar,
    'ground_id': groundId,
    'booking_id': bookingId,
    'rating': rating,
    'review_text': reviewText,
    'created_at': createdAt.toIso8601String(),
  };
}
