import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../models/ground_model.dart';
import 'ground_booking_screen.dart';
import 'bookings_screen.dart';
import 'shop_screen.dart';
import 'community_screen.dart';
import 'injury_assistant/injury_assessment_screen.dart';

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
  String? _currentRiskLevel;

  final List<Map<String, dynamic>> _messages = [];
  final List<String> _featureQuickActions = [
    '🏸 Badminton near me',
    '⚡ Book Turf at 6 PM',
    '👟 Best Racket to buy',
    '🏆 Find Tournaments',
    '👥 Find Teammates',
    '🏋️ Training Drills',
    '📊 My Performance',
    '🏥 Twisted Ankle First Aid'
  ];
  List<String> _quickReplies = [];

  @override
  void initState() {
    super.initState();
    _quickReplies = List.from(_featureQuickActions);

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

    _messages.add({
      'sender': 'ai',
      'text':
          'Hi there! I am **SportVerse AI** 🤖, your smart sports assistant.\n\nAsk me anything about **venues, court bookings, equipment, tournaments, teammates, training routines, or sports injuries**!',
      'isInjury': false,
      'riskLevel': null,
      'intent': 'GENERAL',
      'sources': [],
      'data': null,
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
            _scrollController.position.maxScrollExtent + 100,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOutCubic,
          );
        } else {
          _scrollController.jumpTo(_scrollController.position.maxScrollExtent + 100);
        }
      }
    });
  }

  Future<void> _handleSendMessage(String query) async {
    final text = query.trim();
    if (text.isEmpty) return;

    // Special quick action redirect for Injury Assessment Screen
    if (text.toLowerCase().contains('injury assessment') || text == '🏥 Injury Assistant') {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => const InjuryAssessmentScreen()),
      );
      return;
    }

    setState(() {
      _messages.add({
        'sender': 'user',
        'text': text,
        'isInjury': false,
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

      final reply = response['reply'] ?? response['message'] ?? 'I received your request. How else can I assist you with SportVerse?';
      final intent = response['intent'] as String? ?? 'GENERAL_UNRELATED';
      final isInjury = intent == 'INJURY_HEALTH' || response['isInjury'] == true;
      final riskLevel = isInjury ? (response['riskLevel'] as String?) : null;
      final suggested = (response['suggested_actions'] as List<dynamic>?)?.map((e) => e.toString()).toList();
      final action = response['action'] as String?;
      final data = response['data'] as Map<String, dynamic>?;
      final requiresConfirmation = response['requiresConfirmation'] == true;
      final sources = isInjury ? (response['sources'] as List<dynamic>? ?? []) : <dynamic>[];

      if (mounted) {
        setState(() {
          _isTyping = false;
          _currentRiskLevel = isInjury ? riskLevel : null;

          _messages.add({
            'sender': 'ai',
            'text': reply,
            'intent': intent,
            'action': action,
            'data': data,
            'requiresConfirmation': requiresConfirmation,
            'isInjury': isInjury,
            'riskLevel': riskLevel,
            'responseType': response['responseType'] as String? ?? 'NORMAL',
            'sources': sources,
            'timestamp': DateTime.now(),
          });

          if (suggested != null && suggested.isNotEmpty) {
            _quickReplies = suggested;
          } else {
            _quickReplies = List.from(_featureQuickActions);
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
            'text': 'Unable to connect to SportVerse server. Please ensure the backend server is running on http://localhost:5000.',
            'isInjury': false,
            'riskLevel': null,
            'sources': [],
            'data': null,
            'timestamp': DateTime.now(),
          });
          _quickReplies = List.from(_featureQuickActions);
        });
        _scrollToBottom();
      }
    }
  }

  void _clearChat() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Clear Chat?'),
        content: const Text('This will reset your current conversation session.'),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
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
                _currentRiskLevel = null;
                _messages.add({
                  'sender': 'ai',
                  'text': 'Chat reset. What would you like to explore in SportVerse today?',
                  'isInjury': false,
                  'riskLevel': null,
                  'sources': [],
                  'data': null,
                  'timestamp': DateTime.now(),
                });
                _quickReplies = List.from(_featureQuickActions);
              });
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Text('Clear'),
          ),
        ],
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
        return AppColors.warmAccent;
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
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: AppColors.primaryBlack, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Row(
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: const BoxDecoration(
                    gradient: AppColors.goldGradient,
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.smart_toy_rounded, color: Colors.white, size: 20),
                  ),
                ),
                Positioned(
                  right: -1,
                  bottom: -1,
                  child: Container(
                    width: 11,
                    height: 11,
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981),
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(width: 10),
            const Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'SportVerse AI',
                    style: TextStyle(
                      fontSize: 15.5,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  Text(
                    'Online • Sports Assistant',
                    style: TextStyle(
                      fontSize: 11,
                      color: Color(0xFF10B981),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.cleaning_services_outlined, color: AppColors.primaryBlack, size: 20),
            tooltip: 'Clear Chat',
            onPressed: _clearChat,
          ),
        ],
      ),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                // Active Injury Risk Alert Banner (Shown ONLY for Injury Intent)
                if (_currentRiskLevel != null)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    color: _getRiskColor(_currentRiskLevel).withValues(alpha: 0.12),
                    child: Row(
                      children: [
                        Icon(
                          _currentRiskLevel == 'URGENT' || _currentRiskLevel == 'HIGH'
                              ? Icons.warning_amber_rounded
                              : Icons.health_and_safety_outlined,
                          color: _getRiskColor(_currentRiskLevel),
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            'Assessed Risk Level: $_currentRiskLevel — Follow first aid & avoid weight bearing',
                            style: TextStyle(
                              fontSize: 11.5,
                              fontWeight: FontWeight.w600,
                              color: _getRiskColor(_currentRiskLevel),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Chat Message Stream
                Expanded(
                  child: ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    itemCount: _messages.length + (_isTyping ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (_isTyping && index == _messages.length) {
                        return const _TypingIndicatorBubble();
                      }

                      final msg = _messages[index];
                      final isUser = msg['sender'] == 'user';
                      final intent = msg['intent'] as String? ?? 'GENERAL';
                      final isInjury = msg['isInjury'] == true;
                      final riskLevel = isInjury ? (msg['riskLevel'] as String?) : null;
                      final responseType = msg['responseType'] as String? ?? 'NORMAL';
                      final isMedRefusal = responseType == 'MEDICATION_REFUSAL';
                      final isUrgent = responseType == 'URGENT_SAFETY' || riskLevel == 'URGENT';
                      final sources = isInjury ? (msg['sources'] as List<dynamic>?) : null;
                      final data = msg['data'] as Map<String, dynamic>?;
                      final action = msg['action'] as String?;
                      final timestamp = msg['timestamp'] as DateTime?;

                      return _ChatBubble(
                        text: msg['text'] as String,
                        isUser: isUser,
                        intent: intent,
                        riskLevel: riskLevel,
                        isMedRefusal: isMedRefusal,
                        isUrgent: isUrgent,
                        isInjury: isInjury,
                        sources: sources,
                        data: data,
                        action: action,
                        timestamp: _formatTime(timestamp),
                        onSpecialAction: (query) => _handleSendMessage(query),
                        onNavigateGround: (groundMap) {
                          try {
                            final model = GroundModel.fromJson(groundMap);
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => GroundBookingScreen(ground: model)),
                            );
                          } catch (_) {
                            _handleSendMessage('Book ${groundMap['title']}');
                          }
                        },
                      );
                    },
                  ),
                ),

                // Quick Prompt Chips Bar
                Container(
                  height: 44,
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  decoration: const BoxDecoration(
                    color: Color(0xFFF8FAFC),
                    border: Border(top: BorderSide(color: Color(0xFFF1F5F9))),
                  ),
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 14),
                    itemCount: _quickReplies.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, index) {
                      final reply = _quickReplies[index];
                      return ActionChip(
                        label: Text(
                          reply,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primaryBlack,
                          ),
                        ),
                        backgroundColor: Colors.white,
                        elevation: 0.5,
                        side: BorderSide(color: AppColors.warmAccent.withValues(alpha: 0.35)),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
                        onPressed: () => _handleSendMessage(reply),
                      );
                    },
                  ),
                ),

                // Chat Input Field
                Container(
                  padding: EdgeInsets.only(
                    left: 12,
                    right: 12,
                    top: 8,
                    bottom: 10 + MediaQuery.of(context).viewInsets.bottom,
                  ),
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: TextField(
                            controller: _textController,
                            style: const TextStyle(fontSize: 14),
                            textInputAction: TextInputAction.send,
                            decoration: const InputDecoration(
                              hintText: 'Ask SportVerse (venues, gear, drills, injuries)...',
                              hintStyle: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                              border: InputBorder.none,
                              isDense: true,
                              contentPadding: EdgeInsets.symmetric(vertical: 11),
                            ),
                            onSubmitted: _handleSendMessage,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        width: 42,
                        height: 42,
                        decoration: const BoxDecoration(
                          gradient: AppColors.goldGradient,
                          shape: BoxShape.circle,
                        ),
                        child: IconButton(
                          icon: const Icon(Icons.send_rounded, color: Colors.white, size: 19),
                          onPressed: () => _handleSendMessage(_textController.text),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),

            // Scroll to Bottom FAB
            if (_showScrollToBottom)
              Positioned(
                right: 16,
                bottom: 80,
                child: FloatingActionButton.small(
                  backgroundColor: Colors.white,
                  foregroundColor: AppColors.primaryBlack,
                  elevation: 3,
                  onPressed: () => _scrollToBottom(),
                  child: const Icon(Icons.arrow_downward_rounded, size: 18),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

/// Chat Bubble Component with Tail, Avatar, Timestamp and Integrated Cards
class _ChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final String intent;
  final String? riskLevel;
  final bool isMedRefusal;
  final bool isUrgent;
  final bool isInjury;
  final List<dynamic>? sources;
  final Map<String, dynamic>? data;
  final String? action;
  final String timestamp;
  final Function(String) onSpecialAction;
  final Function(Map<String, dynamic>) onNavigateGround;

  const _ChatBubble({
    required this.text,
    required this.isUser,
    required this.intent,
    this.riskLevel,
    required this.isMedRefusal,
    required this.isUrgent,
    required this.isInjury,
    this.sources,
    this.data,
    this.action,
    required this.timestamp,
    required this.onSpecialAction,
    required this.onNavigateGround,
  });

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
        return AppColors.warmAccent;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (!isUser) ...[
            Container(
              margin: const EdgeInsets.only(right: 8, top: 4),
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                gradient: isMedRefusal
                    ? const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF6366F1)])
                    : (isUrgent
                        ? const LinearGradient(colors: [Color(0xFFDC2626), Color(0xFFEF4444)])
                        : AppColors.goldGradient),
                shape: BoxShape.circle,
              ),
              child: Center(
                child: Icon(
                  isMedRefusal
                      ? Icons.shield_outlined
                      : (isUrgent
                          ? Icons.emergency
                          : (isInjury ? Icons.healing_outlined : Icons.smart_toy_rounded)),
                  color: Colors.white,
                  size: 15,
                ),
              ),
            ),
          ],
          Flexible(
            child: Column(
              crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  decoration: BoxDecoration(
                    color: isUser
                        ? AppColors.primaryBlack
                        : (isMedRefusal
                            ? const Color(0xFFF8FAFC)
                            : (isUrgent
                                ? const Color(0xFFFFF1F2)
                                : (isInjury ? const Color(0xFFFFFDFB) : Colors.white))),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(18),
                      topRight: const Radius.circular(18),
                      bottomLeft: Radius.circular(isUser ? 18 : 4),
                      bottomRight: Radius.circular(isUser ? 4 : 18),
                    ),
                    border: Border.all(
                      color: isUser
                          ? AppColors.primaryBlack
                          : (isMedRefusal
                              ? const Color(0xFF6366F1).withValues(alpha: 0.3)
                              : (isUrgent
                                  ? const Color(0xFFDC2626).withValues(alpha: 0.5)
                                  : (isInjury
                                      ? _getRiskColor(riskLevel).withValues(alpha: 0.3)
                                      : const Color(0xFFE2E8F0)))),
                      width: (isMedRefusal || isUrgent || isInjury) ? 1.5 : 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.03),
                        blurRadius: 5,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Badge Indicators
                      if (isMedRefusal && !isUser) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFF4F46E5),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '🛡️ Medication Safety Gate',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ] else if (isUrgent && !isUser) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFDC2626),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: const Text(
                            '🚨 URGENT EMERGENCY',
                            style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ] else if (isInjury && riskLevel != null && riskLevel != 'NONE' && !isUser) ...[
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          margin: const EdgeInsets.only(bottom: 8),
                          decoration: BoxDecoration(
                            color: _getRiskColor(riskLevel),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            'Risk Level: $riskLevel',
                            style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                          ),
                        ),
                      ],

                      // Markdown Message Content
                      FormattedMarkdownText(
                        text: text,
                        baseStyle: TextStyle(
                          fontSize: 13.5,
                          height: 1.45,
                          color: isUser ? Colors.white : AppColors.primaryBlack,
                        ),
                      ),

                      // Embedded Interactive Cards
                      if (!isUser && data != null) ...[
                        const SizedBox(height: 10),
                        _buildCardFromData(context),
                      ],

                      // RAG Knowledge Citation Pills
                      if (isInjury && sources != null && sources!.isNotEmpty && !isUser) ...[
                        const SizedBox(height: 8),
                        Wrap(
                          spacing: 6,
                          runSpacing: 4,
                          children: sources!.map((s) {
                            final sourceFile = s is Map ? (s['sourceFile'] ?? s['title']) : s.toString();
                            return Container(
                              padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF1F5F9),
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(Icons.picture_as_pdf, size: 11, color: Color(0xFFEF4444)),
                                  const SizedBox(width: 4),
                                  Text(
                                    sourceFile.toString(),
                                    style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: Color(0xFF334155)),
                                  ),
                                ],
                              ),
                            );
                          }).toList(),
                        ),
                      ],
                    ],
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(top: 3, left: 4, right: 4),
                  child: Text(
                    timestamp,
                    style: const TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                  ),
                ),
              ],
            ),
          ),
          if (isUser) ...[
            Container(
              margin: const EdgeInsets.only(left: 8, top: 4),
              width: 28,
              height: 28,
              decoration: const BoxDecoration(
                color: AppColors.primaryBlack,
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(Icons.person, color: Colors.white, size: 16),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCardFromData(BuildContext context) {
    if (intent == 'VENUE_SEARCH' && data!['grounds'] is List) {
      final grounds = data!['grounds'] as List;
      if (grounds.isEmpty) return const SizedBox.shrink();
      return Column(
        children: grounds.take(3).map((g) {
          final m = g is Map<String, dynamic> ? g : Map<String, dynamic>.from(g as Map);
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: AppColors.lightDecorAccent,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Icon(Icons.stadium, color: AppColors.warmAccent, size: 20),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['title']?.toString() ?? 'Court', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                      Text('${m['sport_type']} • ₹${m['price_per_hour']}/hr • ⭐ ${m['rating']}', style: const TextStyle(fontSize: 10.5, color: AppColors.secondaryText)),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () => onNavigateGround(m),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlack,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(50, 26),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: const Text('Book', style: TextStyle(fontSize: 10.5)),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (intent == 'BOOKING') {
      final ground = data!['ground'] as Map<String, dynamic>? ?? {};
      final title = ground['title']?.toString() ?? 'Sports Ground';
      final date = data!['date']?.toString() ?? 'Date';
      final slotTime = data!['slotTime']?.toString() ?? data!['slot_time']?.toString() ?? 'Slot';
      final price = data!['totalPrice'] ?? data!['total_price'] ?? 500;
      final isPending = action == 'CONFIRM_BOOKING';

      return Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: const Color(0xFFF0FDF4),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF86EFAC)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('🏟️ $title', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
            Text('📅 $date • ⏰ $slotTime • 💰 ₹$price', style: const TextStyle(fontSize: 11, color: Color(0xFF166534))),
            const SizedBox(height: 6),
            if (isPending)
              ElevatedButton(
                onPressed: () => onSpecialAction('Yes, confirm booking'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF16A34A),
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  minimumSize: const Size(80, 28),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: const Text('Confirm Booking', style: TextStyle(fontSize: 11)),
              )
            else
              ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BookingsScreen())),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primaryBlack,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  minimumSize: const Size(80, 28),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                ),
                child: const Text('View Bookings', style: TextStyle(fontSize: 11)),
              ),
          ],
        ),
      );
    }

    if (intent == 'SPORTS_GEAR' && data!['products'] is List) {
      final products = data!['products'] as List;
      return Column(
        children: products.take(2).map((p) {
          final m = p is Map<String, dynamic> ? p : Map<String, dynamic>.from(p as Map);
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Row(
              children: [
                const Icon(Icons.shopping_bag_outlined, color: AppColors.warmAccent, size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['title']?.toString() ?? 'Product', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                      Text('₹${m['price']} • ⭐ ${m['rating']}', style: const TextStyle(fontSize: 10.5, color: AppColors.secondaryText)),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ShopScreen())),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlack,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(50, 26),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: const Text('Shop', style: TextStyle(fontSize: 10.5)),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (intent == 'TOURNAMENT' && data!['tournaments'] is List) {
      final tournaments = data!['tournaments'] as List;
      return Column(
        children: tournaments.take(2).map((t) {
          final m = t is Map<String, dynamic> ? t : Map<String, dynamic>.from(t as Map);
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFFFFBEB),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFFDE68A)),
            ),
            child: Row(
              children: [
                const Icon(Icons.emoji_events, color: Color(0xFFD97706), size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['tournament_name']?.toString() ?? 'Tournament', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                      Text('Entry: ₹${m['registration_fee']} • Prize: ₹${m['prize_pool']}', style: const TextStyle(fontSize: 10.5, color: Color(0xFF92400E))),
                    ],
                  ),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    if (intent == 'TEAM_FINDER' && data!['teams'] is List) {
      final teams = data!['teams'] as List;
      return Column(
        children: teams.take(2).map((tm) {
          final m = tm is Map<String, dynamic> ? tm : Map<String, dynamic>.from(tm as Map);
          return Container(
            margin: const EdgeInsets.only(bottom: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF5F3FF),
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: const Color(0xFFDDD6FE)),
            ),
            child: Row(
              children: [
                const Icon(Icons.groups, color: Color(0xFF7C3AED), size: 22),
                const SizedBox(width: 8),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(m['team_name']?.toString() ?? 'Team', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11.5)),
                      Text('${m['activity']} • 🟢 ${m['spots_left']} spots', style: const TextStyle(fontSize: 10.5, color: Color(0xFF5B21B6))),
                    ],
                  ),
                ),
                ElevatedButton(
                  onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CommunityScreen())),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF7C3AED),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    minimumSize: const Size(50, 26),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                  ),
                  child: const Text('Join', style: TextStyle(fontSize: 10.5)),
                ),
              ],
            ),
          );
        }).toList(),
      );
    }

    return const SizedBox.shrink();
  }
}

