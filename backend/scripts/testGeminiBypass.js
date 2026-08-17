const http = require('http');

const payload = JSON.stringify({
  message: 'Hello Gemini, reply with exactly: Gemini API is working.'
});

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
    console.log('STATUS:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('REPLY FROM BACKEND / GEMINI:');
    console.log(parsed.reply);
  });
});

req.write(payload);
req.end();
