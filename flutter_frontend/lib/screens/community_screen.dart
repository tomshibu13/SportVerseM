import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../models/post_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../widgets/comments_bottom_sheet.dart';
import '../widgets/top_navigation_bar.dart';
import 'community_profile_screen.dart';
import 'create_post_screen.dart';

class CommunityScreen extends StatefulWidget {
  final VoidCallback? onBack;

  const CommunityScreen({super.key, this.onBack});

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen> {
  List<PostModel> _posts = [];
  bool _isLoading = true;
  String _selectedCategory = 'All';
  final Set<String> _animatingLikePostIds = {};

  final List<String> _categories = [
    'All',
    'Football',
    'Badminton',
    'Basketball',
    'Cricket',
    'Running',
    'Fitness',
    'Tennis',
  ];

  @override
  void initState() {
    super.initState();
    _loadPosts();
  }

  Future<void> _loadPosts() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.fetchCommunityPosts(
        sport: _selectedCategory == 'All' ? null : _selectedCategory,
      );
      if (mounted) {
        setState(() {
          _posts = (res['posts'] as List<PostModel>?) ?? [];
          _isLoading = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _toggleLike(PostModel post) async {
    if (!AuthService.isLoggedIn) {
      final authenticated = await AuthService.requireAuth(
        context,
        message: 'Sign in to like and interact with community posts.',
      );
      if (!authenticated || !mounted) return;
    }

    HapticFeedback.lightImpact();

    // Optimistic UI update
    final wasLiked = post.isLiked;
    setState(() {
      post.isLiked = !wasLiked;
      post.likeCount += post.isLiked ? 1 : -1;
      if (post.likeCount < 0) post.likeCount = 0;
    });

    final res = await ApiService.toggleLikePost(post.postId);
    if (mounted && res['success'] == true) {
      setState(() {
        post.isLiked = res['liked'] == true;
        post.likeCount = res['like_count'] ?? post.likeCount;
      });
    }
  }

  void _triggerDoubleTapLike(PostModel post) {
    if (!post.isLiked) {
      _toggleLike(post);
    }
    setState(() {
      _animatingLikePostIds.add(post.postId);
    });
    Future.delayed(const Duration(milliseconds: 700), () {
      if (mounted) {
        setState(() {
          _animatingLikePostIds.remove(post.postId);
        });
      }
    });
  }

  void _openComments(PostModel post) {
    CommentsBottomSheet.show(
      context,
      postId: post.postId,
      initialCommentCount: post.commentCount,
      onCommentCountChanged: (newCount) {
        setState(() => post.commentCount = newCount);
      },
    );
  }

  void _openProfile(String userId, String userName) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => CommunityProfileScreen(userId: userId, userName: userName),
      ),
    );
  }

  Future<void> _handleDeletePost(PostModel post) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Post'),
        content: const Text('Are you sure you want to delete this community post? This action cannot be undone.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFDC2626)),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Delete Post', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirm != true || !mounted) return;

    final res = await ApiService.deleteCommunityPost(post.postId);
    if (!mounted) return;

    if (res['success'] == true) {
      setState(() {
        _posts.removeWhere((p) => p.postId == post.postId);
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Post deleted successfully'),
          backgroundColor: Color(0xFF2E7D32),
        ),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(res['message'] ?? 'Failed to delete post'),
          backgroundColor: Colors.redAccent,
        ),
      );
    }
  }

  void _openCreatePost([PostModel? postToEdit]) async {
    final created = await Navigator.push<bool>(
      context,
      MaterialPageRoute(
        builder: (_) => CreatePostScreen(postToEdit: postToEdit),
      ),
    );
    if (created == true && mounted) {
      _loadPosts();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      appBar: TopNavigationBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, size: 24, color: AppColors.primaryBlack),
          onPressed: widget.onBack ?? () => Navigator.pop(context),
        ),
        trailing: IconButton(
          icon: const Icon(Icons.add_box_outlined, size: 24, color: AppColors.primaryBlack),
          onPressed: () => _openCreatePost(),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openCreatePost(),
        backgroundColor: AppColors.primaryBlack,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add_photo_alternate_outlined, size: 20),
        label: const Text('New Post', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadPosts,
        color: AppColors.warmAccent,
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            // ── 1. Community Header Banner & Sport Filter Chips ──
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                padding: const EdgeInsets.only(top: 12, bottom: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Sports Community',
                                style: TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primaryBlack,
                                ),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Connect, share highlights, and discuss sports',
                                style: TextStyle(fontSize: 11, color: AppColors.secondaryText),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () {
                              final currentUserId = AuthService.currentUser?['_id'] ?? 'me';
                              _openProfile(currentUserId.toString(), 'My Profile');
                            },
                            borderRadius: BorderRadius.circular(20),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: AppColors.lightDecorAccent,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: const Row(
                                children: [
                                  Icon(Icons.person_outline, size: 14, color: AppColors.warmAccent),
                                  SizedBox(width: 4),
                                  Text(
                                    'My Profile',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.warmAccent,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Horizontal Category Chips
                    SizedBox(
                      height: 34,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: _categories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, index) {
                          final cat = _categories[index];
                          final isSelected = _selectedCategory == cat;

                          return InkWell(
                            onTap: () {
                              if (_selectedCategory != cat) {
                                setState(() => _selectedCategory = cat);
                                _loadPosts();
                              }
                            },
                            borderRadius: BorderRadius.circular(17),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                              decoration: BoxDecoration(
                                color: isSelected ? AppColors.primaryBlack : const Color(0xFFF9F7F4),
                                borderRadius: BorderRadius.circular(17),
                                border: Border.all(
                                  color: isSelected ? AppColors.primaryBlack : AppColors.border,
                                ),
                              ),
                              child: Text(
                                cat,
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                                  color: isSelected ? Colors.white : AppColors.primaryBlack,
                                ),
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SliverToBoxAdapter(child: SizedBox(height: 10)),

            // ── 2. Posts Feed / Empty / Loading State ──
            if (_isLoading)
              const SliverFillRemaining(
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(strokeWidth: 2.5, color: AppColors.warmAccent),
                      SizedBox(height: 12),
                      Text('Loading community feed...', style: TextStyle(fontSize: 12, color: AppColors.mutedText)),
                    ],
                  ),
                ),
              )
            else if (_posts.isEmpty)
              SliverFillRemaining(
                hasScrollBody: false,
                child: Container(
                  padding: const EdgeInsets.all(32),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: const BoxDecoration(
                          color: AppColors.lightDecorAccent,
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(Icons.sports_soccer, size: 48, color: AppColors.warmAccent),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No $_selectedCategory posts yet',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Be the first athlete to share a post in this category!',
                        textAlign: TextAlign.center,
                        style: TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => _openCreatePost(),
                        icon: const Icon(Icons.add, size: 16),
                        label: const Text('Create First Post'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.warmAccent,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else
              SliverList(
                delegate: SliverChildBuilderDelegate(
                  (context, index) {
                    final post = _posts[index];
                    return _buildPostCard(post);
                  },
                  childCount: _posts.length,
                ),
              ),

            const SliverToBoxAdapter(child: SizedBox(height: 90)),
          ],
        ),
      ),
    );
  }

  Widget _buildPostCard(PostModel post) {
    final isAnimatingHeart = _animatingLikePostIds.contains(post.postId);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── A. Post Header (User Avatar, Name, Sport Badge & Options) ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(
              children: [
                GestureDetector(
                  onTap: () => _openProfile(post.userId, post.userName),
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: Colors.grey.shade200,
                    backgroundImage: post.userAvatar.isNotEmpty
                        ? NetworkImage(post.userAvatar)
                        : null,
                    child: post.userAvatar.isEmpty
                        ? const Icon(Icons.person, size: 20, color: AppColors.mutedText)
                        : null,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: GestureDetector(
                    onTap: () => _openProfile(post.userId, post.userName),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Flexible(
                              child: Text(
                                post.userName,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.primaryBlack,
                                ),
                              ),
                            ),
                            const SizedBox(width: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                              decoration: BoxDecoration(
                                color: AppColors.lightDecorAccent,
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                post.sportCategory.toUpperCase(),
                                style: const TextStyle(
                                  fontSize: 9,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.warmAccent,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 2),
                        Row(
                          children: [
                            if (post.location.isNotEmpty) ...[
                              const Icon(Icons.location_on_outlined, size: 11, color: AppColors.mutedText),
                              const SizedBox(width: 2),
                              Text(
                                '${post.location} • ',
                                style: const TextStyle(fontSize: 11, color: AppColors.secondaryText),
                              ),
                            ],
                            Text(
                              post.timeAgo,
                              style: const TextStyle(fontSize: 11, color: AppColors.mutedText),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),

                // Post Options Menu (Edit/Delete for own, Report/Hide for others)
                PopupMenuButton<String>(
                  icon: const Icon(Icons.more_horiz, color: AppColors.mutedText),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  onSelected: (value) {
                    if (value == 'edit') {
                      _openCreatePost(post);
                    } else if (value == 'delete') {
                      _handleDeletePost(post);
                    } else if (value == 'report') {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Post reported for community review.'), duration: Duration(seconds: 2)),
                      );
                    } else if (value == 'hide') {
                      setState(() => _posts.removeWhere((p) => p.postId == post.postId));
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Post hidden from your feed.'), duration: Duration(seconds: 2)),
                      );
                    }
                  },
                  itemBuilder: (ctx) => [
                    if (post.isOwner || AuthService.currentUser?['_id'] == post.userId) ...[
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit_outlined, size: 18, color: AppColors.primaryBlack),
                            SizedBox(width: 8),
                            Text('Edit Post', style: TextStyle(fontSize: 13)),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_outline, size: 18, color: Color(0xFFDC2626)),
                            SizedBox(width: 8),
                            Text('Delete Post', style: TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                          ],
                        ),
                      ),
                    ] else ...[
                      const PopupMenuItem(
                        value: 'hide',
                        child: Row(
                          children: [
                            Icon(Icons.visibility_off_outlined, size: 18, color: AppColors.primaryBlack),
                            SizedBox(width: 8),
                            Text('Hide this post', style: TextStyle(fontSize: 13)),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'report',
                        child: Row(
                          children: [
                            Icon(Icons.flag_outlined, size: 18, color: Color(0xFFDC2626)),
                            SizedBox(width: 8),
                            Text('Report Post', style: TextStyle(fontSize: 13, color: Color(0xFFDC2626))),
                          ],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),

          // ── B. Post Media Image with Double-Tap Like ──
          GestureDetector(
            onDoubleTap: () => _triggerDoubleTapLike(post),
            child: Stack(
              alignment: Alignment.center,
              children: [
                AspectRatio(
                  aspectRatio: 1.15,
                  child: Image.network(
                    post.mediaUrl,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: Colors.grey.shade100,
                      alignment: Alignment.center,
                      child: const Icon(Icons.sports, size: 48, color: AppColors.mutedText),
                    ),
                  ),
                ),

                // Animated Pop Heart on Double Tap
                if (isAnimatingHeart)
                  TweenAnimationBuilder<double>(
                    duration: const Duration(milliseconds: 500),
                    tween: Tween(begin: 0.0, end: 1.2),
                    curve: Curves.elasticOut,
                    builder: (context, scale, child) {
                      return Transform.scale(
                        scale: scale,
                        child: const Icon(
                          Icons.favorite,
                          size: 90,
                          color: Color(0xFFEF4444),
                          shadows: [
                            Shadow(color: Colors.black45, blurRadius: 16),
                          ],
                        ),
                      );
                    },
                  ),
              ],
            ),
          ),

          // ── C. Action Buttons Bar (Like, Comment, Share, Save) ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            child: Row(
              children: [
                // Like Button
                IconButton(
                  icon: Icon(
                    post.isLiked ? Icons.favorite : Icons.favorite_border,
                    color: post.isLiked ? const Color(0xFFEF4444) : AppColors.primaryBlack,
                    size: 26,
                  ),
                  onPressed: () => _toggleLike(post),
                ),

                // Comment Button
                IconButton(
                  icon: const Icon(
                    Icons.chat_bubble_outline_rounded,
                    color: AppColors.primaryBlack,
                    size: 24,
                  ),
                  onPressed: () => _openComments(post),
                ),

                // Share Button
                IconButton(
                  icon: const Icon(
                    Icons.share_outlined,
                    color: AppColors.primaryBlack,
                    size: 22,
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('Post link copied! Share "${post.caption.substring(0, post.caption.length > 30 ? 30 : post.caption.length)}..."'),
                        duration: const Duration(seconds: 2),
                      ),
                    );
                  },
                ),

                const Spacer(),

                // Bookmark / Save
                IconButton(
                  icon: const Icon(
                    Icons.bookmark_border_rounded,
                    color: AppColors.primaryBlack,
                    size: 24,
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Post saved to your bookmarks!'), duration: Duration(seconds: 2)),
                    );
                  },
                ),
              ],
            ),
          ),

          // ── D. Likes Count & Caption ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (post.likeCount > 0) ...[
                  Text(
                    '${post.likeCount} ${post.likeCount == 1 ? 'like' : 'likes'}',
                    style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.bold,
                      color: AppColors.primaryBlack,
                    ),
                  ),
                  const SizedBox(height: 4),
                ],

                // Caption with rich text
                RichText(
                  text: TextSpan(
                    style: const TextStyle(fontSize: 13, color: AppColors.primaryBlack, height: 1.35),
                    children: [
                      TextSpan(
                        text: '${post.userName} ',
                        style: const TextStyle(fontWeight: FontWeight.bold),
                      ),
                      TextSpan(text: post.caption),
                    ],
                  ),
                ),

                const SizedBox(height: 6),

                // Comments Teaser
                if (post.commentCount > 0)
                  GestureDetector(
                    onTap: () => _openComments(post),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        'View all ${post.commentCount} comments',
                        style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
                      ),
                    ),
                  )
                else
                  GestureDetector(
                    onTap: () => _openComments(post),
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 2),
                      child: Text(
                        'Add a comment...',
                        style: TextStyle(fontSize: 12, color: AppColors.mutedText),
                      ),
                    ),
                  ),

                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
