const fs = require('fs');
const auth = JSON.parse(fs.readFileSync('reports/lam_pham_auth.json', 'utf8'));

async function inspect1581() {
  const urlLogs = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history/1581/logs';
  const resLogs = await fetch(urlLogs, {
    headers: { 'token': auth.token, 'gd-branch-id': auth.branchId }
  }).then(r => r.json());

  console.log('--- ALL JOBS IN HISTORY 1581 (Count: ' + (resLogs.data?.length || 0) + ') ---');
  if (Array.isArray(resLogs.data)) {
    resLogs.data.slice(0, 10).forEach((j, i) => {
      console.log(`[${i+1}] Job ID: ${j.item?.id} | Service: ${j.item?.name} | Customer: ${j.customer?.full_name?.trim()} | Tech: ${j.to?.user?.full_name} | Sched: ${j.to?.schedules?.[0]?.name} | Date: ${j.to?.start?.slice(0, 10)}`);
    });
  }
}
inspect1581().catch(console.error);
