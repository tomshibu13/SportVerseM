class ProductModel {
  final int productId;
  final String title;
  final String category;
  final double price;
  final double originalPrice;
  final double rating;
  final String image;
  final String description;
  final int stock;
  final int shopOwnerId;

  ProductModel({
    required this.productId,
    required this.title,
    required this.category,
    required this.price,
    required this.originalPrice,
    required this.rating,
    required this.image,
    required this.description,
    required this.stock,
    required this.shopOwnerId,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      productId: json['product_id'] is int ? json['product_id'] : int.tryParse(json['product_id'].toString()) ?? 0,
      title: json['title'] ?? '',
      category: json['category'] ?? '',
      price: (json['price'] ?? 0).toDouble(),
      originalPrice: (json['original_price'] ?? json['price'] ?? 0).toDouble(),
      rating: (json['rating'] ?? 4.5).toDouble(),
      image: json['image'] ?? '',
      description: json['description'] ?? '',
      stock: (json['stock'] ?? 10).toInt(),
      shopOwnerId: (json['shop_owner_id'] ?? 3).toInt(),
    );
  }
}
