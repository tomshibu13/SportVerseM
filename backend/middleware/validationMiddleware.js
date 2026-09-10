const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/;
const genericPhoneRegex = /^\+?[1-9]\d{9,14}$/;
const pinRegex = /^[1-9][0-9]{5}$/;

const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return null;
  const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return null;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
};

// ── 1. Register Validation ──
exports.validateRegister = (req, res, next) => {
  const { full_name, email, phone, password } = req.body;
  const errors = [];

  if (!full_name || typeof full_name !== 'string' || full_name.trim().length < 2) {
    errors.push('Full name must be at least 2 characters');
  } else if (!/^[a-zA-Z\s\-'.]+$/.test(full_name.trim())) {
    errors.push('Full name can only contain letters and spaces');
  }

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (phone) {
    const cleanPhone = String(phone).replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone) && !genericPhoneRegex.test(cleanPhone)) {
      errors.push('Please provide a valid 10-digit mobile number');
    }
  }

  if (!password || typeof password !== 'string' || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    if (!/[A-Z]/.test(password)) errors.push('Password must contain at least 1 uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Password must contain at least 1 lowercase letter');
    if (!/\d/.test(password)) errors.push('Password must contain at least 1 number');
    if (!/[@$!%*?&#^()_\-+={}[\]:;"<>,./~`|\\]/.test(password)) {
      errors.push('Password must contain at least 1 special character');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

// ── 2. Login Validation ──
exports.validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
    errors.push('Please provide a valid email address');
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    errors.push('Password must be at least 6 characters long');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

// ── 3. Ground Registration & Update Validation ──
exports.validateGround = (req, res, next) => {
  const { title, price_per_hour, price, sport_type, address, city, state, pincode, opening_time, closing_time } = req.body;
  const errors = [];

  if (req.method === 'POST') {
    if (!title || typeof title !== 'string' || title.trim().length < 3) {
      errors.push('Ground title must be at least 3 characters');
    }

    const effectivePrice = Number(price_per_hour || price);
    if (isNaN(effectivePrice) || effectivePrice < 10) {
      errors.push('Hourly rate must be at least ₹10');
    }

    if (!sport_type || typeof sport_type !== 'string' || sport_type.trim().length < 2) {
      errors.push('Please specify a valid sport type');
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      errors.push('Address must be at least 5 characters');
    }

    if (pincode) {
      const cleanPin = String(pincode).trim();
      if (!pinRegex.test(cleanPin)) {
        errors.push('PIN code must be a valid 6-digit Indian postal code');
      }
    }

    if (opening_time && closing_time) {
      const startMin = timeStringToMinutes(opening_time);
      const endMin = timeStringToMinutes(closing_time);
      if (startMin !== null && endMin !== null && endMin <= startMin) {
        errors.push('Closing time must be after opening time');
      }
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

// ── 4. Slot Creation & Generation Validation ──
exports.validateSlot = (req, res, next) => {
  const { ground_id, date, start_time, end_time, price } = req.body;
  const errors = [];

  if (!ground_id) {
    errors.push('ground_id is required');
  }

  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(String(date).trim())) {
    errors.push('Valid date format (YYYY-MM-DD) is required');
  }

  if (start_time && end_time) {
    const startMin = timeStringToMinutes(start_time);
    const endMin = timeStringToMinutes(end_time);
    if (startMin === null || endMin === null) {
      errors.push('Invalid start or end time format (e.g. 06:00 AM)');
    } else if (endMin <= startMin) {
      errors.push('End time must be strictly after start time');
    }
  } else {
    errors.push('Both start_time and end_time are required');
  }

  if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
    errors.push('Slot price must be a positive number');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

// ── 5. Booking Validation ──
exports.validateBooking = (req, res, next) => {
  const { ground_id, date, slot_time, slotTime, total_price, totalPrice, user_name, userName, phone } = req.body;
  const errors = [];

  if (!ground_id) {
    errors.push('ground_id is required');
  }

  const bookingDate = String(date || '').trim();
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    errors.push('Valid date format (YYYY-MM-DD) is required');
  } else {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (bookingDate < todayStr) {
      errors.push('Cannot book court slots for past dates');
    }
  }

  const effectiveSlotTime = slot_time || slotTime;
  if (!effectiveSlotTime || typeof effectiveSlotTime !== 'string' || effectiveSlotTime.trim().length < 3) {
    errors.push('Slot time is required');
  }

  const effectivePrice = Number(total_price !== undefined ? total_price : totalPrice);
  if (isNaN(effectivePrice) || effectivePrice <= 0) {
    errors.push('Total booking price must be a positive number');
  }

  const effectiveName = user_name || userName;
  if (effectiveName && typeof effectiveName === 'string' && effectiveName.trim().length < 2) {
    errors.push('Lead player name must be at least 2 characters');
  }

  if (phone) {
    const cleanPhone = String(phone).replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone) && !genericPhoneRegex.test(cleanPhone)) {
      errors.push('Please provide a valid contact phone number');
    }
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};

// ── 6. Product & Marketplace Validation ──
exports.validateProduct = (req, res, next) => {
  const { name, price, category, stock } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    errors.push('Product name must be at least 2 characters');
  }

  if (price === undefined || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push('Product price must be a positive number');
  }

  if (!category || typeof category !== 'string' || !category.trim()) {
    errors.push('Product category is required');
  }

  if (stock !== undefined && (isNaN(parseInt(stock, 10)) || parseInt(stock, 10) < 0)) {
    errors.push('Stock count must be a non-negative integer');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      message: errors[0],
      errors,
    });
  }

  next();
};
