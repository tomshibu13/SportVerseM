require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const { retrieveRelevantKnowledge } = require('../utils/injuryRag');

async function testPdfRagRouting() {
  console.log('====================================================');
  console.log('🧪 TESTING PDF RAG RETRIEVAL & SOURCE ATTRIBUTION');
  console.log('====================================================\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);

  const testCases = [
    {
      name: '1. Ankle Question',
      input: { query: 'I rolled my ankle while playing football and it has swelling', bodyPart: 'Ankle' },
      expectedPdf: '02_ankle_injuries.pdf'
    },
    {
      name: '2. Knee / ACL Question',
      input: { query: 'Heard a loud pop in my knee during a sudden stop, feels unstable', bodyPart: 'Knee' },
      expectedPdf: '03_knee_injuries.pdf'
    },
    {
      name: '3. Muscle Strain Question',
      input: { query: 'Felt a sharp pull and sudden tightness in my hamstring while sprinting', bodyPart: 'Hamstring' },
      expectedPdf: '04_muscle_strains.pdf'
    },
    {
      name: '4. Shoulder Injury Question',
      input: { query: 'Deep ache in rotator cuff and shoulder after smashing in badminton', bodyPart: 'Shoulder' },
      expectedPdf: '05_shoulder_injuries.pdf'
    },
    {
      name: '5. Concussion Question',
      input: { query: 'Took a hard blow to the head, feeling dizzy, headache and light sensitive', bodyPart: 'Head' },
      expectedPdf: '06_sports_concussion.pdf'
    },
    {
      name: '6. Heat Illness Question',
      input: { query: 'Experiencing heavy sweating, dizziness and heat exhaustion under hot sun', bodyPart: 'General' },
      expectedPdf: '07_heat_illness.pdf'
    },
    {
      name: '7. Dehydration Question',
      input: { query: 'Severe thirst, muscle cramps, and dry mouth due to dehydration during marathon', bodyPart: 'General' },
      expectedPdf: '08_dehydration.pdf'
    },
    {
      name: '8. Recovery / Return to Sport Question',
      input: { query: 'How many days for progressive recovery and when can I return to play?', bodyPart: 'General' },
      expectedPdf: '09_return_to_sport.pdf'
    },
    {
      name: '9. Unrelated Question (No Knowledge Found)',
      input: { query: 'Can you tell me how quantum computing works and stock market trends?', bodyPart: 'General' },
      expectedNone: true
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    const result = await retrieveRelevantKnowledge(tc.input);

    if (tc.expectedNone) {
      if (result.noKnowledgeFound === true || result.sources.length === 0) {
        console.log(`✅ [PASS] ${tc.name} -> Successfully recognized no relevant injury knowledge`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${tc.name} -> Expected no knowledge, but got:`, result.sources.map(s => s.sourceFile));
        failed++;
      }
    } else {
      const topSource = result.sources.length > 0 ? result.sources[0].sourceFile : null;
      const matchedExpected = result.sources.some(s => s.sourceFile === tc.expectedPdf);

      if (matchedExpected) {
        console.log(`✅ [PASS] ${tc.name} -> Retrieved: ${topSource} (Score: ${result.sources[0].relevancePercentage})`);
        passed++;
      } else {
        console.error(`❌ [FAIL] ${tc.name} -> Expected ${tc.expectedPdf}, but got: ${topSource}`);
        failed++;
      }
    }
  }

  console.log('\n====================================================');
  console.log(`📊 TEST RESULTS: ${passed}/${testCases.length} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  await mongoose.disconnect();
  if (failed > 0) process.exit(1);
  process.exit(0);
}

testPdfRagRouting();
