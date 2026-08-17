import 'package:flutter/material.dart';

class CheckIn {
  final DateTime date;
  final int painLevel;
  final String mobilityStatus;
  final String notes;

  CheckIn({
    required this.date,
    required this.painLevel,
    required this.mobilityStatus,
    required this.notes,
  });

  factory CheckIn.fromJson(Map<String, dynamic> json) {
    return CheckIn(
      date: DateTime.parse(json['date']),
      painLevel: json['painLevel'],
      mobilityStatus: json['mobilityStatus'],
      notes: json['notes'] ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'date': date.toIso8601String(),
      'painLevel': painLevel,
      'mobilityStatus': mobilityStatus,
      'notes': notes,
    };
  }
}

class ChatMessage {
  final String role;
  final String content;
  final DateTime timestamp;

  ChatMessage({
    required this.role,
    required this.content,
    required this.timestamp,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      role: json['role'],
      content: json['content'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'role': role,
      'content': content,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}

class InjuryReport {
  final String id;
  final String userId;
  final String sport;
  final String bodyPart;
  final String injuryMechanism;
  final List<String> symptoms;
  final int painLevel;
  final bool hasSwelling;
  final String mobilityStatus;
  final bool hasPreviousInjury;
  final int painDurationDays;
  final String riskLevel;
  final String responseType;
  final List<String> possibleCategories;
  final List<String> generalGuidance;
  final List<String> thingsToAvoid;
  final List<String> warningSigns;
  final bool professionalCareRecommended;
  final List<String> followUpQuestions;
  final String aiSummary;
  final List<dynamic> sources;
  final String disclaimer;
  final List<ChatMessage> chatHistory;
  final List<CheckIn> checkIns;
  final bool isGeminiUsed;
  final bool isFallback;
  final DateTime createdAt;

  InjuryReport({
    required this.id,
    required this.userId,
    required this.sport,
    required this.bodyPart,
    required this.injuryMechanism,
    required this.symptoms,
    required this.painLevel,
    required this.hasSwelling,
    required this.mobilityStatus,
    required this.hasPreviousInjury,
    required this.painDurationDays,
    required this.riskLevel,
    this.responseType = 'NORMAL',
    required this.possibleCategories,
    required this.generalGuidance,
    required this.thingsToAvoid,
    required this.warningSigns,
    required this.professionalCareRecommended,
    required this.followUpQuestions,
    required this.aiSummary,
    this.sources = const [],
    required this.disclaimer,
    required this.chatHistory,
    required this.checkIns,
    required this.isGeminiUsed,
    required this.isFallback,
    required this.createdAt,
  });

  factory InjuryReport.fromJson(Map<String, dynamic> json) {
    return InjuryReport(
      id: json['id'] ?? json['_id'] ?? '',
      userId: json['userId'] ?? '',
      sport: json['sport'] ?? '',
      bodyPart: json['bodyPart'] ?? '',
      injuryMechanism: json['injuryMechanism'] ?? '',
      symptoms: List<String>.from(json['symptoms'] ?? []),
      painLevel: json['painLevel'] ?? 0,
      hasSwelling: json['hasSwelling'] ?? false,
      mobilityStatus: json['mobilityStatus'] ?? '',
      hasPreviousInjury: json['hasPreviousInjury'] ?? false,
      painDurationDays: json['painDurationDays'] ?? 0,
      riskLevel: json['riskLevel'] ?? 'LOW',
      responseType: json['responseType'] ?? 'NORMAL',
      possibleCategories: List<String>.from(json['possibleCategories'] ?? []),
      generalGuidance: List<String>.from(json['generalGuidance'] ?? []),
      thingsToAvoid: List<String>.from(json['thingsToAvoid'] ?? []),
      warningSigns: List<String>.from(json['warningSigns'] ?? []),
      professionalCareRecommended: json['professionalCareRecommended'] ?? false,
      followUpQuestions: List<String>.from(json['followUpQuestions'] ?? []),
      aiSummary: json['aiSummary'] ?? '',
      sources: (json['sources'] as List<dynamic>?) ?? [],
      disclaimer: json['disclaimer'] ?? 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.',
      chatHistory: (json['chatHistory'] as List<dynamic>? ?? []).map((e) => ChatMessage.fromJson(e)).toList(),
      checkIns: (json['checkIns'] as List<dynamic>? ?? []).map((e) => CheckIn.fromJson(e)).toList(),
      isGeminiUsed: json['isGeminiUsed'] ?? false,
      isFallback: json['isFallback'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'sport': sport,
      'bodyPart': bodyPart,
      'injuryMechanism': injuryMechanism,
      'symptoms': symptoms,
      'painLevel': painLevel,
      'hasSwelling': hasSwelling,
      'mobilityStatus': mobilityStatus,
      'hasPreviousInjury': hasPreviousInjury,
      'painDurationDays': painDurationDays,
      'riskLevel': riskLevel,
      'responseType': responseType,
      'possibleCategories': possibleCategories,
      'generalGuidance': generalGuidance,
      'thingsToAvoid': thingsToAvoid,
      'warningSigns': warningSigns,
      'professionalCareRecommended': professionalCareRecommended,
      'followUpQuestions': followUpQuestions,
      'aiSummary': aiSummary,
      'sources': sources,
      'disclaimer': disclaimer,
      'chatHistory': chatHistory.map((e) => e.toJson()).toList(),
      'checkIns': checkIns.map((e) => e.toJson()).toList(),
      'isGeminiUsed': isGeminiUsed,
      'isFallback': isFallback,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  Color get riskColor {
    switch (riskLevel.toUpperCase()) {
      case 'LOW':
        return const Color(0xFF10B981);
      case 'MODERATE':
        return const Color(0xFFF59E0B);
      case 'HIGH':
        return const Color(0xFFEF4444);
      case 'URGENT':
        return const Color(0xFFDC2626);
      default:
        return const Color(0xFF10B981);
    }
  }

  IconData get riskIcon {
    switch (riskLevel.toUpperCase()) {
      case 'LOW':
        return Icons.verified;
      case 'MODERATE':
        return Icons.warning_amber_rounded;
      case 'HIGH':
        return Icons.error_outline;
      case 'URGENT':
        return Icons.emergency;
      default:
        return Icons.verified;
    }
  }
}
