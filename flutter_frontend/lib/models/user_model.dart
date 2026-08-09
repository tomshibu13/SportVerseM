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
    return UserModel(
      userId: json['user_id'] is int ? json['user_id'] : int.tryParse(json['user_id'].toString()) ?? 0,
      fullName: json['full_name'] ?? '',
      email: json['email'] ?? '',
      role: json['role'] ?? 'User',
      phone: json['phone'] ?? '',
      profileImage: json['profile_image'] ?? '',
      createdAt: json['created_at'] != null ? json['created_at'].toString() : '',
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
