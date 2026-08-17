import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../theme/app_theme.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

class InboxScreen extends StatefulWidget {
  const InboxScreen({super.key});

  @override
  State<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends State<InboxScreen> {
  bool _isLoading = false;

  final List<Map<String, dynamic>> _notifications = [
    {
      'id': 'n1',
      'title': 'AI Recommendation ✨',
      'body': 'Kickoff Arena added a 20% discount on 7:00 PM slots for tonight!',
      'time': '10 mins ago',
      'icon': Icons.auto_awesome,
      'unread': true,
      'portalUrl': null,
      'stationPassword': null,
    },
    {
      'id': 'n2',
      'title': 'Booking Confirmed 🎟️',
      'body': 'Your booking at Smash Court (Badminton Court #3) is confirmed.',
      'time': '2 hours ago',
      'icon': Icons.check_circle_outline,
      'unread': false,
      'portalUrl': null,
      'stationPassword': null,
    },
  ];

  @override
  void initState() {
    super.initState();
    _loadNotifications();
  }

  Future<void> _loadNotifications() async {
    final user = AuthService.currentUser;
    final userId = user?['userId'] ?? user?['user_id'] ?? user?['_id'] ?? user?['id'];
    if (userId != null) {
      setState(() => _isLoading = true);
      try {
        final serverNotes = await ApiService.fetchUserNotifications(userId.toString());
        if (serverNotes.isNotEmpty && mounted) {
          setState(() {
            _notifications.clear();
            for (final n in serverNotes) {
              final msg = n['message']?.toString() ?? '';
              final data = n['data'] as Map<String, dynamic>?;
              
              // Extract portalUrl and stationPassword from data payload or text
              String? portalUrl = data?['portalUrl']?.toString();
              String? stationPassword = data?['stationPassword']?.toString();
              String? email = data?['email']?.toString() ?? user?['email']?.toString();

              if (portalUrl == null && msg.contains('http')) {
                final match = RegExp(r'https?://[^\s]+').firstMatch(msg);
                if (match != null) portalUrl = match.group(0);
              }
              if (stationPassword == null && msg.contains('SV-Station#')) {
                final match = RegExp(r'SV-Station#[A-Z0-9]+').firstMatch(msg);
                if (match != null) stationPassword = match.group(0);
              }

              final isApproval = n['notification_type'] == 'Approval' || msg.contains('Station Owner') || msg.contains('APPROVED');

              _notifications.add({
                'id': n['notification_id']?.toString() ?? n['_id']?.toString() ?? 'note',
                'title': n['title'] ?? (isApproval ? '🎉 Station Owner Approved & Credentials' : 'Notification'),
                'body': msg,
                'time': 'Just now',
                'icon': isApproval ? Icons.verified_user : Icons.notifications_active,
                'unread': !(n['is_read'] == true),
                'portalUrl': portalUrl,
                'stationPassword': stationPassword,
                'email': email,
                'isApproval': isApproval,
              });
            }
          });
        }
      } catch (_) {}
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _markAllAsRead() {
    setState(() {
      for (var n in _notifications) {
        n['unread'] = false;
      }
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('All notifications marked as read'),
        backgroundColor: AppColors.primaryBlack,
      ),
    );
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard: $text'),
        backgroundColor: AppColors.primaryBlack,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final canPop = Navigator.canPop(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: canPop
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new, size: 18, color: AppColors.primaryBlack),
                onPressed: () => Navigator.pop(context),
              )
            : null,
        title: const Text(
          'Notifications & Alerts',
          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        actions: [
          if (_notifications.any((n) => n['unread'] == true))
            TextButton(
              onPressed: _markAllAsRead,
              child: const Text('Mark all read', style: TextStyle(fontSize: 12, color: AppColors.warmAccent)),
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent))
          : RefreshIndicator(
              onRefresh: _loadNotifications,
              color: AppColors.warmAccent,
              child: ListView.separated(
                physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
                padding: const EdgeInsets.all(16),
                itemCount: _notifications.length,
                separatorBuilder: (_, __) => const SizedBox(height: 12),
                itemBuilder: (context, index) {
                  final item = _notifications[index];
                  final isUnread = item['unread'] == true;
                  final isApproval = item['isApproval'] == true || item['stationPassword'] != null;
                  final portalUrl = item['portalUrl'] as String?;
                  final stationPassword = item['stationPassword'] as String?;
                  final email = item['email'] as String?;

                  return GestureDetector(
                    onTap: () {
                      setState(() {
                        item['unread'] = false;
                      });
                    },
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isApproval
                            ? const Color(0xFF1E1B18)
                            : isUnread
                                ? AppColors.lightDecorAccent.withValues(alpha: 0.3)
                                : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isApproval
                              ? AppColors.warmAccent.withValues(alpha: 0.6)
                              : isUnread
                                  ? AppColors.warmAccent
                                  : AppColors.border,
                          width: isApproval ? 1.5 : 1.0,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: isApproval ? 0.15 : 0.03),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                radius: 20,
                                backgroundColor: isApproval
                                    ? AppColors.warmAccent.withValues(alpha: 0.25)
                                    : AppColors.warmAccent.withValues(alpha: 0.15),
                                child: Icon(
                                  item['icon'] as IconData,
                                  color: isApproval ? AppColors.warmAccent : AppColors.warmAccent,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                      children: [
                                        Expanded(
                                          child: Text(
                                            item['title'] as String,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: TextStyle(
                                              fontSize: 14,
                                              fontWeight: FontWeight.bold,
                                              color: isApproval ? Colors.white : AppColors.primaryBlack,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          item['time'] as String,
                                          style: TextStyle(
                                            fontSize: 10,
                                            color: isApproval ? Colors.white54 : AppColors.mutedText,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      item['body'] as String,
                                      style: TextStyle(
                                        fontSize: 12,
                                        color: isApproval ? const Color(0xFFD4C7BC) : AppColors.secondaryText,
                                        height: 1.4,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          ),

                          // ── Station Credentials Card (When Station Owner is Approved) ──
                          if (isApproval || portalUrl != null || stationPassword != null) ...[
                            const SizedBox(height: 14),
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: Colors.black.withValues(alpha: 0.4),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.warmAccent.withValues(alpha: 0.3)),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Row(
                                    children: [
                                      Icon(Icons.key, color: AppColors.warmAccent, size: 14),
                                      SizedBox(width: 6),
                                      Text(
                                        'Station Dashboard Credentials',
                                        style: TextStyle(
                                          color: AppColors.warmAccent,
                                          fontSize: 12,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),

                                  // Portal URL Row
                                  if (portalUrl != null) ...[
                                    Row(
                                      children: [
                                        const Text('🌐 URL: ', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
                                        Expanded(
                                          child: Text(
                                            portalUrl,
                                            style: const TextStyle(color: AppColors.warmAccent, fontSize: 11, fontWeight: FontWeight.bold),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.copy, size: 14, color: Colors.white70),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          onPressed: () => _copyToClipboard(portalUrl, 'Portal URL'),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                  ],

                                  // Station Password Row
                                  if (stationPassword != null) ...[
                                    Row(
                                      children: [
                                        const Text('🔑 Password: ', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
                                        Expanded(
                                          child: Text(
                                            stationPassword,
                                            style: const TextStyle(
                                              color: Colors.greenAccent,
                                              fontSize: 12,
                                              fontFamily: 'Courier New',
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                        IconButton(
                                          icon: const Icon(Icons.copy, size: 14, color: Colors.white70),
                                          padding: EdgeInsets.zero,
                                          constraints: const BoxConstraints(),
                                          onPressed: () => _copyToClipboard(stationPassword, 'Station Password'),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 4),
                                  ],

                                  // Email Row
                                  if (email != null) ...[
                                    Row(
                                      children: [
                                        const Text('📧 Email: ', style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
                                        Expanded(
                                          child: Text(
                                            email,
                                            style: const TextStyle(color: Colors.white, fontSize: 11),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
