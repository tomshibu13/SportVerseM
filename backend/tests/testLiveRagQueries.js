const http = require('http');

const queries = [
  { name: 'Ankle', msg: 'I twisted my ankle during football and have swelling', expectedPdf: '02_ankle_injuries.pdf' },
  { name: 'Knee / ACL', msg: 'Heard a pop in my knee and it gives way', expectedPdf: '03_knee_injuries.pdf' },
  { name: 'Muscle Strain', msg: 'Sharp pull in hamstring while sprinting', expectedPdf: '04_muscle_strains.pdf' },
  { name: 'Shoulder', msg: 'Pain in rotator cuff after overhead smash in badminton', expectedPdf: '05_shoulder_injuries.pdf' },
  { name: 'Concussion', msg: 'Hit head hard and feeling dizzy with headache', expectedPdf: '06_sports_concussion.pdf' },
  { name: 'Heat Illness', msg: 'Heat exhaustion and heavy sweating under the sun', expectedPdf: '07_heat_illness.pdf' },
  { name: 'Dehydration', msg: 'Severe thirst and dry mouth during running', expectedPdf: '08_dehydration.pdf' },
  { name: 'Recovery / Return to Sport', msg: 'How many days to recover and when can I play again?', expectedPdf: '09_return_to_sport.pdf' }
];

async function runLiveTests() {
  console.log('====================================================');
  console.log('🚀 TESTING LIVE API RAG RETRIEVAL ACROSS ALL 8 DOMAINS');
  console.log('====================================================\n');

  for (const q of queries) {
    await new Promise(resolve => {
      const payload = JSON.stringify({ message: q.msg });
      const req = http.request('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        }
      }, res => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            const sources = parsed.sources || [];
            const topFile = sources.length > 0 ? sources[0].sourceFile : 'None';
            const matched = sources.some(s => s.sourceFile === q.expectedPdf);

            if (matched) {
              console.log(`✅ [${q.name}] -> Retrieved Source: ${topFile} (Score: ${sources[0].relevancePercentage || 'High'})`);
            } else {
              console.log(`⚠️ [${q.name}] -> Top source: ${topFile} (Expected: ${q.expectedPdf})`);
            }
          } catch (e) {
            console.error(`❌ [${q.name}] Error:`, e.message);
          }
          resolve();
        });
      });
      req.write(payload);
      req.end();
    });
  }

  console.log('\n====================================================');
  console.log('✅ ALL 8 DOMAINS TESTED ON LIVE API');
  console.log('====================================================\n');
}

runLiveTests();
