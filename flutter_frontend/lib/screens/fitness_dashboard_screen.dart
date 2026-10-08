import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import 'dart:ui';
import 'dart:math' as math;

import '../providers/fitness_provider.dart';
import '../models/fitness_model.dart';
import '../theme/app_theme.dart';

class FitnessDashboardScreen extends StatefulWidget {
  const FitnessDashboardScreen({super.key});

  @override
  State<FitnessDashboardScreen> createState() => _FitnessDashboardScreenState();
}

class _FitnessDashboardScreenState extends State<FitnessDashboardScreen> with SingleTickerProviderStateMixin {
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
    _animationController.forward();
    
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FitnessProvider>().refreshAll();
    });
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _onRefresh() async {
    await context.read<FitnessProvider>().refreshAll();
    _animationController.reset();
    _animationController.forward();
  }

  Widget _buildAnimatedSection(Widget child, int index) {
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, childWidget) {
        final double delay = (index * 0.1).clamp(0.0, 1.0);
        final double end = (delay + 0.5).clamp(0.0, 1.0);
        final Animation<double> curve = CurvedAnimation(
          parent: _animationController,
          curve: Interval(delay, end, curve: Curves.easeOutCubic),
        );
        
        return Opacity(
          opacity: curve.value,
          child: Transform.translate(
            offset: Offset(0, 30 * (1 - curve.value)),
            child: childWidget,
          ),
        );
      },
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: Consumer<FitnessProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.todayFitness.isEmpty && provider.weeklyFitness.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.warmAccent));
          }

          if (provider.errorMessage != null && provider.todayFitness.isEmpty) {
            return _buildErrorState(provider);
          }

          return RefreshIndicator(
            color: AppColors.warmAccent,
            onRefresh: _onRefresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
              slivers: [
                SliverAppBar(
                  expandedHeight: 140,
                  pinned: true,
                  stretch: true,
                  backgroundColor: AppColors.primaryBlack,
                  flexibleSpace: FlexibleSpaceBar(
                    title: const Text(
                      'Fitness Dashboard',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                    centerTitle: true,
                    background: Container(
                      decoration: const BoxDecoration(
                        gradient: AppColors.goldGradient,
                      ),
                      child: Stack(
                        children: [
                          Positioned(
                            right: -50,
                            top: -50,
                            child: Icon(Icons.fitness_center, size: 200, color: Colors.white.withValues(alpha: 0.1)),
                          ),
                          Positioned(
                            left: -30,
                            bottom: -20,
                            child: Icon(Icons.monitor_heart, size: 150, color: Colors.white.withValues(alpha: 0.05)),
                          ),
                        ],
                      ),
                    ),
                  ),
                  actions: [
                    IconButton(
                      icon: provider.isLoading
                          ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                          : const Icon(Icons.sync, color: Colors.white),
                      tooltip: 'Sync Health Data',
                      onPressed: provider.isLoading
                          ? null
                          : () async {
                              final success = await provider.syncHealthData();
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(success ? 'Health data synced successfully' : provider.errorMessage ?? 'Failed to sync health data'),
                                    backgroundColor: success ? Colors.green : Colors.red,
                                  ),
                                );
                              }
                            },
                    ),
                  ],
                ),
                SliverPadding(
                  padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 24.0),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Today\'s Activity'),
                          const SizedBox(height: 16),
                          _buildTodaySummary(provider),
                        ],
                      ), 0),
                      const SizedBox(height: 32),

                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Goal Progress'),
                          const SizedBox(height: 16),
                          _buildGoalProgress(provider),
                        ],
                      ), 1),
                      const SizedBox(height: 32),

                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Weekly Activity'),
                          const SizedBox(height: 16),
                          _buildWeeklyChart(provider),
                        ],
                      ), 2),
                      const SizedBox(height: 32),

                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Sports Activity'),
                          const SizedBox(height: 16),
                          _buildRecentActivities(provider),
                        ],
                      ), 3),
                      const SizedBox(height: 32),

                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('AI Fitness Insight'),
                          const SizedBox(height: 16),
                          _buildAiInsightPlaceholder(),
                        ],
                      ), 4),
                      const SizedBox(height: 32),

                      _buildAnimatedSection(Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _buildSectionTitle('Health Data Explorer'),
                          const SizedBox(height: 16),
                          _buildHealthDataExplorer(provider),
                        ],
                      ), 5),
                      const SizedBox(height: 40),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildErrorState(FitnessProvider provider) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
          const SizedBox(height: 16),
          Text(
            provider.errorMessage ?? 'An error occurred',
            style: const TextStyle(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _onRefresh(),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primaryBlack,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 20,
        fontWeight: FontWeight.w800,
        color: AppColors.primaryBlack,
        letterSpacing: -0.5,
      ),
    );
  }

  Widget _buildTodaySummary(FitnessProvider provider) {
    final todayData = provider.todayFitness;
    int steps = 0;
    double calories = 0.0;
    double distance = 0.0;
    int activeMinutes = 0;
    int heartRate = 0;
    double po2 = 0.0;

    if (todayData.isNotEmpty) {
      final record = todayData.first;
      steps = record.steps;
      calories = record.calories;
      distance = record.distance;
      activeMinutes = record.activeMinutes;
      heartRate = record.heartRate ?? 0;
      po2 = record.bloodOxygen ?? 0.0;
    }

    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.3,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildGlassStatCard('Steps', steps.toString(), Icons.directions_walk, const [Color(0xFF4A90E2), Color(0xFF50E3C2)]),
        _buildGlassStatCard('Calories', '${calories.toStringAsFixed(0)} kcal', Icons.local_fire_department, const [Color(0xFFFF8E53), Color(0xFFFF512F)]),
        _buildGlassStatCard('Distance', '${distance.toStringAsFixed(1)} km', Icons.map, const [Color(0xFF11998E), Color(0xFF38EF7D)]),
        _buildGlassStatCard('Active Mins', '$activeMinutes min', Icons.timer, const [Color(0xFF8E2DE2), Color(0xFF4A00E0)]),
        _buildGlassStatCard('Heart Rate', '$heartRate bpm', Icons.favorite, const [Color(0xFFFF0844), Color(0xFFFFB199)]),
        _buildGlassStatCard('PO2 Level', '${po2.toStringAsFixed(1)}%', Icons.air, const [Color(0xFF00C9FF), Color(0xFF92FE9D)]),
      ],
    );
  }

  Widget _buildGlassStatCard(String title, String value, IconData icon, List<Color> gradientColors) {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withValues(alpha: 0.3),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Background large icon
          Positioned(
            right: -10,
            bottom: -10,
            child: Icon(icon, size: 80, color: Colors.white.withValues(alpha: 0.15)),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: const BoxDecoration(
                        color: Colors.white24,
                        shape: BoxShape.circle,
                      ),
                      child: Icon(icon, color: Colors.white, size: 16),
                    ),
                    const SizedBox(width: 8),
                    Flexible(
                      child: Text(
                        title,
                        style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w600),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    value,
                    style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGoalProgress(FitnessProvider provider) {
    final goals = provider.goals;
    final todayData = provider.todayFitness;
    
    FitnessGoal? stepsGoal;
    try {
      stepsGoal = goals.firstWhere((g) => g.goalType.toLowerCase() == 'steps');
    } catch (_) {}

    int currentSteps = 0;
    if (todayData.isNotEmpty) {
      currentSteps = todayData.first.steps;
    }

    double targetSteps = stepsGoal?.targetValue ?? 10000.0;
    double progress = currentSteps / targetSteps;
    if (progress > 1.0) progress = 1.0;
    if (progress < 0.0) progress = 0.0;
    if (progress.isNaN) progress = 0.0;

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: 120,
            height: 120,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircularProgressIndicator(
                  value: 1.0,
                  strokeWidth: 12,
                  color: AppColors.border.withValues(alpha: 0.5),
                ),
                CircularProgressIndicator(
                  value: progress,
                  strokeWidth: 12,
                  strokeCap: StrokeCap.round,
                  color: AppColors.warmAccent,
                ),
                Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        '${(progress * 100).toInt()}%',
                        style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
                      ),
                      const Text(
                        'Goal',
                        style: TextStyle(fontSize: 12, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 32),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Daily Steps', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                const SizedBox(height: 8),
                Text('$currentSteps', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: AppColors.warmAccent)),
                Text('/ ${targetSteps.toInt()}', style: const TextStyle(fontSize: 14, color: AppColors.mutedText, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWeeklyChart(FitnessProvider provider) {
    final weeklyData = provider.weeklyFitness;
    if (weeklyData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: const Center(child: Text('No data available for this week.', style: TextStyle(color: AppColors.textSecondary))),
      );
    }

    final sortedData = List<FitnessRecord>.from(weeklyData)
      ..sort((a, b) => a.recordedAt.compareTo(b.recordedAt));

    List<BarChartGroupData> barGroups = [];
    double maxSteps = 1000;

    for (int i = 0; i < sortedData.length; i++) {
      final record = sortedData[i];
      if (record.steps > maxSteps) maxSteps = record.steps.toDouble();
    }
    
    // Add 20% padding to top
    final double maxY = maxSteps * 1.2;

    for (int i = 0; i < sortedData.length; i++) {
      final record = sortedData[i];
      
      barGroups.add(
        BarChartGroupData(
          x: i,
          barRods: [
            BarChartRodData(
              toY: record.steps.toDouble(),
              gradient: AppColors.goldGradient,
              width: 20,
              borderRadius: BorderRadius.circular(6),
              backDrawRodData: BackgroundBarChartRodData(
                show: true,
                toY: maxY,
                color: AppColors.border.withValues(alpha: 0.3),
              ),
            )
          ],
        ),
      );
    }

    return Container(
      height: 280,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.03),
            blurRadius: 20,
            offset: const Offset(0, 10),
          )
        ],
      ),
      child: BarChart(
        BarChartData(
          alignment: BarChartAlignment.spaceAround,
          maxY: maxY,
          barTouchData: BarTouchData(
            enabled: true,
            touchTooltipData: BarTouchTooltipData(
              getTooltipItem: (group, groupIndex, rod, rodIndex) {
                return BarTooltipItem(
                  '${rod.toY.toInt()} steps',
                  const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                );
              },
            ),
          ),
          titlesData: FlTitlesData(
            show: true,
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                getTitlesWidget: (double value, TitleMeta meta) {
                  final index = value.toInt();
                  if (index >= 0 && index < sortedData.length) {
                    final dayFormat = DateFormat('EEE');
                    return Padding(
                      padding: const EdgeInsets.only(top: 12.0),
                      child: Text(
                        dayFormat.format(sortedData[index].recordedAt),
                        style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    );
                  }
                  return const Text('');
                },
              ),
            ),
            leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          gridData: const FlGridData(show: false),
          borderData: FlBorderData(show: false),
          barGroups: barGroups,
        ),
      ),
    );
  }

  Widget _buildRecentActivities(FitnessProvider provider) {
    final activities = provider.activities;
    if (activities.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: const Text('No recent sports activities.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return ListView.separated(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: EdgeInsets.zero,
      itemCount: activities.length > 3 ? 3 : activities.length,
      separatorBuilder: (context, index) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final activity = activities[index];
        final timeFormat = DateFormat('MMM d, yyyy • h:mm a');
        return Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 15,
                offset: const Offset(0, 5),
              )
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  gradient: AppColors.goldGradient,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Icon(Icons.directions_run, color: Colors.white, size: 24),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      (activity.sportId != null && activity.sportId != 'Other')
                          ? activity.sportId!.replaceAll('_', ' ').toUpperCase()
                          : 'General Activity',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      timeFormat.format(activity.activityDate),
                      style: const TextStyle(color: AppColors.textSecondary, fontSize: 13),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '${activity.duration} min',
                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.primaryBlack),
                  ),
                  Text(
                    '${activity.calories.toStringAsFixed(0)} kcal',
                    style: const TextStyle(color: AppColors.warmAccent, fontSize: 13, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAiInsightPlaceholder() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primaryBlack, Color(0xFF2A2A2A)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryBlack.withValues(alpha: 0.3),
            blurRadius: 20,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              gradient: AppColors.goldGradient,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: AppColors.warmAccent.withValues(alpha: 0.5),
                  blurRadius: 12,
                  spreadRadius: 2,
                )
              ]
            ),
            child: const Icon(Icons.auto_awesome, color: Colors.white, size: 28),
          ),
          const SizedBox(width: 20),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'SportVerse AI Insight',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 18,
                    letterSpacing: -0.5,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  'Your personalized AI insights and recommendations will appear here based on your fitness data.',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHealthDataExplorer(FitnessProvider provider) {
    final todayData = provider.todayFitness;
    if (todayData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: const Text('No comprehensive health data synced yet.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    final record = todayData.first;
    List<Widget> metricTiles = [];
    
    void addTile(String title, String? value, IconData icon, Color color) {
      if (value != null && value != 'null' && value.isNotEmpty) {
        metricTiles.add(
          Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border.withValues(alpha: 0.5)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                )
              ]
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: color.withValues(alpha: 0.15), 
                    borderRadius: BorderRadius.circular(12)
                  ),
                  child: Icon(icon, color: color, size: 22),
                ),
                const SizedBox(width: 16),
                Text(title, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 15, color: AppColors.primaryBlack)),
                const Spacer(),
                Text(value, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: AppColors.textDark)),
              ],
            ),
          )
        );
      }
    }

    addTile('Weight', record.weight != null ? '${record.weight!.toStringAsFixed(1)} kg' : null, Icons.monitor_weight, Colors.teal);
    addTile('Height', record.height != null ? '${(record.height! * 100).toStringAsFixed(0)} cm' : null, Icons.height, Colors.indigo);
    addTile('BMI', record.bmi != null ? record.bmi!.toStringAsFixed(1) : null, Icons.calculate, Colors.blueGrey);
    addTile('Body Fat', record.bodyFat != null ? '${record.bodyFat!.toStringAsFixed(1)}%' : null, Icons.accessibility, Colors.brown);
    
    String? sleepStr;
    if (record.sleepMinutes != null && record.sleepMinutes! > 0) {
      final hours = record.sleepMinutes! ~/ 60;
      final mins = record.sleepMinutes! % 60;
      sleepStr = '${hours}h ${mins}m';
    }
    addTile('Sleep (Asleep)', sleepStr, Icons.bedtime, Colors.deepPurple);
    
    String? bpStr;
    if (record.bloodPressureSystolic != null && record.bloodPressureDiastolic != null) {
      bpStr = '${record.bloodPressureSystolic!.toInt()}/${record.bloodPressureDiastolic!.toInt()} mmHg';
    }
    addTile('Blood Pressure', bpStr, Icons.favorite_border, Colors.redAccent);
    addTile('Blood Glucose', record.bloodGlucose != null ? '${record.bloodGlucose!.toStringAsFixed(1)} mg/dL' : null, Icons.water_drop, Colors.red);
    addTile('Blood Oxygen', record.bloodOxygen != null ? '${record.bloodOxygen!.toStringAsFixed(1)}%' : null, Icons.air, Colors.cyan);
    addTile('Hydration', record.hydration != null && record.hydration! > 0 ? '${record.hydration!.toStringAsFixed(2)} L' : null, Icons.local_drink, Colors.lightBlue);
    addTile('Resting Heart Rate', record.restingHeartRate != null ? '${record.restingHeartRate} bpm' : null, Icons.monitor_heart, Colors.pink);

    if (metricTiles.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        width: double.infinity,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 20,
              offset: const Offset(0, 10),
            )
          ],
        ),
        child: const Text('Sync Health Connect to view advanced metrics like Weight, Sleep, and Blood Pressure.', style: TextStyle(color: AppColors.textSecondary)),
      );
    }

    return Column(
      children: metricTiles,
    );
  }
}
