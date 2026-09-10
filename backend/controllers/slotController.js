const mongoose = require('mongoose');
const Slot = require('../models/Slot');
const Ground = require('../models/Ground');
const Booking = require('../models/Booking');

const isObjectIdString = (val) => typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val.trim());

// Helper: Parse time string into minutes since midnight for chronological sorting
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const clean = timeStr.split('-')[0].trim();
  const match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (!match) return 0;
  let hour = parseInt(match[1], 10);
  const minute = parseInt(match[2], 10);
  const ampm = match[3] ? match[3].toUpperCase() : null;
  if (ampm === 'PM' && hour < 12) hour += 12;
  if (ampm === 'AM' && hour === 12) hour = 0;
  return hour * 60 + minute;
};

// Helper: Check if slot start time has already passed for today
const isSlotExpired = (dateStr, startTimeStr) => {
  if (!dateStr || !startTimeStr) return false;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // Same day: parse start_time (e.g., '06:00 AM', '6:00 AM', '18:00', '06:00 PM')
  try {
    const timeClean = startTimeStr.split('-')[0].trim();
    const match = timeClean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return false;

    let hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);
    const ampm = match[3] ? match[3].toUpperCase() : null;

    if (ampm === 'PM' && hour < 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute);
    return slotDateTime <= now;
  } catch (_) {
    return false;
  }
};

// Helper: Standard time slots generator for a single day & court
const generateDailyDefaultSlots = (groundDoc, dateStr, courtName) => {
  const basePrice = groundDoc.price_per_hour > 0 ? groundDoc.price_per_hour : 500;
  const court = courtName || 'Court 1';
  const groundId = groundDoc.ground_id || groundDoc._id;
  const groundObjId = groundDoc._id;

  const standardSchedule = [
    { start: '06:00 AM', end: '07:00 AM', multiplier: 1.0 },
    { start: '07:00 AM', end: '08:00 AM', multiplier: 1.0 },
    { start: '08:00 AM', end: '09:00 AM', multiplier: 1.0 },
    { start: '09:00 AM', end: '10:00 AM', multiplier: 1.0 },
    { start: '10:00 AM', end: '11:00 AM', multiplier: 1.0 },
    { start: '11:00 AM', end: '12:00 PM', multiplier: 1.0 },
    { start: '12:00 PM', end: '01:00 PM', multiplier: 1.0 },
    { start: '03:00 PM', end: '04:00 PM', multiplier: 1.0 },
    { start: '04:00 PM', end: '05:00 PM', multiplier: 1.0 },
    { start: '05:00 PM', end: '06:00 PM', multiplier: 1.15 },
    { start: '06:00 PM', end: '07:00 PM', multiplier: 1.25 },
    { start: '07:00 PM', end: '08:00 PM', multiplier: 1.25 },
    { start: '08:00 PM', end: '09:00 PM', multiplier: 1.25 },
    { start: '09:00 PM', end: '10:00 PM', multiplier: 1.15 },
    { start: '10:00 PM', end: '11:00 PM', multiplier: 1.0 },
  ];

  return standardSchedule.map((s) => ({
    ground_id: groundId,
    ground: groundObjId,
    court_id: court,
    date: dateStr,
    start_time: s.start,
    end_time: s.end,
    slot_time: `${s.start} - ${s.end}`,
    price: Math.round(basePrice * s.multiplier),
    status: isSlotExpired(dateStr, s.start) ? 'Expired' : 'Available',
  }));
};

// Helper: Auto-seed slots for ground on target date if 0 exist
const autoSeedSlotsForGroundDate = async (groundDoc, dateStr) => {
  if (!groundDoc || !dateStr) return [];

  const groundId = groundDoc.ground_id || groundDoc._id;
  const existingCount = await Slot.countDocuments({
    $or: [
      { ground_id: groundId, date: dateStr },
      { ground: groundDoc._id, date: dateStr },
    ],
  });

  if (existingCount > 0) return [];

  const courts = ['Court 1'];
  const slotsToInsert = [];

  for (const c of courts) {
    const slots = generateDailyDefaultSlots(groundDoc, dateStr, c);
    slotsToInsert.push(...slots);
  }

  try {
    return await Slot.insertMany(slotsToInsert, { ordered: false });
  } catch (err) {
    // Ignore duplicate key errors if inserted concurrently
    return [];
  }
};

