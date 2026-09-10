class UserModel {
  final dynamic userId;
  final String fullName;
  final String email;
  final String role; // User, GroundOwner, ShopOwner, Admin
  final String phone;
  final String profileImage;
  final String approvalStatus;
  final bool isApproved;
  final String createdAt;
  final String location;
  final String favoriteSport;
  final String bio;

  UserModel({
    required this.userId,
    required this.fullName,
    required this.email,
    required this.role,
    this.phone = '',
    this.profileImage = '',
    this.approvalStatus = 'Approved',
    this.isApproved = true,
    required this.createdAt,
    this.location = '',
    this.favoriteSport = '',
    this.bio = '',
  });

  String get id => userId?.toString() ?? '';
  String get rawId => userId?.toString() ?? '';

  dynamic operator [](String key) {
    switch (key) {
      case 'id':
      case '_id':
      case 'userId':
      case 'user_id':
        return userId;
      case 'fullName':
      case 'full_name':
      case 'name':
        return fullName;
      case 'email':
        return email;
      case 'role':
        return role;
      case 'phone':
        return phone;
      case 'profileImage':
      case 'profile_image':
        return profileImage;
      case 'approvalStatus':
        return approvalStatus;
      case 'isApproved':
        return isApproved;
      case 'location':
        return location;
      case 'favoriteSport':
        return favoriteSport;
      case 'bio':
        return bio;
      case 'createdAt':
      case 'created_at':
        return createdAt;
      default:
        return null;
    }
  }

  factory UserModel.fromJson(dynamic rawJson) {
    if (rawJson is UserModel) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    final rawId = json['_id'] ?? json['id'] ?? json['userId'] ?? json['user_id'] ?? '';
    final status = json['approvalStatus']?.toString() ?? (json['isApproved'] == false ? 'Pending' : 'Approved');
    final approved = json['isApproved'] == true || (json['isApproved'] == null && status == 'Approved');

    return UserModel(
      userId: rawId.toString(),
      fullName: json['fullName']?.toString() ?? json['full_name']?.toString() ?? json['name']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      role: json['role']?.toString() ?? 'User',
      phone: json['phone']?.toString() ?? '',
      profileImage: json['profileImage']?.toString() ?? json['profile_image']?.toString() ?? json['photoURL']?.toString() ?? '',
      approvalStatus: status,
      isApproved: approved,
      location: json['location']?.toString() ?? '',
      favoriteSport: json['favoriteSport']?.toString() ?? '',
      bio: json['bio']?.toString() ?? '',
      createdAt: json['createdAt']?.toString() ?? json['created_at']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': userId,
      'user_id': userId,
      '_id': userId,
      'fullName': fullName,
      'full_name': fullName,
      'email': email,
      'role': role,
      'phone': phone,
      'profileImage': profileImage,
      'profile_image': profileImage,
      'approvalStatus': approvalStatus,
      'isApproved': isApproved,
      'location': location,
      'favoriteSport': favoriteSport,
      'bio': bio,
      'createdAt': createdAt,
      'created_at': createdAt,
    };
  }
}



