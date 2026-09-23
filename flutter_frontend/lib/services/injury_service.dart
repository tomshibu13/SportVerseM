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
      return dotenv.env['ANDROID_API_URL'] ?? 'http://10.21.73.56:5000/api';
    }
    return dotenv.env['API_URL'] ?? 'http://localhost:5000/api';
  }

  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (AuthService.currentToken != null && AuthService.currentToken!.isNotEmpty)
      'Authorization': 'Bearer ${AuthService.currentToken}',
  };

  /// Sanitize history to prevent DateTime or non-serializable object errors in jsonEncode
  static List<Map<String, dynamic>> _sanitizeHistory(List<Map<String, dynamic>>? history) {
    if (history == null || history.isEmpty) return [];
    return history.map((item) {
      return {
        'sender': item['sender']?.toString() ?? 'user',
        'text': item['text']?.toString() ?? item['content']?.toString() ?? '',
        'intent': item['intent']?.toString(),
        'isInjury': item['isInjury'] == true,
        'riskLevel': item['riskLevel']?.toString(),
      };
    }).toList();
  }

  /// Dedicated RAG-powered Injury Assistant Endpoint
  static Future<Map<String, dynamic>> askInjuryAssistant({
    required String message,
    List<Map<String, dynamic>>? history,
    String? conversationId,
    String? sport,
    String? bodyPart,
  }) async {
    try {
      final sanitizedHistory = _sanitizeHistory(history);
      final payload = jsonEncode({
        'message': message,
        if (sanitizedHistory.isNotEmpty) 'history': sanitizedHistory,
        if (conversationId != null) 'conversationId': conversationId,
        if (sport != null) 'sport': sport,
        if (bodyPart != null) 'bodyPart': bodyPart,
      }, toEncodable: (nonEncodable) => nonEncodable.toString());

      final response = await http.post(
        Uri.parse('$baseUrl/ai/injury-assistant'),
        headers: _headers,
        body: payload,
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        debugPrint('Injury Assistant API HTTP ${response.statusCode}: ${response.body}');
      }
    } catch (e) {
      debugPrint('Injury Assistant API Error: $e');
    }

    return {
      'success': false,
      'answer': 'Unable to connect to the Sports Injury Assistant service. Please verify your internet connection and try again.',
      'reply': 'Unable to connect to the Sports Injury Assistant service. Please verify your internet connection and try again.',
      'sources': [],
      'disclaimer': 'This information is for general guidance and does not replace evaluation by a qualified healthcare professional.',
      'retrieved': false,
      'riskLevel': null,
    };
  }

  /// Full 8-step clinical assessment submission
  static Future<Map<String, dynamic>> assessInjury({required Map<String, dynamic> data}) async {
    try {
      final url = '$baseUrl/injury/assess';
      debugPrint('Calling injury assess at: $url');
      final response = await http.post(
        Uri.parse(url),
        headers: _headers,
        body: jsonEncode(data, toEncodable: (e) => e.toString()),
      ).timeout(const Duration(seconds: 30));

      debugPrint('Assess response: ${response.statusCode} - ${response.body}');
      if (response.statusCode == 200 || response.statusCode == 201) {
        final decoded = jsonDecode(response.body);
        return decoded;
      }
    } catch (e) {
      debugPrint('Assessment network error: $e');
    }

    return {
      'success': false,
      'message': 'Failed to connect to assessment server. Please check your network.',
      'report': null
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
        body: jsonEncode({'message': message}, toEncodable: (e) => e.toString()),
      ).timeout(const Duration(seconds: 30));

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Chat error: $e');
    }

    return {
      'success': false,
      'reply': 'Unable to send message. Please check your connection.',
      'sources': [],
      'chatHistory': [
        {'role': 'user', 'content': message, 'timestamp': DateTime.now().toIso8601String()},
        {
          'role': 'assistant',
          'content': 'Unable to connect to the live AI server. Please check your connection.',
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
        body: jsonEncode(data, toEncodable: (e) => e.toString()),
      ).timeout(const Duration(seconds: 10));

      if (response.statusCode == 200 || response.statusCode == 201) {
        return jsonDecode(response.body);
      }
    } catch (e) {
      debugPrint('Check-in error: $e');
    }
    return {'success': false};
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
