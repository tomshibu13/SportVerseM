import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import '../models/post_model.dart';
import '../services/api_service.dart';
import '../services/auth_service.dart';
import '../theme/app_theme.dart';
import '../utils/validators.dart';

class CreatePostScreen extends StatefulWidget {
  final PostModel? postToEdit;

  const CreatePostScreen({super.key, this.postToEdit});

  @override
  State<CreatePostScreen> createState() => _CreatePostScreenState();
}

class _CreatePostScreenState extends State<CreatePostScreen> {
  final _formKey = GlobalKey<FormState>();
  final TextEditingController _captionController = TextEditingController();
  final TextEditingController _locationController = TextEditingController();
  final TextEditingController _customMediaUrlController = TextEditingController();

  String _selectedSport = 'Football';
  String _selectedMediaUrl = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80';
  bool _isSubmitting = false;

  final List<String> _sportsCategories = [
    'Football',
    'Badminton',
    'Basketball',
    'Cricket',
    'Tennis',
    'Running',
    'Fitness',
    'Other',
  ];

  final List<Map<String, String>> _presetSportMedia = [
    {
      'title': 'Football Turf',
      'url': 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Badminton Rally',
      'url': 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Hoops Session',
      'url': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Box Cricket',
      'url': 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Morning Run',
      'url': 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Strength & Gym',
      'url': 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    },
    {
      'title': 'Tennis Match',
      'url': 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?auto=format&fit=crop&w=1200&q=80',
    },
  ];

  @override
  void initState() {
    super.initState();
    if (widget.postToEdit != null) {
      final p = widget.postToEdit!;
      _captionController.text = p.caption;
      _locationController.text = p.location;
      _selectedSport = _sportsCategories.contains(p.sportCategory) ? p.sportCategory : 'Football';
      _selectedMediaUrl = p.mediaUrl;
      _customMediaUrlController.text = p.mediaUrl;
    } else {
      _locationController.text = 'Calicut, Kerala';
    }
  }

  @override
  void dispose() {
    _captionController.dispose();
    _locationController.dispose();
    _customMediaUrlController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final ImagePicker picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 1200,
        imageQuality: 80,
      );

