import 'package:flutter/material.dart';
import '../../models/injury_model.dart';
import '../../theme/app_theme.dart';
import '../../widgets/injury/risk_badge.dart';
import './injury_chat_screen.dart';
import './recovery_checkin_screen.dart';

class InjuryResultScreen extends StatelessWidget {
  final InjuryReport report;

  const InjuryResultScreen({super.key, required this.report});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text('${report.bodyPart} (${report.sport})', style: const TextStyle(color: AppColors.primaryBlack)),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
        elevation: 1,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(
                color: Colors.amber.shade100,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.amber.shade300),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, color: Colors.amber),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      report.disclaimer.isNotEmpty ? report.disclaimer : 'This is general guidance only, not a medical diagnosis.',
                      style: const TextStyle(fontSize: 12, color: Colors.black87),
                    ),
                  ),
                ],
              ),
            ),
            if (report.isFallback)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue.shade200),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.blue),
                    SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'AI unavailable, showing general guidance based on your inputs.',
                        style: TextStyle(fontSize: 12),
                      ),
                    ),
                  ],
                ),
              ),
            RiskBadge(riskLevel: report.riskLevel, large: true),
            const SizedBox(height: 24),
            if (report.aiSummary.isNotEmpty) ...[
              const Text('Assessment Summary', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Text(report.aiSummary, style: const TextStyle(fontSize: 15, color: AppColors.secondaryText, height: 1.5)),
              const SizedBox(height: 24),
            ],
            if (report.possibleCategories.isNotEmpty) ...[
              const Text('Possible Categories', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: report.possibleCategories.map((c) => Chip(
                  label: Text(c),
                  backgroundColor: AppColors.lightDecorAccent,
                  side: BorderSide.none,
                )).toList(),
              ),
              const SizedBox(height: 24),
            ],
            if (report.generalGuidance.isNotEmpty) ...[
              const Text('✅ What You Should Do', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
              const SizedBox(height: 8),
              ...report.generalGuidance.map((g) => _buildListItem(g, Colors.green)),
              const SizedBox(height: 24),
            ],
            if (report.thingsToAvoid.isNotEmpty) ...[
              const Text('⚠️ Things to Avoid', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.orange)),
              const SizedBox(height: 8),
              ...report.thingsToAvoid.map((a) => _buildListItem(a, Colors.orange)),
              const SizedBox(height: 24),
            ],
            if (report.warningSigns.isNotEmpty) ...[
              const Text('🚨 Warning Signs (Seek Care If:)', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.red)),
              const SizedBox(height: 8),
              ...report.warningSigns.map((w) => _buildListItem(w, Colors.red)),
              const SizedBox(height: 24),
            ],
            if (report.professionalCareRecommended)
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(16),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  border: Border.all(color: Colors.red.shade200),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Column(
                  children: [
                    Icon(Icons.medical_services, color: Colors.red, size: 32),
                    SizedBox(height: 8),
                    Text(
                      'Professional Care Recommended',
                      style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Please consult a doctor or physical therapist for a proper diagnosis.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: Colors.red),
                    ),
                  ],
                ),
              ),
            if (report.responseType == 'MEDICATION_REFUSAL')
              Container(
                padding: const EdgeInsets.all(14),
                margin: const EdgeInsets.only(bottom: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFF6366F1)),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.shield_outlined, color: Color(0xFF4F46E5), size: 24),
                    SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Medication Safety Advisory',
                            style: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF4F46E5), fontSize: 14),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'SportVerse AI does not recommend medications or dosages. Consult a licensed doctor or pharmacist.',
                            style: TextStyle(fontSize: 12, color: AppColors.primaryBlack),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            if (report.sources.isNotEmpty) ...[
              const Text('📚 Referenced Sports Medicine Sources', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: report.sources.map((s) {
                  final sourceFile = s is Map ? (s['sourceFile'] ?? s['title']) : s.toString();
                  final score = s is Map && s['relevancePercentage'] != null ? ' (${s['relevancePercentage']})' : '';
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: const Color(0xFFCBD5E1)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.picture_as_pdf, size: 14, color: Color(0xFFEF4444)),
                        const SizedBox(width: 6),
                        Text('$sourceFile$score', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
                      ],
                    ),
                  );
                }).toList(),
              ),
              const SizedBox(height: 24),
            ],
            if (report.followUpQuestions.isNotEmpty) ...[
              const Text('Ask Follow-up Questions', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: report.followUpQuestions.map((q) => ActionChip(
                  label: Text(q),
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => InjuryChatScreen(report: report, initialMessage: q)),
                    );
                  },
                  backgroundColor: Colors.white,
                  side: const BorderSide(color: AppColors.border),
                )).toList(),
              ),
              const SizedBox(height: 32),
            ],
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => InjuryChatScreen(report: report)),
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline),
                    label: const Text('Chat with AI'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: AppColors.primaryBlack,
                      side: const BorderSide(color: AppColors.border),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => RecoveryCheckInScreen(report: report)),
                      );
                    },
                    icon: const Icon(Icons.show_chart),
                    label: const Text('Track Recovery'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.warmAccent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            SizedBox(
              width: double.infinity,
              child: TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('New Assessment', style: TextStyle(color: AppColors.primaryBlack)),
              ),
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildListItem(String text, Color borderColor) {
    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: borderColor.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(text, style: const TextStyle(fontSize: 14)),
    );
  }
}
