const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function inspectAll1582Jobs() {
  const urlLogs = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history/1582/logs';
  const resLogs = await fetch(urlLogs, {
    headers: { 'token': auth.token, 'gd-branch-id': auth.branchId }
  }).then(r => r.json());

  console.log('--- ALL JOBS IN HISTORY 1582 (Branch: ' + auth.branchId + ') ---');
  if (Array.isArray(resLogs.data)) {
    resLogs.data.forEach((j, i) => {
      console.log(`[${i+1}] Job ID: ${j.item?.id} | Service: ${j.item?.name} | Customer: ${j.customer?.full_name?.trim()} (ID: ${j.customer?.id}) | Tech: ${j.to?.user?.full_name} | Sched: ${j.to?.schedules?.[0]?.name} (ID: ${j.to?.schedules?.[0]?.id}) | Date: ${j.to?.start?.slice(0, 10)} | Time: ${j.to?.start?.slice(11, 16)}`);
    });
  }
}
inspectAll1582Jobs().catch(console.error);
