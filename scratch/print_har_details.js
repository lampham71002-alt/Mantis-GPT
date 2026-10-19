const fs = require('fs');

const summary = JSON.parse(fs.readFileSync('reports/dashboard_har_summary.json', 'utf8'));

console.log('======================================================================');
console.log('   CHI TIẾT CÁC ENDPOINT & DỮ LIỆU TRẢ VỀ TRONG DASHBOARD.HAR');
console.log('======================================================================\n');

summary.forEach((item, idx) => {
  const urlParts = item.url.split('?');
  const endpoint = urlParts[0].replace('https://apiv2.gdesk.io', '');
  const query = urlParts[1] || '';
  console.log(`[${idx+1}] ${item.method} ${endpoint}`);
  console.log(`    Status: ${item.status} | Query: ${query}`);
  console.log(`    Response Data:`, JSON.stringify(item.responseSample));
  console.log('----------------------------------------------------------------------');
});
