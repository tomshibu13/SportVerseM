import 'package:flutter/material.dart';
import '../models/fitness_model.dart';
import '../services/fitness_service.dart';
import '../services/health_service.dart';

class FitnessProvider with ChangeNotifier {
  // State: Fitness Records
  List<FitnessRecord> _todayFitness = [];
  List<FitnessRecord> _fitnessHistory = [];
  List<FitnessRecord> _weeklyFitness = [];
  List<FitnessRecord> _monthlyFitness = [];

  // State: Sports Activities
  List<SportsActivity> _activities = [];

  // State: Fitness Goals
  List<FitnessGoal> _goals = [];

  // State: Statistics
  FitnessStatistics _weeklyStats = FitnessStatistics();
  FitnessStatistics _monthlyStats = FitnessStatistics();
  FitnessStatistics _activityStats = FitnessStatistics();

  // Loading & Error States
  bool _isLoading = false;
  String? _errorMessage;

  // Getters
  List<FitnessRecord> get todayFitness => _todayFitness;
  List<FitnessRecord> get fitnessHistory => _fitnessHistory;
  List<FitnessRecord> get weeklyFitness => _weeklyFitness;
  List<FitnessRecord> get monthlyFitness => _monthlyFitness;
  List<SportsActivity> get activities => _activities;
  List<FitnessGoal> get goals => _goals;

  FitnessStatistics get weeklyStats => _weeklyStats;
  FitnessStatistics get monthlyStats => _monthlyStats;
  FitnessStatistics get activityStats => _activityStats;

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Set Loading
  void _setLoading(bool value) {
    _isLoading = value;
    notifyListeners();
  }

  // Set Error
  void _setError(String? message) {
    _errorMessage = message;
    notifyListeners();
  }

  // ---------------------------------------------------------
  // LOADERS
  // ---------------------------------------------------------

  Future<void> loadToday() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getTodayFitness();
    if (res['success']) {
      _todayFitness = (res['data'] as List).cast<FitnessRecord>();
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> loadHistory() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getFitnessHistory();
    if (res['success']) {
      _fitnessHistory = (res['data'] as List).cast<FitnessRecord>();
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> loadWeekly() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getWeeklyFitness();
    if (res['success']) {
      _weeklyFitness = (res['data'] as List).cast<FitnessRecord>();
      _weeklyStats = res['statistics'] as FitnessStatistics;
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> loadMonthly() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getMonthlyFitness();
    if (res['success']) {
      _monthlyFitness = (res['data'] as List).cast<FitnessRecord>();
      _monthlyStats = res['statistics'] as FitnessStatistics;
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> loadActivities() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getActivities();
    if (res['success']) {
      _activities = (res['data'] as List).cast<SportsActivity>();
      _activityStats = res['statistics'] as FitnessStatistics;
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> loadGoals() async {
    _setLoading(true);
    _setError(null);
    final res = await FitnessService.getGoals();
    if (res['success']) {
      _goals = (res['data'] as List).cast<FitnessGoal>();
    } else {
      _setError(res['message']);
    }
    _setLoading(false);
  }

  Future<void> refreshAll() async {
    await Future.wait([
      loadToday(),
      loadHistory(),
      loadWeekly(),
      loadMonthly(),
      loadActivities(),
      loadGoals(),
    ]);
  }

  // ---------------------------------------------------------
  // HEALTH CONNECT SYNC
  // ---------------------------------------------------------

  Future<bool> syncHealthData() async {
    _setLoading(true);
    _setError(null);
    try {
      final healthService = HealthService();
      
      final authorized = await healthService.requestPermissions();
      if (!authorized) {
        _setError('Health permissions denied or unavailable.');
        _setLoading(false);
        return false;
      }

      final metrics = await healthService.fetchTodayMetrics();
      
      String? todayRecordId;
      if (_todayFitness.isNotEmpty) {
        todayRecordId = _todayFitness.first.id;
      }

      final payload = {
        'steps': metrics['steps'],
        'distance': metrics['distance'],
        'calories': metrics['calories'],
        'heart_rate': metrics['heartRate'],
        'active_minutes': metrics['activeMinutes'],
        'resting_heart_rate': metrics['restingHeartRate'],
        'weight': metrics['weight'],
        'height': metrics['height'],
        'bmi': metrics['bmi'],
        'body_fat': metrics['bodyFat'],
        'sleep_minutes': metrics['sleepMinutes'],
        'blood_pressure_systolic': metrics['bloodPressureSystolic'],
        'blood_pressure_diastolic': metrics['bloodPressureDiastolic'],
        'blood_glucose': metrics['bloodGlucose'],
        'blood_oxygen': metrics['bloodOxygen'],
        'hydration': metrics['hydration'],
        'source': 'Health Connect',
        'recorded_at': DateTime.now().toIso8601String(),
      };

      bool success = false;
      if (todayRecordId != null) {
        final res = await FitnessService.updateFitnessRecord(todayRecordId, payload);
        success = res['success'] == true;
      } else {
        final res = await FitnessService.createFitnessRecord(payload);
        success = res['success'] == true;
      }

      if (!success) {
        _setError('Failed to sync metrics to backend.');
      }

      // Sync workouts safely
      try {
        final workouts = await healthService.fetchRecentWorkouts();
        for (var workout in workouts) {
          // Prevent duplicates by checking date
          final exists = _activities.any((a) => a.activityDate.toIso8601String() == workout['activity_date']);
          if (!exists) {
            await FitnessService.createActivity(workout);
          }
        }
      } catch (e) {
        debugPrint('Workout sync ignored error: $e');
      }

      await refreshAll();
      _setLoading(false);
      return success;
    } catch (e) {
      _setError('Sync failed: $e');
      _setLoading(false);
      return false;
    }
  }

  // ---------------------------------------------------------
  // FITNESS RECORDS CRUD
  // ---------------------------------------------------------

  Future<bool> addFitnessRecord(Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.createFitnessRecord(data);
    if (res['success']) {
      await Future.wait([loadToday(), loadWeekly(), loadMonthly()]);
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateFitnessRecord(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.updateFitnessRecord(id, data);
    if (res['success']) {
      await Future.wait([loadToday(), loadWeekly(), loadMonthly(), loadHistory()]);
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> deleteFitnessRecord(String id) async {
    _setLoading(true);
    final res = await FitnessService.deleteFitnessRecord(id);
    if (res['success']) {
      await Future.wait([loadToday(), loadWeekly(), loadMonthly(), loadHistory()]);
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  // ---------------------------------------------------------
  // SPORTS ACTIVITIES CRUD
  // ---------------------------------------------------------

  Future<bool> addActivity(Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.createActivity(data);
    if (res['success']) {
      await loadActivities();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateActivity(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.updateActivity(id, data);
    if (res['success']) {
      await loadActivities();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> deleteActivity(String id) async {
    _setLoading(true);
    final res = await FitnessService.deleteActivity(id);
    if (res['success']) {
      await loadActivities();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  // ---------------------------------------------------------
  // FITNESS GOALS CRUD
  // ---------------------------------------------------------

  Future<bool> addGoal(Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.createGoal(data);
    if (res['success']) {
      await loadGoals();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> updateGoal(String id, Map<String, dynamic> data) async {
    _setLoading(true);
    final res = await FitnessService.updateGoal(id, data);
    if (res['success']) {
      await loadGoals();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }

  Future<bool> deleteGoal(String id) async {
    _setLoading(true);
    final res = await FitnessService.deleteGoal(id);
    if (res['success']) {
      await loadGoals();
      return true;
    } else {
      _setError(res['message']);
      _setLoading(false);
      return false;
    }
  }
}
