require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const app = require('../src/app');
const Ground = require('../models/Ground');
const Product = require('../models/Product');
const Tournament = require('../models/Tournament');
const InjuryKnowledge = require('../models/InjuryKnowledge');

// Test Cases as specified in requirements
const TEST_CASES = [
  {
    id: 1,
    title: 'VENUE_SEARCH: Find badminton courts near me',
    message: 'Find badminton courts near me',
    expectedIntent: 'VENUE_SEARCH',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 2,
    title: 'BOOKING: Book a badminton court tomorrow at 6 PM',
    message: 'Book a badminton court tomorrow at 6 PM',
    expectedIntent: 'BOOKING',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 3,
    title: 'SPORTS_GEAR: Which badminton racket should I buy?',
    message: 'Which badminton racket should I buy?',
    expectedIntent: 'SPORTS_GEAR',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 4,
    title: 'TOURNAMENT: Find badminton tournaments',
    message: 'Find badminton tournaments',
    expectedIntent: 'TOURNAMENT',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 5,
    title: 'TEAM_FINDER: Find players for badminton',
    message: 'Find players for badminton',
    expectedIntent: 'TEAM_FINDER',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 6,
    title: 'TRAINING: Give me a badminton training plan',
    message: 'Give me a badminton training plan',
    expectedIntent: 'TRAINING',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: false
  },
  {
    id: 7,
    title: 'PERFORMANCE: Show my sports performance',
    message: 'Show my sports performance',
    expectedIntent: 'PERFORMANCE',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: true
  },
  {
    id: 8,
    title: 'INJURY_HEALTH: I twisted my ankle and it is swollen',
    message: 'I twisted my ankle and it is swollen',
    expectedIntent: 'INJURY_HEALTH',
    expectRiskNull: false, // MUST have riskLevel
    expectSourcesEmpty: false, // MUST have RAG sources
    expectDataPresent: true
  },
  {
    id: 9,
    title: 'MEDICATION: What exact medication and dosage should I take?',
    message: 'What exact medication and dosage should I take?',
    expectedIntent: 'MEDICATION',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: false
  },
  {
    id: 10,
    title: 'GENERAL_UNRELATED: What is the capital of Japan?',
    message: 'What is the capital of Japan?',
    expectedIntent: 'GENERAL_UNRELATED',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectDataPresent: false
  }
];

async function runTests() {
  console.log('════════════════════════════════════════════════════════════════════');
  console.log('🧪 RUNNING SPORTVERSE AI ASSISTANT FULL TEST SUITE');
  console.log('════════════════════════════════════════════════════════════════════\n');

  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  console.log('✅ Connected to MongoDB:', mongoUri);

  // Start HTTP test server
  const server = await new Promise((resolve) => {
    const s = app.listen(5099, '127.0.0.1', () => resolve(s));
  });
  const baseUrl = 'http://127.0.0.1:5099/api/ai/chat';

  let passedCount = 0;
  let failedCount = 0;

  for (const tc of TEST_CASES) {
    console.log(`\n────────────────────────────────────────────────────────────────────`);
    console.log(`▶ Test #${tc.id}: ${tc.title}`);
    console.log(`  User Prompt: "${tc.message}"`);

    try {
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: tc.message })
      });

      const data = await response.json();
      let testPassed = true;
      const failureReasons = [];

      // Check intent
      if (data.intent !== tc.expectedIntent) {
        testPassed = false;
        failureReasons.push(`Expected intent="${tc.expectedIntent}", got="${data.intent}"`);
      }

      // Check riskLevel
      if (tc.expectRiskNull && data.riskLevel !== null) {
        testPassed = false;
        failureReasons.push(`Expected riskLevel=null, got="${data.riskLevel}"`);
      } else if (!tc.expectRiskNull && (!data.riskLevel || data.riskLevel === 'NONE')) {
        testPassed = false;
        failureReasons.push(`Expected valid riskLevel, got="${data.riskLevel}"`);
      }

      // Check sources
      if (tc.expectSourcesEmpty && Array.isArray(data.sources) && data.sources.length > 0) {
        testPassed = false;
        failureReasons.push(`Expected sources=[], got=${data.sources.length} sources`);
      } else if (!tc.expectSourcesEmpty && (!Array.isArray(data.sources) || data.sources.length === 0)) {
        testPassed = false;
        failureReasons.push(`Expected RAG sources array, got empty or non-array`);
      }

      // Check data presence if expected
      if (tc.expectDataPresent && !data.data) {
        testPassed = false;
        failureReasons.push(`Expected structured 'data' object in response, got null/undefined`);
      }

      // Check specific assertions
      if (tc.expectedIntent === 'GENERAL_UNRELATED') {
        if (!data.reply.includes('SportVerse')) {
          testPassed = false;
          failureReasons.push('General unrelated reply did not contain SportVerse capability redirect');
        }
      }

      if (tc.expectedIntent === 'MEDICATION') {
        if (!data.reply.toLowerCase().includes('cannot recommend a specific medication') && !data.reply.toLowerCase().includes('healthcare professional')) {
          testPassed = false;
          failureReasons.push('Medication response did not contain doctor/pharmacist referral refusal');
        }
      }

      if (testPassed) {
        passedCount++;
        console.log(`  ✅ PASSED`);
        console.log(`  • Intent: ${data.intent}`);
        console.log(`  • RiskLevel: ${data.riskLevel}`);
        console.log(`  • Sources: ${JSON.stringify(data.sources?.map(s => s.sourceFile || s))}`);
        console.log(`  • Action: ${data.action || 'None'}`);
        console.log(`  • Reply Snippet: "${data.reply.substring(0, 100).replace(/\n/g, ' ')}..."`);
      } else {
        failedCount++;
        console.log(`  ❌ FAILED: ${failureReasons.join(' | ')}`);
        console.log(`  Received JSON:`, JSON.stringify(data, null, 2));
      }

    } catch (err) {
      failedCount++;
      console.log(`  ❌ EXCEPTION: ${err.message}`);
    }
  }

  server.close();
  await mongoose.disconnect();

  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`🏁 TEST SUMMARY: Total: ${TEST_CASES.length} | Passed: ${passedCount} | Failed: ${failedCount}`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
