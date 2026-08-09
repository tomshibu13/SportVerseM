import 'package:flutter/material.dart';
import '../theme/app_theme.dart';
import '../widgets/custom_graphics.dart';

class ShopScreen extends StatelessWidget {
  const ShopScreen({super.key});

  final List<Map<String, dynamic>> _products = const [
    {
      'title': 'Pro Leather Soccer Ball',
      'category': 'Football',
      'price': '₹1,299',
      'rating': '4.9',
      'icon': Icons.sports_soccer,
    },
    {
      'title': 'Yonex Carbon Badminton Racket',
      'category': 'Badminton',
      'price': '₹2,499',
      'rating': '4.8',
      'icon': Icons.sports_tennis,
    },
    {
      'title': 'Nike Air Zoom Running Shoes',
      'category': 'Footwear',
      'price': '₹4,999',
      'rating': '4.7',
      'icon': Icons.directions_run,
    },
    {
      'title': 'Spalding Official Basketball',
      'category': 'Basketball',
      'price': '₹1,899',
      'rating': '4.6',
      'icon': Icons.sports_basketball,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: const SportVerseTopBar(),
      body: GridView.builder(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(20),
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          childAspectRatio: 0.75,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
        ),
        itemCount: _products.length,
        itemBuilder: (context, index) {
          final item = _products[index];
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Icon(
                        item['icon'] as IconData,
                        size: 48,
                        color: AppColors.warmAccent,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  item['category'] as String,
                  style: const TextStyle(fontSize: 10, color: AppColors.mutedText),
                ),
                const SizedBox(height: 2),
                Text(
                  item['title'] as String,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryBlack,
                  ),
                ),
                const SizedBox(height: 6),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      item['price'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.warmAccent,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppColors.primaryBlack,
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.add_shopping_cart,
                          size: 14, color: Colors.white),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
