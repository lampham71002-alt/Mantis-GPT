const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function cleanLeftovers() {
  const url = 'https://apiv2.gdesk.io/api/routing/mantis/specific-rules?limit=25';
  const res = await fetch(url, { headers: { token: auth.token, 'gd-branch-id': auth.branchId } }).then(r => r.json());
  let count = 0;
  for (const r of res.data || []) {
    if (r.status === 1) {
      console.log('Turning OFF rule:', r.id);
      await fetch(`https://apiv2.gdesk.io/api/routing/mantis/specific-rules/${r.id}/status`, {
        method: 'PUT',
        headers: { token: auth.token, 'gd-branch-id': auth.branchId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 0 })
      });
      count++;
    }
  }
  console.log('Cleaned up active specific rules count:', count);

  // Also check custom rules
  const cUrl = 'https://apiv2.gdesk.io/api/routing/mantis/custom-rules?limit=25';
  const cRes = await fetch(cUrl, { headers: { token: auth.token, 'gd-branch-id': auth.branchId } }).then(r => r.json());
  let cCount = 0;
  for (const r of cRes.data || []) {
    if (r.status === 1) {
      console.log('Turning OFF custom rule:', r.id);
      await fetch(`https://apiv2.gdesk.io/api/routing/mantis/custom-rules/${r.id}/status`, {
        method: 'PUT',
        headers: { token: auth.token, 'gd-branch-id': auth.branchId, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 0 })
      });
      cCount++;
    }
  }
  console.log('Cleaned up active custom rules count:', cCount);
}
cleanLeftovers().catch(console.error);
