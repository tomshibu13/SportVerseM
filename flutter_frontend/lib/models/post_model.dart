import 'package:intl/intl.dart';

class CommentModel {
  final String commentId;
  final String postId;
  final String userId;
  final String userName;
  final String userAvatar;
  final String commentText;
  final DateTime createdAt;
  final bool isOwner;

  CommentModel({
    required this.commentId,
    required this.postId,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    required this.commentText,
    required this.createdAt,
    this.isOwner = false,
  });

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 7) {
      return DateFormat('dd MMM').format(createdAt);
    } else if (difference.inDays >= 1) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours >= 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes >= 1) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  factory CommentModel.fromJson(dynamic rawJson) {
    if (rawJson is CommentModel) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    DateTime parsedDate;
    try {
      parsedDate = json['created_at'] != null
          ? DateTime.parse(json['created_at'].toString())
          : DateTime.now();
    } catch (_) {
      parsedDate = DateTime.now();
    }

    return CommentModel(
      commentId: json['comment_id']?.toString() ?? json['_id']?.toString() ?? '',
      postId: json['post_id']?.toString() ?? json['post']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['user']?.toString() ?? '',
      userName: json['user_name']?.toString() ?? json['userName']?.toString() ?? 'Athlete',
      userAvatar: json['user_avatar']?.toString() ??
          json['userAvatar']?.toString() ??
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      commentText: json['comment_text']?.toString() ?? json['commentText']?.toString() ?? '',
      createdAt: parsedDate,
      isOwner: json['is_owner'] == true || json['isOwner'] == true,
    );
  }

  Map<String, dynamic> toJson() => {
        'comment_id': commentId,
        'post_id': postId,
        'user_id': userId,
        'user_name': userName,
        'user_avatar': userAvatar,
        'comment_text': commentText,
        'created_at': createdAt.toIso8601String(),
        'is_owner': isOwner,
      };
}

class PostModel {
  final String postId;
  final String userId;
  final String userName;
  final String userAvatar;
  final String userRole;
  final String caption;
  final String mediaUrl;
  final String mediaType; // 'image' or 'video'
  final String sportCategory;
  final String location;
  int likeCount;
  int commentCount;
  bool isLiked;
  bool isOwner;
  final DateTime createdAt;

  PostModel({
    required this.postId,
    required this.userId,
    required this.userName,
    required this.userAvatar,
    this.userRole = 'Athlete',
    required this.caption,
    required this.mediaUrl,
    this.mediaType = 'image',
    required this.sportCategory,
    this.location = '',
    required this.likeCount,
    required this.commentCount,
    this.isLiked = false,
    this.isOwner = false,
    required this.createdAt,
  });

  String get timeAgo {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inDays > 7) {
      return DateFormat('dd MMM yyyy').format(createdAt);
    } else if (difference.inDays >= 1) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours >= 1) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes >= 1) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }

  factory PostModel.fromJson(dynamic rawJson) {
    if (rawJson is PostModel) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    DateTime parsedDate;
    try {
      parsedDate = json['created_at'] != null
          ? DateTime.parse(json['created_at'].toString())
          : (json['createdAt'] != null ? DateTime.parse(json['createdAt'].toString()) : DateTime.now());
    } catch (_) {
      parsedDate = DateTime.now();
    }

    return PostModel(
      postId: json['post_id']?.toString() ?? json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['user']?.toString() ?? '',
      userName: json['user_name']?.toString() ?? json['userName']?.toString() ?? json['name']?.toString() ?? 'Athlete',
      userAvatar: json['user_avatar']?.toString() ??
          json['userAvatar']?.toString() ??
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      userRole: json['user_role']?.toString() ?? json['userRole']?.toString() ?? 'Athlete',
      caption: json['caption']?.toString() ?? '',
      mediaUrl: json['media_url']?.toString() ?? json['mediaUrl']?.toString() ?? json['image']?.toString() ?? '',
      mediaType: json['media_type']?.toString() ?? json['mediaType']?.toString() ?? 'image',
      sportCategory: json['sport_category']?.toString() ?? json['sportCategory']?.toString() ?? json['sport']?.toString() ?? 'General',
      location: json['location']?.toString() ?? '',
      likeCount: json['like_count'] is num
          ? (json['like_count'] as num).toInt()
          : (int.tryParse(json['like_count']?.toString() ?? '') ??
              (json['likes'] is num ? (json['likes'] as num).toInt() : 0)),
      commentCount: json['comment_count'] is num
          ? (json['comment_count'] as num).toInt()
          : (int.tryParse(json['comment_count']?.toString() ?? '') ??
              (json['comments'] is num ? (json['comments'] as num).toInt() : 0)),
      isLiked: json['is_liked'] == true || json['isLiked'] == true,
      isOwner: json['is_owner'] == true || json['isOwner'] == true,
      createdAt: parsedDate,
    );
  }

  Map<String, dynamic> toJson() => {
        'post_id': postId,
        'user_id': userId,
        'user_name': userName,
        'user_avatar': userAvatar,
        'user_role': userRole,
        'caption': caption,
        'media_url': mediaUrl,
        'media_type': mediaType,
        'sport_category': sportCategory,
        'location': location,
        'like_count': likeCount,
        'comment_count': commentCount,
        'is_liked': isLiked,
        'is_owner': isOwner,
        'created_at': createdAt.toIso8601String(),
      };
}

class CommunityProfileModel {
  final String userId;
  final String fullName;
  final String email;
  final String role;
  final String bio;
  final String favoriteSport;
  final String location;
  final String profileImage;
  final int totalPosts;
  final int totalLikesReceived;
  final bool isSelf;

  CommunityProfileModel({
    required this.userId,
    required this.fullName,
    required this.email,
    required this.role,
    required this.bio,
    required this.favoriteSport,
    required this.location,
    required this.profileImage,
    required this.totalPosts,
    required this.totalLikesReceived,
    this.isSelf = false,
  });

  factory CommunityProfileModel.fromJson(dynamic rawJson) {
    if (rawJson is CommunityProfileModel) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return CommunityProfileModel(
      userId: json['user_id']?.toString() ?? json['_id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['full_name']?.toString() ?? json['name']?.toString() ?? 'Athlete',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'Athlete',
      bio: json['bio']?.toString() ?? 'Sports enthusiast on SportVerse AI',
      favoriteSport: json['favoriteSport']?.toString() ?? json['favorite_sport']?.toString() ?? 'Football',
      location: json['location']?.toString() ?? 'Calicut, Kerala',
      profileImage: json['profileImage']?.toString() ??
          json['profile_image']?.toString() ??
          'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      totalPosts: json['totalPosts'] is num ? (json['totalPosts'] as num).toInt() : (int.tryParse(json['totalPosts']?.toString() ?? '0') ?? 0),
      totalLikesReceived: json['totalLikesReceived'] is num ? (json['totalLikesReceived'] as num).toInt() : (int.tryParse(json['totalLikesReceived']?.toString() ?? '0') ?? 0),
      isSelf: json['isSelf'] == true || json['is_self'] == true,
    );
  }
}
