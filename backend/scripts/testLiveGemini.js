const http = require('http');

const payload = JSON.stringify({
  message: 'I twisted my knee during football, heard a mild click and have slight swelling'
});

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
    console.log('STATUS:', res.statusCode);
    const parsed = JSON.parse(data);
    console.log('\n--- LIVE AI REPLY ---');
    console.log(parsed.reply);
    console.log('\n--- SOURCES ---');
    console.log(parsed.sources);
  });
});

req.write(payload);
req.end();
