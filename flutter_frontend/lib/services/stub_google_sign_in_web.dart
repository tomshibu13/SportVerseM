// Stub implementation of google_sign_in_web/web_only.dart for non-web platforms.
// On web, the real package is used via the conditional import in login_screen.dart
// and register_screen.dart. On Android/iOS/Windows this stub is used instead,
// and renderButton() returns an empty widget since it is never called on those platforms.

import 'package:flutter/material.dart';

/// Stub that returns an empty widget — only called on web via conditional import.
Widget renderButton() => const SizedBox.shrink();
