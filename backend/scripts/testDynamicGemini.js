const http = require('http');

async function testDynamicGemini() {
  const prompts = [
    'Hello! Tell me a fun sports fact in 1 sentence.',
    'What should I eat before playing a football match in Kerala hot weather?',
    'What badminton courts do you have available?'
  ];

  for (const p of prompts) {
    await new Promise(resolve => {
      const payload = JSON.stringify({ message: p });
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
          const parsed = JSON.parse(data);
          console.log(`\n========================================`);
          console.log(`PROMPT: "${p}"`);
          console.log(`DYNAMIC RESPONSE FROM GEMINI:`);
          console.log(parsed.reply);
          resolve();
        });
      });
      req.write(payload);
      req.end();
    });
  }
}

testDynamicGemini();
