import 'package:flutter/material.dart';
import '../../models/injury_model.dart';
import '../../theme/app_theme.dart';
import '../../services/injury_service.dart';
import '../../widgets/injury/risk_badge.dart';
import './injury_result_screen.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';

class InjuryHistoryScreen extends StatefulWidget {
  const InjuryHistoryScreen({super.key});

  @override
  State<InjuryHistoryScreen> createState() => _InjuryHistoryScreenState();
}

class _InjuryHistoryScreenState extends State<InjuryHistoryScreen> {
  List<InjuryReport> _history = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    setState(() => _isLoading = true);
    try {
      final history = await InjuryService.getInjuryHistory();
      if (!mounted) return;
      setState(() {
        _history = history;
        _isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to load history: $e')));
    }
  }

  Future<void> _deleteReport(String id) async {
    try {
      await InjuryService.deleteReport(id);
      _loadHistory();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to delete: $e')));
    }
  }

  Widget _buildChart() {
    final reportsWithCheckIns = _history.where((r) => r.checkIns.isNotEmpty).toList();
    if (reportsWithCheckIns.isEmpty) return const SizedBox.shrink();

    List<LineChartBarData> lines = [];
    List<Color> colors = [Colors.blue, Colors.green, Colors.purple, Colors.orange];
    
    int colorIndex = 0;
    double minX = double.infinity;
    double maxX = double.negativeInfinity;

    for (var report in reportsWithCheckIns) {
      List<FlSpot> spots = [];
      
      spots.add(FlSpot(report.createdAt.millisecondsSinceEpoch.toDouble(), report.painLevel.toDouble()));
      if (report.createdAt.millisecondsSinceEpoch.toDouble() < minX) minX = report.createdAt.millisecondsSinceEpoch.toDouble();
      if (report.createdAt.millisecondsSinceEpoch.toDouble() > maxX) maxX = report.createdAt.millisecondsSinceEpoch.toDouble();

      for (var checkIn in report.checkIns) {
        double x = checkIn.date.millisecondsSinceEpoch.toDouble();
        spots.add(FlSpot(x, checkIn.painLevel.toDouble()));
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
      }

      spots.sort((a, b) => a.x.compareTo(b.x));

      lines.add(LineChartBarData(
        spots: spots,
        isCurved: false,
        color: colors[colorIndex % colors.length],
        barWidth: 3,
        dotData: const FlDotData(show: true),
      ));
      colorIndex++;
    }

    if (minX == double.infinity) return const SizedBox.shrink();

    return Container(
      height: 200,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Pain Progress', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                minY: 0,
                maxY: 10,
                minX: minX,
                maxX: maxX,
                lineBarsData: lines,
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (value, meta) {
                        final date = DateTime.fromMillisecondsSinceEpoch(value.toInt());
                        return Padding(
                          padding: const EdgeInsets.only(top: 8.0),
                          child: Text(DateFormat('MM/dd').format(date), style: const TextStyle(fontSize: 10)),
                        );
                      },
                      reservedSize: 22,
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (value, meta) {
                        return Text(value.toInt().toString(), style: const TextStyle(fontSize: 12));
                      },
                    ),
                  ),
                  topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                gridData: const FlGridData(show: true, drawVerticalLine: false),
                borderData: FlBorderData(show: false),
              ),
            ),
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
        title: const Text('My Injury History', style: TextStyle(color: AppColors.primaryBlack)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
        elevation: 1,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : _history.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.history, size: 80, color: AppColors.mutedText.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      const Text('No injury assessments yet.', style: TextStyle(color: AppColors.secondaryText, fontSize: 16)),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: () => Navigator.pop(context),
                        style: ElevatedButton.styleFrom(backgroundColor: AppColors.warmAccent),
                        child: const Text('Start Assessment', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadHistory,
                  color: AppColors.warmAccent,
                  child: ListView(
                    children: [
                      _buildChart(),
                      ..._history.map((report) {
                        return Card(
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                            side: const BorderSide(color: AppColors.border),
                          ),
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (_) => InjuryResultScreen(report: report)),
                              );
                            },
                            onLongPress: () {
                              showDialog(
                                context: context,
                                builder: (ctx) => AlertDialog(
                                  title: const Text('Delete Report?'),
                                  content: const Text('Are you sure you want to delete this assessment?'),
                                  actions: [
                                    TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                                    TextButton(
                                      onPressed: () {
                                        Navigator.pop(ctx);
                                        _deleteReport(report.id);
                                      },
                                      child: const Text('Delete', style: TextStyle(color: Colors.red)),
                                    ),
                                  ],
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        DateFormat('MMM dd, yyyy').format(report.createdAt),
                                        style: const TextStyle(color: AppColors.mutedText, fontSize: 12),
                                      ),
                                      RiskBadge(riskLevel: report.riskLevel),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Row(
                                    children: [
                                      const Icon(Icons.sports, size: 20, color: AppColors.primaryBlack),
                                      const SizedBox(width: 8),
                                      Text('${report.sport} • ${report.bodyPart}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    report.aiSummary,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(color: AppColors.secondaryText, fontSize: 14),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }),
                    ],
                  ),
                ),
    );
  }
}
