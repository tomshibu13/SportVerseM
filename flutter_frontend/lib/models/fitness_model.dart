class FitnessRecord {
  final String id;
  final String userId;
  final int steps;
  final double calories;
  final double distance;
  final int activeMinutes;
  final int? heartRate;
  final int? restingHeartRate;
  final double? weight;
  final double? height;
  final double? bmi;
  final double? bodyFat;
  final int? sleepMinutes;
  final double? bloodPressureSystolic;
  final double? bloodPressureDiastolic;
  final double? bloodGlucose;
  final double? bloodOxygen;
  final double? hydration;
  final Map<String, dynamic>? healthConnectRawData;
  final DateTime recordedAt;
  final String? source;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  FitnessRecord({
    required this.id,
    required this.userId,
    this.steps = 0,
    this.calories = 0.0,
    this.distance = 0.0,
    this.activeMinutes = 0,
    this.heartRate,
    this.restingHeartRate,
    this.weight,
    this.height,
    this.bmi,
    this.bodyFat,
    this.sleepMinutes,
    this.bloodPressureSystolic,
    this.bloodPressureDiastolic,
    this.bloodGlucose,
    this.bloodOxygen,
    this.hydration,
    this.healthConnectRawData,
    required this.recordedAt,
    this.source,
    this.createdAt,
    this.updatedAt,
  });

  factory FitnessRecord.fromJson(dynamic rawJson) {
    if (rawJson is FitnessRecord) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return FitnessRecord(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      steps: (json['steps'] is num) ? (json['steps'] as num).toInt() : (int.tryParse(json['steps']?.toString() ?? '0') ?? 0),
      calories: (json['calories'] is num) ? (json['calories'] as num).toDouble() : (double.tryParse(json['calories']?.toString() ?? '0') ?? 0.0),
      distance: (json['distance'] is num) ? (json['distance'] as num).toDouble() : (double.tryParse(json['distance']?.toString() ?? '0') ?? 0.0),
      activeMinutes: (json['active_minutes'] is num) ? (json['active_minutes'] as num).toInt() : (int.tryParse(json['active_minutes']?.toString() ?? '0') ?? 0),
      heartRate: (json['heart_rate'] is num) ? (json['heart_rate'] as num).toInt() : int.tryParse(json['heart_rate']?.toString() ?? ''),
      restingHeartRate: (json['resting_heart_rate'] is num) ? (json['resting_heart_rate'] as num).toInt() : int.tryParse(json['resting_heart_rate']?.toString() ?? ''),
      weight: (json['weight'] is num) ? (json['weight'] as num).toDouble() : double.tryParse(json['weight']?.toString() ?? ''),
      height: (json['height'] is num) ? (json['height'] as num).toDouble() : double.tryParse(json['height']?.toString() ?? ''),
      bmi: (json['bmi'] is num) ? (json['bmi'] as num).toDouble() : double.tryParse(json['bmi']?.toString() ?? ''),
      bodyFat: (json['body_fat'] is num) ? (json['body_fat'] as num).toDouble() : double.tryParse(json['body_fat']?.toString() ?? ''),
      sleepMinutes: (json['sleep_minutes'] is num) ? (json['sleep_minutes'] as num).toInt() : int.tryParse(json['sleep_minutes']?.toString() ?? ''),
      bloodPressureSystolic: (json['blood_pressure_systolic'] is num) ? (json['blood_pressure_systolic'] as num).toDouble() : double.tryParse(json['blood_pressure_systolic']?.toString() ?? ''),
      bloodPressureDiastolic: (json['blood_pressure_diastolic'] is num) ? (json['blood_pressure_diastolic'] as num).toDouble() : double.tryParse(json['blood_pressure_diastolic']?.toString() ?? ''),
      bloodGlucose: (json['blood_glucose'] is num) ? (json['blood_glucose'] as num).toDouble() : double.tryParse(json['blood_glucose']?.toString() ?? ''),
      bloodOxygen: (json['blood_oxygen'] is num) ? (json['blood_oxygen'] as num).toDouble() : double.tryParse(json['blood_oxygen']?.toString() ?? ''),
      hydration: (json['hydration'] is num) ? (json['hydration'] as num).toDouble() : double.tryParse(json['hydration']?.toString() ?? ''),
      healthConnectRawData: json['health_connect_raw_data'] is Map ? Map<String, dynamic>.from(json['health_connect_raw_data']) : null,
      recordedAt: json['recorded_at'] != null ? DateTime.tryParse(json['recorded_at'].toString()) ?? DateTime.now() : DateTime.now(),
      source: json['source']?.toString(),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) '_id': id,
      'user_id': userId,
      'steps': steps,
      'calories': calories,
      'distance': distance,
      'active_minutes': activeMinutes,
      if (heartRate != null) 'heart_rate': heartRate,
      if (restingHeartRate != null) 'resting_heart_rate': restingHeartRate,
      if (weight != null) 'weight': weight,
      if (height != null) 'height': height,
      if (bmi != null) 'bmi': bmi,
      if (bodyFat != null) 'body_fat': bodyFat,
      if (sleepMinutes != null) 'sleep_minutes': sleepMinutes,
      if (bloodPressureSystolic != null) 'blood_pressure_systolic': bloodPressureSystolic,
      if (bloodPressureDiastolic != null) 'blood_pressure_diastolic': bloodPressureDiastolic,
      if (bloodGlucose != null) 'blood_glucose': bloodGlucose,
      if (bloodOxygen != null) 'blood_oxygen': bloodOxygen,
      if (hydration != null) 'hydration': hydration,
      if (healthConnectRawData != null) 'health_connect_raw_data': healthConnectRawData,
      'recorded_at': recordedAt.toIso8601String(),
      if (source != null) 'source': source,
    };
  }
}

