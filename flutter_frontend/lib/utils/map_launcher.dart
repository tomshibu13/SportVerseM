import 'package:flutter/foundation.dart';
import 'package:url_launcher/url_launcher.dart';
import 'url_opener_stub.dart' if (dart.library.html) 'url_opener_web.dart';

class MapLauncher {
  /// Opens Google Maps directions to the specified ground or booking location.
  static Future<bool> openDirections({
    double? latitude,
    double? longitude,
    String? groundName,
    String? address,
  }) async {
    try {
      final name = (groundName ?? '').trim();
      final addr = (address ?? '').trim();

      final hasCoords = latitude != null &&
          longitude != null &&
          latitude != 0 &&
          longitude != 0 &&
          !latitude.isNaN &&
          !longitude.isNaN;

      String url;
      if (hasCoords) {
        url = 'https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude';
      } else {
        final query = [name, addr].where((s) => s.isNotEmpty).join(', ');
        if (query.isEmpty) {
          debugPrint('⚠️ [MapLauncher] No coordinates or address provided.');
          return false;
        }
        url = 'https://www.google.com/maps/search/?api=1&query=${Uri.encodeComponent(query)}';
      }

      debugPrint('🗺️ [MapLauncher] Launching directions URL: $url');

      // On Web, use direct browser window.open to bypass any missing plugin channel issues
      if (kIsWeb) {
        try {
          openUrlUniversal(url);
          return true;
        } catch (webErr) {
          debugPrint('⚠️ [MapLauncher] Web window.open failed, trying url_launcher: $webErr');
        }
      }

      final uri = Uri.parse(url);

      // Try externalApplication mode first (native maps app)
      try {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.externalApplication,
        );
        if (launched) return true;
      } catch (launchErr) {
        debugPrint('⚠️ [MapLauncher] externalApplication launch failed: $launchErr');
      }

      // Try platformDefault mode
      try {
        final launched = await launchUrl(
          uri,
          mode: LaunchMode.platformDefault,
        );
        if (launched) return true;
      } catch (fallbackErr) {
        debugPrint('⚠️ [MapLauncher] platformDefault launch failed: $fallbackErr');
      }

      // If still on web and url_launcher threw MissingPluginException, use window.open
      if (kIsWeb) {
        openUrlUniversal(url);
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('❌ [MapLauncher] Error launching map: $e');
      if (kIsWeb) {
        // Absolute fallback for web
        final fallbackUrl = (latitude != null && longitude != null)
            ? 'https://www.google.com/maps/dir/?api=1&destination=$latitude,$longitude'
            : 'https://www.google.com/maps';
        openUrlUniversal(fallbackUrl);
        return true;
      }
      return false;
    }
  }
}
