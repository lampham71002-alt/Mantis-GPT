const { chromium } = require('playwright');
const fs = require('fs');

async function findHistory1643() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  let token = '';
  page.on('request', r => { if (r.headers()['token']) token = r.headers()['token']; });

  await page.goto('https://r2.gdesk.io/auth/login', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForSelector('input', { timeout: 30000 });
  const inputs = await page.locator('input').all();
  await inputs[0].fill('lam.pham@gmail.com');
  await inputs[1].fill('Ahihi123');
  await inputs[1].press('Enter');
  await page.waitForTimeout(6000);

  const res = await page.evaluate(async (tok) => {
    const url = 'https://apiv2.gdesk.io/api/routing/mantis/feeds/history?start=2026-10-01T00:00:00%2B00:00&end=2026-10-31T23:59:59%2B00:00&limit=30';
    const r = await fetch(url, {
      headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
    });
    return await r.json();
  }, token);

  console.log('--- RECENT HISTORY RUNS ---');
  let targetHistory = null;
  if (res.data) {
    res.data.forEach((h, idx) => {
      console.log(`[${idx+1}] ID: ${h.id} | Date: ${h.created_at} | Mode: ${h.mode} | Jobs: ${h.jobs_count || h.total_jobs} | Status: ${h.status}`);
      // Check if around 09:43 UTC
      if (h.created_at && (h.created_at.includes('09:43') || h.created_at.includes('09:42') || h.created_at.includes('09:44'))) {
        targetHistory = h;
      }
    });
  }

  if (targetHistory || (res.data && res.data.length > 0)) {
    const chosen = targetHistory || res.data[0];
    console.log(`\nTarget History identified: ID ${chosen.id} (Date: ${chosen.created_at})`);

    // Fetch detail & logs
    const details = await page.evaluate(async ({ tok, hId }) => {
      const d = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${hId}`, {
        headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
      }).then(r => r.json());

      const l = await fetch(`https://apiv2.gdesk.io/api/routing/mantis/feeds/history/${hId}/logs`, {
        headers: { token: tok, 'gd-branch-id': 'GD1LK8RC5OH0' }
      }).then(r => r.json());

      return { d, l };
    }, { tok: token, hId: chosen.id });

    fs.writeFileSync('reports/history_1643_detail.json', JSON.stringify(details.d, null, 2));
    fs.writeFileSync('reports/history_1643_logs.json', JSON.stringify(details.l, null, 2));

    console.log('\nTarget History Period:', details.d.data?.period);
    console.log('Target History Jobs count:', details.d.data?.jobs_count);
    console.log('Target History Schedules:', details.d.data?.schedules?.map(s => `${s.name} (${s.id})`));
    console.log('Target History Logs count:', details.l.data?.length);

    if (details.l.data && details.l.data.length > 0) {
      console.log('\nSample jobs in this history run:');
      details.l.data.slice(0, 8).forEach((item, i) => {
        console.log(` [${i+1}] Job #${item.item?.id} | Cust: ${item.customer?.full_name} (ID: ${item.customer?.id}) | Svc: ${item.item?.name} | Date: ${item.from?.start}`);
      });
    }
  }

  await browser.close();
}

findHistory1643().catch(console.error);
