require('dotenv').config({ path: __dirname + '/../.env' });
const https = require('https');

const apiKey = process.env.GEMINI_API_KEY;

https.get(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.models) {
        console.log('Available models for your API key:');
        parsed.models.forEach(m => {
          if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
            console.log(`- ${m.name} (${m.displayName})`);
          }
        });
      } else {
        console.log('API Response:', JSON.stringify(parsed, null, 2));
      }
    } catch (e) {
      console.error('Error parsing response:', e.message);
    }
  });
}).on('error', err => console.error('Request error:', err.message));
