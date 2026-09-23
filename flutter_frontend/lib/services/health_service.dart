import 'package:health/health.dart';
import 'package:flutter/foundation.dart';
import 'dart:io' show Platform;

class HealthService {
  final Health _health = Health();

  final List<HealthDataType> _dataTypes = [
    HealthDataType.STEPS,
    HealthDataType.DISTANCE_DELTA,
    HealthDataType.ACTIVE_ENERGY_BURNED,
    HealthDataType.HEART_RATE,
    HealthDataType.WORKOUT,
    HealthDataType.WEIGHT,
    HealthDataType.HEIGHT,
    HealthDataType.BODY_MASS_INDEX,
    HealthDataType.BODY_FAT_PERCENTAGE,
    HealthDataType.SLEEP_ASLEEP,
    HealthDataType.WATER,
    HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
    HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
    HealthDataType.BLOOD_GLUCOSE,
    HealthDataType.BLOOD_OXYGEN,
    HealthDataType.RESTING_HEART_RATE,
  ];

  /// Checks if Health Connect is installed or available on this device
  Future<bool> isHealthConnectAvailable() async {
    if (kIsWeb) return false;
    if (!Platform.isAndroid && !Platform.isIOS) return false;
    
    try {
      final available = await _health.hasPermissions(_dataTypes) ?? false;
      return available; // This isn't perfect for "is installed", but will do to check support
    } catch (e) {
      debugPrint('Error checking Health Connect availability: $e');
      return false;
    }
  }

  /// Request access to read health data
  Future<bool> requestPermissions() async {
    if (kIsWeb) return false;
    if (!Platform.isAndroid && !Platform.isIOS) return false;

    try {
      // We only need READ permissions.
      bool? hasPermissions = await _health.hasPermissions(_dataTypes);
      
      if (hasPermissions != true) {
        bool authorized = await _health.requestAuthorization(_dataTypes);
        return authorized;
      }
      return true;
    } catch (e) {
      debugPrint('Error requesting Health Connect permissions: $e');
      return false;
    }
  }

  /// Fetch today's comprehensive health metrics from Health Connect
  Future<Map<String, dynamic>> fetchTodayMetrics() async {
    Map<String, dynamic> result = {
      'steps': 0,
      'distance': 0.0,
      'calories': 0.0,
      'heartRate': 0,
      'activeMinutes': 0,
      'weight': null,
      'height': null,
      'bmi': null,
      'bodyFat': null,
      'sleepMinutes': 0,
      'bloodPressureSystolic': null,
      'bloodPressureDiastolic': null,
      'bloodGlucose': null,
      'bloodOxygen': null,
      'hydration': 0.0,
      'restingHeartRate': null,
    };

    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) return result;

    final now = DateTime.now();
    final startOfDay = DateTime(now.year, now.month, now.day);
    // For things like weight/height, we might want to check the last 30 days to get the latest reading
    final startOfMonth = now.subtract(const Duration(days: 30));

