import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import 'injury_assistant/injury_assessment_screen.dart';
import 'injury_assistant/injury_history_screen.dart';

class AIAssistantScreen extends StatefulWidget {
  final String? initialQuery;

  const AIAssistantScreen({super.key, this.initialQuery});

  @override
  State<AIAssistantScreen> createState() => _AIAssistantScreenState();
}

class _AIAssistantScreenState extends State<AIAssistantScreen> with SingleTickerProviderStateMixin {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isTyping = false;
  bool _showScrollToBottom = false;

  final List<Map<String, dynamic>> _messages = [];

  final List<String> _injuryQuickPrompts = [
    '🦵 Twisted Ankle & Swelling',
    '🏃 Hamstring Pull / Strain',
    '🩹 Knee Pain & Clicking',
    '🏸 Tennis / Golfer Elbow',
    '⚡ Muscle Cramp First Aid',
    '💥 Heard a Loud "Pop" on Court',
    '🧊 Ice vs Heat: When to Use?',
    '🩺 Start Full 1-on-1 Assessment',
  ];

  List<String> _quickReplies = [];

  @override
  void initState() {
    super.initState();
    _quickReplies = List.from(_injuryQuickPrompts);

    _scrollController.addListener(() {
      if (_scrollController.hasClients) {
        final max = _scrollController.position.maxScrollExtent;
        final current = _scrollController.position.pixels;
        if (max - current > 120 && !_showScrollToBottom) {
          setState(() => _showScrollToBottom = true);
        } else if (max - current <= 120 && _showScrollToBottom) {
          setState(() => _showScrollToBottom = false);
        }
      }
    });

    // Initial Welcome Message from AI Injury Assistant
    _messages.add({
      'sender': 'ai',
      'text': '👋 Hello! I am your **SportVerse AI Injury Assistant** 🏥.\n\n'
          'I provide real-time **sports injury triage, clinical first-aid protocols (R.I.C.E), recovery exercise plans, and red-flag emergency detection**.\n\n'
          'How can I help you? Tell me:\n'
          '• Which body part is hurt? (e.g. Ankle, Knee, Hamstring, Shoulder)\n'
          '• What happened? (e.g. Twisted, fell, sudden sprint)\n'
          '• Your pain level on a scale of 1 to 10.',
      'isInjury': true,
      'riskLevel': null,
      'intent': 'INJURY_HEALTH',
      'sources': [],
      'timestamp': DateTime.now(),
    });

    if (widget.initialQuery != null && widget.initialQuery!.trim().isNotEmpty) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _handleSendMessage(widget.initialQuery!);
      });
    }
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom({bool animate = true}) {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        if (animate) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent + 120,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent + 120);
        }
      }
    });
  }

  Future<void> _handleSendMessage(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    // Direct guided assessment redirect
    if (text.toLowerCase().contains('start full 1-on-1 assessment') ||
        text.toLowerCase() == 'start full assessment' ||
        text.toLowerCase() == 'take full assessment') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()),
      );
      return;
    }

    // Ice vs Heat quick guide modal trigger
    if (text.toLowerCase().contains('ice vs heat')) {
      _showIceVsHeatModal();
      return;
    }

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': text,
        'isInjury': true,
        'riskLevel': null,
        'timestamp': DateTime.now(),
      });
      _isTyping = true;
    });
    _textController.clear();
    _scrollToBottom();

    try {
      final response = await ApiService.askAiAssistantFull(
        text,
        history: _messages,
        token: AuthService.currentToken,
        user: AuthService.currentUser,
      );

      final reply = response['reply'] ??
          response['message'] ??
          'I have received your query. Please follow the R.I.C.E protocol (Rest, Ice, Compression, Elevation) and monitor symptoms closely.';
      final intent = response['intent'] as String? ?? 'INJURY_HEALTH';
      const isInjury = true;
      final riskLevel = response['riskLevel'] as String?;
      final suggested = (response['suggested_actions'] as List<dynamic>?)?.map((e) => e.toString()).toList();
      final responseType = response['responseType'] as String? ?? 'NORMAL';
      final sources = (response['sources'] as List<dynamic>? ?? []);

      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({
            'sender': 'ai',
            'text': reply,
            'intent': intent,
            'isInjury': isInjury,
            'riskLevel': riskLevel,
            'responseType': responseType,
            'sources': sources,
            'timestamp': DateTime.now(),
          });

          if (suggested != null && suggested.isNotEmpty) {
            final filtered = suggested.where((s) =>
              !s.contains('Find Courts') &&
              !s.contains('Book a Turf') &&
              !s.contains('Sports Gear') &&
              !s.contains('Tournaments') &&
              !s.contains('Find Players')
            ).toList();
            _quickReplies = filtered.isNotEmpty ? filtered : List.from(_injuryQuickPrompts);
          } else {
            _quickReplies = [
              '🧊 Show R.I.C.E Steps',
              '🩺 Start Guided Assessment',
              '🚨 Check Red Flag Warnings',
              '📋 My Recovery History',
            ];
          }
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _isTyping = false;
          _messages.add({
            'sender': 'ai',
            'text': '🏥 **Immediate Sports First Aid (R.I.C.E Protocol)**\n\n'
                'While connecting to the live assistant server, please follow standard acute injury care:\n\n'
                '1. **Rest**: Stop all sporting activity immediately and avoid putting weight on the injured area.\n'
                '2. **Ice**: Apply a cold pack wrapped in a cloth for 15–20 minutes every 2–3 hours.\n'
                '3. **Compression**: Wrap with a firm elastic bandage to support the joint and minimize swelling.\n'
                '4. **Elevation**: Prop the injured limb above heart level whenever sitting or lying down.\n\n'
                '⚠️ *If you heard a loud pop, cannot bear weight, or observe severe deformity, seek emergency medical care immediately.*',
            'isInjury': true,
            'riskLevel': 'MODERATE',
            'sources': [],
            'timestamp': DateTime.now(),
          });
          _quickReplies = [
            '🩺 Start Guided Assessment',
            '🧊 Ice vs Heat Guide',
            '🚨 Emergency Warning Signs',
          ];
        });
        _scrollToBottom();
      }
    }
  }

  void _clearChat() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.refresh_rounded, color: AppColors.warmAccent),
            SizedBox(width: 8),
            Text('Reset Consultation?', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
          ],
        ),
        content: const Text('This will clear the current injury chat session and start a new consultation.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel', style: TextStyle(color: AppColors.secondaryText)),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              setState(() {
                _messages.clear();
                _messages.add({
                  'sender': 'ai',
                  'text': '🏥 **New Consultation Started.**\n\n'
                      'Please describe the athletic injury, pain symptoms, affected body part, and how it occurred.',
                  'isInjury': true,
                  'riskLevel': null,
                  'sources': [],
                  'timestamp': DateTime.now(),
                });
                _quickReplies = List.from(_injuryQuickPrompts);
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Start Fresh'),
          ),
        ],
      ),
    );
  }

  void _showIceVsHeatModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.ac_unit_rounded, color: Color(0xFF0284C7), size: 24),
                  SizedBox(width: 8),
                  Text(
                    'Ice vs Heat: Clinical Guide',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // ICE CARD
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF0F9FF),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFBAE6FD)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.ac_unit_rounded, color: Color(0xFF0284C7), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'ICE (Cold Therapy)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFF0369A1)),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      '• When: First 48–72 hours after acute injury (sprain, strain, impact, swelling).\n'
                      '• Why: Constricts blood vessels, reduces inflammation, numbs sharp pain.\n'
                      '• How: Apply 15–20 minutes with a towel barrier. Repeat every 2–3 hours.\n'
                      '• Avoid: Do NOT apply ice directly on bare skin.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF0C4A6E), height: 1.45),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 14),

              // HEAT CARD
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFF7ED),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFED7AA)),
                ),
                child: const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.local_fire_department_rounded, color: Color(0xFFEA580C), size: 20),
                        SizedBox(width: 8),
                        Text(
                          'HEAT (Warm Therapy)',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Color(0xFFC2410C)),
                        ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      '• When: Chronic stiffness, tight muscles, pre-game warmup (after acute swelling has subsided).\n'
                      '• Why: Increases blood circulation, relaxes muscles, improves tissue elasticity.\n'
                      '• How: Warm towel or heating pad for 15–20 minutes.\n'
                      '• Warning: NEVER apply heat during the first 48 hours of an acute injury.',
                      style: TextStyle(fontSize: 12, color: Color(0xFF7C2D12), height: 1.45),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlack,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Got it, Close Guide', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showRedFlagModal() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.85),
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              const SizedBox(height: 16),
              const Row(
                children: [
                  Icon(Icons.warning_amber_rounded, color: Color(0xFFDC2626), size: 26),
                  SizedBox(width: 8),
                  Text(
                    'Emergency Red-Flag Warnings',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFFDC2626)),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              const Text(
                'If you or a teammate experience any of the following symptoms, STOP play immediately and seek emergency medical care:',
                style: TextStyle(fontSize: 13, color: AppColors.secondaryText, height: 1.4),
              ),
              const SizedBox(height: 16),

              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: const Column(
                  children: [
                    _RedFlagItem(
                      title: 'Inability to Bear Weight',
                      desc: 'Cannot take 4 steps on the injured foot/leg immediately after trauma.',
                    ),
                    Divider(height: 16, color: Color(0xFFFCA5A5)),
                    _RedFlagItem(
                      title: 'Audible "Pop" or Snap',
                      desc: 'Loud pop sound accompanied by immediate rapid joint swelling (suspected ligament rupture/tear).',
                    ),
                    Divider(height: 16, color: Color(0xFFFCA5A5)),
                    _RedFlagItem(
                      title: 'Visible Deformity or Bone Protrusion',
                      desc: 'Unnatural limb angle or suspected bone fracture. Do NOT attempt to realign.',
                    ),
                    Divider(height: 16, color: Color(0xFFFCA5A5)),
                    _RedFlagItem(
                      title: 'Numbness, Tingling, or Loss of Pulse',
                      desc: 'Pins-and-needles sensation, pale cold foot/hand indicating nerve or vascular compression.',
                    ),
                    Divider(height: 16, color: Color(0xFFFCA5A5)),
                    _RedFlagItem(
                      title: 'Head / Neck Trauma or Concussion',
                      desc: 'Dizziness, nausea, memory loss, confusion, or loss of consciousness.',
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                height: 46,
                child: ElevatedButton.icon(
                  onPressed: () => Navigator.pop(ctx),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFDC2626),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: const Icon(Icons.check_circle_outline, size: 18),
                  label: const Text('Understood, Close Warning', style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getRiskColor(String? risk) {
    switch (risk?.toUpperCase()) {
      case 'URGENT':
        return const Color(0xFFDC2626);
      case 'HIGH':
        return const Color(0xFFEF4444);
      case 'MODERATE':
        return const Color(0xFFF59E0B);
      case 'LOW':
        return const Color(0xFF10B981);
      default:
        return const Color(0xFF14B8A6);
    }
  }

  String _formatTime(DateTime? dt) {
    if (dt == null) return '';
    final hour = dt.hour > 12 ? dt.hour - 12 : (dt.hour == 0 ? 12 : dt.hour);
    final minute = dt.minute.toString().padLeft(2, '0');
    final period = dt.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        titleSpacing: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.primaryBlack),
          onPressed: () => Navigator.maybePop(context),
        ),
        title: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF0F766E).withValues(alpha: 0.25),
                    blurRadius: 6,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: const Icon(Icons.health_and_safety_rounded, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'AI Injury Assistant',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  Row(
                    children: [
                      Container(
                        width: 7,
                        height: 7,
                        decoration: const BoxDecoration(
                          color: Color(0xFF10B981),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 5),
                      const Expanded(
                        child: Text(
                          'Sports Medicine & Triage • Online',
                          style: TextStyle(fontSize: 10.5, color: AppColors.secondaryText, fontWeight: FontWeight.w500),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.history_rounded, color: AppColors.primaryBlack, size: 22),
            tooltip: 'Assessment History',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const InjuryHistoryScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.medical_services_outlined, color: Color(0xFF0F766E), size: 22),
            tooltip: '1-on-1 Guided Assessment',
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()),
              );
            },
          ),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert_rounded, color: AppColors.primaryBlack),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            onSelected: (val) {
              if (val == 'clear') _clearChat();
              if (val == 'ice_heat') _showIceVsHeatModal();
              if (val == 'red_flags') _showRedFlagModal();
              if (val == 'assessment') {
                Navigator.push(context, MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()));
              }
            },
            itemBuilder: (ctx) => [
              const PopupMenuItem(
                value: 'assessment',
                child: Row(
                  children: [
                    Icon(Icons.assignment_outlined, size: 18, color: Color(0xFF0F766E)),
                    SizedBox(width: 8),
                    Text('Start Full Assessment'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'ice_heat',
                child: Row(
                  children: [
                    Icon(Icons.ac_unit_rounded, size: 18, color: Color(0xFF0284C7)),
                    SizedBox(width: 8),
                    Text('Ice vs Heat Guide'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'red_flags',
                child: Row(
                  children: [
                    Icon(Icons.warning_amber_rounded, size: 18, color: Color(0xFFDC2626)),
                    SizedBox(width: 8),
                    Text('Emergency Red Flags'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'clear',
                child: Row(
                  children: [
                    Icon(Icons.refresh_rounded, size: 18, color: Color(0xFFEF4444)),
                    SizedBox(width: 8),
                    Text('Reset Chat Session', style: TextStyle(color: Color(0xFFEF4444))),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Top Quick Assessment CTA Strip
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: const BoxDecoration(
                color: Color(0xFFF0FDFA),
                border: Border(bottom: BorderSide(color: Color(0xFFCCFBF1))),
              ),
              child: Row(
                children: [
                  const Icon(Icons.shield_outlined, size: 16, color: Color(0xFF0F766E)),
                  const SizedBox(width: 8),
                  const Expanded(
                    child: Text(
                      'Need an in-depth injury report & recovery timeline?',
                      style: TextStyle(fontSize: 11, color: Color(0xFF115E59), fontWeight: FontWeight.w600),
                    ),
                  ),
                  InkWell(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()),
                      );
                    },
                    borderRadius: BorderRadius.circular(8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0F766E),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Row(
                        children: [
                          Text(
                            'Assess Now',
                            style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                          ),
                          SizedBox(width: 4),
                          Icon(Icons.arrow_forward, size: 11, color: Colors.white),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Messages View
            Expanded(
              child: ListView.builder(
                controller: _scrollController,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                itemCount: _messages.length + (_isTyping ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _messages.length && _isTyping) {
                    return _buildTypingIndicator();
                  }
                  final msg = _messages[index];
                  return _buildMessageBubble(msg);
                },
              ),
            ),

            // Floating Scroll to Bottom Button
            if (_showScrollToBottom)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: FloatingActionButton.small(
                  backgroundColor: AppColors.primaryBlack,
                  foregroundColor: Colors.white,
                  onPressed: () => _scrollToBottom(),
                  child: const Icon(Icons.arrow_downward, size: 18),
                ),
              ),

            // Quick Symptom / Injury Prompts (Horizontal Scrollable)
            Container(
              height: 42,
              padding: const EdgeInsets.symmetric(vertical: 4),
              color: Colors.white,
              child: ListView.separated(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                scrollDirection: Axis.horizontal,
                itemCount: _quickReplies.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, i) {
                  final prompt = _quickReplies[i];
                  return ActionChip(
                    label: Text(
                      prompt,
                      style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600, color: Color(0xFF0F766E)),
                    ),
                    backgroundColor: const Color(0xFFF0FDFA),
                    side: const BorderSide(color: Color(0xFF99F6E4)),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    padding: const EdgeInsets.symmetric(horizontal: 4),
                    onPressed: () => _handleSendMessage(prompt),
                  );
                },
              ),
            ),

            // Input Bar & Action Controls
            Container(
              padding: const EdgeInsets.fromLTRB(14, 8, 14, 8),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: TextField(
                        controller: _textController,
                        style: const TextStyle(fontSize: 13.5, color: AppColors.primaryBlack),
                        maxLines: null,
                        keyboardType: TextInputType.multiline,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (val) => _handleSendMessage(val),
                        decoration: const InputDecoration(
                          hintText: 'Describe your injury, pain, or symptoms...',
                          hintStyle: TextStyle(fontSize: 12.5, color: Color(0xFF94A3B8)),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 11),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF0F766E), Color(0xFF14B8A6)],
                      ),
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF0F766E).withValues(alpha: 0.3),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.send_rounded, size: 18, color: Colors.white),
                      onPressed: () => _handleSendMessage(_textController.text),
                    ),
                  ),
                ],
              ),
            ),

            // Medical Disclaimer Note
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 16),
              color: const Color(0xFFF8FAFC),
              child: const Text(
                '⚠️ Educational Sports Medicine Assistant. Not a formal clinical diagnosis. Seek emergency care for severe trauma.',
                textAlign: TextAlign.center,
                style: TextStyle(fontSize: 9.5, color: Color(0xFF64748B), height: 1.2),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg) {
    final isUser = msg['sender'] == 'user';
    final text = msg['text'] as String? ?? '';
    final riskLevel = msg['riskLevel'] as String?;
    final timeStr = _formatTime(msg['timestamp'] as DateTime?);
    final isUrgent = riskLevel == 'URGENT' || msg['responseType'] == 'URGENT_SAFETY';

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                color: isUrgent ? const Color(0xFFFEE2E2) : const Color(0xFFCCFBF1),
                shape: BoxShape.circle,
                border: Border.all(color: isUrgent ? const Color(0xFFEF4444) : const Color(0xFF14B8A6)),
              ),
              child: Icon(
                isUrgent ? Icons.warning_amber_rounded : Icons.health_and_safety_rounded,
                size: 18,
                color: isUrgent ? const Color(0xFFDC2626) : const Color(0xFF0F766E),
              ),
            ),
            const SizedBox(width: 8),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                // Risk Alert Pill (if present on AI message)
                if (!isUser && riskLevel != null)
                  Container(
                    margin: const EdgeInsets.only(bottom: 6),
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getRiskColor(riskLevel).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: _getRiskColor(riskLevel).withValues(alpha: 0.4)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          riskLevel == 'URGENT' ? Icons.error_outline : Icons.shield_outlined,
                          size: 12,
                          color: _getRiskColor(riskLevel),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'TRIAGE LEVEL: $riskLevel',
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            color: _getRiskColor(riskLevel),
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                  ),

                // Main Message Container
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? AppColors.primaryBlack
                        : (isUrgent ? const Color(0xFFFFF1F2) : Colors.white),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: isUser ? const Radius.circular(18) : const Radius.circular(4),
                      bottomRight: isUser ? const Radius.circular(4) : const Radius.circular(18),
                    ),
                    border: Border.all(
                      color: isUser
                          ? Colors.transparent
                          : (isUrgent ? const Color(0xFFFECDD3) : const Color(0xFFE2E8F0)),
                      width: isUrgent ? 1.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 6,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        text,
                        style: TextStyle(
                          fontSize: 13.5,
                          color: isUser ? Colors.white : const Color(0xFF1E293B),
                          height: 1.45,
                        ),
                      ),

                      // In-Message Guided Assessment Button (for relevant medical triage replies)
                      if (!isUser && (text.contains('RICE') || text.contains('protocol') || riskLevel != null)) ...[
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            InkWell(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()),
                                );
                              },
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF0F766E),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.assignment_turned_in_outlined, size: 13, color: Colors.white),
                                    SizedBox(width: 4),
                                    Text(
                                      'Take Full Assessment',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.white),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            InkWell(
                              onTap: () => _showIceVsHeatModal(),
                              borderRadius: BorderRadius.circular(8),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFF1F5F9),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(color: const Color(0xFFCBD5E1)),
                                ),
                                child: const Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Icon(Icons.ac_unit, size: 13, color: Color(0xFF0284C7)),
                                    SizedBox(width: 4),
                                    Text(
                                      'Ice vs Heat Guide',
                                      style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ],
                  ),
                ),

                // Timestamp
                const SizedBox(height: 4),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: Text(
                    timeStr,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ),
          if (isUser) ...[
            const SizedBox(width: 8),
            Container(
              width: 32,
              height: 32,
              decoration: const BoxDecoration(
                color: Color(0xFFC8895B),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.person, size: 18, color: Colors.white),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTypingIndicator() {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Container(
            width: 32,
            height: 32,
            decoration: const BoxDecoration(
              color: Color(0xFFCCFBF1),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.health_and_safety_rounded, size: 18, color: Color(0xFF0F766E)),
          ),
          const SizedBox(width: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                SizedBox(
                  width: 14,
                  height: 14,
                  child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF0F766E)),
                ),
                SizedBox(width: 10),
                Text(
                  'Evaluating symptoms & first-aid guidelines...',
                  style: TextStyle(fontSize: 12, color: Color(0xFF64748B), fontStyle: FontStyle.italic),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RedFlagItem extends StatelessWidget {
  final String title;
  final String desc;

  const _RedFlagItem({required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Icon(Icons.arrow_right_rounded, color: Color(0xFFDC2626), size: 20),
        const SizedBox(width: 4),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12.5, color: Color(0xFF991B1B)),
              ),
              const SizedBox(height: 2),
              Text(
                desc,
                style: const TextStyle(fontSize: 11.5, color: Color(0xFF450A0A), height: 1.3),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
