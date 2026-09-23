import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/fitness_provider.dart';
import '../models/fitness_model.dart';
import '../theme/app_theme.dart';
import 'sports_activity_form_screen.dart';

class SportsActivityListScreen extends StatefulWidget {
  const SportsActivityListScreen({super.key});

  @override
  State<SportsActivityListScreen> createState() => _SportsActivityListScreenState();
}

class _SportsActivityListScreenState extends State<SportsActivityListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FitnessProvider>().loadActivities();
    });
  }

  Future<void> _onRefresh() async {
    await context.read<FitnessProvider>().loadActivities();
  }

  void _showActivityDetails(SportsActivity activity) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _ActivityDetailsSheet(activity: activity),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        title: const Text('Sports Activities', style: TextStyle(color: AppColors.primaryBlack, fontSize: 20, fontWeight: FontWeight.w600)),
        elevation: 0,
        centerTitle: true,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(context, MaterialPageRoute(builder: (context) => const SportsActivityFormScreen()));
        },
        backgroundColor: AppColors.warmAccent,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Consumer<FitnessProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.activities.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.warmAccent));
          }

          if (provider.errorMessage != null && provider.activities.isEmpty) {
            return _buildErrorState(provider);
          }

          if (provider.activities.isEmpty) {
            return RefreshIndicator(
              color: AppColors.warmAccent,
              onRefresh: _onRefresh,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.8,
                  child: const Center(
                    child: Text('No sports activities found. Tap + to add one.', style: TextStyle(color: AppColors.textSecondary)),
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
              itemCount: provider.activities.length,
              separatorBuilder: (ctx, i) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final activity = provider.activities[index];
                final timeFormat = DateFormat('MMM d, yyyy • h:mm a');
                
                return InkWell(
                  onTap: () => _showActivityDetails(activity),
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.border, width: 1),
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: AppColors.lightDecorAccent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const Icon(Icons.sports_score, color: AppColors.warmAccent),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                activity.sportId ?? 'General Activity',
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
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack, fontSize: 16),
                            ),
                            Text(
                              '${activity.calories.toStringAsFixed(0)} kcal',
                              style: const TextStyle(color: AppColors.warmAccent, fontSize: 13),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
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
          Text(provider.errorMessage ?? 'An error occurred', style: const TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => provider.loadActivities(),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
            child: const Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

class _ActivityDetailsSheet extends StatelessWidget {
  final SportsActivity activity;

  const _ActivityDetailsSheet({required this.activity});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMMM d, yyyy • h:mm a');
    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      padding: const EdgeInsets.all(24),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Container(width: 40, height: 5, decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10))),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(activity.sportId ?? 'General Activity', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: AppColors.primaryBlack)),
                IconButton(
                  icon: const Icon(Icons.edit, color: AppColors.warmAccent),
                  onPressed: () {
                    Navigator.pop(context);
                    Navigator.push(context, MaterialPageRoute(builder: (context) => SportsActivityFormScreen(activity: activity)));
                  },
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(dateFormat.format(activity.activityDate), style: const TextStyle(color: AppColors.textSecondary, fontSize: 14)),
            const Divider(height: 32),
            _buildDetailRow(Icons.timer, 'Duration', '${activity.duration} minutes'),
            const SizedBox(height: 16),
            _buildDetailRow(Icons.local_fire_department, 'Calories', '${activity.calories.toStringAsFixed(1)} kcal'),
            const SizedBox(height: 16),
            _buildDetailRow(Icons.map, 'Distance', '${activity.distance.toStringAsFixed(2)} km'),
            const SizedBox(height: 16),
            _buildDetailRow(Icons.fitness_center, 'Intensity', activity.intensity ?? 'Not specified'),
            const SizedBox(height: 16),
            _buildDetailRow(Icons.notes, 'Notes', activity.notes?.isNotEmpty == true ? activity.notes! : 'No notes provided.'),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _confirmDelete(context),
                icon: const Icon(Icons.delete_outline, color: Colors.red),
                label: const Text('Delete Activity', style: TextStyle(color: Colors.red)),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Colors.red),
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 20),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(color: AppColors.primaryBlack, fontSize: 16, fontWeight: FontWeight.w500)),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _confirmDelete(BuildContext context) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Activity?'),
        content: const Text('Are you sure you want to delete this activity? This cannot be undone.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && context.mounted) {
      final provider = context.read<FitnessProvider>();
      final success = await provider.deleteActivity(activity.id);
      if (context.mounted) {
        Navigator.pop(context); // Close bottom sheet
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(success ? 'Activity deleted' : provider.errorMessage ?? 'Failed to delete'),
            backgroundColor: success ? Colors.green : Colors.red,
          ),
        );
      }
    }
  }
}
