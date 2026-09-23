const mongoose = require('mongoose');

const chunkSchema = new mongoose.Schema({
  chunkId: { type: String, required: true },
  title: { type: String, required: true },
  section: { type: String, default: 'General' },
  text: { type: String, required: true },
  embedding: [{ type: Number }], // 3072-dimensional vector embedding
}, { _id: false });

const injuryKnowledgeSchema = new mongoose.Schema({
  injuryName: { type: String, required: true },
  category: { type: String, required: true },
  bodyPart: { type: String, required: true },
  sport: [{ type: String }],
  symptoms: [{ type: String }],
  causes: [{ type: String }],
  immediateCare: [{ type: String }],
  recoveryGuidance: [{ type: String }],
  prevention: [{ type: String }],
  warningSigns: [{ type: String }],
  whenToSeekDoctor: [{ type: String }],
  source: { type: String, required: true },
  sourceFile: { type: String, required: true },
  sourceUrl: { type: String, default: '' },
  version: { type: String, default: '1.0.0' },
  contentVersionDate: { type: Date, default: Date.now },
  content: { type: String, required: true },
  tags: [{ type: String }],
  chunks: [chunkSchema],
  documentEmbedding: [{ type: Number }], // Vector embedding for whole document
}, { timestamps: true });

injuryKnowledgeSchema.index({ sport: 1, bodyPart: 1 });
injuryKnowledgeSchema.index({ tags: 1 });
injuryKnowledgeSchema.index({ sourceFile: 1 });
injuryKnowledgeSchema.index({ injuryName: 1 });
injuryKnowledgeSchema.index({ content: 'text', category: 'text', tags: 'text', injuryName: 'text' });

module.exports = mongoose.model('InjuryKnowledge', injuryKnowledgeSchema);
