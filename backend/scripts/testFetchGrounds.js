const http = require('http');

http.get('http://localhost:5000/api/grounds', res => {
  let data = '';
  res.on('data', c => data += c);
  res.on('end', () => {
    const parsed = JSON.parse(data);
    console.log(`Backend /api/grounds returned ${parsed.grounds?.length} grounds:`);
    parsed.grounds?.forEach(g => {
      console.log(`- "${g.title}" (${g.sport_type}) | Lat: ${g.latitude}, Lng: ${g.longitude} | Price: ₹${g.price_per_hour}/hr | Loc: ${g.location}`);
    });
  });
});
