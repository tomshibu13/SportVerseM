class ProductModel {
  final int productId;
  final String title;
  final String category;
  final String sport;
  final double price;
  final double originalPrice;
  final double rating;
  final int reviews;
  final String image;
  final String description;
  final int stock;
  final int shopOwnerId;

  ProductModel({
    required this.productId,
    required this.title,
    required this.category,
    this.sport = 'Sports',
    required this.price,
    required this.originalPrice,
    this.rating = 4.8,
    this.reviews = 50,
    required this.image,
    required this.description,
    required this.stock,
    required this.shopOwnerId,
  });

  String? get discount {
    if (originalPrice > price) {
      final pct = (((originalPrice - price) / originalPrice) * 100).round();
      if (pct > 0) return '$pct% OFF';
    }
    return null;
  }

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
      case 'sport':
        return sport;
      case 'price':
        return price;
      case 'original_price':
      case 'originalPrice':
        return originalPrice;
      case 'discount':
        return discount;
      case 'rating':
        return rating;
      case 'reviews':
        return reviews;
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

    final origPrice = (json['original_price'] is num)
        ? (json['original_price'] as num).toDouble()
        : ((json['originalPrice'] is num)
            ? (json['originalPrice'] as num).toDouble()
            : (double.tryParse(json['original_price']?.toString() ?? '') ??
                (json['price'] is num ? (json['price'] as num).toDouble() : 0.0)));

    return ProductModel(
      productId: json['product_id'] is int
          ? json['product_id']
          : int.tryParse(json['product_id']?.toString() ?? json['id']?.toString() ?? '') ?? DateTime.now().millisecondsSinceEpoch,
      title: json['title']?.toString() ?? json['name']?.toString() ?? 'Sports Gear',
      category: json['category']?.toString() ?? 'Gear',
      sport: json['sport']?.toString() ?? json['category']?.toString() ?? 'Sports',
      price: (json['price'] is num)
          ? (json['price'] as num).toDouble()
          : (double.tryParse(json['price']?.toString() ?? '0') ?? 0.0),
      originalPrice: origPrice > 0 ? origPrice : ((json['price'] is num) ? (json['price'] as num).toDouble() : 0.0),
      rating: (json['rating'] is num)
          ? (json['rating'] as num).toDouble()
          : (double.tryParse(json['rating']?.toString() ?? '4.8') ?? 4.8),
      reviews: (json['reviews'] is num)
          ? (json['reviews'] as num).toInt()
          : (int.tryParse(json['reviews']?.toString() ?? '45') ?? 45),
      image: json['image']?.toString() ??
          'https://images.unsplash.com/photo-1614632537197-38a17061c2bd?auto=format&fit=crop&w=600&q=80',
      description: json['description']?.toString() ?? 'High performance sports equipment crafted for champions.',
      stock: (json['stock'] is num)
          ? (json['stock'] as num).toInt()
          : (int.tryParse(json['stock']?.toString() ?? '15') ?? 15),
      shopOwnerId: (json['shop_owner_id'] is num)
          ? (json['shop_owner_id'] as num).toInt()
          : (int.tryParse(json['shop_owner_id']?.toString() ?? '3') ?? 3),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'product_id': productId,
      'title': title,
      'category': category,
      'sport': sport,
      'price': price,
      'original_price': originalPrice,
      'rating': rating,
      'reviews': reviews,
      'image': image,
      'description': description,
      'stock': stock,
      'shop_owner_id': shopOwnerId,
    };
  }
}
