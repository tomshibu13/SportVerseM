const mongoose = require('mongoose');

const injuryKnowledgeSchema = new mongoose.Schema({
  sourceFile: { type: String, required: true },
  sport: { type: String, required: true },
  bodyPart: { type: String, required: true },
  category: { type: String, required: true },
  content: { type: String, required: true },
  tags: [{ type: String }],
  riskIndicators: [{ type: String }],
  guidance: [{ type: String }],
  redFlags: [{ type: String }],
}, { timestamps: true });

injuryKnowledgeSchema.index({ sport: 1, bodyPart: 1 });
injuryKnowledgeSchema.index({ tags: 1 });
injuryKnowledgeSchema.index({ sourceFile: 1 });
injuryKnowledgeSchema.index({ content: 'text', category: 'text', tags: 'text' });

module.exports = mongoose.model('InjuryKnowledge', injuryKnowledgeSchema);

