require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const app = require('../src/app');
const http = require('http');

async function testEndpoints() {
  console.log('Testing Express API endpoints directly...');
  const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sportverse';
  await mongoose.connect(mongoUri);

  const server = http.createServer(app);
  await new Promise(r => server.listen(5099, r));
  console.log('Test server listening on port 5099');

  const testPayload = {
    message: "My knee made a clicking sound and hurts after playing badminton"
  };

  const res = await fetch('http://127.0.0.1:5099/api/ai/injury-assistant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testPayload)
  });

  const data = await res.json();
  console.log('\n--- /api/ai/injury-assistant Response ---');
  console.log('Status:', res.status);
  console.log('Success:', data.success);
  console.log('Retrieved:', data.retrieved);
  console.log('Sources Count:', data.sources ? data.sources.length : 0);
  if (data.sources && data.sources.length > 0) {
    console.log('Sources:', data.sources.map(s => `${s.sourceFile} (${s.relevancePercentage})`).join(', '));
  }
  console.log('Disclaimer Present:', !!data.disclaimer);
  console.log('Risk Level:', data.riskLevel);
  console.log('Answer Preview:\n', data.answer ? data.answer.substring(0, 200) + '...' : 'No answer');

  server.close();
  await mongoose.disconnect();
  console.log('\n✅ Endpoint Test Completed Successfully');
  process.exit(0);
}

testEndpoints().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
