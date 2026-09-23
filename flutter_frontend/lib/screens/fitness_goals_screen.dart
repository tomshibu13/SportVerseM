import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/fitness_provider.dart';
import '../models/fitness_model.dart';
import '../theme/app_theme.dart';
import 'fitness_goal_form_screen.dart';

class FitnessGoalsScreen extends StatefulWidget {
  const FitnessGoalsScreen({super.key});

  @override
  State<FitnessGoalsScreen> createState() => _FitnessGoalsScreenState();
}

class _FitnessGoalsScreenState extends State<FitnessGoalsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FitnessProvider>().loadGoals();
    });
  }

  Future<void> _onRefresh() async {
    final provider = context.read<FitnessProvider>();
    await Future.wait([
      provider.loadGoals(),
      provider.loadToday(),
      provider.loadWeekly(),
      provider.loadMonthly(),
      provider.loadActivities(),
    ]);
  }

  double _calculateCurrentProgress(FitnessGoal goal, FitnessProvider provider) {
    final type = goal.goalType.toLowerCase();
    final period = goal.period.toLowerCase();
    
    double current = 0.0;

    // Helper to get records based on period
    List<FitnessRecord> getRecords() {
      if (period == 'daily') return provider.todayFitness;
      if (period == 'weekly') return provider.weeklyFitness;
      if (period == 'monthly') return provider.monthlyFitness;
      return provider.todayFitness;
    }

    // Helper to get activities based on period
    List<SportsActivity> getPeriodActivities() {
      final now = DateTime.now();
      int days = 1;
      if (period == 'weekly') days = 7;
      if (period == 'monthly') days = 30;
      
      final threshold = now.subtract(Duration(days: days));
      return provider.activities.where((a) => a.activityDate.isAfter(threshold)).toList();
    }

    if (type.contains('steps')) {
      for (var r in getRecords()) { current += r.steps; }
    } else if (type.contains('minutes')) {
      for (var r in getRecords()) { current += r.activeMinutes; }
    } else if (type.contains('sessions') || type.contains('sports')) {
      current = getPeriodActivities().length.toDouble();
    } else if (type.contains('calories')) {
      for (var r in getRecords()) { current += r.calories; }
    } else if (type.contains('distance')) {
      for (var r in getRecords()) { current += r.distance; }
    }

    return current;
  }

  void _showDeleteDialog(FitnessGoal goal) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Goal?'),
        content: const Text('Are you sure you want to delete this goal?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await context.read<FitnessProvider>().deleteGoal(goal.id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Goal deleted' : 'Failed to delete goal'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Fitness Goals', style: TextStyle(color: AppColors.primaryBlack, fontSize: 20, fontWeight: FontWeight.w600)),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => const FitnessGoalFormScreen()));
        },
        backgroundColor: AppColors.warmAccent,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Consumer<FitnessProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.goals.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.warmAccent));
          }

          if (provider.goals.isEmpty) {
            return RefreshIndicator(
              color: AppColors.warmAccent,
              onRefresh: _onRefresh,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.8,
                  child: const Center(
                    child: Text('No goals set yet. Tap + to create one.', style: TextStyle(color: AppColors.textSecondary)),
                  ),
                ),
              ),
            );
          }

          return RefreshIndicator(
            color: AppColors.warmAccent,
            onRefresh: _onRefresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: provider.goals.length,
              separatorBuilder: (ctx, i) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final goal = provider.goals[index];
                final currentProgress = _calculateCurrentProgress(goal, provider);
                final target = goal.targetValue;
                
                double percentage = currentProgress / target;
                if (percentage > 1.0) percentage = 1.0;
                if (percentage < 0.0 || percentage.isNaN) percentage = 0.0;
                
                final isCompleted = percentage >= 1.0;
                final remaining = target - currentProgress;

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: isCompleted ? Colors.green : AppColors.border, width: 1),
                    boxShadow: [
                      if (isCompleted)
                        BoxShadow(
                          color: Colors.green.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.lightDecorAccent,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${goal.period} Goal',
                              style: const TextStyle(color: AppColors.warmAccent, fontSize: 12, fontWeight: FontWeight.bold),
                            ),
                          ),
                          Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.edit, color: AppColors.textSecondary, size: 20),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () {
                                  Navigator.push(context, MaterialPageRoute(builder: (context) => FitnessGoalFormScreen(goal: goal)));
                                },
                              ),
                              const SizedBox(width: 12),
                              IconButton(
                                icon: const Icon(Icons.delete_outline, color: Colors.redAccent, size: 20),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () => _showDeleteDialog(goal),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              goal.goalType,
                              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                            ),
                          ),
                          Text(
                            isCompleted ? 'Completed 🎉' : 'Active',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                              color: isCompleted ? Colors.green : AppColors.warmAccent,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: LinearProgressIndicator(
                          value: percentage,
                          minHeight: 10,
                          backgroundColor: AppColors.border,
                          valueColor: AlwaysStoppedAnimation<Color>(isCompleted ? Colors.green : AppColors.warmAccent),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Current', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              Text(currentProgress.toStringAsFixed(currentProgress.truncateToDouble() == currentProgress ? 0 : 1), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              const Text('Target', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              Text(target.toStringAsFixed(target.truncateToDouble() == target ? 0 : 1), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              const Text('Remaining', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                              Text(remaining > 0 ? remaining.toStringAsFixed(remaining.truncateToDouble() == remaining ? 0 : 1) : '0', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Center(
                        child: Text(
                          '${(percentage * 100).toInt()}% Achieved',
                          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
