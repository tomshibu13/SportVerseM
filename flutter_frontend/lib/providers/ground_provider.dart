import 'package:flutter/material.dart';
import '../models/ground_model.dart';
import '../services/api_service.dart';

class GroundProvider with ChangeNotifier {
  List<GroundModel> _grounds = [];
  List<GroundModel> _aiRecommendations = [];
  bool _isLoading = false;
  String _selectedSport = 'All';
  String _searchQuery = '';

  List<GroundModel> get grounds => _grounds;
  List<GroundModel> get aiRecommendations => _aiRecommendations;
  bool get isLoading => _isLoading;
  String get selectedSport => _selectedSport;

  GroundProvider() {
    loadGrounds();
  }

  void setSelectedSport(String sport) {
    _selectedSport = sport;
    loadGrounds();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    loadGrounds();
  }

  Future<void> loadGrounds() async {
    _isLoading = true;
    notifyListeners();

    _grounds = await ApiService.fetchGrounds(sport: _selectedSport, search: _searchQuery);

    // AI recommendation sorting
    _aiRecommendations = List.from(_grounds)..sort((a, b) => b.aiScore.compareTo(a.aiScore));

    _isLoading = false;
    notifyListeners();
  }

  GroundModel? getGroundById(dynamic id) {
    try {
      final strId = id?.toString() ?? '';
      return _grounds.firstWhere((g) => g.groundId.toString() == strId || g.groundId == id);
    } catch (_) {
      return _grounds.isNotEmpty ? _grounds.first : null;
    }
  }
}
