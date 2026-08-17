const http = require('http');

async function testRecovery() {
  const payload = JSON.stringify({
    message: 'how may days to recover it',
    history: [
      { text: 'I twisted my knee during football' },
      { text: 'Sports Injury Guidance for KNEE' }
    ]
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
      console.log('RESPONSE:');
      console.log(JSON.stringify(JSON.parse(data), null, 2));
    });
  });

  req.write(payload);
  req.end();
}

testRecovery();
