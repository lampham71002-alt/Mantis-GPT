const fs = require('fs');
const har = JSON.parse(fs.readFileSync('delete.har', 'utf8'));
const entry = har.log.entries.find(e => e.request.method === 'DELETE' && e.request.url.includes('api/jobs'));
if (entry) {
  console.log('Method:', entry.request.method);
  console.log('URL:', entry.request.url);
  console.log('PostData:', JSON.stringify(entry.request.postData));
} else {
  console.log('Not found');
}