/// Animated 3-dot typing indicator bubble for modern chatbot feel
class _TypingIndicatorBubble extends StatefulWidget {
  const _TypingIndicatorBubble();

  @override
  State<_TypingIndicatorBubble> createState() => _TypingIndicatorBubbleState();
}

class _TypingIndicatorBubbleState extends State<_TypingIndicatorBubble> with SingleTickerProviderStateMixin {
  late AnimationController _animCtrl;

  @override
  void initState() {
    super.initState();
    _animCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000))..repeat();
  }

  @override
  void dispose() {
    _animCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            margin: const EdgeInsets.only(right: 8, top: 4),
            width: 28,
            height: 28,
            decoration: const BoxDecoration(
              gradient: AppColors.goldGradient,
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.smart_toy_rounded, color: Colors.white, size: 15),
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
              ),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.03),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: AnimatedBuilder(
              animation: _animCtrl,
              builder: (context, _) {
                return Row(
                  mainAxisSize: MainAxisSize.min,
                  children: List.generate(3, (i) {
                    final delay = i * 0.2;
                    final val = (_animCtrl.value - delay) % 1.0;
                    final dy = val > 0 && val < 0.5 ? -3.5 * (1 - (val - 0.25).abs() * 4) : 0.0;
                    return Transform.translate(
                      offset: Offset(0, dy),
                      child: Container(
                        margin: const EdgeInsets.symmetric(horizontal: 2.5),
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          color: AppColors.warmAccent.withValues(alpha: 0.5 + (i * 0.2)),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  }),
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}

/// Rich Markdown Text Parser Widget for Chatbot Bubbles
class FormattedMarkdownText extends StatelessWidget {
  final String text;
  final TextStyle baseStyle;

  const FormattedMarkdownText({
    super.key,
    required this.text,
    required this.baseStyle,
  });

  @override
  Widget build(BuildContext context) {
    final lines = text.split('\n');
    final List<Widget> widgets = [];

    for (int i = 0; i < lines.length; i++) {
      final line = lines[i];
      if (line.trim().isEmpty) {
        widgets.add(const SizedBox(height: 5));
        continue;
      }

      final isBullet = line.trim().startsWith('•') ||
          line.trim().startsWith('- ') ||
          line.trim().startsWith('* ');

      if (isBullet) {
        final bulletText = line.trim().replaceFirst(RegExp(r'^[•\-\*]\s*'), '');
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 4.0, left: 4.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 5.0, right: 7.0),
                  child: Container(
                    width: 4.5,
                    height: 4.5,
                    decoration: BoxDecoration(
                      color: baseStyle.color ?? AppColors.primaryBlack,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
                Expanded(
                  child: _buildRichText(bulletText, baseStyle),
                ),
              ],
            ),
          ),
        );
      } else {
        widgets.add(
          Padding(
            padding: const EdgeInsets.only(bottom: 3.0),
            child: _buildRichText(line, baseStyle),
          ),
        );
      }
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: widgets,
    );
  }

  Widget _buildRichText(String raw, TextStyle style) {
    final List<InlineSpan> spans = [];
    final pattern = RegExp(r'\*\*(.*?)\*\*');
    int lastIndex = 0;

    for (final match in pattern.allMatches(raw)) {
      if (match.start > lastIndex) {
        spans.add(TextSpan(text: raw.substring(lastIndex, match.start), style: style));
      }
      spans.add(
        TextSpan(
          text: match.group(1),
          style: style.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
      );
      lastIndex = match.end;
    }

    if (lastIndex < raw.length) {
      spans.add(TextSpan(text: raw.substring(lastIndex), style: style));
    }

    return SelectableText.rich(
      TextSpan(children: spans),
    );
  }
}
