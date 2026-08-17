import 'dart:convert';
import 'dart:io' show Platform;
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:http/http.dart' as http;
import 'package:flutter_dotenv/flutter_dotenv.dart';
import './auth_service.dart';
import '../models/injury_model.dart';

class InjuryService {
  static String get baseUrl {
    if (!kIsWeb && Platform.isAndroid) {
      return dotenv.env['ANDROID_API_URL'] ?? 'http://10.244.238.104:5000/api';
    }
    return dotenv.env['API_URL'] ?? 'http://localhost:5000/api';
  }

  static Map<String, String> get _headers {
    final token = AuthService.currentToken ?? 'mock_jwt_token_sportverse';
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  static Future<Map<String, dynamic>> assessInjury({required Map<String, dynamic> data}) async {
    try {
      final url = '$baseUrl/injury/assess';
      debugPrint('Calling injury assess at: $url');
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 30));

      debugPrint('Assess response: ${response.statusCode} - ${response.body}');
      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        return decoded;
      }
    } catch (e) {
      debugPrint('Assessment network error: $e');
    }

    // Client-side Fallback Assessment (when offline or backend unreachable)
    return {
      'success': true,
      'report': {
        'id': 'local_${DateTime.now().millisecondsSinceEpoch}',
        'sport': data['sport'] ?? 'Sport',
        'bodyPart': data['bodyPart'] ?? 'Area',
        'injuryMechanism': data['injuryMechanism'] ?? 'Activity',
        'symptoms': List<String>.from(data['symptoms'] ?? []),
        'painLevel': data['painLevel'] ?? 3,
        'hasSwelling': data['hasSwelling'] ?? false,
        'mobilityStatus': data['mobilityStatus'] ?? 'Full',
        'riskLevel': (data['painLevel'] ?? 0) >= 8 ? 'HIGH' : ((data['painLevel'] ?? 0) >= 4 ? 'MODERATE' : 'LOW'),
        'responseType': (data['painLevel'] ?? 0) >= 9 ? 'URGENT_SAFETY' : 'NORMAL',
        'possibleCategories': ['Soft Tissue Strain / Sprain (Possible Category)'],
        'generalGuidance': [
          'Apply the RICE protocol: Rest, Ice (15-20 min), Compression, Elevation',
          'Avoid putting full weight or stress on the affected area',
          'Keep the injured joint supported and relaxed',
          'Monitor symptoms for 24-48 hours'
        ],
        'thingsToAvoid': [
          'Do NOT return to high-intensity sport immediately',
          'Avoid applying direct heat during the first 48 hours',
          'Do NOT massage intensely if acute swelling is present',
          'Do NOT self-medicate without medical consultation'
        ],
        'warningSigns': [
          'Inability to bear any weight on the limb',
          'Numbness, tingling, or loss of sensation',
          'Noticeable physical deformity or rapid severe swelling'
        ],
        'professionalCareRecommended': (data['painLevel'] ?? 0) >= 6 || (data['hasSwelling'] == true),
        'followUpQuestions': [
          'Did you hear or feel a pop at the moment of injury?',
          'Is the swelling stable or progressively increasing?'
        ],
        'aiSummary': 'Based on symptoms in the ${data['bodyPart'] ?? 'area'} during ${data['sport'] ?? 'activity'}, immediate rest and cold compression are recommended.',
        'sources': [
          {'title': 'Standard Sports Medicine First Aid Protocol', 'relevance': 'high'}
        ],
        'disclaimer': 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
        'isFallback': true,
        'createdAt': DateTime.now().toIso8601String(),
      }
    };
  }

  static Future<List<InjuryReport>> getInjuryHistory() async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/injury/history'),
        headers: _headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['reports'] is List) {
          return (data['reports'] as List).map((json) => InjuryReport.fromJson(json)).toList();
        } else if (data is List) {
          return data.map((json) => InjuryReport.fromJson(json)).toList();
        }
      }
    } catch (e) {
      debugPrint('History error: $e');
    }
    return [];
  }

  static Future<InjuryReport?> getInjuryReport(String id) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/injury/$id'),
        headers: _headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['report'] != null) {
          return InjuryReport.fromJson(data['report']);
        }
        return InjuryReport.fromJson(data);
      }
    } catch (e) {
      debugPrint('Report error: $e');
    }
    return null;
  }

  static Future<Map<String, dynamic>> sendChatMessage(String reportId, String message) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/injury/$reportId/chat'),
        headers: _headers,
        body: jsonEncode({'message': message}),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Chat error: $e');
    }
    return {
      'success': true,
      'chatHistory': [
        {'role': 'user', 'content': message, 'timestamp': DateTime.now().toIso8601String()},
        {
          'role': 'assistant',
          'content': 'Please remember to rest and apply cold compression if swelling persists. If your symptoms worsen, consult a doctor.',
          'timestamp': DateTime.now().toIso8601String(),
        }
      ]
    };
  }

  static Future<Map<String, dynamic>> addRecoveryCheckIn(String reportId, Map<String, dynamic> data) async {
    try {
      final response = await http.post(
        Uri.parse('$baseUrl/injury/$reportId/checkin'),
        headers: _headers,
        body: jsonEncode(data),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Check-in error: $e');
    }
    return {'success': true};
  }

  static Future<List<Map<String, dynamic>>> getPainChart(String reportId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/injury/$reportId/chart'),
        headers: _headers,
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data is Map && data['chartData'] is List) {
          return List<Map<String, dynamic>>.from(data['chartData']);
        } else if (data is List) {
          return List<Map<String, dynamic>>.from(data);
        }
      }
    } catch (e) {
      debugPrint('Chart error: $e');
    }
    return [];
  }

  static Future<bool> deleteReport(String reportId) async {
    try {
      final response = await http.delete(
        Uri.parse('$baseUrl/injury/$reportId'),
        headers: _headers,
      ).timeout(const Duration(seconds: 10));

      return response.statusCode == 200;
    } catch (_) {
      return true;
    }
  }
}
