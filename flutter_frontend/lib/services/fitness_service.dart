import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'api_service.dart';
import 'auth_service.dart';
import '../models/fitness_model.dart';

class FitnessService {
  static String get _baseUrl => '${ApiService.baseUrl}/fitness';

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (AuthService.currentToken != null && AuthService.currentToken!.isNotEmpty)
          'Authorization': 'Bearer ${AuthService.currentToken}',
      };

  // ---------------------------------------------------------
  // Helper for generic GET requests
  // ---------------------------------------------------------
  static Future<Map<String, dynamic>> _handleGet(String endpoint) async {
    try {
      if (AuthService.currentToken == null || AuthService.currentToken!.isEmpty) {
        return {'success': false, 'message': 'Unauthorized: No token found.'};
      }
      final res = await http.get(Uri.parse('$_baseUrl$endpoint'), headers: _headers).timeout(const Duration(seconds: 10));
      
      if (res.body.isEmpty) return {'success': false, 'message': 'Empty response from server.'};
      
      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {'success': true, 'raw': data};
      } else if (res.statusCode == 401 || res.statusCode == 403) {
        return {'success': false, 'message': 'Unauthorized: Please log in again.'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Server error: ${res.statusCode}'};
      }
    } catch (e) {
      debugPrint('FitnessService GET $endpoint error: $e');
      return {'success': false, 'message': 'Network error or timeout. Please check your connection.'};
    }
  }

  // ---------------------------------------------------------
  // Helper for generic POST/PUT/DELETE requests
  // ---------------------------------------------------------
  static Future<Map<String, dynamic>> _handleMutation(String method, String endpoint, [Map<String, dynamic>? body]) async {
    try {
      if (AuthService.currentToken == null || AuthService.currentToken!.isEmpty) {
        return {'success': false, 'message': 'Unauthorized: No token found.'};
      }
      
      final uri = Uri.parse('$_baseUrl$endpoint');
      http.Response res;

      if (method == 'POST') {
        res = await http.post(uri, headers: _headers, body: jsonEncode(body)).timeout(const Duration(seconds: 10));
      } else if (method == 'PUT') {
        res = await http.put(uri, headers: _headers, body: jsonEncode(body)).timeout(const Duration(seconds: 10));
      } else {
        res = await http.delete(uri, headers: _headers).timeout(const Duration(seconds: 10));
      }

      if (res.body.isEmpty) return {'success': false, 'message': 'Empty response from server.'};

      final data = jsonDecode(res.body);
      if (res.statusCode == 200 || res.statusCode == 201) {
        return {'success': true, 'raw': data};
      } else if (res.statusCode == 401 || res.statusCode == 403) {
        return {'success': false, 'message': 'Unauthorized: Please log in again.'};
      } else {
        return {'success': false, 'message': data['message'] ?? 'Action failed with status ${res.statusCode}'};
      }
    } catch (e) {
      debugPrint('FitnessService $method $endpoint error: $e');
      return {'success': false, 'message': 'Network error or timeout. Please check your connection.'};
    }
  }

  // =========================================================
  // FITNESS METRICS (RECORDS)
  // =========================================================

  static Future<Map<String, dynamic>> getTodayFitness() async {
    final response = await _handleGet('/today');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final records = list.map((e) => FitnessRecord.fromJson(e)).toList();
      return {'success': true, 'data': records};
    }
    return response;
  }

  static Future<Map<String, dynamic>> getFitnessHistory() async {
    final response = await _handleGet('/history');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final records = list.map((e) => FitnessRecord.fromJson(e)).toList();
      return {'success': true, 'data': records, 'count': data['count'] ?? 0};
    }
    return response;
  }

  static Future<Map<String, dynamic>> getWeeklyFitness() async {
    final response = await _handleGet('/weekly');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final records = list.map((e) => FitnessRecord.fromJson(e)).toList();
      final stats = data['statistics'] != null ? FitnessStatistics.fromJson(data['statistics']) : FitnessStatistics();
      return {'success': true, 'data': records, 'statistics': stats};
    }
    return response;
  }

  static Future<Map<String, dynamic>> getMonthlyFitness() async {
    final response = await _handleGet('/monthly');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final records = list.map((e) => FitnessRecord.fromJson(e)).toList();
      final stats = data['statistics'] != null ? FitnessStatistics.fromJson(data['statistics']) : FitnessStatistics();
      return {'success': true, 'data': records, 'statistics': stats};
    }
    return response;
  }

  static Future<Map<String, dynamic>> createFitnessRecord(Map<String, dynamic> recordData) async {
    final response = await _handleMutation('POST', '/records', recordData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': FitnessRecord.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> updateFitnessRecord(String id, Map<String, dynamic> recordData) async {
    final response = await _handleMutation('PUT', '/records/$id', recordData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': FitnessRecord.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> deleteFitnessRecord(String id) async {
    final response = await _handleMutation('DELETE', '/records/$id');
    if (response['success'] == true) {
      return {'success': true, 'message': response['raw']['message'] ?? 'Record deleted successfully'};
    }
    return response;
  }

  // =========================================================
  // SPORTS ACTIVITIES
  // =========================================================

  static Future<Map<String, dynamic>> getActivities() async {
    final response = await _handleGet('/activities');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final activities = list.map((e) => SportsActivity.fromJson(e)).toList();
      final stats = data['statistics'] != null ? FitnessStatistics.fromJson(data['statistics']) : FitnessStatistics();
      return {'success': true, 'data': activities, 'count': data['count'] ?? 0, 'statistics': stats};
    }
    return response;
  }

  static Future<Map<String, dynamic>> createActivity(Map<String, dynamic> activityData) async {
    final response = await _handleMutation('POST', '/activities', activityData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': SportsActivity.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> updateActivity(String id, Map<String, dynamic> activityData) async {
    final response = await _handleMutation('PUT', '/activities/$id', activityData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': SportsActivity.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> deleteActivity(String id) async {
    final response = await _handleMutation('DELETE', '/activities/$id');
    if (response['success'] == true) {
      return {'success': true, 'message': response['raw']['message'] ?? 'Activity deleted successfully'};
    }
    return response;
  }

  // =========================================================
  // FITNESS GOALS
  // =========================================================

  static Future<Map<String, dynamic>> getGoals() async {
    final response = await _handleGet('/goals');
    if (response['success'] == true) {
      final data = response['raw'];
      final list = data['data'] is List ? data['data'] as List : [];
      final goals = list.map((e) => FitnessGoal.fromJson(e)).toList();
      return {'success': true, 'data': goals, 'count': data['count'] ?? 0};
    }
    return response;
  }

  static Future<Map<String, dynamic>> createGoal(Map<String, dynamic> goalData) async {
    final response = await _handleMutation('POST', '/goals', goalData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': FitnessGoal.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> updateGoal(String id, Map<String, dynamic> goalData) async {
    final response = await _handleMutation('PUT', '/goals/$id', goalData);
    if (response['success'] == true) {
      final data = response['raw'];
      return {'success': true, 'data': FitnessGoal.fromJson(data['data']), 'message': data['message']};
    }
    return response;
  }

  static Future<Map<String, dynamic>> deleteGoal(String id) async {
    final response = await _handleMutation('DELETE', '/goals/$id');
    if (response['success'] == true) {
      return {'success': true, 'message': response['raw']['message'] ?? 'Goal deleted successfully'};
    }
    return response;
  }
}
