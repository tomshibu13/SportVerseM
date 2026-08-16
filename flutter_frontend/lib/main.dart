import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/ground_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/shop_provider.dart';
import 'screens/splash_screen.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables from .env asset before anything else
  await dotenv.load(fileName: '.env');

  runApp(const SportVerseApp());
}

class SportVerseApp extends StatelessWidget {
  const SportVerseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(
          create: (_) => AuthProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => GroundProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => BookingProvider(),
        ),
        ChangeNotifierProvider(
          create: (_) => ShopProvider(),
        ),
      ],
      child: MaterialApp(
        title: 'SportVerse AI',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        home: const SplashScreen(),
      ),
    );
  }
}