    try {
      // Fetch daily metrics
      final dailyData = await _health.getHealthDataFromTypes(
        startTime: startOfDay,
        endTime: now,
        types: [
          HealthDataType.STEPS,
          HealthDataType.DISTANCE_DELTA,
          HealthDataType.ACTIVE_ENERGY_BURNED,
          HealthDataType.HEART_RATE,
          HealthDataType.WORKOUT,
          HealthDataType.SLEEP_ASLEEP,
          HealthDataType.WATER,
          HealthDataType.BLOOD_PRESSURE_SYSTOLIC,
          HealthDataType.BLOOD_PRESSURE_DIASTOLIC,
          HealthDataType.BLOOD_GLUCOSE,
          HealthDataType.BLOOD_OXYGEN,
          HealthDataType.RESTING_HEART_RATE,
        ],
      );

      // Fetch long-term metrics (latest reading in 30 days)
      final longTermData = await _health.getHealthDataFromTypes(
        startTime: startOfMonth,
        endTime: now,
        types: [
          HealthDataType.WEIGHT,
          HealthDataType.HEIGHT,
          HealthDataType.BODY_MASS_INDEX,
          HealthDataType.BODY_FAT_PERCENTAGE,
        ],
      );

      final allData = [...dailyData, ...longTermData];
      final cleanedData = Health().removeDuplicates(allData);

      int totalSteps = 0;
      double totalDistance = 0.0;
      double totalCalories = 0.0;
      List<int> heartRates = [];
      List<int> restingHeartRates = [];
      int activeMinutes = 0;
      int sleepMinutes = 0;
      double totalHydration = 0.0;

      // Variables to store the latest readings
      double? latestWeight;
      double? latestHeight;
      double? latestBmi;
      double? latestBodyFat;
      double? latestSysBp;
      double? latestDiaBp;
      double? latestGlucose;
      double? latestOxygen;
      
      DateTime? latestWeightDate;
      DateTime? latestHeightDate;
      DateTime? latestBmiDate;
      DateTime? latestBodyFatDate;
      DateTime? latestSysBpDate;
      DateTime? latestDiaBpDate;
      DateTime? latestGlucoseDate;
      DateTime? latestOxygenDate;

      for (HealthDataPoint point in cleanedData) {
        final val = point.value;
        if (val is NumericHealthValue) {
          final double numVal = val.numericValue.toDouble();
          
          switch (point.type) {
            case HealthDataType.STEPS:
              totalSteps += numVal.toInt();
              break;
            case HealthDataType.DISTANCE_DELTA:
              totalDistance += numVal / 1000.0; // convert to km
              break;
            case HealthDataType.ACTIVE_ENERGY_BURNED:
              totalCalories += numVal;
              break;
            case HealthDataType.HEART_RATE:
              heartRates.add(numVal.toInt());
              break;
            case HealthDataType.RESTING_HEART_RATE:
              restingHeartRates.add(numVal.toInt());
              break;
            case HealthDataType.WATER:
              totalHydration += numVal; // typically in liters
              break;
            case HealthDataType.WEIGHT:
              if (latestWeightDate == null || point.dateTo.isAfter(latestWeightDate)) {
                latestWeight = numVal;
                latestWeightDate = point.dateTo;
              }
              break;
            case HealthDataType.HEIGHT:
              if (latestHeightDate == null || point.dateTo.isAfter(latestHeightDate)) {
                latestHeight = numVal;
                latestHeightDate = point.dateTo;
              }
              break;
            case HealthDataType.BODY_MASS_INDEX:
              if (latestBmiDate == null || point.dateTo.isAfter(latestBmiDate)) {
                latestBmi = numVal;
                latestBmiDate = point.dateTo;
              }
              break;
            case HealthDataType.BODY_FAT_PERCENTAGE:
              if (latestBodyFatDate == null || point.dateTo.isAfter(latestBodyFatDate)) {
                latestBodyFat = numVal;
                latestBodyFatDate = point.dateTo;
              }
              break;
            case HealthDataType.BLOOD_PRESSURE_SYSTOLIC:
              if (latestSysBpDate == null || point.dateTo.isAfter(latestSysBpDate)) {
                latestSysBp = numVal;
                latestSysBpDate = point.dateTo;
              }
              break;
            case HealthDataType.BLOOD_PRESSURE_DIASTOLIC:
              if (latestDiaBpDate == null || point.dateTo.isAfter(latestDiaBpDate)) {
                latestDiaBp = numVal;
                latestDiaBpDate = point.dateTo;
              }
              break;
            case HealthDataType.BLOOD_GLUCOSE:
              if (latestGlucoseDate == null || point.dateTo.isAfter(latestGlucoseDate)) {
                latestGlucose = numVal;
                latestGlucoseDate = point.dateTo;
              }
              break;
            case HealthDataType.BLOOD_OXYGEN:
              if (latestOxygenDate == null || point.dateTo.isAfter(latestOxygenDate)) {
                latestOxygen = numVal;
                latestOxygenDate = point.dateTo;
              }
              break;
            default:
              break;
          }
        } else {
          // Handle non-numeric or duration based types
          if (point.type == HealthDataType.WORKOUT) {
            final duration = point.dateTo.difference(point.dateFrom).inMinutes;
            activeMinutes += duration;
          } else if (point.type == HealthDataType.SLEEP_ASLEEP) {
            final duration = point.dateTo.difference(point.dateFrom).inMinutes;
            sleepMinutes += duration;
          }
        }
      }

      int avgHeartRate = 0;
      if (heartRates.isNotEmpty) {
        avgHeartRate = (heartRates.reduce((a, b) => a + b) / heartRates.length).round();
      }

      int avgRestingHeartRate = 0;
      if (restingHeartRates.isNotEmpty) {
        avgRestingHeartRate = (restingHeartRates.reduce((a, b) => a + b) / restingHeartRates.length).round();
      }

      result['steps'] = totalSteps;
      result['distance'] = totalDistance;
      result['calories'] = totalCalories;
      result['heartRate'] = avgHeartRate;
      result['activeMinutes'] = activeMinutes;
      result['sleepMinutes'] = sleepMinutes;
      result['hydration'] = totalHydration;
      
      result['restingHeartRate'] = avgRestingHeartRate > 0 ? avgRestingHeartRate : null;
      result['weight'] = latestWeight;
      result['height'] = latestHeight;
      result['bmi'] = latestBmi;
      result['bodyFat'] = latestBodyFat;
      result['bloodPressureSystolic'] = latestSysBp;
      result['bloodPressureDiastolic'] = latestDiaBp;
      result['bloodGlucose'] = latestGlucose;
      result['bloodOxygen'] = latestOxygen;

    } catch (e) {
      debugPrint('Error fetching Health Connect data: $e');
      throw Exception('Failed to fetch data from Health Connect');
    }

    return result;
  }

  /// Fetch Exercise Sessions (Workouts) to map to SportsActivities
  Future<List<Map<String, dynamic>>> fetchRecentWorkouts() async {
    List<Map<String, dynamic>> workouts = [];
    if (kIsWeb || (!Platform.isAndroid && !Platform.isIOS)) return workouts;

    final now = DateTime.now();
    final startOfWeek = now.subtract(const Duration(days: 7));

    try {
      final healthData = await _health.getHealthDataFromTypes(
        startTime: startOfWeek,
        endTime: now,
        types: [HealthDataType.WORKOUT],
      );

      for (HealthDataPoint point in healthData) {
        final duration = point.dateTo.difference(point.dateFrom).inMinutes;
        if (duration > 0) {
          workouts.add({
            'sport_id': 'Other', 
            'duration': duration,
            'activity_date': point.dateFrom.toIso8601String(),
            'calories': 0.0, 
            'distance': 0.0,
            'notes': 'Synced from Health Connect',
            'source': 'Health Connect'
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching Workouts from Health Connect: $e');
    }

    return workouts;
  }
}
