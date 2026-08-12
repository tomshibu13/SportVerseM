class UserModel {
  final int userId;
  final String fullName;
  final String email;
  final String role; // User, GroundOwner, ShopOwner, Admin
  final String phone;
  final String profileImage;
  final String createdAt;

  UserModel({
    required this.userId,
    required this.fullName,
    required this.email,
    required this.role,
    this.phone = '',
    this.profileImage = '',
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    final rawId = json['userId'] ?? json['user_id'] ?? json['id'] ?? 0;
    final parsedId = rawId is int ? rawId : (int.tryParse(rawId.toString()) ?? rawId.hashCode);

    return UserModel(
      userId: parsedId,
      fullName: json['fullName'] ?? json['full_name'] ?? json['name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'User',
      phone: json['phone'] ?? '',
      profileImage: json['profileImage'] ?? json['profile_image'] ?? json['photoURL'] ?? '',
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'user_id': userId,
      'full_name': fullName,
      'email': email,
      'role': role,
      'phone': phone,
      'profile_image': profileImage,
      'created_at': createdAt,
    };
  }
}

