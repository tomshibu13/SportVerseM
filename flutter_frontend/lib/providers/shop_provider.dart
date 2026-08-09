import 'package:flutter/material.dart';
import '../models/product_model.dart';
import '../services/api_service.dart';

class ShopProvider with ChangeNotifier {
  List<ProductModel> _products = [];
  final List<ProductModel> _cartItems = [];
  bool _isLoading = false;
  String _selectedCategory = 'All';

  List<ProductModel> get products => _products;
  List<ProductModel> get cartItems => _cartItems;
  bool get isLoading => _isLoading;
  String get selectedCategory => _selectedCategory;

  double get cartTotal => _cartItems.fold(0, (sum, item) => sum + item.price);

  ShopProvider() {
    loadProducts();
  }

  void setSelectedCategory(String cat) {
    _selectedCategory = cat;
    loadProducts();
  }

  Future<void> loadProducts() async {
    _isLoading = true;
    notifyListeners();

    _products = await ApiService.fetchProducts(category: _selectedCategory);

    _isLoading = false;
    notifyListeners();
  }

  void addToCart(ProductModel p) {
    _cartItems.add(p);
    notifyListeners();
  }

  void removeFromCart(ProductModel p) {
    _cartItems.remove(p);
    notifyListeners();
  }

  void clearCart() {
    _cartItems.clear();
    notifyListeners();
  }
}