      if (image != null) {
        final bytes = await image.readAsBytes();
        final base64Image = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          _selectedMediaUrl = base64Image;
          _customMediaUrlController.clear();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to pick image from device.')),
        );
      }
    }
  }

  Widget _buildSafeImage(String url) {
    if (url.startsWith('data:image') && url.contains(',')) {
      try {
        final base64String = url.split(',').last;
        final bytes = base64Decode(base64String);
        return Image.memory(
          bytes,
          height: 200,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => _errorPlaceholder(),
        );
      } catch (_) {
        return _errorPlaceholder();
      }
    }
    return Image.network(
      url,
      height: 200,
      width: double.infinity,
      fit: BoxFit.cover,
      errorBuilder: (_, __, ___) => _errorPlaceholder(),
    );
  }

  Widget _errorPlaceholder() {
    return Container(
      height: 160,
      color: Colors.grey.shade200,
      alignment: Alignment.center,
      child: const Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.broken_image_rounded, size: 36, color: AppColors.mutedText),
          SizedBox(height: 6),
          Text('Invalid photo. Please pick a preset below.', style: TextStyle(fontSize: 11, color: AppColors.mutedText)),
        ],
      ),
    );
  }

  Future<void> _handlePublish() async {
    if (!AuthService.isLoggedIn) {
      final authenticated = await AuthService.requireAuth(
        context,
        message: 'Please sign in to publish community posts.',
      );
      if (!authenticated || !mounted) return;
    }

    if (!(_formKey.currentState?.validate() ?? false)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please write a valid caption for your post.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    final mediaUrl = _customMediaUrlController.text.trim().isNotEmpty
        ? _customMediaUrlController.text.trim()
        : _selectedMediaUrl;

    if (mediaUrl.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('⚠️ Please select or enter a photo URL for your post.'),
          backgroundColor: Colors.redAccent,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      if (widget.postToEdit != null) {
        // Edit Post
        final res = await ApiService.updateCommunityPost(
          postId: widget.postToEdit!.postId,
          caption: _captionController.text.trim(),
          sportCategory: _selectedSport,
          location: _locationController.text.trim(),
          mediaUrl: mediaUrl,
        );

        setState(() => _isSubmitting = false);
        if (res['success'] == true && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🎉 Post updated successfully!'),
              backgroundColor: Color(0xFF2E7D32),
            ),
          );
          Navigator.pop(context, true);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Failed to update post'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      } else {
        // Create Post
        final res = await ApiService.createCommunityPost(
          caption: _captionController.text.trim(),
          mediaUrl: mediaUrl,
          sportCategory: _selectedSport,
          location: _locationController.text.trim(),
        );

        setState(() => _isSubmitting = false);
        if (res['success'] == true && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('🚀 Post published to SportVerse Community!'),
              backgroundColor: Color(0xFF2E7D32),
            ),
          );
          Navigator.pop(context, true);
        } else if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(res['message'] ?? 'Failed to publish post'),
              backgroundColor: Colors.redAccent,
            ),
          );
        }
      }
    } catch (e) {
      setState(() => _isSubmitting = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: Colors.redAccent),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.postToEdit != null;

    return Scaffold(
      backgroundColor: const Color(0xFFF9F7F4),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close, color: AppColors.primaryBlack),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          isEditing ? 'Edit Community Post' : 'New Sport Post',
          style: const TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.bold,
            color: AppColors.primaryBlack,
          ),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 12, top: 8, bottom: 8),
            child: ElevatedButton(
              onPressed: _isSubmitting ? null : _handlePublish,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.warmAccent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                padding: const EdgeInsets.symmetric(horizontal: 16),
              ),
              child: _isSubmitting
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : Text(
                      isEditing ? 'Save' : 'Share',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ── 1. Media Preview & Selector ──
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '1. Post Photo / Media',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Device Upload Button
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: _pickImage,
                        icon: const Icon(Icons.photo_library, size: 18),
                        label: const Text('Upload Photo from Device'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: AppColors.warmAccent,
                          side: const BorderSide(color: AppColors.warmAccent),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Media Preview Box
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Stack(
                        alignment: Alignment.bottomRight,
                        children: [
                          _buildSafeImage(
                            _customMediaUrlController.text.trim().isNotEmpty
                                ? _customMediaUrlController.text.trim()
                                : _selectedMediaUrl,
                          ),
                          Container(
                            margin: const EdgeInsets.all(10),
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.black.withValues(alpha: 0.7),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.sports, size: 12, color: Colors.white),
                                const SizedBox(width: 4),
                                Text(
                                  _selectedSport.toUpperCase(),
                                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Preset Sports Photos Carousel
                    const Text('Sports Photo Presets:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.secondaryText)),
                    const SizedBox(height: 8),
                    SizedBox(
                      height: 70,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        physics: const BouncingScrollPhysics(),
                        itemCount: _presetSportMedia.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          final item = _presetSportMedia[index];
                          final isSelected = _selectedMediaUrl == item['url'] && _customMediaUrlController.text.isEmpty;

                          return InkWell(
                            onTap: () {
                              setState(() {
                                _selectedMediaUrl = item['url']!;
                                _customMediaUrlController.clear();
                              });
                            },
                            borderRadius: BorderRadius.circular(10),
                            child: Container(
                              width: 80,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: isSelected ? AppColors.warmAccent : Colors.grey.shade300,
                                  width: isSelected ? 2.5 : 1,
                                ),
                              ),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(item['url']!, fit: BoxFit.cover),
                                  ),
                                  Container(
                                    decoration: BoxDecoration(
                                      borderRadius: BorderRadius.circular(8),
                                      color: Colors.black.withValues(alpha: 0.35),
                                    ),
                                    alignment: Alignment.center,
                                    padding: const EdgeInsets.all(4),
                                    child: Text(
                                      item['title']!,
                                      textAlign: TextAlign.center,
                                      style: const TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ),
                                  if (isSelected)
                                    const Positioned(
                                      top: 4,
                                      right: 4,
                                      child: Icon(Icons.check_circle, size: 16, color: AppColors.warmAccent),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Custom Media URL input
                    TextFormField(
                      controller: _customMediaUrlController,
                      decoration: InputDecoration(
                        labelText: 'Or Paste Custom Image URL',
                        hintText: 'https://images.unsplash.com/...',
                        prefixIcon: const Icon(Icons.link, size: 18),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        suffixIcon: _customMediaUrlController.text.isNotEmpty
                            ? IconButton(
                                icon: const Icon(Icons.clear, size: 16),
                                onPressed: () => setState(() => _customMediaUrlController.clear()),
                              )
                            : null,
                      ),
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ── 2. Caption & Hashtags ──
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '2. Caption & Story',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _captionController,
                      maxLines: 5,
                      validator: (v) => Validators.minLength(v, 3, 'Caption'),
                      autovalidateMode: AutovalidateMode.onUserInteraction,
                      decoration: InputDecoration(
                        hintText: 'Share your match highlights, scoreline, team drills, or fitness milestone... #SportVerse #Football',
                        hintStyle: const TextStyle(fontSize: 13, color: AppColors.mutedText),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.all(12),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ── 3. Sport Category Selection ──
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '3. Sport Category',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 10),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: _sportsCategories.map((sport) {
                        final isSel = _selectedSport == sport;
                        return ChoiceChip(
                          label: Text(sport),
                          selected: isSel,
                          selectedColor: AppColors.primaryBlack,
                          labelStyle: TextStyle(
                            fontSize: 12,
                            fontWeight: isSel ? FontWeight.bold : FontWeight.w500,
                            color: isSel ? Colors.white : AppColors.primaryBlack,
                          ),
                          backgroundColor: const Color(0xFFF9F7F4),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          onSelected: (val) {
                            if (val) setState(() => _selectedSport = sport);
                          },
                        );
                      }).toList(),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 16),

              // ── 4. Location Tag (Optional) ──
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.border),
                ),
                padding: const EdgeInsets.all(14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '4. Venue / Location (Optional)',
                      style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.primaryBlack),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _locationController,
                      decoration: InputDecoration(
                        hintText: 'e.g. Kickoff Arena, Calicut',
                        prefixIcon: const Icon(Icons.location_on_outlined, size: 18, color: AppColors.warmAccent),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Submit Button
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _handlePublish,
                  icon: _isSubmitting
                      ? const SizedBox()
                      : Icon(isEditing ? Icons.check_circle_outline : Icons.send_rounded, size: 18),
                  label: Text(
                    isEditing ? 'Save Post Changes' : 'Publish to Sport Community',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primaryBlack,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(25)),
                  ),
                ),
              ),
              const SizedBox(height: 30),
            ],
          ),
        ),
      ),
    );
  }
}
