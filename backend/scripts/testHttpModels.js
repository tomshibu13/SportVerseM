require('dotenv').config({ path: __dirname + '/../.env' });
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;
const candidateModels = ['gemini-2.5-flash-lite', 'gemini-3.5-flash', 'gemini-3.7-flash', 'gemini-3.1-flash-lite'];

async function testHttpModels() {
  for (const m of candidateModels) {
    await new Promise(resolve => {
      const postData = JSON.stringify({
        contents: [{ parts: [{ text: 'Say "Working!"' }] }]
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/${m}:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, res => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 200) {
            console.log(`✅ SUCCESS with model ${m}! Status: 200`);
            try {
              const parsed = JSON.parse(body);
              console.log('Response:', parsed.candidates[0].content.parts[0].text);
            } catch (_) {}
          } else {
            console.log(`❌ ${m} -> Status ${res.statusCode}:`, body.substring(0, 150));
          }
          resolve();
        });
      });

      req.on('error', e => {
        console.error(`Error on ${m}:`, e.message);
        resolve();
      });

      req.write(postData);
      req.end();
    });
  }
}

testHttpModels();
