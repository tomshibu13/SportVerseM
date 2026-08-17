import 'package:flutter/material.dart';
import '../../models/injury_model.dart';
import '../../theme/app_theme.dart';
import '../../services/injury_service.dart';
import '../../widgets/injury/risk_badge.dart';

class InjuryChatScreen extends StatefulWidget {
  final InjuryReport report;
  final String? initialMessage;

  const InjuryChatScreen({super.key, required this.report, this.initialMessage});

  @override
  State<InjuryChatScreen> createState() => _InjuryChatScreenState();
}

class _InjuryChatScreenState extends State<InjuryChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  late List<ChatMessage> _messages;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _messages = List.from(widget.report.chatHistory);
    if (widget.initialMessage != null) {
      _controller.text = widget.initialMessage!;
      _sendMessage();
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty) return;

    setState(() {
      _messages.add(ChatMessage(role: 'user', content: text, timestamp: DateTime.now()));
      _isLoading = true;
    });
    _controller.clear();
    _scrollToBottom();

    try {
      final response = await InjuryService.sendChatMessage(widget.report.id, text);
      final reply = response['reply'];
      if (!mounted) return;
      setState(() {
        _messages.add(ChatMessage(role: 'model', content: reply, timestamp: DateTime.now()));
        _isLoading = false;
      });
      _scrollToBottom();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('AI Injury Assistant', style: TextStyle(color: AppColors.primaryBlack, fontSize: 16)),
            RiskBadge(riskLevel: widget.report.riskLevel),
          ],
        ),
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: AppColors.primaryBlack),
        elevation: 1,
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            color: AppColors.lightDecorAccent.withValues(alpha: 0.5),
            width: double.infinity,
            child: Text(
              '${widget.report.sport} • ${widget.report.bodyPart}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
              textAlign: TextAlign.center,
            ),
          ),
          Expanded(
            child: _messages.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.chat_bubble_outline, size: 64, color: AppColors.mutedText),
                          const SizedBox(height: 16),
                          const Text('Ask follow-up questions about your assessment.', textAlign: TextAlign.center, style: TextStyle(color: AppColors.secondaryText)),
                          const SizedBox(height: 24),
                          Wrap(
                            spacing: 8,
                            runSpacing: 8,
                            alignment: WrapAlignment.center,
                            children: widget.report.followUpQuestions.map((q) => ActionChip(
                              label: Text(q),
                              onPressed: () {
                                _controller.text = q;
                                _sendMessage();
                              },
                              backgroundColor: Colors.white,
                              side: const BorderSide(color: AppColors.border),
                            )).toList(),
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isUser = msg.role == 'user';
                      return Align(
                        alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          padding: const EdgeInsets.all(12),
                          constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                          decoration: BoxDecoration(
                            color: isUser ? AppColors.warmAccent : Colors.white,
                            borderRadius: BorderRadius.circular(12),
                            border: isUser ? null : Border.all(color: AppColors.border),
                          ),
                          child: Text(
                            msg.content,
                            style: TextStyle(
                              color: isUser ? Colors.white : AppColors.primaryBlack,
                              height: 1.4,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),
          if (_isLoading)
            const Padding(
              padding: EdgeInsets.all(8.0),
              child: CircularProgressIndicator(color: AppColors.warmAccent),
            ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: AppColors.border)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: AppColors.background,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      ),
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  CircleAvatar(
                    backgroundColor: AppColors.warmAccent,
                    child: IconButton(
                      icon: const Icon(Icons.send, color: Colors.white),
                      onPressed: _sendMessage,
                    ),
                  ),
                ],
              ),
            ),
          ),
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.only(bottom: 4, top: 4),
            child: const Text(
              'AI guidance only. Seek medical attention for severe pain.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 10, fontStyle: FontStyle.italic, color: AppColors.mutedText),
            ),
          ),
        ],
      ),
    );
  }
}
