const mongoose = require('mongoose');

const checkInSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  painLevel: { type: Number, min: 0, max: 10 },
  mobilityStatus: { type: String, enum: ['Full', 'Partial', 'Minimal', 'None'] },
  notes: { type: String, default: '' }
}, { _id: true });

const chatMessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'] },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: true });

const injuryReportSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.Mixed, required: true },
  // Assessment inputs
  sport: { type: String, required: true },
  bodyPart: { type: String, required: true },
  injuryMechanism: { type: String, required: true },
  symptoms: [{ type: String }],
  painLevel: { type: Number, min: 0, max: 10, required: true },
  hasSwelling: { type: Boolean, default: false },
  mobilityStatus: { type: String, enum: ['Full', 'Partial', 'Minimal', 'None'] },
  hasPreviousInjury: { type: Boolean, default: false },
  painDurationDays: { type: Number, default: 0 },
  imageBase64: { type: String, default: '' }, // optional multimodal
  // AI result
  riskLevel: { type: String, enum: ['LOW', 'MODERATE', 'HIGH', 'URGENT'], default: 'LOW' },
  responseType: { type: String, enum: ['NORMAL', 'MEDICATION_REFUSAL', 'URGENT_SAFETY'], default: 'NORMAL' },
  possibleCategories: [{ type: String }],
  generalGuidance: [{ type: String }],
  thingsToAvoid: [{ type: String }],
  warningSigns: [{ type: String }],
  professionalCareRecommended: { type: Boolean, default: false },
  followUpQuestions: [{ type: String }],
  aiSummary: { type: String, default: '' },
  sources: [{ type: mongoose.Schema.Types.Mixed }],
  disclaimer: { type: String, default: 'SportVerse AI provides general sports-health information and does not provide medical diagnosis or personalized medication advice.' },
  // Follow-up chat history
  chatHistory: [chatMessageSchema],
  // Recovery tracking
  checkIns: [checkInSchema],
  // Metadata
  isGeminiUsed: { type: Boolean, default: false },
  geminiError: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('InjuryReport', injuryReportSchema);
