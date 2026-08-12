import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  UserModel? _currentUser;
  String? _token;
  bool _isLoading = false;
  String _selectedRole = 'User'; // User, GroundOwner, ShopOwner, Admin

  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _currentUser != null;
  String get selectedRole => _currentUser?.role ?? _selectedRole;

  void setSelectedRole(String role) {
    _selectedRole = role;
    if (_currentUser != null) {
      // Update local role for testing roles seamlessly
      _currentUser = UserModel(
        userId: _currentUser!.userId,
        fullName: _currentUser!.fullName,
        email: _currentUser!.email,
        role: role,
        phone: _currentUser!.phone,
        profileImage: _currentUser!.profileImage,
        createdAt: _currentUser!.createdAt,
      );
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();

    final res = await ApiService.login(email, password);

    _isLoading = false;
    if (res['success'] == true) {
      _token = res['token'];
      _currentUser = UserModel.fromJson(res['user']);
      _selectedRole = _currentUser!.role;
      notifyListeners();
      return true;
    }

    notifyListeners();
    return false;
  }

  Future<bool> register({
    required String fullName,
    required String email,
    required String password,
    required String role,
    required String phone,
  }) async {
    _isLoading = true;
    notifyListeners();

    final res = await ApiService.register(fullName, email, password, role, phone);

    _isLoading = false;
    if (res['success'] == true) {
      _token = res['token'];
      _currentUser = UserModel.fromJson(res['user']);
      _selectedRole = _currentUser!.role;
      notifyListeners();
      return true;
    }

    notifyListeners();
    return false;
  }

  Future<bool> signInWithGoogle() async {
    _isLoading = true;
    notifyListeners();

    final res = await AuthService.signInWithGoogle();

    _isLoading = false;
    if (res['success'] == true && res['user'] != null) {
      _token = res['token'];
      _currentUser = UserModel.fromJson(res['user']);
      _selectedRole = _currentUser!.role;
      notifyListeners();
      return true;
    }

    notifyListeners();
    return false;
  }

  void logout() {
    _currentUser = null;
    _token = null;
    AuthService.logout();
    notifyListeners();
  }
}

