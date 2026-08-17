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

  dynamic operator [](String key) {
    switch (key) {
      case 'product_id':
      case 'productId':
      case 'id':
      case '_id':
        return productId;
      case 'title':
      case 'name':
        return title;
      case 'category':
        return category;
      case 'price':
        return price;
      case 'original_price':
      case 'originalPrice':
        return originalPrice;
      case 'rating':
        return rating;
      case 'image':
        return image;
      case 'description':
        return description;
      case 'stock':
        return stock;
      case 'shop_owner_id':
      case 'shopOwnerId':
        return shopOwnerId;
      default:
        return null;
    }
  }

  factory ProductModel.fromJson(dynamic rawJson) {
    if (rawJson is ProductModel) {
      return rawJson;
    }
    final Map<String, dynamic> json = rawJson is Map<String, dynamic>
        ? rawJson
        : (rawJson is Map ? Map<String, dynamic>.from(rawJson) : <String, dynamic>{});

    return ProductModel(
      productId: json['product_id'] is int ? json['product_id'] : int.tryParse(json['product_id']?.toString() ?? '') ?? 0,
      title: json['title']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      originalPrice: (json['original_price'] is num) ? (json['original_price'] as num).toDouble() : ((json['price'] is num) ? (json['price'] as num).toDouble() : 0.0),
      rating: (json['rating'] is num) ? (json['rating'] as num).toDouble() : (double.tryParse(json['rating']?.toString() ?? '4.5') ?? 4.5),
      image: json['image']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      stock: (json['stock'] is num) ? (json['stock'] as num).toInt() : (int.tryParse(json['stock']?.toString() ?? '10') ?? 10),
      shopOwnerId: (json['shop_owner_id'] is num) ? (json['shop_owner_id'] as num).toInt() : (int.tryParse(json['shop_owner_id']?.toString() ?? '3') ?? 3),
    );
  }
}
