require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { PDFParse } = require('pdf-parse');
const InjuryKnowledge = require('../models/InjuryKnowledge');

// Map PDF filenames to specific domains, body parts, and sports
const PDF_METADATA_MAP = {
  '01_general_sports_injuries.pdf': {
    category: 'General Sports Injuries & First Aid',
    bodyPart: 'General',
    sport: 'All',
    tags: ['first aid', 'rice', 'acute injury', 'sprain', 'strain', 'general', 'sports injury']
  },
  '02_ankle_injuries.pdf': {
    category: 'Ankle Sprains & Ligament Injuries',
    bodyPart: 'Ankle',
    sport: 'Football, Basketball, Running, Tennis',
    tags: ['ankle', 'sprain', 'inversion', 'foot', 'twisting', 'swelling', 'bruising', 'ligament']
  },
  '03_knee_injuries.pdf': {
    category: 'Knee & Ligament Injuries (ACL / Meniscus)',
    bodyPart: 'Knee',
    sport: 'Football, Basketball, Running, Tennis',
    tags: ['knee', 'acl', 'meniscus', 'patella', 'pop', 'popping', 'instability', 'giving way', 'swelling', 'locking']
  },
  '04_muscle_strains.pdf': {
    category: 'Muscle Strains & Tears',
    bodyPart: 'Hamstring, Thigh, Calf, Groin',
    sport: 'Football, Running, Cricket, Basketball',
    tags: ['muscle', 'strain', 'hamstring', 'quad', 'calf', 'groin', 'tear', 'pull', 'pulled muscle', 'soreness']
  },
  '05_shoulder_injuries.pdf': {
    category: 'Shoulder & Rotator Cuff Injuries',
    bodyPart: 'Shoulder',
    sport: 'Badminton, Cricket, Tennis, Swimming',
    tags: ['shoulder', 'rotator cuff', 'dislocation', 'impingement', 'overhead', 'smash', 'throw', 'throwing', 'arm']
  },
  '06_sports_concussion.pdf': {
    category: 'Sports Concussion & Head Trauma',
    bodyPart: 'Head',
    sport: 'Football, Basketball, Cricket, All',
    tags: ['concussion', 'head', 'dizzy', 'dizziness', 'headache', 'nausea', 'brain', 'loss of consciousness', 'memory', 'confusion']
  },
  '07_heat_illness.pdf': {
    category: 'Heat Illness & Heat Exhaustion',
    bodyPart: 'General',
    sport: 'Running, Football, Cricket, Tennis',
    tags: ['heat', 'heat illness', 'heat exhaustion', 'heat stroke', 'cramps', 'dizziness', 'sweating', 'temperature', 'hot']
  },
  '08_dehydration.pdf': {
    category: 'Dehydration & Fluid Balance in Sports',
    bodyPart: 'General',
    sport: 'All',
    tags: ['dehydration', 'fluids', 'water', 'electrolytes', 'thirst', 'dry mouth', 'fatigue', 'cramping', 'hydration']
  },
  '09_return_to_sport.pdf': {
    category: 'Return to Sport & Progressive Rehabilitation',
    bodyPart: 'General',
    sport: 'All',
    tags: ['return to sport', 'recovery', 'rehabilitation', 'rehab', 'timeline', 'recovery days', 'heal', 'when can i play', 'progress']
  },
  '10_injury_prevention.pdf': {
    category: 'Injury Prevention & Athletic Conditioning',
    bodyPart: 'General',
    sport: 'All',
    tags: ['prevention', 'warmup', 'warm up', 'stretching', 'cool down', 'mobility', 'strength', 'conditioning', 'gear']
  }
};

async function indexKnowledgePdfs() {
  try {
    console.log('🚀 Starting Knowledge PDF Indexing...');
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB:', mongoUri);

    const dir = path.join(__dirname, '../knowledge');
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
    console.log(`Found ${files.length} knowledge PDFs to index.`);

    // Clear previous index
    await InjuryKnowledge.deleteMany({});
    console.log('Cleared previous InjuryKnowledge collection.');

    const indexedEntries = [];

    for (const filename of files) {
      const filePath = path.join(dir, filename);
      const buffer = fs.readFileSync(filePath);
      const parser = new PDFParse(new Uint8Array(buffer));
      const parsed = await parser.getText();
      const rawText = parsed.text || '';

      const meta = PDF_METADATA_MAP[filename] || {
        category: filename.replace('.pdf', '').replace(/^\d+_/, '').replace(/_/g, ' '),
        bodyPart: 'General',
        sport: 'All',
        tags: []
      };

      // Clean lines and extract sections
      const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);
      const cleanContent = lines.filter(l => !l.includes('-- 1 of 1 --') && !l.includes('SportVerse AI — Curated')).join('\n');

      // Extract guidance points
      const guidance = [];
      const redFlags = [];

      lines.forEach(l => {
        if (l.toLowerCase().includes('severe') || l.toLowerCase().includes('deformity') || l.toLowerCase().includes('unconscious') || l.toLowerCase().includes('inability to bear weight')) {
          redFlags.push(l.replace(/^[•\-\*]\s*/, ''));
        } else if (l.startsWith('•') || l.startsWith('-') || l.startsWith('*')) {
          guidance.push(l.replace(/^[•\-\*]\s*/, ''));
        }
      });

      const entry = {
        sourceFile: filename,
        category: meta.category,
        bodyPart: meta.bodyPart,
        sport: meta.sport,
        content: cleanContent,
        tags: meta.tags,
        guidance: guidance.length > 0 ? guidance : ['Follow conservative management', 'Consult a healthcare professional for clinical diagnosis'],
        redFlags: redFlags.length > 0 ? redFlags : ['Severe pain or inability to function', 'Numbness or loss of sensation']
      };

      indexedEntries.push(entry);
    }

    const inserted = await InjuryKnowledge.insertMany(indexedEntries);
    console.log(`✅ Successfully indexed ${inserted.length} PDF knowledge documents into MongoDB!`);

    inserted.forEach(i => {
      console.log(`   - 📄 ${i.sourceFile} -> [${i.category}] (${i.bodyPart})`);
    });

    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error indexing PDFs:', err);
    process.exit(1);
  }
}

indexKnowledgePdfs();
