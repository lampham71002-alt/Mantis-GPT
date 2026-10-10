const fs = require('fs');

const har = JSON.parse(fs.readFileSync('Dashboard.har', 'utf8'));
const entries = har.log?.entries || [];

console.log(`Total entries in Dashboard.har: ${entries.length}`);

const summary = entries.map(e => {
  const req = e.request;
  const res = e.response;
  let responseData = null;
  if (res.content?.text) {
    try {
      responseData = JSON.parse(res.content.text);
    } catch (err) {
      responseData = res.content.text.slice(0, 150);
    }
  }
  return {
    method: req.method,
    url: req.url,
    status: res.status,
    postData: req.postData?.text ? req.postData.text.slice(0, 200) : null,
    responseSample: responseData
  };
});

fs.writeFileSync('reports/dashboard_har_summary.json', JSON.stringify(summary, null, 2));

console.log('\n--- UNIQUE API ENDPOINTS IN Dashboard.har ---');
const apiUrls = [...new Set(summary.map(s => s.url).filter(u => u.includes('api/routing/mantis') || u.includes('apiv2.gdesk.io')))];
apiUrls.forEach(u => console.log(' ->', u));
