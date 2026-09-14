import 'package:flutter/material.dart';
import '../models/post_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../utils/validators.dart';
import '../widgets/comments_bottom_sheet.dart';

class CommunityProfileScreen extends StatefulWidget {
  final String userId;
  final String? userName;

  const CommunityProfileScreen({
    super.key,
    required this.userId,
    this.userName,
  });

  @override
  State<CommunityProfileScreen> createState() => _CommunityProfileScreenState();
}

class _CommunityProfileScreenState extends State<CommunityProfileScreen> {
  CommunityProfileModel? _profile;
  List<PostModel> _posts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _isLoading = true);
    try {
      final res = await ApiService.fetchCommunityUserProfile(widget.userId);
      if (mounted) {
        if (res['success'] == true) {
          setState(() {
            _profile = res['user'] as CommunityProfileModel?;
            _posts = (res['posts'] as List<PostModel>?) ?? [];
            _isLoading = false;
          });
        } else {
          setState(() => _isLoading = false);
        }
      }
    } catch (_) {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showEditProfileModal() {
    if (_profile == null) return;
    final formKey = GlobalKey<FormState>();
    final bioController = TextEditingController(text: _profile!.bio);
    final sportController = TextEditingController(text: _profile!.favoriteSport);
    final locationController = TextEditingController(text: _profile!.location);
    final avatarController = TextEditingController(text: _profile!.profileImage);
    bool isSaving = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) {
          return Container(
            height: MediaQuery.of(context).size.height * 0.85,
            decoration: const BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Form(
              key: formKey,
              child: Column(
                children: [
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)),
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 4),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Edit Athlete Profile',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, size: 20),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                  ),
                  const Divider(height: 1),
                  Expanded(
                    child: SingleChildScrollView(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Bio
                          const Text('Bio / Athlete Introduction', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: bioController,
                            maxLines: 3,
                            validator: (v) => Validators.minLength(v, 2, 'Bio'),
                            decoration: const InputDecoration(
                              hintText: 'Tell the community about your sports background...',
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Favorite Sport
                          const Text('Primary Sport / Interests', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: sportController,
                            validator: (v) => Validators.minLength(v, 2, 'Sport'),
                            decoration: const InputDecoration(
                              hintText: 'e.g. Football, Badminton, Basketball',
                              prefixIcon: Icon(Icons.sports, size: 18),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Location
                          const Text('Home Turf / Location', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: locationController,
                            decoration: const InputDecoration(
                              hintText: 'e.g. Calicut, Kerala',
                              prefixIcon: Icon(Icons.location_on_outlined, size: 18),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 16),

                          // Profile Image URL
                          const Text('Profile Photo URL', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 6),
                          TextFormField(
                            controller: avatarController,
                            decoration: const InputDecoration(
                              hintText: 'https://images.unsplash.com/...',
                              prefixIcon: Icon(Icons.photo_outlined, size: 18),
                              border: OutlineInputBorder(),
                            ),
                          ),
                          const SizedBox(height: 24),

                          SizedBox(
                            width: double.infinity,
                            height: 48,
                            child: ElevatedButton(
                              onPressed: isSaving
                                  ? null
                                  : () async {
                                      if (!(formKey.currentState?.validate() ?? false)) return;
                                      setModalState(() => isSaving = true);
                                      final messenger = ScaffoldMessenger.of(context);
                                      final res = await ApiService.updateCommunityUserProfile(
                                        bio: bioController.text.trim(),
                                        favoriteSport: sportController.text.trim(),
                                        location: locationController.text.trim(),
                                        profileImage: avatarController.text.trim(),
                                      );
                                      setModalState(() => isSaving = false);
                                      if (!mounted) return;
                                      if (res['success'] == true) {
                                        if (ctx.mounted) Navigator.pop(ctx);
                                        _loadProfile();
                                        messenger.showSnackBar(
                                          const SnackBar(content: Text('🎉 Profile updated!'), backgroundColor: Colors.green),
                                        );
                                      } else {
                                        messenger.showSnackBar(
                                          SnackBar(content: Text(res['message'] ?? 'Failed to update profile'), backgroundColor: Colors.redAccent),
                                        );
                                      }
                                    },
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primaryBlack,
                                foregroundColor: Colors.white,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
                              ),
                              child: isSaving
                                  ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                                  : const Text('Save Profile Changes', style: TextStyle(fontWeight: FontWeight.bold)),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  void _showPostDetailModal(PostModel post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => Container(
        height: MediaQuery.of(context).size.height * 0.82,
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Column(
          children: [
            Container(
              width: 40,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(color: Colors.grey[300], borderRadius: BorderRadius.circular(10)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '${post.sportCategory} Post',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(14),
                      child: Image.network(
                        post.mediaUrl,
                        width: double.infinity,
                        height: 240,
                        fit: BoxFit.cover,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.favorite, color: Color(0xFFEF4444), size: 20),
                            const SizedBox(width: 4),
                            Text('${post.likeCount} likes', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                        const SizedBox(width: 16),
                        Row(
                          children: [
                            const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.primaryBlack, size: 18),
                            const SizedBox(width: 4),
                            Text('${post.commentCount} comments', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          ],
                        ),
                        const Spacer(),
                        Text(post.timeAgo, style: const TextStyle(fontSize: 12, color: AppColors.mutedText)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(post.caption, style: const TextStyle(fontSize: 14, height: 1.4)),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.chat_bubble_outline_rounded, size: 16),
                        label: const Text('View All Comments'),
                        onPressed: () {
                          Navigator.pop(ctx);
                          CommentsBottomSheet.show(context, postId: post.postId, initialCommentCount: post.commentCount);
                        },
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios, size: 18, color: AppColors.primaryBlack),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          _profile?.fullName ?? widget.userName ?? 'Athlete Profile',
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
        ),
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.warmAccent, strokeWidth: 2.5))
          : _profile == null
              ? const Center(child: Text('User profile not found'))
              : SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  child: Column(
                    children: [
                      // ── 1. Profile Header Card ──
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.all(20),
                        child: Column(
                          children: [
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 40,
                                  backgroundColor: Colors.grey.shade200,
                                  backgroundImage: NetworkImage(_profile!.profileImage),
                                ),
                                const SizedBox(width: 20),
                                Expanded(
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                                    children: [
                                      _buildStatColumn('Posts', _profile!.totalPosts.toString()),
                                      _buildStatColumn('Likes', _profile!.totalLikesReceived.toString()),
                                      _buildStatColumn('Role', _profile!.role),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),

                            // Name & Bio
                            Align(
                              alignment: Alignment.centerLeft,
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    _profile!.fullName,
                                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.lightDecorAccent,
                                          borderRadius: BorderRadius.circular(8),
                                        ),
                                        child: Text(
                                          _profile!.favoriteSport.toUpperCase(),
                                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.warmAccent),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.mutedText),
                                      const SizedBox(width: 2),
                                      Text(_profile!.location, style: const TextStyle(fontSize: 12, color: AppColors.secondaryText)),
                                    ],
                                  ),
                                  const SizedBox(height: 10),
                                  Text(
                                    _profile!.bio,
                                    style: const TextStyle(fontSize: 13, color: AppColors.primaryBlack, height: 1.35),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(height: 16),

                            // Action Button: Edit Profile if self, Connect if other
                            if (_profile!.isSelf || AuthService.currentUser?['_id'] == widget.userId)
                              SizedBox(
                                width: double.infinity,
                                height: 38,
                                child: OutlinedButton.icon(
                                  icon: const Icon(Icons.edit_outlined, size: 16),
                                  label: const Text('Edit Profile & Sports Interests', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  style: OutlinedButton.styleFrom(
                                    foregroundColor: AppColors.primaryBlack,
                                    side: const BorderSide(color: AppColors.border),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  onPressed: _showEditProfileModal,
                                ),
                              )
                            else
                              SizedBox(
                                width: double.infinity,
                                height: 38,
                                child: ElevatedButton.icon(
                                  icon: const Icon(Icons.person_add_alt_1_outlined, size: 16),
                                  label: const Text('Connect with Athlete', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.primaryBlack,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  onPressed: () {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(content: Text('Connected with ${_profile!.fullName}!'), backgroundColor: Colors.green),
                                    );
                                  },
                                ),
                              ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 12),

                      // ── 2. User's Posts Grid ──
                      Container(
                        color: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                const Text(
                                  'Sports Posts',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                                ),
                                Text(
                                  '${_posts.length} Posts',
                                  style: const TextStyle(fontSize: 12, color: AppColors.mutedText),
                                ),
                              ],
                            ),
                            const SizedBox(height: 12),

                            if (_posts.isEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(vertical: 36),
                                alignment: Alignment.center,
                                child: Column(
                                  children: [
                                    Icon(Icons.photo_library_outlined, size: 40, color: Colors.grey[300]),
                                    const SizedBox(height: 8),
                                    const Text('No posts shared yet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                                  ],
                                ),
                              )
                            else
                              GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                itemCount: _posts.length,
                                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: 3,
                                  crossAxisSpacing: 4,
                                  mainAxisSpacing: 4,
                                  childAspectRatio: 1.0,
                                ),
                                itemBuilder: (context, index) {
                                  final post = _posts[index];
                                  return InkWell(
                                    onTap: () => _showPostDetailModal(post),
                                    child: Stack(
                                      fit: StackFit.expand,
                                      children: [
                                        Image.network(post.mediaUrl, fit: BoxFit.cover),
                                        Positioned(
                                          bottom: 4,
                                          left: 4,
                                          child: Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: Colors.black.withValues(alpha: 0.6),
                                              borderRadius: BorderRadius.circular(4),
                                            ),
                                            child: Row(
                                              children: [
                                                const Icon(Icons.favorite, size: 10, color: Colors.white),
                                                const SizedBox(width: 2),
                                                Text(
                                                  '${post.likeCount}',
                                                  style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold),
                                                ),
                                              ],
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  );
                                },
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
    );
  }

  Widget _buildStatColumn(String label, String count) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          count,
          style: const TextStyle(fontSize: 17, fontWeight: FontWeight.w900, color: AppColors.primaryBlack),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 12, color: AppColors.secondaryText),
        ),
      ],
    );
  }
}