class SportsActivity {
  final String id;
  final String userId;
  final String? sportId;
  final int duration;
  final double calories;
  final double distance;
  final String? intensity;
  final DateTime activityDate;
  final String? notes;
  final String? source;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  SportsActivity({
    required this.id,
    required this.userId,
    this.sportId,
    this.duration = 0,
    this.calories = 0.0,
    this.distance = 0.0,
    this.intensity,
    required this.activityDate,
    this.notes,
    this.source,
    this.createdAt,
    this.updatedAt,
  });

  factory SportsActivity.fromJson(dynamic rawJson) {
    if (rawJson is SportsActivity) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return SportsActivity(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      sportId: json['sport_id']?.toString(),
      duration: (json['duration'] is num) ? (json['duration'] as num).toInt() : (int.tryParse(json['duration']?.toString() ?? '0') ?? 0),
      calories: (json['calories'] is num) ? (json['calories'] as num).toDouble() : (double.tryParse(json['calories']?.toString() ?? '0') ?? 0.0),
      distance: (json['distance'] is num) ? (json['distance'] as num).toDouble() : (double.tryParse(json['distance']?.toString() ?? '0') ?? 0.0),
      intensity: json['intensity']?.toString(),
      activityDate: json['activity_date'] != null ? DateTime.tryParse(json['activity_date'].toString()) ?? DateTime.now() : DateTime.now(),
      notes: json['notes']?.toString(),
      source: json['source']?.toString(),
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) '_id': id,
      'user_id': userId,
      if (sportId != null) 'sport_id': sportId,
      'duration': duration,
      'calories': calories,
      'distance': distance,
      if (intensity != null) 'intensity': intensity,
      'activity_date': activityDate.toIso8601String(),
      if (notes != null) 'notes': notes,
      if (source != null) 'source': source,
    };
  }
}

class FitnessGoal {
  final String id;
  final String userId;
  final String goalType;
  final double targetValue;
  final String period;
  final DateTime? startDate;
  final DateTime? endDate;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  FitnessGoal({
    required this.id,
    required this.userId,
    required this.goalType,
    required this.targetValue,
    required this.period,
    this.startDate,
    this.endDate,
    this.createdAt,
    this.updatedAt,
  });

  factory FitnessGoal.fromJson(dynamic rawJson) {
    if (rawJson is FitnessGoal) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return FitnessGoal(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      userId: json['user_id']?.toString() ?? json['userId']?.toString() ?? '',
      goalType: json['goal_type']?.toString() ?? '',
      targetValue: (json['target_value'] is num) ? (json['target_value'] as num).toDouble() : (double.tryParse(json['target_value']?.toString() ?? '0') ?? 0.0),
      period: json['period']?.toString() ?? '',
      startDate: json['start_date'] != null ? DateTime.tryParse(json['start_date'].toString()) : null,
      endDate: json['end_date'] != null ? DateTime.tryParse(json['end_date'].toString()) : null,
      createdAt: json['created_at'] != null ? DateTime.tryParse(json['created_at'].toString()) : null,
      updatedAt: json['updated_at'] != null ? DateTime.tryParse(json['updated_at'].toString()) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id.isNotEmpty) '_id': id,
      'user_id': userId,
      'goal_type': goalType,
      'target_value': targetValue,
      'period': period,
      if (startDate != null) 'start_date': startDate!.toIso8601String(),
      if (endDate != null) 'end_date': endDate!.toIso8601String(),
    };
  }
}

class FitnessStatistics {
  final int totalSteps;
  final double totalCalories;
  final double totalDistance;
  final int totalActiveMinutes;
  final int activitiesCount;
  final int? averageHeartRate;

  FitnessStatistics({
    this.totalSteps = 0,
    this.totalCalories = 0.0,
    this.totalDistance = 0.0,
    this.totalActiveMinutes = 0,
    this.activitiesCount = 0,
    this.averageHeartRate,
  });

  factory FitnessStatistics.fromJson(dynamic rawJson) {
    if (rawJson is FitnessStatistics) return rawJson;
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return FitnessStatistics(
      totalSteps: (json['total_steps'] is num) ? (json['total_steps'] as num).toInt() : (int.tryParse(json['total_steps']?.toString() ?? '0') ?? 0),
      totalCalories: (json['total_calories'] is num) ? (json['total_calories'] as num).toDouble() : (double.tryParse(json['total_calories']?.toString() ?? '0') ?? 0.0),
      totalDistance: (json['total_distance'] is num) ? (json['total_distance'] as num).toDouble() : (double.tryParse(json['total_distance']?.toString() ?? '0') ?? 0.0),
      totalActiveMinutes: (json['total_active_minutes'] is num) ? (json['total_active_minutes'] as num).toInt() : (int.tryParse(json['total_active_minutes']?.toString() ?? '0') ?? 0),
      activitiesCount: (json['activities_count'] is num) ? (json['activities_count'] as num).toInt() : (int.tryParse(json['activities_count']?.toString() ?? '0') ?? 0),
      averageHeartRate: (json['average_heart_rate'] is num) ? (json['average_heart_rate'] as num).toInt() : int.tryParse(json['average_heart_rate']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'total_steps': totalSteps,
      'total_calories': totalCalories,
      'total_distance': totalDistance,
      'total_active_minutes': totalActiveMinutes,
      'activities_count': activitiesCount,
      if (averageHeartRate != null) 'average_heart_rate': averageHeartRate,
    };
  }
}