// @desc    Get slots for a ground on a specific date (and optional court)
// @route   GET /api/slots
// @access  Public
exports.getSlots = async (req, res) => {
  try {
    const { ground_id, date, court_id, status } = req.query;

    if (!ground_id) {
      return res.status(400).json({ success: false, message: 'ground_id is required' });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const targetDate = date || todayStr;

    // 1. Look up the Ground document
    let groundDoc = null;
    if (isObjectIdString(String(ground_id))) {
      groundDoc = await Ground.findById(ground_id);
    }
    if (!groundDoc) {
      const numId = parseInt(ground_id, 10);
      if (!isNaN(numId)) {
        groundDoc = await Ground.findOne({ ground_id: numId });
      }
    }
    if (!groundDoc) {
      groundDoc = await Ground.findOne({
        $or: [{ ground_id: ground_id }, { title: new RegExp(`^${String(ground_id).trim()}$`, 'i') }],
      });
    }

    if (!groundDoc) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }

    // 2. Auto-seed slots for this date if this ground has no slots yet
    await autoSeedSlotsForGroundDate(groundDoc, targetDate);

    // 3. Build query for slots
    const groundIds = [groundDoc._id, groundDoc.ground_id, String(groundDoc.ground_id), String(groundDoc._id)].filter(
      Boolean
    );

    const query = {
      $or: [{ ground: groundDoc._id }, { ground_id: { $in: groundIds } }],
      date: targetDate,
    };

    if (court_id && court_id !== 'All') {
      query.court_id = court_id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    const slots = await Slot.find(query).sort({ start_time: 1, court_id: 1 });

    // 4. Fetch active bookings for this ground on this date to verify live status
    const activeBookings = await Booking.find({
      $or: [
        { ground: groundDoc._id },
        { ground_id: { $in: groundIds } },
        { ground_name: new RegExp(`^${groundDoc.title.trim()}$`, 'i') },
      ],
      date: targetDate,
      booking_status: { $nin: ['Cancelled', 'Refunded'] },
    }).select('booking_id slot_time user_name');

    const bookedTimes = new Set();
    activeBookings.forEach((b) => {
      if (b.slot_time) {
        b.slot_time.split(',').forEach((s) => bookedTimes.add(s.trim()));
      }
    });

    // 5. Dynamic slot status formatting
    const formattedSlots = slots.map((s) => {
      const slotObj = s.toObject();
      const isBooked = bookedTimes.has(s.slot_time) || s.status === 'Booked';

      if (isBooked) {
        slotObj.status = 'Booked';
        slotObj.is_booked = true;
      } else if (s.status === 'Blocked') {
        slotObj.status = 'Blocked';
        slotObj.is_booked = false;
      } else if (isSlotExpired(targetDate, s.start_time)) {
        slotObj.status = 'Expired';
        slotObj.is_booked = false;
      } else {
        slotObj.status = 'Available';
        slotObj.is_booked = false;
      }

      return slotObj;
    });

    // Sort formatted slots chronologically from morning to night
    formattedSlots.sort((a, b) => {
      const diff = parseTimeToMinutes(a.start_time) - parseTimeToMinutes(b.start_time);
      if (diff !== 0) return diff;
      return (a.court_id || '').localeCompare(b.court_id || '');
    });

    // 6. Get distinct courts for this ground & date
    const courts = Array.from(new Set(slots.map((s) => s.court_id).filter(Boolean)));
    if (courts.length === 0) courts.push('Court 1');

    return res.status(200).json({
      success: true,
      ground_id: groundDoc.ground_id || groundDoc._id,
      ground_name: groundDoc.title,
      date: targetDate,
      count: formattedSlots.length,
      courts,
      slots: formattedSlots,
    });
  } catch (error) {
    console.error('❌ getSlots Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a custom slot (Ground Owner / Admin)
// @route   POST /api/slots
// @access  Private (GroundOwner, Admin)
exports.createSlot = async (req, res) => {
  try {
    const { ground_id, court_id, date, start_time, end_time, price, status } = req.body;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (!ground_id || !date || !start_time || !end_time || price === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ground_id, date, start_time, end_time, price',
      });
    }

    // Look up ground and verify ownership
    let groundDoc = null;
    if (isObjectIdString(String(ground_id))) groundDoc = await Ground.findById(ground_id);
    if (!groundDoc) {
      const numId = parseInt(ground_id, 10);
      if (!isNaN(numId)) groundDoc = await Ground.findOne({ ground_id: numId });
    }
    if (!groundDoc) groundDoc = await Ground.findOne({ ground_id: ground_id });

    if (!groundDoc) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }

    const groundOwnerId = (groundDoc.owner_id || '').toString();
    if (requesterRole !== 'Admin' && requesterId !== groundOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only create slots for facilities you own',
      });
    }

    const slot_time = `${start_time.trim()} - ${end_time.trim()}`;
    const court = (court_id || 'Court 1').trim();

    // Check for existing slot
    const existing = await Slot.findOne({
      $or: [{ ground: groundDoc._id }, { ground_id: groundDoc.ground_id }],
      date: date.trim(),
      court_id: court,
      slot_time,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A slot for ${slot_time} on ${date} (${court}) already exists`,
      });
    }

    const newSlot = await Slot.create({
      ground_id: groundDoc.ground_id || groundDoc._id,
      ground: groundDoc._id,
      court_id: court,
      date: date.trim(),
      start_time: start_time.trim(),
      end_time: end_time.trim(),
      slot_time,
      price: Number(price),
      status: status || 'Available',
    });

    return res.status(201).json({
      success: true,
      message: 'Slot created successfully',
      slot: newSlot,
    });
  } catch (error) {
    console.error('❌ createSlot Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Bulk generate slots for a ground across a date range and courts
// @route   POST /api/slots/generate
// @access  Private (GroundOwner, Admin)
exports.generateSlots = async (req, res) => {
  try {
    const { ground_id, start_date, end_date, courts, price } = req.body;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    if (!ground_id) {
      return res.status(400).json({ success: false, message: 'ground_id is required' });
    }

    let groundDoc = null;
    if (isObjectIdString(String(ground_id))) groundDoc = await Ground.findById(ground_id);
    if (!groundDoc) {
      const numId = parseInt(ground_id, 10);
      if (!isNaN(numId)) groundDoc = await Ground.findOne({ ground_id: numId });
    }
    if (!groundDoc) groundDoc = await Ground.findOne({ ground_id });

    if (!groundDoc) {
      return res.status(404).json({ success: false, message: 'Ground not found' });
    }

    const groundOwnerId = (groundDoc.owner_id || '').toString();
    if (requesterRole !== 'Admin' && requesterId !== groundOwnerId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only generate slots for facilities you own',
      });
    }

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const startDateStr = start_date || todayStr;

    // Generate for next 7 days if no end_date specified
    let endDateStr = end_date;
    if (!endDateStr) {
      const d = new Date(startDateStr);
      d.setDate(d.getDate() + 6);
      endDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }

    const courtList = Array.isArray(courts) && courts.length > 0 ? courts : ['Court 1'];
    const generatedSlots = [];

    const startObj = new Date(startDateStr);
    const endObj = new Date(endDateStr);

    for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      for (const court of courtList) {
        const slots = generateDailyDefaultSlots(groundDoc, dateStr, court);
        if (price) {
          slots.forEach((s) => (s.price = Number(price)));
        }
        generatedSlots.push(...slots);
      }
    }

    // Insert only non-duplicate slots using upsert or insertMany with ordered: false
    let insertedCount = 0;
    for (const s of generatedSlots) {
      try {
        await Slot.updateOne(
          {
            $or: [{ ground: groundDoc._id }, { ground_id: groundDoc.ground_id }],
            date: s.date,
            court_id: s.court_id,
            slot_time: s.slot_time,
          },
          { $setOnInsert: s },
          { upsert: true }
        );
        insertedCount++;
      } catch (_) {}
    }

    return res.status(200).json({
      success: true,
      message: `Generated slots successfully from ${startDateStr} to ${endDateStr}`,
      insertedCount,
      ground_id: groundDoc.ground_id || groundDoc._id,
    });
  } catch (error) {
    console.error('❌ generateSlots Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a slot (Price or Status: Available <-> Blocked)
// @route   PUT /api/slots/:id
// @access  Private (GroundOwner, Admin)
exports.updateSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const { price, status, court_id, start_time, end_time } = req.body;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    // Check ownership of ground
    const ground = await Ground.findById(slot.ground) || await Ground.findOne({ ground_id: slot.ground_id });
    if (ground) {
      const ownerId = (ground.owner_id || '').toString();
      if (requesterRole !== 'Admin' && requesterId !== ownerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this facility',
        });
      }
    }

    if (slot.status === 'Booked' && status && status !== 'Booked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of an actively booked slot. Please cancel the booking first.',
      });
    }

    if (price !== undefined) slot.price = Number(price);
    if (status && ['Available', 'Blocked', 'Booked'].includes(status)) slot.status = status;
    if (court_id) slot.court_id = court_id;
    if (start_time && end_time) {
      slot.start_time = start_time;
      slot.end_time = end_time;
      slot.slot_time = `${start_time} - ${end_time}`;
    }

    await slot.save();

    return res.status(200).json({
      success: true,
      message: 'Slot updated successfully',
      slot,
    });
  } catch (error) {
    console.error('❌ updateSlot Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a slot
// @route   DELETE /api/slots/:id
// @access  Private (GroundOwner, Admin)
exports.deleteSlot = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterId = req.user?.userId?.toString();
    const requesterRole = req.user?.role;

    const slot = await Slot.findById(id);
    if (!slot) {
      return res.status(404).json({ success: false, message: 'Slot not found' });
    }

    if (slot.status === 'Booked') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a slot with an active booking.',
      });
    }

    const ground = await Ground.findById(slot.ground) || await Ground.findOne({ ground_id: slot.ground_id });
    if (ground) {
      const ownerId = (ground.owner_id || '').toString();
      if (requesterRole !== 'Admin' && requesterId !== ownerId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You do not own this facility',
        });
      }
    }

    await Slot.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Slot deleted successfully',
    });
  } catch (error) {
    console.error('❌ deleteSlot Error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
