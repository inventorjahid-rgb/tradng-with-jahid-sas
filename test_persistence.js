const fs = require('fs');
const path = require('path');

const DB_FILE = path.resolve(process.cwd(), 'data', 'db.json');

try {
  console.log('Testing write to:', DB_FILE);
  fs.writeFileSync(DB_FILE, JSON.stringify({ test: 'data' }, null, 2), 'utf-8');
  console.log('Write successful');
  
  const content = fs.readFileSync(DB_FILE, 'utf-8');
  console.log('Read content:', content);
} catch (e) {
  console.error('Error:', e);
}
