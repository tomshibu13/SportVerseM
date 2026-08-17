const http = require('http');

const testCases = [
  {
    name: '1. Hello Gemini Test',
    msg: 'Hello Gemini, reply exactly: Gemini API is working.',
    expectedIntent: 'GENERAL',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectedKeyword: 'Gemini API is working'
  },
  {
    name: '2. Capital of Japan Test',
    msg: 'What is the capital of Japan?',
    expectedIntent: 'GENERAL',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectedKeyword: 'Tokyo'
  },
  {
    name: '3. Badminton Joke Test',
    msg: 'Tell me a joke about badminton.',
    expectedIntent: ['SPORTS', 'GENERAL'],
    expectRiskNull: true,
    expectSourcesEmpty: true
  },
  {
    name: '4. Ankle Injury Test',
    msg: 'I twisted my ankle while playing badminton and it is swollen.',
    expectedIntent: 'INJURY_HEALTH',
    expectRiskNull: false,
    expectedPdf: '02_ankle_injuries.pdf'
  },
  {
    name: '5. Concussion / Head Hit Test',
    msg: 'I hit my head playing football and now I feel dizzy.',
    expectedIntent: 'INJURY_HEALTH',
    expectRiskNull: false,
    expectedPdf: '06_sports_concussion.pdf'
  },
  {
    name: '6. Medication / Dosage Request Test',
    msg: 'What exact medication and dosage should I take for my ACL injury?',
    expectedIntent: 'MEDICATION',
    expectRiskNull: true,
    expectSourcesEmpty: true,
    expectedResponseType: 'MEDICATION_REFUSAL'
  },
  {
    name: '7. Ankle Recovery Timeline Test',
    msg: 'How long does an ankle sprain usually take to recover?',
    expectedIntent: 'INJURY_HEALTH',
    expectRiskNull: false
  }
];

function sendChat(message) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ message });
    const req = http.request('http://localhost:5000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, res => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          reject(e);
        }
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('================================================================');
  console.log('🧪 VERIFYING SPORTVERSE AI INTENT ROUTER PIPELINE (7 SCENARIOS)');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await sendChat(tc.msg);
      const resData = res.data;
      const intent = resData.intent;
      const riskLevel = resData.riskLevel;
      const sources = resData.sources || [];
      const reply = resData.reply || '';

      console.log(`----------------------------------------------------------------`);
      console.log(`📋 Test: ${tc.name}`);
      console.log(`   Message: "${tc.msg}"`);
      console.log(`   Detected Intent: "${intent}" | RiskLevel: ${riskLevel} | Sources: [${sources.map(s => s.sourceFile).join(', ')}]`);
      console.log(`   Reply Preview: "${reply.substring(0, 100).replace(/\n/g, ' ')}..."`);

      let testPass = true;

      // Check Intent
      if (Array.isArray(tc.expectedIntent)) {
        if (!tc.expectedIntent.includes(intent)) {
          console.error(`   ❌ Failed: Expected Intent in [${tc.expectedIntent.join(', ')}], but got "${intent}"`);
          testPass = false;
        }
      } else if (intent !== tc.expectedIntent) {
        console.error(`   ❌ Failed: Expected Intent "${tc.expectedIntent}", but got "${intent}"`);
        testPass = false;
      }

      // Check Risk Level
      if (tc.expectRiskNull && riskLevel !== null) {
        console.error(`   ❌ Failed: Expected riskLevel to be null, but got "${riskLevel}"`);
        testPass = false;
      } else if (!tc.expectRiskNull && riskLevel === null) {
        console.error(`   ❌ Failed: Expected non-null riskLevel, but got null`);
        testPass = false;
      }

      // Check Sources
      if (tc.expectSourcesEmpty && sources.length > 0) {
        console.error(`   ❌ Failed: Expected sources to be empty, but got [${sources.map(s => s.sourceFile).join(', ')}]`);
        testPass = false;
      }
      if (tc.expectedPdf && !sources.some(s => s.sourceFile === tc.expectedPdf)) {
        console.error(`   ❌ Failed: Expected source "${tc.expectedPdf}", but got [${sources.map(s => s.sourceFile).join(', ')}]`);
        testPass = false;
      }

      // Check Response Type
      if (tc.expectedResponseType && resData.responseType !== tc.expectedResponseType) {
        console.error(`   ❌ Failed: Expected responseType "${tc.expectedResponseType}", but got "${resData.responseType}"`);
        testPass = false;
      }

      // Check Keyword in reply
      if (tc.expectedKeyword && !reply.toLowerCase().includes(tc.expectedKeyword.toLowerCase())) {
        console.error(`   ❌ Failed: Expected reply to contain "${tc.expectedKeyword}"`);
        testPass = false;
      }

      if (testPass) {
        console.log(`   ✅ PASS`);
        passed++;
      } else {
        failed++;
      }

    } catch (err) {
      console.error(`   ❌ Exception in ${tc.name}:`, err.message);
      failed++;
    }
  }

  console.log('\n================================================================');
  console.log(`📊 FINAL RESULT: ${passed}/${testCases.length} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTests();
