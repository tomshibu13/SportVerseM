import 'package:flutter/material.dart';
import '../models/post_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';

class CommentsBottomSheet extends StatefulWidget {
  final String postId;
  final int initialCommentCount;
  final ValueChanged<int>? onCommentCountChanged;

  const CommentsBottomSheet({
    super.key,
    required this.postId,
    this.initialCommentCount = 0,
    this.onCommentCountChanged,
  });

  static Future<void> show(
    BuildContext context, {
    required String postId,
    int initialCommentCount = 0,
    ValueChanged<int>? onCommentCountChanged,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => CommentsBottomSheet(
        postId: postId,
        initialCommentCount: initialCommentCount,
        onCommentCountChanged: onCommentCountChanged,
      ),
    );
  }

  @override
  State<CommentsBottomSheet> createState() => _CommentsBottomSheetState();
}

class _CommentsBottomSheetState extends State<CommentsBottomSheet> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  List<CommentModel> _comments = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  late int _commentCount;

  @override
  void initState() {
    super.initState();
    _commentCount = widget.initialCommentCount;
    _loadComments();
  }

  @override
  void dispose() {
    _commentController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadComments() async {
    setState(() => _isLoading = true);
    try {
      final fetched = await ApiService.fetchPostComments(widget.postId);
      if (mounted) {
        setState(() {
          _comments = fetched;
          _commentCount = fetched.length;
          _isLoading = false;
        });
        widget.onCommentCountChanged?.call(_commentCount);
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _handleSubmitComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    if (!AuthService.isLoggedIn) {
      final authenticated = await AuthService.requireAuth(
        context,
        message: 'Sign in to join the conversation and post comments.',
      );
      if (!authenticated || !mounted) return;
    }

    setState(() => _isSubmitting = true);
    final res = await ApiService.addPostComment(postId: widget.postId, commentText: text);
    if (!mounted) return;

    setState(() => _isSubmitting = false);

    if (res['success'] == true && res['comment'] is CommentModel) {
      final newComment = res['comment'] as CommentModel;
      _commentController.clear();
      FocusScope.of(context).unfocus();

      setState(() {
        _comments.add(newComment);
        _commentCount = _comments.length;
      });
      widget.onCommentCountChanged?.call(_commentCount);

      // Scroll to bottom
      Future.delayed(const Duration(milliseconds: 200), () {
        if (_scrollController.hasClients) {
          _scrollController.animateTo(
            _scrollController.position.maxScrollExtent,
            duration: const Duration(milliseconds: 300),
            curve: Curves.easeOut,
          );
        }
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Failed to post comment'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  Future<void> _handleDeleteComment(CommentModel comment) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Comment'),
        content: const Text('Are you sure you want to delete this comment?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final res = await ApiService.deletePostComment(comment.commentId);
    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _comments.removeWhere((c) => c.commentId == comment.commentId);
        _commentCount = _comments.length;
      });
      widget.onCommentCountChanged?.call(_commentCount);

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Comment deleted'),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Unable to delete comment'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag Handle
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(10),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Text(
                      'Comments',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryBlack,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.lightDecorAccent,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '$_commentCount',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppColors.warmAccent,
                        ),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Comments List
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent),
                  )
                : _comments.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.chat_bubble_outline_rounded, size: 48, color: Colors.grey[300]),
                            const SizedBox(height: 12),
                            const Text(
                              'No comments yet',
                              style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                            ),
                            const SizedBox(height: 4),
                            const Text(
                              'Be the first to start the conversation!',
                              style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                            ),
                          ],
                        ),
                      )
                    : ListView.separated(
                        controller: _scrollController,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _comments.length,
                        separatorBuilder: (_, __) => const Divider(height: 16, color: Color(0xFFF3F4F6)),
                        itemBuilder: (context, index) {
                          final c = _comments[index];
                          return Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              CircleAvatar(
                                radius: 18,
                                backgroundColor: Colors.grey[200],
                                backgroundImage: c.userAvatar.isNotEmpty
                                    ? NetworkImage(c.userAvatar)
                                    : null,
                                child: c.userAvatar.isEmpty
                                    ? const Icon(Icons.person, size: 18, color: AppColors.mutedText)
                                    : null,
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Text(
                                          c.userName,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.primaryBlack,
                                          ),
                                        ),
                                        const SizedBox(width: 6),
                                        Text(
                                          c.timeAgo,
                                          style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 3),
                                    Text(
                                      c.commentText,
                                      style: const TextStyle(
                                        fontSize: 13,
                                        color: AppColors.primaryBlack,
                                        height: 1.35,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              if (c.isOwner)
                                IconButton(
                                  icon: const Icon(Icons.delete_outline, size: 18, color: Color(0xFF94A3B8)),
                                  onPressed: () => _handleDeleteComment(c),
                                  padding: EdgeInsets.zero,
                                  constraints: const BoxConstraints(),
                                ),
                            ],
                          );
                        },
                      ),
          ),

          // Input Field Bar
          Container(
            padding: EdgeInsets.only(
              left: 16,
              right: 16,
              top: 10,
              bottom: MediaQuery.of(context).viewInsets.bottom + 14,
            ),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Colors.grey.shade200)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F7F4),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppColors.border),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: TextField(
                      controller: _commentController,
                      maxLines: null,
                      textCapitalization: TextCapitalization.sentences,
                      decoration: const InputDecoration(
                        hintText: 'Add a comment...',
                        hintStyle: TextStyle(fontSize: 13, color: AppColors.mutedText),
                        border: InputBorder.none,
                        isDense: true,
                        contentPadding: EdgeInsets.symmetric(vertical: 10),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 10),
                _isSubmitting
                    ? const SizedBox(
                        width: 28,
                        height: 28,
                        child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.warmAccent),
                      )
                    : IconButton(
                        icon: const Icon(Icons.send_rounded, color: AppColors.warmAccent, size: 24),
                        onPressed: _handleSubmitComment,
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
