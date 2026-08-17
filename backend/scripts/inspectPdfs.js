const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

async function checkPdfs() {
  const dir = path.join(__dirname, '../knowledge');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.pdf'));
  console.log(`Found ${files.length} PDFs:`, files);

  for (const file of files) {
    const filePath = path.join(dir, file);
    try {
      const buffer = fs.readFileSync(filePath);
      const data = await pdfParse(buffer);
      console.log(`\n========================================`);
      console.log(`📄 FILE: ${file} (Pages: ${data.numpages}, Text Length: ${data.text.length})`);
      console.log(`--- PREVIEW (First 250 chars) ---`);
      console.log(data.text.substring(0, 250).trim());
    } catch (err) {
      console.error(`Error reading ${file}:`, err.message);
    }
  }
}

checkPdfs();
