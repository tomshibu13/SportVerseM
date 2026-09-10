class Validators {
  // ── 1. Name & Text Validations ──
  static String? name(String? value, [String fieldName = 'Full Name']) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your $fieldName';
    }
    final trimmed = value.trim();
    if (trimmed.length < 2) {
      return '$fieldName must be at least 2 characters';
    }
    if (trimmed.length > 50) {
      return '$fieldName cannot exceed 50 characters';
    }
    // Only letters, spaces, hyphens, and apostrophes
    final nameRegex = RegExp(r"^[a-zA-Z\s\-'.]+$");
    if (!nameRegex.hasMatch(trimmed)) {
      return '$fieldName can only contain letters and spaces';
    }
    return null;
  }

  static String? groundTitle(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter facility / ground name';
    }
    final trimmed = value.trim();
    if (trimmed.length < 3) {
      return 'Ground name must be at least 3 characters';
    }
    if (trimmed.length > 80) {
      return 'Ground name cannot exceed 80 characters';
    }
    return null;
  }

  // ── 2. Email Validation ──
  static String? email(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your email address';
    }
    final trimmed = value.trim();
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    if (!emailRegex.hasMatch(trimmed)) {
      return 'Please enter a valid email address (e.g. name@example.com)';
    }
    return null;
  }

  // ── 3. Phone Number Validation ──
  static String? phone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter your phone number';
    }
    final clean = value.replaceAll(RegExp(r'[\s\-\(\)]'), '');
    final indianRegex = RegExp(r'^(\+91|91)?[6-9]\d{9}$');
    final genericRegex = RegExp(r'^\+?[1-9]\d{9,14}$');

    if (!indianRegex.hasMatch(clean) && !genericRegex.hasMatch(clean)) {
      return 'Please enter a valid 10-digit mobile number';
    }
    return null;
  }

  // ── 4. Password Validation ──
  static String? password(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter a password';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Must contain at least 1 uppercase letter (A-Z)';
    }
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Must contain at least 1 lowercase letter (a-z)';
    }
    if (!RegExp(r'\d').hasMatch(value)) {
      return 'Must contain at least 1 number (0-9)';
    }
    if (!RegExp(r'[@$!%*?&#^()_\-+={}[\]:;"<>,./~`|\\]').hasMatch(value)) {
      return r'Must contain at least 1 special character (e.g. @$!%*?&#)';
    }
    return null;
  }

  static bool hasMinLength(String? value, [int length = 8]) =>
      value != null && value.length >= length;

  static bool hasUppercase(String? value) =>
      value != null && RegExp(r'[A-Z]').hasMatch(value);

  static bool hasLowercase(String? value) =>
      value != null && RegExp(r'[a-z]').hasMatch(value);

  static bool hasDigit(String? value) =>
      value != null && RegExp(r'\d').hasMatch(value);

  static bool hasSpecialChar(String? value) =>
      value != null && RegExp(r'[@$!%*?&#^()_\-+={}[\]:;"<>,./~`|\\]').hasMatch(value);

  static String? confirmPassword(String? value, String? originalPassword) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != originalPassword) {
      return 'Passwords do not match';
    }
    return null;
  }

  // ── 5. Numeric Validations (Price, PIN, Court Count) ──
  static String? price(String? value, {double min = 10, double max = 50000}) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter price / rate';
    }
    final numVal = double.tryParse(value.trim());
    if (numVal == null) {
      return 'Please enter a valid numeric amount';
    }
    if (numVal < min) {
      return 'Price must be at least ₹${min.toInt()}';
    }
    if (numVal > max) {
      return 'Price cannot exceed ₹${max.toInt()}';
    }
    return null;
  }

  static String? pincode(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter 6-digit PIN code';
    }
    final clean = value.trim();
    final pinRegex = RegExp(r'^[1-9][0-9]{5}$');
    if (!pinRegex.hasMatch(clean)) {
      return 'Please enter a valid 6-digit Indian PIN code';
    }
    return null;
  }

  static String? courtCount(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter court count';
    }
    final count = int.tryParse(value.trim());
    if (count == null || count < 1) {
      return 'Facility must have at least 1 court/pitch';
    }
    if (count > 50) {
      return 'Maximum 50 courts per facility';
    }
    return null;
  }

  // ── 6. Address & Location Validations ──
  static String? address(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter full address';
    }
    if (value.trim().length < 5) {
      return 'Address must be at least 5 characters';
    }
    return null;
  }

  static String? city(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter city';
    }
    final clean = value.trim();
    if (clean.length < 2) {
      return 'City name must be at least 2 characters';
    }
    if (!RegExp(r'^[a-zA-Z\s\-]+$').hasMatch(clean)) {
      return 'City can only contain letters';
    }
    return null;
  }

  static String? state(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please enter state';
    }
    final clean = value.trim();
    if (clean.length < 2) {
      return 'State name must be at least 2 characters';
    }
    if (!RegExp(r'^[a-zA-Z\s\-]+$').hasMatch(clean)) {
      return 'State can only contain letters';
    }
    return null;
  }

  // ── 7. Date & Time Validations ──
  static String? timeRange(String? startTime, String? endTime) {
    if (startTime == null || startTime.isEmpty) {
      return 'Please select start time';
    }
    if (endTime == null || endTime.isEmpty) {
      return 'Please select end time';
    }

    final startMinutes = _timeStringToMinutes(startTime);
    final endMinutes = _timeStringToMinutes(endTime);

    if (startMinutes == null || endMinutes == null) {
      return 'Invalid time format';
    }

    if (endMinutes <= startMinutes) {
      return 'Closing/End time must be after opening/start time';
    }
    return null;
  }

  static int? _timeStringToMinutes(String timeStr) {
    try {
      final regex = RegExp(r'(\d{1,2}):(\d{2})\s*(AM|PM)?', caseSensitive: false);
      final match = regex.firstMatch(timeStr.trim());
      if (match == null) return null;

      int hour = int.parse(match.group(1)!);
      final minute = int.parse(match.group(2)!);
      final ampm = match.group(3)?.toUpperCase();

      if (ampm != null) {
        if (ampm == 'PM' && hour < 12) hour += 12;
        if (ampm == 'AM' && hour == 12) hour = 0;
      }
      return hour * 60 + minute;
    } catch (_) {
      return null;
    }
  }

  // ── 8. General & Collection Validations ──
  static String? required(String? value, [String fieldName = 'This field']) {
    if (value == null || value.trim().isEmpty) {
      return '$fieldName is required';
    }
    return null;
  }

  static String? minLength(String? value, int min, [String fieldName = 'This field']) {
    if (value == null || value.trim().length < min) {
      return '$fieldName must be at least $min characters';
    }
    return null;
  }

  static String? selectionRequired<T>(List<T>? list, [String itemType = 'item']) {
    if (list == null || list.isEmpty) {
      return 'Please select at least one $itemType';
    }
    return null;
  }

  static String? imageUrl(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Please provide an image URL';
    }
    final trimmed = value.trim();
    if (!trimmed.startsWith('http://') &&
        !trimmed.startsWith('https://') &&
        !trimmed.startsWith('data:image/')) {
      return 'Please enter a valid HTTP/HTTPS image URL';
    }
    return null;
  }
}
